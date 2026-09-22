import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import {
  buildings,
  damageCounts,
  hospitals,
  predictionSteps,
  zones,
  type DamageState,
} from "@/data/incident";
import { damageFill, damageLabel, num, pct } from "@/lib/damage";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Impact Analytics — AegisVision AI" },
      {
        name: "description",
        content:
          "Damage distribution, zone comparisons and confidence quality metrics for the Cyclone Vaayu response.",
      },
      { property: "og:title", content: "Impact Analytics — AegisVision AI" },
      {
        property: "og:description",
        content: "Damage distribution, zone severity comparison and AI confidence quality metrics.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const order: DamageState[] = ["destroyed", "major", "minor", "intact"];

function AnalyticsPage() {
  const counts = damageCounts();
  const distribution = order.map((d) => ({ name: damageLabel[d], key: d, value: counts[d] }));
  const zoneData = zones.map((z) => {
    const list = buildings.filter((b) => b.zoneId === z.id);
    return {
      name: z.name.replace("Zone ", "Z").split(" · ")[0] ?? z.id,
      damaged: list.filter((b) => b.damage !== "intact").length,
      destroyed: list.filter((b) => b.damage === "destroyed").length,
      flood: Number(z.floodDepth.toFixed(1)),
    };
  });
  const trend = predictionSteps.map((p) => ({
    name: p.label,
    affected: p.affectedBuildings,
    atRisk: p.populationAtRisk,
    outage: p.powerOutagePct,
  }));
  const meanConfidence = buildings.reduce((s, b) => s + b.confidence, 0) / buildings.length;
  const lowConfidence = buildings.filter((b) => b.confidence < 0.75).length;

  return (
    <AppShell>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Structures assessed"
            value={num(buildings.length)}
            sub="Sampled digital-twin tile"
            updated="12s ago"
          />
          <StatCard
            label="Mean AI confidence"
            value={pct(meanConfidence)}
            sub={`${num(lowConfidence)} below 75% need review`}
            tone="warning"
            updated="12s ago"
          />
          <StatCard
            label="Destroyed in sample"
            value={num(counts.destroyed)}
            sub={`${pct(counts.destroyed / buildings.length)} of assessed`}
            tone="critical"
            updated="1 min ago"
          />
          <StatCard
            label="Hospitals monitored"
            value={num(hospitals.length)}
            sub={`${hospitals.filter((h) => h.roadAccess !== "open").length} with impaired access`}
            updated="2 min ago"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <div className="panel p-3">
            <p className="label-mono">Damage distribution</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
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
                  <Bar dataKey="value" name="Structures" radius={[4, 4, 0, 0]}>
                    {distribution.map((d) => (
                      <Cell key={d.key} fill={damageFill[d.key]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-3">
            <p className="label-mono">Damage by zone</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData}>
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
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="damaged"
                    name="Damaged"
                    fill="var(--warning)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="destroyed"
                    name="Destroyed"
                    fill="var(--critical)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-3 xl:col-span-2">
            <p className="label-mono">Projected escalation</p>
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
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
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="affected"
                    name="Affected buildings"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot
                  />
                  <Line
                    type="monotone"
                    dataKey="atRisk"
                    name="Population at risk"
                    stroke="var(--critical)"
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel p-3">
          <p className="label-mono">Zone summary</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left">
                <tr className="label-mono">
                  <th className="py-2 pr-3">Zone</th>
                  <th className="py-2 pr-3">Population</th>
                  <th className="py-2 pr-3">Flood depth</th>
                  <th className="py-2 pr-3">Damage index</th>
                  <th className="py-2 pr-3">Fire risk</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr key={z.id} className="border-t border-border/60">
                    <td className="py-2 pr-3">{z.name}</td>
                    <td className="tabular py-2 pr-3">{num(z.population)}</td>
                    <td className="tabular py-2 pr-3">{z.floodDepth.toFixed(1)} m</td>
                    <td className="tabular py-2 pr-3">{pct(z.damageIndex)}</td>
                    <td className="tabular py-2 pr-3">{pct(z.fireRisk)}</td>
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
