import { useEffect } from "react";
import { Play, Pause, RotateCcw, Layers } from "lucide-react";
import type { DamageState, TimeStep } from "@/data/incident";
import { damageFill, damageGlyph, damageLabel } from "@/lib/damage";
import { useOps, type SourceKey, type MapLayerKey } from "@/lib/ops-store";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

const damageKeys: DamageState[] = ["destroyed", "major", "minor", "intact"];
const sourceKeys: SourceKey[] = ["satellite", "drone", "social", "sensor"];
const steps: TimeStep[] = [0, 1, 6, 24];
const stepLabel: Record<TimeStep, string> = { 0: "Now", 1: "+1 h", 6: "+6 h", 24: "+24 h" };

const layerConfig: { key: MapLayerKey; label: string }[] = [
  { key: "buildings", label: "Structures" },
  { key: "roads", label: "Road Network" },
  { key: "zones", label: "Flood Zones" },
  { key: "hospitals", label: "Hospitals" },
  { key: "shelters", label: "Shelters" },
  { key: "drones", label: "Drone Sorties" },
  { key: "riskEnvelopes", label: "Risk Envelopes" },
];

export function MapControls({ className }: { className?: string }) {
  const {
    damageFilter,
    toggleDamage,
    confidenceMin,
    setConfidenceMin,
    sources,
    toggleSource,
    step,
    setStep,
    mapLayers,
    toggleMapLayer,
    replayPlaying,
    setReplayPlaying,
    reset,
  } = useOps();

  // Replay engine loop
  useEffect(() => {
    if (!replayPlaying) return;
    const interval = setInterval(() => {
      setStep((curr) => {
        const idx = steps.indexOf(curr);
        const next = steps[(idx + 1) % steps.length]!;
        return next;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [replayPlaying, setStep]);

  return (
    <div className={cn("panel space-y-4 p-3", className)}>
      {/* Damage Filter */}
      <div>
        <p className="label-mono">Damage classification</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {damageKeys.map((d) => (
            <button
              key={d}
              onClick={() => toggleDamage(d)}
              aria-pressed={damageFilter[d]}
              className={cn(
                "rounded-md border px-2 py-1 text-xs transition-colors",
                damageFilter[d]
                  ? "border-ring bg-accent text-foreground font-medium"
                  : "border-border text-muted-foreground line-through opacity-60",
              )}
            >
              <span aria-hidden style={{ color: damageFill[d] }}>
                {damageGlyph[d]}{" "}
              </span>
              {damageLabel[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Confidence Filter */}
      <div>
        <div className="flex justify-between items-center">
          <p className="label-mono">Min. AI Confidence</p>
          <span className="font-mono text-xs font-semibold">{confidenceMin}%</span>
        </div>
        <Slider
          className="mt-2.5"
          min={50}
          max={100}
          step={1}
          value={[confidenceMin]}
          onValueChange={([v]) => setConfidenceMin(v ?? 60)}
          aria-label="Minimum confidence"
        />
      </div>

      {/* Geospatial Layer Switcher 2.0 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <p className="label-mono">GIS Layer Manager 2.0</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {layerConfig.map((l) => (
            <button
              key={l.key}
              onClick={() => toggleMapLayer(l.key)}
              className={cn(
                "flex items-center justify-between rounded border px-2 py-1 text-[11px] transition-colors",
                mapLayers[l.key]
                  ? "border-primary/50 bg-primary/10 text-foreground font-medium"
                  : "border-border text-muted-foreground line-through opacity-60",
              )}
            >
              <span>{l.label}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  mapLayers[l.key] ? "bg-primary" : "bg-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Source Toggles */}
      <div>
        <p className="label-mono">Fused evidence streams</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sourceKeys.map((s) => (
            <button
              key={s}
              onClick={() => toggleSource(s)}
              aria-pressed={sources[s]}
              className={cn(
                "rounded-md border px-2 py-1 text-xs capitalize transition-colors",
                sources[s]
                  ? "border-ring bg-accent text-foreground font-medium"
                  : "border-border text-muted-foreground line-through opacity-60",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline & Replay Engine */}
      <div>
        <div className="flex items-center justify-between">
          <p className="label-mono">Forecast Horizon & Replay</p>
          <button
            onClick={() => setReplayPlaying(!replayPlaying)}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline font-mono"
            aria-label={replayPlaying ? "Pause simulation replay" : "Play simulation replay"}
          >
            {replayPlaying ? (
              <>
                <Pause className="h-3 w-3" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span>AUTO REPLAY</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-2 flex gap-1.5">
          {steps.map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              aria-pressed={step === s}
              className={cn(
                "flex-1 rounded-md border px-2 py-1 text-xs tabular font-mono transition-colors",
                step === s
                  ? "border-primary bg-primary/20 text-foreground font-bold"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {stepLabel[s]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={reset}
        className="flex items-center justify-center gap-1.5 w-full rounded-md border border-input px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset Tactical Filters</span>
      </button>
    </div>
  );
}
