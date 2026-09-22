// src/lib/feature-flags.ts
// Reversible feature flags for AegisVision AI Command Platform

export interface FeatureFlags {
  sidebarV2: boolean;
  realtimeSynthetic: boolean;
  interactiveWorkspacesV2: boolean;
  designTokensV2: boolean;
  density: "comfortable" | "dense" | "ultra";
  highContrast: boolean;
  colorblindSafe: boolean;
  reducedMotion: boolean;
}

const STORAGE_KEY = "aegis_feature_flags_v2";

const defaultFlags: FeatureFlags = {
  sidebarV2: true,
  realtimeSynthetic: true,
  interactiveWorkspacesV2: true,
  designTokensV2: true,
  density: "dense",
  highContrast: false,
  colorblindSafe: false,
  reducedMotion: false,
};

export function getFeatureFlags(): FeatureFlags {
  if (typeof window === "undefined") return defaultFlags;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultFlags;
    return { ...defaultFlags, ...JSON.parse(raw) };
  } catch {
    return defaultFlags;
  }
}

export function setFeatureFlag<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K],
): FeatureFlags {
  const current = getFeatureFlags();
  const updated = { ...current, [key]: value };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("aegis_flags_changed", { detail: updated }));
    } catch {
      // storage unavailable
    }
  }
  return updated;
}
