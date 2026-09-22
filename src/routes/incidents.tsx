import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Shield,
  ShieldAlert,
  Wind,
  Droplets,
  Layers,
} from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { incident, zones } from "@/data/incident";
import { num, severityClass, severityLabel } from "@/lib/damage";
import { getAuditLog } from "@/lib/audit-logger";

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Incident Intelligence — AegisVision AI" },
      {
        name: "description",
        content:
          "Comprehensive incident lifecycle, declaration chronology, affected zones and decision history for Cyclone Vaayu.",
      },
    ],
  }),
  component: IncidentsPage,
});

const incidentLifecycle = [
  {
    phase: "Detection & Satellite Anomaly",
    time: "2026-09-15 08:30 UTC",
    status: "completed",
    description: "Deep cyclonic depression identified over southwest Bay of Bengal.",
  },
  {
    phase: "Warning & Pre-Activation",
    time: "2026-09-16 14:00 UTC",
    status: "completed",
    description:
      "IMD bulletin upgraded to Very Severe Cyclonic Storm. Regional NDRF pre-positioned.",
  },
  {
    phase: "Emergency Declaration",
    time: "2026-09-16 22:40 UTC",
    status: "completed",
    description: "State disaster authority declared Level-3 critical state of emergency.",
  },
  {
    phase: "Coastal Landfall",
    time: "2026-09-17 14:10 UTC",
    status: "completed",
    description: "Core eye made landfall south of Chennai. Peak sustained gusts 165 km/h recorded.",
  },
  {
    phase: "Active Operations & Multimodal Assessment",
    time: "Current Active Phase",
    status: "active",
    description:
      "7 specialized autonomous agents fusing drone, satellite, sensor, and citizen imagery.",
  },
  {
    phase: "De-escalation & Reconstruction",
    time: "T+48h Projected",
    status: "pending",
    description: "Transition to structural restoration and insurance verification dossiers.",
  },
];

const mockArchiveIncidents = [
  {
    id: "INC-2026-CHN-017",
    name: "Cyclone Vaayu",
    state: "ACTIVE",
    severity: "critical",
    date: "Sep 2026",
    location: "Chennai Metropolitan Region",
  },
  {
    id: "INC-2025-TN-008",
    name: "Adyar Basin Urban Flash Flood",
    state: "RESOLVED",
    severity: "high",
    date: "Nov 2025",
    location: "Tamil Nadu Urban Belt",
  },
  {
    id: "INC-2024-CST-003",
    name: "Cyclone Michaung Response",
    state: "ARCHIVED",
    severity: "critical",
    date: "Dec 2024",
    location: "Coromandel Coast",
  },
];

function IncidentsPage() {
  const [selectedIncident] = useState("INC-2026-CHN-017");
  const auditEntries = getAuditLog();

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Incident Header Panel */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="label-mono font-bold text-primary">{incident.id}</span>
              <span
                className={`rounded border px-2 py-0.5 text-xs uppercase font-semibold ${severityClass[incident.severity]}`}
              >
                {severityLabel[incident.severity]}
              </span>
              <span className="rounded bg-safe/10 text-safe border border-safe/30 px-2 py-0.5 text-[11px] font-mono">
                OPS ACTIVE
              </span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">
              {incident.name}
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>
                {incident.location} · {incident.category}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <span>Live Operational Map</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/twin"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              <span>3D Digital Twin</span>
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              <span>Export SitRep</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Declared Landfall"
            value={new Date(incident.landfall).toUTCString().slice(5, 22)}
            sub="IMD Doppler radar calibrated"
            icon={Calendar}
            updated="Nominal"
          />
          <StatCard
            label="Peak Sustained Wind"
            value={`${incident.windKmh} km/h`}
            sub="Category: Very Severe Cyclonic Storm"
            icon={Wind}
            tone="critical"
            updated="12s ago"
          />
          <StatCard
            label="Cumulative Rainfall"
            value={`${num(incident.rainfallMm)} mm`}
            sub="Exceeds 100-year urban recurrence"
            icon={Droplets}
            tone="warning"
            updated="12s ago"
          />
          <StatCard
            label="Total Affected Footprint"
            value={`${num(incident.stats.affectedBuildings)} structures`}
            sub={`${num(incident.stats.destroyed)} destroyed · ${num(incident.stats.populationAtRisk)} people`}
            icon={ShieldAlert}
            tone="critical"
            updated="Fused"
          />
        </div>

        {/* Dual Layout: Lifecycle Timeline + Affected Zones */}
        <div className="grid gap-4 xl:grid-cols-3">
          {/* Lifecycle Chronology */}
          <div className="panel p-4 xl:col-span-2 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Incident Operational Lifecycle & Decision Timeline</span>
              </h2>
              <span className="label-mono">Standard Operating Protocol 4.2</span>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {incidentLifecycle.map((stage, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 bg-panel ${
                      stage.status === "completed"
                        ? "border-safe bg-safe"
                        : stage.status === "active"
                          ? "border-critical bg-critical animate-pulse-slow"
                          : "border-muted-foreground"
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{stage.phase}</span>
                    <span className="label-mono text-[10px] text-muted-foreground font-mono">
                      {stage.time}
                    </span>
                    {stage.status === "active" && (
                      <span className="rounded bg-critical/20 px-1.5 py-0.2 text-[9px] font-bold text-critical uppercase font-mono">
                        CURRENT PHASE
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Incident Switcher & Historical Comparison */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Shield className="h-4 w-4 text-primary" />
              <span>Incident Registry Directory</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Select an operational incident profile to load situational state across all command
              tools.
            </p>

            <div className="space-y-2">
              {mockArchiveIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`rounded-md border p-3 transition-colors ${
                    inc.id === selectedIncident
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-accent/50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold">{inc.id}</span>
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                        inc.state === "ACTIVE"
                          ? "bg-critical/20 text-critical border border-critical/40"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {inc.state}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-foreground">{inc.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {inc.location} · {inc.date}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Affected Zones Matrix & Response Audit Log */}
        <div className="grid gap-4 xl:grid-cols-2">
          {/* Affected Response Zones */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Layers className="h-4 w-4 text-primary" />
              <span>Assessed Response Zones Impact Overview</span>
            </h2>
            <div className="space-y-2">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="rounded-md border border-border p-3 bg-panel-elevated/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{z.name}</span>
                    <span className="label-mono font-mono text-primary font-bold">
                      Damage Index {Math.round(z.damageIndex * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-mono text-muted-foreground">
                    <div>
                      <span className="block label-mono text-[9px]">Population</span>
                      <span className="text-foreground font-semibold">{num(z.population)}</span>
                    </div>
                    <div>
                      <span className="block label-mono text-[9px]">Flood Depth</span>
                      <span className="text-foreground font-semibold">
                        {z.floodDepth.toFixed(1)} m
                      </span>
                    </div>
                    <div>
                      <span className="block label-mono text-[9px]">Fire Hazard</span>
                      <span className="text-foreground font-semibold">
                        {Math.round(z.fireRisk * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commander Decisions & Audit Trail */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <CheckCircle2 className="h-4 w-4 text-safe" />
              <span>Immutable Command Decisions & Audit Log</span>
            </h2>
            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
              {auditEntries.map((aud) => (
                <div
                  key={aud.id}
                  className="rounded border border-border p-2.5 bg-panel-elevated/40 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{aud.action}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {aud.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{aud.details}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-primary border-t border-border/40 pt-1">
                    <span>
                      Authorized by: {aud.operatorName} ({aud.operatorRole})
                    </span>
                    <span className="text-safe uppercase font-bold">● VERIFIED</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
