/**
 * Synthesis System Tests
 * testing.md § 2.3 (adapted for new mechanism per SPEC § 2.3.3)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SynthesisSystem } from "./synthesis";
import { InputSystem } from "./input";
import { BoothSystem } from "./booth";
import { EventQueue, EventType } from "./event-queue";
import type { FoodType } from "../entities/enemy";

describe("SynthesisSystem", () => {
  let synthesisSystem: SynthesisSystem;
  let inputSystem: InputSystem;
  let boothSystem: BoothSystem;
  let eventQueue: EventQueue;

  beforeEach(() => {
    synthesisSystem = new SynthesisSystem();
    inputSystem = new InputSystem();
    boothSystem = new BoothSystem();
    eventQueue = new EventQueue();

    synthesisSystem.setInputSystem(inputSystem);
    synthesisSystem.setBoothSystem(boothSystem);
    synthesisSystem.setEventQueue(eventQueue);

    synthesisSystem.initialize();
    inputSystem.initialize();
    boothSystem.initialize();
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

    it("SY-05: 按鍵 5 + 擊殺計數已解鎖 → 觸發蚵仔煎", () => {
      // Unlock kill counter
      eventQueue.publish(EventType.KillCounterUnlocked, {});

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

      expect(boothSystem.getFoodCount(2)).toBe(0); // Tofu (Booth 2)
      expect(boothSystem.getFoodCount(1)).toBe(0); // Pearl (Booth 1)
      expect(boothSystem.getFoodCount(3)).toBe(0); // BloodCake (Booth 3)
    });

    it("SY-07: 合成臭豆腐後豆腐攤位 -3", () => {
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Tofu" as FoodType);
      boothSystem.storeFood("Tofu" as FoodType);

      expect(boothSystem.getFoodCount(2)).toBe(3); // Tofu is Booth 2

      const event = new KeyboardEvent("keydown", { key: "2" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(boothSystem.getFoodCount(2)).toBe(0);
    });

    it("SY-08: 蚵仔煎不消耗食材", () => {
      eventQueue.publish(EventType.KillCounterUnlocked, {});

      const event = new KeyboardEvent("keydown", { key: "5" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(boothSystem.getFoodCount(1)).toBe(0);
      expect(boothSystem.getFoodCount(2)).toBe(0);
      expect(boothSystem.getFoodCount(3)).toBe(0);
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

    it("SY-11: 按鍵 5 + 未解鎖擊殺計數 → 無反應", () => {
      let synthesisTriggered = false;
      eventQueue.subscribe(EventType.SynthesisTriggered, () => {
        synthesisTriggered = true;
      });

      const event = new KeyboardEvent("keydown", { key: "5" });
      window.dispatchEvent(event);
      synthesisSystem.update();

      expect(synthesisTriggered).toBe(false);
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

  describe("KillCounterUnlocked Event", () => {
    it("should unlock oyster omelette when event is received", () => {
      expect(synthesisSystem.isOysterOmeletteUnlocked()).toBe(false);

      eventQueue.publish(EventType.KillCounterUnlocked, {});

      expect(synthesisSystem.isOysterOmeletteUnlocked()).toBe(true);
    });
  });
});
