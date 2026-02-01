/**
 * Enemy Renderer
 * Handles all Pixi.js rendering for enemies
 * SPEC § 2.6.2: Enemy visual representation
 *
 * Separates rendering logic from Enemy entity to follow
 * the architecture pattern described in docs/architecture.md
 */
import { Container, Graphics, Sprite } from "pixi.js";
import { getTexture } from "../core/assets";
import type { FlashEffect } from "../core/game-state";
import { EnemyType } from "../core/types";
import { enemyData } from "../data";

/**
 * Enemy state required for rendering
 * Pure data interface - no Pixi.js dependencies
 */
export interface EnemyVisualState {
  id: string;
  position: { x: number; y: number };
  type: EnemyType;
  health: { current: number; max: number };
  active: boolean;
}

/**
 * Internal visual representation for each enemy
 */
interface EnemyVisuals {
  container: Container;
  sprite: Sprite;
  healthBar: Graphics | null;
  originalTint: number;
  flashDuration: number;
}

/**
 * Enemy Renderer - Pure rendering logic for enemies
 * Separates Pixi.js rendering from enemy entity logic
 */
export class EnemyRenderer {
  private container: Container;
  private enemyVisuals: Map<string, EnemyVisuals> = new Map();

  constructor() {
    this.container = new Container();
  }

  /**
   * Sync visual state with enemy data
   * Creates, updates, or removes enemy visuals based on current state
   * @param enemies Array of enemy states to render
   * @param flashEffects Map of flash effects from GameStateManager
   * @param deltaTime Delta time for animation updates
   * @returns Array of enemy IDs whose flash effects were consumed (should be cleared from GameState)
   */
  sync(
    enemies: ReadonlyArray<EnemyVisualState>,
    flashEffects: ReadonlyMap<string, FlashEffect>,
    deltaTime: number,
  ): string[] {
    const consumedFlashEffects: string[] = [];
    // Track which enemies are still active
    const activeEnemyIds = new Set<string>();

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      activeEnemyIds.add(enemy.id);

      let visuals = this.enemyVisuals.get(enemy.id);

      if (!visuals) {
        // Create new visuals for this enemy
        visuals = this.createEnemyVisuals(enemy.type);
        this.enemyVisuals.set(enemy.id, visuals);
        this.container.addChild(visuals.container);
      }

      // Update position
      visuals.container.position.set(enemy.position.x, enemy.position.y);

      // Update health bar if applicable
      if (visuals.healthBar && enemyData.shouldShowHealthBar(enemy.type)) {
        this.updateHealthBar(
          visuals.healthBar,
          enemy.health.current,
          enemy.health.max,
          enemy.type,
        );
      }

      // Handle flash effect
      const flashEffect = flashEffects.get(enemy.id);
      if (flashEffect && visuals.flashDuration <= 0) {
        // Start new flash effect
        visuals.sprite.tint = flashEffect.color;
        visuals.flashDuration = flashEffect.duration;
        // Mark this effect as consumed so it can be cleared from GameState
        consumedFlashEffects.push(enemy.id);
      }

      // Update flash duration
      if (visuals.flashDuration > 0) {
        visuals.flashDuration -= deltaTime;
        if (visuals.flashDuration <= 0) {
          // Reset tint when flash ends
          visuals.sprite.tint = visuals.originalTint;
          visuals.flashDuration = 0;
        }
      }
    }

    // Remove visuals for inactive enemies
    for (const [id, visuals] of this.enemyVisuals) {
      if (!activeEnemyIds.has(id)) {
        this.container.removeChild(visuals.container);
        visuals.container.destroy({ children: true });
        this.enemyVisuals.delete(id);
      }
    }

    return consumedFlashEffects;
  }

  /**
   * Create visual elements for an enemy
   */
  private createEnemyVisuals(type: EnemyType): EnemyVisuals {
    const container = new Container();

    // Create sprite
    const props = enemyData.get(type);
    const sprite = new Sprite(getTexture(props.assetKey));
    sprite.width = props.size;
    sprite.height = props.size;
    sprite.anchor.set(0.5, 0.5);
    container.addChild(sprite);

    // Create health bar if needed
    let healthBar: Graphics | null = null;
    if (enemyData.shouldShowHealthBar(type)) {
      healthBar = new Graphics();
      container.addChild(healthBar);
    }

    return {
      container,
      sprite,
      healthBar,
      originalTint: 0xffffff,
      flashDuration: 0,
    };
  }

  /**
   * Update health bar visualization
   */
  private updateHealthBar(
    healthBar: Graphics,
    currentHP: number,
    maxHP: number,
    type: EnemyType,
  ): void {
    healthBar.clear();

    const barWidth = 8;
    const barHeight = 6;
    const barSpacing = 2;
    const totalWidth = maxHP * barWidth + (maxHP - 1) * barSpacing;
    const startX = -totalWidth / 2;
    const spriteHeight = enemyData.getSize(type);
    const startY = -spriteHeight / 2 - 15;

    // Draw health bars (green for remaining health, gray for lost health)
    for (let i = 0; i < maxHP; i++) {
      const x = startX + i * (barWidth + barSpacing);
      healthBar.rect(x, startY, barWidth, barHeight);
      healthBar.fill(i < currentHP ? 0x2ecc71 : 0x7f8c8d);
    }
  }

  /**
   * Get the container for scene integration
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Clean up renderer resources
   */
  destroy(): void {
    for (const visuals of this.enemyVisuals.values()) {
      visuals.container.destroy({ children: true });
    }
    this.enemyVisuals.clear();
    this.container.destroy({ children: true });
  }
}
