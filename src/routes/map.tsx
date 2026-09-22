import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/shell/AppShell";
import { DamageMap } from "@/components/map/DamageMap";
import { MapControls } from "@/components/map/MapControls";
import { BuildingPanel } from "@/components/BuildingPanel";
import { roads, zones, floodDepthAt } from "@/data/incident";
import { num } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Damage Map — AegisVision AI" },
      {
        name: "description",
        content:
          "Interactive digital twin of the Cyclone Vaayu impact area: per-structure damage, flood extent and road closures over time.",
      },
      { property: "og:title", content: "Live Damage Map — AegisVision AI" },
      {
        property: "og:description",
        content:
          "Per-structure damage, flood extent and road status across five Chennai response zones.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { step, selectedBuildingId } = useOps();
  const roadStatus = roads.map((r) => ({
    ...r,
    effective:
      r.status === "blocked" || (r.closureAt !== null && r.closureAt <= step)
        ? "blocked"
        : r.status,
  }));

  return (
    <AppShell>
      <div className="grid gap-3 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          <MapControls />
          <div className="panel p-3">
            <p className="label-mono">Road corridors</p>
            <ul className="mt-2 space-y-1.5 text-xs">
              {roadStatus.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <span>{r.name}</span>
                  <span
                    className={
                      r.effective === "blocked"
                        ? "text-critical"
                        : r.effective === "degraded"
                          ? "text-warning"
                          : "text-safe"
                    }
                  >
                    {r.effective === "blocked"
                      ? "✕ blocked"
                      : r.effective === "degraded"
                        ? "▲ degraded"
                        : "● open"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DamageMap />

        {selectedBuildingId ? (
          <BuildingPanel />
        ) : (
          <div className="panel p-3">
            <p className="label-mono">Zone flood state</p>
            <ul className="mt-2 space-y-2 text-xs">
              {zones.map((z) => (
                <li key={z.id} className="rounded-md border border-border p-2">
                  <p className="text-sm font-medium">{z.name}</p>
                  <p className="tabular mt-1 text-muted-foreground">
                    Depth {floodDepthAt(step, z).toFixed(1)} m · population {num(z.population)}
                  </p>
                  <p className="tabular text-muted-foreground">
                    Damage index {Math.round(z.damageIndex * 100)}% · fire risk{" "}
                    {Math.round(z.fireRisk * 100)}%
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}
