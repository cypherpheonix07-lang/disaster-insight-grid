// src/services/api.ts

/**
 * Centralized API client for AegisVision AI backend services.
 * In Demo Mode (development) it falls back to the static data module
 * (`@/data/incident`) to keep the UI functional without a running server.
 */

import { incident, buildings, roads, zones, isFlooded, getZone } from "@/data/incident";

export type Building = (typeof buildings)[number];
export type Road = (typeof roads)[number];
export type Zone = (typeof zones)[number];

/** Helper to determine the base URL from environment variables. */
function getBaseUrl(): string {
  // Vite injects env variables prefixed with VITE_.
  // Fallback to empty string meaning relative to the site root.
  // Users can set VITE_API_BASE in .env files.
  return (import.meta.env.VITE_API_BASE as string) ?? "";
}

/** Generic fetch wrapper that adds JSON parsing and basic error handling. */
async function request<T>(path: string): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    // In demo mode we swallow errors and return static data.
    console.warn(`API request failed ${url}: ${response.status}`);
    throw new Error(`Failed to fetch ${path}`);
  }
  return (await response.json()) as T;
}

/** Fetch all buildings (demo fallback to static data). */
export async function getBuildings(): Promise<Building[]> {
  try {
    return await request<Building[]>("/api/buildings");
  } catch {
    // Demo / fallback – use static mock data.
    return buildings;
  }
}

/** Fetch road network data. */
export async function getRoads(): Promise<Road[]> {
  try {
    return await request<Road[]>("/api/roads");
  } catch {
    return roads;
  }
}

/** Fetch zone information. */
export async function getZones(): Promise<Zone[]> {
  try {
    return await request<Zone[]>("/api/zones");
  } catch {
    return zones;
  }
}

/** Fetch incident metadata (demo uses static incident). */
export async function getIncident() {
  try {
    return await request<typeof incident>("/api/incident");
  } catch {
    return incident;
  }
}

/** Convenience helpers that mirror the static data functions. */
export const api = {
  getBuildings,
  getRoads,
  getZones,
  getIncident,
  // Re‑export utilities for compatibility with existing code.
  isFlooded,
  getZone,
};

export default api;
