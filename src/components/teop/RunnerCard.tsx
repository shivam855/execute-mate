import { Link } from "react-router-dom";
import { ArrowUpRight, Globe, Smartphone, Server, Play } from "lucide-react";
import type { Runner } from "@/data/mock";
import { StatusBadge } from "./StatusBadge";
import { formatDuration } from "@/lib/format";
import { Button } from "@/components/ui/button";

const typeIcon = { selenium: Globe, appium: Smartphone, testng: Server };
const typeLabel = { selenium: "Selenium", appium: "Appium", testng: "TestNG" };

export function RunnerCard({ runner, onRun }: { runner: Runner; onRun?: (r: Runner) => void }) {
  const Icon = typeIcon[runner.type];
  const successPct = Math.round(runner.successRate * 100);
  return (
    <div className="group relative flex flex-col gap-4 rounded-xl border border-border surface-elevated p-5 transition-all hover:border-primary/40 hover:shadow-card">
      <Link to={`/runners/${runner.id}`} className="absolute inset-0 rounded-xl" aria-label={`Open ${runner.name}`} />

      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border surface">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{runner.name}</h3>
            <p className="font-mono text-xs text-muted-foreground">{typeLabel[runner.type]} · {runner.totalTests} tests</p>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <p className="relative text-sm text-muted-foreground line-clamp-2">{runner.description}</p>

      <div className="relative mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
        <StatusBadge status={runner.lastStatus} />
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="text-right">
            <div className="text-muted-foreground">Success</div>
            <div className={successPct >= 95 ? "text-success" : successPct >= 85 ? "text-warning" : "text-destructive"}>
              {successPct}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">Last</div>
            <div>{runner.lastDurationSec ? formatDuration(runner.lastDurationSec) : "—"}</div>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRun?.(runner); }}
        className="relative gap-1.5"
      >
        <Play className="h-3.5 w-3.5" /> Run
      </Button>
    </div>
  );
}
