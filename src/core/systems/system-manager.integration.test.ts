/**
 * SystemManager Integration Tests
 * Test SystemManager with real game systems
 */

import { beforeEach, describe, expect, it } from "vitest";
import { SystemManager } from "./system-manager";
import { EventQueue, EventType } from "../../systems/event-queue";
import { InputSystem } from "../../systems/input";
import { HUDSystem } from "../../systems/hud";
import { BoothSystem } from "../../systems/booth";
import { SystemPriority } from "./system.interface";

describe("SystemManager Integration", () => {
  let manager: SystemManager;

  beforeEach(() => {
    manager = new SystemManager();
  });

  describe("EventQueue Integration", () => {
    it("should register and initialize EventQueue", () => {
      const eventQueue = new EventQueue();

      manager.register(eventQueue);
      manager.initialize();

      expect(manager.has("EventQueue")).toBe(true);
      expect(manager.get<EventQueue>("EventQueue")).toBe(eventQueue);
    });

    it("EventQueue should have highest priority (executed first)", () => {
      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();
      const hudSystem = new HUDSystem();

      // Register in random order
      manager.register(hudSystem);
      manager.register(eventQueue);
      manager.register(inputSystem);

      manager.initialize();

      // Verify EventQueue priority
      expect(eventQueue.priority).toBe(SystemPriority.EVENT_QUEUE);
      expect(eventQueue.priority).toBeLessThan(inputSystem.priority);
      expect(eventQueue.priority).toBeLessThan(hudSystem.priority);
    });

    it("should process delayed events via SystemManager.update", () => {
      const eventQueue = new EventQueue();
      manager.register(eventQueue);
      manager.initialize();

      let executed = false;
      eventQueue.subscribe(EventType.ReloadComplete, () => {
        executed = true;
      });

      eventQueue.publish(EventType.ReloadComplete, {}, 3000);

      // Update 2 seconds
      manager.update(2.0);
      expect(executed).toBe(false);

      // Update 1 more second (total 3 seconds)
      manager.update(1.0);
      expect(executed).toBe(true);
    });

    it("systems can communicate via EventQueue", () => {
      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();

      manager.register(eventQueue);
      manager.register(inputSystem);
      manager.initialize();

      let waveStarted = false;

      eventQueue.subscribe(EventType.WaveStart, (data) => {
        expect(data.waveNumber).toBe(1);
        waveStarted = true;
      });

      eventQueue.publish(EventType.WaveStart, { waveNumber: 1 });

      expect(waveStarted).toBe(true);
    });
  });

  describe("All Systems Integration", () => {
    it("should register all game systems", () => {
      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();
      const hudSystem = new HUDSystem();
      const boothSystem = new BoothSystem();

      manager.register(eventQueue);
      manager.register(inputSystem);
      manager.register(hudSystem);
      manager.register(boothSystem);

      expect(manager.count).toBe(4);
    });

    it("should initialize all systems in correct order", () => {
      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();
      const hudSystem = new HUDSystem();
      const boothSystem = new BoothSystem();

      manager.register(eventQueue);
      manager.register(inputSystem);
      manager.register(hudSystem);
      manager.register(boothSystem);

      expect(() => manager.initialize()).not.toThrow();
    });

    it("should update all systems", () => {
      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();
      const hudSystem = new HUDSystem();
      const boothSystem = new BoothSystem();

      manager.register(eventQueue);
      manager.register(inputSystem);
      manager.register(hudSystem);
      manager.register(boothSystem);

      manager.initialize();

      expect(() => manager.update(0.016)).not.toThrow();
    });

    it("should destroy all systems", () => {
      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();
      const hudSystem = new HUDSystem();
      const boothSystem = new BoothSystem();

      manager.register(eventQueue);
      manager.register(inputSystem);
      manager.register(hudSystem);
      manager.register(boothSystem);

      manager.initialize();
      manager.update(0.016);

      expect(() => manager.destroy()).not.toThrow();
      expect(manager.count).toBe(0);
    });
  });

  describe("System Priority Order", () => {
    it("should execute systems in priority order", () => {
      const executionOrder: string[] = [];

      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();
      const hudSystem = new HUDSystem();
      const boothSystem = new BoothSystem();

      // Wrap update methods to track execution order
      const originalEventQueueUpdate = eventQueue.update.bind(eventQueue);
      const originalInputUpdate = inputSystem.update.bind(inputSystem);
      const originalHUDUpdate = hudSystem.update.bind(hudSystem);
      const originalBoothUpdate = boothSystem.update.bind(boothSystem);

      eventQueue.update = (deltaTime: number) => {
        executionOrder.push("EventQueue");
        originalEventQueueUpdate(deltaTime);
      };

      inputSystem.update = (deltaTime: number) => {
        executionOrder.push("InputSystem");
        originalInputUpdate(deltaTime);
      };

      hudSystem.update = (deltaTime: number) => {
        executionOrder.push("HUDSystem");
        originalHUDUpdate(deltaTime);
      };

      boothSystem.update = (deltaTime: number) => {
        executionOrder.push("BoothSystem");
        originalBoothUpdate(deltaTime);
      };

      // Register in random order
      manager.register(hudSystem);
      manager.register(boothSystem);
      manager.register(inputSystem);
      manager.register(eventQueue);

      manager.initialize();
      manager.update(0.016);

      // Verify execution order: EventQueue (0) → InputSystem (100) → BoothSystem (200) → HUDSystem (900)
      expect(executionOrder).toEqual([
        "EventQueue",
        "InputSystem",
        "BoothSystem",
        "HUDSystem",
      ]);
    });
  });

  describe("Performance", () => {
    it("should handle multiple systems at 60 FPS", () => {
      const eventQueue = new EventQueue();
      const inputSystem = new InputSystem();
      const hudSystem = new HUDSystem();
      const boothSystem = new BoothSystem();

      manager.register(eventQueue);
      manager.register(inputSystem);
      manager.register(hudSystem);
      manager.register(boothSystem);

      manager.initialize();

      const start = performance.now();

      // Simulate 60 frames (1 second @ 60 FPS)
      for (let i = 0; i < 60; i++) {
        manager.update(0.016);
      }

      const duration = performance.now() - start;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
