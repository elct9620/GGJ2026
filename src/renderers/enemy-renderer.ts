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
import { BaseRenderer, type VisualState } from "./base-renderer";

/**
 * Enemy state required for rendering
 * Pure data interface - no Pixi.js dependencies
 */
export interface EnemyVisualState extends VisualState {
  type: EnemyType;
  health: { current: number; max: number };
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
 * Extends BaseRenderer with additional flash effect handling
 */
export class EnemyRenderer extends BaseRenderer<EnemyVisualState, Container> {
  private enemyVisuals: Map<string, EnemyVisuals> = new Map();

  /**
   * Sync visual state with enemy data
   * Extended from BaseRenderer to handle flash effects
   * @param enemies Array of enemy states to render
   * @param flashEffects Map of flash effects from GameStateManager
   * @param deltaTime Delta time for animation updates
   * @returns Array of enemy IDs whose flash effects were consumed
   */
  syncWithEffects(
    enemies: ReadonlyArray<EnemyVisualState>,
    flashEffects: ReadonlyMap<string, FlashEffect>,
    deltaTime: number,
  ): string[] {
    const consumedFlashEffects: string[] = [];
    const activeIds = new Set<string>();

    for (const enemy of enemies) {
      if (!enemy.active) continue;

      activeIds.add(enemy.id);

      let container = this.visuals.get(enemy.id);
      let visuals = this.enemyVisuals.get(enemy.id);

      if (!container || !visuals) {
        container = this.createVisual(enemy);
        visuals = this.enemyVisuals.get(enemy.id)!;
        this.visuals.set(enemy.id, container);
        this.container.addChild(container);
      }

      // Update position
      container.position.set(enemy.position.x, enemy.position.y);

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
        visuals.sprite.tint = flashEffect.color;
        visuals.flashDuration = flashEffect.duration;
        consumedFlashEffects.push(enemy.id);
      }

      // Update flash duration
      if (visuals.flashDuration > 0) {
        visuals.flashDuration -= deltaTime;
        if (visuals.flashDuration <= 0) {
          visuals.sprite.tint = visuals.originalTint;
          visuals.flashDuration = 0;
        }
      }
    }

    // Remove visuals for inactive enemies
    for (const [id, container] of this.visuals) {
      if (!activeIds.has(id)) {
        this.container.removeChild(container);
        this.destroyVisual(container);
        this.visuals.delete(id);
        this.enemyVisuals.delete(id);
      }
    }

    return consumedFlashEffects;
  }

  /**
   * Create visual elements for an enemy
   */
  protected createVisual(enemy: EnemyVisualState): Container {
    const container = new Container();

    // Create sprite
    const props = enemyData.get(enemy.type);
    const sprite = new Sprite(getTexture(props.assetKey));
    sprite.width = props.size;
    sprite.height = props.size;
    sprite.anchor.set(0.5, 0.5);
    container.addChild(sprite);

    // Create health bar if needed
    let healthBar: Graphics | null = null;
    if (enemyData.shouldShowHealthBar(enemy.type)) {
      healthBar = new Graphics();
      container.addChild(healthBar);
    }

    // Store extended visuals data
    this.enemyVisuals.set(enemy.id, {
      container,
      sprite,
      healthBar,
      originalTint: 0xffffff,
      flashDuration: 0,
    });

    return container;
  }

  /**
   * Destroy visual and clean up extended data
   */
  protected destroyVisual(container: Container): void {
    container.destroy({ children: true });
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
   * Clean up renderer resources
   */
  destroy(): void {
    super.destroy();
    this.enemyVisuals.clear();
  }
}
