import { useMemo, useState } from "react";
import { runners } from "@/data/mock";
import { useExecutionsStore } from "@/hooks/use-executions";
import { AppHeader } from "@/components/teop/AppHeader";
import { RunnerCard } from "@/components/teop/RunnerCard";
import { MetricTile } from "@/components/teop/MetricTile";
import { ExecuteModal } from "@/components/teop/ExecuteModal";
import { Activity, CheckCircle2, XCircle, Timer } from "lucide-react";
import { formatDuration } from "@/lib/format";
import type { Runner } from "@/data/mock";

const Dashboard = () => {
  const allExecutions = useExecutionsStore();
  const [active, setActive] = useState<Runner | null>(null);
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const running = allExecutions.filter((e) => e.status === "running" || e.status === "queued").length;
    const last24 = allExecutions.filter((e) => Date.now() - new Date(e.startedAt).getTime() < 86_400_000);
    const passed = last24.filter((e) => e.status === "passed").length;
    const failed = last24.filter((e) => e.status === "failed").length;
    const completed = last24.filter((e) => e.durationSec > 0);
    const avg = completed.length ? Math.round(completed.reduce((s, e) => s + e.durationSec, 0) / completed.length) : 0;
    return { running, passed, failed, avg };
  }, [allExecutions]);

  const handleRun = (r: Runner) => {
    setActive(r);
    setOpen(true);
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Runner Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trigger any runner on demand across multiple devices or browsers. Live status flows into the executions feed.
          </p>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricTile label="Active" value={stats.running} Icon={Activity} tone="info" hint="Running + queued" />
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
              <RunnerCard key={r.id} runner={r} onRun={handleRun} />
            ))}
          </div>
        </section>
      </main>

      <ExecuteModal runner={active} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default Dashboard;
