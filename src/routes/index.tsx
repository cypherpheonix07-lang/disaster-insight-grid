import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Building2, Droplets, Route as RouteIcon, Users } from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { DamageMap } from "@/components/map/DamageMap";
import { MapControls } from "@/components/map/MapControls";
import { BuildingPanel } from "@/components/BuildingPanel";
import {
  agents,
  alerts,
  hospitalsAtRisk,
  incident,
  predictionSteps,
  unsafeRoads,
} from "@/data/incident";
import { num, severityClass, severityLabel } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { useRealtimeTelemetry, useRealtimeSparkline } from "@/lib/realtime/useRealtimeValue";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — AegisVision AI" },
      {
        name: "description",
        content:
          "Live disaster command center for Cyclone Vaayu, Chennai: damage map, AI agent findings and hospital risk in one operations view.",
      },
      { property: "og:title", content: "Command Center — AegisVision AI" },
      {
        property: "og:description",
        content: "Real-time multimodal disaster intelligence for emergency response teams.",
      },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const { step, selectedBuildingId } = useOps();
  const realtime = useRealtimeTelemetry();
  const sparkline = useRealtimeSparkline();
  const forecast = predictionSteps.find((p) => p.t === step) ?? predictionSteps[0]!;
  const risky = hospitalsAtRisk(step).filter((h) => h.risk === "critical" || h.risk === "high");
  const blocked = unsafeRoads(step);

  return (
    <AppShell>
      <div className="space-y-3">
        {/* Realtime Mission Control Banner */}
        <div className="panel flex flex-wrap items-center justify-between gap-x-4 gap-y-2 p-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-critical" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight">{incident.name}</h1>
                <span
                  className={`rounded border px-2 py-0.5 text-[11px] uppercase font-semibold ${severityClass[incident.severity]}`}
                >
                  {severityLabel[incident.severity]}
                </span>
                <span className="rounded bg-safe/10 border border-safe/30 text-safe px-1.5 py-0.2 text-[10px] font-mono">
                  LIVE REALTIME
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {incident.id} · {incident.location} · Sensor Health: {realtime.sensorHealth}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right hidden md:block">
              <p className="label-mono">Live Atmospheric Sensors</p>
              <p className="text-foreground font-semibold">
                WIND: <span className="text-primary">{realtime.windSpeed} km/h</span> · RAIN:{" "}
                <span className="text-warning">{realtime.rainfall} mm</span>
              </p>
            </div>
            <Link
              to="/reports"
              className="rounded-md border border-border bg-panel-elevated px-2.5 py-1 text-xs hover:bg-accent transition-colors"
            >
              Export SitRep
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Affected buildings"
            value={num(forecast.affectedBuildings)}
            sub={`${num(incident.stats.destroyed)} destroyed · ${num(incident.stats.majorDamage)} major`}
            icon={Building2}
            tone="critical"
            updated={incident.lastFusion}
          />
          <StatCard
            label="Population at risk"
            value={num(forecast.populationAtRisk)}
            sub={`${num(incident.stats.displaced)} displaced · ${incident.stats.sheltersOpen} shelters open`}
            icon={Users}
            tone="warning"
            updated={incident.lastFusion}
          />
          <StatCard
            label="Flood depth (mean)"
            value={`${forecast.floodDepth.toFixed(1)} m`}
            sub={`Rainfall ${realtime.rainfall} mm · wind ${realtime.windSpeed} km/h (live)`}
            icon={Droplets}
            updated="live stream"
          />
          <StatCard
            label="Roads blocked"
            value={num(forecast.roadClosures)}
            sub={`${blocked.length} of 9 monitored corridors unsafe`}
            icon={RouteIcon}
            tone="warning"
            updated="1 min ago"
          />
          <StatCard
            label="Hospitals at risk"
            value={num(forecast.hospitalsAtRisk)}
            sub={
              risky
                .map((h) => h.name)
                .slice(0, 2)
                .join(", ") || "None escalated"
            }
            icon={AlertTriangle}
            tone="critical"
            updated="2 min ago"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <MapControls />
          <DamageMap />
          {selectedBuildingId ? (
            <BuildingPanel />
          ) : (
            <div className="panel p-3">
              <p className="label-mono">Agent alerts</p>
              <ul className="mt-2 space-y-2">
                {alerts.map((a) => (
                  <li key={a.id} className="rounded-md border border-border p-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded border px-1.5 text-[10px] uppercase ${severityClass[a.severity]}`}
                      >
                        {severityLabel[a.severity]}
                      </span>
                      <span className="label-mono">
                        {a.agent} · {a.time} ago
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.detail}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Select any structure on the map to open its evidence chain.
              </p>
            </div>
          )}
        </div>

        <div className="panel p-3">
          <div className="flex items-center gap-2">
            <p className="label-mono">Autonomous agent fleet</p>
            <Link to="/predictions" className="label-mono ml-auto text-primary hover:underline">
              View forecast →
            </Link>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 animate-pulse-slow rounded-full bg-primary"
                    aria-hidden
                  />
                  <p className="text-sm font-medium">{a.name}</p>
                  <span className="label-mono ml-auto capitalize">{a.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.currentTask}</p>
                <p className="mt-2 text-xs">{a.finding}</p>
                <p className="label-mono mt-2">
                  {num(a.processed)} {a.processedUnit} · confidence {Math.round(a.confidence * 100)}
                  % · {a.lastAction}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
