/**
 * Wave Data Catalog
 * Centralizes all wave configuration
 * SPEC § 2.3.5: Wave System
 */

import wavesJson from "./waves.json";

/**
 * Spawn probability configuration
 */
export interface SpawnProbability {
  ghost: number;
  redGhost: number;
  greenGhost: number;
  blueGhost: number;
}

/**
 * Raw JSON structure
 */
interface WaveJsonData {
  bossWaveInterval: number;
  enemyMultiplier: number;
  waveCompleteDelayMs: number;
  spawnIntervalMin: number;
  spawnIntervalMax: number;
  spawnProbability: SpawnProbability;
}

/**
 * WaveData Catalog
 * Encapsulates wave configuration and provides helper methods
 */
export class WaveData {
  public readonly bossWaveInterval: number;
  public readonly enemyMultiplier: number;
  public readonly waveCompleteDelayMs: number;
  public readonly spawnIntervalMin: number;
  public readonly spawnIntervalMax: number;
  public readonly spawnProbability: SpawnProbability;

  constructor(json: WaveJsonData = wavesJson as WaveJsonData) {
    this.bossWaveInterval = json.bossWaveInterval;
    this.enemyMultiplier = json.enemyMultiplier;
    this.waveCompleteDelayMs = json.waveCompleteDelayMs;
    this.spawnIntervalMin = json.spawnIntervalMin;
    this.spawnIntervalMax = json.spawnIntervalMax;
    this.spawnProbability = json.spawnProbability;
  }

  /**
   * Check if a wave is a boss wave
   */
  isBossWave(wave: number): boolean {
    return wave > 0 && wave % this.bossWaveInterval === 0;
  }

  /**
   * Calculate enemy count for a wave
   */
  getEnemyCount(wave: number): number {
    return wave * this.enemyMultiplier;
  }

  /**
   * Get random spawn interval
   */
  getRandomSpawnInterval(): number {
    return (
      this.spawnIntervalMin +
      Math.random() * (this.spawnIntervalMax - this.spawnIntervalMin)
    );
  }
}

/** Default WaveData instance */
export const waveData = new WaveData();

// Backwards compatibility exports
/** @deprecated Use waveData directly */
export const WAVE_CONFIG = {
  bossWaveInterval: waveData.bossWaveInterval,
  enemyMultiplier: waveData.enemyMultiplier,
  waveCompleteDelayMs: waveData.waveCompleteDelayMs,
  spawnIntervalMin: waveData.spawnIntervalMin,
  spawnIntervalMax: waveData.spawnIntervalMax,
  spawnProbability: waveData.spawnProbability,
};
