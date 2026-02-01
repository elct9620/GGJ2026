/**
 * Bullet Renderer
 * Handles all Pixi.js rendering for bullets
 * SPEC § 2.6.3: Bullet visual representation
 *
 * Separates rendering logic from Bullet entity to follow
 * the architecture pattern described in docs/architecture.md
 */
import { Container, Graphics } from "pixi.js";
import { SpecialBulletType } from "../core/types";
import { bulletData } from "../data";

/**
 * Bullet state required for rendering
 * Pure data interface - no Pixi.js dependencies
 */
export interface BulletState {
  id: string;
  position: { x: number; y: number };
  type: SpecialBulletType;
  active: boolean;
}

/**
 * Bullet Renderer - Pure rendering logic for bullets
 * Separates Pixi.js rendering from bullet entity logic
 */
export class BulletRenderer {
  private container: Container;
  private bulletGraphics: Map<string, Graphics> = new Map();

  constructor() {
    this.container = new Container();
  }

  /**
   * Sync visual state with bullet data
   * Creates, updates, or removes bullet graphics based on current state
   * @param bullets Array of bullet states to render
   */
  sync(bullets: ReadonlyArray<BulletState>): void {
    // Track which bullets are still active
    const activeBulletIds = new Set<string>();

    for (const bullet of bullets) {
      if (!bullet.active) continue;

      activeBulletIds.add(bullet.id);

      let graphics = this.bulletGraphics.get(bullet.id);

      if (!graphics) {
        // Create new graphics for this bullet
        graphics = this.createBulletGraphics(bullet.type);
        this.bulletGraphics.set(bullet.id, graphics);
        this.container.addChild(graphics);
      }

      // Update position
      graphics.position.set(bullet.position.x, bullet.position.y);
    }

    // Remove graphics for inactive bullets
    for (const [id, graphics] of this.bulletGraphics) {
      if (!activeBulletIds.has(id)) {
        this.container.removeChild(graphics);
        graphics.destroy();
        this.bulletGraphics.delete(id);
      }
    }
  }

  /**
   * Create bullet graphics based on bullet type
   * Uses BulletData for centralized property lookup
   */
  private createBulletGraphics(type: SpecialBulletType): Graphics {
    const graphics = new Graphics();
    const color = bulletData.getColor(type);
    const radius = bulletData.getSize(type) / 2;

    graphics.circle(0, 0, radius);
    graphics.fill(color);

    return graphics;
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
    for (const graphics of this.bulletGraphics.values()) {
      graphics.destroy();
    }
    this.bulletGraphics.clear();
    this.container.destroy({ children: true });
  }
}
