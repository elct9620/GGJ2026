/**
 * Wave System
 * SPEC § 2.3.5: 控制敵人生成和回合進程
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";

/**
 * Enemy spawn callback type
 */
export type EnemySpawnCallback = (
  enemyType: "Ghost" | "Boss",
  x: number,
  y: number,
) => void;

/**
 * Wave System
 * SPEC § 2.3.5: 控制敵人生成和回合進程
 *
 * Responsibilities:
 * - 計算並生成敵人（回合數 × 2）
 * - Boss 每 5 回合生成
 * - 訂閱 EnemyDeath 和 EnemyReachedEnd 追蹤剩餘敵人
 * - 發佈 WaveStart 和 WaveComplete 事件
 */
export class WaveSystem extends InjectableSystem {
  public readonly name = "WaveSystem";
  public readonly priority = SystemPriority.WAVE;

  // Dependency keys
  private static readonly DEP_EVENT_QUEUE = "EventQueue";

  // Enemy tracking
  private enemiesSpawnedThisWave = 0;
  private enemiesRemainingThisWave = 0;

  // Wave state
  private currentWave = 0;
  private isWaveActive = false;

  // Spawn callback (GameScene provides this - not injectable)
  private onSpawnEnemy: EnemySpawnCallback | null = null;

  constructor() {
    super();
    this.declareDependency(WaveSystem.DEP_EVENT_QUEUE);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(WaveSystem.DEP_EVENT_QUEUE);
  }

  /**
   * Initialize wave system
   */
  public initialize(): void {
    this.currentWave = 0;
    this.isWaveActive = false;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesRemainingThisWave = 0;

    // Subscribe to enemy events (SPEC § 2.3.6)
    this.eventQueue.subscribe(
      EventType.EnemyDeath,
      this.onEnemyDeath.bind(this),
    );
    this.eventQueue.subscribe(
      EventType.EnemyReachedEnd,
      this.onEnemyReachedEnd.bind(this),
    );
  }

  /**
   * Update wave system
   */
  public update(): void {
    // Check wave completion
    if (
      this.isWaveActive &&
      this.enemiesRemainingThisWave === 0 &&
      this.enemiesSpawnedThisWave > 0
    ) {
      this.completeWave();
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.onSpawnEnemy = null;
  }

  /**
   * Set spawn callback (called when enemy should be created)
   */
  public setSpawnCallback(callback: EnemySpawnCallback): void {
    this.onSpawnEnemy = callback;
  }

  /**
   * Start a new wave
   * SPEC § 2.3.5: Enemy count = wave number × 2
   */
  public startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    this.isWaveActive = true;
    this.enemiesSpawnedThisWave = 0;

    // Publish WaveStart event (SPEC § 2.3.6)
    this.eventQueue.publish(EventType.WaveStart, { waveNumber });

    // Calculate enemy count (SPEC § 2.3.5)
    const enemyCount = waveNumber * 2;

    // Spawn regular enemies
    for (let i = 0; i < enemyCount; i++) {
      this.spawnEnemy("Ghost", i, enemyCount);
    }

    // Spawn boss every 5 waves (SPEC § 2.3.5)
    if (waveNumber % 5 === 0) {
      this.spawnEnemy("Boss", enemyCount, enemyCount + 1);
    }

    // Set remaining enemies count
    this.enemiesRemainingThisWave = this.enemiesSpawnedThisWave;
  }

  /**
   * Get current wave number
   */
  public getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Get remaining enemies in current wave
   */
  public getRemainingEnemies(): number {
    return this.enemiesRemainingThisWave;
  }

  /**
   * Check if wave is active
   */
  public isActive(): boolean {
    return this.isWaveActive;
  }

  /**
   * Spawn an enemy
   * SPEC § 2.3.5: Spawn position x=1950, y=random
   */
  private spawnEnemy(
    type: "Ghost" | "Boss",
    index: number,
    totalEnemies: number,
  ): void {
    if (!this.onSpawnEnemy) return;

    // SPEC § 2.3.5: X = 1950 (off-screen right)
    const xPosition = 1920 + 50 + index * 100; // Stagger spawn positions

    // SPEC § 2.3.5: Y = random 0~1080
    const yPosition = 100 + (index * 900) / totalEnemies;

    this.onSpawnEnemy(type, xPosition, yPosition);
    this.enemiesSpawnedThisWave++;
  }

  /**
   * Handle EnemyDeath event (SPEC § 2.3.6)
   */
  private onEnemyDeath(): void {
    if (this.isWaveActive && this.enemiesRemainingThisWave > 0) {
      this.enemiesRemainingThisWave--;
    }
  }

  /**
   * Handle EnemyReachedEnd event (SPEC § 2.3.6)
   */
  private onEnemyReachedEnd(): void {
    if (this.isWaveActive && this.enemiesRemainingThisWave > 0) {
      this.enemiesRemainingThisWave--;
    }
  }

  /**
   * Complete current wave and prepare for next
   * SPEC § 2.3.6: Publish WaveComplete event
   */
  private completeWave(): void {
    this.isWaveActive = false;

    // Publish WaveComplete event (SPEC § 2.3.6)
    // Delay can be configured (default 2000ms for upgrade screen)
    this.eventQueue.publish(
      EventType.WaveComplete,
      { waveNumber: this.currentWave },
      2000,
    );
  }

  /**
   * Reset wave system for new game
   */
  public reset(): void {
    this.currentWave = 0;
    this.isWaveActive = false;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesRemainingThisWave = 0;
  }
}
