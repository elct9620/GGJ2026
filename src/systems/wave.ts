/**
 * Wave System
 * SPEC § 2.3.5: 控制敵人生成和回合進程
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { waveData, enemyData } from "../data";
import { DependencyKeys } from "../core/systems/dependency-keys";
import { LAYOUT, getEntityBounds } from "../utils/constants";
import type { GameStateManager } from "../core/game-state";

/**
 * Enemy spawn callback type
 * SPEC § 2.6.2: Ghost, RedGhost, GreenGhost, BlueGhost, Boss
 */
export type SpawnableEnemyType =
  | "Ghost"
  | "RedGhost"
  | "GreenGhost"
  | "BlueGhost"
  | "Boss";

export type EnemySpawnCallback = (
  enemyType: SpawnableEnemyType,
  x: number,
  y: number,
  wave: number,
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
 *
 * State Management:
 * - Wave state (currentWave, isActive, enemiesRemaining) is stored in GameStateManager
 * - Internal implementation details (spawn timer, etc.) remain in this system
 */
export class WaveSystem extends InjectableSystem {
  public readonly name = "WaveSystem";
  public readonly priority = SystemPriority.WAVE;

  // Enemy tracking (internal counter for spawning)
  private enemiesSpawnedThisWave = 0;

  // Progressive spawn state (SPEC § 2.3.5) - internal implementation details
  private enemiesToSpawn = 0; // 剩餘待生成數量
  private spawnTimer = 0; // 生成計時器（秒）
  private nextSpawnInterval = 0; // 下次生成間隔（秒）
  private shouldSpawnBoss = false; // 是否需要生成 Boss

  // Spawn callback (GameScene provides this - not injectable)
  private onSpawnEnemy: EnemySpawnCallback | null = null;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue);
    this.declareDependency(DependencyKeys.GameState);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * Get GameStateManager dependency
   */
  private get gameState(): GameStateManager {
    return this.getDependency<GameStateManager>(DependencyKeys.GameState);
  }

  /**
   * Initialize wave system
   */
  public initialize(): void {
    this.enemiesSpawnedThisWave = 0;
    // Wave state is initialized by GameStateManager

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
   * SPEC § 2.3.5: 處理漸進式敵人生成
   */
  public update(deltaTime: number): void {
    const isActive = this.gameState.wave.isActive;
    const enemiesRemaining = this.gameState.wave.enemiesRemaining;

    // Handle progressive enemy spawning
    if (isActive && this.enemiesToSpawn > 0) {
      this.spawnTimer += deltaTime;

      if (this.spawnTimer >= this.nextSpawnInterval) {
        this.spawnTimer = 0;
        this.spawnNextEnemy();
      }
    }

    // Spawn boss after all regular enemies
    if (isActive && this.enemiesToSpawn === 0 && this.shouldSpawnBoss) {
      this.spawnEnemy("Boss");
      this.shouldSpawnBoss = false;
    }

    // Check wave completion
    if (
      isActive &&
      enemiesRemaining === 0 &&
      this.enemiesSpawnedThisWave > 0 &&
      this.enemiesToSpawn === 0 &&
      !this.shouldSpawnBoss
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
   * SPEC § 2.3.5: Enemy count = wave number × 2, progressive spawn every 2-3s
   */
  public startWave(waveNumber: number): void {
    this.enemiesSpawnedThisWave = 0;

    // Publish WaveStart event (SPEC § 2.3.6)
    this.eventQueue.publish(EventType.WaveStart, { waveNumber });

    // Calculate enemy count (SPEC § 2.3.5)
    const enemyCount = waveNumber * waveData.enemyMultiplier;

    // Setup progressive spawning (SPEC § 2.3.5)
    this.enemiesToSpawn = enemyCount;
    this.spawnTimer = 0;
    this.nextSpawnInterval = 0; // First enemy spawns immediately
    this.shouldSpawnBoss = waveNumber % waveData.bossWaveInterval === 0;

    // Calculate total enemies for tracking
    const totalEnemies = enemyCount + (this.shouldSpawnBoss ? 1 : 0);

    // Update GameState
    this.gameState.startWave(waveNumber, totalEnemies);
  }

  /**
   * Get current wave number
   */
  public getCurrentWave(): number {
    return this.gameState.wave.currentWave;
  }

  /**
   * Get remaining enemies in current wave
   */
  public getRemainingEnemies(): number {
    return this.gameState.wave.enemiesRemaining;
  }

  /**
   * Check if wave is active
   */
  public isActive(): boolean {
    return this.gameState.wave.isActive;
  }

  /**
   * Spawn next enemy in progressive spawning
   * SPEC § 2.3.5: Spawn every 2-3 seconds with type probability
   */
  private spawnNextEnemy(): void {
    if (this.enemiesToSpawn <= 0) return;

    const enemyType = this.selectEnemyType();
    this.spawnEnemy(enemyType);
    this.enemiesToSpawn--;

    // Set next spawn interval (2-3 seconds random)
    this.nextSpawnInterval = this.getRandomSpawnInterval();
  }

  /**
   * Select enemy type based on spawn probability
   * SPEC § 2.3.5: Ghost 40%, RedGhost 20%, GreenGhost 20%, BlueGhost 20%
   */
  private selectEnemyType(): SpawnableEnemyType {
    const { spawnProbability } = waveData;
    const roll = Math.random();

    // Cumulative probability check
    let cumulative = 0;

    cumulative += spawnProbability.ghost;
    if (roll < cumulative) return "Ghost";

    cumulative += spawnProbability.redGhost;
    if (roll < cumulative) return "RedGhost";

    cumulative += spawnProbability.greenGhost;
    if (roll < cumulative) return "GreenGhost";

    // Remaining probability is Blue Ghost
    return "BlueGhost";
  }

  /**
   * Spawn an enemy
   * SPEC § 2.3.5: Spawn position x=1950, y=random 0~1080
   * SPEC § 2.6.2: Pass wave number for HP scaling
   */
  private spawnEnemy(type: SpawnableEnemyType): void {
    if (!this.onSpawnEnemy) return;

    // SPEC § 2.3.5: X = spawn position (off-screen right)
    const xPosition = enemyData.spawnX;

    // SPEC § 2.3.5: Y = random 0~1080
    const yPosition = this.getRandomYPosition();

    // SPEC § 2.6.2: Pass current wave for HP scaling
    const currentWave = this.gameState.wave.currentWave;

    this.onSpawnEnemy(type, xPosition, yPosition, currentWave);
    this.enemiesSpawnedThisWave++;
  }

  /**
   * Get random spawn interval between min and max
   * SPEC § 2.3.5: 2-3 seconds
   */
  private getRandomSpawnInterval(): number {
    return waveData.getRandomSpawnInterval();
  }

  /**
   * Get random Y position within game area
   * SPEC § 2.3.5 / § 2.7.2: Y position accounts for enemy size (256×256 px)
   * Enemy position is center-based, so boundaries account for half the enemy size
   */
  private getRandomYPosition(): number {
    const bounds = getEntityBounds(LAYOUT.ENEMY_SIZE);
    const range = bounds.maxY - bounds.minY;

    return bounds.minY + Math.random() * range;
  }

  /**
   * Handle EnemyDeath event (SPEC § 2.3.6)
   */
  private onEnemyDeath(): void {
    if (this.gameState.wave.isActive) {
      this.gameState.decrementEnemiesRemaining();
    }
  }

  /**
   * Handle EnemyReachedEnd event (SPEC § 2.3.6)
   */
  private onEnemyReachedEnd(): void {
    if (this.gameState.wave.isActive) {
      this.gameState.decrementEnemiesRemaining();
    }
  }

  /**
   * Complete current wave and prepare for next
   * SPEC § 2.3.6: Publish WaveComplete event
   */
  private completeWave(): void {
    const currentWave = this.gameState.wave.currentWave;
    this.gameState.completeWave();

    // Publish WaveComplete event (SPEC § 2.3.6)
    // Delay can be configured for upgrade screen
    this.eventQueue.publish(
      EventType.WaveComplete,
      { waveNumber: currentWave },
      waveData.waveCompleteDelayMs,
    );
  }

  /**
   * Reset wave system for new game
   */
  public reset(): void {
    this.enemiesSpawnedThisWave = 0;
    this.enemiesToSpawn = 0;
    this.spawnTimer = 0;
    this.nextSpawnInterval = 0;
    this.shouldSpawnBoss = false;
    // Wave state reset is handled by GameStateManager.reset()
  }

  /**
   * Get remaining enemies to spawn (for testing)
   */
  public getEnemiesToSpawn(): number {
    return this.enemiesToSpawn;
  }

  /**
   * Check if boss spawn is pending (for testing)
   */
  public isBossSpawnPending(): boolean {
    return this.shouldSpawnBoss;
  }
}
