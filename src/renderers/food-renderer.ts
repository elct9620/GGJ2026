/**
 * Food Renderer
 * Handles all Pixi.js rendering for food items
 * SPEC § 2.3.1: Food visual representation
 *
 * Separates rendering logic from Food entity to follow
 * the architecture pattern described in docs/architecture.md
 */
import { Graphics } from "pixi.js";
import { FoodType } from "../core/types";
import { BaseRenderer, type VisualState } from "./base-renderer";

/**
 * Food state required for rendering
 * Pure data interface - no Pixi.js dependencies
 */
export interface FoodState extends VisualState {
  type: FoodType;
}

/**
 * Food Renderer - Pure rendering logic for food items
 * Separates Pixi.js rendering from food entity logic
 */
export class FoodRenderer extends BaseRenderer<FoodState, Graphics> {
  /**
   * Create food graphics based on food type
   * Visual shapes follow original Food entity design:
   * - Pearl: White circle (珍珠)
   * - Tofu: Orange square (豆腐)
   * - BloodCake: Dark red diamond (米血)
   */
  protected createVisual(food: FoodState): Graphics {
    const graphics = new Graphics();

    switch (food.type) {
      case FoodType.Pearl:
        // Small white circle for pearl (珍珠)
        graphics.circle(0, 0, 6);
        graphics.fill(0xecf0f1); // White/gray
        break;

      case FoodType.Tofu:
        // Small beige square for tofu (豆腐)
        graphics.rect(-6, -6, 12, 12);
        graphics.fill(0xf39c12); // Orange/beige
        break;

      case FoodType.BloodCake:
        // Small dark red diamond for blood cake (米血)
        graphics.moveTo(0, -8);
        graphics.lineTo(8, 0);
        graphics.lineTo(0, 8);
        graphics.lineTo(-8, 0);
        graphics.lineTo(0, -8);
        graphics.fill(0xc0392b); // Dark red
        break;
    }

    return graphics;
  }
}
