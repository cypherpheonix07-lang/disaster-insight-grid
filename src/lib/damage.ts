import type { DamageState, Severity } from "@/data/incident";

export const damageLabel: Record<DamageState, string> = {
  intact: "No damage",
  minor: "Minor damage",
  major: "Major damage",
  destroyed: "Destroyed",
};

/** Symbol shown alongside colour so meaning is never colour-only (WCAG 1.4.1). */
export const damageGlyph: Record<DamageState, string> = {
  intact: "●",
  minor: "▲",
  major: "◆",
  destroyed: "✕",
};

export const damageFill: Record<DamageState, string> = {
  intact: "var(--safe)",
  minor: "var(--warning)",
  major: "oklch(0.66 0.2 40)",
  destroyed: "var(--critical)",
};

export const damageTextClass: Record<DamageState, string> = {
  intact: "text-safe",
  minor: "text-warning",
  major: "text-[oklch(0.72_0.19_40)]",
  destroyed: "text-critical",
};

export const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export const severityClass: Record<Severity, string> = {
  critical: "border-critical/50 bg-critical/15 text-critical",
  high: "border-[oklch(0.66_0.2_40)]/50 bg-[oklch(0.66_0.2_40)]/15 text-[oklch(0.74_0.19_40)]",
  moderate: "border-warning/50 bg-warning/15 text-warning",
  low: "border-safe/50 bg-safe/15 text-safe",
};

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function num(n: number) {
  return n.toLocaleString("en-IN");
}
