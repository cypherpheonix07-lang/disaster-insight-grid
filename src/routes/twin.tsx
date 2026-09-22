import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { Box, Eye, Layers, RotateCcw, Shield, Sparkles } from "lucide-react";

import { AppShell } from "@/components/shell/AppShell";
import { BuildingPanel } from "@/components/BuildingPanel";
import {
  buildings,
  zones,
  isFlooded,
  floodDepthAt,
  type Building,
  type TimeStep,
} from "@/data/incident";
import { useOps } from "@/lib/ops-store";
import { damageFill, damageLabel, num } from "@/lib/damage";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/twin")({
  head: () => ({
    meta: [
      { title: "3D Digital Twin — AegisVision AI" },
      {
        name: "description",
        content:
          "Photorealistic 3D city digital twin: structural geometry, animated flood plane, LOD buildings and spatial intelligence for Cyclone Vaayu.",
      },
    ],
  }),
  component: TwinPage,
});

const damageColors: Record<string, string> = {
  destroyed: "#e53e3e",
  major: "#dd6b20",
  minor: "#d69e2e",
  intact: "#319795",
};

// 3D Building Mesh Component
function BuildingMesh({
  building,
  selected,
  flooded,
  onSelect,
}: {
  building: Building;
  selected: boolean;
  flooded: boolean;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = damageColors[building.damage] || "#718096";

  const height = building.h * 0.8;
  const posY = height / 2;

  return (
    <mesh
      ref={meshRef}
      position={[building.x * 0.7, posY, -building.z * 0.7]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(building.id);
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[building.w * 0.7, height, building.d * 0.7]} />
      <meshStandardMaterial
        color={selected ? "#63b3ed" : color}
        roughness={0.4}
        metalness={0.2}
        wireframe={false}
        emissive={selected ? "#3182ce" : flooded ? "#1a365d" : "#000000"}
        emissiveIntensity={selected ? 0.6 : flooded ? 0.3 : 0}
      />
    </mesh>
  );
}

// 3D Flood Plane with wave animation
function FloodWaterPlane({ depth }: { depth: number }) {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.position.y = depth * 1.5 + Math.sin(clock.getElapsedTime() * 1.5) * 0.15;
    }
  });

  return (
    <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, depth * 1.5, 0]}>
      <planeGeometry args={[220, 200, 32, 32]} />
      <meshStandardMaterial
        color="#2b6cb0"
        transparent
        opacity={0.45}
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
}

// Zone Center Label
function ZoneMarker({ zone }: { zone: (typeof zones)[number] }) {
  return (
    <group position={[zone.center[0] * 0.7, 0.5, -zone.center[1] * 0.7]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[zone.radius * 0.68, zone.radius * 0.7, 32]} />
        <meshBasicMaterial color="#4299e1" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function TwinScene({
  buildingsList,
  selectedId,
  step,
  onSelectBuilding,
  floodOffset,
}: {
  buildingsList: Building[];
  selectedId: string | null;
  step: TimeStep;
  onSelectBuilding: (id: string) => void;
  floodOffset: number;
}) {
  const meanDepth = 1.8 + floodOffset;

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[60, 100, 40]} intensity={1.2} castShadow />
      <directionalLight position={[-60, 40, -40]} intensity={0.4} />

      {/* Terrain grid ground */}
      <gridHelper args={[240, 60, "#2d3748", "#1a202c"]} position={[0, -0.05, 0]} />

      {/* Flood water plane */}
      <FloodWaterPlane depth={meanDepth} />

      {/* Zone boundaries */}
      {zones.map((z) => (
        <ZoneMarker key={z.id} zone={z} />
      ))}

      {/* 3D Buildings */}
      {buildingsList.map((b) => (
        <BuildingMesh
          key={b.id}
          building={b}
          selected={b.id === selectedId}
          flooded={isFlooded(b, step, floodOffset)}
          onSelect={onSelectBuilding}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={20}
        maxDistance={220}
      />
    </>
  );
}

function TwinPage() {
  const { step, selectedBuildingId, select } = useOps();
  const [mounted, setMounted] = useState(false);
  const [waterOffset, setWaterOffset] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sampleBuildings = useMemo(() => buildings.slice(0, 180), []);

  return (
    <AppShell>
      <div className="grid gap-3 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
        {/* Left Twin Controls */}
        <div className="space-y-3">
          <div className="panel p-3 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Box className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">3D Twin Environment</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Procedural WebGL city model rendered with real elevation and structural footprints.
            </p>

            <div>
              <div className="flex justify-between items-center text-xs">
                <span className="label-mono">Simulation Water Offset</span>
                <span className="font-mono text-primary font-bold">
                  +{waterOffset.toFixed(1)} m
                </span>
              </div>
              <Slider
                className="mt-2"
                min={0}
                max={3}
                step={0.2}
                value={[waterOffset]}
                onValueChange={([v]) => setWaterOffset(v ?? 0)}
              />
            </div>

            <div className="rounded border border-border p-2 bg-panel-elevated/40 space-y-1.5 text-xs">
              <p className="label-mono text-[10px]">Color Legend</p>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#e53e3e]" />
                  <span>Destroyed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#dd6b20]" />
                  <span>Major</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#d69e2e]" />
                  <span>Minor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#319795]" />
                  <span>Intact</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground border-t border-border pt-2 space-y-1">
              <p>• Left-click + drag to rotate orbit</p>
              <p>• Right-click + drag to pan</p>
              <p>• Scroll wheel to zoom</p>
              <p>• Click any structure to inspect dossier</p>
            </div>
          </div>
        </div>

        {/* Center 3D Canvas Canvas */}
        <div className="panel relative min-h-[500px] xl:min-h-[640px] flex flex-col overflow-hidden bg-neutral-950">
          <div className="absolute top-3 left-3 z-10 rounded-md border border-border/70 bg-panel/80 px-2.5 py-1 text-xs backdrop-blur font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-safe animate-pulse-slow" />
            <span>3D WEBGL ENGINE ACTIVE · 60 FPS</span>
          </div>

          {mounted ? (
            <div className="flex-1 w-full h-full min-h-[500px]">
              <Canvas
                shadows
                camera={{ position: [50, 45, 60], fov: 45 }}
                className="w-full h-full"
              >
                <TwinScene
                  buildingsList={sampleBuildings}
                  selectedId={selectedBuildingId}
                  step={step}
                  onSelectBuilding={(id) => select(id)}
                  floodOffset={waterOffset}
                />
              </Canvas>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Initializing WebGL 3D context...
            </div>
          )}
        </div>

        {/* Right Building Intelligence Panel */}
        {selectedBuildingId ? (
          <BuildingPanel />
        ) : (
          <div className="panel p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Sparkles className="h-4 w-4 text-ai" />
              <h2 className="text-sm font-semibold">Twin Operational Telemetry</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Select any building in the 3D viewport to inspect its multimodal evidence chain,
              damage classification, and structural telemetry.
            </p>

            <div className="rounded border border-border p-3 bg-panel-elevated/40 space-y-2 text-xs">
              <p className="label-mono">Digital Twin Highlights</p>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modeled Structures:</span>
                  <span className="font-semibold text-foreground">{sampleBuildings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Flood Level:</span>
                  <span className="font-semibold text-primary">
                    {(1.8 + waterOffset).toFixed(1)} m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Surge Front:</span>
                  <span className="font-semibold text-critical">Zone 3 Marina Coast</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
