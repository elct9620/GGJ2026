/**
 * Game State Management
 * Spec: § 2.4.2 User Journey, § 2.8.2 Defeat Condition
 */

import { SpecialBulletType } from "../values/special-bullet";

// Screen state enum (renamed to avoid conflict with class)
export const ScreenState = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
} as const;

export type ScreenState = (typeof ScreenState)[keyof typeof ScreenState];

/**
 * @deprecated Use ScreenState instead
 */
export const GameState = ScreenState;
/**
 * @deprecated Use ScreenState instead
 */
export type GameState = ScreenState;

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

/**
 * Centralized game state interface
 */
export interface GameStateInterface {
  // Screen state
  screen: ScreenState;

  // Wave state
  wave: WaveState;

  // Combat state
  combat: CombatState;

  // Kill counter
  kills: number;

  // Statistics
  stats: GameStats;
}

/**
 * @deprecated Use GameStateInterface instead
 */
export type IGameState = GameStateInterface;

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
export class GameStateManager implements GameStateInterface {
  private _screen: ScreenState = ScreenState.START;
  private _wave: WaveState = createInitialWaveState();
  private _combat: CombatState = createInitialCombatState();
  private _kills: number = 0;
  private _stats: GameStats = createGameStats();

  // ============================================
  // Read-only getters
  // ============================================

  get screen(): ScreenState {
    return this._screen;
  }

  get wave(): Readonly<WaveState> {
    return this._wave;
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
  // Reset for new game
  // ============================================

  reset(): void {
    this._screen = ScreenState.START;
    this._wave = createInitialWaveState();
    this._combat = createInitialCombatState();
    this._kills = 0;
    this._stats = createGameStats();
  }
}
