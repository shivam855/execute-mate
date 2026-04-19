import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Download, FileText, Image as ImageIcon, Video } from "lucide-react";
import { runners, executions, sampleLogs, estimateDurationSec } from "@/data/mock";
import { AppHeader } from "@/components/teop/AppHeader";
import { StatusBadge } from "@/components/teop/StatusBadge";
import { ExecutionRow } from "@/components/teop/ExecutionRow";
import { LogViewer } from "@/components/teop/LogViewer";
import { MetricTile } from "@/components/teop/MetricTile";
import { formatDuration } from "@/lib/format";
import { Activity, Timer, Target, Gauge } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const RunnerDetail = () => {
  const { id = "" } = useParams();
  const runner = runners.find((r) => r.id === id);
  const allExec = useExecutionsStore();
  const runnerExecutions = useMemo(
    () => allExec.filter((e) => e.runnerId === id).sort((a, b) => b.buildNumber - a.buildNumber),
    [allExec, id],
  );
  const [selected, setSelected] = useState<string | undefined>(runnerExecutions[0]?.id);
  const [open, setOpen] = useState(false);
  const eta = useMemo(() => (runner ? estimateDurationSec(runner.id) : 0), [runner]);

  if (!runner) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground">Runner not found.</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">← Back to dashboard</Link>
        </main>
      </div>
    );
  }

  const chartData = [...runnerExecutions]
    .reverse()
    .map((e) => ({ build: `#${e.buildNumber}`, duration: e.durationSec, fails: e.failed }));

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All runners
        </Link>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{runner.name}</h1>
              <StatusBadge status={runner.lastStatus} />
            </div>
            <p className="text-sm text-muted-foreground">{runner.description}</p>
            <a
              href="#"
              className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-info hover:underline"
              onClick={(e) => e.preventDefault()}
            >
              <ExternalLink className="h-3 w-3" /> jenkins://{runner.jenkinsJob}
            </a>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricTile label="Total tests" value={runner.totalTests} Icon={Target} />
          <MetricTile
            label="Success rate"
            value={`${Math.round(runner.successRate * 100)}%`}
            Icon={Gauge}
            tone={runner.successRate >= 0.95 ? "success" : runner.successRate >= 0.85 ? "warning" : "destructive"}
          />
          <MetricTile label="Last duration" value={formatDuration(runner.lastDurationSec)} Icon={Timer} />
          <MetricTile label="Estimated next" value={formatDuration(eta)} Icon={Activity} tone="info" hint="Avg of last 5 runs" />
        </section>

        <section className="mb-8 rounded-xl border border-border surface-elevated p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Duration trend</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="build" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="duration" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-xl border border-border surface-elevated">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Execution history</h2>
            </div>
            <div className="scrollbar-thin max-h-[480px] overflow-auto">
              {runnerExecutions.map((ex) => (
                <ExecutionRow
                  key={ex.id}
                  ex={ex}
                  active={selected === ex.id}
                  onSelect={() => setSelected(ex.id)}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border surface-elevated p-4">
              <h2 className="mb-3 text-sm font-semibold">Artifacts</h2>
              <ul className="space-y-2 text-sm">
                {[
                  { Icon: FileText, name: "report.html", size: "184 KB" },
                  { Icon: FileText, name: "junit.xml", size: "42 KB" },
                  { Icon: ImageIcon, name: "screenshots/ (12)", size: "3.2 MB" },
                  { Icon: Video, name: "session.mp4", size: "18 MB" },
                ].map(({ Icon, name, size }) => (
                  <li
                    key={name}
                    className="flex items-center justify-between rounded-md border border-border surface px-3 py-2"
                  >
                    <span className="flex items-center gap-2 font-mono text-xs">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {name}
                    </span>
                    <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                      {size}
                      <Download className="h-3 w-3" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-border surface-elevated">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Console output</h2>
            <span className="font-mono text-xs text-muted-foreground">build #{runnerExecutions.find((e) => e.id === selected)?.buildNumber}</span>
          </div>
          <div className="p-4">
            <LogViewer lines={sampleLogs} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default RunnerDetail;
