/**
 * Box System Tests
 * SPEC § 2.3.7
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BoxSystem } from "./box";
import { EventQueue, EventType } from "./event-queue";
import { Enemy, EnemyType } from "../entities/enemy";
import { Vector } from "../values/vector";
import { LAYOUT } from "../utils/constants";

// Booth Pool position based on LAYOUT constants (SPEC § 2.7.2)
// Pool area: x=340 to x=468 (128px wide), y=136 to y=904 (768px tall, 3x256)
const POOL_X = LAYOUT.BASELINE_X; // 340
const POOL_START_Y =
  LAYOUT.GAME_AREA_Y + (LAYOUT.GAME_AREA_HEIGHT - 256 * 3) / 2; // 136
const POOL_CENTER_Y = POOL_START_Y + (256 * 3) / 2; // 520 (center of pool area)

// Test constants for enemy positioning within booth pool area
const BOX_X = POOL_X;
const BOX_Y = POOL_CENTER_Y;

describe("BoxSystem", () => {
  let boxSystem: BoxSystem;
  let eventQueue: EventQueue;
  let enemies: Enemy[];

  beforeEach(() => {
    boxSystem = new BoxSystem();
    eventQueue = new EventQueue();
    enemies = [];

    boxSystem.setEventQueue(eventQueue);
    boxSystem.setEnemies(enemies);
    boxSystem.initialize();
    eventQueue.initialize();
  });

  describe("Box Spawning", () => {
    it("BX-01: 初始狀態無寶箱", () => {
      expect(boxSystem.isBoxActive()).toBe(false);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-02: 食材入庫時生成寶箱", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });

      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(1);
    });

    it("BX-03: 多次食材入庫累積耐久度", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });
      eventQueue.publish(EventType.FoodStored, {
        boothId: "2",
        foodType: "Tofu",
      });
      eventQueue.publish(EventType.FoodStored, {
        boothId: "3",
        foodType: "BloodCake",
      });

      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(3);
    });

    it("BX-04: 寶箱已存在時食材入庫增加耐久度", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });
      expect(boxSystem.getTotalFoodCount()).toBe(1);

      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });
      expect(boxSystem.getTotalFoodCount()).toBe(2);
      expect(boxSystem.isBoxActive()).toBe(true);
    });
  });

  describe("Box Despawning", () => {
    it("BX-05: 食材歸零時寶箱消失", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });
      expect(boxSystem.isBoxActive()).toBe(true);

      eventQueue.publish(EventType.FoodConsumed, { boothId: "1", amount: 1 });
      expect(boxSystem.isBoxActive()).toBe(false);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-06: 多次消耗後歸零", () => {
      // Add 3 food
      for (let i = 0; i < 3; i++) {
        eventQueue.publish(EventType.FoodStored, {
          boothId: "1",
          foodType: "Pearl",
        });
      }
      expect(boxSystem.getTotalFoodCount()).toBe(3);

      // Consume 2 food
      eventQueue.publish(EventType.FoodConsumed, { boothId: "1", amount: 1 });
      eventQueue.publish(EventType.FoodConsumed, { boothId: "1", amount: 1 });
      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(1);

      // Consume last food
      eventQueue.publish(EventType.FoodConsumed, { boothId: "1", amount: 1 });
      expect(boxSystem.isBoxActive()).toBe(false);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-07: 食材歸零後再入庫重新生成寶箱", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });
      eventQueue.publish(EventType.FoodConsumed, { boothId: "1", amount: 1 });
      expect(boxSystem.isBoxActive()).toBe(false);

      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });
      expect(boxSystem.isBoxActive()).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(1);
    });
  });

  describe("Enemy Collision", () => {
    it("BX-08: 敵人碰撞寶箱消耗食材並消失", () => {
      // Spawn box with 3 food
      for (let i = 0; i < 3; i++) {
        eventQueue.publish(EventType.FoodStored, {
          boothId: "1",
          foodType: "Pearl",
        });
      }

      // Spawn enemy near box
      const enemy = new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y));
      enemies.push(enemy);

      boxSystem.update();

      expect(boxSystem.getTotalFoodCount()).toBe(2);
      expect(enemy.active).toBe(false);
      expect(boxSystem.isBoxActive()).toBe(true); // Box still exists (2 food left)
    });

    it("BX-09: 最後一次碰撞消耗寶箱", () => {
      // Spawn box with 1 food
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });

      // Spawn enemy near box
      const enemy = new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y));
      enemies.push(enemy);

      boxSystem.update();

      expect(boxSystem.getTotalFoodCount()).toBe(0);
      expect(enemy.active).toBe(false);
      expect(boxSystem.isBoxActive()).toBe(false); // Box despawned
    });

    it("BX-10: 遠距離敵人不觸發碰撞", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });

      // Spawn enemy far from box
      const enemy = new Enemy(EnemyType.Ghost, new Vector(BOX_X + 200, BOX_Y));
      enemies.push(enemy);

      boxSystem.update();

      expect(boxSystem.getTotalFoodCount()).toBe(1);
      expect(enemy.active).toBe(true);
      expect(boxSystem.isBoxActive()).toBe(true);
    });

    it("BX-11: 無寶箱時敵人不受影響", () => {
      // No box spawned
      const enemy = new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y));
      enemies.push(enemy);

      boxSystem.update();

      expect(enemy.active).toBe(true);
      expect(boxSystem.getTotalFoodCount()).toBe(0);
    });

    it("BX-12: 每幀最多處理一次碰撞", () => {
      // Spawn box with 5 food
      for (let i = 0; i < 5; i++) {
        eventQueue.publish(EventType.FoodStored, {
          boothId: "1",
          foodType: "Pearl",
        });
      }

      // Spawn 3 enemies near box
      enemies.push(new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y)));
      enemies.push(
        new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y + 5)),
      );
      enemies.push(
        new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y - 5)),
      );

      boxSystem.update();

      // Only 1 enemy should be deactivated per frame
      const activeEnemies = enemies.filter((e) => e.active);
      expect(activeEnemies.length).toBe(2);
      expect(boxSystem.getTotalFoodCount()).toBe(4); // 5 - 1
    });

    it("BX-13: 非活躍敵人不觸發碰撞", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });

      const enemy = new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y));
      enemy.active = false;
      enemies.push(enemy);

      boxSystem.update();

      expect(boxSystem.getTotalFoodCount()).toBe(1);
      expect(boxSystem.isBoxActive()).toBe(true);
    });
  });

  describe("Food Synchronization", () => {
    it("BX-14: 合成消耗食材同步減少耐久度", () => {
      // Add 6 food
      for (let i = 0; i < 6; i++) {
        eventQueue.publish(EventType.FoodStored, {
          boothId: "1",
          foodType: "Pearl",
        });
      }
      expect(boxSystem.getTotalFoodCount()).toBe(6);

      // Synthesis consumes 3 food
      eventQueue.publish(EventType.FoodConsumed, { boothId: "1", amount: 1 });
      eventQueue.publish(EventType.FoodConsumed, { boothId: "2", amount: 1 });
      eventQueue.publish(EventType.FoodConsumed, { boothId: "3", amount: 1 });

      expect(boxSystem.getTotalFoodCount()).toBe(3);
      expect(boxSystem.isBoxActive()).toBe(true);
    });

    it("BX-15: 食材入庫和消耗混合操作", () => {
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      }); // 1
      eventQueue.publish(EventType.FoodStored, {
        boothId: "2",
        foodType: "Tofu",
      }); // 2
      eventQueue.publish(EventType.FoodConsumed, { boothId: "1", amount: 1 }); // 1
      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      }); // 2
      eventQueue.publish(EventType.FoodStored, {
        boothId: "3",
        foodType: "BloodCake",
      }); // 3

      expect(boxSystem.getTotalFoodCount()).toBe(3);
      expect(boxSystem.isBoxActive()).toBe(true);
    });
  });

  describe("Reset", () => {
    it("BX-16: Reset 後狀態歸零", () => {
      // Setup state
      for (let i = 0; i < 3; i++) {
        eventQueue.publish(EventType.FoodStored, {
          boothId: "1",
          foodType: "Pearl",
        });
      }

      boxSystem.reset();

      expect(boxSystem.getTotalFoodCount()).toBe(0);
      expect(boxSystem.isBoxActive()).toBe(false);
    });
  });

  describe("Event Publishing", () => {
    it("BX-17: 敵人碰撞寶箱發佈 EnemyReachedEnd 事件", () => {
      let eventFired = false;
      let enemyId = "";

      eventQueue.subscribe(EventType.EnemyReachedEnd, (data) => {
        eventFired = true;
        enemyId = (data as { enemyId: string }).enemyId;
      });

      eventQueue.publish(EventType.FoodStored, {
        boothId: "1",
        foodType: "Pearl",
      });

      const enemy = new Enemy(EnemyType.Ghost, new Vector(BOX_X + 6, BOX_Y));
      enemies.push(enemy);

      boxSystem.update();

      expect(eventFired).toBe(true);
      expect(enemyId).toBe(enemy.id);
    });
  });
});
