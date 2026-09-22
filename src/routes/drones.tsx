import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Battery,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Navigation,
  Plane,
  Radio,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { useOps } from "@/lib/ops-store";
import { logAuditAction } from "@/lib/audit-logger";

export const Route = createFileRoute("/drones")({
  head: () => ({
    meta: [
      { title: "Drone Mission Operations & Active Sensing — AegisVision AI" },
      {
        name: "description",
        content:
          "Autonomous UAV sortie tasking, active sensing candidate prioritization and live flight telemetry for Cyclone Vaayu.",
      },
    ],
  }),
  component: DronesPage,
});

interface DroneSortie {
  id: string;
  name: string;
  droneModel: string;
  zoneId: string;
  targetArea: string;
  objective: string;
  status: "capturing" | "en_route" | "approved" | "recommended" | "completed";
  priority: "critical" | "high" | "moderate";
  batteryPct: number;
  altitudeM: number;
  etaMinutes: number;
  framesCaptured: number;
}

interface ActiveSensingCandidate {
  id: string;
  structureId: string;
  zone: string;
  reason: string;
  uncertaintyScore: number; // 0..1
  consequenceScore: number; // 0..1
  expectedInfoGain: number; // 0..1
  priorityRank: number;
}

const initialSorties: DroneSortie[] = [
  {
    id: "SRT-07",
    name: "Sortie D-07 (Adyar Basin)",
    droneModel: "DJI Matrice 350 RTK",
    zoneId: "Z1",
    targetArea: "Adyar Bridge Corridor & BLD-203",
    objective: "Structural 4K photogrammetry & debris extent mapping",
    status: "capturing",
    priority: "critical",
    batteryPct: 68,
    altitudeM: 110,
    etaMinutes: 12,
    framesCaptured: 1184,
  },
  {
    id: "SRT-08",
    name: "Sortie D-08 (Marina Coast)",
    droneModel: "Skydio X10 Dual Thermal",
    zoneId: "Z3",
    targetArea: "Coastal Inundation Surge Front",
    objective: "FLIR thermal survivor search along beach road",
    status: "en_route",
    priority: "critical",
    batteryPct: 84,
    altitudeM: 95,
    etaMinutes: 22,
    framesCaptured: 420,
  },
  {
    id: "SRT-09",
    name: "Sortie D-09 (Ambattur Industrial)",
    droneModel: "WingtraOne GEN II VTOL",
    zoneId: "Z4",
    targetArea: "Industrial Chemical Cluster Roofs",
    objective: "Multispectral toxic leak and roof collapse sweep",
    status: "approved",
    priority: "high",
    batteryPct: 98,
    altitudeM: 140,
    etaMinutes: 35,
    framesCaptured: 0,
  },
  {
    id: "SRT-10",
    name: "Sortie D-10 (Velachery)",
    droneModel: "DJI Matrice 30T",
    zoneId: "Z2",
    targetArea: "Substation 2 & Hospital Road Junction",
    objective: "Substation water level validation",
    status: "recommended",
    priority: "high",
    batteryPct: 100,
    altitudeM: 0,
    etaMinutes: 0,
    framesCaptured: 0,
  },
];

const initialCandidates: ActiveSensingCandidate[] = [
  {
    id: "ASC-1",
    structureId: "BLD-118",
    zone: "Zone 1 · Adyar Basin",
    reason: "Severe disagreement between satellite shadow analysis and social reports",
    uncertaintyScore: 0.88,
    consequenceScore: 0.92,
    expectedInfoGain: 0.95,
    priorityRank: 1,
  },
  {
    id: "ASC-2",
    structureId: "BLD-402",
    zone: "Zone 4 · Ambattur",
    reason: "Industrial roof collapse suspected near hazardous solvent storage",
    uncertaintyScore: 0.79,
    consequenceScore: 0.89,
    expectedInfoGain: 0.86,
    priorityRank: 2,
  },
  {
    id: "ASC-3",
    structureId: "HSP-4",
    zone: "Zone 2 · Velachery",
    reason: "Access road flood depth unknown due to tree canopy obstruction",
    uncertaintyScore: 0.74,
    consequenceScore: 0.95,
    expectedInfoGain: 0.82,
    priorityRank: 3,
  },
];

function DronesPage() {
  const { role } = useOps();
  const [sorties, setSorties] = useState<DroneSortie[]>(initialSorties);
  const [candidates] = useState<ActiveSensingCandidate[]>(initialCandidates);

  const dispatchSortie = (sortieId: string) => {
    setSorties((prev) =>
      prev.map((s) => (s.id === sortieId ? { ...s, status: "en_route" as const } : s)),
    );

    logAuditAction({
      operatorRole: role,
      operatorName: "UAV Flight Controller",
      action: `Dispatched UAV Sortie ${sortieId}`,
      category: "sortie",
      details: `Authorized autonomous drone flight plan for ${sortieId}`,
      targetId: sortieId,
      approved: true,
    });

    toast.success(`UAV Sortie ${sortieId} dispatched to mission airspace`);
  };

  const approveCandidate = (cand: ActiveSensingCandidate) => {
    const newSortie: DroneSortie = {
      id: `SRT-${sorties.length + 7}`,
      name: `Sortie D-${sorties.length + 7} (${cand.structureId})`,
      droneModel: "DJI Matrice 350 RTK",
      zoneId: cand.zone.split(" · ")[0] ?? "Z1",
      targetArea: `${cand.structureId} Priority Re-inspection`,
      objective: cand.reason,
      status: "approved",
      priority: "high",
      batteryPct: 100,
      altitudeM: 100,
      etaMinutes: 28,
      framesCaptured: 0,
    };

    setSorties((prev) => [newSortie, ...prev]);

    logAuditAction({
      operatorRole: role,
      operatorName: "Active Sensing Tasking",
      action: `Approved Targeted UAV Re-inspection for ${cand.structureId}`,
      category: "sortie",
      details: `Generated UAV flight plan targeting high-uncertainty asset ${cand.structureId}`,
      targetId: cand.structureId,
      approved: true,
    });

    toast.success(`Active sensing inspection task scheduled for ${cand.structureId}`);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                Drone Mission Operations & Active Sensing
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-directed UAV asset tasking. Convert high-uncertainty epistemic gaps into targeted
              flight missions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-safe/10 border border-safe/30 text-safe text-xs font-mono px-2.5 py-1 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 animate-pulse-slow" />
              <span>AIRSPACE COMMAND SECURE</span>
            </span>
          </div>
        </div>

        {/* Telemetry StatCards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active UAV Sorties"
            value={`${sorties.filter((s) => s.status === "capturing" || s.status === "en_route").length} Airborne`}
            sub={`${sorties.length} total missions in fleet`}
            icon={Plane}
            updated="Live Telemetry"
          />
          <StatCard
            label="Frames Ingested Today"
            value="18,904"
            sub="4K photogrammetry & FLIR thermal"
            icon={Camera}
            tone="safe"
            updated="Fused Realtime"
          />
          <StatCard
            label="Active Sensing Candidates"
            value={candidates.length.toString()}
            sub="High uncertainty + high consequence"
            tone="warning"
            icon={Sparkles}
            updated="Evaluated"
          />
          <StatCard
            label="Mean Fleet Battery"
            value="87%"
            sub="All active platforms above 40% margin"
            icon={Battery}
            tone="safe"
            updated="12s ago"
          />
        </div>

        {/* Dual Layout: Sortie Queue & Active Sensing Candidates */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Active Drone Sorties */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Navigation className="h-4 w-4 text-primary" />
              <span>UAV Sortie Flight Operations Board</span>
            </h2>

            <div className="space-y-3">
              {sorties.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-border p-3.5 bg-panel-elevated/40 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {s.name}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({s.droneModel})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {s.targetArea}
                      </p>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase font-bold ${
                        s.status === "capturing"
                          ? "bg-primary/20 text-primary border border-primary/40 animate-pulse-slow"
                          : s.status === "en_route"
                            ? "bg-warning/20 text-warning border border-warning/40"
                            : s.status === "approved"
                              ? "bg-safe/20 text-safe border border-safe/40"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/90 bg-panel/60 p-2 rounded border border-border/40">
                    <strong>Objective:</strong> {s.objective}
                  </p>

                  <div className="grid grid-cols-4 gap-2 text-[11px] font-mono text-muted-foreground border-t border-border/40 pt-2">
                    <div>
                      <span className="block label-mono text-[9px]">Battery</span>
                      <span className="text-foreground font-semibold flex items-center gap-1">
                        <Battery className="h-3 w-3 text-safe" />
                        <span>{s.batteryPct}%</span>
                      </span>
                    </div>
                    <div>
                      <span className="block label-mono text-[9px]">Altitude</span>
                      <span className="text-foreground font-semibold">{s.altitudeM} m AGL</span>
                    </div>
                    <div>
                      <span className="block label-mono text-[9px]">Mission Time</span>
                      <span className="text-foreground font-semibold">ETA {s.etaMinutes} min</span>
                    </div>
                    <div>
                      <span className="block label-mono text-[9px]">Ingested Frames</span>
                      <span className="text-foreground font-semibold">{s.framesCaptured}</span>
                    </div>
                  </div>

                  {s.status === "recommended" && (
                    <div className="pt-1">
                      <button
                        onClick={() => dispatchSortie(s.id)}
                        className="w-full flex items-center justify-center gap-1.5 rounded bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Authorize UAV Flight Dispatch</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Uncertainty-Driven Active Sensing Recommendations */}
          <div className="panel p-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ai" />
                <span>Active Sensing Recommendations</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI algorithm flags high consequence assets where acquiring new drone data maximizes
                decision confidence.
              </p>
            </div>

            <div className="space-y-3">
              {candidates.map((cand) => (
                <div
                  key={cand.id}
                  className="rounded-md border border-border p-3 bg-panel-elevated/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">
                      {cand.structureId}
                    </span>
                    <span className="label-mono text-[9px] text-warning font-bold">
                      Priority Rank #{cand.priorityRank}
                    </span>
                  </div>

                  <p className="text-[11px] text-foreground leading-relaxed">{cand.reason}</p>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-1.5">
                    <div>
                      <span>Uncertainty: </span>
                      <span className="text-warning font-semibold">
                        {Math.round(cand.uncertaintyScore * 100)}%
                      </span>
                    </div>
                    <div>
                      <span>Info Gain: </span>
                      <span className="text-safe font-semibold">
                        {Math.round(cand.expectedInfoGain * 100)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => approveCandidate(cand)}
                    className="w-full rounded border border-primary/50 bg-primary/10 py-1 text-center text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Task Targeted UAV Sortie
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
