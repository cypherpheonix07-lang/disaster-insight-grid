// src/lib/realtime/eventSchema.ts
// Strict event envelope contract for AegisVision AI Realtime Engine

export type EventSource =
  "satellite" | "uav" | "crowd" | "sensor" | "model" | "operator" | "system";
export type EventSeverity = "info" | "warning" | "critical" | "catastrophic";

export interface RealtimeEvent<T = Record<string, unknown>> {
  schemaVersion: "2.0";
  id: string;
  sequence: number;
  timestamp: number;
  receivedAt?: number;
  type: string;
  source: EventSource;
  severity: EventSeverity;
  confidence: number; // 0.0 - 1.0 (Model confidence)
  reliability: number; // 0.0 - 1.0 (Sensor reliability)
  epistemicCertainty: number; // 0.0 - 1.0 (Information completeness)
  simulated: true;
  entityId?: string;
  incidentId?: string;
  workspace?: string;
  causationId?: string;
  correlationId?: string;
  idempotencyKey?: string;
  payload: T;
  auditRequired?: boolean;
  ttlMs?: number;
}

export interface TelemetryTickPayload {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  sensorHealth: number;
  windSpeed: number;
  rainfall: number;
  activeIncidents: number;
  exposedPopulation: number;
}

export interface DroneTelemetryPayload {
  droneId: string;
  sortieId: string;
  battery: number;
  altitude: number;
  speed: number;
  status: "standby" | "approaching" | "surveying" | "transmitting" | "returning";
  targetZone: string;
  framesIngested: number;
}

export interface AgentTaskPayload {
  agentId: string;
  agentName: string;
  queueDepth: number;
  tasksCompleted: number;
  errorRate: number;
  status: "idle" | "processing" | "synthesizing" | "evaluating";
  latestOutputSummary: string;
}

export interface HospitalCapacityPayload {
  hospitalId: string;
  name: string;
  occupiedBeds: number;
  totalBeds: number;
  icuOccupied: number;
  icuTotal: number;
  generatorFuelPercent: number;
  generatorFuelHours: number;
  accessibilityStatus: "clear" | "compromised" | "blocked";
}

export interface SensorConflictPayload {
  conflictId: string;
  structureId: string;
  sensorA: { source: EventSource; reading: string; confidence: number };
  sensorB: { source: EventSource; reading: string; confidence: number };
  status: "detected" | "investigating" | "resolved";
}
