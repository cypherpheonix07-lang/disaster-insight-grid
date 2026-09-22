// src/lib/realtime/adapters/mockAdapter.ts
// Pluggable Realtime Adapter Interface and Mock/Synthetic Implementation

import type { RealtimeEvent } from "../eventSchema";
import { syntheticFeed } from "../syntheticFeed";
import { realtimeBus } from "../realtimeBus";

export interface RealtimeAdapter {
  name: string;
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  onEvent: (cb: (event: RealtimeEvent) => void) => () => void;
}

export class MockRealtimeAdapter implements RealtimeAdapter {
  public name = "Synthetic deterministic feed";
  private connected = false;

  public connect() {
    if (this.connected) return;
    this.connected = true;
    syntheticFeed.start();
  }

  public disconnect() {
    this.connected = false;
    syntheticFeed.stop();
  }

  public isConnected() {
    return this.connected;
  }

  public onEvent(cb: (event: RealtimeEvent) => void) {
    return realtimeBus.subscribe("*", cb);
  }
}

export const mockAdapter = new MockRealtimeAdapter();
