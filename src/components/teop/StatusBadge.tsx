import { cn } from "@/lib/utils";
import type { ExecStatus } from "@/data/mock";
import { CheckCircle2, XCircle, Loader2, Clock, Ban } from "lucide-react";

const map: Record<ExecStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  passed: { label: "Passed", cls: "bg-success/15 text-success border-success/30", Icon: CheckCircle2 },
  failed: { label: "Failed", cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: XCircle },
  running: { label: "Running", cls: "bg-info/15 text-info border-info/30", Icon: Loader2 },
  queued: { label: "Queued", cls: "bg-warning/15 text-warning border-warning/30", Icon: Clock },
  aborted: { label: "Aborted", cls: "bg-muted text-muted-foreground border-border", Icon: Ban },
};

export function StatusBadge({ status, className }: { status: ExecStatus; className?: string }) {
  const { label, cls, Icon } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium font-mono",
        cls,
        className,
      )}
    >
      <Icon className={cn("h-3 w-3", status === "running" && "animate-spin")} />
      {label}
    </span>
  );
}
