import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { Slider } from "@/components/ui/slider";
import {
  allocations,
  evacuationPlan,
  hospitalsAtRisk,
  predictionSteps,
  resourceInventory,
  simulateFlood,
  unsafeRoads,
  zones,
} from "@/data/incident";
import { num, severityClass, severityLabel } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";

export const Route = createFileRoute("/predictions")({
  head: () => ({
    meta: [
      { title: "Predictions & Planning — AegisVision AI" },
      {
        name: "description",
        content:
          "Flood-rise simulation, hospital risk forecast, evacuation waves and resource allocation for Cyclone Vaayu.",
      },
      { property: "og:title", content: "Predictions & Planning — AegisVision AI" },
      {
        property: "og:description",
        content:
          "Simulate flood rise, forecast hospital risk and plan evacuation waves and resources.",
      },
    ],
  }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const { step } = useOps();
  const [rise, setRise] = useState(1);
  const [zoneId, setZoneId] = useState(zones[2]?.id ?? "Z3");

  const sim = useMemo(() => simulateFlood(rise, step), [rise, step]);
  const plan = useMemo(() => evacuationPlan(zoneId), [zoneId]);
  const risk = hospitalsAtRisk(step);
  const unsafe = unsafeRoads(step);
  const chart = predictionSteps.map((p) => ({
    name: p.label,
    flood: p.floodDepth,
    outage: p.powerOutagePct,
    closures: p.roadClosures,
  }));

  return (
    <AppShell>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Flood-rise scenario"
            value={`+${rise.toFixed(1)} m`}
            sub="Operator-set simulation"
            updated="now"
          />
          <StatCard
            label="Extra buildings affected"
            value={`+${num(sim.affectedBuildingsDelta)}`}
            tone="critical"
            sub="Scaled to city footprint"
            updated="now"
          />
          <StatCard
            label="Extra people at risk"
            value={`+${num(sim.populationRiskDelta)}`}
            tone="warning"
            sub={`+${sim.roadClosuresDelta} road closures`}
            updated="now"
          />
          <StatCard
            label="Unsafe corridors"
            value={num(unsafe.length)}
            sub={unsafe
              .slice(0, 2)
              .map((r) => r.name)
              .join(", ")}
            updated="1 min ago"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <div className="panel p-3">
            <p className="label-mono">Flood-rise simulation</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Scenario rise above the current forecast at the selected time step.
            </p>
            <Slider
              className="mt-4"
              min={0}
              max={3}
              step={0.1}
              value={[rise]}
              onValueChange={([v]) => setRise(v ?? 0)}
              aria-label="Additional flood depth in meters"
            />
            <div className="mt-4 rounded-md border border-border p-3 text-xs">
              <p className="font-medium">Recommendation</p>
              <p className="mt-1 text-muted-foreground">{sim.recommendation}</p>
              <p className="mt-2">
                Newly at-risk hospitals:{" "}
                <span className="text-critical">
                  {sim.newlyAtRiskHospitals.length ? sim.newlyAtRiskHospitals.join(", ") : "none"}
                </span>
              </p>
            </div>
          </div>

          <div className="panel p-3">
            <p className="label-mono">Forecast envelope</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="flood"
                    name="Flood depth (m)"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="closures"
                    name="Road closures"
                    stroke="var(--warning)"
                    fill="var(--warning)"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-3">
            <p className="label-mono">Hospital risk · T+{step}h</p>
            <ul className="mt-2 space-y-2 text-xs">
              {risk.map((h) => (
                <li key={h.id} className="rounded-md border border-border p-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded border px-1.5 text-[10px] uppercase ${severityClass[h.risk]}`}
                    >
                      {severityLabel[h.risk]}
                    </span>
                    <span className="text-sm font-medium">{h.name}</span>
                    <span className="label-mono ml-auto">{h.projectedFloodDepth} m</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {h.zone} · {h.beds} beds · {h.occupancyPct}% occupied · access {h.roadAccess}
                  </p>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {h.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="label-mono">Evacuation plan</p>
              <div className="ml-auto flex gap-1">
                {zones.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setZoneId(z.id)}
                    aria-pressed={zoneId === z.id}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      zoneId === z.id
                        ? "border-ring bg-primary/15"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {z.id}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm font-medium">{plan.zone}</p>
            <p className="text-xs text-muted-foreground">
              {num(plan.population)} residents · routes: {plan.routes.slice(0, 3).join(", ")}
            </p>
            <ol className="mt-3 space-y-2 text-xs">
              {plan.waves.map((w) => (
                <li key={w.wave} className="rounded-md border border-border p-2">
                  <p className="label-mono">
                    Wave {w.wave} · {w.window}
                  </p>
                  <p className="mt-1">
                    {num(w.people)} people — {w.focus}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-muted-foreground">
              Shelters:{" "}
              {plan.shelters.map((s) => `${s.id} (${s.zone})`).join(", ") || "none available"}
            </p>
          </div>
        </div>

        <div className="panel p-3">
          <p className="label-mono">
            Resource allocation · {resourceInventory.rescueTeams} teams ·{" "}
            {resourceInventory.ambulances} ambulances · {resourceInventory.boats} boats ·{" "}
            {resourceInventory.medics} medics
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left">
                <tr className="label-mono">
                  <th className="py-2 pr-3">Zone</th>
                  <th className="py-2 pr-3">Priority</th>
                  <th className="py-2 pr-3">Teams</th>
                  <th className="py-2 pr-3">Ambulances</th>
                  <th className="py-2 pr-3">Boats</th>
                  <th className="py-2 pr-3">Medics</th>
                  <th className="py-2 pr-3">ETA</th>
                  <th className="py-2 pr-3">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.zoneId} className="border-t border-border/60">
                    <td className="py-2 pr-3">{a.zoneId}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded border px-1.5 text-[10px] uppercase ${severityClass[a.priority]}`}
                      >
                        {severityLabel[a.priority]}
                      </span>
                    </td>
                    <td className="tabular py-2 pr-3">{a.rescueTeams}</td>
                    <td className="tabular py-2 pr-3">{a.ambulances}</td>
                    <td className="tabular py-2 pr-3">{a.boats}</td>
                    <td className="tabular py-2 pr-3">{a.medics}</td>
                    <td className="tabular py-2 pr-3">{a.eta}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
