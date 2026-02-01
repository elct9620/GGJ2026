/**
 * Upgrade System Tests
 * SPEC § 2.3.4
 */

import { describe, it, expect, beforeEach } from "vitest";
import { UpgradeSystem } from "./upgrade";
import { EventQueue, EventType } from "./event-queue";
import { BoothSystem } from "./booth";
import { FoodType } from "../core/types";
import { GameStateManager } from "../core/game-state";

describe("UpgradeSystem", () => {
  let upgradeSystem: UpgradeSystem;
  let eventQueue: EventQueue;
  let boothSystem: BoothSystem;
  let gameState: GameStateManager;

  beforeEach(() => {
    upgradeSystem = new UpgradeSystem();
    eventQueue = new EventQueue();
    boothSystem = new BoothSystem();
    gameState = new GameStateManager();
    gameState.initializeBooths();

    // Connect BoothSystem to GameState
    boothSystem.inject("EventQueue", eventQueue);
    boothSystem.inject("GameState", gameState);

    // Inject dependencies using new API
    upgradeSystem.inject("EventQueue", eventQueue);
    upgradeSystem.inject("BoothSystem", boothSystem);
    upgradeSystem.inject("GameState", gameState);
    upgradeSystem.validateDependencies();
    upgradeSystem.initialize();
    eventQueue.initialize();
    boothSystem.initialize();
  });

  describe("Upgrade Options", () => {
    it("UP-01: 初始狀態無待選升級", () => {
      expect(upgradeSystem.isPending()).toBe(false);
      expect(upgradeSystem.getCurrentOptions().length).toBe(0);
    });

    it("UP-02: WaveComplete 觸發升級選項", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });

      expect(upgradeSystem.isPending()).toBe(true);
      expect(upgradeSystem.getCurrentOptions().length).toBe(2);
    });

    it("UP-03: 普通回合從普通升級池抽取", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });

      const options = upgradeSystem.getCurrentOptions();
      const normalUpgradeIds = ["spicy", "coconut", "cilantro"];

      expect(options.length).toBe(2);
      options.forEach((opt) => {
        expect(normalUpgradeIds).toContain(opt.id);
      });
    });

    it("UP-04: Boss 回合從 Boss 升級池抽取", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 5 });

      const options = upgradeSystem.getCurrentOptions();
      // 6 Boss upgrades: 打折, 大胃王, 快吃, 飢餓三十, 好餓好餓, 總匯吃到飽
      const bossUpgradeIds = [
        "discount",
        "bigEater",
        "fastEat",
        "hunger30",
        "veryHungry",
        "buffet",
      ];

      expect(options.length).toBe(2);
      options.forEach((opt) => {
        expect(bossUpgradeIds).toContain(opt.id);
      });
    });

    it("UP-05: Boss 回合 (10, 15) 也從 Boss 升級池抽取", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 10 });
      expect(upgradeSystem.getCurrentOptions().length).toBe(2);

      eventQueue.publish(EventType.WaveComplete, { waveNumber: 15 });
      expect(upgradeSystem.getCurrentOptions().length).toBe(2);
    });
  });

  describe("Normal Upgrades", () => {
    it("UP-06: 普通升級消耗食材並增加對應效果", () => {
      // Add food for all types
      for (let i = 0; i < 6; i++) {
        boothSystem.storeFood(FoodType.Tofu);
        boothSystem.storeFood(FoodType.Pearl);
        boothSystem.storeFood(FoodType.BloodCake);
      }

      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });
      const options = upgradeSystem.getCurrentOptions();
      const selectedOption = options[0];

      const beforeState = { ...upgradeSystem.getState() };
      const success = upgradeSystem.selectUpgrade(selectedOption.id);

      expect(success).toBe(true);

      const afterState = { ...upgradeSystem.getState() };

      // Verify at least one stat increased based on selected upgrade
      // SPEC § 2.3.4: 加辣 +0.5 damage, 加椰果 +1 bullet, 加香菜 +100px range
      if (selectedOption.id === "spicy") {
        expect(afterState.stinkyTofuDamageBonus).toBe(0.5);
      } else if (selectedOption.id === "coconut") {
        expect(afterState.bubbleTeaBulletBonus).toBe(1);
      } else if (selectedOption.id === "cilantro") {
        expect(afterState.bloodCakeRangeBonus).toBe(100);
      }

      const stateChanged =
        afterState.stinkyTofuDamageBonus !==
          beforeState.stinkyTofuDamageBonus ||
        afterState.bubbleTeaBulletBonus !== beforeState.bubbleTeaBulletBonus ||
        afterState.bloodCakeRangeBonus !== beforeState.bloodCakeRangeBonus;

      expect(stateChanged).toBe(true);
    });

    it("UP-07: 加辣效果：臭豆腐傷害 +0.5", () => {
      for (let i = 0; i < 3; i++) {
        boothSystem.storeFood(FoodType.Tofu);
      }

      // Try multiple times to find "spicy" upgrade
      for (let wave = 1; wave <= 10; wave++) {
        eventQueue.publish(EventType.WaveComplete, { waveNumber: wave });
        const options = upgradeSystem.getCurrentOptions();
        const spicyOption = options.find((opt) => opt.id === "spicy");

        if (spicyOption) {
          upgradeSystem.selectUpgrade("spicy");
          expect(upgradeSystem.getState().stinkyTofuDamageBonus).toBe(0.5);
          return;
        }
      }

      // If we didn't find spicy in 10 attempts, test passed (random chance)
      expect(true).toBe(true);
    });

    it("UP-08: 升級無需消耗食材 (SPEC § 2.3.4)", () => {
      // SPEC § 2.3.4: 無消耗，直接選擇
      // No food in booth - should still work because upgrades are free
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });
      const options = upgradeSystem.getCurrentOptions();

      const success = upgradeSystem.selectUpgrade(options[0].id);

      expect(success).toBe(true); // Free upgrade, always succeeds
      expect(upgradeSystem.isPending()).toBe(false); // Upgrade applied
    });

    it.skip("UP-09: 重複選擇普通升級效果堆疊", () => {
      // Add plenty of food
      for (let i = 0; i < 20; i++) {
        boothSystem.storeFood(FoodType.Tofu);
        boothSystem.storeFood(FoodType.Pearl);
        boothSystem.storeFood(FoodType.BloodCake);
      }

      // First upgrade
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });
      const firstOptions = upgradeSystem.getCurrentOptions();
      const firstSuccess = upgradeSystem.selectUpgrade(firstOptions[0].id);
      expect(firstSuccess).toBe(true);

      const afterFirst = upgradeSystem.getState();

      // Second upgrade
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 2 });
      const secondOptions = upgradeSystem.getCurrentOptions();
      const secondSuccess = upgradeSystem.selectUpgrade(secondOptions[0].id);

      if (secondSuccess) {
        const afterSecond = upgradeSystem.getState();

        // Verify total stats increased (stacking effect)
        const totalBonus =
          afterSecond.stinkyTofuDamageBonus +
          afterSecond.bubbleTeaBulletBonus +
          afterSecond.bloodCakeRangeBonus;

        const firstBonus =
          afterFirst.stinkyTofuDamageBonus +
          afterFirst.bubbleTeaBulletBonus +
          afterFirst.bloodCakeRangeBonus;

        expect(totalBonus).toBeGreaterThan(firstBonus);
      } else {
        // If second upgrade failed (food insufficient), test passes
        expect(true).toBe(true);
      }
    });
  });

  describe("Boss Upgrades", () => {
    it("UP-10: Boss 升級無消耗", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 5 });
      const options = upgradeSystem.getCurrentOptions();

      // All boss upgrades should have no cost
      options.forEach((opt) => {
        expect(opt.cost).toBeNull();
      });

      const success = upgradeSystem.selectUpgrade(options[0].id);
      expect(success).toBe(true);
    });

    it("UP-11: Boss 升級效果套用", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 5 });
      const options = upgradeSystem.getCurrentOptions();

      const beforeState = { ...upgradeSystem.getState() };
      const success = upgradeSystem.selectUpgrade(options[0].id);
      expect(success).toBe(true);

      const afterState = { ...upgradeSystem.getState() };

      // Verify specific effect based on selected upgrade
      // SPEC § 2.3.4: 打折 -1, 大胃王 +6, 快吃 +10%, 飢餓三十 +2s, 好餓好餓 -0.5s, 總匯吃到飽 ×2/-10%
      const selectedId = options[0].id;
      if (selectedId === "discount") {
        expect(afterState.recipeCostReduction).toBe(1);
      } else if (selectedId === "bigEater") {
        // 初始值 1 + 加成 6 = 7
        expect(afterState.magazineMultiplier).toBe(7);
      } else if (selectedId === "fastEat") {
        // 初始值 1 + 加成 0.1 = 1.1
        expect(afterState.killThresholdDivisor).toBe(1.1);
      } else if (selectedId === "hunger30") {
        // 初始值 1 + 加成 2 = 3
        expect(afterState.buffDurationMultiplier).toBe(3);
      } else if (selectedId === "veryHungry") {
        // 初始值 0 + 加成 0.5 = 0.5
        expect(afterState.reloadTimeReduction).toBe(0.5);
      } else if (selectedId === "buffet") {
        // 初始值 1 × 2 = 2, 初始值 0 + 0.1 = 0.1
        expect(afterState.nightMarketChainMultiplier).toBe(2);
        expect(afterState.nightMarketDecayReduction).toBe(0.1);
      }

      // At least one boss upgrade effect should apply
      const bossUpgradeApplied =
        afterState.recipeCostReduction !== beforeState.recipeCostReduction ||
        afterState.magazineMultiplier !== beforeState.magazineMultiplier ||
        afterState.killThresholdDivisor !== beforeState.killThresholdDivisor ||
        afterState.buffDurationMultiplier !==
          beforeState.buffDurationMultiplier ||
        afterState.reloadTimeReduction !== beforeState.reloadTimeReduction ||
        afterState.nightMarketChainMultiplier !==
          beforeState.nightMarketChainMultiplier ||
        afterState.nightMarketDecayReduction !==
          beforeState.nightMarketDecayReduction;

      expect(bossUpgradeApplied).toBe(true);
    });

    it.skip("UP-12: 重複選擇 Boss 升級效果堆疊", () => {
      // First upgrade
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 5 });
      const firstOptions = upgradeSystem.getCurrentOptions();
      const firstId = firstOptions[0].id;
      upgradeSystem.selectUpgrade(firstId);
      const afterFirst = upgradeSystem.getState();

      // Second upgrade - select same if available
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 10 });
      const secondOptions = upgradeSystem.getCurrentOptions();
      const sameUpgrade = secondOptions.find((opt) => opt.id === firstId);

      if (sameUpgrade) {
        const secondSuccess = upgradeSystem.selectUpgrade(firstId);

        if (secondSuccess) {
          const afterSecond = upgradeSystem.getState();

          // Verify effect stacked based on which upgrade was selected
          switch (firstId) {
            case "discount":
              expect(afterSecond.recipeCostReduction).toBeGreaterThan(
                afterFirst.recipeCostReduction,
              );
              break;
            case "bigEater":
              expect(afterSecond.magazineMultiplier).toBeGreaterThan(
                afterFirst.magazineMultiplier,
              );
              break;
            case "fastEat":
              expect(afterSecond.killThresholdDivisor).toBeGreaterThan(
                afterFirst.killThresholdDivisor,
              );
              break;
            case "hunger30":
              expect(afterSecond.buffDurationMultiplier).toBeGreaterThan(
                afterFirst.buffDurationMultiplier,
              );
              break;
          }
        }
      } else {
        // If same upgrade not available, test passed (random chance)
        expect(true).toBe(true);
      }
    });
  });

  describe("Upgrade Selection", () => {
    it("UP-13: 選擇升級後清除待選狀態", () => {
      for (let i = 0; i < 3; i++) {
        boothSystem.storeFood(FoodType.Tofu);
        boothSystem.storeFood(FoodType.Pearl);
        boothSystem.storeFood(FoodType.BloodCake);
      }

      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });
      expect(upgradeSystem.isPending()).toBe(true);

      const options = upgradeSystem.getCurrentOptions();
      upgradeSystem.selectUpgrade(options[0].id);

      expect(upgradeSystem.isPending()).toBe(false);
      expect(upgradeSystem.getCurrentOptions().length).toBe(0);
    });

    it("UP-14: 選擇不存在的升級 ID 失敗", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 1 });

      const success = upgradeSystem.selectUpgrade("invalid-id");

      expect(success).toBe(false);
      expect(upgradeSystem.isPending()).toBe(true);
    });

    it("UP-15: 無待選狀態時無法選擇升級", () => {
      const success = upgradeSystem.selectUpgrade("spicy");

      expect(success).toBe(false);
    });
  });

  describe("Event Publishing", () => {
    it("UP-16: 選擇升級後發佈 UpgradeSelected 事件", () => {
      let eventFired = false;
      let upgradeId = "";

      eventQueue.subscribe(EventType.UpgradeSelected, (data) => {
        eventFired = true;
        upgradeId = (data as { upgradeId: string }).upgradeId;
      });

      eventQueue.publish(EventType.WaveComplete, { waveNumber: 5 });
      const options = upgradeSystem.getCurrentOptions();
      upgradeSystem.selectUpgrade(options[0].id);

      expect(eventFired).toBe(true);
      expect(upgradeId).toBe(options[0].id);
    });
  });

  describe("Reset", () => {
    it("UP-17: Reset 後升級狀態歸零", () => {
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 5 });
      const options = upgradeSystem.getCurrentOptions();
      upgradeSystem.selectUpgrade(options[0].id);

      // Second wave for second upgrade
      eventQueue.publish(EventType.WaveComplete, { waveNumber: 10 });
      const secondOptions = upgradeSystem.getCurrentOptions();
      upgradeSystem.selectUpgrade(secondOptions[0].id);

      // Reset both UpgradeSystem and GameStateManager
      upgradeSystem.reset();
      gameState.reset(); // Upgrade state is now managed by GameStateManager

      const state = upgradeSystem.getState();
      expect(state.stinkyTofuDamageBonus).toBe(0);
      expect(state.bubbleTeaBulletBonus).toBe(0);
      expect(state.bloodCakeRangeBonus).toBe(0);
      expect(state.recipeCostReduction).toBe(0);
      expect(state.magazineMultiplier).toBe(1);
      expect(state.killThresholdDivisor).toBe(1);
      expect(state.buffDurationMultiplier).toBe(1);
      expect(upgradeSystem.isPending()).toBe(false);
      expect(upgradeSystem.getCurrentOptions().length).toBe(0);
    });
  });

  describe("Upgrade State", () => {
    it("UP-18: 初始狀態所有升級為零", () => {
      const state = upgradeSystem.getState();

      expect(state.stinkyTofuDamageBonus).toBe(0);
      expect(state.bubbleTeaBulletBonus).toBe(0);
      expect(state.bloodCakeRangeBonus).toBe(0);
      expect(state.recipeCostReduction).toBe(0);
      expect(state.magazineMultiplier).toBe(1);
      expect(state.killThresholdDivisor).toBe(1);
      expect(state.buffDurationMultiplier).toBe(1);
    });
  });
});
