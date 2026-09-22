// src/lib/realtime/syntheticFeed.ts
// Deterministic multi-rate synthetic telemetry engine with tab-visibility pause and SSR safety

import { createMulberry32, hashStringToSeed, meanRevertingWalk } from "./determinism";
import { realtimeBus } from "./realtimeBus";
import { useRealtimeStore } from "./realtimeStore";
import type { RealtimeEvent, TelemetryTickPayload } from "./eventSchema";

class SyntheticFeedEngine {
  private isRunning = false;
  private timerFast: ReturnType<typeof setInterval> | null = null;
  private timerMedium: ReturnType<typeof setInterval> | null = null;
  private timerSlow: ReturnType<typeof setInterval> | null = null;
  private prng = createMulberry32(hashStringToSeed("INC-2026-CHN-017-V2"));

  // State metrics for continuous mean-reverting walks
  private lat50 = 18;
  private lat95 = 42;
  private lat99 = 68;
  private sensorHealth = 98.4;
  private wind = 118;
  private rain = 142;

  public start() {
    if (typeof window === "undefined" || this.isRunning) return;
    this.isRunning = true;

    // Fast 1s loop: Telemetry jitter, sparkline points
    this.timerFast = setInterval(() => {
      this.tickFastTelemetry();
    }, 1000);

    // Medium 3.5s loop: Drone telemetry, battery drain, hospital load drift
    this.timerMedium = setInterval(() => {
      this.tickOperationalDrift();
    }, 3500);

    // Slow 15s loop: Weather strategic evolution, sensor conflict injection
    this.timerSlow = setInterval(() => {
      this.tickStrategicForecast();
    }, 15000);

    // Tab visibility handling: pause when backgrounded to prevent memory bloat
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibility);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.timerFast) clearInterval(this.timerFast);
    if (this.timerMedium) clearInterval(this.timerMedium);
    if (this.timerSlow) clearInterval(this.timerSlow);
    this.timerFast = null;
    this.timerMedium = null;
    this.timerSlow = null;

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibility);
    }
  }

  private handleVisibility = () => {
    if (document.hidden) {
      if (this.timerFast) clearInterval(this.timerFast);
      if (this.timerMedium) clearInterval(this.timerMedium);
      this.timerFast = null;
      this.timerMedium = null;
      useRealtimeStore.getState().setFeedStatus("STALE");
    } else if (this.isRunning) {
      useRealtimeStore.getState().setFeedStatus("LIVE");
      if (!this.timerFast) {
        this.timerFast = setInterval(() => this.tickFastTelemetry(), 1000);
      }
      if (!this.timerMedium) {
        this.timerMedium = setInterval(() => this.tickOperationalDrift(), 3500);
      }
    }
  };

  private tickFastTelemetry() {
    const r1 = this.prng();
    const r2 = this.prng();
    const r3 = this.prng();
    const r4 = this.prng();
    const r5 = this.prng();

    this.lat50 = Math.round(meanRevertingWalk(this.lat50, 18, 0.15, 2.5, 8, 35, r1));
    this.lat95 = Math.round(meanRevertingWalk(this.lat95, 40, 0.12, 3.5, 22, 70, r2));
    this.lat99 = Math.round(meanRevertingWalk(this.lat99, 65, 0.1, 5.0, 35, 110, r3));
    this.sensorHealth = parseFloat(
      meanRevertingWalk(this.sensorHealth, 98.2, 0.08, 0.3, 94.0, 99.9, r4).toFixed(1),
    );
    this.wind = Math.round(meanRevertingWalk(this.wind, 120, 0.05, 4.0, 85, 160, r5));

    const payload: TelemetryTickPayload = {
      latencyP50: this.lat50,
      latencyP95: this.lat95,
      latencyP99: this.lat99,
      sensorHealth: this.sensorHealth,
      windSpeed: this.wind,
      rainfall: this.rain,
      activeIncidents: 3,
      exposedPopulation: 425000,
    };

    useRealtimeStore.getState().recordTelemetryTick(payload);

    // Also publish to event bus
    const event: Omit<
      RealtimeEvent<TelemetryTickPayload>,
      "sequence" | "schemaVersion" | "receivedAt"
    > = {
      id: `EVT-TICK-${Date.now()}`,
      timestamp: Date.now(),
      type: "telemetry.tick",
      source: "sensor",
      severity: "info",
      confidence: 0.99,
      reliability: this.sensorHealth / 100,
      epistemicCertainty: 0.95,
      simulated: true,
      workspace: "command",
      payload,
    };
    realtimeBus.publish(event);
  }

  private tickOperationalDrift() {
    const store = useRealtimeStore.getState();
    const r = this.prng();

    // 1. Drone battery subtle decrease or altitude drift
    const droneList = Object.values(store.drones);
    if (droneList.length > 0) {
      const targetDrone = droneList[Math.floor(r * droneList.length)];
      const batteryDelta = r > 0.6 ? -1 : 0;
      const nextBattery = Math.max(15, targetDrone.battery + batteryDelta);
      const nextAltitude = Math.round(
        meanRevertingWalk(targetDrone.altitude, 110, 0.2, 6, 80, 180, this.prng()),
      );

      const updatedDrone = {
        ...targetDrone,
        battery: nextBattery,
        altitude: nextAltitude,
        framesIngested: targetDrone.framesIngested + Math.floor(this.prng() * 4),
      };
      store.updateDrone(updatedDrone);
    }

    // 2. Hospital occupancy slight drift
    const hospitalList = Object.values(store.hospitals);
    if (hospitalList.length > 0) {
      const targetHosp = hospitalList[Math.floor(this.prng() * hospitalList.length)];
      const deltaBeds = this.prng() > 0.5 ? 1 : -1;
      const nextOccupied = Math.min(
        targetHosp.totalBeds,
        Math.max(50, targetHosp.occupiedBeds + deltaBeds),
      );
      store.updateHospital({
        ...targetHosp,
        occupiedBeds: nextOccupied,
      });
    }

    // 3. Agent task completions
    const agentList = Object.values(store.agents);
    if (agentList.length > 0) {
      const targetAgent = agentList[Math.floor(this.prng() * agentList.length)];
      store.updateAgent({
        ...targetAgent,
        tasksCompleted: targetAgent.tasksCompleted + 1,
        queueDepth: Math.max(1, targetAgent.queueDepth + (this.prng() > 0.6 ? 1 : -1)),
      });
    }
  }

  private tickStrategicForecast() {
    // Strategic wind/rainfall forecast shift
    const r = this.prng();
    this.rain = Math.round(meanRevertingWalk(this.rain, 145, 0.05, 3.5, 110, 220, r));
  }
}

export const syntheticFeed = new SyntheticFeedEngine();
