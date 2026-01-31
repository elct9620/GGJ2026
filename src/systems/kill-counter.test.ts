/**
 * Kill Counter System Tests
 * SPEC § 2.3.8
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

  describe("Kill Counting", () => {
    it("KC-01: 初始計數器為 0", () => {
      expect(killCounterSystem.getKillCount()).toBe(0);
      expect(killCounterSystem.isOysterOmeletteUnlocked()).toBe(false);
    });

    it("KC-02: 擊殺 1 隻敵人 → 計數器 = 1", () => {
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });

      expect(killCounterSystem.getKillCount()).toBe(1);
    });

    it("KC-03: 擊殺 5 隻敵人 → 計數器 = 5", () => {
      for (let i = 0; i < 5; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(5);
    });

    it("KC-04: 擊殺 10 隻敵人 → 計數器 = 10，觸發解鎖", () => {
      let unlockEventFired = false;
      eventQueue.subscribe(EventType.KillCounterUnlocked, () => {
        unlockEventFired = true;
      });

      for (let i = 0; i < 10; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(10);
      expect(killCounterSystem.isOysterOmeletteUnlocked()).toBe(true);
      expect(unlockEventFired).toBe(true);
    });

    it("KC-05: 已解鎖後繼續擊殺 → 計數器繼續累積", () => {
      // Unlock first
      for (let i = 0; i < 10; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.isOysterOmeletteUnlocked()).toBe(true);

      // Continue killing
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-11",
        position: { x: 500, y: 540 },
      });

      expect(killCounterSystem.getKillCount()).toBe(11);
    });

    it("KC-06: 解鎖事件只發佈一次", () => {
      let unlockEventCount = 0;
      eventQueue.subscribe(EventType.KillCounterUnlocked, () => {
        unlockEventCount++;
      });

      // Kill 15 enemies (past threshold)
      for (let i = 0; i < 15; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(unlockEventCount).toBe(1); // Only fired once at threshold
    });
  });

  describe("Progress Display", () => {
    it("KC-07: 未解鎖時顯示進度 (7/10)", () => {
      for (let i = 0; i < 7; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getProgressString()).toBe("7/10");
    });

    it("KC-08: 解鎖後顯示「已解鎖」", () => {
      for (let i = 0; i < 10; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getProgressString()).toBe("已解鎖");
    });

    it("KC-09: 初始狀態顯示 (0/10)", () => {
      expect(killCounterSystem.getProgressString()).toBe("0/10");
    });
  });

  describe("Reset", () => {
    it("KC-10: Reset 後計數器歸零", () => {
      for (let i = 0; i < 10; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.getKillCount()).toBe(10);
      expect(killCounterSystem.isOysterOmeletteUnlocked()).toBe(true);

      killCounterSystem.reset();

      expect(killCounterSystem.getKillCount()).toBe(0);
      expect(killCounterSystem.isOysterOmeletteUnlocked()).toBe(false);
      expect(killCounterSystem.getProgressString()).toBe("0/10");
    });
  });

  describe("Unlock Threshold", () => {
    it("KC-11: 門檻值為 10", () => {
      expect(killCounterSystem.getUnlockThreshold()).toBe(10);
    });

    it("KC-12: 擊殺 9 隻敵人 → 未解鎖", () => {
      for (let i = 0; i < 9; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(killCounterSystem.isOysterOmeletteUnlocked()).toBe(false);
    });

    it("KC-13: 擊殺第 10 隻敵人瞬間解鎖", () => {
      let unlockEventFired = false;
      eventQueue.subscribe(EventType.KillCounterUnlocked, () => {
        unlockEventFired = true;
      });

      // Kill 9 enemies
      for (let i = 0; i < 9; i++) {
        eventQueue.publish(EventType.EnemyDeath, {
          enemyId: `enemy-${i}`,
          position: { x: 500, y: 540 },
        });
      }

      expect(unlockEventFired).toBe(false);

      // Kill 10th enemy
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-10",
        position: { x: 500, y: 540 },
      });

      expect(unlockEventFired).toBe(true);
      expect(killCounterSystem.isOysterOmeletteUnlocked()).toBe(true);
    });
  });
});
