import { create } from "zustand";
import type { DamageState, TimeStep } from "@/data/incident";
import type { OperatorRole } from "@/lib/audit-logger";
import type { SyncStatus } from "@/lib/offline-manager";

export type SourceKey = "satellite" | "drone" | "social" | "sensor";
export type MapLayerKey =
  "buildings" | "roads" | "zones" | "hospitals" | "shelters" | "drones" | "riskEnvelopes";

interface OpsState {
  // Existing state slices
  damageFilter: Record<DamageState, boolean>;
  confidenceMin: number;
  sources: Record<SourceKey, boolean>;
  step: TimeStep;
  selectedBuildingId: string | null;
  search: string;
  toggleDamage: (d: DamageState) => void;
  setConfidenceMin: (v: number) => void;
  toggleSource: (s: SourceKey) => void;
  setStep: (s: TimeStep) => void;
  select: (id: string | null) => void;
  setSearch: (v: string) => void;
  reset: () => void;

  // Platform 2.0 expanded slices
  role: OperatorRole;
  setRole: (role: OperatorRole) => void;
  copilotOpen: boolean;
  setCopilotOpen: (open: boolean) => void;
  toggleCopilot: () => void;
  mapLayers: Record<MapLayerKey, boolean>;
  toggleMapLayer: (layer: MapLayerKey) => void;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  replayPlaying: boolean;
  setReplayPlaying: (playing: boolean) => void;
  activeIncidentId: string;
  setActiveIncidentId: (id: string) => void;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
}

const initial = {
  damageFilter: { intact: true, minor: true, major: true, destroyed: true } as Record<
    DamageState,
    boolean
  >,
  confidenceMin: 60,
  sources: { satellite: true, drone: true, social: true, sensor: true } as Record<
    SourceKey,
    boolean
  >,
  step: 0 as TimeStep,
  selectedBuildingId: null as string | null,
  search: "",

  role: "commander" as OperatorRole,
  copilotOpen: false,
  mapLayers: {
    buildings: true,
    roads: true,
    zones: true,
    hospitals: true,
    shelters: true,
    drones: true,
    riskEnvelopes: true,
  } as Record<MapLayerKey, boolean>,
  syncStatus: "live" as SyncStatus,
  replayPlaying: false,
  activeIncidentId: "INC-2026-CHN-017",
  selectedZoneId: null as string | null,
};

export const useOps = create<OpsState>((set) => ({
  ...initial,
  toggleDamage: (d) =>
    set((s) => ({ damageFilter: { ...s.damageFilter, [d]: !s.damageFilter[d] } })),
  setConfidenceMin: (v) => set({ confidenceMin: v }),
  toggleSource: (k) => set((s) => ({ sources: { ...s.sources, [k]: !s.sources[k] } })),
  setStep: (step) => set({ step }),
  select: (selectedBuildingId) => set({ selectedBuildingId }),
  setSearch: (search) => set({ search }),
  reset: () => set({ ...initial }),

  setRole: (role) => set({ role }),
  setCopilotOpen: (copilotOpen) => set({ copilotOpen }),
  toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),
  toggleMapLayer: (layer) =>
    set((s) => ({ mapLayers: { ...s.mapLayers, [layer]: !s.mapLayers[layer] } })),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setReplayPlaying: (replayPlaying) => set({ replayPlaying }),
  setActiveIncidentId: (activeIncidentId) => set({ activeIncidentId }),
  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
}));
