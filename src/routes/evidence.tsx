import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileCheck,
  Filter,
  Layers,
  Scale,
  Shield,
  Sparkles,
  Split,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { evidenceCases, buildings, type EvidenceCase, type DamageState } from "@/data/incident";
import { damageFill, damageGlyph, damageLabel, pct } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { logAuditAction } from "@/lib/audit-logger";

export const Route = createFileRoute("/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Intelligence & Provenance — AegisVision AI" },
      {
        name: "description",
        content:
          "Multimodal evidence provenance, source reliability metrics, and human-in-the-loop conflict resolution workspace.",
      },
    ],
  }),
  component: EvidencePage,
});

function EvidencePage() {
  const { select, role } = useOps();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("BLD-118");
  const [casesList, setCasesList] = useState<EvidenceCase[]>(evidenceCases);
  const [filterConflictOnly, setFilterConflictOnly] = useState(false);

  const activeCase = casesList.find((c) => c.buildingId === selectedCaseId) || casesList[0]!;
  const building = buildings.find((b) => b.id === activeCase.buildingId);

  const resolveConflict = (verdict: DamageState) => {
    setCasesList((prev) =>
      prev.map((c) =>
        c.buildingId === activeCase.buildingId
          ? { ...c, verdict, conflict: false, agreement: 0.95 }
          : c,
      ),
    );

    logAuditAction({
      operatorRole: role,
      operatorName: "Human-in-the-Loop Override",
      action: `Resolved Evidence Conflict on ${activeCase.buildingId}`,
      category: "resolution",
      details: `Operator overrode evidence disagreement and assigned final verdict: ${damageLabel[verdict].toUpperCase()}`,
      targetId: activeCase.buildingId,
      approved: true,
    });

    toast.success(
      `Conflict resolved: ${activeCase.buildingId} classified as ${damageLabel[verdict]}`,
    );
  };

  const displayedCases = filterConflictOnly ? casesList.filter((c) => c.conflict) : casesList;

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-ai" />
              <h1 className="text-xl font-bold tracking-tight">
                Evidence Provenance & Conflict Matrix
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Explainable multimodal observation audit trail. Detect, compare, and resolve
              inter-agent sensor disagreements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterConflictOnly(!filterConflictOnly)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                filterConflictOnly
                  ? "border-warning bg-warning/15 text-warning font-semibold"
                  : "border-border hover:bg-accent text-muted-foreground"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Show Conflicts Only</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Monitored Evidence Cases"
            value={num(casesList.length)}
            sub="Fused multi-sensor dossiers"
            icon={Layers}
            updated="12s ago"
          />
          <StatCard
            label="Active Evidence Conflicts"
            value={num(casesList.filter((c) => c.conflict).length)}
            sub="Disagreements between drone and social"
            tone="warning"
            icon={Scale}
            updated="Realtime"
          />
          <StatCard
            label="Inter-Source Agreement"
            value={pct(casesList.reduce((s, c) => s + c.agreement, 0) / casesList.length)}
            sub="Consensus metric across 4 streams"
            icon={CheckCircle2}
            updated="1 min ago"
          />
          <StatCard
            label="Human Overrides"
            value="14 Resolved"
            sub="Logged to verifiable audit trail"
            icon={FileCheck}
            tone="safe"
            updated="Nominal"
          />
        </div>

        {/* Workspace Dual Layout */}
        <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
          {/* Left: Cases Registry */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Scale className="h-4 w-4 text-primary" />
              <span>Structure Evidence Dossiers</span>
            </h2>

            <div className="space-y-2">
              {displayedCases.map((c) => (
                <div
                  key={c.buildingId}
                  onClick={() => setSelectedCaseId(c.buildingId)}
                  className={`rounded-md border p-3 cursor-pointer transition-colors ${
                    c.buildingId === activeCase.buildingId
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {c.buildingId}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        c.conflict
                          ? "border border-warning/50 bg-warning/15 text-warning animate-pulse-slow"
                          : "border border-safe/40 bg-safe/10 text-safe"
                      }`}
                    >
                      {c.conflict ? "⚠ CONFLICT" : "VERIFIED"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Verdict: {damageLabel[c.verdict]}</span>
                    <span className="font-mono">{Math.round(c.finalConfidence * 100)}% conf</span>
                  </div>

                  <div className="mt-2 text-[10px] label-mono text-muted-foreground flex justify-between border-t border-border/40 pt-1">
                    <span>{c.sources.length} sensor feeds</span>
                    <span>Agreement: {Math.round(c.agreement * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Detailed Provenance & Conflict Inspector */}
          <div className="space-y-4">
            <div className="panel p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {activeCase.buildingId}
                    </span>
                    <span
                      className="rounded border px-2 py-0.5 text-xs font-semibold uppercase"
                      style={{
                        borderColor: damageFill[activeCase.verdict],
                        color: damageFill[activeCase.verdict],
                        backgroundColor: `${damageFill[activeCase.verdict]}15`,
                      }}
                    >
                      {damageGlyph[activeCase.verdict]} {damageLabel[activeCase.verdict]}
                    </span>
                    {activeCase.conflict && (
                      <span className="rounded bg-warning/20 border border-warning/40 px-2 py-0.5 text-[11px] font-mono text-warning font-bold">
                        ATTENTION: UNRESOLVED CONFLICT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Structure Type: {building?.type ?? "residential"} · Zone: {building?.zoneId} ·
                    Elev {building?.elevation.toFixed(1)}m
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/twin"
                    onClick={() => select(activeCase.buildingId)}
                    className="rounded bg-secondary hover:bg-accent px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    View in 3D Twin
                  </Link>
                </div>
              </div>

              {/* Conflict Explanation Alert */}
              {activeCase.conflict ? (
                <div className="rounded-md border border-warning/50 bg-warning/10 p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-warning font-bold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Evidence Disagreement Detected</span>
                  </div>
                  <p className="text-foreground leading-relaxed">
                    UAV high-resolution photogrammetry reports standing water with intact structural
                    frame (Major Damage), while citizen social media posts report complete collapse.
                    AI Supervisor has downweighted social signal due to high spatial geolocation
                    variance.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-safe/40 bg-safe/10 p-3 text-xs flex items-center gap-2 text-safe">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Evidence consensus verified: all active sensor streams corroborate structural
                    verdict.
                  </span>
                </div>
              )}

              {/* Multi-Source Comparison Table */}
              <div>
                <p className="label-mono mb-2">Multimodal Sensor Observations</p>
                <div className="space-y-2">
                  {activeCase.sources.map((s, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-border p-3 bg-panel-elevated/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-foreground">
                          <span className="capitalize text-primary font-mono font-bold">
                            [{s.source}]
                          </span>
                          <span>{s.label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {s.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/90">{s.observation}</p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground border-t border-border/40 pt-1">
                        <span>Confidence: {Math.round(s.confidence * 100)}%</span>
                        <span>Source Reliability: {Math.round(s.reliability * 100)}%</span>
                        <span className={s.agrees ? "text-safe" : "text-critical"}>
                          {s.agrees ? "✓ Corroborates Verdict" : "✕ Disagrees"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Reasoning Timeline */}
              <div>
                <p className="label-mono mb-2">Multimodal Processing Chronology</p>
                <div className="rounded-md border border-border p-3 bg-panel-elevated/40">
                  <ol className="relative border-l border-border/80 ml-2 space-y-3 pl-4 text-xs">
                    {activeCase.timeline.map((step, i) => (
                      <li key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-primary font-bold">
                            {step.t}
                          </span>
                          <span className="font-semibold text-foreground">
                            [{step.agent} Agent]
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">{step.event}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Human in the loop override controls */}
              <div className="rounded-md border border-border p-3.5 bg-panel-elevated/60 space-y-2">
                <p className="label-mono text-foreground font-semibold">
                  Human-in-the-Loop Override Decision
                </p>
                <p className="text-xs text-muted-foreground">
                  As an authorized operator ({role}), you can overrule model predictions and
                  adjudicate evidence conflicts. Your action will be permanently recorded in the
                  incident audit log.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => resolveConflict("destroyed")}
                    className="rounded border border-critical/50 bg-critical/15 py-1.5 text-xs font-semibold text-critical hover:bg-critical/25 transition-colors"
                  >
                    Adjudicate: DESTROYED
                  </button>
                  <button
                    onClick={() => resolveConflict("major")}
                    className="rounded border border-warning/50 bg-warning/15 py-1.5 text-xs font-semibold text-warning hover:bg-warning/25 transition-colors"
                  >
                    Adjudicate: MAJOR
                  </button>
                  <button
                    onClick={() => resolveConflict("minor")}
                    className="rounded border border-border bg-panel py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                  >
                    Adjudicate: MINOR
                  </button>
                  <button
                    onClick={() => resolveConflict("intact")}
                    className="rounded border border-safe/50 bg-safe/15 py-1.5 text-xs font-semibold text-safe hover:bg-safe/25 transition-colors"
                  >
                    Adjudicate: INTACT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
