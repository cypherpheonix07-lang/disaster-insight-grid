import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Ambulance,
  CheckCircle2,
  Clock,
  Compass,
  LifeBuoy,
  MapPin,
  Route as RouteIcon,
  Send,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { allocations, resourceInventory, zones } from "@/data/incident";
import { severityClass, severityLabel } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { logAuditAction } from "@/lib/audit-logger";

export const Route = createFileRoute("/response")({
  head: () => ({
    meta: [
      { title: "Tactical Response Planning — AegisVision AI" },
      {
        name: "description",
        content:
          "Tactical resource allocation, rescue team tasking, ambulance staging and emergency response dispatch optimization for Cyclone Vaayu.",
      },
    ],
  }),
  component: ResponsePage,
});

function ResponsePage() {
  const { role, setSelectedZoneId } = useOps();
  const [allocationList, setAllocationList] = useState(allocations);

  const totalAssignedTeams = allocationList.reduce((s, a) => s + a.rescueTeams, 0);
  const totalAssignedAmbulances = allocationList.reduce((s, a) => s + a.ambulances, 0);
  const totalAssignedBoats = allocationList.reduce((s, a) => s + a.boats, 0);
  const totalAssignedMedics = allocationList.reduce((s, a) => s + a.medics, 0);

  const confirmDispatch = (zoneId: string) => {
    const alloc = allocationList.find((a) => a.zoneId === zoneId);
    if (!alloc) return;

    logAuditAction({
      operatorRole: role,
      operatorName: "Tactical Operations Chief",
      action: `Confirmed Tactical Emergency Dispatch to ${zoneId}`,
      category: "dispatch",
      details: `Dispatched ${alloc.rescueTeams} Rescue Teams, ${alloc.ambulances} Ambulances, and ${alloc.boats} Boats. Target ETA: ${alloc.eta}`,
      targetId: zoneId,
      approved: true,
    });

    toast.success(`Tactical dispatch confirmed for ${zoneId}. Responders mobilized!`);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                Tactical Response Planning & Dispatch
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI-optimized emergency asset distribution. Balance demand, flood risk, and road
              accessibility across 5 response sectors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/routing"
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary hover:bg-accent px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              <RouteIcon className="h-3.5 w-3.5" />
              <span>Emergency Route Intelligence</span>
            </Link>
          </div>
        </div>

        {/* Resource Inventory vs Allocation Balance */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Rescue Teams"
            value={`${totalAssignedTeams} / ${resourceInventory.rescueTeams}`}
            sub={`${resourceInventory.rescueTeams - totalAssignedTeams} teams in reserve`}
            icon={Truck}
            tone={totalAssignedTeams === resourceInventory.rescueTeams ? "warning" : "safe"}
            updated="Live Roster"
          />
          <StatCard
            label="Emergency Ambulances"
            value={`${totalAssignedAmbulances} / ${resourceInventory.ambulances}`}
            sub={`${resourceInventory.ambulances - totalAssignedAmbulances} units standing by`}
            icon={Ambulance}
            tone="critical"
            updated="Staged"
          />
          <StatCard
            label="Rescue Boats (Inundation)"
            value={`${totalAssignedBoats} / ${resourceInventory.boats}`}
            sub="Pre-positioned in Zones 1 and 3"
            icon={LifeBuoy}
            tone="safe"
            updated="Deployed"
          />
          <StatCard
            label="Emergency Medics"
            value={`${totalAssignedMedics} / ${resourceInventory.medics}`}
            sub="Field trauma & triage personnel"
            icon={Shield}
            tone="safe"
            updated="Active Shift"
          />
        </div>

        {/* Zone Tasking Cards */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Sector Tasking & Resource Allocation Plans</span>
            </h2>
            <span className="label-mono text-[10px]">
              Optimization Solver: Nominal (Confidence 88%)
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {allocationList.map((a) => {
              const zone = zones.find((z) => z.id === a.zoneId);
              return (
                <div
                  key={a.zoneId}
                  className="rounded-md border border-border p-4 bg-panel-elevated/40 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary">{a.zoneId}</span>
                        <h3 className="text-sm font-bold text-foreground">
                          {zone?.name ?? a.zoneId}
                        </h3>
                      </div>
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] uppercase font-bold ${severityClass[a.priority]}`}
                      >
                        {severityLabel[a.priority]}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-xs border-y border-border/40 py-2 bg-panel/60 rounded">
                      <div>
                        <span className="block text-[9px] label-mono">Teams</span>
                        <span className="font-bold text-foreground">{a.rescueTeams}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] label-mono">Ambulances</span>
                        <span className="font-bold text-foreground">{a.ambulances}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] label-mono">Boats</span>
                        <span className="font-bold text-foreground">{a.boats}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] label-mono">Medics</span>
                        <span className="font-bold text-foreground">{a.medics}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="label-mono text-[9px] text-muted-foreground">
                        Tactical Justification:
                      </span>
                      <p className="text-foreground/90 leading-relaxed text-[11px] bg-panel/40 p-2 rounded border border-border/30">
                        {a.reason}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                      <span>
                        Transit ETA: <strong className="text-primary">{a.eta}</strong>
                      </span>
                      <span>Flood Depth: {zone?.floodDepth.toFixed(1)}m</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <button
                      onClick={() => confirmDispatch(a.zoneId)}
                      className="w-full flex items-center justify-center gap-1.5 rounded bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Confirm Tactical Dispatch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
