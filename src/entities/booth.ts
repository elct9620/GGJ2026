import { Entity } from "./entity";
import { Vector } from "../values/vector";
import type { CollisionBox } from "../values/collision";
import { Graphics } from "pixi.js";
import { FoodType } from "../core/types";

// Re-export for backwards compatibility
export { FoodType, BoothId, getBoothIdForFood } from "../core/types";

/**
 * Food item dropped by enemies
 * Spec: § 2.3.1 Booth System - Food Types
 */
export class Food extends Entity {
  public position: Vector;
  public readonly type: FoodType;
  public sprite: Graphics;

  // 統一碰撞大小
  private readonly size = 16;

  constructor(type: FoodType, initialPosition: Vector) {
    super();
    this.type = type;
    this.position = initialPosition;
    this.sprite = this.createSprite();
  }

  private createSprite(): Graphics {
    const sprite = new Graphics();

    // Draw different shapes for different food types (prototype visualization)
    switch (this.type) {
      case FoodType.Pearl:
        // Small white circle for pearl (珍珠)
        sprite.circle(0, 0, 6);
        sprite.fill(0xecf0f1); // White/gray
        break;

      case FoodType.Tofu:
        // Small beige square for tofu (豆腐)
        sprite.rect(-6, -6, 12, 12);
        sprite.fill(0xf39c12); // Orange/beige
        break;

      case FoodType.BloodCake:
        // Small dark red diamond for blood cake (米血)
        sprite.moveTo(0, -8);
        sprite.lineTo(8, 0);
        sprite.lineTo(0, 8);
        sprite.lineTo(-8, 0);
        sprite.lineTo(0, -8);
        sprite.fill(0xc0392b); // Dark red
        break;
    }

    return sprite;
  }

  /**
   * Update sprite position to match entity position
   */
  private updateSpritePosition(): void {
    this.sprite.position.set(this.position.x, this.position.y);
  }

  /**
   * 碰撞箱（統一大小 16×16 px）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    return { width: this.size, height: this.size };
  }

  /**
   * Reset food state for object pool reuse
   */
  public reset(_type: FoodType, position: Vector): void {
    this.active = true;
    // Note: Cannot change readonly type after construction
    // This would need to be handled by creating separate pools per type
    this.position = position;
    this.updateSpritePosition();
  }
}
