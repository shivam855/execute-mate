import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function MetricTile({
  label,
  value,
  hint,
  Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  Icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
}) {
  const toneCls = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
  }[tone];
  return (
    <div className="rounded-xl border border-border surface-elevated p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", toneCls)} />
      </div>
      <div className={cn("mt-3 font-mono text-3xl font-bold", toneCls)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
