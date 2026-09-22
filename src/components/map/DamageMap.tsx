import { useMemo, useState } from "react";
import {
  buildings,
  roads,
  zones,
  hospitals,
  isFlooded,
  floodDepthAt,
  type Building,
  type DamageState,
} from "@/data/incident";
import { damageFill, damageGlyph, damageLabel, num } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { cn } from "@/lib/utils";
import { Crosshair, ZoomIn, ZoomOut } from "lucide-react";

const DAMAGE_ORDER: DamageState[] = ["destroyed", "major", "minor", "intact"];

const roadStroke = {
  open: "var(--safe)",
  degraded: "var(--warning)",
  blocked: "var(--critical)",
} as const;

export function DamageMap({ className }: { className?: string }) {
  const { damageFilter, confidenceMin, step, selectedBuildingId, select, mapLayers } = useOps();
  const [hover, setHover] = useState<Building | null>(null);
  const [hoverHospital, setHoverHospital] = useState<(typeof hospitals)[number] | null>(null);
  const [viewBox, setViewBox] = useState({ x: -120, y: -100, w: 240, h: 200 });

  const visible = useMemo(
    () =>
      mapLayers.buildings
        ? buildings.filter((b) => damageFilter[b.damage] && b.confidence * 100 >= confidenceMin)
        : [],
    [damageFilter, confidenceMin, mapLayers.buildings],
  );

  const zoom = (factor: number) => {
    setViewBox((prev) => {
      const nw = Math.max(80, Math.min(320, prev.w * factor));
      const nh = Math.max(60, Math.min(260, prev.h * factor));
      return {
        x: prev.x + (prev.w - nw) / 2,
        y: prev.y + (prev.h - nh) / 2,
        w: nw,
        h: nh,
      };
    });
  };

  const resetView = () => {
    setViewBox({ x: -120, y: -100, w: 240, h: 200 });
  };

  return (
    <div className={cn("panel relative overflow-hidden flex flex-col", className)}>
      {/* Top Map Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 bg-panel-elevated/40">
        <p className="label-mono">
          Geospatial Canvas · {num(visible.length)} structures · Horizon T+{step}h
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {DAMAGE_ORDER.map((d) => (
            <span key={d} className="label-mono flex items-center gap-1">
              <span aria-hidden style={{ color: damageFill[d] }}>
                {damageGlyph[d]}
              </span>
              {damageLabel[d]}
            </span>
          ))}

          {/* Map navigation tools */}
          <div className="flex items-center gap-1 border-l border-border pl-2">
            <button
              onClick={() => zoom(0.8)}
              className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => zoom(1.25)}
              className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={resetView}
              className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Reset View"
              aria-label="Reset View"
            >
              <Crosshair className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG GIS Layer Rendering */}
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="block h-[28rem] w-full bg-[oklch(0.12_0.02_258)] sm:h-[34rem] select-none"
        role="img"
        aria-label={`Damage map of ${num(visible.length)} structures across 5 zones`}
      >
        <defs>
          <pattern id="tactical-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="oklch(0.25 0.02 258)"
              strokeWidth="0.25"
            />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect x="-150" y="-120" width="300" height="240" fill="url(#tactical-grid-pattern)" />

        {/* Hazard Envelopes (Coastal Surge & Flood Plain) */}
        {mapLayers.riskEnvelopes && (
          <path
            d="M 60 -90 Q 95 0 85 90 L 120 90 L 120 -90 Z"
            fill="oklch(0.62 0.22 27 / 10%)"
            stroke="oklch(0.62 0.22 27 / 35%)"
            strokeWidth={0.5}
            strokeDasharray="4 3"
          />
        )}

        {/* Flood Extent per Zone */}
        {mapLayers.zones &&
          zones.map((z) => (
            <g key={z.id}>
              <circle
                cx={z.center[0]}
                cy={-z.center[1]}
                r={z.radius}
                fill="oklch(0.55 0.13 240 / 14%)"
                stroke="oklch(0.6 0.13 240 / 40%)"
                strokeWidth={0.5}
                strokeDasharray="3 2"
              />
              <text
                x={z.center[0]}
                y={-z.center[1] - z.radius + 5}
                textAnchor="middle"
                fill="oklch(0.7 0.02 250)"
                fontSize={3.8}
                fontFamily="monospace"
              >
                {z.name} (depth: {floodDepthAt(step, z).toFixed(1)}m)
              </text>
            </g>
          ))}

        {/* Road Networks */}
        {mapLayers.roads &&
          roads.map((r) => {
            const closed = r.status === "blocked" || (r.closureAt !== null && r.closureAt <= step);
            const status = closed ? "blocked" : r.status;
            return (
              <polyline
                key={r.id}
                points={r.points.map(([x, z]) => `${x},${-z}`).join(" ")}
                fill="none"
                stroke={roadStroke[status]}
                strokeOpacity={0.65}
                strokeWidth={closed ? 1.8 : 1.2}
                strokeDasharray={closed ? "2 2" : undefined}
              />
            );
          })}

        {/* UAV Drone Sortie Flight Path Overlays */}
        {mapLayers.drones && (
          <g>
            <path
              d="M -70 -40 Q 0 -20 60 20"
              fill="none"
              stroke="oklch(0.72 0.17 240 / 70%)"
              strokeWidth={0.7}
              strokeDasharray="2 3"
            />
            <circle
              cx="60"
              cy="-20"
              r="14"
              fill="oklch(0.72 0.17 240 / 12%)"
              stroke="oklch(0.72 0.17 240 / 60%)"
              strokeWidth={0.4}
            />
            <text
              x="60"
              y="-36"
              textAnchor="middle"
              fill="oklch(0.72 0.17 240)"
              fontSize={3}
              fontFamily="monospace"
            >
              UAV SORTIE D-07 (Scanning)
            </text>
          </g>
        )}

        {/* Building Structures */}
        {visible.map((b) => {
          const flooded = isFlooded(b, step);
          const selected = b.id === selectedBuildingId;
          return (
            <rect
              key={b.id}
              x={b.x - b.w / 2}
              y={-b.z - b.d / 2}
              width={b.w}
              height={b.d}
              rx={0.6}
              fill={damageFill[b.damage]}
              fillOpacity={0.45 + b.confidence * 0.5}
              stroke={selected ? "var(--ring)" : flooded ? "oklch(0.7 0.13 240)" : "transparent"}
              strokeWidth={selected ? 1.6 : flooded ? 0.6 : 0}
              className="cursor-pointer transition-[stroke-width] duration-200"
              onMouseEnter={() => setHover(b)}
              onMouseLeave={() => setHover(null)}
              onClick={() => select(b.id)}
              tabIndex={-1}
            >
              <title>{`${b.id} · ${damageLabel[b.damage]} · ${Math.round(b.confidence * 100)}% confidence`}</title>
            </rect>
          );
        })}

        {/* Hospital Markers */}
        {mapLayers.hospitals &&
          hospitals.map((h) => {
            const b = buildings.find((x) => x.id === h.buildingId);
            if (!b) return null;
            return (
              <g
                key={h.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoverHospital(h)}
                onMouseLeave={() => setHoverHospital(null)}
                onClick={() => select(h.buildingId)}
              >
                <circle
                  cx={b.x}
                  cy={-b.z}
                  r="4.2"
                  fill="oklch(0.62 0.22 27)"
                  stroke="#ffffff"
                  strokeWidth="0.8"
                />
                <text
                  x={b.x}
                  y={-b.z + 1.4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="3.8"
                  fontWeight="bold"
                >
                  H
                </text>
              </g>
            );
          })}
      </svg>

      {/* Building Hover Dossier Tooltip */}
      {hover && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-popover/95 p-3 text-xs shadow-panel backdrop-blur max-w-xs">
          <p className="font-mono font-semibold">{hover.id}</p>
          <p className="mt-1">
            <span aria-hidden style={{ color: damageFill[hover.damage] }}>
              {damageGlyph[hover.damage]}
            </span>{" "}
            {damageLabel[hover.damage]} · {Math.round(hover.confidence * 100)}% confidence
          </p>
          <p className="text-muted-foreground capitalize">
            {hover.type} · {num(hover.occupancy)} occupants · elev {hover.elevation.toFixed(1)} m
          </p>
          {isFlooded(hover, step) && (
            <p className="mt-1 text-[11px] font-mono text-primary">● Inundated at step T+{step}h</p>
          )}
        </div>
      )}

      {/* Hospital Hover Tooltip */}
      {hoverHospital && (
        <div className="pointer-events-none absolute top-12 left-3 rounded-md border border-critical bg-popover/95 p-3 text-xs shadow-panel backdrop-blur max-w-xs">
          <p className="font-bold text-critical">{hoverHospital.name}</p>
          <p className="mt-0.5 text-muted-foreground">
            Beds: {hoverHospital.beds} · Occupancy: {hoverHospital.occupancyPct}%
          </p>
          <p className="mt-1 font-mono text-[11px]">
            Road Access: {hoverHospital.roadAccess.toUpperCase()}
          </p>
          <p className="text-[11px] text-critical">
            Power Fail Risk: {Math.round(hoverHospital.powerFailureProb * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}
