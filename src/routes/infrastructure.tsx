import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building,
  CheckCircle2,
  Droplets,
  Hospital,
  Power,
  Shield,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { hospitals, zones } from "@/data/incident";
import { num, severityClass, severityLabel } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { logAuditAction } from "@/lib/audit-logger";

export const Route = createFileRoute("/infrastructure")({
  head: () => ({
    meta: [
      { title: "Critical Infrastructure Command — AegisVision AI" },
      {
        name: "description",
        content:
          "Operational telemetry for hospitals, power substations, water treatment facilities and emergency shelters during Cyclone Vaayu.",
      },
    ],
  }),
  component: InfrastructurePage,
});

const powerSubstations = [
  {
    id: "PWR-01",
    name: "Taramani 230kV Substation",
    zoneId: "Z2",
    status: "operational",
    loadPct: 88,
    floodExposure: 0.8,
    backupFuelHours: 36,
    criticalFeeders: ["Apollo Greams Road", "Velachery Water Pump"],
  },
  {
    id: "PWR-02",
    name: "Adyar 110kV Substation",
    zoneId: "Z1",
    status: "compromised",
    loadPct: 42,
    floodExposure: 2.1,
    backupFuelHours: 14,
    criticalFeeders: ["Fortis Malar", "Adyar Pumping Station"],
  },
  {
    id: "PWR-03",
    name: "Ambattur Industrial Substation",
    zoneId: "Z4",
    status: "warning",
    loadPct: 76,
    floodExposure: 0.5,
    backupFuelHours: 48,
    criticalFeeders: ["Ambattur Medical Unit"],
  },
  {
    id: "PWR-04",
    name: "Mylapore Coastal Substation",
    zoneId: "Z3",
    status: "offline",
    loadPct: 0,
    floodExposure: 2.9,
    backupFuelHours: 0,
    criticalFeeders: ["Marina Coast Desalination Plant"],
  },
];

const waterPlants = [
  {
    id: "WTR-01",
    name: "Nemmeli Desalination Plant",
    capacityMld: 110,
    status: "operational",
    contaminationRisk: "low",
    pumpsOnline: 6,
    pumpsTotal: 6,
  },
  {
    id: "WTR-02",
    name: "Kilpauk Water Treatment Works",
    capacityMld: 270,
    status: "degraded",
    contaminationRisk: "moderate",
    pumpsOnline: 4,
    pumpsTotal: 6,
  },
  {
    id: "WTR-03",
    name: "Adyar Effluent & Storm Pumping Unit",
    capacityMld: 95,
    status: "critical",
    contaminationRisk: "high",
    pumpsOnline: 1,
    pumpsTotal: 4,
  },
];

const shelters = [
  {
    id: "SHL-01",
    name: "Anna University Indoor Stadium",
    zoneId: "Z5",
    capacity: 2500,
    occupancy: 1840,
    medicalStaff: 8,
    suppliesDays: 5,
  },
  {
    id: "SHL-02",
    name: "Loyola College Relief Center",
    zoneId: "Z5",
    capacity: 1800,
    occupancy: 1420,
    medicalStaff: 6,
    suppliesDays: 4,
  },
  {
    id: "SHL-03",
    name: "Velachery Community Hall",
    zoneId: "Z2",
    capacity: 1200,
    occupancy: 1150,
    medicalStaff: 4,
    suppliesDays: 2,
  },
];

function InfrastructurePage() {
  const { select, role } = useOps();
  const [activeTab, setActiveTab] = useState<"hospitals" | "power" | "water" | "shelters">(
    "hospitals",
  );

  const dispatchGenerators = (substationName: string) => {
    logAuditAction({
      operatorRole: role,
      operatorName: "Critical Infrastructure Dispatch",
      action: `Dispatched Emergency Mobile Generator to ${substationName}`,
      category: "dispatch",
      details: "Mobile diesel generator unit mobilized to prevent hospital blackout",
      approved: true,
    });
    toast.success(`Mobile generator mobilized for ${substationName}`);
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Critical Infrastructure Command</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time survivability and contingency monitoring for medical facilities, power
              grids, and water systems.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-border p-1 bg-panel-elevated/40">
            <button
              onClick={() => setActiveTab("hospitals")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "hospitals"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Hospitals ({hospitals.length})
            </button>
            <button
              onClick={() => setActiveTab("power")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "power"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Power Grid ({powerSubstations.length})
            </button>
            <button
              onClick={() => setActiveTab("water")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "water"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Water & Pumps ({waterPlants.length})
            </button>
            <button
              onClick={() => setActiveTab("shelters")}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "shelters"
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Emergency Shelters ({shelters.length})
            </button>
          </div>
        </div>

        {/* Top Summary StatCards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Monitored Hospitals"
            value={num(hospitals.length)}
            sub={`${hospitals.filter((h) => h.risk === "critical" || h.risk === "high").length} at immediate risk`}
            icon={Hospital}
            tone="critical"
            updated="12s ago"
          />
          <StatCard
            label="Power Substations"
            value={`${powerSubstations.filter((p) => p.status === "operational").length} of ${powerSubstations.length} Online`}
            sub="1 substation inundated offline"
            icon={Zap}
            tone="warning"
            updated="1 min ago"
          />
          <StatCard
            label="Potable Water Supply"
            value="385 MLD"
            sub="Kilpauk operating at 70% capacity"
            icon={Droplets}
            updated="3 min ago"
          />
          <StatCard
            label="Shelter Capacity"
            value="5,500 Beds"
            sub="4,410 currently occupied (80%)"
            icon={Building}
            updated="5 min ago"
          />
        </div>

        {/* Tab 1: Hospitals View */}
        {activeTab === "hospitals" && (
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Hospital className="h-4 w-4 text-critical" />
              <span>Medical Facilities & Healthcare Contingency Matrix</span>
            </h2>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  className="rounded-md border border-border p-3.5 bg-panel-elevated/40 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground">{h.id}</span>
                      <h3 className="text-sm font-semibold text-foreground">{h.name}</h3>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] uppercase font-bold ${severityClass[h.risk]}`}
                    >
                      {severityLabel[h.risk]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground border-y border-border/40 py-2">
                    <div>
                      <span className="block text-[10px] label-mono">Beds / Occupancy</span>
                      <span className="text-foreground font-semibold">
                        {h.beds} beds ({h.occupancyPct}%)
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] label-mono">Road Access</span>
                      <span
                        className={`font-semibold capitalize ${h.roadAccess === "blocked" ? "text-critical" : h.roadAccess === "degraded" ? "text-warning" : "text-safe"}`}
                      >
                        {h.roadAccess}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] label-mono">Power Failure Prob</span>
                      <span className="text-foreground font-semibold">
                        {Math.round(h.powerFailureProb * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] label-mono">Zone</span>
                      <span className="text-foreground font-semibold">{h.zoneId}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="label-mono text-[9px]">AI Vulnerability Drivers:</p>
                    {h.reasons.map((r, i) => (
                      <p
                        key={i}
                        className="text-[11px] text-muted-foreground flex items-center gap-1"
                      >
                        <span className="h-1 w-1 rounded-full bg-critical" />
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to="/map"
                      onClick={() => select(h.buildingId)}
                      className="flex-1 rounded bg-secondary hover:bg-accent py-1 text-center text-xs font-medium transition-colors"
                    >
                      Locate in Map
                    </Link>
                    <Link
                      to="/twin"
                      onClick={() => select(h.buildingId)}
                      className="flex-1 rounded border border-border hover:bg-accent py-1 text-center text-xs font-medium transition-colors"
                    >
                      Inspect in 3D
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Power Grid View */}
        {activeTab === "power" && (
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Zap className="h-4 w-4 text-warning" />
              <span>Electrical Grid Substations & Backup Generators</span>
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
              {powerSubstations.map((p) => (
                <div
                  key={p.id}
                  className="rounded-md border border-border p-3.5 bg-panel-elevated/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground">{p.id}</span>
                      <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] uppercase font-bold ${
                        p.status === "operational"
                          ? "border-safe/50 bg-safe/15 text-safe"
                          : p.status === "warning"
                            ? "border-warning/50 bg-warning/15 text-warning"
                            : "border-critical/50 bg-critical/15 text-critical"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-muted-foreground border-y border-border/40 py-2">
                    <div>
                      <span className="block text-[10px] label-mono">Grid Load</span>
                      <span className="text-foreground font-semibold">{p.loadPct}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] label-mono">Flood Water</span>
                      <span className="text-foreground font-semibold">{p.floodExposure} m</span>
                    </div>
                    <div>
                      <span className="block text-[10px] label-mono">Backup Fuel</span>
                      <span className="text-foreground font-semibold">{p.backupFuelHours} hrs</span>
                    </div>
                  </div>

                  <div>
                    <span className="label-mono text-[10px]">Connected Critical Feeders:</span>
                    <p className="text-xs text-foreground mt-0.5">{p.criticalFeeders.join(", ")}</p>
                  </div>

                  <button
                    onClick={() => dispatchGenerators(p.name)}
                    className="w-full rounded bg-primary py-1.5 text-center text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Task Mobile Generator Contingency
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Water View */}
        {activeTab === "water" && (
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Droplets className="h-4 w-4 text-primary" />
              <span>Water Treatment Plants & Storm Pump Outfalls</span>
            </h2>

            <div className="grid gap-3 md:grid-cols-3">
              {waterPlants.map((w) => (
                <div
                  key={w.id}
                  className="rounded-md border border-border p-3.5 bg-panel-elevated/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">{w.id}</span>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] uppercase font-bold ${
                        w.status === "operational"
                          ? "border-safe/50 bg-safe/15 text-safe"
                          : w.status === "degraded"
                            ? "border-warning/50 bg-warning/15 text-warning"
                            : "border-critical/50 bg-critical/15 text-critical"
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{w.name}</h3>
                  <div className="text-xs font-mono text-muted-foreground space-y-1">
                    <p>Capacity: {w.capacityMld} MLD</p>
                    <p>Contamination Risk: {w.contaminationRisk.toUpperCase()}</p>
                    <p>
                      Active Pumps: {w.pumpsOnline} of {w.pumpsTotal} online
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Shelters View */}
        {activeTab === "shelters" && (
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Building className="h-4 w-4 text-safe" />
              <span>Designated Emergency Relocation Shelters</span>
            </h2>

            <div className="grid gap-3 md:grid-cols-3">
              {shelters.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-border p-3.5 bg-panel-elevated/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">{s.id}</span>
                    <span className="rounded bg-safe/10 text-safe border border-safe/30 px-1.5 py-0.5 text-[10px] font-mono">
                      ACTIVE
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                  <div className="text-xs font-mono text-muted-foreground space-y-1">
                    <p>
                      Capacity: {s.occupancy} / {s.capacity} (
                      {Math.round((s.occupancy / s.capacity) * 100)}%)
                    </p>
                    <p>Medical Staff: {s.medicalStaff} personnel on site</p>
                    <p>Food & Relief: {s.suppliesDays} days remaining</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
