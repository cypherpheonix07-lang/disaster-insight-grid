import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check,
  Eye,
  FileText,
  Key,
  Lock,
  RotateCcw,
  Settings,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { MapControls } from "@/components/map/MapControls";
import { agents, incident } from "@/data/incident";
import { num } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { getAuditLog, type OperatorRole } from "@/lib/audit-logger";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Operations Governance & RBAC — AegisVision AI" },
      {
        name: "description",
        content:
          "Role-based access control permissions, data governance compliance, and incident telemetry settings for AegisVision AI.",
      },
    ],
  }),
  component: SettingsPage,
});

const permissionsMatrix = [
  {
    action: "Declare Incident Severity",
    commander: true,
    responder: false,
    analyst: false,
    admin: true,
  },
  {
    action: "Authorize Civilian Evacuation Waves",
    commander: true,
    responder: false,
    analyst: false,
    admin: false,
  },
  {
    action: "Confirm Tactical Emergency Dispatch",
    commander: true,
    responder: true,
    analyst: false,
    admin: false,
  },
  {
    action: "Task Autonomous UAV Sorties",
    commander: true,
    responder: true,
    analyst: true,
    admin: false,
  },
  {
    action: "Adjudicate Multi-Sensor Evidence Conflicts",
    commander: true,
    responder: false,
    analyst: true,
    admin: false,
  },
  {
    action: "Run What-If Hydrological Simulations",
    commander: true,
    responder: true,
    analyst: true,
    admin: true,
  },
  {
    action: "Export GeoJSON & Classified Briefings",
    commander: true,
    responder: false,
    analyst: true,
    admin: true,
  },
  {
    action: "Manage Telemetry Integrations & Keys",
    commander: false,
    responder: false,
    analyst: false,
    admin: true,
  },
];

function SettingsPage() {
  const { role, setRole } = useOps();
  const [piiScrubbing, setPiiScrubbing] = useState(true);
  const [auditRetentionDays, setAuditRetentionDays] = useState(90);
  const auditEntries = getAuditLog();

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                Operations Governance & RBAC Settings
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role permissions, data privacy compliance, immutable audit log verification, and
              simulation parameters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-safe/10 border border-safe/30 text-safe text-xs font-mono px-2.5 py-1 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>GOVERNANCE COMPLIANT</span>
            </span>
          </div>
        </div>

        {/* Active Role Configuration */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span>Active Operator Persona & Security Context</span>
            </h2>
            <span className="label-mono text-[10px]">Session Context</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {(["commander", "responder", "analyst", "admin"] as OperatorRole[]).map((r) => (
              <div
                key={r}
                onClick={() => {
                  setRole(r);
                  toast.info(`Operator security role switched to: ${r.toUpperCase()}`);
                }}
                className={`rounded-md border p-3 cursor-pointer transition-colors space-y-1 ${
                  role === r
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-panel-elevated/40 hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize font-bold text-xs text-foreground">{r}</span>
                  {role === r && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {r === "commander"
                    ? "Full executive command & evacuation authority"
                    : r === "responder"
                      ? "Field dispatch & vehicle routing execution"
                      : r === "analyst"
                        ? "Sensor adjudication & simulation calibration"
                        : "Security keys & system telemetry admin"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dual Layout: RBAC Permission Matrix + Data Privacy */}
        <div className="grid gap-4 xl:grid-cols-2">
          {/* RBAC Matrix */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Lock className="h-4 w-4 text-primary" />
              <span>Role-Based Access Control (RBAC) Entitlements</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-left label-mono text-[10px]">
                    <th className="py-2 pr-2">Operational Action</th>
                    <th className="py-2 px-1 text-center">Commander</th>
                    <th className="py-2 px-1 text-center">Responder</th>
                    <th className="py-2 px-1 text-center">Analyst</th>
                    <th className="py-2 px-1 text-center">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {permissionsMatrix.map((p, idx) => (
                    <tr key={idx} className="hover:bg-panel-elevated/30">
                      <td className="py-2 pr-2 text-foreground font-sans font-medium">
                        {p.action}
                      </td>
                      <td className="py-2 px-1 text-center">
                        {p.commander ? (
                          <Check className="h-3.5 w-3.5 text-safe mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-1 text-center">
                        {p.responder ? (
                          <Check className="h-3.5 w-3.5 text-safe mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-1 text-center">
                        {p.analyst ? (
                          <Check className="h-3.5 w-3.5 text-safe mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-1 text-center">
                        {p.admin ? (
                          <Check className="h-3.5 w-3.5 text-safe mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Privacy & Compliance Controls */}
          <div className="panel p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
              <Shield className="h-4 w-4 text-primary" />
              <span>Data Governance & Privacy Policies</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="rounded border border-border p-3 bg-panel-elevated/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Crowdsource PII Automatic Blurring
                  </span>
                  <input
                    type="checkbox"
                    checked={piiScrubbing}
                    onChange={(e) => {
                      setPiiScrubbing(e.target.checked);
                      toast.success(
                        e.target.checked
                          ? "Automated face & vehicle plate blurring enabled"
                          : "Raw image ingestion active (restricted)",
                      );
                    }}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Automatically anonymize civilian faces and vehicle license plates detected in
                  social media geotagged imagery before storing in the central evidence dossier.
                </p>
              </div>

              <div className="rounded border border-border p-3 bg-panel-elevated/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Audit Log Retention Policy</span>
                  <span className="font-mono text-primary font-bold">
                    {auditRetentionDays} Days
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Preserve immutable operator authorization records for post-disaster judicial
                  review and insurance audits.
                </p>
              </div>

              <div className="rounded border border-border p-3 bg-panel-elevated/40 space-y-1.5">
                <span className="font-semibold text-foreground">Cryptographic Provenance</span>
                <p className="text-muted-foreground text-[11px] leading-relaxed font-mono">
                  SHA-256 Merkle root verification active across all 12,450 building
                  classifications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Reference (Accessibility 2.0) */}
        <div className="panel p-4 space-y-2.5">
          <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2">
            <Key className="h-4 w-4 text-primary" />
            <span>Tactical Keyboard Shortcuts Reference (WCAG Accessibility)</span>
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 text-xs font-mono">
            <div className="p-2 rounded bg-panel-elevated/40 border border-border flex justify-between items-center">
              <span>Command Palette:</span>
              <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 text-[10px]">
                Ctrl + K
              </kbd>
            </div>
            <div className="p-2 rounded bg-panel-elevated/40 border border-border flex justify-between items-center">
              <span>Quick Search:</span>
              <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 text-[10px]">
                /
              </kbd>
            </div>
            <div className="p-2 rounded bg-panel-elevated/40 border border-border flex justify-between items-center">
              <span>Close Drawers:</span>
              <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 text-[10px]">
                Esc
              </kbd>
            </div>
            <div className="p-2 rounded bg-panel-elevated/40 border border-border flex justify-between items-center">
              <span>Tab Navigation:</span>
              <kbd className="rounded border border-border bg-panel px-1.5 py-0.5 text-[10px]">
                Tab / Shift+Tab
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
