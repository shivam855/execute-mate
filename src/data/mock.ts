export type RunnerType = "selenium" | "appium" | "testng";
export type ExecStatus = "passed" | "failed" | "running" | "queued" | "aborted";

export interface Runner {
  id: string;
  name: string;
  type: RunnerType;
  jenkinsJob: string;
  description: string;
  totalTests: number;
  lastStatus: ExecStatus;
  lastDurationSec: number;
  successRate: number; // 0..1
  failuresLast7d: number;
}

export interface Execution {
  id: string;
  runnerId: string;
  status: ExecStatus;
  startedAt: string; // ISO
  durationSec: number;
  passed: number;
  failed: number;
  skipped: number;
  triggeredBy: string;
  device?: string;
  buildNumber: number;
}

export interface LogLine {
  ts: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  msg: string;
}

export interface Device {
  id: string;
  name: string;
  os: string;
  version: string;
  available: boolean;
  provider: "saucelabs";
}

const now = Date.now();
const iso = (offsetMin: number) => new Date(now - offsetMin * 60_000).toISOString();

export const runners: Runner[] = [
  {
    id: "rnr-web-checkout",
    name: "Web · Checkout E2E",
    type: "selenium",
    jenkinsJob: "qa/web-checkout-e2e",
    description: "Critical-path Selenium suite covering cart, payment, and order confirmation flows.",
    totalTests: 142,
    lastStatus: "passed",
    lastDurationSec: 612,
    successRate: 0.94,
    failuresLast7d: 3,
  },
  {
    id: "rnr-mobile-ios",
    name: "Mobile · iOS Smoke",
    type: "appium",
    jenkinsJob: "qa/mobile-ios-smoke",
    description: "Appium smoke pack on SauceLabs iOS device cloud.",
    totalTests: 48,
    lastStatus: "failed",
    lastDurationSec: 384,
    successRate: 0.82,
    failuresLast7d: 7,
  },
  {
    id: "rnr-api-regression",
    name: "API · Regression",
    type: "testng",
    jenkinsJob: "qa/api-regression",
    description: "TestNG-based REST regression suite with 8-way parallelism.",
    totalTests: 1240,
    lastStatus: "running",
    lastDurationSec: 0,
    successRate: 0.97,
    failuresLast7d: 12,
  },
  {
    id: "rnr-mobile-android",
    name: "Mobile · Android Full",
    type: "appium",
    jenkinsJob: "qa/mobile-android-full",
    description: "Full Appium regression on Pixel & Galaxy device matrix.",
    totalTests: 312,
    lastStatus: "passed",
    lastDurationSec: 1820,
    successRate: 0.88,
    failuresLast7d: 5,
  },
  {
    id: "rnr-web-search",
    name: "Web · Search & Discovery",
    type: "selenium",
    jenkinsJob: "qa/web-search",
    description: "Selenium suite for search, filtering, and PDP rendering.",
    totalTests: 86,
    lastStatus: "aborted",
    lastDurationSec: 122,
    successRate: 0.9,
    failuresLast7d: 2,
  },
  {
    id: "rnr-contracts",
    name: "API · Contract Tests",
    type: "testng",
    jenkinsJob: "qa/api-contracts",
    description: "Pact-based contract verification across 22 services.",
    totalTests: 220,
    lastStatus: "passed",
    lastDurationSec: 96,
    successRate: 0.99,
    failuresLast7d: 0,
  },
];

export const executions: Execution[] = [
  // checkout
  { id: "ex-1001", runnerId: "rnr-web-checkout", status: "passed", startedAt: iso(35), durationSec: 612, passed: 140, failed: 0, skipped: 2, triggeredBy: "scheduler", buildNumber: 884 },
  { id: "ex-1000", runnerId: "rnr-web-checkout", status: "failed", startedAt: iso(180), durationSec: 588, passed: 137, failed: 3, skipped: 2, triggeredBy: "p.kumar", buildNumber: 883 },
  { id: "ex-0999", runnerId: "rnr-web-checkout", status: "passed", startedAt: iso(420), durationSec: 601, passed: 142, failed: 0, skipped: 0, triggeredBy: "scheduler", buildNumber: 882 },
  { id: "ex-0998", runnerId: "rnr-web-checkout", status: "passed", startedAt: iso(720), durationSec: 595, passed: 141, failed: 0, skipped: 1, triggeredBy: "scheduler", buildNumber: 881 },
  // ios
  { id: "ex-2003", runnerId: "rnr-mobile-ios", status: "failed", startedAt: iso(22), durationSec: 384, passed: 41, failed: 5, skipped: 2, triggeredBy: "ci", device: "iPhone 15 Pro · iOS 17.4", buildNumber: 412 },
  { id: "ex-2002", runnerId: "rnr-mobile-ios", status: "passed", startedAt: iso(160), durationSec: 372, passed: 47, failed: 0, skipped: 1, triggeredBy: "ci", device: "iPhone 14 · iOS 17.2", buildNumber: 411 },
  { id: "ex-2001", runnerId: "rnr-mobile-ios", status: "failed", startedAt: iso(300), durationSec: 401, passed: 44, failed: 3, skipped: 1, triggeredBy: "a.shah", device: "iPhone 15 · iOS 17.3", buildNumber: 410 },
  // api regression
  { id: "ex-3010", runnerId: "rnr-api-regression", status: "running", startedAt: iso(4), durationSec: 0, passed: 612, failed: 2, skipped: 0, triggeredBy: "scheduler", buildNumber: 2210 },
  { id: "ex-3009", runnerId: "rnr-api-regression", status: "passed", startedAt: iso(120), durationSec: 1180, passed: 1238, failed: 0, skipped: 2, triggeredBy: "scheduler", buildNumber: 2209 },
  { id: "ex-3008", runnerId: "rnr-api-regression", status: "passed", startedAt: iso(240), durationSec: 1205, passed: 1239, failed: 1, skipped: 0, triggeredBy: "scheduler", buildNumber: 2208 },
  // android
  { id: "ex-4002", runnerId: "rnr-mobile-android", status: "passed", startedAt: iso(60), durationSec: 1820, passed: 308, failed: 2, skipped: 2, triggeredBy: "ci", device: "Pixel 8 · Android 14", buildNumber: 199 },
  { id: "ex-4001", runnerId: "rnr-mobile-android", status: "failed", startedAt: iso(600), durationSec: 1750, passed: 290, failed: 18, skipped: 4, triggeredBy: "ci", device: "Galaxy S23 · Android 14", buildNumber: 198 },
  // search
  { id: "ex-5002", runnerId: "rnr-web-search", status: "aborted", startedAt: iso(45), durationSec: 122, passed: 12, failed: 0, skipped: 74, triggeredBy: "j.lee", buildNumber: 301 },
  { id: "ex-5001", runnerId: "rnr-web-search", status: "passed", startedAt: iso(360), durationSec: 510, passed: 86, failed: 0, skipped: 0, triggeredBy: "scheduler", buildNumber: 300 },
  // contracts
  { id: "ex-6002", runnerId: "rnr-contracts", status: "passed", startedAt: iso(15), durationSec: 96, passed: 220, failed: 0, skipped: 0, triggeredBy: "ci", buildNumber: 1188 },
  { id: "ex-6001", runnerId: "rnr-contracts", status: "passed", startedAt: iso(180), durationSec: 102, passed: 220, failed: 0, skipped: 0, triggeredBy: "ci", buildNumber: 1187 },
];

export const sampleLogs: LogLine[] = [
  { ts: "00:00:00.012", level: "INFO", msg: "Starting test suite · 142 tests discovered" },
  { ts: "00:00:00.184", level: "INFO", msg: "Connecting to grid hub https://hub.lovable-grid.io:4444" },
  { ts: "00:00:01.902", level: "INFO", msg: "Session created · chrome 124.0 · linux" },
  { ts: "00:00:02.110", level: "DEBUG", msg: "Capabilities: { browserName: 'chrome', platformName: 'linux' }" },
  { ts: "00:00:04.402", level: "INFO", msg: "▶ CheckoutFlow.shouldAddItemToCart" },
  { ts: "00:00:07.801", level: "INFO", msg: "✓ CheckoutFlow.shouldAddItemToCart (3.4s)" },
  { ts: "00:00:08.012", level: "INFO", msg: "▶ CheckoutFlow.shouldApplyPromoCode" },
  { ts: "00:00:11.450", level: "WARN", msg: "Element not interactable on first attempt, retrying…" },
  { ts: "00:00:12.781", level: "INFO", msg: "✓ CheckoutFlow.shouldApplyPromoCode (4.8s)" },
  { ts: "00:00:13.001", level: "INFO", msg: "▶ CheckoutFlow.shouldFailOnExpiredCard" },
  { ts: "00:00:18.220", level: "ERROR", msg: "AssertionError: expected 'Payment declined' but got 'Try again later'" },
  { ts: "00:00:18.221", level: "ERROR", msg: "  at CheckoutFlow.java:142" },
  { ts: "00:00:18.302", level: "INFO", msg: "Capturing screenshot → s3://teop-artifacts/ex-1000/declined.png" },
  { ts: "00:00:18.881", level: "INFO", msg: "✗ CheckoutFlow.shouldFailOnExpiredCard (5.8s)" },
  { ts: "00:10:11.402", level: "INFO", msg: "Suite finished · 140 passed · 0 failed · 2 skipped" },
];

export const devices: Device[] = [
  { id: "d-iph15p", name: "iPhone 15 Pro", os: "iOS", version: "17.4", available: true, provider: "saucelabs" },
  { id: "d-iph14", name: "iPhone 14", os: "iOS", version: "17.2", available: true, provider: "saucelabs" },
  { id: "d-pix8", name: "Pixel 8", os: "Android", version: "14", available: false, provider: "saucelabs" },
  { id: "d-gs23", name: "Galaxy S23", os: "Android", version: "14", available: true, provider: "saucelabs" },
];

// Time estimation: avg(last N) * (selectedTests/totalTests) / parallelism
export function estimateDurationSec(runnerId: string, selectedTests?: number, parallelism = 1, n = 5): number {
  const runner = runners.find((r) => r.id === runnerId);
  if (!runner) return 0;
  const recent = executions
    .filter((e) => e.runnerId === runnerId && e.status !== "running" && e.status !== "queued")
    .slice(0, n);
  if (recent.length === 0) return runner.lastDurationSec;
  const avg = recent.reduce((s, e) => s + e.durationSec, 0) / recent.length;
  const ratio = selectedTests ? selectedTests / runner.totalTests : 1;
  return Math.round((avg * ratio) / Math.max(1, parallelism));
}
