import type { Execution } from "@/data/mock";
import { StatusBadge } from "./StatusBadge";
import { formatDuration, relativeTime } from "@/lib/format";
import { Hash, User, Smartphone } from "lucide-react";

export function ExecutionRow({ ex, onSelect, active }: { ex: Execution; onSelect?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
        active ? "bg-surface-hover" : ""
      }`}
    >
      <StatusBadge status={ex.status} className="w-24 justify-center" />
      <div className="flex flex-1 items-center gap-2 font-mono text-xs text-muted-foreground">
        <Hash className="h-3 w-3" />#{ex.buildNumber}
      </div>
      <div className="hidden flex-1 items-center gap-2 text-xs text-muted-foreground md:flex">
        <User className="h-3 w-3" />
        <span className="font-mono">{ex.triggeredBy}</span>
      </div>
      {ex.device && (
        <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
          <Smartphone className="h-3 w-3" />
          <span className="font-mono">{ex.device}</span>
        </div>
      )}
      <div className="font-mono text-xs">
        <span className="text-success">{ex.passed}</span>
        <span className="text-muted-foreground"> / </span>
        <span className="text-destructive">{ex.failed}</span>
        <span className="text-muted-foreground"> / </span>
        <span className="text-warning">{ex.skipped}</span>
      </div>
      <div className="w-16 text-right font-mono text-xs text-muted-foreground">
        {ex.durationSec ? formatDuration(ex.durationSec) : "—"}
      </div>
      <div className="w-20 text-right font-mono text-xs text-muted-foreground">{relativeTime(ex.startedAt)}</div>
    </button>
  );
}
