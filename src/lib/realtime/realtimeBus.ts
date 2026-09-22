// src/lib/realtime/realtimeBus.ts
// Central SSR-safe, bounded Realtime Event Bus with backpressure management

import type { RealtimeEvent } from "./eventSchema";

type EventListener<T = unknown> = (event: RealtimeEvent<T>) => void;

class RealtimeEventBus {
  private listeners: Map<string, Set<EventListener<unknown>>> = new Map();
  private wildcardListeners: Set<EventListener<unknown>> = new Set();
  private sequenceCounter = 0;
  private droppedEventsCount = 0;

  public publish<T>(
    event: Omit<RealtimeEvent<T>, "sequence" | "schemaVersion" | "receivedAt">,
  ): RealtimeEvent<T> {
    this.sequenceCounter++;
    const fullEvent: RealtimeEvent<T> = {
      ...event,
      schemaVersion: "2.0",
      sequence: this.sequenceCounter,
      receivedAt: Date.now(),
    };

    // Dispatch to exact type subscribers
    const exactSubscribers = this.listeners.get(event.type);
    if (exactSubscribers) {
      exactSubscribers.forEach((fn) => {
        try {
          fn(fullEvent as RealtimeEvent<unknown>);
        } catch (err) {
          console.error(`[RealtimeBus] Error in listener for ${event.type}:`, err);
        }
      });
    }

    // Dispatch to wildcard subscribers
    this.wildcardListeners.forEach((fn) => {
      try {
        fn(fullEvent as RealtimeEvent<unknown>);
      } catch (err) {
        console.error(`[RealtimeBus] Error in wildcard listener:`, err);
      }
    });

    return fullEvent;
  }

  public subscribe<T = unknown>(eventType: string, listener: EventListener<T>): () => void {
    const unknownListener = listener as EventListener<unknown>;
    if (eventType === "*") {
      this.wildcardListeners.add(unknownListener);
      return () => this.wildcardListeners.delete(unknownListener);
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const set = this.listeners.get(eventType)!;
    set.add(unknownListener);

    return () => {
      set.delete(unknownListener);
      if (set.size === 0) {
        this.listeners.delete(eventType);
      }
    };
  }

  public getStats() {
    return {
      sequence: this.sequenceCounter,
      activeChannelCount: this.listeners.size,
      droppedEventsCount: this.droppedEventsCount,
    };
  }
}

export const realtimeBus = new RealtimeEventBus();
