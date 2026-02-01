/**
 * WaveData Catalog Tests
 * SPEC § 2.3.5: Wave System
 */

import { describe, it, expect, vi } from "vitest";
import { WaveData, waveData, WAVE_CONFIG } from "./wave-data";

describe("WaveData", () => {
  describe("configuration values", () => {
    it("should have bossWaveInterval of 5", () => {
      expect(waveData.bossWaveInterval).toBe(5);
    });

    it("should have enemyMultiplier of 2", () => {
      expect(waveData.enemyMultiplier).toBe(2);
    });

    it("should have waveCompleteDelayMs of 2000", () => {
      expect(waveData.waveCompleteDelayMs).toBe(2000);
    });

    it("should have spawn intervals", () => {
      expect(waveData.spawnIntervalMin).toBe(2);
      expect(waveData.spawnIntervalMax).toBe(3);
    });

    it("should have spawn probability", () => {
      expect(waveData.spawnProbability.ghost).toBe(0.4);
      expect(waveData.spawnProbability.redGhost).toBe(0.2);
      expect(waveData.spawnProbability.greenGhost).toBe(0.2);
      expect(waveData.spawnProbability.blueGhost).toBe(0.2);
    });
  });

  describe("isBossWave", () => {
    it("should return false for wave 0", () => {
      expect(waveData.isBossWave(0)).toBe(false);
    });

    it("should return false for wave 1-4", () => {
      expect(waveData.isBossWave(1)).toBe(false);
      expect(waveData.isBossWave(2)).toBe(false);
      expect(waveData.isBossWave(3)).toBe(false);
      expect(waveData.isBossWave(4)).toBe(false);
    });

    it("should return true for wave 5", () => {
      expect(waveData.isBossWave(5)).toBe(true);
    });

    it("should return true for wave 10", () => {
      expect(waveData.isBossWave(10)).toBe(true);
    });

    it("should return false for wave 6", () => {
      expect(waveData.isBossWave(6)).toBe(false);
    });
  });

  describe("getEnemyCount", () => {
    it("should return wave * 2", () => {
      expect(waveData.getEnemyCount(1)).toBe(2);
      expect(waveData.getEnemyCount(5)).toBe(10);
      expect(waveData.getEnemyCount(10)).toBe(20);
    });
  });

  describe("getRandomSpawnInterval", () => {
    it("should return value between min and max", () => {
      // Mock Math.random for predictable testing
      vi.spyOn(Math, "random").mockReturnValue(0);
      expect(waveData.getRandomSpawnInterval()).toBe(2);

      vi.spyOn(Math, "random").mockReturnValue(1);
      expect(waveData.getRandomSpawnInterval()).toBe(3);

      vi.spyOn(Math, "random").mockReturnValue(0.5);
      expect(waveData.getRandomSpawnInterval()).toBe(2.5);

      vi.restoreAllMocks();
    });
  });

  describe("custom instance", () => {
    it("should allow creating instance with custom JSON", () => {
      const customJson = {
        bossWaveInterval: 10,
        enemyMultiplier: 3,
        waveCompleteDelayMs: 3000,
        spawnIntervalMin: 1,
        spawnIntervalMax: 2,
        spawnProbability: {
          ghost: 0.5,
          redGhost: 0.2,
          greenGhost: 0.2,
          blueGhost: 0.1,
        },
      };

      const customWaveData = new WaveData(customJson);
      expect(customWaveData.bossWaveInterval).toBe(10);
      expect(customWaveData.isBossWave(10)).toBe(true);
      expect(customWaveData.isBossWave(5)).toBe(false);
      expect(customWaveData.getEnemyCount(5)).toBe(15);
    });
  });

  describe("backwards compatibility", () => {
    it("WAVE_CONFIG should work", () => {
      expect(WAVE_CONFIG.bossWaveInterval).toBe(5);
      expect(WAVE_CONFIG.enemyMultiplier).toBe(2);
      expect(WAVE_CONFIG.spawnProbability.ghost).toBe(0.4);
    });
  });
});
