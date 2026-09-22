import { X } from "lucide-react";
import {
  buildingById,
  evidenceCases,
  getZone,
  isFlooded,
  type Building,
  type EvidenceCase,
} from "@/data/incident";
import { damageFill, damageGlyph, damageLabel, num, pct } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function synthEvidence(b: Building): EvidenceCase {
  const c = b.confidence;
  return {
    buildingId: b.id,
    verdict: b.damage,
    finalConfidence: c,
    agreement: 0.6 + c * 0.35,
    conflict: c < 0.85,
    sources: [
      {
        source: "satellite",
        label: "Sentinel-2 · latest pass",
        observation: `Roof-plane change consistent with ${damageLabel[b.damage].toLowerCase()}`,
        confidence: Math.min(0.97, c - 0.03),
        reliability: 0.9,
        timestamp: "15:10 UTC",
        agrees: true,
      },
      {
        source: "drone",
        label: "UAV sortie · nearest frame",
        observation: `Façade inspection; standing water ${isFlooded(b, 0) ? "present" : "not observed"}`,
        confidence: Math.min(0.98, c + 0.04),
        reliability: 0.95,
        timestamp: "15:32 UTC",
        agrees: true,
      },
      {
        source: "social",
        label: "Geo-verified citizen reports",
        observation: "Citizen imagery partially corroborates; geotag spread 60 m",
        confidence: Math.max(0.45, c - 0.18),
        reliability: 0.58,
        timestamp: "15:41 UTC",
        agrees: c >= 0.85,
      },
    ],
    timeline: [
      { t: "14:52", agent: "Satellite", event: "Structure flagged for review" },
      { t: "15:32", agent: "Drone", event: "High-resolution inspection captured" },
      { t: "15:41", agent: "Social", event: "Citizen reports geo-matched" },
      {
        t: "15:44",
        agent: "Damage",
        event: `Classified ${damageLabel[b.damage].toUpperCase()} (${pct(c)})`,
      },
      { t: "15:45", agent: "Supervisor", event: "Decision accepted into response plan" },
    ],
  };
}

export function BuildingPanel() {
  const { selectedBuildingId, select, step } = useOps();
  if (!selectedBuildingId) return null;
  const b = buildingById[selectedBuildingId];
  if (!b) return null;

  const zone = getZone(b.zoneId);
  const ev = evidenceCases.find((c) => c.buildingId === b.id) ?? synthEvidence(b);
  const flooded = isFlooded(b, step);
  const risk = Math.round(
    Math.min(
      100,
      ({ intact: 12, minor: 38, major: 74, destroyed: 94 }[b.damage] ?? 20) + (flooded ? 6 : 0),
    ),
  );

  return (
    <aside
      className="panel sticky top-[4.5rem] flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden"
      aria-label={`Building intelligence for ${b.id}`}
    >
      <div className="flex items-start gap-2 border-b border-border p-3">
        <div>
          <p className="font-mono text-sm font-semibold">{b.id}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {b.type} · {zone?.name ?? b.zoneId}
          </p>
        </div>
        <button
          onClick={() => select(null)}
          className="ml-auto rounded-md p-1.5 hover:bg-accent"
          aria-label="Close building panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <div className="panel-elevated p-3">
          <p className="label-mono">Damage assessment</p>
          <p className="mt-1 text-lg font-semibold">
            <span aria-hidden style={{ color: damageFill[b.damage] }}>
              {damageGlyph[b.damage]}{" "}
            </span>
            {damageLabel[b.damage]}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Confidence" value={pct(b.confidence)} />
            <Stat label="Structural risk" value={`${risk}/100`} />
            <Stat label="Occupancy" value={num(b.occupancy)} />
            <Stat label="Ground elevation" value={`${b.elevation.toFixed(1)} m`} />
            <Stat label="Flood state" value={flooded ? "Inundated" : "Dry"} />
            <Stat label="Agreement" value={pct(ev.agreement)} />
          </div>
        </div>

        <Tabs defaultValue="evidence">
          <TabsList className="w-full">
            <TabsTrigger value="evidence" className="flex-1">
              Evidence
            </TabsTrigger>
            <TabsTrigger value="impact" className="flex-1">
              Impact
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1">
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evidence" className="space-y-2">
            {ev.conflict && (
              <p className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
                Sources disagree — human review recommended before tasking.
              </p>
            )}
            {ev.sources.map((s) => (
              <div key={s.source} className="rounded-md border border-border p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="label-mono capitalize">{s.source}</span>
                  <span className={s.agrees ? "text-safe" : "text-critical"}>
                    {s.agrees ? "✓ concurs" : "✕ conflicts"}
                  </span>
                </div>
                <p className="mt-1 text-foreground">{s.observation}</p>
                <p className="mt-1 text-muted-foreground">
                  {s.label} · confidence {pct(s.confidence)} · reliability {pct(s.reliability)} ·{" "}
                  {s.timestamp}
                </p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="impact" className="space-y-2 text-xs">
            <Row k="Zone population" v={num(zone?.population ?? 0)} />
            <Row k="Zone flood depth" v={`${(zone?.floodDepth ?? 0).toFixed(1)} m`} />
            <Row k="Zone damage index" v={pct(zone?.damageIndex ?? 0)} />
            <Row k="Accessibility" v={flooded ? "Blocked (standing water)" : "Reachable"} />
            <Row
              k="Critical function"
              v={
                b.type === "hospital"
                  ? "Emergency ward, ICU"
                  : b.type === "shelter"
                    ? "Relief shelter"
                    : "—"
              }
            />
            <Row
              k="Consequence"
              v={
                b.type === "hospital"
                  ? "Emergency services disrupted in 5 km radius"
                  : "Local displacement"
              }
            />
          </TabsContent>

          <TabsContent value="timeline">
            <ol className="space-y-2 border-l border-border pl-3 text-xs">
              {ev.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[1.05rem] top-1 h-2 w-2 rounded-full bg-primary"
                    aria-hidden
                  />
                  <span className="label-mono">
                    {t.t} · {t.agent}
                  </span>
                  <p>{t.event}</p>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
        <button
          className="rounded-md bg-primary px-2 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          onClick={() => toast.success(`Inspection task assigned for ${b.id}`)}
        >
          Assign inspection
        </button>
        <button
          className="rounded-md bg-critical px-2 py-2 text-xs font-medium text-critical-foreground hover:bg-critical/90"
          onClick={() => toast.success(`Responders alerted for ${b.id}`)}
        >
          Alert responders
        </button>
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <p className="label-mono">{label}</p>
      <p className="tabular mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
