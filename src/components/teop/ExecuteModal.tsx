import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Smartphone, Globe, Check, Zap, Layers, Play, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { devices } from "@/data/mock";
import { browserTargets, engine, type RunMode } from "@/data/engine";
import type { Runner } from "@/data/mock";
import { formatDuration } from "@/lib/format";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  runner: Runner | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ExecuteModal({ runner, open, onOpenChange }: Props) {
  const isMobile = runner?.type === "appium";
  const isWeb = runner?.type === "selenium";
  const isApi = runner?.type === "testng";
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<RunMode>("per-target");
  const [parallelism, setParallelism] = useState(1);
  const [scope, setScope] = useState<"all" | "smoke">("all");

  const targetLabels = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => (map[d.id] = `${d.name} · ${d.os} ${d.version}`));
    browserTargets.forEach((b) => (map[b.id] = `${b.browser} ${b.version} · ${b.os}`));
    return map;
  }, []);

  const eta = useMemo(() => {
    if (!runner) return { perTargetSec: 0, totalWallClockSec: 0 };
    return engine.estimate({
      runnerId: runner.id,
      targets: Math.max(1, selected.length),
      mode,
      parallelism,
      testScope: scope,
    });
  }, [runner, selected.length, mode, parallelism, scope]);

  const reset = () => {
    setSelected([]);
    setMode("per-target");
    setParallelism(1);
    setScope("all");
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleRun = () => {
    if (!runner) return;
    if ((isMobile || isWeb) && selected.length === 0) {
      toast.error("Pick at least one target");
      return;
    }
    const created = engine.trigger(
      {
        runnerId: runner.id,
        targetIds: isApi ? [] : selected,
        mode,
        parallelism,
        testScope: scope,
        triggeredBy: "you",
      },
      targetLabels,
    );
    toast.success(
      `${created.length} execution${created.length > 1 ? "s" : ""} queued · build${created.length > 1 ? "s" : ""} #${created
        .map((e) => e.buildNumber)
        .join(", #")}`,
    );
    onOpenChange(false);
    reset();
    navigate("/executions");
  };

  if (!runner) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" /> Run · {runner.name}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            jenkins://{runner.jenkinsJob}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Targets */}
          {!isApi && (
            <div>
              <Label className="mb-2 flex items-center gap-2 text-sm">
                {isMobile ? <Smartphone className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                {isMobile ? "Devices" : "Browser × OS"}
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {selected.length} selected
                </span>
              </Label>
              <ScrollArea className="h-44 rounded-lg border border-border surface p-2">
                <div className="grid grid-cols-2 gap-2">
                  {(isMobile ? devices : browserTargets).map((t) => {
                    const id = t.id;
                    const disabled = isMobile && !(t as typeof devices[number]).available;
                    const active = selected.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggle(id)}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border surface-elevated hover:bg-surface-hover",
                          disabled && "opacity-40 cursor-not-allowed",
                        )}
                      >
                        <span className="font-mono text-xs">{targetLabels[id]}</span>
                        {active && <Check className="h-3.5 w-3.5 text-primary" />}
                        {disabled && <span className="text-[10px] text-warning">busy</span>}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Mode */}
          {!isApi && selected.length > 1 && (
            <div>
              <Label className="mb-2 text-sm">Run mode</Label>
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as RunMode)} className="grid grid-cols-2 gap-2">
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm",
                    mode === "per-target" ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <RadioGroupItem value="per-target" className="mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5 font-medium"><Layers className="h-3.5 w-3.5" /> One run per target</div>
                    <div className="text-xs text-muted-foreground">Full suite on each, in parallel</div>
                  </div>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm",
                    mode === "shard" ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <RadioGroupItem value="shard" className="mt-0.5" />
                  <div>
                    <div className="flex items-center gap-1.5 font-medium"><Zap className="h-3.5 w-3.5" /> Shard across targets</div>
                    <div className="text-xs text-muted-foreground">Split tests, single execution</div>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Scope + parallelism */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 text-sm">Test scope</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as "all" | "smoke")} className="space-y-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="all" /> All tests <span className="font-mono text-xs text-muted-foreground">({runner.totalTests})</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="smoke" /> Smoke only <span className="font-mono text-xs text-muted-foreground">(~{Math.ceil(runner.totalTests * 0.25)})</span>
                </label>
              </RadioGroup>
            </div>
            <div>
              <Label className="mb-2 flex items-center justify-between text-sm">
                Parallelism <span className="font-mono text-xs text-muted-foreground">{parallelism}×</span>
              </Label>
              <Slider min={1} max={8} step={1} value={[parallelism]} onValueChange={(v) => setParallelism(v[0])} />
            </div>
          </div>

          {/* ETA */}
          <div className="rounded-lg border border-info/30 bg-info/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-info">
              <AlertCircle className="h-3.5 w-3.5" /> Estimated time
            </div>
            <div className="grid grid-cols-3 gap-3 font-mono text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Per target</div>
                <div className="text-lg font-bold">{formatDuration(eta.perTargetSec)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Wall clock</div>
                <div className="text-lg font-bold text-info">{formatDuration(eta.totalWallClockSec)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Executions</div>
                <div className="text-lg font-bold">
                  {isApi ? 1 : mode === "shard" ? 1 : Math.max(1, selected.length)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              avg(last 5) × ({scope === "smoke" ? "25%" : "100%"} of {runner.totalTests}) ÷ {parallelism}× parallelism
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleRun} className="gap-2">
            <Play className="h-4 w-4" /> Trigger run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
