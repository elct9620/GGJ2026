/**
 * Collision Handler Interface
 * SPEC § 2.3.2: Collision detection and damage application
 *
 * Strategy Pattern for handling bullet-enemy collisions based on bullet type.
 */

import type { Bullet } from "../entities/bullet";
import type { Enemy } from "../entities/enemy";
import type { BulletVisualEffectsSystem } from "../systems/bullet-visual-effects";
import type { UpgradeSystem } from "../systems/upgrade";
import type { EventQueue } from "../systems/event-queue";
import type { GameStateManager } from "../core/game-state";
import type { Vector } from "../values/vector";
import type { SpecialBulletType } from "../values/special-bullet";

/**
 * Context provided to collision handlers
 * Contains all dependencies needed for collision processing
 */
export interface CollisionContext {
  /** The bullet involved in the collision */
  bullet: Bullet;
  /** The enemy hit by the bullet */
  enemy: Enemy;
  /** All active enemies (for chain/AOE effects) */
  enemies: Enemy[];
  /** Visual effects system (optional) */
  visualEffects: BulletVisualEffectsSystem | null;
  /** Upgrade system for bonus calculations (optional) */
  upgradeSystem: UpgradeSystem | null;
  /** Event queue for publishing events (optional) */
  eventQueue: EventQueue | null;
  /** Game state manager */
  gameState: GameStateManager;
  /** Callback to apply damage and publish death event */
  applyDamageAndPublishDeath: (enemy: Enemy, damage: number) => void;
  /** Callback to find closest enemy for chain attacks */
  findClosestEnemy: (
    position: Vector,
    excludeIds?: Set<string>,
    maxRange?: number,
  ) => Enemy | null;
}

/**
 * Collision Handler Interface
 * Each bullet type implements its own collision handling logic
 */
export interface CollisionHandler {
  /** The bullet type this handler processes */
  readonly bulletType: SpecialBulletType;

  /**
   * Handle collision between bullet and enemy
   * @param context Collision context with all necessary dependencies
   */
  handle(context: CollisionContext): void;
}
