// src/lib/audit-logger.ts
export type OperatorRole = "commander" | "responder" | "analyst" | "admin";

export interface AuditEntry {
  id: string;
  timestamp: string;
  operatorRole: OperatorRole;
  operatorName: string;
  action: string;
  category: "override" | "dispatch" | "evacuation" | "sortie" | "resolution" | "scenario";
  details: string;
  targetId?: string;
  approved: boolean;
}

const initialLog: AuditEntry[] = [
  {
    id: "AUD-001",
    timestamp: "14:15 UTC",
    operatorRole: "commander",
    operatorName: "Commander R. Sharma",
    action: "Declared Incident Severity CRITICAL",
    category: "override",
    details: "Activated cyclone emergency protocol for Zone 1 and Zone 3",
    targetId: "INC-2026-CHN-017",
    approved: true,
  },
  {
    id: "AUD-002",
    timestamp: "15:20 UTC",
    operatorRole: "commander",
    operatorName: "Commander R. Sharma",
    action: "Approved Evacuation Radius Expansion",
    category: "evacuation",
    details: "Expanded evacuation envelope by 600m along Marina Coast following AI recommendation",
    targetId: "Z3",
    approved: true,
  },
  {
    id: "AUD-003",
    timestamp: "15:45 UTC",
    operatorRole: "responder",
    operatorName: "Tactical Lead M. Anand",
    action: "Dispatched Rescue Teams to Adyar Basin",
    category: "dispatch",
    details: "4 Rescue Teams and 3 Ambulances tasked to Z1 near blocked bridge",
    targetId: "Z1",
    approved: true,
  },
  {
    id: "AUD-004",
    timestamp: "16:08 UTC",
    operatorRole: "analyst",
    operatorName: "Senior Analyst K. Mehta",
    action: "Resolved Evidence Conflict for BLD-118",
    category: "resolution",
    details: "Accepted UAV Frame 302 over unverified social media total collapse claims",
    targetId: "BLD-118",
    approved: true,
  },
];

let memoryLog: AuditEntry[] = [...initialLog];
const listeners = new Set<() => void>();

export function getAuditLog(): AuditEntry[] {
  return [...memoryLog];
}

export function logAuditAction(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
  const newEntry: AuditEntry = {
    ...entry,
    id: `AUD-${String(memoryLog.length + 1).padStart(3, "0")}`,
    timestamp: new Date().toUTCString().slice(17, 25) + " UTC",
  };
  memoryLog = [newEntry, ...memoryLog];
  listeners.forEach((l) => l());
  return newEntry;
}

export function subscribeAuditLog(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
