import { Link } from "react-router-dom";
import { ArrowUpRight, Globe, Smartphone, Server } from "lucide-react";
import type { Runner } from "@/data/mock";
import { StatusBadge } from "./StatusBadge";
import { formatDuration } from "@/lib/format";

const typeIcon = { selenium: Globe, appium: Smartphone, testng: Server };
const typeLabel = { selenium: "Selenium", appium: "Appium", testng: "TestNG" };

export function RunnerCard({ runner }: { runner: Runner }) {
  const Icon = typeIcon[runner.type];
  const successPct = Math.round(runner.successRate * 100);
  return (
    <Link
      to={`/runners/${runner.id}`}
      className="group relative flex flex-col gap-4 rounded-xl border border-border surface-elevated p-5 transition-all hover:border-primary/40 hover:shadow-card"
    >
      <div className="flex items-start justify-between">
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

      <p className="text-sm text-muted-foreground line-clamp-2">{runner.description}</p>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <StatusBadge status={runner.lastStatus} />
        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="text-right">
            <div className="text-muted-foreground">Duration</div>
            <div className="text-foreground">{runner.lastDurationSec ? formatDuration(runner.lastDurationSec) : "—"}</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">Success</div>
            <div className={successPct >= 95 ? "text-success" : successPct >= 85 ? "text-warning" : "text-destructive"}>
              {successPct}%
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">Fails 7d</div>
            <div className="text-foreground">{runner.failuresLast7d}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
