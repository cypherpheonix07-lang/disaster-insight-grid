import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileDown,
  LifeBuoy,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { roads, zones, evacuationPlan, unsafeRoads } from "@/data/incident";
import { useOps } from "@/lib/ops-store";
import { logAuditAction } from "@/lib/audit-logger";

export const Route = createFileRoute("/routing")({
  head: () => ({
    meta: [
      { title: "Emergency Routing & Evacuation Planning — AegisVision AI" },
      {
        name: "description",
        content:
          "Dynamic obstacle avoidance, emergency vehicle rerouting and phased civilian evacuation wave planning for Cyclone Vaayu.",
      },
    ],
  }),
  component: RoutingPage,
});

interface RouteSolution {
  id: string;
  destination: string;
  vehicleType: "Ambulance" | "Heavy Rescue" | "Zodiac Boat";
  status: "rerouted" | "nominal" | "blocked";
  primaryPath: string;
  recommendedBypass: string;
  etaPrimary: string;
  etaBypass: string;
  hazardNote: string;
}

const routeSolutions: RouteSolution[] = [
  {
    id: "RT-01",
    destination: "Apollo Greams Road (HSP-1)",
    vehicleType: "Ambulance",
    status: "rerouted",
    primaryPath: "Anna Salai → Adyar Bridge Link",
    recommendedBypass: "GST Road Bypass → Kathipara Flyover",
    etaPrimary: "Impassable (Blocked)",
    etaBypass: "18 min (+9 min delta)",
    hazardNote: "Adyar Bridge submerged under 2.4m flood water & concrete debris",
  },
  {
    id: "RT-02",
    destination: "Fortis Malar (HSP-3)",
    vehicleType: "Ambulance",
    status: "rerouted",
    primaryPath: "ECR Coastal Expressway",
    recommendedBypass: "OMR Corridor Inland Arterial",
    etaPrimary: "Impassable (Blocked)",
    etaBypass: "22 min (+12 min delta)",
    hazardNote: "Coastal storm surge has washed out 80m of coastal embankment",
  },
  {
    id: "RT-03",
    destination: "Anna University Evacuation Shelter",
    vehicleType: "Heavy Rescue",
    status: "nominal",
    primaryPath: "Inner Ring Road Arterial",
    recommendedBypass: "Direct transit cleared",
    etaPrimary: "14 min",
    etaBypass: "14 min",
    hazardNote: "Minor surface ponding (<0.3m); safe for high-clearance rescue vehicles",
  },
];

function RoutingPage() {
  const { step, role } = useOps();
  const [selectedZone, setSelectedZone] = useState("Z3");
  const evacPlan = evacuationPlan(selectedZone);
  const unsafe = unsafeRoads(step);

  const authorizeEvacuation = () => {
    logAuditAction({
      operatorRole: role,
      operatorName: "Evacuation Incident Director",
      action: `Authorized Phased Evacuation Waves for ${evacPlan.zone}`,
      category: "evacuation",
      details: `Dispatched sirens and mobile SMS geo-alerts for ${evacPlan.waves.length} waves`,
      targetId: selectedZone,
      approved: true,
    });
    toast.success(`Evacuation protocol authorized for ${evacPlan.zone}`);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                Emergency Routing & Evacuation Planning
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live hydrological obstacle avoidance, multi-corridor transit analysis and phased
              population evacuation wave dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono px-2.5 py-1">
              ROUTING ENGINE: FLOOD AWARE
            </span>
          </div>
        </div>

        {/* Telemetry StatCards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Monitored Road Corridors"
            value={`${roads.length} Arterials`}
            sub={`${roads.filter((r) => r.status === "open").length} open · ${unsafe.length} compromised`}
            icon={RouteIcon}
            tone="warning"
            updated="1 min ago"
          />
          <StatCard
            label="Active Reroute Solutions"
            value="3 Active Bypasses"
            sub="Average bypass penalty: +9.5 mins"
            icon={Compass}
            tone="safe"
            updated="Calculated"
          />
          <StatCard
            label="Evacuation Wave Target"
            value={evacPlan.population.toLocaleString()}
            sub={`Citizens across ${evacPlan.zone}`}
            icon={Users}
            tone="critical"
            updated="Nominal"
          />
          <StatCard
            label="Safe Shelter Havens"
            value={`${evacPlan.shelters.length} Facilities`}
            sub="Total assigned capacity: 1,800"
            icon={Shield}
            tone="safe"
            updated="Pre-allocated"
          />
        </div>

        {/* Dual Layout: Live Vehicle Reroute Solutions + Evacuation Waves */}
        <div className="grid gap-4 xl:grid-cols-2">
          {/* Section 1: Emergency Vehicle Reroutes */}
          <div className="panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <span>Emergency Vehicle Reroute Solutions</span>
              </h2>
              <span className="label-mono text-[10px]">Realtime Obstacle Avoidance</span>
            </div>

            <div className="space-y-3">
              {routeSolutions.map((sol) => (
                <div
                  key={sol.id}
                  className="rounded-md border border-border p-3.5 bg-panel-elevated/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {sol.id} · {sol.vehicleType}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{sol.destination}</h3>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase font-bold ${
                        sol.status === "rerouted"
                          ? "border border-warning/50 bg-warning/15 text-warning"
                          : "border border-safe/40 bg-safe/10 text-safe"
                      }`}
                    >
                      {sol.status === "rerouted" ? "▲ REROUTED VIA BYPASS" : "● NOMINAL TRANSIT"}
                    </span>
                  </div>

                  <div className="rounded bg-panel/70 p-2 text-xs space-y-1 border border-border/40 font-mono">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>
                        Primary: <span className="line-through">{sol.primaryPath}</span>
                      </span>
                      <span className="text-critical">{sol.etaPrimary}</span>
                    </div>
                    <div className="flex items-center justify-between text-foreground font-semibold">
                      <span className="text-safe flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        <span>Bypass: {sol.recommendedBypass}</span>
                      </span>
                      <span className="text-safe">{sol.etaBypass}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                    <span>{sol.hazardNote}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Evacuation Planning Workspace */}
          <div className="panel p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Phased Evacuation Waves ({evacPlan.zone})</span>
              </h2>

              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="rounded border border-border bg-panel px-2 py-1 text-xs text-foreground focus:outline-none"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-muted-foreground">
              Timed evacuation sequencing to prevent arterial gridlock and bottleneck crushes during
              rising surge.
            </p>

            <div className="space-y-2.5">
              {evacPlan.waves.map((w) => (
                <div
                  key={w.wave}
                  className="rounded-md border border-border p-3 bg-panel-elevated/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">
                      Wave {w.wave}: {w.focus}
                    </span>
                    <span className="font-mono text-xs text-primary font-bold">{w.window}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>
                      Target Population: <strong>{w.people.toLocaleString()}</strong> residents
                    </span>
                    <span className="text-safe">
                      Corridor: {evacPlan.routes[0] || "Inner Ring Rd"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded border border-border p-3 bg-panel/60 space-y-1.5 text-xs font-mono">
              <span className="label-mono text-[9px]">Assigned Destination Shelters:</span>
              {evacPlan.shelters.map((sh, idx) => (
                <div key={idx} className="flex justify-between text-foreground">
                  <span>
                    {sh.id} ({sh.zone})
                  </span>
                  <span className="text-muted-foreground">Capacity: {sh.capacity} beds</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={authorizeEvacuation}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Shield className="h-4 w-4" />
                <span>Authorize Phased Evacuation Protocol</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
