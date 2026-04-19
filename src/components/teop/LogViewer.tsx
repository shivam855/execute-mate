import type { LogLine } from "@/data/mock";
import { cn } from "@/lib/utils";

const levelCls: Record<LogLine["level"], string> = {
  INFO: "text-info",
  WARN: "text-warning",
  ERROR: "text-destructive",
  DEBUG: "text-muted-foreground",
};

export function LogViewer({ lines }: { lines: LogLine[] }) {
  return (
    <div className="scrollbar-thin max-h-[480px] overflow-auto rounded-lg border border-border bg-[hsl(222_40%_5%)] p-4 font-mono text-xs leading-relaxed">
      {lines.map((l, i) => (
        <div key={i} className="flex gap-3 hover:bg-surface-hover/40">
          <span className="select-none text-muted-foreground/60">{String(i + 1).padStart(3, "0")}</span>
          <span className="text-muted-foreground">{l.ts}</span>
          <span className={cn("w-12 font-bold", levelCls[l.level])}>{l.level}</span>
          <span className="flex-1 whitespace-pre-wrap break-all text-foreground/90">{l.msg}</span>
        </div>
      ))}
    </div>
  );
}
