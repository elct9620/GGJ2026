/**
 * Wave System Tests
 * testing.md § 2.5 (adapted for SPEC § 2.3.5)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { WaveSystem } from "./wave";
import { EventQueue, EventType } from "./event-queue";

describe("WaveSystem", () => {
  let waveSystem: WaveSystem;
  let eventQueue: EventQueue;
  let spawnedEnemies: Array<{ type: string; x: number; y: number }>;

  beforeEach(() => {
    waveSystem = new WaveSystem();
    eventQueue = new EventQueue();
    spawnedEnemies = [];

    waveSystem.setEventQueue(eventQueue);
    waveSystem.setSpawnCallback((type, x, y) => {
      spawnedEnemies.push({ type, x, y });
    });

    waveSystem.initialize();
    eventQueue.initialize();
  });

  describe("Enemy Spawning", () => {
    it("WS-01: Wave 1 生成 2 隻敵人", () => {
      waveSystem.startWave(1);

      expect(spawnedEnemies.length).toBe(2);
      expect(spawnedEnemies.every((e) => e.type === "Ghost")).toBe(true);
    });

    it("WS-02: Wave 2 生成 4 隻敵人", () => {
      waveSystem.startWave(2);

      expect(spawnedEnemies.length).toBe(4);
    });

    it("WS-03: Wave 5 生成 10 隻敵人 + 1 Boss", () => {
      waveSystem.startWave(5);

      const ghosts = spawnedEnemies.filter((e) => e.type === "Ghost");
      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");

      expect(ghosts.length).toBe(10);
      expect(bosses.length).toBe(1);
      expect(spawnedEnemies.length).toBe(11);
    });

    it("WS-04: Wave 10 生成 20 隻敵人 + 1 Boss", () => {
      waveSystem.startWave(10);

      const ghosts = spawnedEnemies.filter((e) => e.type === "Ghost");
      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");

      expect(ghosts.length).toBe(20);
      expect(bosses.length).toBe(1);
    });

    it("WS-05: Wave 4 不生成 Boss", () => {
      waveSystem.startWave(4);

      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");
      expect(bosses.length).toBe(0);
    });

    it("WS-06: 敵人生成位置在畫面右側外", () => {
      waveSystem.startWave(1);

      expect(spawnedEnemies.every((e) => e.x >= 1920)).toBe(true);
    });
  });

  describe("Wave Events", () => {
    it("WS-07: 發佈 WaveStart 事件", () => {
      let waveStartFired = false;
      let waveNumber = 0;

      eventQueue.subscribe(EventType.WaveStart, (data) => {
        waveStartFired = true;
        waveNumber = (data as { waveNumber: number }).waveNumber;
      });

      waveSystem.startWave(3);

      expect(waveStartFired).toBe(true);
      expect(waveNumber).toBe(3);
    });

    it("WS-08: 所有敵人清除後發佈 WaveComplete", () => {
      let waveCompleteFired = false;

      eventQueue.subscribe(EventType.WaveComplete, () => {
        waveCompleteFired = true;
      });

      waveSystem.startWave(1); // 2 enemies

      // Simulate 2 enemy deaths
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });

      waveSystem.update();

      expect(waveCompleteFired).toBe(false); // Delayed event

      // Process delayed events
      eventQueue.update(2); // 2 second delay

      expect(waveCompleteFired).toBe(true);
    });

    it("WS-09: 敵人到達底線也會觸發 WaveComplete", () => {
      let waveCompleteFired = false;

      eventQueue.subscribe(EventType.WaveComplete, () => {
        waveCompleteFired = true;
      });

      waveSystem.startWave(1); // 2 enemies

      // Simulate enemies reaching end
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-1" });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-2" });

      waveSystem.update();
      eventQueue.update(2);

      expect(waveCompleteFired).toBe(true);
    });

    it("WS-10: 混合死亡和到達底線", () => {
      waveSystem.startWave(2); // 4 enemies

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-3" });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-4" });

      waveSystem.update();

      expect(waveSystem.getRemainingEnemies()).toBe(0);
    });
  });

  describe("Wave State", () => {
    it("WS-11: 初始狀態 currentWave = 0", () => {
      expect(waveSystem.getCurrentWave()).toBe(0);
      expect(waveSystem.isActive()).toBe(false);
    });

    it("WS-12: startWave 後 isActive = true", () => {
      waveSystem.startWave(1);

      expect(waveSystem.isActive()).toBe(true);
      expect(waveSystem.getCurrentWave()).toBe(1);
    });

    it("WS-13: WaveComplete 後 isActive = false", () => {
      waveSystem.startWave(1); // 2 enemies

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });

      waveSystem.update();

      expect(waveSystem.isActive()).toBe(false);
    });

    it("WS-14: Reset 後狀態歸零", () => {
      waveSystem.startWave(5);

      waveSystem.reset();

      expect(waveSystem.getCurrentWave()).toBe(0);
      expect(waveSystem.isActive()).toBe(false);
      expect(waveSystem.getRemainingEnemies()).toBe(0);
    });
  });

  describe("Enemy Tracking", () => {
    it("WS-15: 正確追蹤剩餘敵人數量", () => {
      waveSystem.startWave(3); // 6 enemies

      expect(waveSystem.getRemainingEnemies()).toBe(6);

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });

      expect(waveSystem.getRemainingEnemies()).toBe(5);

      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-2" });

      expect(waveSystem.getRemainingEnemies()).toBe(4);
    });
  });
});
