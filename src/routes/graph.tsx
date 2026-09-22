import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  ArrowRight,
  Building,
  Hospital,
  Layers,
  Network,
  Power,
  Route as RouteIcon,
  ShieldAlert,
  Truck,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { StatCard } from "@/components/shell/StatCard";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Disaster Knowledge Graph & Cascading Impact — AegisVision AI" },
      {
        name: "description",
        content:
          "Multi-hop disaster ontology, entity relationship exploration and cascading infrastructure failure chain analysis for Cyclone Vaayu.",
      },
    ],
  }),
  component: KnowledgeGraphPage,
});

const graphNodes: Node[] = [
  // Incident Node
  {
    id: "g-incident",
    data: {
      label: (
        <div className="p-2.5 text-left">
          <p className="text-[10px] font-mono text-critical font-bold uppercase">Root Incident</p>
          <p className="text-xs font-bold text-foreground">Cyclone Vaayu (165 km/h)</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Catastrophic Surge</p>
        </div>
      ),
    },
    position: { x: 40, y: 150 },
    style: {
      background: "oklch(0.62 0.22 27 / 15%)",
      border: "2px solid var(--color-critical)",
      borderRadius: "8px",
      width: 190,
    },
    sourcePosition: Position.Right,
  },

  // Building Collapse
  {
    id: "g-bld203",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-critical font-bold uppercase">
            Structural Collapse
          </p>
          <p className="text-xs font-semibold text-foreground">BLD-203 (Commercial)</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">14m Debris Footprint</p>
        </div>
      ),
    },
    position: { x: 300, y: 50 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "1px solid var(--color-critical)",
      borderRadius: "8px",
      width: 180,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  },

  // Power Substation Inundation
  {
    id: "g-pwr02",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-warning font-bold uppercase">Grid Node</p>
          <p className="text-xs font-semibold text-foreground">Substation Adyar 110kV</p>
          <p className="text-[10px] text-warning mt-0.5">Flood Depth: 2.1m</p>
        </div>
      ),
    },
    position: { x: 300, y: 250 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "1px solid var(--color-warning)",
      borderRadius: "8px",
      width: 180,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  },

  // Blocked Corridor
  {
    id: "g-road",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-critical font-bold uppercase">
            Impassable Arterial
          </p>
          <p className="text-xs font-semibold text-foreground">Adyar Bridge Link (R8)</p>
          <p className="text-[10px] text-critical mt-0.5">Blocked by Debris</p>
        </div>
      ),
    },
    position: { x: 560, y: 50 },
    style: {
      background: "var(--color-panel-elevated)",
      border: "1px solid var(--color-critical)",
      borderRadius: "8px",
      width: 180,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  },

  // Compromised Hospital
  {
    id: "g-hospital",
    data: {
      label: (
        <div className="p-2.5 text-left">
          <p className="text-[10px] font-mono text-critical font-bold uppercase">
            Critical Health Asset
          </p>
          <p className="text-xs font-bold text-foreground">Apollo Greams Road (HSP-1)</p>
          <p className="text-[10px] text-critical mt-0.5">Road Blocked · Power 42% Risk</p>
        </div>
      ),
    },
    position: { x: 820, y: 140 },
    style: {
      background: "oklch(0.62 0.22 27 / 15%)",
      border: "2px solid var(--color-critical)",
      borderRadius: "8px",
      width: 220,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
  },

  // Resource Response
  {
    id: "g-resource",
    data: {
      label: (
        <div className="p-2 text-left">
          <p className="text-[10px] font-mono text-safe font-bold uppercase">Tasked Response</p>
          <p className="text-xs font-semibold text-foreground">Rescue Teams 1 & 2</p>
          <p className="text-[10px] text-safe mt-0.5">Rerouted via GST Road Bypass</p>
        </div>
      ),
    },
    position: { x: 1100, y: 140 },
    style: {
      background: "oklch(0.72 0.17 150 / 15%)",
      border: "1.5px solid var(--color-safe)",
      borderRadius: "8px",
      width: 200,
    },
    targetPosition: Position.Left,
  },
];

const graphEdges: Edge[] = [
  {
    id: "ge-inc-bld",
    source: "g-incident",
    target: "g-bld203",
    label: "destroys",
    animated: true,
    style: { stroke: "#e53e3e", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#e53e3e" },
  },
  {
    id: "ge-inc-pwr",
    source: "g-incident",
    target: "g-pwr02",
    label: "floods",
    animated: true,
    style: { stroke: "#dd6b20", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#dd6b20" },
  },
  {
    id: "ge-bld-road",
    source: "g-bld203",
    target: "g-road",
    label: "debris blocks",
    animated: true,
    style: { stroke: "#e53e3e", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#e53e3e" },
  },
  {
    id: "ge-road-hosp",
    source: "g-road",
    target: "g-hospital",
    label: "cuts access to",
    animated: true,
    style: { stroke: "#e53e3e", strokeWidth: 2.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#e53e3e" },
  },
  {
    id: "ge-pwr-hosp",
    source: "g-pwr02",
    target: "g-hospital",
    label: "threatens power",
    style: { stroke: "#dd6b20", strokeWidth: 1.5, strokeDasharray: "4 2" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#dd6b20" },
  },
  {
    id: "ge-hosp-res",
    source: "g-hospital",
    target: "g-resource",
    label: "triggers dispatch",
    animated: true,
    style: { stroke: "#48bb78", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#48bb78" },
  },
];

function KnowledgeGraphPage() {
  const [mounted, setMounted] = useState(false);

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
              <Network className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">
                Disaster Knowledge Graph & Cascading Impact
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Causal chain exploration. Trace cascading systemic failures from initial structural
              destruction to downstream healthcare impacts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono px-2.5 py-1">
              ONTOLOGY: 48 NODES · 82 EDGES
            </span>
          </div>
        </div>

        {/* Causal Chain Explanation Banner */}
        <div className="panel p-3.5 bg-panel-elevated/40 border-l-4 border-l-primary space-y-1">
          <p className="label-mono text-primary font-bold">
            What does this damage cause? (Causal Trace)
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground pt-1">
            <span>Building BLD-203 Collapse</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Adyar Bridge Debris Blockage</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Hospital Road Access Cut</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-critical">Ambulance Transit Delay (+9m)</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-safe">Autonomous Reroute via GST Road</span>
          </div>
        </div>

        {/* Visual Graph Canvas */}
        <div className="panel p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <span>Interactive Incident Entity-Relationship Graph</span>
            </h2>
            <span className="label-mono text-[10px]">Multi-Hop Graph Exploration</span>
          </div>

          <div className="h-[480px] w-full rounded-md border border-border bg-neutral-950 overflow-hidden relative">
            {mounted ? (
              <ReactFlow
                nodes={graphNodes}
                edges={graphEdges}
                fitView
                className="bg-neutral-950"
                proOptions={{ hideAttribution: false }}
              >
                <Background color="#2d3748" gap={18} />
                <Controls className="bg-panel border-border" />
                <MiniMap
                  nodeColor={(n) => (n.id === "g-hospital" ? "#e53e3e" : "#4299e1")}
                  className="bg-panel border border-border"
                />
              </ReactFlow>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground font-mono">
                INITIALIZING GRAPH ONTOLOGY ENGINE...
              </div>
            )}
          </div>
        </div>

        {/* Cascading Impact Walkthrough */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="panel p-4 space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase label-mono">
              1. Direct Physical Damage
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Category-4 wind shear and hydrodynamic drag cause structural failure at unreinforced
              commercial masonry unit BLD-203.
            </p>
          </div>
          <div className="panel p-4 space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase label-mono">
              2. Secondary Infrastructure Failure
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Collapsed concrete walls create a 14-meter debris choke point directly over the Adyar
              Bridge Link, making it impassable to wheels.
            </p>
          </div>
          <div className="panel p-4 space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase label-mono">
              3. Systemic Operational Consequence
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Emergency medical transit to Apollo Greams Road is obstructed, triggering autonomous
              AI ambulance rerouting via GST Road Bypass.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
