/**
 * EventQueue System Tests
 * SPEC § 2.3.6: EventQueue System
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EventQueue, EventType } from "./event-queue";

describe("EventQueue System", () => {
  let eventQueue: EventQueue;

  beforeEach(() => {
    // Reset singleton before each test
    EventQueue.resetInstance();
    eventQueue = EventQueue.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = EventQueue.getInstance();
      const instance2 = EventQueue.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should create new instance after reset", () => {
      const instance1 = EventQueue.getInstance();
      EventQueue.resetInstance();
      const instance2 = EventQueue.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("Publish Event (Immediate)", () => {
    it("should notify subscribers immediately when delay is 0", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.WaveStart, handler);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ waveNumber: 1 });
    });

    it("should notify multiple subscribers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventQueue.subscribe(EventType.WaveStart, handler1);
      eventQueue.subscribe(EventType.WaveStart, handler2);
      eventQueue.subscribe(EventType.WaveStart, handler3);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 2 });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it("should discard event when no subscribers (SPEC § 2.3.6 Error Scenarios)", () => {
      // Should not throw error
      expect(() => {
        eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });
      }).not.toThrow();
    });

    it("should only notify subscribers of specific event type", () => {
      const waveHandler = vi.fn();
      const reloadHandler = vi.fn();

      eventQueue.subscribe(EventType.WaveStart, waveHandler);
      eventQueue.subscribe(EventType.ReloadComplete, reloadHandler);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });

      expect(waveHandler).toHaveBeenCalledTimes(1);
      expect(reloadHandler).not.toHaveBeenCalled();
    });
  });

  describe("Publish Event (Delayed)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should execute event after delay", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.ReloadComplete, handler);

      // Publish with 3000ms delay (reload time)
      eventQueue.publish(EventType.ReloadComplete, {}, 3000);

      // Should not execute immediately
      eventQueue.processQueue();
      expect(handler).not.toHaveBeenCalled();

      // Advance time by 3000ms
      vi.advanceTimersByTime(3000);
      eventQueue.processQueue();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should execute multiple delayed events in order", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.WaveStart, handler);

      // Publish events with different delays
      eventQueue.publish(EventType.WaveStart, { waveNumber: 3 }, 3000);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 }, 1000);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 2 }, 2000);

      // Process after 1000ms
      vi.advanceTimersByTime(1000);
      eventQueue.processQueue();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenNthCalledWith(1, { waveNumber: 1 });

      // Process after 2000ms total
      vi.advanceTimersByTime(1000);
      eventQueue.processQueue();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(2, { waveNumber: 2 });

      // Process after 3000ms total
      vi.advanceTimersByTime(1000);
      eventQueue.processQueue();
      expect(handler).toHaveBeenCalledTimes(3);
      expect(handler).toHaveBeenNthCalledWith(3, { waveNumber: 3 });
    });

    it("should treat negative delay as immediate (SPEC § 2.3.6 Error Scenarios)", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.WaveStart, handler);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 }, -100);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should not execute events before their time", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.BuffExpired, handler);

      eventQueue.publish(EventType.BuffExpired, { buffType: "stinky-tofu" }, 2000);

      // Process after 1000ms (before event time)
      vi.advanceTimersByTime(1000);
      eventQueue.processQueue();
      expect(handler).not.toHaveBeenCalled();

      // Process after 2000ms (at event time)
      vi.advanceTimersByTime(1000);
      eventQueue.processQueue();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Subscribe", () => {
    it("should deduplicate same handler (SPEC § 2.3.6 Error Scenarios)", () => {
      const handler = vi.fn();

      eventQueue.subscribe(EventType.WaveStart, handler);
      eventQueue.subscribe(EventType.WaveStart, handler); // Duplicate
      eventQueue.subscribe(EventType.WaveStart, handler); // Duplicate

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });

      // Should only be called once
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should allow subscribing to multiple event types", () => {
      const handler = vi.fn();

      eventQueue.subscribe(EventType.WaveStart, handler);
      eventQueue.subscribe(EventType.WaveComplete, handler);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("Unsubscribe", () => {
    it("should stop receiving events after unsubscribe", () => {
      const handler = vi.fn();

      eventQueue.subscribe(EventType.WaveStart, handler);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });
      expect(handler).toHaveBeenCalledTimes(1);

      eventQueue.unsubscribe(EventType.WaveStart, handler);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 2 });
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it("should have no effect when handler does not exist (SPEC § 2.3.6 Error Scenarios)", () => {
      const handler = vi.fn();

      expect(() => {
        eventQueue.unsubscribe(EventType.WaveStart, handler);
      }).not.toThrow();
    });

    it("should not affect other subscribers", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventQueue.subscribe(EventType.WaveStart, handler1);
      eventQueue.subscribe(EventType.WaveStart, handler2);

      eventQueue.unsubscribe(EventType.WaveStart, handler1);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("should continue executing other subscribers when handler throws error", () => {
      const errorHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      const normalHandler = vi.fn();

      // Spy on console.error to verify error logging
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      eventQueue.subscribe(EventType.WaveStart, errorHandler);
      eventQueue.subscribe(EventType.WaveStart, normalHandler);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });

      // Error handler should have been called and thrown
      expect(errorHandler).toHaveBeenCalledTimes(1);
      // Normal handler should still be called
      expect(normalHandler).toHaveBeenCalledTimes(1);
      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Process Queue", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should process multiple events in single tick", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.WaveStart, handler);

      // Publish multiple events with same delay
      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 }, 1000);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 2 }, 1000);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 3 }, 1000);

      vi.advanceTimersByTime(1000);
      eventQueue.processQueue();

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("should not process events that are not ready", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.WaveStart, handler);

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 }, 1000);
      eventQueue.publish(EventType.WaveStart, { waveNumber: 2 }, 2000);

      vi.advanceTimersByTime(1500);
      eventQueue.processQueue();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ waveNumber: 1 });
    });
  });

  describe("Clear", () => {
    it("should clear all subscribers", () => {
      const handler = vi.fn();
      eventQueue.subscribe(EventType.WaveStart, handler);

      eventQueue.clear();
      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should clear all delayed events", () => {
      vi.useFakeTimers();

      const handler = vi.fn();
      eventQueue.subscribe(EventType.ReloadComplete, handler);

      eventQueue.publish(EventType.ReloadComplete, {}, 3000);
      eventQueue.clear();

      vi.advanceTimersByTime(3000);
      eventQueue.processQueue();

      expect(handler).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("Integration: Game Events", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should handle wave completion flow", () => {
      const waveCompleteHandler = vi.fn();
      const upgradeHandler = vi.fn();
      const waveStartHandler = vi.fn();

      eventQueue.subscribe(EventType.WaveComplete, waveCompleteHandler);
      eventQueue.subscribe(EventType.UpgradeSelected, upgradeHandler);
      eventQueue.subscribe(EventType.WaveStart, waveStartHandler);

      // Wave 1 complete
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });
      expect(waveCompleteHandler).toHaveBeenCalledWith({ waveNumber: 1 });

      // Player selects upgrade
      eventQueue.publish(EventType.UpgradeSelected, { upgradeId: "extra-chili" });
      expect(upgradeHandler).toHaveBeenCalledWith({ upgradeId: "extra-chili" });

      // Wave 2 starts
      eventQueue.publish(EventType.WaveStart, { waveNumber: 2 });
      expect(waveStartHandler).toHaveBeenCalledWith({ waveNumber: 2 });
    });

    it("should handle reload flow", () => {
      const reloadHandler = vi.fn();
      eventQueue.subscribe(EventType.ReloadComplete, reloadHandler);

      // Trigger reload (3 second delay)
      eventQueue.publish(EventType.ReloadComplete, {}, 3000);

      // Not complete yet
      vi.advanceTimersByTime(2000);
      eventQueue.processQueue();
      expect(reloadHandler).not.toHaveBeenCalled();

      // Complete after 3 seconds
      vi.advanceTimersByTime(1000);
      eventQueue.processQueue();
      expect(reloadHandler).toHaveBeenCalledTimes(1);
    });

    it("should handle synthesis and buff expiration flow", () => {
      const synthesisHandler = vi.fn();
      const buffExpiredHandler = vi.fn();

      eventQueue.subscribe(EventType.SynthesisTriggered, synthesisHandler);
      eventQueue.subscribe(EventType.BuffExpired, buffExpiredHandler);

      // Synthesis triggered
      eventQueue.publish(EventType.SynthesisTriggered, { recipeId: "stinky-tofu" });
      expect(synthesisHandler).toHaveBeenCalledWith({ recipeId: "stinky-tofu" });

      // Buff expires after 2 seconds
      eventQueue.publish(EventType.BuffExpired, { buffType: "stinky-tofu" }, 2000);

      vi.advanceTimersByTime(2000);
      eventQueue.processQueue();
      expect(buffExpiredHandler).toHaveBeenCalledWith({ buffType: "stinky-tofu" });
    });

    it("should handle enemy death flow", () => {
      const enemyDeathHandler = vi.fn();
      eventQueue.subscribe(EventType.EnemyDeath, enemyDeathHandler);

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "123",
        position: { x: 500, y: 300 },
      });

      expect(enemyDeathHandler).toHaveBeenCalledWith({
        enemyId: "123",
        position: { x: 500, y: 300 },
      });
    });
  });
});
