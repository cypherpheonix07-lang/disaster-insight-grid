import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { BuildingPanel } from "@/components/BuildingPanel";
import { damageFill, damageGlyph, damageLabel, num, pct } from "@/lib/damage";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { useOps } from "@/lib/ops-store";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/buildings")({
  head: () => ({
    meta: [
      { title: "Building Register — AegisVision AI" },
      {
        name: "description",
        content:
          "Searchable register of assessed structures with damage verdict, AI confidence, occupancy and flood exposure.",
      },
      { property: "og:title", content: "Building Register — AegisVision AI" },
      {
        property: "og:description",
        content:
          "Search assessed structures by ID, type or zone and open their full evidence chain.",
      },
    ],
  }),
  component: BuildingsPage,
});

function BuildingsPage() {
  const { search, setSearch, damageFilter, confidenceMin, step, select, selectedBuildingId } =
    useOps();
  const { data: buildings = [] } = useQuery({ queryKey: ["buildings"], queryFn: api.getBuildings });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buildings
      .filter((b) => damageFilter[b.damage] && b.confidence * 100 >= confidenceMin)
      .filter((b) => {
        if (!q) return true;
        const zone = api.getZone(b.zoneId)?.name ?? "";
        return (
          b.id.toLowerCase().includes(q) ||
          b.type.includes(q) ||
          zone.toLowerCase().includes(q) ||
          damageLabel[b.damage].toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 250);
  }, [search, damageFilter, confidenceMin, buildings]);

  return (
    <AppShell>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="panel min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
            <div className="relative min-w-56 flex-1">
              <Search
                className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, type, zone or damage"
                aria-label="Search buildings"
                className="pl-8"
              />
            </div>
            <p className="label-mono">
              {num(rows.length)} shown · confidence ≥ {confidenceMin}%
            </p>
          </div>

          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-panel-elevated text-left">
                <tr className="label-mono">
                  <th className="px-3 py-2">Structure</th>
                  <th className="px-3 py-2">Damage</th>
                  <th className="px-3 py-2">Confidence</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Zone</th>
                  <th className="px-3 py-2">Occupancy</th>
                  <th className="px-3 py-2">Flood</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr
                    key={b.id}
                    tabIndex={0}
                    onClick={() => select(b.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        select(b.id);
                      }
                    }}
                    className={`cursor-pointer border-t border-border/60 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring ${
                      b.id === selectedBuildingId ? "bg-accent" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-mono">{b.id}</td>
                    <td className="px-3 py-2">
                      <span aria-hidden style={{ color: damageFill[b.damage] }}>
                        {damageGlyph[b.damage]}{" "}
                      </span>
                      {damageLabel[b.damage]}
                    </td>
                    <td className="tabular px-3 py-2">{pct(b.confidence)}</td>
                    <td className="px-3 py-2 capitalize">{b.type}</td>
                    <td className="px-3 py-2">{api.getZone(b.zoneId)?.name ?? b.zoneId}</td>
                    <td className="tabular px-3 py-2">{num(b.occupancy)}</td>
                    <td className="px-3 py-2">{api.isFlooded(b, step) ? "Inundated" : "Dry"}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No structures match the current search and filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedBuildingId ? (
          <BuildingPanel />
        ) : (
          <div className="panel p-3 text-xs text-muted-foreground">
            <p className="label-mono">Evidence viewer</p>
            <p className="mt-2">
              Select a row to inspect the fused evidence chain, projected impact and decision
              timeline for that structure.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
