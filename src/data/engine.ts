import { devices as seedDevices, runners, estimateDurationSec, executions as seedExecutions, type Execution, type ExecStatus, type Runner } from "./mock";

export interface BrowserTarget {
  id: string;
  browser: "Chrome" | "Firefox" | "Safari" | "Edge";
  version: string;
  os: "Windows" | "macOS" | "Linux";
}

export const browserTargets: BrowserTarget[] = [
  { id: "ch-win", browser: "Chrome", version: "124", os: "Windows" },
  { id: "ch-mac", browser: "Chrome", version: "124", os: "macOS" },
  { id: "ch-lin", browser: "Chrome", version: "124", os: "Linux" },
  { id: "ff-win", browser: "Firefox", version: "125", os: "Windows" },
  { id: "ff-lin", browser: "Firefox", version: "125", os: "Linux" },
  { id: "sa-mac", browser: "Safari", version: "17", os: "macOS" },
  { id: "ed-win", browser: "Edge", version: "124", os: "Windows" },
];

export type RunMode = "per-target" | "shard";

export interface TriggerOptions {
  runnerId: string;
  targetIds: string[];          // device ids OR browser target ids
  mode: RunMode;
  parallelism: number;
  testScope: "all" | "smoke";
  triggeredBy: string;
}

type Listener = () => void;

class ExecutionEngine {
  private store: Execution[] = [...seedExecutions];
  private listeners = new Set<Listener>();
  private nextBuild: Record<string, number> = {};

  constructor() {
    runners.forEach((r) => {
      const max = Math.max(0, ...this.store.filter((e) => e.runnerId === r.id).map((e) => e.buildNumber));
      this.nextBuild[r.id] = max + 1;
    });
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() { this.listeners.forEach((fn) => fn()); }

  list(): Execution[] {
    return [...this.store].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }
  forRunner(runnerId: string): Execution[] {
    return this.list().filter((e) => e.runnerId === runnerId);
  }

  estimate(opts: { runnerId: string; targets: number; mode: RunMode; parallelism: number; testScope: "all" | "smoke" }) {
    const runner = runners.find((r) => r.id === opts.runnerId);
    if (!runner) return { perTargetSec: 0, totalWallClockSec: 0 };
    const selectedTests = opts.testScope === "smoke" ? Math.ceil(runner.totalTests * 0.25) : runner.totalTests;
    const baseEachSec = estimateDurationSec(opts.runnerId, selectedTests, opts.parallelism);
    if (opts.mode === "shard" && opts.targets > 1) {
      const sharded = Math.round(baseEachSec / opts.targets);
      return { perTargetSec: sharded, totalWallClockSec: sharded };
    }
    // per-target: each runs full suite in parallel → wall clock = max of one (all parallel)
    return { perTargetSec: baseEachSec, totalWallClockSec: baseEachSec };
  }

  trigger(opts: TriggerOptions, targetLabels: Record<string, string>): Execution[] {
    const runner = runners.find((r) => r.id === opts.runnerId);
    if (!runner) return [];
    const created: Execution[] = [];
    const targets = opts.targetIds.length ? opts.targetIds : ["__default__"];
    const eta = this.estimate({
      runnerId: opts.runnerId,
      targets: targets.length,
      mode: opts.mode,
      parallelism: opts.parallelism,
      testScope: opts.testScope,
    });

    if (opts.mode === "shard") {
      // single execution
      const ex = this.makeExecution(runner, targets.map((t) => targetLabels[t] || t).join(" + "), opts.triggeredBy);
      created.push(ex);
      this.scheduleLifecycle(ex.id, eta.perTargetSec);
    } else {
      targets.forEach((tid) => {
        const ex = this.makeExecution(runner, targetLabels[tid] || tid, opts.triggeredBy);
        created.push(ex);
        this.scheduleLifecycle(ex.id, eta.perTargetSec);
      });
    }
    this.store.unshift(...created);
    this.emit();
    return created;
  }

  private makeExecution(runner: Runner, deviceLabel: string, triggeredBy: string): Execution {
    const build = this.nextBuild[runner.id]++;
    return {
      id: `ex-${Math.random().toString(36).slice(2, 8)}`,
      runnerId: runner.id,
      status: "queued",
      startedAt: new Date().toISOString(),
      durationSec: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      triggeredBy,
      device: deviceLabel === "__default__" ? undefined : deviceLabel,
      buildNumber: build,
    };
  }

  private patch(id: string, patch: Partial<Execution>) {
    const idx = this.store.findIndex((e) => e.id === id);
    if (idx === -1) return;
    this.store[idx] = { ...this.store[idx], ...patch };
    this.emit();
  }

  private scheduleLifecycle(id: string, totalSec: number) {
    // queued → running after 1.5s
    setTimeout(() => {
      this.patch(id, { status: "running", startedAt: new Date().toISOString() });
      // accelerated: 1 simulated sec = 40ms; cap visible time at 8s
      const visibleMs = Math.min(8000, Math.max(2500, totalSec * 40));
      const ticks = 6;
      const ex = this.store.find((e) => e.id === id);
      const runner = runners.find((r) => r.id === ex?.runnerId);
      const total = runner?.totalTests ?? 50;
      for (let i = 1; i <= ticks; i++) {
        setTimeout(() => {
          const passed = Math.floor((total * i) / ticks);
          this.patch(id, { passed, durationSec: Math.round((visibleMs / 1000) * (i / ticks)) });
        }, (visibleMs * i) / (ticks + 1));
      }
      setTimeout(() => {
        const finalFails = Math.random() < 0.18 ? Math.ceil(Math.random() * 4) : 0;
        const status: ExecStatus = finalFails > 0 ? "failed" : "passed";
        this.patch(id, {
          status,
          passed: total - finalFails,
          failed: finalFails,
          skipped: 0,
          durationSec: Math.round(visibleMs / 1000),
        });
      }, visibleMs);
    }, 1500);
  }
}

export const engine = new ExecutionEngine();

export function useExecutions() {
  // simple subscription hook
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSyncExternalStore } = require("react");
  return useSyncExternalStore(
    (cb: Listener) => engine.subscribe(cb),
    () => engine.list(),
    () => engine.list(),
  );
}

export const devices = seedDevices;
