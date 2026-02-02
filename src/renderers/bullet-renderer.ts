/**
 * Bullet Renderer
 * Handles all Pixi.js rendering for bullets
 * SPEC § 2.6.3: Bullet visual representation
 *
 * Separates rendering logic from Bullet entity to follow
 * the architecture pattern described in docs/architecture.md
 */
import { Graphics } from "pixi.js";
import type { SpecialBulletType } from "../core/types";
import { bulletData } from "../data";
import { BaseRenderer, type VisualState } from "./base-renderer";

/**
 * Bullet state required for rendering
 * Pure data interface - no Pixi.js dependencies
 */
export interface BulletState extends VisualState {
  type: SpecialBulletType;
}

/**
 * Bullet Renderer - Pure rendering logic for bullets
 * Separates Pixi.js rendering from bullet entity logic
 */
export class BulletRenderer extends BaseRenderer<BulletState, Graphics> {
  /**
   * Create bullet graphics based on bullet type
   * Uses BulletData for centralized property lookup
   */
  protected createVisual(bullet: BulletState): Graphics {
    const graphics = new Graphics();
    const color = bulletData.getColor(bullet.type);
    const radius = bulletData.getSize(bullet.type) / 2;

    graphics.circle(0, 0, radius);
    graphics.fill(color);

    return graphics;
  }
}
