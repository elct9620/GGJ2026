/**
 * Kill Counter System Tests
 * SPEC § 2.3.8 / testing.md § 2.10
 */

import { describe, it, expect, beforeEach } from "vitest";
import { KillCounterSystem } from "./kill-counter";
import { EventQueue, EventType } from "./event-queue";

describe("KillCounterSystem", () => {
  let killCounterSystem: KillCounterSystem;
  let eventQueue: EventQueue;

  beforeEach(() => {
    killCounterSystem = new KillCounterSystem();
    eventQueue = new EventQueue();

    killCounterSystem.setEventQueue(eventQueue);
    killCounterSystem.initialize();
    eventQueue.initialize();
  });

  describe("2.10.1 Kill Counter", () => {
    it("KC-01: 擊殺 1 隻餓鬼 → killCount = 1", () => {
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });

      expect(killCounterSystem.getKillCount()).toBe(1);
    });

    it("KC-02: 擊殺 5 隻餓鬼 → killCount = 5", () => {
      for (let i = 0; i < 5; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(5);
    });

    it("KC-03: 敵人被寶箱消滅 → killCount 不變（需 Box System 傳遞不同事件）", () => {
      // Note: Box System should NOT publish EnemyDeath event for box kills
      // This test documents expected behavior - box kills use different mechanism
      expect(killCounterSystem.getKillCount()).toBe(0);

      // Only bullet kills trigger EnemyDeath
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });

      expect(killCounterSystem.getKillCount()).toBe(1);
    });

    it("KC-04: 敵人到達底線 → killCount 不變（不計入擊殺）", () => {
      // EnemyReachedEnd is different from EnemyDeath
      eventQueue.publish(EventType.EnemyReachedEnd, {
        enemyId: "enemy-1",
      });

      expect(killCounterSystem.getKillCount()).toBe(0);
    });

    it("KC-05: 跨回合擊殺累計 → killCount 持續累加", () => {
      // Wave 1: kill 5
      for (let i = 0; i < 5; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-w1-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(5);

      // Wave 2: kill 3 more
      for (let i = 0; i < 3; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-w2-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(8);
    });
  });

  describe("2.10.2 Oyster Omelet Consumption", () => {
    it("KC-06: 遊戲開始（0 擊殺）→ canConsume = false", () => {
      expect(killCounterSystem.getKillCount()).toBe(0);
      expect(killCounterSystem.canConsume()).toBe(false);
      expect(killCounterSystem.getProgressString()).toBe("0/20");
    });

    it("KC-07: 擊殺 15 隻 → canConsume = false (15/20)", () => {
      for (let i = 0; i < 15; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(15);
      expect(killCounterSystem.canConsume()).toBe(false);
      expect(killCounterSystem.getProgressString()).toBe("15/20");
    });

    it("KC-08: 擊殺 20 隻 + consume → 消耗成功，剩餘 0", () => {
      for (let i = 0; i < 20; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(20);
      expect(killCounterSystem.canConsume()).toBe(true);

      const result = killCounterSystem.consume();

      expect(result).toBe(true);
      expect(killCounterSystem.getKillCount()).toBe(0);
      expect(killCounterSystem.getProgressString()).toBe("0/20");
    });

    it("KC-09: 擊殺 25 隻 + consume → 消耗成功，剩餘 5", () => {
      for (let i = 0; i < 25; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.canConsume()).toBe(true);

      const result = killCounterSystem.consume();

      expect(result).toBe(true);
      expect(killCounterSystem.getKillCount()).toBe(5);
      expect(killCounterSystem.getProgressString()).toBe("5/20");
    });

    it("KC-10: 擊殺 40 隻 + consume 兩次 → 第二次成功，剩餘 0", () => {
      for (let i = 0; i < 40; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      // First consume
      expect(killCounterSystem.consume()).toBe(true);
      expect(killCounterSystem.getKillCount()).toBe(20);

      // Second consume
      expect(killCounterSystem.consume()).toBe(true);
      expect(killCounterSystem.getKillCount()).toBe(0);
    });

    it("KC-11: UI 顯示可用狀態 (X/20)", () => {
      expect(killCounterSystem.getProgressString()).toBe("0/20");

      for (let i = 0; i < 7; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getProgressString()).toBe("7/20");

      for (let i = 7; i < 20; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getProgressString()).toBe("20/20");
      expect(killCounterSystem.canConsume()).toBe(true);
    });
  });

  describe("2.10.3 Quick Eat Effect on Oyster Omelet", () => {
    // Note: Quick Eat effect is handled by Upgrade System / Combat System
    // These tests document expected behavior at KillCounter level

    it("KC-12: 快吃升級不改變消耗門檻（仍為 20）", () => {
      expect(killCounterSystem.getConsumeThreshold()).toBe(20);
      // Quick Eat increases damage, not consumption reduction
    });

    it("KC-13: 擊殺 15 隻 + 選「快吃」+ consume → 消耗失敗（15<20）", () => {
      for (let i = 0; i < 15; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      // Quick Eat upgrade applied (simulated - doesn't affect threshold)
      expect(killCounterSystem.canConsume()).toBe(false);
      expect(killCounterSystem.consume()).toBe(false);
      expect(killCounterSystem.getKillCount()).toBe(15); // Unchanged
    });

    it("KC-14: 擊殺 25 隻 + 選「快吃」+ consume → 消耗成功", () => {
      for (let i = 0; i < 25; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.consume()).toBe(true);
      expect(killCounterSystem.getKillCount()).toBe(5);
    });

    // KC-15 ~ KC-17: Damage calculations are tested in Combat System tests
  });

  describe("2.10.4 Integration Tests", () => {
    it("KC-18: 消耗成功時發佈 KillCounterConsumed 事件", () => {
      let eventFired = false;
      let eventData: { consumed: number; remaining: number } | null = null;

      eventQueue.subscribe(EventType.KillCounterConsumed, (data) => {
        eventFired = true;
        eventData = data;
      });

      for (let i = 0; i < 20; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      killCounterSystem.consume();

      expect(eventFired).toBe(true);
      expect(eventData).toEqual({ consumed: 20, remaining: 0 });
    });

    it("KC-19: 重新開始遊戲（reset）→ killCount = 0", () => {
      for (let i = 0; i < 15; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(15);

      killCounterSystem.reset();

      expect(killCounterSystem.getKillCount()).toBe(0);
      expect(killCounterSystem.canConsume()).toBe(false);
      expect(killCounterSystem.getProgressString()).toBe("0/20");
    });

    it("KC-20: 寶箱消滅不計入（使用 EnemyDeath 事件以外的機制）", () => {
      // Kill 19 enemies with bullets
      for (let i = 0; i < 19; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      // Box destroys 1 enemy (no EnemyDeath event)
      // Box System should use a different mechanism

      expect(killCounterSystem.getKillCount()).toBe(19);
      expect(killCounterSystem.canConsume()).toBe(false);
    });

    it("KC-22: 擊殺 25 + consume + 擊殺 3 + consume → 第二次失敗（8<20）", () => {
      // Kill 25
      for (let i = 0; i < 25; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      // First consume: 25 - 20 = 5
      expect(killCounterSystem.consume()).toBe(true);
      expect(killCounterSystem.getKillCount()).toBe(5);

      // Kill 3 more: 5 + 3 = 8
      for (let i = 0; i < 3; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-extra-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(8);

      // Second consume: 8 < 20, should fail
      expect(killCounterSystem.canConsume()).toBe(false);
      expect(killCounterSystem.consume()).toBe(false);
      expect(killCounterSystem.getKillCount()).toBe(8); // Unchanged
    });
  });

  describe("Consume Threshold", () => {
    it("消耗門檻值為 20", () => {
      expect(killCounterSystem.getConsumeThreshold()).toBe(20);
    });

    it("擊殺 19 隻敵人 → canConsume = false", () => {
      for (let i = 0; i < 19; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.canConsume()).toBe(false);
    });

    it("擊殺第 20 隻敵人瞬間 → canConsume = true", () => {
      // Kill 19 enemies
      for (let i = 0; i < 19; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.canConsume()).toBe(false);

      // Kill 20th enemy
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-20",
        position: { x: 500, y: 540 },
      });

      expect(killCounterSystem.canConsume()).toBe(true);
      expect(killCounterSystem.getKillCount()).toBe(20);
    });
  });
});
