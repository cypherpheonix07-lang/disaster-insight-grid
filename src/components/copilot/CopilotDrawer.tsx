import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  CornerDownLeft,
  Route as RouteIcon,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

import { useOps } from "@/lib/ops-store";
import {
  hospitalsAtRisk,
  incident,
  predictionSteps,
  unsafeRoads,
  suggestedQuestions,
  buildingById,
  evacuationPlan,
} from "@/data/incident";
import { logAuditAction } from "@/lib/audit-logger";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "copilot";
  timestamp: string;
  text: string;
  evidence?: { source: string; detail: string; confidence: number }[];
  actionCard?: {
    id: string;
    title: string;
    description: string;
    impact: "low" | "medium" | "high";
    actionLabel: string;
    onExecute: () => void;
    executed?: boolean;
  };
}

export function CopilotDrawer() {
  const { copilotOpen, setCopilotOpen, step, selectedBuildingId, select, setStep, role } = useOps();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "copilot",
      timestamp: "16:15 UTC",
      text: `AegisVision AI Copilot ready. Monitoring active incident ${incident.name} (${incident.id}). Fusing 7 agent streams across 5 response zones. Ask any situational question or task an autonomous workflow.`,
      evidence: [
        { source: "Supervisor Agent", detail: "Zone 3 escalated to CRITICAL", confidence: 0.91 },
        {
          source: "Damage Classifier",
          detail: "1,200 structures destroyed in footprint",
          confidence: 0.89,
        },
      ],
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!copilotOpen) return null;

  const handleSend = (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toUTCString().slice(17, 22) + " UTC",
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate AI Copilot reasoning & response synthesis
    setTimeout(() => {
      let reply: Message;
      const lower = q.toLowerCase();

      if (lower.includes("hospital") || lower.includes("medical")) {
        const risky = hospitalsAtRisk(step);
        reply = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          timestamp: new Date().toUTCString().slice(17, 22) + " UTC",
          text: `At T+${step}h, ${risky.length} hospitals have critical flood exposure or impaired road access. ${risky[0]?.name} is highest priority due to Adyar Bridge Link debris blockage.`,
          evidence: [
            {
              source: "Hydrological Model",
              detail: "Projected flood depth 2.7 m near hospital campus",
              confidence: 0.93,
            },
            {
              source: "Infrastructure Agent",
              detail: "Backup generators threatened if water rises +0.4 m",
              confidence: 0.88,
            },
          ],
          actionCard: {
            id: "act-hospital-dispatch",
            title: "Re-route Emergency Responders via GST Road",
            description:
              "Avoids blocked Anna Salai / Adyar Bridge; ETA impact +8 minutes but ensures vehicle transit.",
            impact: "high",
            actionLabel: "Approve & Task Routing",
            onExecute: () => {
              logAuditAction({
                operatorRole: role,
                operatorName: "Copilot / Operator Authorization",
                action: "Approved Hospital Emergency Rerouting",
                category: "dispatch",
                details: "Ambulances rerouted to Apollo Greams Road via GST Road bypass",
                approved: true,
              });
              toast.success("Ambulance routing updated and dispatched to fleet");
              navigate({ to: "/routing" });
            },
          },
        };
      } else if (
        lower.includes("bld-203") ||
        (lower.includes("why") && lower.includes("destroyed"))
      ) {
        const b = buildingById["BLD-203"];
        reply = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          timestamp: new Date().toUTCString().slice(17, 22) + " UTC",
          text: `BLD-203 was classified as DESTROYED (confidence 94%) based on fused multi-angle evidence: Sentinel-2 detected 78% roof-plane displacement, and UAV Sortie D-07 confirmed north & east load-bearing façade collapse.`,
          evidence: [
            {
              source: "Sentinel-2 Change Detection",
              detail: "Roof loss confirmed at 14:52 UTC",
              confidence: 0.89,
            },
            {
              source: "UAV Frame 1184",
              detail: "14m debris field blocking arterial access",
              confidence: 0.96,
            },
            {
              source: "Citizen Geo-tag",
              detail: "Corroborated by 3 geo-verified citizen photos",
              confidence: 0.78,
            },
          ],
          actionCard: {
            id: "act-select-bld203",
            title: "Inspect Structure Dossier in 3D Twin",
            description:
              "Load BLD-203 in the 3D Digital Twin with flood level plane and debris geometry.",
            impact: "low",
            actionLabel: "Fly to BLD-203 in 3D Twin",
            onExecute: () => {
              select("BLD-203");
              navigate({ to: "/twin" });
              toast.info("Navigated to 3D Twin centered on BLD-203");
            },
          },
        };
      } else if (lower.includes("evacuat") || lower.includes("zone 3")) {
        const plan = evacuationPlan("Z3");
        reply = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          timestamp: new Date().toUTCString().slice(17, 22) + " UTC",
          text: `Zone 3 evacuation plan generated: ${plan.population.toLocaleString()} residents structured into 3 timed waves. Priority wave 1 covers ground-floor structures and 8 destroyed buildings along Marina Coast.`,
          evidence: [
            {
              source: "Evacuation Planner",
              detail: "Wave 1 (T+0 to T+1h): 5,600 people to Inland Shelter Z5",
              confidence: 0.92,
            },
            {
              source: "Road Agent",
              detail: "ECR Coastal is flooded; safe egress routed through Inner Ring",
              confidence: 0.87,
            },
          ],
          actionCard: {
            id: "act-evac-zone3",
            title: "Authorize Zone 3 Phased Evacuation Protocol",
            description:
              "Broadcasts localized siren alerts and mobilizes 4 rescue boats to staging point Alpha.",
            impact: "high",
            actionLabel: "Authorize Wave 1 Deployment",
            onExecute: () => {
              logAuditAction({
                operatorRole: role,
                operatorName: "Incident Commander Authorization",
                action: "Authorized Zone 3 Wave 1 Evacuation",
                category: "evacuation",
                details: "Authorized mobilization of 4 boats and 3 buses for Marina Coast",
                targetId: "Z3",
                approved: true,
              });
              toast.success("Zone 3 Wave 1 Evacuation authorized and logged to audit trail");
              navigate({ to: "/predictions" });
            },
          },
        };
      } else if (lower.includes("simulate") || lower.includes("flood")) {
        reply = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          timestamp: new Date().toUTCString().slice(17, 22) + " UTC",
          text: `Simulating +2.0m flood scenario: 1,840 additional structures inundated, +14,200 population at risk, and 12 extra road segments become impassable. Zone 1 and Zone 3 require immediate boat pre-positioning.`,
          evidence: [
            {
              source: "Hydrological Ensemble",
              detail: "Mean depth exceeds 3.1 m in Adyar Basin",
              confidence: 0.86,
            },
            {
              source: "Topographical Elevation Model",
              detail: "Structures below 2.2m elevation will breach",
              confidence: 0.91,
            },
          ],
          actionCard: {
            id: "act-sim-compare",
            title: "Open Side-by-Side Scenario Comparison",
            description: "Compare Baseline (+0m) vs Severe Surge (+2m) in the Scenario Workspace.",
            impact: "medium",
            actionLabel: "Open Scenario Comparison",
            onExecute: () => {
              navigate({ to: "/scenarios" });
            },
          },
        };
      } else {
        const blocked = unsafeRoads(step);
        reply = {
          id: `cop-${Date.now()}`,
          sender: "copilot",
          timestamp: new Date().toUTCString().slice(17, 22) + " UTC",
          text: `Analyzing operational telemetry for query "${q}". The current forecast horizon is T+${step}h. ${blocked.length} monitored road corridors are compromised. Recommend checking Critical Infrastructure and Agent Operations.`,
          evidence: [
            {
              source: "AI Supervisor",
              detail: "All 7 specialized agents operating within nominal latency",
              confidence: 0.91,
            },
          ],
        };
      }

      setMessages((prev) => [...prev, reply]);
    }, 600);
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-panel shadow-2xl backdrop-blur"
      aria-label="AI Disaster Copilot Panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3.5 bg-panel-elevated">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-ai/20 text-ai">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Aegis Disaster Copilot</h2>
              <span className="rounded bg-ai/20 px-1.5 py-0.5 text-[10px] font-mono text-ai">
                AI 2.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Context: {incident.name} · Step T+{step}h
            </p>
          </div>
        </div>
        <button
          onClick={() => setCopilotOpen(false)}
          className="rounded-md p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label="Close Copilot"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex flex-col gap-1.5",
              m.sender === "user" ? "items-end" : "items-start",
            )}
          >
            <div className="flex items-center gap-2 text-[10px] label-mono text-muted-foreground">
              <span>{m.sender === "user" ? `Operator (${role})` : "Aegis Copilot"}</span>
              <span>· {m.timestamp}</span>
            </div>

            <div
              className={cn(
                "rounded-lg p-3 text-xs leading-relaxed max-w-[90%]",
                m.sender === "user"
                  ? "bg-primary text-primary-foreground font-medium"
                  : "panel border-border/80 bg-panel-elevated/90",
              )}
            >
              <p>{m.text}</p>

              {/* Evidence citations */}
              {m.evidence && m.evidence.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                  <p className="label-mono text-[9px] text-ai flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Supporting Evidence & Provenance
                  </p>
                  {m.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="rounded bg-panel/80 p-1.5 text-[11px] border border-border/40"
                    >
                      <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                        <span>{ev.source}</span>
                        <span>{Math.round(ev.confidence * 100)}% conf</span>
                      </div>
                      <p className="mt-0.5 text-foreground/90">{ev.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Card with Human in the Loop approval */}
              {m.actionCard && (
                <div className="mt-3 rounded-md border border-warning/40 bg-warning/10 p-2.5">
                  <div className="flex items-center gap-1.5 text-warning font-semibold text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Recommended Tactical Action</span>
                  </div>
                  <p className="mt-1 font-medium text-foreground">{m.actionCard.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {m.actionCard.description}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10px] label-mono text-muted-foreground">
                      Requires Human Approval
                    </span>
                    <button
                      onClick={() => {
                        m.actionCard?.onExecute();
                      }}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <span>{m.actionCard.actionLabel}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts pills */}
      <div className="border-t border-border p-2 bg-panel-elevated/40">
        <p className="label-mono text-[9px] px-1 mb-1">Quick Operational Inquiries</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {suggestedQuestions.slice(0, 3).map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="shrink-0 rounded-full border border-border bg-panel px-2.5 py-1 text-[11px] text-muted-foreground hover:border-ai/60 hover:text-foreground transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="border-t border-border p-3 flex gap-2 items-center bg-panel"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Copilot or task an emergency workflow..."
          className="flex-1 rounded-md border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Send query"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
