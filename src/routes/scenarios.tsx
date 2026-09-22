import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  GitCompare,
  Layers,
  Play,
  RotateCcw,
  TrendingUp,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { predictionSteps, simulateFlood, incident } from "@/data/incident";
import { num } from "@/lib/damage";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario Comparison & Disaster Replay — AegisVision AI" },
      {
        name: "description",
        content:
          "Side-by-side scenario comparison (Current vs Forecast vs What-If) and temporal progression replay for Cyclone Vaayu.",
      },
    ],
  }),
  component: ScenariosPage,
});

function ScenariosPage() {
  const [extraSurge, setExtraSurge] = useState(1.5);
  const baseline = predictionSteps[0]!;
  const forecast6h = predictionSteps.find((p) => p.t === 6) ?? predictionSteps[2]!;
  const whatIf = simulateFlood(extraSurge, 6);

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                Scenario Comparison & Disaster Replay
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-scenario delta analysis. Compare baseline reality, 6-hour hydrological forecast,
              and synthetic worst-case surges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="label-mono">Worst-Case Surge Slider:</span>
              <span className="font-mono text-primary font-bold">+{extraSurge.toFixed(1)} m</span>
            </div>
            <Slider
              className="w-36"
              min={0.5}
              max={3.0}
              step={0.5}
              value={[extraSurge]}
              onValueChange={([v]) => setExtraSurge(v ?? 1.5)}
            />
          </div>
        </div>

        {/* 3-Column Split Comparison Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Column 1: Baseline Reality */}
          <div className="panel p-4 space-y-3 border-t-4 border-t-safe">
            <div className="flex items-center justify-between">
              <span className="label-mono text-[10px] text-safe font-bold">SCENARIO ALPHA</span>
              <span className="rounded bg-safe/10 text-safe px-1.5 py-0.5 text-[10px] font-mono">
                CURRENT BASELINE
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground">T+0h Ground Reality</h2>
            <p className="text-xs text-muted-foreground">
              Observed conditions following coastal landfall.
            </p>

            <div className="space-y-2.5 font-mono text-xs border-y border-border/40 py-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mean Flood Depth:</span>
                <span className="font-semibold text-foreground">{baseline.floodDepth} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Affected Structures:</span>
                <span className="font-semibold text-foreground">
                  {num(baseline.affectedBuildings)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Population at Risk:</span>
                <span className="font-semibold text-foreground">
                  {num(baseline.populationAtRisk)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Road Closures:</span>
                <span className="font-semibold text-foreground">{baseline.roadClosures}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Critical Hospitals at Risk:</span>
                <span className="font-semibold text-foreground">{baseline.hospitalsAtRisk}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Direct telemetry from IMD radar and Sentinel-2 pass 14.
            </p>
          </div>

          {/* Column 2: Hydrological Forecast */}
          <div className="panel p-4 space-y-3 border-t-4 border-t-primary">
            <div className="flex items-center justify-between">
              <span className="label-mono text-[10px] text-primary font-bold">SCENARIO BETA</span>
              <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-mono">
                ENSEMBLE MODEL
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground">T+6h Projected Forecast</h2>
            <p className="text-xs text-muted-foreground">
              AI ensemble simulation (24 hydrology members).
            </p>

            <div className="space-y-2.5 font-mono text-xs border-y border-border/40 py-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mean Flood Depth:</span>
                <span className="font-semibold text-primary">
                  {forecast6h.floodDepth} m (+0.9m)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Affected Structures:</span>
                <span className="font-semibold text-primary">
                  {num(forecast6h.affectedBuildings)} (+1,860)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Population at Risk:</span>
                <span className="font-semibold text-primary">
                  {num(forecast6h.populationAtRisk)} (+11,900)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Road Closures:</span>
                <span className="font-semibold text-primary">{forecast6h.roadClosures} (+15)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Critical Hospitals at Risk:</span>
                <span className="font-semibold text-primary">
                  {forecast6h.hospitalsAtRisk} (+2)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Confidence score 84%. Inundation expands westward toward Zone 5 CBD.
            </p>
          </div>

          {/* Column 3: Worst-Case What-If */}
          <div className="panel p-4 space-y-3 border-t-4 border-t-critical">
            <div className="flex items-center justify-between">
              <span className="label-mono text-[10px] text-critical font-bold">SCENARIO GAMMA</span>
              <span className="rounded bg-critical/10 text-critical px-1.5 py-0.5 text-[10px] font-mono">
                WHAT-IF SURGE (+{extraSurge}m)
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground">Catastrophic Breach</h2>
            <p className="text-xs text-muted-foreground">
              Simulates storm surge barrier or levee failure.
            </p>

            <div className="space-y-2.5 font-mono text-xs border-y border-border/40 py-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mean Flood Depth:</span>
                <span className="font-semibold text-critical">
                  {(forecast6h.floodDepth + extraSurge).toFixed(1)} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Affected Structures:</span>
                <span className="font-semibold text-critical">
                  {num(forecast6h.affectedBuildings + whatIf.affectedBuildingsDelta)} (+
                  {num(whatIf.affectedBuildingsDelta)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Population at Risk:</span>
                <span className="font-semibold text-critical">
                  {num(forecast6h.populationAtRisk + whatIf.populationRiskDelta)} (+
                  {num(whatIf.populationRiskDelta)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Road Closures:</span>
                <span className="font-semibold text-critical">
                  {forecast6h.roadClosures + whatIf.roadClosuresDelta} (+{whatIf.roadClosuresDelta})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Newly Flooded Hospitals:</span>
                <span className="font-semibold text-critical">
                  {whatIf.newlyAtRiskHospitals.length || "1 (Stanley Medical)"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-critical font-medium">
              Recommendation: {whatIf.recommendation}
            </p>
          </div>
        </div>

        {/* Temporal Replay Timeline */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Multi-Phase Temporal Inundation Timeline</span>
            </h2>
            <span className="label-mono text-[10px]">Deterministic Progression</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 pt-1">
            {predictionSteps.map((step) => (
              <div
                key={step.t}
                className="rounded-md border border-border p-3 bg-panel-elevated/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-primary">{step.label}</span>
                  <span className="text-[10px] label-mono">Step #{step.t}</span>
                </div>
                <div className="text-xs font-mono space-y-1 text-muted-foreground">
                  <p>
                    Flood:{" "}
                    <strong className="text-foreground">{step.floodDepth.toFixed(1)} m</strong>
                  </p>
                  <p>
                    Buildings:{" "}
                    <strong className="text-foreground">{num(step.affectedBuildings)}</strong>
                  </p>
                  <p>
                    Blocked Roads: <strong className="text-foreground">{step.roadClosures}</strong>
                  </p>
                  <p>
                    Power Outage:{" "}
                    <strong className="text-foreground">{step.powerOutagePct}%</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
