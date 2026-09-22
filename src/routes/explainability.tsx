import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from "@xyflow/react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Layers,
  Network,
  Scale,
  Shield,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";

export const Route = createFileRoute("/explainability")({
  head: () => ({
    meta: [
      { title: "Explainable AI Reasoning Center — AegisVision AI" },
      {
        name: "description",
        content:
          "Visual reasoning graphs, Bayesian evidence fusion chains and epistemic uncertainty metrics for emergency decision-making.",
      },
    ],
  }),
  component: ExplainabilityPage,
});

const initialNodes: Node[] = [
  // Inputs
  {
    id: "n-sat",
    type: "default",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-primary uppercase font-bold">
            1. Sentinel-2 Pass
          </p>
          <p className="text-xs font-semibold text-foreground">Roof Plane Change</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Reliability: 92% · Conf: 89%</p>
        </div>
      ),
    },
    position: { x: 40, y: 40 },
    style: {
      background: "var(--color-panel)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      width: 190,
    },
    sourcePosition: Position.Right,
  },
  {
    id: "n-uav",
    type: "default",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-primary uppercase font-bold">
            2. UAV Sortie D-07
          </p>
          <p className="text-xs font-semibold text-foreground">Wall Collapse 4K Frame</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Reliability: 96% · Conf: 96%</p>
        </div>
      ),
    },
    position: { x: 40, y: 160 },
    style: {
      background: "var(--color-panel)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      width: 190,
    },
    sourcePosition: Position.Right,
  },
  {
    id: "n-social",
    type: "default",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-warning uppercase font-bold">
            3. Geo Citizen Posts
          </p>
          <p className="text-xs font-semibold text-foreground">Crowd Imagery (7 posts)</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Reliability: 41% · Conf: 52%</p>
        </div>
      ),
    },
    position: { x: 40, y: 280 },
    style: {
      background: "var(--color-panel)",
      border: "1px solid var(--color-warning)",
      borderRadius: "8px",
      width: 190,
    },
    sourcePosition: Position.Right,
  },

  // Intermediate Processing
  {
    id: "n-filter",
    type: "default",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-ai uppercase font-bold">Quality & Geotag Gate</p>
          <p className="text-xs font-semibold text-foreground">Spatial Deduplication</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Downweighted social outliers</p>
        </div>
      ),
    },
    position: { x: 300, y: 200 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      width: 200,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  },

  // Fusion Engine
  {
    id: "n-fusion",
    type: "default",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-ai uppercase font-bold">
            Bayesian Multimodal Fusion
          </p>
          <p className="text-xs font-semibold text-foreground">AI Supervisor Ensemble</p>
          <p className="text-[10px] text-safe mt-0.5">Cross-sensor agreement: 91%</p>
        </div>
      ),
    },
    position: { x: 580, y: 120 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "1px solid var(--color-primary)",
      borderRadius: "8px",
      width: 220,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  },

  // Output Verdict
  {
    id: "n-verdict",
    type: "default",
    data: {
      label: (
        <div className="p-2.5 text-left">
          <p className="text-[10px] font-mono text-critical uppercase font-bold">
            Adjudicated Decision
          </p>
          <p className="text-sm font-bold text-critical">DESTROYED (BLD-203)</p>
          <p className="text-[10px] text-foreground mt-0.5">
            Final Confidence: 94% · Certainty: 89%
          </p>
        </div>
      ),
    },
    position: { x: 880, y: 120 },
    style: {
      background: "oklch(0.62 0.22 27 / 15%)",
      border: "1px solid var(--color-critical)",
      borderRadius: "8px",
      width: 220,
    },
    targetPosition: Position.Left,
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-sat-fusion",
    source: "n-sat",
    target: "n-fusion",
    animated: true,
    style: { stroke: "#63b3ed", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#63b3ed" },
  },
  {
    id: "e-uav-fusion",
    source: "n-uav",
    target: "n-fusion",
    animated: true,
    style: { stroke: "#63b3ed", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#63b3ed" },
  },
  {
    id: "e-soc-filter",
    source: "n-social",
    target: "n-filter",
    style: { stroke: "#e2e8f0", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#e2e8f0" },
  },
  {
    id: "e-filter-fusion",
    source: "n-filter",
    target: "n-fusion",
    animated: true,
    style: { stroke: "#63b3ed", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#63b3ed" },
  },
  {
    id: "e-fusion-verdict",
    source: "n-fusion",
    target: "n-verdict",
    animated: true,
    style: { stroke: "#e53e3e", strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#e53e3e" },
  },
];

function ExplainabilityPage() {
  const [mounted, setMounted] = useState(false);
  const [nodes] = useState<Node[]>(initialNodes);
  const [edges] = useState<Edge[]>(initialEdges);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-ai" />
              <h1 className="text-xl font-bold tracking-tight">Explainable AI Reasoning Center</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Transparent, causal inspection of every automated disaster assessment. Trace verdicts
              back to raw sensor telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-ai/10 border border-ai/30 text-ai text-xs font-mono px-2.5 py-1">
              PROVENANCE DAG VERIFIED
            </span>
          </div>
        </div>

        {/* Conceptual Distinction: Confidence vs Reliability vs Certainty */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="panel p-3.5 border-l-4 border-l-primary space-y-1">
            <div className="flex items-center justify-between">
              <span className="label-mono font-bold text-foreground">Model Confidence</span>
              <span className="font-mono text-sm font-bold text-primary">94%</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              How confident the multimodal neural classifier is in its mathematical prediction given
              the ingested feature vectors.
            </p>
          </div>

          <div className="panel p-3.5 border-l-4 border-l-warning space-y-1">
            <div className="flex items-center justify-between">
              <span className="label-mono font-bold text-foreground">Source Reliability</span>
              <span className="font-mono text-sm font-bold text-warning">88%</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Historical calibration accuracy of the physical sensors (high for calibrated UAV / low
              for noisy social crowdsourcing).
            </p>
          </div>

          <div className="panel p-3.5 border-l-4 border-l-safe space-y-1">
            <div className="flex items-center justify-between">
              <span className="label-mono font-bold text-foreground">Epistemic Certainty</span>
              <span className="font-mono text-sm font-bold text-safe">89%</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Degree of consensus across independent physical angles. High when satellite, drone,
              and water meters agree.
            </p>
          </div>
        </div>

        {/* Visual Reasoning DAG Canvas */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <span>Multi-Hop Reasoning Dependency Graph (BLD-203 Case Study)</span>
            </h2>
            <span className="label-mono text-[10px]">Interactive Drag & Zoom Canvas</span>
          </div>

          <div className="h-[460px] w-full rounded-md border border-border bg-neutral-950 overflow-hidden relative">
            {mounted ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                className="bg-neutral-950"
                proOptions={{ hideAttribution: false }}
              >
                <Background color="#2d3748" gap={18} />
                <Controls className="bg-panel border-border" />
                <MiniMap
                  nodeColor={(n) => (n.id === "n-verdict" ? "#e53e3e" : "#4299e1")}
                  className="bg-panel border border-border"
                />
              </ReactFlow>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground font-mono">
                INITIALIZING REASONING DAG...
              </div>
            )}
          </div>
        </div>

        {/* Reasoning Decomposition Matrix */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="panel p-4 space-y-2.5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              <span>Feature Attribution Breakdown</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Relative contribution of each physical feature to the structural collapse verdict:
            </p>
            <div className="space-y-2 text-xs font-mono pt-1">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Roof Plane Loss (Sentinel-2)</span>
                  <span className="font-semibold text-primary">42% contribution</span>
                </div>
                <div className="h-2 w-full rounded bg-panel-elevated overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "42%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Façade Debris Field (UAV Frame 1184)</span>
                  <span className="font-semibold text-primary">38% contribution</span>
                </div>
                <div className="h-2 w-full rounded bg-panel-elevated overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "38%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Citizen Photographic Corroboration</span>
                  <span className="font-semibold text-warning">12% contribution</span>
                </div>
                <div className="h-2 w-full rounded bg-panel-elevated overflow-hidden">
                  <div className="h-full bg-warning" style={{ width: "12%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Prior Age & Concrete Framing Baselines</span>
                  <span className="font-semibold text-muted-foreground">8% contribution</span>
                </div>
                <div className="h-2 w-full rounded bg-panel-elevated overflow-hidden">
                  <div className="h-full bg-muted-foreground" style={{ width: "8%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-4 space-y-2.5">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-safe" />
              <span>Safety & Hallucination Guardrails</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              AegisVision AI enforces verifiable safety checks before emitting high-consequence
              assessments:
            </p>
            <ul className="space-y-2 text-xs text-foreground/90 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-safe shrink-0 mt-0.5" />
                <span>
                  <strong>Dual-Angle Verification:</strong> No structure is classified as Destroyed
                  without at least two independent physical sensor modalities.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-safe shrink-0 mt-0.5" />
                <span>
                  <strong>Adversarial Social Filtering:</strong> Citizen reports with geotags
                  deviating &gt;50m from ground truth are automatically quarantined.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-safe shrink-0 mt-0.5" />
                <span>
                  <strong>Human Review Requirement:</strong> Any high-consequence operational
                  dispatch (evacuation, road closure) must be confirmed by an operator.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
