/**
 * Game State Management
 * Spec: § 2.4.2 User Journey, § 2.8.2 Defeat Condition
 */

export const GameState = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER",
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

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
