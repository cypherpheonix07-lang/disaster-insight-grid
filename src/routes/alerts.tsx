import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Clock,
  Filter,
  MessageSquare,
  Radio,
  Send,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { alerts as initialAlerts, incident } from "@/data/incident";
import { severityClass, severityLabel } from "@/lib/damage";
import { useOps } from "@/lib/ops-store";
import { logAuditAction } from "@/lib/audit-logger";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Notifications & Shift Collaboration — AegisVision AI" },
      {
        name: "description",
        content:
          "Intelligent alert management, operator handoff notes and real-time team presence for Cyclone Vaayu response operations.",
      },
    ],
  }),
  component: AlertsPage,
});

interface CollabNote {
  id: string;
  author: string;
  role: string;
  time: string;
  message: string;
  pinned: boolean;
}

const initialNotes: CollabNote[] = [
  {
    id: "NOTE-1",
    author: "Commander R. Sharma",
    role: "Incident Commander",
    time: "15:30 UTC",
    message:
      "Handover note for Alpha Shift: Adyar Bridge remains unpassable. Route all Zone 1 medical transfers via GST Road bypass. Pre-position 4 boats at Marina staging point.",
    pinned: true,
  },
  {
    id: "NOTE-2",
    author: "Lead M. Anand",
    role: "Tactical Responder",
    time: "15:52 UTC",
    message:
      "Sortie D-07 completed 4K pass over industrial zone. 212 roof anomalies logged. Awaiting fuel recharge before Sortie D-08 launch.",
    pinned: false,
  },
  {
    id: "NOTE-3",
    author: "Analyst K. Mehta",
    role: "Geospatial Analyst",
    time: "16:04 UTC",
    message:
      "Social media signals from Zone 2 are contaminated with archive 2024 flood footage. Weight reduced to 0.41. Rely on physical IoT water gauges.",
    pinned: false,
  },
];

const activeOperators = [
  {
    name: "Commander R. Sharma",
    role: "Incident Commander",
    status: "online",
    shift: "Shift Alpha (08:00 - 18:00)",
  },
  {
    name: "Tactical Lead M. Anand",
    role: "Field Responder",
    status: "online",
    shift: "Shift Alpha (08:00 - 18:00)",
  },
  {
    name: "Senior Analyst K. Mehta",
    role: "Geospatial Analyst",
    status: "online",
    shift: "Shift Alpha (08:00 - 18:00)",
  },
  {
    name: "Systems Admin T. Rao",
    role: "Administrator",
    status: "idle",
    shift: "On-Call Fleet Support",
  },
];

function AlertsPage() {
  const { role } = useOps();
  const [alertsList, setAlertsList] = useState(
    initialAlerts.map((a) => ({ ...a, acknowledged: false })),
  );
  const [notes, setNotes] = useState<CollabNote[]>(initialNotes);
  const [newNoteText, setNewNoteText] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  const acknowledgeAlert = (id: string) => {
    setAlertsList((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
    toast.success("Alert acknowledged and archived");
  };

  const acknowledgeAll = () => {
    setAlertsList((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    toast.success("All operational alerts acknowledged");
  };

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: CollabNote = {
      id: `NOTE-${Date.now()}`,
      author: role === "commander" ? "Commander R. Sharma" : "Tactical Operator",
      role: role.toUpperCase(),
      time: new Date().toUTCString().slice(17, 22) + " UTC",
      message: newNoteText.trim(),
      pinned: false,
    };

    setNotes((prev) => [newNote, ...prev]);

    logAuditAction({
      operatorRole: role,
      operatorName: newNote.author,
      action: "Posted Shift Collaboration Note",
      category: "override",
      details: newNote.message,
      approved: true,
    });

    setNewNoteText("");
    toast.success("Shift note posted to operational board");
  };

  const filteredAlerts = alertsList.filter((a) =>
    filterSeverity === "all" ? true : a.severity === filterSeverity,
  );

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                Notifications & Shift Collaboration
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prioritized multi-agent alert queue, active operator roster, and persistent shift
              handover briefing board.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={acknowledgeAll}
              className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium hover:bg-accent flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5 text-safe" />
              <span>Acknowledge All</span>
            </button>
          </div>
        </div>

        {/* Top StatCards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Alerts"
            value={alertsList.length.toString()}
            sub={`${alertsList.filter((a) => !a.acknowledged).length} unacknowledged`}
            icon={Bell}
            tone="critical"
            updated="Realtime"
          />
          <StatCard
            label="Active Operators"
            value={`${activeOperators.filter((o) => o.status === "online").length} Online`}
            sub="Shift Alpha actively staffing console"
            icon={UserCheck}
            tone="safe"
            updated="Nominal"
          />
          <StatCard
            label="Critical Alarms"
            value={alertsList.filter((a) => a.severity === "critical").length.toString()}
            sub="Surge front & hospital blockage"
            icon={AlertTriangle}
            tone="critical"
            updated="12s ago"
          />
          <StatCard
            label="Shift Notes Logged"
            value={notes.length.toString()}
            sub="Auditable operator handoffs"
            icon={MessageSquare}
            updated="Active Log"
          />
        </div>

        {/* Dual Layout: Alert Queue + Operator Handoff Notes */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Section 1: Intelligent Alert Queue */}
          <div className="panel p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-2.5 gap-2">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span>Operational Priority Alert Stream</span>
              </h2>

              <div className="flex items-center gap-1 text-xs">
                <span className="label-mono mr-1">Filter:</span>
                {["all", "critical", "high", "moderate"].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`rounded px-2 py-0.5 capitalize transition-colors ${
                      filterSeverity === sev
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredAlerts.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-md border p-3.5 space-y-2 transition-colors ${
                    a.acknowledged
                      ? "border-border/60 bg-panel/30 opacity-70"
                      : "border-border bg-panel-elevated/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] uppercase font-bold ${severityClass[a.severity]}`}
                      >
                        {severityLabel[a.severity]}
                      </span>
                      <h3 className="text-xs font-bold text-foreground">{a.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span>{a.agent} Agent</span>
                      <span>· {a.time} ago</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">{a.detail}</p>

                  <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                    <span className="font-mono text-[10px] text-primary">ID: {a.id}</span>

                    {a.acknowledged ? (
                      <span className="font-mono text-[10px] text-safe flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>ACKNOWLEDGED</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => acknowledgeAlert(a.id)}
                        className="rounded border border-primary/50 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        Acknowledge Alert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Shift Handover & Team Notes */}
          <div className="space-y-4">
            {/* Active Operators Roster */}
            <div className="panel p-4 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
                <Users className="h-4 w-4 text-primary" />
                <span>Console Operators on Duty</span>
              </h2>

              <div className="space-y-2">
                {activeOperators.map((op, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-1.5 rounded bg-panel-elevated/40"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{op.name}</p>
                      <p className="text-[10px] text-muted-foreground">{op.role}</p>
                    </div>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-safe">
                      <span className="h-2 w-2 rounded-full bg-safe animate-pulse-slow" />
                      <span>{op.status.toUpperCase()}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Handoff Notes */}
            <div className="panel p-4 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-border pb-2.5">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Shift Handoff Log</span>
              </h2>

              <form onSubmit={handlePostNote} className="space-y-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record an operational observation or shift handover note..."
                  rows={2}
                  className="w-full rounded border border-border bg-panel px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1 rounded bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span>Log Shift Handover Note</span>
                </button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="rounded border border-border p-2.5 bg-panel-elevated/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{n.author}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
