import { useMemo } from "react";
import { runners, executions } from "@/data/mock";
import { AppHeader } from "@/components/teop/AppHeader";
import { RunnerCard } from "@/components/teop/RunnerCard";
import { MetricTile } from "@/components/teop/MetricTile";
import { Activity, CheckCircle2, XCircle, Timer } from "lucide-react";
import { formatDuration } from "@/lib/format";

const Dashboard = () => {
  const stats = useMemo(() => {
    const running = executions.filter((e) => e.status === "running").length;
    const last24 = executions.filter((e) => Date.now() - new Date(e.startedAt).getTime() < 86_400_000);
    const passed = last24.filter((e) => e.status === "passed").length;
    const failed = last24.filter((e) => e.status === "failed").length;
    const avg = last24.length
      ? Math.round(last24.reduce((s, e) => s + e.durationSec, 0) / last24.length)
      : 0;
    return { running, passed, failed, avg };
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Runner Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Centralized view of every Selenium, Appium and TestNG runner across the org.
          </p>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricTile label="Running now" value={stats.running} Icon={Activity} tone="info" hint="Active builds" />
          <MetricTile label="Passed · 24h" value={stats.passed} Icon={CheckCircle2} tone="success" />
          <MetricTile label="Failed · 24h" value={stats.failed} Icon={XCircle} tone={stats.failed ? "destructive" : "default"} />
          <MetricTile label="Avg duration" value={formatDuration(stats.avg)} Icon={Timer} hint="Last 24h" />
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Runners</h2>
            <span className="font-mono text-xs text-muted-foreground">{runners.length} total</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {runners.map((r) => (
              <RunnerCard key={r.id} runner={r} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
