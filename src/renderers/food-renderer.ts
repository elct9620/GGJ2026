/**
 * Food Renderer
 * Handles all Pixi.js rendering for food items
 * SPEC § 2.3.1: Food visual representation
 *
 * Separates rendering logic from Food entity to follow
 * the architecture pattern described in docs/architecture.md
 */
import { Container, Graphics } from "pixi.js";
import { FoodType } from "../core/types";

/**
 * Food state required for rendering
 * Pure data interface - no Pixi.js dependencies
 */
export interface FoodState {
  id: string;
  position: { x: number; y: number };
  type: FoodType;
  active: boolean;
}

/**
 * Food Renderer - Pure rendering logic for food items
 * Separates Pixi.js rendering from food entity logic
 */
export class FoodRenderer {
  private container: Container;
  private foodGraphics: Map<string, Graphics> = new Map();

  constructor() {
    this.container = new Container();
  }

  /**
   * Sync visual state with food data
   * Creates, updates, or removes food graphics based on current state
   * @param foods Array of food states to render
   */
  sync(foods: ReadonlyArray<FoodState>): void {
    // Track which foods are still active
    const activeFoodIds = new Set<string>();

    for (const food of foods) {
      if (!food.active) continue;

      activeFoodIds.add(food.id);

      let graphics = this.foodGraphics.get(food.id);

      if (!graphics) {
        // Create new graphics for this food
        graphics = this.createFoodGraphics(food.type);
        this.foodGraphics.set(food.id, graphics);
        this.container.addChild(graphics);
      }

      // Update position
      graphics.position.set(food.position.x, food.position.y);
    }

    // Remove graphics for inactive foods
    for (const [id, graphics] of this.foodGraphics) {
      if (!activeFoodIds.has(id)) {
        this.container.removeChild(graphics);
        graphics.destroy();
        this.foodGraphics.delete(id);
      }
    }
  }

  /**
   * Create food graphics based on food type
   * Visual shapes follow original Food entity design:
   * - Pearl: White circle (珍珠)
   * - Tofu: Orange square (豆腐)
   * - BloodCake: Dark red diamond (米血)
   */
  private createFoodGraphics(type: FoodType): Graphics {
    const graphics = new Graphics();

    switch (type) {
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
    for (const graphics of this.foodGraphics.values()) {
      graphics.destroy();
    }
    this.foodGraphics.clear();
    this.container.destroy({ children: true });
  }
}
