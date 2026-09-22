// src/lib/realtime/determinism.ts
// Seeded PRNG and bounded continuous random walk algorithms for deterministic emergency simulation

/**
 * Fast, high-quality 32-bit PRNG (Mulberry32)
 */
export function createMulberry32(seed: number) {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string into an integer seed
 */
export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Ornstein-Uhlenbeck mean-reverting process with strict bounds.
 * Prevents erratic jitter while simulating realistic physical telemetry drift.
 */
export function meanRevertingWalk(
  current: number,
  targetMean: number,
  speed: number, // theta: rate of mean reversion (0.05 - 0.2)
  volatility: number, // sigma: noise intensity (0.5 - 2.0)
  minBound: number,
  maxBound: number,
  randomVal: number, // 0 to 1 uniform random
): number {
  // Box-Muller transform approximation from uniform (0,1)
  const z = (randomVal - 0.5) * 2;
  const drift = speed * (targetMean - current);
  const shock = volatility * z;
  const nextVal = current + drift + shock;
  return Math.min(Math.max(nextVal, minBound), maxBound);
}

/**
 * Discrete Markov state transition
 */
export function markovTransition<T extends string>(
  currentState: T,
  transitions: Record<T, Partial<Record<T, number>>>,
  randomVal: number,
): T {
  const row = transitions[currentState];
  if (!row) return currentState;

  let cumulative = 0;
  for (const [nextState, prob] of Object.entries(row) as [T, number][]) {
    cumulative += prob;
    if (randomVal <= cumulative) {
      return nextState;
    }
  }
  return currentState;
}
