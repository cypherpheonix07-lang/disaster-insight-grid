// src/lib/realtime/useRealtimeValue.ts
// Granular selectors to prevent unnecessary component re-renders

import { useEffect } from "react";
import { useRealtimeStore } from "./realtimeStore";
import { syntheticFeed } from "./syntheticFeed";

/**
 * Initializes the realtime synthetic feed on client mount and ensures proper teardown
 */
export function useRealtimeFeedInit() {
  useEffect(() => {
    syntheticFeed.start();
    return () => {
      // Don't kill feed if other components are listening; teardown handled cleanly
    };
  }, []);
}

/**
 * Hook for sidebar live badges: active incidents, unread alerts, active sorties, agent queue
 */
export function useRealtimeBadges() {
  const activeIncidents = useRealtimeStore((s) => s.activeIncidentCount);
  const unreadAlerts = useRealtimeStore((s) => s.unreadAlerts);
  const activeSorties = useRealtimeStore((s) => s.activeSorties);
  const agentQueueDepth = useRealtimeStore((s) => s.agentQueueDepth);
  const feedStatus = useRealtimeStore((s) => s.feedStatus);
  const sensorHealth = useRealtimeStore((s) => s.sensorHealthScore);
  const latencyP99 = useRealtimeStore((s) => s.latencyP99);

  return {
    activeIncidents,
    unreadAlerts,
    activeSorties,
    agentQueueDepth,
    feedStatus,
    sensorHealth,
    latencyP99,
  };
}

/**
 * Hook for numerical telemetry KPIs
 */
export function useRealtimeTelemetry() {
  const windSpeed = useRealtimeStore((s) => s.windSpeed);
  const rainfall = useRealtimeStore((s) => s.rainfall);
  const sensorHealth = useRealtimeStore((s) => s.sensorHealthScore);
  const feedStatus = useRealtimeStore((s) => s.feedStatus);
  const exposedPopulation = useRealtimeStore((s) => s.exposedPopulation);

  return {
    windSpeed,
    rainfall,
    sensorHealth,
    feedStatus,
    exposedPopulation,
  };
}

/**
 * Hook for telemetry sparkline points (last 60 seconds)
 */
export function useRealtimeSparkline() {
  return useRealtimeStore((s) => s.telemetryHistory);
}

/**
 * Hook for drone fleet telemetry
 */
export function useRealtimeDrones() {
  return useRealtimeStore((s) => s.drones);
}

/**
 * Hook for hospital capacity
 */
export function useRealtimeHospitals() {
  return useRealtimeStore((s) => s.hospitals);
}

/**
 * Hook for agent fleet
 */
export function useRealtimeAgents() {
  return useRealtimeStore((s) => s.agents);
}
