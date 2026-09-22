// Mock disaster intelligence dataset — Cyclone Vaayu, Chennai 2026.
// Pure TypeScript, safe to import on server and client.

export type DamageState = "intact" | "minor" | "major" | "destroyed";
export type Severity = "critical" | "high" | "moderate" | "low";
export type TimeStep = 0 | 1 | 6 | 24;

export interface Zone {
  id: string;
  name: string;
  population: number;
  floodDepth: number; // meters, current
  fireRisk: number; // 0..1
  damageIndex: number; // 0..1
  center: [number, number]; // x, z in world units
  radius: number;
}

export interface Building {
  id: string;
  zoneId: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  type: "residential" | "commercial" | "hospital" | "school" | "industrial" | "shelter";
  occupancy: number;
  damage: DamageState;
  confidence: number;
  elevation: number; // meters above baseline
}

export interface Hospital {
  id: string;
  buildingId: string;
  name: string;
  zoneId: string;
  beds: number;
  occupancyPct: number;
  powerFailureProb: number;
  roadAccess: "open" | "degraded" | "blocked";
  risk: Severity;
  reasons: string[];
}

export interface Road {
  id: string;
  name: string;
  points: [number, number][];
  status: "open" | "degraded" | "blocked";
  closureAt: TimeStep | null;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "analyzing" | "idle" | "verifying" | "optimizing" | "predicting";
  currentTask: string;
  processed: number;
  processedUnit: string;
  finding: string;
  confidence: number;
  lastAction: string;
  recommendations: string[];
  throughput: number[]; // sparkline
}

export interface EvidenceSource {
  source: "satellite" | "drone" | "social" | "sensor";
  label: string;
  observation: string;
  confidence: number;
  reliability: number;
  timestamp: string;
  agrees: boolean;
}

export interface EvidenceCase {
  buildingId: string;
  verdict: DamageState;
  finalConfidence: number;
  agreement: number;
  conflict: boolean;
  sources: EvidenceSource[];
  timeline: { t: string; agent: string; event: string }[];
}

export interface PredictionStep {
  t: TimeStep;
  label: string;
  floodDepth: number;
  affectedBuildings: number;
  roadClosures: number;
  populationAtRisk: number;
  fireSpreadHa: number;
  powerOutagePct: number;
  hospitalsAtRisk: number;
}

export interface ResourceAllocation {
  zoneId: string;
  rescueTeams: number;
  ambulances: number;
  boats: number;
  medics: number;
  priority: Severity;
  reason: string;
  eta: string;
}

export interface Alert {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  time: string;
  agent: string;
}

// ---------- Deterministic PRNG ----------
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const incident = {
  id: "INC-2026-CHN-017",
  name: "Cyclone Vaayu",
  location: "Chennai Metropolitan Region, Tamil Nadu",
  type: "Tropical Cyclone + Urban Flooding",
  severity: "critical" as Severity,
  declaredAt: "2026-09-16T22:40:00Z",
  landfall: "2026-09-17T14:10:00Z",
  category: "Very Severe Cyclonic Storm",
  windKmh: 165,
  rainfallMm: 412,
  stats: {
    affectedBuildings: 12450,
    destroyed: 1200,
    majorDamage: 3180,
    minorDamage: 8070,
    populationAtRisk: 45000,
    displaced: 18200,
    sheltersOpen: 42,
    roadsBlocked: 37,
    hospitalsAtRisk: 4,
  },
  aiConfidence: 0.91,
  lastFusion: "12s ago",
};

export const zones: Zone[] = [
  {
    id: "Z1",
    name: "Zone 1 · Adyar Basin",
    population: 38200,
    floodDepth: 2.4,
    fireRisk: 0.08,
    damageIndex: 0.71,
    center: [-60, -40],
    radius: 45,
  },
  {
    id: "Z2",
    name: "Zone 2 · Velachery",
    population: 51600,
    floodDepth: 1.8,
    fireRisk: 0.05,
    damageIndex: 0.58,
    center: [40, -50],
    radius: 50,
  },
  {
    id: "Z3",
    name: "Zone 3 · Marina Coast",
    population: 22400,
    floodDepth: 3.1,
    fireRisk: 0.02,
    damageIndex: 0.83,
    center: [80, 30],
    radius: 40,
  },
  {
    id: "Z4",
    name: "Zone 4 · Ambattur Industrial",
    population: 29900,
    floodDepth: 0.6,
    fireRisk: 0.42,
    damageIndex: 0.46,
    center: [-70, 50],
    radius: 48,
  },
  {
    id: "Z5",
    name: "Zone 5 · Central Business District",
    population: 17300,
    floodDepth: 0.9,
    fireRisk: 0.12,
    damageIndex: 0.31,
    center: [0, 20],
    radius: 38,
  },
];

const zoneById = Object.fromEntries(zones.map((z) => [z.id, z])) as Record<string, Zone>;

function buildBuildings(): Building[] {
  const rand = mulberry32(20260917);
  const out: Building[] = [];
  const gridStep = 9;
  let n = 0;
  for (let gx = -110; gx <= 110; gx += gridStep) {
    for (let gz = -90; gz <= 90; gz += gridStep) {
      // leave road corridors
      if (Math.abs(gx % 45) < 4 || Math.abs(gz % 36) < 4) continue;
      if (rand() < 0.14) continue;
      const jitterX = (rand() - 0.5) * 3;
      const jitterZ = (rand() - 0.5) * 3;
      const x = gx + jitterX;
      const z = gz + jitterZ;
      // nearest zone
      let zone = zones[0]!;
      let best = Infinity;
      for (const zn of zones) {
        const dx = zn.center[0] - x;
        const dz = zn.center[1] - z;
        const dist = Math.hypot(dx, dz);
        if (dist < best) {
          best = dist;
          zone = zn;
        }
      }
      const cbd = zone.id === "Z5";
      const h = cbd ? 8 + rand() * 34 : 3 + rand() * 12;
      const elevation = 1.2 + ((x + 110) / 220) * 2.8 + rand() * 0.8 - (zone.id === "Z3" ? 1.4 : 0);
      const r = rand();
      let type: Building["type"] = "residential";
      if (r > 0.97) type = "hospital";
      else if (r > 0.94) type = "school";
      else if (r > 0.9) type = "shelter";
      else if (zone.id === "Z4" && r > 0.5) type = "industrial";
      else if (cbd && r > 0.4) type = "commercial";
      // damage driven by zone damage index + noise + flood vs elevation
      const floodFactor = Math.max(0, zone.floodDepth - elevation * 0.4);
      const score = zone.damageIndex * 0.6 + floodFactor * 0.25 + rand() * 0.35;
      let damage: DamageState = "intact";
      if (score > 0.95) damage = "destroyed";
      else if (score > 0.75) damage = "major";
      else if (score > 0.5) damage = "minor";
      n++;
      out.push({
        id: `BLD-${String(n).padStart(3, "0")}`,
        zoneId: zone.id,
        x,
        z,
        w: 5 + rand() * 2.5,
        d: 5 + rand() * 2.5,
        h,
        type,
        occupancy:
          type === "hospital"
            ? 320
            : type === "shelter"
              ? 600
              : Math.round(20 + rand() * (cbd ? 400 : 120)),
        damage,
        confidence: 0.78 + rand() * 0.2,
        elevation,
      });
    }
  }
  return out;
}

export const buildings: Building[] = buildBuildings();
export const buildingById = Object.fromEntries(buildings.map((b) => [b.id, b])) as Record<
  string,
  Building
>;

export function zoneOf(b: Building) {
  return zoneById[b.zoneId]!;
}

const hospitalBuildings = buildings.filter((b) => b.type === "hospital").slice(0, 6);
const hospitalNames = [
  "Apollo Greams Road",
  "Rajiv Gandhi Govt. General",
  "Fortis Malar",
  "Kauvery Alwarpet",
  "Stanley Medical College",
  "Global Health City",
];

export const hospitals: Hospital[] = hospitalBuildings.map((b, i) => {
  const z = zoneOf(b);
  const powerFailureProb = Math.min(0.95, 0.2 + z.floodDepth * 0.18 + (i % 3) * 0.06);
  const roadAccess: Hospital["roadAccess"] =
    z.floodDepth > 2.2 ? "blocked" : z.floodDepth > 1.2 ? "degraded" : "open";
  const risk: Severity =
    z.floodDepth > 2.2
      ? "critical"
      : z.floodDepth > 1.5
        ? "high"
        : z.floodDepth > 0.8
          ? "moderate"
          : "low";
  const reasons: string[] = [];
  if (z.floodDepth > 1.2)
    reasons.push(`Flood expansion predicted (+${(z.floodDepth * 0.4).toFixed(1)} m in 6 h)`);
  if (roadAccess !== "open") reasons.push(`Road accessibility ${roadAccess}`);
  reasons.push(`Power failure probability ${Math.round(powerFailureProb * 100)}%`);
  if (b.damage !== "intact") reasons.push(`Structure shows ${b.damage} damage`);
  return {
    id: `HSP-${i + 1}`,
    buildingId: b.id,
    name: hospitalNames[i] ?? `Hospital ${i + 1}`,
    zoneId: z.id,
    beds: 180 + i * 90,
    occupancyPct: 74 + i * 4,
    powerFailureProb,
    roadAccess,
    risk,
    reasons,
  };
});

export const roads: Road[] = [
  {
    id: "R1",
    name: "Anna Salai",
    points: [
      [-110, 0],
      [110, 0],
    ],
    status: "degraded",
    closureAt: 6,
  },
  {
    id: "R2",
    name: "OMR Corridor",
    points: [
      [0, -90],
      [0, 90],
    ],
    status: "open",
    closureAt: null,
  },
  {
    id: "R3",
    name: "ECR Coastal",
    points: [
      [90, -90],
      [90, 90],
    ],
    status: "blocked",
    closureAt: 0,
  },
  {
    id: "R4",
    name: "Inner Ring Rd",
    points: [
      [-110, -36],
      [110, -36],
    ],
    status: "open",
    closureAt: 24,
  },
  {
    id: "R5",
    name: "GST Road",
    points: [
      [-110, 36],
      [110, 36],
    ],
    status: "degraded",
    closureAt: 1,
  },
  {
    id: "R6",
    name: "Poonamallee High Rd",
    points: [
      [-45, -90],
      [-45, 90],
    ],
    status: "open",
    closureAt: null,
  },
  {
    id: "R7",
    name: "Sardar Patel Rd",
    points: [
      [45, -90],
      [45, 90],
    ],
    status: "blocked",
    closureAt: 0,
  },
  {
    id: "R8",
    name: "Adyar Bridge Link",
    points: [
      [-110, -72],
      [110, -72],
    ],
    status: "blocked",
    closureAt: 0,
  },
  {
    id: "R9",
    name: "Kathipara Flyover",
    points: [
      [-110, 72],
      [110, 72],
    ],
    status: "open",
    closureAt: null,
  },
];

export const agents: Agent[] = [
  {
    id: "supervisor",
    name: "AI Supervisor Agent",
    role: "Orchestration & fusion",
    status: "optimizing",
    currentTask: "Fusing 6 agent streams · resolving 3 evidence conflicts",
    processed: 1482,
    processedUnit: "decisions",
    finding: "Zone 3 escalated to CRITICAL — consensus from satellite + drone",
    confidence: 0.91,
    lastAction: "Re-prioritized Zone 3 evacuation 41s ago",
    recommendations: [
      "Expand evacuation radius in Zone 3 by 600 m",
      "Re-route ambulances via GST Road",
    ],
    throughput: [12, 18, 15, 22, 28, 26, 31, 29, 34, 38, 36, 41],
  },
  {
    id: "satellite",
    name: "Satellite Intelligence Agent",
    role: "Sentinel-2 / Cartosat change detection",
    status: "analyzing",
    currentTask: "Change detection pass 14 · tiles 2,300–2,480",
    processed: 54320,
    processedUnit: "images",
    finding: "Roof collapse detected in Zone 4 (industrial cluster)",
    confidence: 0.93,
    lastAction: "Flagged 212 new structural anomalies",
    recommendations: ["Task high-res revisit over Zone 4 at 15:20 UTC"],
    throughput: [40, 44, 43, 52, 58, 61, 66, 64, 70, 72, 75, 79],
  },
  {
    id: "drone",
    name: "Drone Analysis Agent",
    role: "UAV frame segmentation",
    status: "analyzing",
    currentTask: "Processing Sortie D-07 · 4K frames over Adyar Basin",
    processed: 18904,
    processedUnit: "frames",
    finding: "Wall collapse confirmed on BLD-203 · debris blocking Adyar Bridge Link",
    confidence: 0.96,
    lastAction: "Confirmed 3 satellite findings, rejected 1",
    recommendations: ["Dispatch sortie D-08 to Marina Coast"],
    throughput: [8, 12, 16, 14, 20, 24, 22, 27, 30, 33, 31, 36],
  },
  {
    id: "social",
    name: "Social Media Verification Agent",
    role: "Geo-verified citizen reports",
    status: "verifying",
    currentTask: "Verifying 1,204 geo-tagged posts · deduplicating",
    processed: 41200,
    processedUnit: "posts",
    finding: "Citizen images corroborate collapse at BLD-203; 38% of Zone 2 posts unverifiable",
    confidence: 0.78,
    lastAction: "Downweighted 412 posts (reliability < 0.4)",
    recommendations: ["Treat Zone 2 social signals as low-reliability until drone pass"],
    throughput: [60, 58, 66, 72, 80, 85, 82, 90, 96, 101, 98, 104],
  },
  {
    id: "damage",
    name: "Damage Assessment Agent",
    role: "Multimodal structural classifier",
    status: "analyzing",
    currentTask: "Classifying 12,450 structures · pass 3/3",
    processed: 12450,
    processedUnit: "buildings",
    finding: "1,200 destroyed · 3,180 major · 8,070 minor",
    confidence: 0.89,
    lastAction: "Updated 96 damage states after drone confirmation",
    recommendations: ["Prioritize inspection of 64 low-confidence 'major' labels"],
    throughput: [20, 24, 30, 33, 38, 42, 40, 45, 49, 52, 55, 58],
  },
  {
    id: "prediction",
    name: "Prediction Agent",
    role: "Hydrological & fire spread forecasting",
    status: "predicting",
    currentTask: "Running flood ensemble (24 members) to T+24h",
    processed: 96,
    processedUnit: "ensemble runs",
    finding: "Flood front reaches Zone 5 CBD by T+6h at 0.9 m",
    confidence: 0.84,
    lastAction: "Published T+1h / T+6h / T+24h surfaces",
    recommendations: ["Pre-position pumps at CBD underpasses before T+4h"],
    throughput: [4, 6, 5, 8, 9, 11, 10, 13, 12, 15, 16, 18],
  },
  {
    id: "resource",
    name: "Resource Optimization Agent",
    role: "Allocation & routing",
    status: "optimizing",
    currentTask: "Solving allocation for 10 rescue teams · 5 ambulances · 8 boats",
    processed: 312,
    processedUnit: "plans",
    finding: "Zone 1 requires 4 teams + 3 ambulances (hospital + blocked roads)",
    confidence: 0.88,
    lastAction: "Generated allocation plan v14",
    recommendations: ["Clear Adyar Bridge Link first — unlocks 2 hospitals"],
    throughput: [10, 9, 12, 14, 13, 17, 19, 18, 22, 24, 23, 27],
  },
];

export const evidenceCases: EvidenceCase[] = [
  {
    buildingId: "BLD-203",
    verdict: "destroyed",
    finalConfidence: 0.94,
    agreement: 0.91,
    conflict: false,
    sources: [
      {
        source: "satellite",
        label: "Sentinel-2 · T+2h pass",
        observation: "Roof structure changed — 78% roof-plane loss vs. pre-event baseline",
        confidence: 0.89,
        reliability: 0.92,
        timestamp: "14:52 UTC",
        agrees: true,
      },
      {
        source: "drone",
        label: "Sortie D-07 · frame 1184",
        observation: "Wall collapse detected on north and east façades; debris field 14 m",
        confidence: 0.96,
        reliability: 0.96,
        timestamp: "15:18 UTC",
        agrees: true,
      },
      {
        source: "social",
        label: "3 geo-verified citizen images",
        observation: "Citizen images confirm collapse; one image inconsistent with geotag",
        confidence: 0.78,
        reliability: 0.63,
        timestamp: "15:02 UTC",
        agrees: true,
      },
    ],
    timeline: [
      { t: "14:52", agent: "Satellite", event: "Anomaly flagged: roof-plane change" },
      { t: "15:02", agent: "Social", event: "3 citizen posts geo-matched within 40 m" },
      { t: "15:18", agent: "Drone", event: "Sortie D-07 confirms wall collapse" },
      { t: "15:19", agent: "Damage", event: "Classified DESTROYED (0.94)" },
      { t: "15:20", agent: "Supervisor", event: "Decision accepted · added to evacuation set" },
    ],
  },
  {
    buildingId: "BLD-118",
    verdict: "major",
    finalConfidence: 0.81,
    agreement: 0.62,
    conflict: true,
    sources: [
      {
        source: "satellite",
        label: "Cartosat-3 · T+3h pass",
        observation: "Partial roof displacement; shadow analysis inconclusive under cloud",
        confidence: 0.71,
        reliability: 0.88,
        timestamp: "15:40 UTC",
        agrees: true,
      },
      {
        source: "drone",
        label: "Sortie D-05 · frame 302",
        observation: "Standing water 1.6 m; structural frame intact, ground floor compromised",
        confidence: 0.9,
        reliability: 0.95,
        timestamp: "16:05 UTC",
        agrees: true,
      },
      {
        source: "social",
        label: "7 citizen posts",
        observation:
          "Posts claim total collapse — contradicted by drone; likely refers to adjacent BLD-119",
        confidence: 0.52,
        reliability: 0.41,
        timestamp: "15:55 UTC",
        agrees: false,
      },
    ],
    timeline: [
      { t: "15:40", agent: "Satellite", event: "Partial displacement flagged" },
      { t: "15:55", agent: "Social", event: "Collapse claims received (7)" },
      { t: "16:05", agent: "Drone", event: "Frame intact · ground floor flooded" },
      { t: "16:06", agent: "Supervisor", event: "Conflict detected · social downweighted" },
      { t: "16:07", agent: "Damage", event: "Classified MAJOR (0.81)" },
    ],
  },
  {
    buildingId: "BLD-341",
    verdict: "intact",
    finalConfidence: 0.88,
    agreement: 0.84,
    conflict: false,
    sources: [
      {
        source: "satellite",
        label: "Sentinel-2 · T+2h pass",
        observation: "No roof change; water line 4 m from footprint",
        confidence: 0.86,
        reliability: 0.92,
        timestamp: "14:52 UTC",
        agrees: true,
      },
      {
        source: "sensor",
        label: "IoT water-level node WL-22",
        observation: "Depth 0.3 m at kerb; stable for 40 min",
        confidence: 0.93,
        reliability: 0.9,
        timestamp: "16:10 UTC",
        agrees: true,
      },
      {
        source: "social",
        label: "2 posts",
        observation: "Residents report power outage only",
        confidence: 0.7,
        reliability: 0.6,
        timestamp: "16:00 UTC",
        agrees: true,
      },
    ],
    timeline: [
      { t: "14:52", agent: "Satellite", event: "No structural change" },
      { t: "16:00", agent: "Social", event: "Outage reports only" },
      { t: "16:10", agent: "Sensor", event: "Water level stable" },
      { t: "16:11", agent: "Damage", event: "Classified INTACT (0.88)" },
    ],
  },
];

export const predictionSteps: PredictionStep[] = [
  {
    t: 0,
    label: "Now",
    floodDepth: 1.8,
    affectedBuildings: 12450,
    roadClosures: 37,
    populationAtRisk: 45000,
    fireSpreadHa: 12,
    powerOutagePct: 34,
    hospitalsAtRisk: 4,
  },
  {
    t: 1,
    label: "+1 h",
    floodDepth: 2.1,
    affectedBuildings: 12980,
    roadClosures: 41,
    populationAtRisk: 48200,
    fireSpreadHa: 15,
    powerOutagePct: 38,
    hospitalsAtRisk: 4,
  },
  {
    t: 6,
    label: "+6 h",
    floodDepth: 2.7,
    affectedBuildings: 14310,
    roadClosures: 52,
    populationAtRisk: 56900,
    fireSpreadHa: 21,
    powerOutagePct: 51,
    hospitalsAtRisk: 6,
  },
  {
    t: 24,
    label: "+24 h",
    floodDepth: 3.2,
    affectedBuildings: 15840,
    roadClosures: 58,
    populationAtRisk: 63400,
    fireSpreadHa: 19,
    powerOutagePct: 47,
    hospitalsAtRisk: 6,
  },
];

export const resourceInventory = { rescueTeams: 10, ambulances: 5, boats: 8, medics: 24 };

export const allocations: ResourceAllocation[] = [
  {
    zoneId: "Z1",
    rescueTeams: 4,
    ambulances: 3,
    boats: 3,
    medics: 9,
    priority: "critical",
    reason: "Hospital + high population density + Adyar Bridge Link blocked",
    eta: "14 min",
  },
  {
    zoneId: "Z3",
    rescueTeams: 3,
    ambulances: 1,
    boats: 4,
    medics: 6,
    priority: "critical",
    reason: "Deepest flooding (3.1 m) · 83% damage index · coastal surge ongoing",
    eta: "22 min",
  },
  {
    zoneId: "Z2",
    rescueTeams: 2,
    ambulances: 1,
    boats: 1,
    medics: 5,
    priority: "high",
    reason: "Largest population · roads degrading by T+1h",
    eta: "18 min",
  },
  {
    zoneId: "Z4",
    rescueTeams: 1,
    ambulances: 0,
    boats: 0,
    medics: 2,
    priority: "high",
    reason: "Fire risk 42% at industrial cluster · low flood exposure",
    eta: "26 min",
  },
  {
    zoneId: "Z5",
    rescueTeams: 0,
    ambulances: 0,
    boats: 0,
    medics: 2,
    priority: "moderate",
    reason: "Flood front arrives T+6h · pre-position pumps instead",
    eta: "—",
  },
];

export const alerts: Alert[] = [
  {
    id: "A1",
    severity: "critical",
    title: "Zone 3 escalated to CRITICAL",
    detail: "Coastal surge +0.4 m in 20 min · 2,140 residents inside expanded radius",
    time: "41s",
    agent: "Supervisor",
  },
  {
    id: "A2",
    severity: "critical",
    title: "Apollo Greams Road access blocked",
    detail: "Debris on Adyar Bridge Link · reroute via GST Road (+9 min)",
    time: "3m",
    agent: "Resource",
  },
  {
    id: "A3",
    severity: "high",
    title: "Roof collapse cluster · Zone 4",
    detail: "212 anomalies flagged across industrial sheds · fire risk rising",
    time: "6m",
    agent: "Satellite",
  },
  {
    id: "A4",
    severity: "high",
    title: "Flood front reaches CBD by T+6h",
    detail: "Ensemble mean 0.9 m at Anna Salai underpass",
    time: "11m",
    agent: "Prediction",
  },
  {
    id: "A5",
    severity: "moderate",
    title: "Social signal reliability drop · Zone 2",
    detail: "38% of posts unverifiable · weight reduced to 0.41",
    time: "15m",
    agent: "Social",
  },
];

export const suggestedQuestions = [
  "Which hospitals are at risk in the next 6 hours?",
  "Simulate flood increase by 2 meters",
  "Find unsafe roads for ambulance routing",
  "Generate an evacuation plan for Zone 3",
  "Why was BLD-203 classified as destroyed?",
  "How should I allocate 10 rescue teams?",
];

// ---------- Derived helpers ----------
export function damageCounts(list: Building[] = buildings) {
  const c: Record<DamageState, number> = { intact: 0, minor: 0, major: 0, destroyed: 0 };
  for (const b of list) c[b.damage]++;
  return c;
}

export function floodDepthAt(step: TimeStep, zone: Zone, extraMeters = 0) {
  const scale = { 0: 1, 1: 1.15, 6: 1.5, 24: 1.78 }[step];
  return zone.floodDepth * scale + extraMeters;
}

export function isFlooded(b: Building, step: TimeStep, extraMeters = 0) {
  return floodDepthAt(step, zoneOf(b), extraMeters) > b.elevation;
}

export function simulateFlood(extraMeters: number, step: TimeStep = 0) {
  const baseline = buildings.filter((b) => isFlooded(b, step, 0));
  const withRise = buildings.filter((b) => isFlooded(b, step, extraMeters));
  const newlyAffected = withRise.length - baseline.length;
  const scaleToCity = incident.stats.affectedBuildings / buildings.length;
  const popRisk =
    withRise.reduce((s, b) => s + b.occupancy, 0) - baseline.reduce((s, b) => s + b.occupancy, 0);
  const roadClosures = Math.round(extraMeters * 6);
  const hospitalsNew = hospitals.filter((h) => {
    const b = buildingById[h.buildingId]!;
    return !isFlooded(b, step, 0) && isFlooded(b, step, extraMeters);
  });
  return {
    extraMeters,
    affectedBuildingsDelta: Math.round(newlyAffected * scaleToCity),
    roadClosuresDelta: roadClosures,
    populationRiskDelta: Math.round(popRisk * scaleToCity),
    newlyAtRiskHospitals: hospitalsNew.map((h) => h.name),
    recommendation:
      extraMeters >= 1.5
        ? "Expand evacuation radius and pre-stage boats in Zones 1 and 3"
        : "Monitor and pre-position pumps at CBD underpasses",
  };
}

export function hospitalsAtRisk(hours: TimeStep = 6) {
  return hospitals
    .map((h) => {
      const z = zoneById[h.zoneId]!;
      const depth = floodDepthAt(hours, z);
      const risk: Severity =
        depth > 2.6 ? "critical" : depth > 1.8 ? "high" : depth > 1 ? "moderate" : "low";
      return { ...h, projectedFloodDepth: Number(depth.toFixed(1)), risk, zone: z.name };
    })
    .sort((a, b) => severityRank(a.risk) - severityRank(b.risk));
}

export function severityRank(s: Severity) {
  return { critical: 0, high: 1, moderate: 2, low: 3 }[s];
}

export function unsafeRoads(step: TimeStep = 0) {
  return roads.filter((r) => r.status !== "open" || (r.closureAt !== null && r.closureAt <= step));
}

export function evacuationPlan(zoneId: string) {
  const z = zoneById[zoneId] ?? zones[2]!;
  const zb = buildings.filter((b) => b.zoneId === z.id);
  const destroyed = zb.filter((b) => b.damage === "destroyed" || b.damage === "major");
  const shelters = buildings
    .filter((b) => b.type === "shelter" && b.zoneId !== z.id && b.damage === "intact")
    .slice(0, 3);
  const safeRoads = roads.filter((r) => r.status === "open").map((r) => r.name);
  return {
    zone: z.name,
    population: z.population,
    priorityStructures: destroyed.slice(0, 8).map((b) => b.id),
    shelters: shelters.map((s) => ({ id: s.id, zone: zoneById[s.zoneId]!.name, capacity: 600 })),
    routes: safeRoads,
    waves: [
      {
        wave: 1,
        window: "T+0 – T+1h",
        people: Math.round(z.population * 0.25),
        focus: "Ground-floor residents & hospitals",
      },
      {
        wave: 2,
        window: "T+1 – T+4h",
        people: Math.round(z.population * 0.45),
        focus: "Remaining flooded blocks",
      },
      {
        wave: 3,
        window: "T+4 – T+8h",
        people: Math.round(z.population * 0.3),
        focus: "Elevated blocks · shelter-in-place review",
      },
    ],
  };
}

export function getZone(id: string) {
  return zoneById[id];
}
