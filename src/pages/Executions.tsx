import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/teop/AppHeader";
import { ExecutionRow } from "@/components/teop/ExecutionRow";
import { useExecutionsStore } from "@/hooks/use-executions";
import { runners } from "@/data/mock";
import { Activity } from "lucide-react";

const FILTERS = ["all", "running", "queued", "passed", "failed"] as const;

const Executions = () => {
  const all = useExecutionsStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? all : all.filter((e) => e.status === filter)).slice(0, 80),
    [all, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { running: 0, queued: 0, passed: 0, failed: 0 };
    all.forEach((e) => { if (c[e.status] !== undefined) c[e.status]++; });
    return c;
  }, [all]);

  const runnerName = (id: string) => runners.find((r) => r.id === id)?.name ?? id;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8">
        <div className="mb-6 flex items-center gap-3">
          <Activity className="h-5 w-5 text-info" />
          <h1 className="text-3xl font-bold tracking-tight">Live Executions</h1>
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            {counts.running} running · {counts.queued} queued
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border surface-elevated text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              {f !== "all" && counts[f] !== undefined && (
                <span className="ml-1.5 font-mono opacity-70">{counts[f]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border surface-elevated">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No executions match this filter.</div>
          ) : (
            filtered.map((ex) => (
              <Link key={ex.id} to={`/runners/${ex.runnerId}`} className="block">
                <div className="flex items-center gap-3 border-b border-border px-4 py-1 text-xs text-muted-foreground">
                  <span className="font-mono">{runnerName(ex.runnerId)}</span>
                </div>
                <ExecutionRow ex={ex} />
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Executions;
