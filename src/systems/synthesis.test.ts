/**
 * Synthesis System Tests
 * testing.md § 2.3 (adapted for new mechanism per SPEC § 2.3.3)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SynthesisSystem } from "./synthesis";
import { InputSystem } from "./input";
import { BoothSystem } from "./booth";
import { KillCounterSystem } from "./kill-counter";
import { EventQueue, EventType } from "./event-queue";
import type { FoodType } from "../core/types";
import { GameStateManager } from "../core/game-state";

describe("SynthesisSystem", () => {
  let synthesisSystem: SynthesisSystem;
  let inputSystem: InputSystem;
  let boothSystem: BoothSystem;
  let killCounterSystem: KillCounterSystem;
  let eventQueue: EventQueue;
  let gameState: GameStateManager;

  beforeEach(() => {
    synthesisSystem = new SynthesisSystem();
    inputSystem = new InputSystem();
    boothSystem = new BoothSystem();
    killCounterSystem = new KillCounterSystem();
    eventQueue = new EventQueue();
    gameState = new GameStateManager();
    gameState.initializeBooths();

    // Inject dependencies using new API
    synthesisSystem.inject("InputSystem", inputSystem);
    synthesisSystem.inject("BoothSystem", boothSystem);
    synthesisSystem.inject("EventQueue", eventQueue);
    synthesisSystem.inject("KillCounterSystem", killCounterSystem);
    synthesisSystem.validateDependencies();

    // Connect BoothSystem to GameState
    boothSystem.inject("EventQueue", eventQueue);
    boothSystem.inject("GameState", gameState);

    killCounterSystem.inject("EventQueue", eventQueue);
    killCounterSystem.inject("GameState", gameState);
    killCounterSystem.validateDependencies();

    synthesisSystem.initialize();
    inputSystem.initialize();
    boothSystem.initialize();
    killCounterSystem.initialize();
    eventQueue.initialize();
  });

  describe("Recipe Triggering", () => {
    it("SY-01: 按鍵 1 + 豆腐1/珍珠1/米血1 → 觸發夜市總匯", () => {
      // Prepare food
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Pearl" as FoodType);
      boothSystem.storeFood("BloodCake" as FoodType);

      let synthesisTriggered = false;
      let recipeId = "";
      eventQueue.subscribe(EventType.SynthesisTriggered, (data) => {
        synthesisTriggered = true;
        recipeId = (data as { recipeId: string }).recipeId;
      });

      // Simulate key press "1"
      const event = new KeyboardEvent("keydown", { key: "1" });
      window.dispatchEvent(event);

      synthesisSystem.update();

      expect(synthesisTriggered).toBe(true);
      expect(recipeId).toBe("1");
    });

    it("SY-02: 按鍵 2 + 豆腐3 → 觸發臭豆腐", () => {
      // Prepare 3 tofu
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Tofu" as FoodType);

      let recipeId = "";
      eventQueue.subscribe(EventType.SynthesisTriggered, (data) => {
        recipeId = (data as { recipeId: string }).recipeId;
      });

      const event = new KeyboardEvent("keydown", { key: "2" });
      window.dispatchEvent(event);

      synthesisSystem.update();

      expect(recipeId).toBe("2");
    });

    it("SY-03: 按鍵 3 + 珍珠3 → 觸發珍珠奶茶", () => {
      boothSystem.storeFood("Pearl" as FoodType);
      boothSystem.storeFood("Pearl" as FoodType);
      boothSystem.storeFood("Pearl" as FoodType);

      let recipeId = "";
      eventQueue.subscribe(EventType.SynthesisTriggered, (data) => {
        recipeId = (data as { recipeId: string }).recipeId;
      });

      const event = new KeyboardEvent("keydown", { key: "3" });
      window.dispatchEvent(event);

      synthesisSystem.update();

      expect(recipeId).toBe("3");
    });

    it("SY-04: 按鍵 4 + 米血3 → 觸發豬血糕", () => {
      boothSystem.storeFood("BloodCake" as FoodType);
      boothSystem.storeFood("BloodCake" as FoodType);
      boothSystem.storeFood("BloodCake" as FoodType);

      let recipeId = "";
      eventQueue.subscribe(EventType.SynthesisTriggered, (data) => {
        recipeId = (data as { recipeId: string }).recipeId;
      });

      const event = new KeyboardEvent("keydown", { key: "4" });
      window.dispatchEvent(event);

      synthesisSystem.update();

      expect(recipeId).toBe("4");
    });

    it("SY-05: 按鍵 5 + 擊殺數 ≥ 20 → 觸發蚵仔煎", () => {
      // Accumulate 20 kills
      for (let i = 0; i < 20; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.canConsume()).toBe(true);

      let recipeId = "";
      eventQueue.subscribe(EventType.SynthesisTriggered, (data) => {
        recipeId = (data as { recipeId: string }).recipeId;
      });

      const event = new KeyboardEvent("keydown", { key: "5" });
      window.dispatchEvent(event);

      synthesisSystem.update();

      expect(recipeId).toBe("5");
    });
  });

  describe("Food Consumption", () => {
    it("SY-06: 合成夜市總匯後攤位食材 -1 (each)", () => {
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Pearl" as FoodType);
      boothSystem.storeFood("BloodCake" as FoodType);

      const event = new KeyboardEvent("keydown", { key: "1" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(boothSystem.getFoodCount(1)).toBe(0); // Tofu (Booth 1)
      expect(boothSystem.getFoodCount(2)).toBe(0); // Pearl (Booth 2)
      expect(boothSystem.getFoodCount(3)).toBe(0); // BloodCake (Booth 3)
    });

    it("SY-07: 合成臭豆腐後豆腐攤位 -3", () => {
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Tofu" as FoodType);

      expect(boothSystem.getFoodCount(1)).toBe(3); // Tofu is Booth 1

      const event = new KeyboardEvent("keydown", { key: "2" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(boothSystem.getFoodCount(1)).toBe(0);
    });

    it("SY-08: 蚵仔煎不消耗食材，但消耗擊殺數", () => {
      // Accumulate 25 kills
      for (let i = 0; i < 25; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(25);

      const event = new KeyboardEvent("keydown", { key: "5" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      // Food unchanged
      expect(boothSystem.getFoodCount(1)).toBe(0);
      expect(boothSystem.getFoodCount(2)).toBe(0);
      expect(boothSystem.getFoodCount(3)).toBe(0);

      // Kill count consumed
      expect(killCounterSystem.getKillCount()).toBe(5); // 25 - 20 = 5
    });
  });

  describe("Error Scenarios", () => {
    it("SY-09: 按鍵 1 + 食材不足 → 無反應", () => {
      // Only 1 tofu (need 1 of each)
      boothSystem.storeFood("Tofu" as FoodType);

      let synthesisTriggered = false;
      eventQueue.subscribe(EventType.SynthesisTriggered, () => {
        synthesisTriggered = true;
      });

      const event = new KeyboardEvent("keydown", { key: "1" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(synthesisTriggered).toBe(false);
    });

    it("SY-10: 按鍵 2 + 豆腐只有2 → 無反應", () => {
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Tofu" as FoodType);

      let synthesisTriggered = false;
      eventQueue.subscribe(EventType.SynthesisTriggered, () => {
        synthesisTriggered = true;
      });

      const event = new KeyboardEvent("keydown", { key: "2" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(synthesisTriggered).toBe(false);
    });

    it("SY-11: 按鍵 5 + 擊殺數不足 (< 20) → 無反應", () => {
      // Only 15 kills
      for (let i = 0; i < 15; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      let synthesisTriggered = false;
      eventQueue.subscribe(EventType.SynthesisTriggered, () => {
        synthesisTriggered = true;
      });

      const event = new KeyboardEvent("keydown", { key: "5" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(synthesisTriggered).toBe(false);
      expect(killCounterSystem.getKillCount()).toBe(15); // Unchanged
    });

    it("SY-12: 按鍵 6 (無效配方) → 無反應", () => {
      let synthesisTriggered = false;
      eventQueue.subscribe(EventType.SynthesisTriggered, () => {
        synthesisTriggered = true;
      });

      const event = new KeyboardEvent("keydown", { key: "6" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(synthesisTriggered).toBe(false);
    });
  });

  describe("Kill Counter Integration", () => {
    it("canConsume 正確反映擊殺數狀態", () => {
      expect(killCounterSystem.canConsume()).toBe(false);

      // Accumulate 20 kills
      for (let i = 0; i < 20; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.canConsume()).toBe(true);

      // Use oyster omelet
      const event = new KeyboardEvent("keydown", { key: "5" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(killCounterSystem.canConsume()).toBe(false);
    });

    it("蚵仔煎可重複使用（累積足夠擊殺數後）", () => {
      let triggerCount = 0;
      eventQueue.subscribe(EventType.SynthesisTriggered, () => {
        triggerCount++;
      });

      // First 20 kills
      for (let i = 0; i < 20; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      // First use
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "5" }));
      synthesisSystem.update();
      expect(triggerCount).toBe(1);
      expect(killCounterSystem.getKillCount()).toBe(0);

      // Another 20 kills
      for (let i = 0; i < 20; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-2nd-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      // Second use
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "5" }));
      synthesisSystem.update();
      expect(triggerCount).toBe(2);
      expect(killCounterSystem.getKillCount()).toBe(0);
    });
  });
});
