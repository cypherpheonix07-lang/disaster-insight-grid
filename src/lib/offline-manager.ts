// src/lib/offline-manager.ts
export type SyncStatus = "live" | "stale" | "offline" | "syncing";

export interface QueuedAction {
  id: string;
  createdAt: string;
  actionType: string;
  payload: Record<string, unknown>;
  synced: boolean;
}

let queue: QueuedAction[] = [];
let syncStatus: SyncStatus = "live";
const statusListeners = new Set<(status: SyncStatus) => void>();

export function getOfflineQueue(): QueuedAction[] {
  return [...queue];
}

export function queueOfflineAction(
  actionType: string,
  payload: Record<string, unknown>,
): QueuedAction {
  const item: QueuedAction = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toLocaleTimeString(),
    actionType,
    payload,
    synced: false,
  };
  queue.push(item);
  return item;
}

export function setSyncStatus(newStatus: SyncStatus) {
  syncStatus = newStatus;
  statusListeners.forEach((fn) => fn(syncStatus));
}

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function subscribeSyncStatus(fn: (status: SyncStatus) => void) {
  statusListeners.add(fn);
  return () => {
    statusListeners.delete(fn);
  };
}

export async function flushOfflineQueue(): Promise<{ syncedCount: number }> {
  if (queue.length === 0) return { syncedCount: 0 };
  setSyncStatus("syncing");
  // Simulate network synchronization roundtrip
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const count = queue.length;
  queue = [];
  setSyncStatus("live");
  return { syncedCount: count };
}
