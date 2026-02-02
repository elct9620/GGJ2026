/**
 * Wave System Tests
 * testing.md § 2.5 (adapted for SPEC § 2.3.5)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { WaveSystem } from "./wave";
import { EventQueue, EventType } from "./event-queue";
import { waveData } from "../data";
import { LAYOUT } from "../utils/constants";
import { GameStateManager } from "../core/game-state";

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
  const hasBoss = waveNumber % waveData.bossWaveInterval === 0;
  const regularEnemies = waveNumber * waveData.enemyMultiplier;
  const totalEnemies = regularEnemies + (hasBoss ? 1 : 0);

  // First enemy spawns immediately
  waveSystem.update(0);

  // Spawn remaining enemies one by one
  for (let i = 1; i < totalEnemies; i++) {
    waveSystem.update(waveData.spawnIntervalMax);
  }
}

describe("WaveSystem", () => {
  let waveSystem: WaveSystem;
  let eventQueue: EventQueue;
  let gameState: GameStateManager;
  let spawnedEnemies: Array<{
    type: string;
    x: number;
    y: number;
    wave: number;
  }>;

  beforeEach(() => {
    waveSystem = new WaveSystem();
    eventQueue = new EventQueue();
    gameState = new GameStateManager();
    spawnedEnemies = [];

    // Inject dependencies using new API
    waveSystem.inject("EventQueue", eventQueue);
    waveSystem.inject("GameState", gameState);
    waveSystem.validateDependencies();
    waveSystem.setSpawnCallback((type, x, y, wave) => {
      spawnedEnemies.push({ type, x, y, wave });
    });

    waveSystem.initialize();
    eventQueue.initialize();
  });

  describe("Enemy Spawning", () => {
    // Helper to check if enemy type is regular (non-boss)
    const isRegularEnemy = (type: string) =>
      ["Ghost", "RedGhost", "GreenGhost", "BlueGhost"].includes(type);

    it("WS-01: Wave 1 生成 3 隻敵人", () => {
      waveSystem.startWave(1);
      simulateFullWaveSpawn(waveSystem, 1);

      expect(spawnedEnemies.length).toBe(3);
      // SPEC § 2.3.5: Regular enemies can be Ghost or Elite types
      expect(spawnedEnemies.every((e) => isRegularEnemy(e.type))).toBe(true);
    });

    it("WS-02: Wave 2 生成 6 隻敵人", () => {
      waveSystem.startWave(2);
      simulateFullWaveSpawn(waveSystem, 2);

      expect(spawnedEnemies.length).toBe(6);
    });

    it("WS-03: Wave 5 生成 15 隻敵人 + 1 Boss", () => {
      waveSystem.startWave(5);
      simulateFullWaveSpawn(waveSystem, 5);

      // SPEC § 2.3.5: 15 regular enemies (Ghost/Elite) + 1 Boss
      const regularEnemies = spawnedEnemies.filter((e) =>
        isRegularEnemy(e.type),
      );
      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");

      expect(regularEnemies.length).toBe(15);
      expect(bosses.length).toBe(1);
      expect(spawnedEnemies.length).toBe(16);
    });

    it("WS-04: Wave 10 生成 30 隻敵人 + 1 Boss", () => {
      waveSystem.startWave(10);
      simulateFullWaveSpawn(waveSystem, 10);

      // SPEC § 2.3.5: 30 regular enemies (Ghost/Elite) + 1 Boss
      const regularEnemies = spawnedEnemies.filter((e) =>
        isRegularEnemy(e.type),
      );
      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");

      expect(regularEnemies.length).toBe(30);
      expect(bosses.length).toBe(1);
    });

    it("WS-05: Wave 4 不生成 Boss (12 隻敵人)", () => {
      waveSystem.startWave(4);
      simulateFullWaveSpawn(waveSystem, 4);

      const bosses = spawnedEnemies.filter((e) => e.type === "Boss");
      expect(bosses.length).toBe(0);
      expect(spawnedEnemies.length).toBe(12);
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

    it("WS-17: 後續敵人需等待 0.8-1.5 秒", () => {
      waveSystem.startWave(2);
      waveSystem.update(0); // First enemy spawns immediately

      expect(spawnedEnemies.length).toBe(1);

      // After 0.5 second, no new enemy yet (min interval is 0.8s)
      waveSystem.update(0.5);
      expect(spawnedEnemies.length).toBe(1);

      // After 1.5 more seconds (total 2s), should have spawned
      waveSystem.update(1.5);
      expect(spawnedEnemies.length).toBeGreaterThan(1);
    });

    it("WS-18: Boss 在所有普通敵人之後生成", () => {
      waveSystem.startWave(5);

      // Spawn first enemy immediately
      waveSystem.update(0);
      expect(spawnedEnemies.length).toBe(1);

      // Spawn enemies 2-14 (13 more, need 14 more for total 15)
      for (let i = 1; i < 14; i++) {
        waveSystem.update(waveData.spawnIntervalMax);
      }

      // At this point we should have 14 regular enemies, and still 1 to spawn
      expect(spawnedEnemies.length).toBe(14);
      expect(gameState.waveSpawn.enemiesToSpawn).toBe(1);
      expect(gameState.waveSpawn.shouldSpawnBoss).toBe(true);

      // Spawn the 15th regular enemy
      waveSystem.update(waveData.spawnIntervalMax);
      const regularEnemies = spawnedEnemies.filter((e) =>
        isRegularEnemy(e.type),
      );
      expect(regularEnemies.length).toBe(15);
      expect(gameState.waveSpawn.enemiesToSpawn).toBe(0);

      // Boss should spawn now (in the same update where enemiesToSpawn becomes 0)
      // Since boss spawns in update() after enemiesToSpawn === 0
      expect(spawnedEnemies.filter((e) => e.type === "Boss").length).toBe(1);
      expect(gameState.waveSpawn.shouldSpawnBoss).toBe(false);
    });

    it("WS-19: Y 座標為遊戲區域內的隨機值（考慮敵人大小，避開 HUD）", () => {
      waveSystem.startWave(3);
      simulateFullWaveSpawn(waveSystem, 3);

      // SPEC § 2.3.5 / § 2.7.2: Y should be within game area, accounting for enemy size
      // Enemy position is center-based, so boundaries account for half the enemy size (128 px)
      const halfSize = LAYOUT.ENEMY_SIZE / 2; // 128
      const minY = LAYOUT.GAME_AREA_Y + halfSize; // 86 + 128 = 214
      const maxY = LAYOUT.GAME_AREA_Y + LAYOUT.GAME_AREA_HEIGHT - halfSize; // 954 - 128 = 826

      // Check Y positions are within valid range (enemy sprite fully visible in game area)
      expect(spawnedEnemies.every((e) => e.y >= minY && e.y <= maxY)).toBe(
        true,
      );

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

      waveSystem.startWave(1); // 3 enemies (波次 × 3)
      simulateFullWaveSpawn(waveSystem, 1);

      // Simulate 3 enemy deaths
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-3",
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

      waveSystem.startWave(1); // 3 enemies (波次 × 3)
      simulateFullWaveSpawn(waveSystem, 1);

      // Simulate enemies reaching end
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-1" });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-2" });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-3" });

      waveSystem.update(0);
      eventQueue.update(2);

      expect(waveCompleteFired).toBe(true);
    });

    it("WS-10: 混合死亡和到達底線", () => {
      waveSystem.startWave(2); // 6 enemies (波次 × 3)
      simulateFullWaveSpawn(waveSystem, 2);

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-3",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-4" });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-5" });
      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-6" });

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
      waveSystem.startWave(1); // 3 enemies (波次 × 3)
      simulateFullWaveSpawn(waveSystem, 1);

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-2",
        position: { x: 500, y: 540 },
      });
      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-3",
        position: { x: 500, y: 540 },
      });

      waveSystem.update(0);

      expect(waveSystem.isActive()).toBe(false);
    });

    it("WS-14: Reset 後狀態歸零", () => {
      waveSystem.startWave(5);

      waveSystem.reset();
      gameState.reset(); // GameState also needs reset

      expect(waveSystem.getCurrentWave()).toBe(0);
      expect(waveSystem.isActive()).toBe(false);
      expect(waveSystem.getRemainingEnemies()).toBe(0);
    });
  });

  describe("Enemy Tracking", () => {
    it("WS-15: 正確追蹤剩餘敵人數量", () => {
      waveSystem.startWave(3); // 9 enemies (波次 × 3)

      expect(waveSystem.getRemainingEnemies()).toBe(9);

      eventQueue.publish(EventType.EnemyDeath, {
        enemyId: "enemy-1",
        position: { x: 500, y: 540 },
      });

      expect(waveSystem.getRemainingEnemies()).toBe(8);

      eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: "enemy-2" });

      expect(waveSystem.getRemainingEnemies()).toBe(7);
    });
  });

  describe("Wave Number Propagation (SPEC § 2.6.2)", () => {
    it("WS-20: 傳遞正確的波次給 spawn callback", () => {
      waveSystem.startWave(5);
      waveSystem.update(0); // First enemy spawns immediately

      expect(spawnedEnemies.length).toBeGreaterThan(0);
      expect(spawnedEnemies[0].wave).toBe(5);
    });

    it("WS-21: 後續敵人也傳遞相同波次", () => {
      waveSystem.startWave(10);
      simulateFullWaveSpawn(waveSystem, 10);

      // All enemies should have wave = 10
      expect(spawnedEnemies.every((e) => e.wave === 10)).toBe(true);
    });

    it("WS-22: Boss 也傳遞正確波次", () => {
      waveSystem.startWave(5); // Boss wave
      simulateFullWaveSpawn(waveSystem, 5);

      const boss = spawnedEnemies.find((e) => e.type === "Boss");
      expect(boss).toBeDefined();
      expect(boss!.wave).toBe(5);
    });
  });
});
