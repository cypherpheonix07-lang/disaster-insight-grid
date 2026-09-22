// src/lib/realtime/realtimeStore.ts
// Zustand store for derived realtime telemetry, capped ring buffers, and operator mutations

import { create } from "zustand";
import type {
  RealtimeEvent,
  DroneTelemetryPayload,
  HospitalCapacityPayload,
  AgentTaskPayload,
} from "./eventSchema";
import { logAuditAction } from "@/lib/audit-logger";
import { queueOfflineAction } from "@/lib/offline-manager";

export interface TelemetryPoint {
  time: string;
  timestamp: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  sensorHealth: number;
  windSpeed: number;
  rainfall: number;
}

export interface RealtimeState {
  feedStatus: "LIVE" | "STALE" | "OFFLINE" | "SYNCING";
  lastTickAt: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  sensorHealthScore: number;
  windSpeed: number;
  rainfall: number;
  activeIncidentCount: number;
  exposedPopulation: number;
  unresolvedConflictCount: number;
  pendingDroneApprovals: number;
  activeSorties: number;
  agentQueueDepth: number;
  unreadAlerts: number;

  // Capped ring buffers
  telemetryHistory: TelemetryPoint[]; // max 60 items
  recentEvents: RealtimeEvent[]; // max 50 items

  // Dynamic entity telemetry
  drones: Record<string, DroneTelemetryPayload>;
  hospitals: Record<string, HospitalCapacityPayload>;
  agents: Record<string, AgentTaskPayload>;

  // Actions
  setFeedStatus: (status: "LIVE" | "STALE" | "OFFLINE" | "SYNCING") => void;
  recordTelemetryTick: (payload: {
    latencyP50: number;
    latencyP95: number;
    latencyP99: number;
    sensorHealth: number;
    windSpeed: number;
    rainfall: number;
    activeIncidents: number;
    exposedPopulation: number;
  }) => void;
  updateDrone: (payload: DroneTelemetryPayload) => void;
  updateHospital: (payload: HospitalCapacityPayload) => void;
  updateAgent: (payload: AgentTaskPayload) => void;
  appendEvent: (event: RealtimeEvent) => void;

  // Operator actions with audit logging + offline queuing
  acknowledgeAlert: (alertId: string, title: string) => void;
  approveDroneSortie: (droneId: string, sortieId: string, targetZone: string) => void;
  dispatchEmergencyTeam: (teamType: string, zoneId: string, teamCount: number) => void;
  adjudicateConflict: (conflictId: string, chosenReading: string, structureId: string) => void;
}

const MAX_HISTORY = 60;
const MAX_EVENTS = 50;

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  feedStatus: "LIVE",
  lastTickAt: Date.now(),
  latencyP50: 18,
  latencyP95: 42,
  latencyP99: 68,
  sensorHealthScore: 98.4,
  windSpeed: 118,
  rainfall: 142,
  activeIncidentCount: 3,
  exposedPopulation: 425000,
  unresolvedConflictCount: 2,
  pendingDroneApprovals: 1,
  activeSorties: 3,
  agentQueueDepth: 14,
  unreadAlerts: 4,

  telemetryHistory: [],
  recentEvents: [],

  drones: {
    "UAV-01": {
      droneId: "UAV-01",
      sortieId: "SRT-401",
      battery: 78,
      altitude: 120,
      speed: 44,
      status: "surveying",
      targetZone: "Zone 1 (Adyar)",
      framesIngested: 342,
    },
    "UAV-02": {
      droneId: "UAV-02",
      sortieId: "SRT-402",
      battery: 64,
      altitude: 95,
      speed: 38,
      status: "transmitting",
      targetZone: "Zone 3 (Marina)",
      framesIngested: 512,
    },
    "UAV-03": {
      droneId: "UAV-03",
      sortieId: "SRT-403",
      battery: 91,
      altitude: 150,
      speed: 52,
      status: "approaching",
      targetZone: "Zone 2 (T. Nagar)",
      framesIngested: 128,
    },
  },

  hospitals: {
    "HOSP-01": {
      hospitalId: "HOSP-01",
      name: "Apollo Greams Main",
      occupiedBeds: 540,
      totalBeds: 600,
      icuOccupied: 74,
      icuTotal: 80,
      generatorFuelPercent: 88,
      generatorFuelHours: 42,
      accessibilityStatus: "clear",
    },
    "HOSP-02": {
      hospitalId: "HOSP-02",
      name: "Rajiv Gandhi Govt General",
      occupiedBeds: 1120,
      totalBeds: 1250,
      icuOccupied: 138,
      icuTotal: 150,
      generatorFuelPercent: 62,
      generatorFuelHours: 24,
      accessibilityStatus: "compromised",
    },
    "HOSP-03": {
      hospitalId: "HOSP-03",
      name: "Fortis Malar Adyar",
      occupiedBeds: 185,
      totalBeds: 220,
      icuOccupied: 28,
      icuTotal: 30,
      generatorFuelPercent: 35,
      generatorFuelHours: 12,
      accessibilityStatus: "blocked",
    },
  },

  agents: {
    "agent-damage": {
      agentId: "agent-damage",
      agentName: "Damage Assessor Agent",
      queueDepth: 6,
      tasksCompleted: 842,
      errorRate: 0.2,
      status: "processing",
      latestOutputSummary: "Classified BLD-118 roof plane delamination with 94% confidence",
    },
    "agent-routing": {
      agentId: "agent-routing",
      agentName: "Dynamic Evac Router",
      queueDepth: 2,
      tasksCompleted: 420,
      errorRate: 0.1,
      status: "synthesizing",
      latestOutputSummary: "Bypassed Adyar Bridge; rerouted Wave 2 through Mount Road corridor",
    },
    "agent-resource": {
      agentId: "agent-resource",
      agentName: "Resource Optimization Agent",
      queueDepth: 4,
      tasksCompleted: 615,
      errorRate: 0.0,
      status: "evaluating",
      latestOutputSummary: "Suggested 2 mobile 500kVA generators to Fortis Malar",
    },
  },

  setFeedStatus: (feedStatus) => set({ feedStatus }),

  recordTelemetryTick: (payload) => {
    const timeStr = new Date().toTimeString().slice(0, 8);
    const point: TelemetryPoint = {
      time: timeStr,
      timestamp: Date.now(),
      ...payload,
    };

    set((state) => {
      const nextHistory = [...state.telemetryHistory, point];
      if (nextHistory.length > MAX_HISTORY) {
        nextHistory.shift();
      }
      return {
        lastTickAt: point.timestamp,
        latencyP50: payload.latencyP50,
        latencyP95: payload.latencyP95,
        latencyP99: payload.latencyP99,
        sensorHealthScore: payload.sensorHealth,
        windSpeed: payload.windSpeed,
        rainfall: payload.rainfall,
        activeIncidentCount: payload.activeIncidents,
        exposedPopulation: payload.exposedPopulation,
        telemetryHistory: nextHistory,
      };
    });
  },

  updateDrone: (payload) =>
    set((state) => ({
      drones: {
        ...state.drones,
        [payload.droneId]: payload,
      },
    })),

  updateHospital: (payload) =>
    set((state) => ({
      hospitals: {
        ...state.hospitals,
        [payload.hospitalId]: payload,
      },
    })),

  updateAgent: (payload) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [payload.agentId]: payload,
      },
    })),

  appendEvent: (event) =>
    set((state) => {
      const nextEvents = [event, ...state.recentEvents];
      if (nextEvents.length > MAX_EVENTS) {
        nextEvents.pop();
      }
      return { recentEvents: nextEvents };
    }),

  acknowledgeAlert: (alertId, title) => {
    set((s) => ({ unreadAlerts: Math.max(0, s.unreadAlerts - 1) }));
    logAuditAction({
      operatorRole: "commander",
      operatorName: "Commander R. Sharma",
      action: `Acknowledged Alert: ${title}`,
      category: "resolution",
      details: `Operator manually cleared notification alert ${alertId}`,
      targetId: alertId,
      approved: true,
    });
    if (get().feedStatus === "OFFLINE") {
      queueOfflineAction("ALERT_ACKNOWLEDGE", { alertId, title });
    }
  },

  approveDroneSortie: (droneId, sortieId, targetZone) => {
    set((s) => ({
      pendingDroneApprovals: Math.max(0, s.pendingDroneApprovals - 1),
      activeSorties: s.activeSorties + 1,
    }));
    logAuditAction({
      operatorRole: "commander",
      operatorName: "Commander R. Sharma",
      action: `Approved Autonomous UAV Launch: ${sortieId}`,
      category: "sortie",
      details: `Authorised ${droneId} to begin aerial surveillance over ${targetZone}`,
      targetId: sortieId,
      approved: true,
    });
    if (get().feedStatus === "OFFLINE") {
      queueOfflineAction("DRONE_SORTIE_APPROVE", { droneId, sortieId, targetZone });
    }
  },

  dispatchEmergencyTeam: (teamType, zoneId, teamCount) => {
    logAuditAction({
      operatorRole: "commander",
      operatorName: "Commander R. Sharma",
      action: `Tactical Dispatch: ${teamCount}x ${teamType} to ${zoneId}`,
      category: "dispatch",
      details: `Allocated frontline emergency capacity to critical sector`,
      targetId: zoneId,
      approved: true,
    });
    if (get().feedStatus === "OFFLINE") {
      queueOfflineAction("DISPATCH_TEAM", { teamType, zoneId, teamCount });
    }
  },

  adjudicateConflict: (conflictId, chosenReading, structureId) => {
    set((s) => ({ unresolvedConflictCount: Math.max(0, s.unresolvedConflictCount - 1) }));
    logAuditAction({
      operatorRole: "analyst",
      operatorName: "Senior Analyst K. Mehta",
      action: `Adjudicated Sensor Discrepancy for ${structureId}`,
      category: "resolution",
      details: `Overrode conflicting sensors with operator verified assessment: ${chosenReading}`,
      targetId: conflictId,
      approved: true,
    });
    if (get().feedStatus === "OFFLINE") {
      queueOfflineAction("ADJUDICATE_CONFLICT", { conflictId, chosenReading, structureId });
    }
  },
}));
