# TEOP — Test Execution Orchestration Platform
## Architecture & Implementation Spec (Spring Boot + React)

> Hand-off document for the Java/Spring Boot team. The current Lovable repo
> contains the **React UI** (read-only dashboard with mock data). This document
> covers Steps 1–7 of the spec: requirements, architecture, schema, API
> contracts, Jenkins/SauceLabs integration, and the time-estimation engine.

---

## STEP 1 — Requirements

### Functional
| # | Requirement |
|---|---|
| F1 | List all runners (Selenium / Appium / TestNG) with last status, success rate, failures (7d). |
| F2 | View runner detail: full execution history, logs, artifacts, duration trend. |
| F3 | Trigger a runner on demand; choose device (mobile) and parallelism. |
| F4 | Show ETA for any planned run using historical data. |
| F5 | Stream live status + console output for in-flight runs. |
| F6 | Browse artifacts: HTML report, JUnit XML, screenshots, session video. |
| F7 | Map each runner to one Jenkins job; map each mobile execution to one SauceLabs device. |

### Non-functional
- p95 dashboard load **< 800 ms** with 500 runners / 100k executions.
- Jenkins poll lag **≤ 10 s**; live log lag **≤ 2 s** via WS.
- Horizontal scale: stateless API behind LB; one scheduler leader (ShedLock).
- Auth-ready (RBAC: `admin`, `runner`, `viewer`) — out of scope for v1.

### Edge cases
- Jenkins unreachable → mark execution `UNKNOWN`, retry with exp. backoff (max 5).
- SauceLabs returns no available device → queue execution, surface in UI.
- Long-running job (> 2× ETA) → flag as `STALLED`.
- Parallel triggers on same runner → allow but cap concurrency per runner (config).
- Partial test failures → execution = `FAILED` if any failed > 0, but artifacts still ingested.
- Flaky test → same test fails+passes within N runs → flag (Step 12).

---

## STEP 2 — High-level architecture

```
┌──────────────┐    HTTPS/WS    ┌────────────────────────────┐
│  React UI    │ ─────────────▶ │  Spring Boot API (stateless)│
│ (this repo)  │ ◀───────────── │  REST + WebSocket           │
└──────────────┘                └──────┬───────────┬──────────┘
                                       │           │
                       ┌───────────────┘           └──────────────┐
                       ▼                                          ▼
              ┌────────────────┐                        ┌────────────────────┐
              │ PostgreSQL 15  │                        │  Scheduler (Quartz │
              │  + indexes     │                        │   + ShedLock)      │
              └────────────────┘                        └─────────┬──────────┘
                       ▲                                          │
                       │ writes                                   │ poll every 10s
                       │                                          ▼
                       │                              ┌────────────────────────┐
                       └──────────────────────────────│ Jenkins REST API       │
                                                      │ SauceLabs REST API     │
                                                      │ S3 (artifacts)         │
                                                      └────────────────────────┘
```

Layers: `web` (controllers + WS) → `service` (orchestration, estimation) →
`integration` (jenkins/, saucelabs/, s3/ clients) → `repository` (Spring Data JPA).

---

## STEP 3 — Database schema (PostgreSQL)

```sql
CREATE TYPE runner_type AS ENUM ('SELENIUM', 'APPIUM', 'TESTNG');
CREATE TYPE exec_status AS ENUM ('QUEUED','RUNNING','PASSED','FAILED','ABORTED','UNKNOWN');

CREATE TABLE runners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          runner_type NOT NULL,
  jenkins_job   TEXT NOT NULL UNIQUE,
  description   TEXT,
  total_tests   INT  NOT NULL DEFAULT 0,
  max_parallel  INT  NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id           TEXT PRIMARY KEY,         -- saucelabs device id
  name         TEXT NOT NULL,
  os           TEXT NOT NULL,
  os_version   TEXT NOT NULL,
  available    BOOLEAN NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id       UUID NOT NULL REFERENCES runners(id) ON DELETE CASCADE,
  jenkins_build   INT,
  status          exec_status NOT NULL,
  triggered_by    TEXT NOT NULL,
  device_id       TEXT REFERENCES devices(id),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  duration_sec    INT,
  passed          INT NOT NULL DEFAULT 0,
  failed          INT NOT NULL DEFAULT 0,
  skipped         INT NOT NULL DEFAULT 0,
  artifacts_url   TEXT,                  -- S3 prefix
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exec_runner_started ON executions(runner_id, started_at DESC);
CREATE INDEX idx_exec_status         ON executions(status) WHERE status IN ('QUEUED','RUNNING');

CREATE TABLE execution_logs (
  id            BIGSERIAL PRIMARY KEY,
  execution_id  UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
  ts            TIMESTAMPTZ NOT NULL,
  level         TEXT NOT NULL,
  message       TEXT NOT NULL
);
CREATE INDEX idx_logs_exec_ts ON execution_logs(execution_id, ts);

CREATE TABLE job_config (
  runner_id     UUID PRIMARY KEY REFERENCES runners(id) ON DELETE CASCADE,
  default_parallelism INT NOT NULL DEFAULT 1,
  default_params      JSONB NOT NULL DEFAULT '{}'::jsonb,
  retry_on_failure    BOOLEAN NOT NULL DEFAULT false,
  max_retries         INT NOT NULL DEFAULT 0
);
```

---

## STEP 4 — REST API contract

Base: `/api/v1` · JSON · auth: `Authorization: Bearer <jwt>` (v2).

### Runners
```
GET  /runners                 → 200  Runner[]
GET  /runners/{id}            → 200  RunnerDetail | 404
POST /runners/{id}/execute    → 202  { executionId }
                                400  invalid params
                                409  concurrency cap reached
                                503  jenkins unreachable
```
Body for execute:
```json
{ "deviceId": "iph15p", "parallelism": 4, "tests": ["CheckoutFlow.*"], "params": {} }
```

### Executions
```
GET  /executions/{id}         → 200  Execution
GET  /executions/{id}/logs    → 200  LogLine[]   ?since=<seq>&limit=500
WS   /ws/executions/{id}      → push status + log lines (NDJSON over STOMP)
```

### Devices
```
GET  /devices                 → 200  Device[]   ?available=true
```

### Estimation
```
GET  /runners/{id}/eta        → 200  { etaSec, basis: "avg5", parallelism }
                                ?selectedTests=NN&parallelism=4
```

Error envelope:
```json
{ "error": { "code": "JENKINS_UNREACHABLE", "message": "...", "traceId": "..." } }
```

---

## STEP 5 — Jenkins integration

Use Jenkins REST API (`/job/{name}/...`) with API token auth.

```java
public interface JenkinsClient {
    int triggerBuild(String job, Map<String,String> params);     // POST buildWithParameters
    BuildStatus getStatus(String job, int buildNumber);          // GET /job/{job}/{n}/api/json
    Stream<String> tailConsole(String job, int buildNumber, long offset); // /logText/progressiveText
}
```

Mapping: `runners.jenkins_job` → Jenkins job path.
Polling: `JenkinsPollScheduler` runs every 10s, fetches all `RUNNING/QUEUED`
executions, updates status + duration + counts. Console log is appended via
`/logText/progressiveText?start={offset}` and pushed to WS subscribers.

Retry: `@Retryable(maxAttempts=5, backoff=@Backoff(delay=2000, multiplier=2))`.

---

## STEP 6 — SauceLabs integration

```java
public interface SauceLabsClient {
    List<Device> listDevices();                      // GET /v1/rdc/devices
    DeviceDescriptor reserve(String deviceId);       // optional
    SessionInfo getSession(String sessionId);        // GET /v1/rdc/jobs/{id}
    URI screenshotUrl(String sessionId, int n);
    URI videoUrl(String sessionId);
}
```

Refresh `devices` table every 60s. On execute:
1. Validate `deviceId` is in `devices` and `available = true`.
2. Pass `sauce.deviceId` as Jenkins build parameter.
3. After build completes, fetch session id from JUnit XML / artifact, then
   pull video + screenshot URLs and persist on `executions.artifacts_url`.

---

## STEP 7 — Time estimation engine (deterministic, no LLM)

```
estimatedSec = avg(duration of last N completed runs of runner)
             × (selectedTests / totalTests)
             ÷ max(1, parallelism)
```

- `N = 5` by default, configurable per runner.
- Exclude `RUNNING`, `QUEUED`, `ABORTED` from the average.
- If `selectedTests` omitted → ratio = 1.
- Optional weighting (recent runs count more):
  ```
  weights = [0.35, 0.25, 0.18, 0.13, 0.09]   (sum = 1)
  avg = Σ wᵢ · durationᵢ
  ```
- Cold-start (no history) → fall back to `runners.last_duration_sec` or a
  configured default (e.g. 600s).

Reference Java:
```java
public int estimate(UUID runnerId, Integer selectedTests, int parallelism) {
    var recent = execRepo.findTop5ByRunnerIdAndStatusInOrderByStartedAtDesc(
        runnerId, List.of(PASSED, FAILED));
    if (recent.isEmpty()) return runnerRepo.findById(runnerId).orElseThrow().getLastDurationSec();
    double avg = recent.stream().mapToInt(Execution::getDurationSec).average().orElse(0);
    double ratio = selectedTests == null ? 1.0
                 : (double) selectedTests / runnerRepo.totalTests(runnerId);
    return (int) Math.round(avg * ratio / Math.max(1, parallelism));
}
```

---

## Steps 8–12 (summary)

- **8 Backend impl**: `controller / service / repository / integration` packages,
  Flyway migrations, MapStruct DTOs, Quartz + ShedLock for the poller, async
  trigger via `@Async` + `CompletableFuture`.
- **9 Frontend**: React UI in this repo — Dashboard + Runner Detail are live;
  Execution Modal + device picker are next.
- **10 Realtime**: STOMP over WebSocket, topic `/topic/executions/{id}`;
  fallback to 3s polling.
- **11 Edge cases**: covered in Step 1; implement via `@Retryable`,
  `STALLED` detection job, dead-letter table.
- **12 Enhancements**: flaky-test detection (failure↔pass within N runs of same
  test name), failure-trend chart (already wired in UI), RBAC via Spring
  Security + JWT, notifications via outbox + Slack/Email workers.
