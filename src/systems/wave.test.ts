/**
 * Wave System Tests
 * testing.md § 2.5 (adapted for SPEC § 2.3.5)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { WaveSystem } from "./wave";
import { EventQueue, EventType } from "./event-queue";
import { WAVE_CONFIG } from "../config";

/**
 * Helper function to simulate time passing and spawn all enemies
 * Spawns one enemy at a time with max interval between each
 * @param waveSystem - The wave system to update
 * @param waveNumber - Current wave number
 */
function simulateFullWaveSpawn(
  waveSystem: WaveSystem,
  waveNumber: number,
): void {
  const hasBoss = waveNumber % WAVE_CONFIG.bossWaveInterval === 0;
  const regularEnemies = waveNumber * WAVE_CONFIG.enemyMultiplier;
  const totalEnemies = regularEnemies + (hasBoss ? 1 : 0);

  // First enemy spawns immediately
  waveSystem.update(0);

  // Spawn remaining enemies one by one
  for (let i = 1; i < totalEnemies; i++) {
    waveSystem.update(WAVE_CONFIG.spawnIntervalMax);
  }
}

describe("WaveSystem", () => {
  let waveSystem: WaveSystem;
  let eventQueue: EventQueue;
  let spawnedEnemies: Array<{ type: string; x: number; y: number }>;

  beforeEach(() => {
    waveSystem = new WaveSystem();
    eventQueue = new EventQueue();
    spawnedEnemies = [];

    // Inject dependencies using new API
    waveSystem.inject("EventQueue", eventQueue);
    waveSystem.validateDependencies();
    waveSystem.setSpawnCallback((type, x, y) => {
      spawnedEnemies.push({ type, x, y });
    });

    waveSystem.initialize();
    eventQueue.initialize();
  });

  describe("Enemy Spawning", () => {
    // Helper to check if enemy type is regular (non-boss)
    const isRegularEnemy = (type: string) =>
      ["Ghost", "RedGhost", "GreenGhost", "BlueGhost"].includes(type);

    it("WS-01: Wave 1 生成 2 隻敵人", () => {
      waveSystem.startWave(1);
      simulateFullWaveSpawn(waveSystem, 1);

      expect(spawnedEnemies.length).toBe(2);
      // SPEC § 2.3.5: Regular enemies can be Ghost or Elite types
      expect(spawnedEnemies.every((e) => isRegularEnemy(e.type))).toBe(true);
    });

    it("WS-02: Wave 2 生成 4 隻敵人", () => {
      waveSystem.startWave(2);
      simulateFullWaveSpawn(waveSystem, 2);

      expect(spawnedEnemies.length).toBe(4);
    });

    it("WS-03: Wave 5 生成 10 隻敵人 + 1 Boss", () => {
      waveSystem.startWave(5);
      simulateFullWaveSpawn(waveSystem, 5);

      // SPEC § 2.3.5: 10 regular enemies (Ghost/Elite) + 1 Boss
      const regularEnemies = spawnedEnemies.filter((e) =>
        isRegularEnemy(e.type),
      );
      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");

      expect(regularEnemies.length).toBe(10);
      expect(bosses.length).toBe(1);
      expect(spawnedEnemies.length).toBe(11);
    });

    it("WS-04: Wave 10 生成 20 隻敵人 + 1 Boss", () => {
      waveSystem.startWave(10);
      simulateFullWaveSpawn(waveSystem, 10);

      // SPEC § 2.3.5: 20 regular enemies (Ghost/Elite) + 1 Boss
      const regularEnemies = spawnedEnemies.filter((e) =>
        isRegularEnemy(e.type),
      );
      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");

      expect(regularEnemies.length).toBe(20);
      expect(bosses.length).toBe(1);
    });

    it("WS-05: Wave 4 不生成 Boss", () => {
      waveSystem.startWave(4);
      simulateFullWaveSpawn(waveSystem, 4);

      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");
      expect(bosses.length).toBe(0);
    });

    it("WS-06: 敵人生成位置在畫面右側外", () => {
      waveSystem.startWave(1);
      simulateFullWaveSpawn(waveSystem, 1);

      expect(spawnedEnemies.every((e) => e.x >= 1920)).toBe(true);
    });
  });

  describe("Progressive Spawning", () => {
    // Helper to check if enemy type is regular (non-boss)
    const isRegularEnemy = (type: string) =>
      ["Ghost", "RedGhost", "GreenGhost", "BlueGhost"].includes(type);

    it("WS-16: 首隻敵人立即生成", () => {
      waveSystem.startWave(1);
      waveSystem.update(0); // Immediate update with 0 delta

      expect(spawnedEnemies.length).toBe(1);
      // SPEC § 2.3.5: First enemy can be any regular type (Ghost or Elite)
      expect(isRegularEnemy(spawnedEnemies[0].type)).toBe(true);
    });

    it("WS-17: 後續敵人需等待 2-3 秒", () => {
      waveSystem.startWave(2);
      waveSystem.update(0); // First enemy spawns immediately

      expect(spawnedEnemies.length).toBe(1);

      // After 1 second, no new enemy yet
      waveSystem.update(1);
      expect(spawnedEnemies.length).toBe(1);

      // After 3 more seconds, should have spawned
      waveSystem.update(3);
      expect(spawnedEnemies.length).toBeGreaterThan(1);
    });

    it("WS-18: Boss 在所有普通敵人之後生成", () => {
      waveSystem.startWave(5);

      // Spawn first enemy immediately
      waveSystem.update(0);
      expect(spawnedEnemies.length).toBe(1);

      // Spawn enemies 2-9 (8 more, need 9 more for total 10)
      for (let i = 1; i < 9; i++) {
        waveSystem.update(WAVE_CONFIG.spawnIntervalMax);
      }

      // At this point we should have 9 regular enemies, and still 1 to spawn
      expect(spawnedEnemies.length).toBe(9);
      expect(waveSystem.getEnemiesToSpawn()).toBe(1);
      expect(waveSystem.isBossSpawnPending()).toBe(true);

      // Spawn the 10th regular enemy
      waveSystem.update(WAVE_CONFIG.spawnIntervalMax);
      const regularEnemies = spawnedEnemies.filter((e) =>
        isRegularEnemy(e.type),
      );
      expect(regularEnemies.length).toBe(10);
      expect(waveSystem.getEnemiesToSpawn()).toBe(0);

      // Boss should spawn now (in the same update where enemiesToSpawn becomes 0)
      // Since boss spawns in update() after enemiesToSpawn === 0
      expect(spawnedEnemies.filter((e) => e.type === "Boss").length).toBe(1);
      expect(waveSystem.isBossSpawnPending()).toBe(false);
    });

    it("WS-19: Y 座標為隨機值", () => {
      waveSystem.startWave(3);
      simulateFullWaveSpawn(waveSystem, 3);

      // Check Y positions are within valid range
      expect(spawnedEnemies.every((e) => e.y >= 0 && e.y <= 1080)).toBe(true);

      // Check Y positions are not all the same (random)
      const yPositions = spawnedEnemies.map((e) => e.y);
      const uniqueYPositions = new Set(yPositions);
      expect(uniqueYPositions.size).toBeGreaterThan(1);
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
      simulateFullWaveSpawn(waveSystem, 1);

      // Simulate 2 enemy deaths
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });

      waveSystem.update(0);

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
      simulateFullWaveSpawn(waveSystem, 1);

      // Simulate enemies reaching end
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-1" });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-2" });

      waveSystem.update(0);
      eventQueue.update(2);

      expect(waveCompleteFired).toBe(true);
    });

    it("WS-10: 混合死亡和到達底線", () => {
      waveSystem.startWave(2); // 4 enemies
      simulateFullWaveSpawn(waveSystem, 2);

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

      waveSystem.update(0);

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
      simulateFullWaveSpawn(waveSystem, 1);

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });

      waveSystem.update(0);

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
