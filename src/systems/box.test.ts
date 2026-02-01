/**
 * Box System Tests
 * SPEC § 2.3.7
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BoxSystem } from "./box";
import { BoothSystem } from "./booth";
import { FoodType, EnemyType } from "../core/types";
import { EventQueue, EventType } from "./event-queue";
import { Enemy } from "../entities/enemy";
import { Vector } from "../values/vector";
import { LAYOUT } from "../utils/constants";

// Booth Pool position based on LAYOUT constants (SPEC § 2.7.2)
// Pool area: x=340 to x=468 (128px wide), y=136 to y=904 (768px tall, 3x256)
const POOL_X = LAYOUT.BASELINE_X; // 340
const POOL_START_Y =
  LAYOUT.GAME_AREA_Y + (LAYOUT.GAME_AREA_HEIGHT - 256 * 3) / 2; // 136

// Test constants for enemy positioning within booth pool area
const BOX_X = POOL_X;

describe("BoxSystem", () => {
  let boxSystem: BoxSystem;
  let boothSystem: BoothSystem;
  let eventQueue: EventQueue;
  let enemies: Enemy[];

  beforeEach(() => {
    boxSystem = new BoxSystem();
    boothSystem = new BoothSystem();
    eventQueue = new EventQueue();
    enemies = [];

    // Setup dependencies using injection API
    boxSystem.inject("EventQueue", eventQueue);
    boxSystem.inject("BoothSystem", boothSystem);
    boxSystem.validateDependencies();
    boxSystem.setEnemies(enemies);

    // Connect BoothSystem to EventQueue for food events
    boothSystem.inject("EventQueue", eventQueue);

    boxSystem.initialize();
    boothSystem.initialize();
    eventQueue.initialize();
  });

  describe("Box Spawning", () => {
    it("BX-01: 初始狀態無寶箱", () => {
      expect(boxSystem.isBoxActive()).toBe(false);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-02: 食材入庫時生成寶箱", () => {
      // Store food through BoothSystem (which publishes FoodStored event)
      boothSystem.storeFood(FoodType.Pearl);

      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(1);
    });

    it("BX-03: 多次食材入庫累積耐久度", () => {
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Tofu);
      boothSystem.storeFood(FoodType.BloodCake);

      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(3);
    });

    it("BX-04: 寶箱已存在時食材入庫增加耐久度", () => {
      boothSystem.storeFood(FoodType.Pearl);
      expect(boxSystem.getTotalFoodCount()).toBe(1);

      boothSystem.storeFood(FoodType.Pearl);
      expect(boxSystem.getTotalFoodCount()).toBe(2);
      expect(boxSystem.isBoxActive()).toBe(true);
    });
  });

  describe("Box Despawning", () => {
    it("BX-05: 食材歸零時寶箱消失", () => {
      boothSystem.storeFood(FoodType.Pearl);
      expect(boxSystem.isBoxActive()).toBe(true);

      boothSystem.retrieveFood(2); // Consume the food (Pearl is Booth 2)
      expect(boxSystem.isBoxActive()).toBe(false);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-06: 多次消耗後歸零", () => {
      // Add 3 food
      for (let i = 0; i < 3; i++) {
        boothSystem.storeFood(FoodType.Pearl);
      }
      expect(boxSystem.getTotalFoodCount()).toBe(3);

      // Consume 2 food (Pearl is Booth 2)
      boothSystem.retrieveFood(2);
      boothSystem.retrieveFood(2);
      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(1);

      // Consume last food
      boothSystem.retrieveFood(2);
      expect(boxSystem.isBoxActive()).toBe(false);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-07: 食材歸零後再入庫重新生成寶箱", () => {
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.retrieveFood(2); // Pearl is Booth 2
      expect(boxSystem.isBoxActive()).toBe(false);

      boothSystem.storeFood(FoodType.Pearl);
      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(1);
    });
  });

  describe("Enemy Collision", () => {
    it("BX-08: 敵人碰撞珍珠寶箱消耗珍珠食材", () => {
      // Spawn Pearl box with 3 food
      for (let i = 0; i < 3; i++) {
        boothSystem.storeFood(FoodType.Pearl);
      }

      // Calculate Pearl booth Y position (middle booth, after swap)
      const pearlBoothY = POOL_START_Y + 256 + 256 / 2; // Center of second booth
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, pearlBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      // SPEC § 2.3.7: Enemy collision consumes 1 food from Pearl booth only
      expect(boothSystem.getFoodCount(2)).toBe(2); // Pearl booth (Booth 2 after swap)
      expect(enemy.active).toBe(false);
      expect(boxSystem.isBoxActive()).toBe(true);
    });

    it("BX-09: 最後一次碰撞消耗該攤位寶箱", () => {
      // Spawn Pearl box with 1 food
      boothSystem.storeFood(FoodType.Pearl);

      // Spawn enemy at Pearl booth position (middle booth, after swap)
      const pearlBoothY = POOL_START_Y + 256 + 256 / 2;
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, pearlBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      // SPEC § 2.3.7: Last food consumed, Pearl box despawns
      expect(boothSystem.getFoodCount(2)).toBe(0); // Pearl is Booth 2 after swap
      expect(enemy.active).toBe(false);
      expect(boxSystem.isBoxActive()).toBe(false); // No boxes active
    });

    it("BX-10: 遠距離敵人不觸發碰撞", () => {
      boothSystem.storeFood(FoodType.Pearl);

      // Spawn enemy far from box (Pearl is middle booth after swap)
      const pearlBoothY = POOL_START_Y + 256 + 256 / 2;
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 200, pearlBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      expect(boothSystem.getFoodCount(2)).toBe(1); // Pearl is Booth 2
      expect(enemy.active).toBe(true);
      expect(boxSystem.isBoxActive()).toBe(true);
    });

    it("BX-11: 無寶箱時敵人不受影響", () => {
      // No box spawned
      const pearlBoothY = POOL_START_Y + 256 / 2;
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, pearlBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      expect(enemy.active).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-12: 每幀最多處理一次碰撞", () => {
      // Spawn Pearl box with 5 food
      for (let i = 0; i < 5; i++) {
        boothSystem.storeFood(FoodType.Pearl);
      }

      // Spawn 3 enemies at Pearl booth position (middle booth after swap)
      const pearlBoothY = POOL_START_Y + 256 + 256 / 2;
      enemies.push(
        new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, pearlBoothY)),
      );
      enemies.push(
        new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, pearlBoothY + 5)),
      );
      enemies.push(
        new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, pearlBoothY - 5)),
      );

      boxSystem.update();

      // Only 1 enemy should be deactivated per frame
      const activeEnemies = enemies.filter((e) => e.active);
      expect(activeEnemies.length).toBe(2);
      // SPEC § 2.3.7: 1 food consumed per collision from Pearl booth
      expect(boothSystem.getFoodCount(2)).toBe(4); // Pearl is Booth 2
    });

    it("BX-13: 非活躍敵人不觸發碰撞", () => {
      boothSystem.storeFood(FoodType.Pearl);

      const pearlBoothY = POOL_START_Y + 256 + 256 / 2; // Middle booth after swap
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, pearlBoothY),
      );
      enemy.active = false;
      enemies.push(enemy);

      boxSystem.update();

      expect(boothSystem.getFoodCount(2)).toBe(1); // Pearl is Booth 2
      expect(boxSystem.isBoxActive()).toBe(true);
    });

    it("BX-14: 敵人碰撞豆腐箱子只消耗豆腐", () => {
      // Setup multiple booths with food
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Tofu);
      boothSystem.storeFood(FoodType.Tofu);

      // Enemy hits Tofu booth (top, after swap)
      const tofuBoothY = POOL_START_Y + 256 / 2;
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, tofuBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      // Only Tofu booth should lose food
      expect(boothSystem.getFoodCount(2)).toBe(2); // Pearl unchanged (Booth 2)
      expect(boothSystem.getFoodCount(1)).toBe(1); // Tofu -1 (Booth 1)
      expect(enemy.active).toBe(false);
    });

    it("BX-15: 敵人碰撞米血箱子只消耗米血", () => {
      // Setup multiple booths with food
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.BloodCake);
      boothSystem.storeFood(FoodType.BloodCake);

      // Enemy hits BloodCake booth (bottom)
      const bloodCakeBoothY = POOL_START_Y + 256 * 2 + 256 / 2;
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, bloodCakeBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      // Only BloodCake booth should lose food
      expect(boothSystem.getFoodCount(2)).toBe(1); // Pearl unchanged (Booth 2)
      expect(boothSystem.getFoodCount(3)).toBe(1); // BloodCake -1
      expect(enemy.active).toBe(false);
    });

    it("BX-16: 某攤位食材歸零後該箱子消失，敵人可通過", () => {
      // Setup: Pearl has food, Tofu empty, BloodCake has food
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.BloodCake);

      // Enemy passes through Tofu booth position (top, after swap - no box)
      const tofuBoothY = POOL_START_Y + 256 / 2;
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, tofuBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      // Enemy should pass through (not deactivated)
      expect(enemy.active).toBe(true);
      expect(boothSystem.getFoodCount(2)).toBe(1); // Pearl unchanged (Booth 2)
      expect(boothSystem.getFoodCount(1)).toBe(0); // Tofu still 0 (Booth 1)
      expect(boothSystem.getFoodCount(3)).toBe(1); // BloodCake unchanged
    });
  });

  describe("Food Synchronization", () => {
    it("BX-17: 合成消耗食材同步減少耐久度", () => {
      // Add 6 food (2 of each type)
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Tofu);
      boothSystem.storeFood(FoodType.Tofu);
      boothSystem.storeFood(FoodType.BloodCake);
      boothSystem.storeFood(FoodType.BloodCake);
      expect(boxSystem.getTotalFoodCount()).toBe(6);

      // Synthesis consumes 3 food (1 from each booth)
      boothSystem.retrieveFood(1);
      boothSystem.retrieveFood(2);
      boothSystem.retrieveFood(3);

      expect(boxSystem.getTotalFoodCount()).toBe(3);
      expect(boxSystem.isBoxActive()).toBe(true);
    });

    it("BX-18: 食材入庫和消耗混合操作", () => {
      boothSystem.storeFood(FoodType.Pearl); // 1
      boothSystem.storeFood(FoodType.Tofu); // 2
      boothSystem.retrieveFood(1); // 1
      boothSystem.storeFood(FoodType.Pearl); // 2
      boothSystem.storeFood(FoodType.BloodCake); // 3

      expect(boxSystem.getTotalFoodCount()).toBe(3);
      expect(boxSystem.isBoxActive()).toBe(true);
    });
  });

  describe("Reset", () => {
    it("BX-19: Reset 後狀態歸零", () => {
      // Setup state
      for (let i = 0; i < 3; i++) {
        boothSystem.storeFood(FoodType.Pearl);
      }
      expect(boxSystem.isBoxActive()).toBe(true);

      boxSystem.reset();
      boothSystem.reset();

      expect(boxSystem.getTotalFoodCount()).toBe(0);
      expect(boxSystem.isBoxActive()).toBe(false);
    });
  });

  describe("Event Publishing", () => {
    it("BX-20: 敵人碰撞寶箱發佈 EnemyReachedEnd 事件", () => {
      let eventFired = false;
      let enemyId = "";

      eventQueue.subscribe(EventType.EnemyReachedEnd, (data) => {
        eventFired = true;
        enemyId = (data as { enemyId: string }).enemyId;
      });

      boothSystem.storeFood(FoodType.Pearl);

      const pearlBoothY = POOL_START_Y + 256 + 256 / 2; // Pearl is middle booth
      const enemy = new Enemy(
        EnemyType.Ghost,
        new Vector(BOX_X + 6, pearlBoothY),
      );
      enemies.push(enemy);

      boxSystem.update();

      expect(eventFired).toBe(true);
      expect(enemyId).toBe(enemy.id);
    });
  });
});
