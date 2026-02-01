/**
 * Game State Management
 * Spec: § 2.4.2 User Journey, § 2.8.2 Defeat Condition
 */

import { SpecialBulletType, FoodType, BoothId } from "./types";

// ============================================
// Upgrade State (SPEC § 2.3.4)
// ============================================

/**
 * Upgrade state tracking all permanent upgrades
 * Single source of truth for upgrade values (SPEC § 2.3.4)
 */
export interface UpgradeState {
  // Normal upgrades (SPEC § 2.3.4)
  stinkyTofuDamageBonus: number; // 加辣: +0.5 per upgrade
  bubbleTeaBulletBonus: number; // 加椰果: +1 per upgrade
  bloodCakeRangeBonus: number; // 加香菜: +0.5 per upgrade

  // Boss upgrades (SPEC § 2.3.4)
  recipeCostReduction: number; // 打折: -1 per upgrade (min 1)
  magazineMultiplier: number; // 大胃王: +6 per upgrade
  killThresholdDivisor: number; // 快吃: +10% per upgrade
  buffDurationMultiplier: number; // 飢餓三十: +2s per upgrade

  // NEW: Missing Boss upgrades
  reloadTimeReduction: number; // 好餓好餓: -0.5s per upgrade
  nightMarketChainMultiplier: number; // 總匯吃到飽: ×2 per upgrade (初始 1)
  nightMarketDecayReduction: number; // 總匯吃到飽: -0.1 per upgrade
}

/**
 * Create default upgrade state
 * Single source of truth for initial upgrade values
 */
export function createDefaultUpgradeState(): UpgradeState {
  return {
    stinkyTofuDamageBonus: 0,
    bubbleTeaBulletBonus: 0,
    bloodCakeRangeBonus: 0,
    recipeCostReduction: 0,
    magazineMultiplier: 1,
    killThresholdDivisor: 1,
    buffDurationMultiplier: 1,
    reloadTimeReduction: 0,
    nightMarketChainMultiplier: 1,
    nightMarketDecayReduction: 0,
  };
}

// Screen state enum (renamed to avoid conflict with class)
export const ScreenState = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
} as const;

export type ScreenState = (typeof ScreenState)[keyof typeof ScreenState];

/**
 * Game statistics tracked during gameplay
 */
export interface GameStats {
  wavesSurvived: number;
  enemiesDefeated: number;
  specialBulletsUsed: number;
}

/**
 * Creates initial game statistics
 */
export function createGameStats(): GameStats {
  return {
    wavesSurvived: 0,
    enemiesDefeated: 0,
    specialBulletsUsed: 0,
  };
}

// ============================================
// Centralized Game State (Refactored)
// ============================================

/**
 * Wave state (SPEC § 2.3.5)
 */
export interface WaveState {
  currentWave: number;
  isActive: boolean;
  enemiesRemaining: number;
}

/**
 * Wave spawn state - internal spawn management (SPEC § 2.3.5)
 * Tracks progressive enemy spawning within a wave
 */
export interface WaveSpawnState {
  enemiesToSpawn: number; // 剩餘待生成數量
  spawnTimer: number; // 生成計時器（秒）
  nextSpawnInterval: number; // 下次生成間隔（秒）
  shouldSpawnBoss: boolean; // 是否需要生成 Boss
  enemiesSpawnedThisWave: number; // 本回合已生成敵人數量
}

/**
 * Combat state (SPEC § 2.3.2)
 */
export interface CombatState {
  currentBuff: SpecialBulletType;
  buffTimeRemaining: number;
}

/**
 * Resource state (SPEC § 2.3.1)
 * Read-only snapshot from BoothSystem
 */
export interface ResourceState {
  pearl: number;
  tofu: number;
  bloodCake: number;
}

// ============================================
// Booth State (SPEC § 2.3.1)
// ============================================

/**
 * Individual booth state
 * Stores food type, count, and max capacity
 */
export interface BoothState {
  foodType: FoodType;
  count: number;
  maxCapacity: number; // Fixed at 6 per SPEC
}

/**
 * Centralized game state interface
 * Defines the structure of game-wide state
 */
export interface GameStateSnapshot {
  // Screen state
  screen: ScreenState;

  // Wave state
  wave: WaveState;

  // Wave spawn state - internal spawn management
  waveSpawn: WaveSpawnState;

  // Combat state
  combat: CombatState;

  // Kill counter
  kills: number;

  // Statistics
  stats: GameStats;

  // Upgrades (SPEC § 2.3.4)
  upgrades: UpgradeState;

  // Resources (SPEC § 2.3.1) - read-only snapshot
  resources: ResourceState;

  // Booths (SPEC § 2.3.1) - centralized booth state
  booths: ReadonlyMap<BoothId, BoothState>;
}

/**
 * Creates initial wave state
 */
function createInitialWaveState(): WaveState {
  return {
    currentWave: 0,
    isActive: false,
    enemiesRemaining: 0,
  };
}

/**
 * Creates initial wave spawn state
 */
function createInitialWaveSpawnState(): WaveSpawnState {
  return {
    enemiesToSpawn: 0,
    spawnTimer: 0,
    nextSpawnInterval: 0,
    shouldSpawnBoss: false,
    enemiesSpawnedThisWave: 0,
  };
}

/**
 * Creates initial combat state
 */
function createInitialCombatState(): CombatState {
  return {
    currentBuff: SpecialBulletType.None,
    buffTimeRemaining: 0,
  };
}

/**
 * Centralized Game State Manager
 * Single Source of Truth for game-wide state
 *
 * Systems read from GameStateManager and update via specific methods.
 * This ensures consistent state across all systems.
 */
export class GameStateManager implements GameStateSnapshot {
  private _screen: ScreenState = ScreenState.START;
  private _wave: WaveState = createInitialWaveState();
  private _waveSpawn: WaveSpawnState = createInitialWaveSpawnState();
  private _combat: CombatState = createInitialCombatState();
  private _kills: number = 0;
  private _stats: GameStats = createGameStats();
  private _upgrades: UpgradeState = createDefaultUpgradeState();
  private _booths: Map<BoothId, BoothState> = new Map();

  // ============================================
  // Read-only getters
  // ============================================

  get screen(): ScreenState {
    return this._screen;
  }

  get wave(): Readonly<WaveState> {
    return this._wave;
  }

  get waveSpawn(): Readonly<WaveSpawnState> {
    return this._waveSpawn;
  }

  get combat(): Readonly<CombatState> {
    return this._combat;
  }

  get kills(): number {
    return this._kills;
  }

  get stats(): Readonly<GameStats> {
    return this._stats;
  }

  get upgrades(): Readonly<UpgradeState> {
    return this._upgrades;
  }

  get resources(): ResourceState {
    // Compute from booths (centralized state)
    return {
      pearl: this._booths.get(BoothId.Pearl)?.count ?? 0,
      tofu: this._booths.get(BoothId.Tofu)?.count ?? 0,
      bloodCake: this._booths.get(BoothId.BloodCake)?.count ?? 0,
    };
  }

  get booths(): ReadonlyMap<BoothId, BoothState> {
    return this._booths;
  }

  // ============================================
  // Screen state updaters
  // ============================================

  setScreen(screen: ScreenState): void {
    this._screen = screen;
  }

  // ============================================
  // Wave state updaters
  // ============================================

  setWave(update: Partial<WaveState>): void {
    this._wave = { ...this._wave, ...update };
  }

  startWave(waveNumber: number, enemiesRemaining: number): void {
    this._wave = {
      currentWave: waveNumber,
      isActive: true,
      enemiesRemaining,
    };
  }

  completeWave(): void {
    this._wave.isActive = false;
  }

  decrementEnemiesRemaining(): void {
    if (this._wave.enemiesRemaining > 0) {
      this._wave.enemiesRemaining--;
    }
  }

  // ============================================
  // Wave spawn state updaters (SPEC § 2.3.5)
  // ============================================

  /**
   * Initialize wave spawn state for a new wave
   */
  initializeWaveSpawn(enemiesToSpawn: number, shouldSpawnBoss: boolean): void {
    this._waveSpawn = {
      enemiesToSpawn,
      spawnTimer: 0,
      nextSpawnInterval: 0, // First enemy spawns immediately
      shouldSpawnBoss,
      enemiesSpawnedThisWave: 0,
    };
  }

  /**
   * Update spawn timer
   */
  updateSpawnTimer(deltaTime: number): void {
    this._waveSpawn = {
      ...this._waveSpawn,
      spawnTimer: this._waveSpawn.spawnTimer + deltaTime,
    };
  }

  /**
   * Reset spawn timer and set next interval
   */
  resetSpawnTimer(nextInterval: number): void {
    this._waveSpawn = {
      ...this._waveSpawn,
      spawnTimer: 0,
      nextSpawnInterval: nextInterval,
    };
  }

  /**
   * Decrement enemies to spawn and increment spawned count
   */
  decrementEnemiesToSpawn(): void {
    this._waveSpawn = {
      ...this._waveSpawn,
      enemiesToSpawn: this._waveSpawn.enemiesToSpawn - 1,
      enemiesSpawnedThisWave: this._waveSpawn.enemiesSpawnedThisWave + 1,
    };
  }

  /**
   * Increment spawned count (for boss or special spawns)
   */
  incrementEnemiesSpawned(): void {
    this._waveSpawn = {
      ...this._waveSpawn,
      enemiesSpawnedThisWave: this._waveSpawn.enemiesSpawnedThisWave + 1,
    };
  }

  /**
   * Clear boss spawn flag
   */
  clearBossSpawnFlag(): void {
    this._waveSpawn = {
      ...this._waveSpawn,
      shouldSpawnBoss: false,
    };
  }

  /**
   * Reset wave spawn state
   */
  resetWaveSpawn(): void {
    this._waveSpawn = createInitialWaveSpawnState();
  }

  // ============================================
  // Combat state updaters
  // ============================================

  setCombat(update: Partial<CombatState>): void {
    this._combat = { ...this._combat, ...update };
  }

  activateBuff(buffType: SpecialBulletType, duration: number): void {
    this._combat = {
      currentBuff: buffType,
      buffTimeRemaining: duration,
    };
  }

  updateBuffTimer(deltaTime: number): boolean {
    if (this._combat.buffTimeRemaining > 0) {
      this._combat.buffTimeRemaining -= deltaTime;

      if (this._combat.buffTimeRemaining <= 0) {
        this._combat = {
          currentBuff: SpecialBulletType.None,
          buffTimeRemaining: 0,
        };
        return true; // Buff expired
      }
    }
    return false; // Buff not expired
  }

  clearBuff(): void {
    this._combat = {
      currentBuff: SpecialBulletType.None,
      buffTimeRemaining: 0,
    };
  }

  // ============================================
  // Kill counter updaters
  // ============================================

  incrementKills(): void {
    this._kills++;
  }

  consumeKills(amount: number): boolean {
    if (this._kills >= amount) {
      this._kills -= amount;
      return true;
    }
    return false;
  }

  // ============================================
  // Stats updaters
  // ============================================

  incrementEnemiesDefeated(): void {
    this._stats.enemiesDefeated++;
  }

  incrementSpecialBulletsUsed(): void {
    this._stats.specialBulletsUsed++;
  }

  setWavesSurvived(waves: number): void {
    this._stats.wavesSurvived = waves;
  }

  // ============================================
  // Upgrade state updaters (SPEC § 2.3.4)
  // ============================================

  /**
   * Increment stinky tofu damage bonus (加辣)
   */
  incrementStinkyTofuDamage(bonus: number): void {
    this._upgrades = {
      ...this._upgrades,
      stinkyTofuDamageBonus: this._upgrades.stinkyTofuDamageBonus + bonus,
    };
  }

  /**
   * Increment bubble tea bullet bonus (加椰果)
   */
  incrementBubbleTeaBullets(bonus: number): void {
    this._upgrades = {
      ...this._upgrades,
      bubbleTeaBulletBonus: this._upgrades.bubbleTeaBulletBonus + bonus,
    };
  }

  /**
   * Increment blood cake range bonus (加香菜)
   */
  incrementBloodCakeRange(bonus: number): void {
    this._upgrades = {
      ...this._upgrades,
      bloodCakeRangeBonus: this._upgrades.bloodCakeRangeBonus + bonus,
    };
  }

  /**
   * Increment recipe cost reduction (打折)
   */
  incrementRecipeCostReduction(reduction: number): void {
    this._upgrades = {
      ...this._upgrades,
      recipeCostReduction: this._upgrades.recipeCostReduction + reduction,
    };
  }

  /**
   * Increment magazine capacity (大胃王)
   */
  incrementMagazineCapacity(bonus: number): void {
    this._upgrades = {
      ...this._upgrades,
      magazineMultiplier: this._upgrades.magazineMultiplier + bonus,
    };
  }

  /**
   * Increment kill threshold divisor (快吃)
   */
  incrementKillThresholdDivisor(bonus: number): void {
    this._upgrades = {
      ...this._upgrades,
      killThresholdDivisor: this._upgrades.killThresholdDivisor + bonus,
    };
  }

  /**
   * Increment buff duration multiplier (飢餓三十)
   */
  incrementBuffDuration(bonus: number): void {
    this._upgrades = {
      ...this._upgrades,
      buffDurationMultiplier: this._upgrades.buffDurationMultiplier + bonus,
    };
  }

  /**
   * Increment reload time reduction (好餓好餓)
   */
  incrementReloadTimeReduction(reduction: number): void {
    this._upgrades = {
      ...this._upgrades,
      reloadTimeReduction: this._upgrades.reloadTimeReduction + reduction,
    };
  }

  /**
   * Multiply night market chain multiplier (總匯吃到飽)
   */
  multiplyNightMarketChain(multiplier: number): void {
    this._upgrades = {
      ...this._upgrades,
      nightMarketChainMultiplier:
        this._upgrades.nightMarketChainMultiplier * multiplier,
    };
  }

  /**
   * Increment night market decay reduction (總匯吃到飽)
   */
  incrementNightMarketDecayReduction(reduction: number): void {
    this._upgrades = {
      ...this._upgrades,
      nightMarketDecayReduction:
        this._upgrades.nightMarketDecayReduction + reduction,
    };
  }

  // ============================================
  // Booth state management (SPEC § 2.3.1)
  // ============================================

  /**
   * Initialize three booths with default state
   * Should be called once at game start
   */
  initializeBooths(): void {
    this._booths = new Map([
      [BoothId.Tofu, { foodType: FoodType.Tofu, count: 0, maxCapacity: 6 }],
      [BoothId.Pearl, { foodType: FoodType.Pearl, count: 0, maxCapacity: 6 }],
      [
        BoothId.BloodCake,
        { foodType: FoodType.BloodCake, count: 0, maxCapacity: 6 },
      ],
    ]);
  }

  /**
   * Store food in appropriate booth (based on food type)
   * Returns true if successful, false if booth is full
   */
  storeFood(foodType: FoodType): boolean {
    for (const [_id, booth] of this._booths) {
      if (booth.foodType === foodType && booth.count < booth.maxCapacity) {
        booth.count++;
        return true;
      }
    }
    return false;
  }

  /**
   * Consume food from specific booth
   * Returns true if successful, false if insufficient food
   */
  consumeFood(boothId: BoothId, amount: number): boolean {
    const booth = this._booths.get(boothId);
    if (booth && booth.count >= amount) {
      booth.count -= amount;
      return true;
    }
    return false;
  }

  /**
   * Steal one food from booth (enemy action)
   * Returns true if successful, false if booth is empty
   */
  stealFood(boothId: BoothId): boolean {
    const booth = this._booths.get(boothId);
    if (booth && booth.count > 0) {
      booth.count--;
      return true;
    }
    return false;
  }

  /**
   * Get food count for specific booth
   */
  getBoothFoodCount(boothId: BoothId): number {
    return this._booths.get(boothId)?.count ?? 0;
  }

  /**
   * Get total food count across all booths
   */
  getBoothTotalFoodCount(): number {
    let total = 0;
    for (const booth of this._booths.values()) {
      total += booth.count;
    }
    return total;
  }

  /**
   * Reset all booths to empty state
   */
  resetBooths(): void {
    for (const booth of this._booths.values()) {
      booth.count = 0;
    }
  }

  // ============================================
  // Reset for new game
  // ============================================

  reset(): void {
    this._screen = ScreenState.START;
    this._wave = createInitialWaveState();
    this._waveSpawn = createInitialWaveSpawnState();
    this._combat = createInitialCombatState();
    this._kills = 0;
    this._stats = createGameStats();
    this._upgrades = createDefaultUpgradeState();
    this.resetBooths();
  }
}
