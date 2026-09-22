import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import {
  Activity,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Network,
  RotateCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";
import { agents } from "@/data/incident";
import { num } from "@/lib/damage";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI Agent Fleet Operations & Workflow — AegisVision AI" },
      {
        name: "description",
        content:
          "Operational telemetry, throughput metrics, and visual multi-agent workflow DAG for the 7 autonomous AegisVision AI agents.",
      },
    ],
  }),
  component: AgentsPage,
});

const agentWorkflowNodes: Node[] = [
  {
    id: "wf-supervisor",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-primary font-bold uppercase">
            Supervisor Engine
          </p>
          <p className="text-xs font-semibold text-foreground">AI Supervisor Agent</p>
          <p className="text-[10px] text-safe mt-0.5">Orchestrating 6 Feeds</p>
        </div>
      ),
    },
    position: { x: 380, y: 30 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "2px solid var(--color-primary)",
      borderRadius: "8px",
      width: 190,
    },
    sourcePosition: Position.Bottom,
  },
  {
    id: "wf-sat",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-primary font-bold uppercase">Satellite Feed</p>
          <p className="text-xs font-semibold text-foreground">Satellite Agent</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">54k images analyzed</p>
        </div>
      ),
    },
    position: { x: 100, y: 150 },
    style: {
      background: "var(--color-panel)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      width: 170,
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
  },
  {
    id: "wf-drone",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-primary font-bold uppercase">Aerial Recon</p>
          <p className="text-xs font-semibold text-foreground">Drone Agent</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Sortie D-07 active</p>
        </div>
      ),
    },
    position: { x: 390, y: 150 },
    style: {
      background: "var(--color-panel)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      width: 170,
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
  },
  {
    id: "wf-social",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-warning font-bold uppercase">Citizen Stream</p>
          <p className="text-xs font-semibold text-foreground">Social Agent</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Downweighted noise</p>
        </div>
      ),
    },
    position: { x: 680, y: 150 },
    style: {
      background: "var(--color-panel)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      width: 170,
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
  },
  {
    id: "wf-damage",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-primary font-bold uppercase">
            Structural Classifier
          </p>
          <p className="text-xs font-semibold text-foreground">Damage Agent</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">12,450 assessed</p>
        </div>
      ),
    },
    position: { x: 240, y: 280 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "1px solid var(--color-primary)",
      borderRadius: "8px",
      width: 180,
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
  },
  {
    id: "wf-prediction",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-primary font-bold uppercase">
            Ensemble Forecast
          </p>
          <p className="text-xs font-semibold text-foreground">Prediction Agent</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Hydrological T+24h</p>
        </div>
      ),
    },
    position: { x: 530, y: 280 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "1px solid var(--color-primary)",
      borderRadius: "8px",
      width: 180,
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
  },
  {
    id: "wf-resource",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-safe font-bold uppercase">Action Optimizer</p>
          <p className="text-xs font-semibold text-foreground">Resource Agent</p>
          <p className="text-[10px] text-safe mt-0.5">Optimized allocations</p>
        </div>
      ),
    },
    position: { x: 380, y: 400 },
    style: {
      background: "oklch(0.72 0.17 150 / 15%)",
      border: "2px solid var(--color-safe)",
      borderRadius: "8px",
      width: 200,
    },
    targetPosition: Position.Top,
  },
];

const agentWorkflowEdges: Edge[] = [
  {
    id: "e-sup-sat",
    source: "wf-supervisor",
    target: "wf-sat",
    animated: true,
    style: { stroke: "#63b3ed", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#63b3ed" },
  },
  {
    id: "e-sup-drone",
    source: "wf-supervisor",
    target: "wf-drone",
    animated: true,
    style: { stroke: "#63b3ed", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#63b3ed" },
  },
  {
    id: "e-sup-soc",
    source: "wf-supervisor",
    target: "wf-social",
    animated: true,
    style: { stroke: "#63b3ed", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#63b3ed" },
  },
  {
    id: "e-sat-dam",
    source: "wf-sat",
    target: "wf-damage",
    style: { stroke: "#a0aec0", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a0aec0" },
  },
  {
    id: "e-drone-dam",
    source: "wf-drone",
    target: "wf-damage",
    style: { stroke: "#a0aec0", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a0aec0" },
  },
  {
    id: "e-soc-dam",
    source: "wf-social",
    target: "wf-damage",
    style: { stroke: "#a0aec0", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a0aec0" },
  },
  {
    id: "e-sat-pred",
    source: "wf-sat",
    target: "wf-prediction",
    style: { stroke: "#a0aec0", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a0aec0" },
  },
  {
    id: "e-drone-pred",
    source: "wf-drone",
    target: "wf-prediction",
    style: { stroke: "#a0aec0", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a0aec0" },
  },
  {
    id: "e-dam-res",
    source: "wf-damage",
    target: "wf-resource",
    animated: true,
    style: { stroke: "#48bb78", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#48bb78" },
  },
  {
    id: "e-pred-res",
    source: "wf-prediction",
    target: "wf-resource",
    animated: true,
    style: { stroke: "#48bb78", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#48bb78" },
  },
];

function AgentsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("supervisor");
  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0]!;

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerAgentSync = () => {
    toast.success("Synchronized agent fleet queues and refreshed throughput telemetry");
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">AI Agent Fleet Operations 2.0</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live telemetry, parallel processing throughput, and visual orchestration graph for 7
              specialized emergency intelligence agents.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerAgentSync}
              className="rounded-md border border-border bg-panel px-3 py-1.5 text-xs font-medium hover:bg-accent flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Poll Agent Queues</span>
            </button>
          </div>
        </div>

        {/* Fleet StatCards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Agent Fleet"
            value="7 Autonomous Agents"
            sub="0 failed · 0 deadlocked"
            icon={Cpu}
            tone="safe"
            updated="Nominal"
          />
          <StatCard
            label="Multi-Agent Decisions"
            value="1,482 Fused"
            sub="Resolved 3 active conflicts"
            icon={Zap}
            updated="12s ago"
          />
          <StatCard
            label="Mean Processing Latency"
            value="420 ms"
            sub="P99: 890 ms (Sentinel-2 tile load)"
            icon={Clock}
            updated="Live Metrics"
          />
          <StatCard
            label="Fleet Consensus Score"
            value="91%"
            sub="High confidence across modalities"
            icon={CheckCircle2}
            tone="safe"
            updated="1 min ago"
          />
        </div>

        {/* Visual Workflow Graph */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <span>Autonomous Agent Pipeline Orchestration DAG</span>
            </h2>
            <span className="label-mono text-[10px]">Realtime Data Propagation</span>
          </div>

          <div className="h-[440px] w-full rounded-md border border-border bg-neutral-950 overflow-hidden relative">
            {mounted ? (
              <ReactFlow
                nodes={agentWorkflowNodes}
                edges={agentWorkflowEdges}
                fitView
                className="bg-neutral-950"
                proOptions={{ hideAttribution: false }}
              >
                <Background color="#2d3748" gap={18} />
                <Controls className="bg-panel border-border" />
              </ReactFlow>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground font-mono">
                INITIALIZING AGENT PIPELINE DAG...
              </div>
            )}
          </div>
        </div>

        {/* Dual Layout: Fleet Cards + Agent Deep Dive Dossier */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/* Agent Fleet Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {agents.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedAgentId(a.id)}
                className={`rounded-md border p-3.5 cursor-pointer transition-colors space-y-2.5 ${
                  a.id === activeAgent.id
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-panel-elevated/40 hover:bg-accent/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse-slow" />
                    <h3 className="text-xs font-bold text-foreground">{a.name}</h3>
                  </div>
                  <span className="label-mono uppercase font-semibold text-primary">
                    {a.status}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground">{a.role}</p>

                <div className="rounded bg-panel/70 p-2 text-xs border border-border/40">
                  <span className="label-mono text-[9px] block text-muted-foreground">
                    Current Operational Task:
                  </span>
                  <p className="text-foreground font-medium text-[11px] mt-0.5">{a.currentTask}</p>
                </div>

                <div className="text-[11px] text-foreground bg-panel/40 p-2 rounded">
                  <span className="label-mono text-[9px] block text-muted-foreground">
                    Latest Finding:
                  </span>
                  <p className="mt-0.5">{a.finding}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-2">
                  <span>
                    Processed: {num(a.processed)} {a.processedUnit}
                  </span>
                  <span className="text-safe font-semibold">
                    Conf: {Math.round(a.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Active Agent Telemetry Inspector */}
          <div className="panel p-4 space-y-3">
            <div className="border-b border-border pb-2.5">
              <span className="label-mono text-[10px] text-primary">{activeAgent.role}</span>
              <h2 className="text-base font-bold text-foreground mt-0.5">{activeAgent.name}</h2>
              <p className="text-xs text-muted-foreground">
                Telemetry ID: AGT-{activeAgent.id.toUpperCase()}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded border border-border p-2.5 bg-panel-elevated/40">
                <span className="label-mono text-[10px]">Processing Throughput:</span>
                <p className="font-mono text-sm font-bold text-foreground mt-1">
                  {num(activeAgent.processed)} {activeAgent.processedUnit}
                </p>
                <div className="mt-2 flex items-end gap-1 h-10 border-b border-border/60 pb-1">
                  {activeAgent.throughput.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-primary/70 hover:bg-primary rounded-t transition-colors"
                      style={{ height: `${(val / Math.max(...activeAgent.throughput)) * 100}%` }}
                      title={`Step ${idx + 1}: ${val}`}
                    />
                  ))}
                </div>
                <span className="label-mono text-[9px] text-muted-foreground block text-right mt-1">
                  Throughput Sparkline (Last 12 Intervals)
                </span>
              </div>

              <div>
                <span className="label-mono text-[10px]">Active Autonomous Recommendations:</span>
                <div className="space-y-1.5 mt-1.5">
                  {activeAgent.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="rounded border border-border p-2 bg-panel/60 text-[11px] flex items-start gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-ai shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-2 text-[11px] font-mono text-muted-foreground">
                <p>Last Action: {activeAgent.lastAction}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
