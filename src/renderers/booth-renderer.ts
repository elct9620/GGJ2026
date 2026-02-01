/**
 * Booth Renderer
 * Handles all Pixi.js rendering for booth visualization
 * SPEC § 2.3.1: Booth System visual representation
 */
import { Container, Sprite, Text } from "pixi.js";
import { BoothId, FoodType } from "../core/types";
import type { BoothState } from "../core/game-state";
import { getTexture, AssetKeys, GAME_FONT_FAMILY } from "../core/assets";
import { LAYOUT } from "../utils/constants";

/**
 * Booth visual element references
 */
interface BoothVisuals {
  sprite: Sprite;
  countText: Text;
  nameText: Text;
}

/**
 * Map booth ID to asset key for DropItemPool sprite
 * SPEC § 2.3.1: Booth color matches Elite enemy color
 * - Tofu (Booth 1) = Red (RedGhost drops Tofu) → DropItemPool_0.png
 * - Pearl (Booth 2) = Green (GreenGhost drops Pearl) → DropItemPool_2.png
 * - BloodCake (Booth 3) = Blue (BlueGhost drops BloodCake) → DropItemPool_1.png
 */
function getBoothAssetKey(boothId: BoothId): keyof typeof AssetKeys {
  switch (boothId) {
    case BoothId.Tofu:
      return "boothPool0"; // Red
    case BoothId.Pearl:
      return "boothPool2"; // Green
    case BoothId.BloodCake:
      return "boothPool1"; // Blue
    default:
      return "boothPool0";
  }
}

/**
 * Get display name for food type
 */
function getFoodDisplayName(foodType: FoodType): string {
  switch (foodType) {
    case FoodType.Pearl:
      return "珍珠 (1)";
    case FoodType.Tofu:
      return "豆腐 (2)";
    case FoodType.BloodCake:
      return "米血 (3)";
  }
}

/**
 * Booth Renderer - Pure rendering logic for booths
 * Separates Pixi.js rendering from booth logic (state management in GameState)
 */
export class BoothRenderer {
  private container: Container;
  private backgroundSprite: Sprite | null = null;
  private boothVisuals: Map<BoothId, BoothVisuals> = new Map();

  constructor() {
    this.container = new Container();
    this.initializeBackground();
    this.initializeBoothVisuals();
  }

  /**
   * Initialize stalls background sprite
   * SPEC § 2.7.2: 340×868 positioned at (0, 86)
   */
  private initializeBackground(): void {
    this.backgroundSprite = new Sprite(getTexture(AssetKeys.stalls));
    this.backgroundSprite.position.set(0, LAYOUT.GAME_AREA_Y);
    this.backgroundSprite.width = LAYOUT.BOOTH_AREA_WIDTH;
    this.backgroundSprite.height = LAYOUT.BOOTH_AREA_HEIGHT;
    this.container.addChild(this.backgroundSprite);
  }

  /**
   * Initialize visual elements for all three booths
   */
  private initializeBoothVisuals(): void {
    const boothHeight = LAYOUT.BOOTH_HEIGHT;
    const boothGap = LAYOUT.BOOTH_GAP;
    const startX = LAYOUT.BASELINE_X + boothGap; // 340 + 11 = 351
    const startY = LAYOUT.GAME_AREA_Y + LAYOUT.BOOTH_TOP_MARGIN; // 86 + 129 = 215

    // Initialize in order: Tofu, Pearl, BloodCake
    this.createBoothVisual(BoothId.Tofu, FoodType.Tofu, startX, startY);
    this.createBoothVisual(
      BoothId.Pearl,
      FoodType.Pearl,
      startX,
      startY + boothHeight + boothGap,
    );
    this.createBoothVisual(
      BoothId.BloodCake,
      FoodType.BloodCake,
      startX,
      startY + (boothHeight + boothGap) * 2,
    );
  }

  /**
   * Create visual elements for a single booth
   */
  private createBoothVisual(
    boothId: BoothId,
    foodType: FoodType,
    x: number,
    y: number,
  ): void {
    // Create sprite
    const assetKey = getBoothAssetKey(boothId);
    const sprite = new Sprite(getTexture(AssetKeys[assetKey]));
    sprite.position.set(x, y);
    sprite.width = LAYOUT.BOOTH_WIDTH;
    sprite.height = LAYOUT.BOOTH_HEIGHT;

    // Create count text
    const countText = new Text({
      text: "0/6",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 24,
        fill: 0xffffff,
      },
    });

    // Create name text
    const nameText = new Text({
      text: getFoodDisplayName(foodType),
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 18,
        fill: 0xffffff,
      },
    });

    // Position texts relative to booth sprite
    nameText.position.set(x + 10, y + 10);
    countText.position.set(x + 10, y + 220);

    // Add to container
    this.container.addChild(sprite);
    this.container.addChild(countText);
    this.container.addChild(nameText);

    // Store references
    this.boothVisuals.set(boothId, { sprite, countText, nameText });
  }

  /**
   * Sync visual state with booth data
   * Call this after booth state changes to update the UI
   */
  sync(booths: ReadonlyMap<BoothId, BoothState>): void {
    for (const [boothId, state] of booths) {
      const visuals = this.boothVisuals.get(boothId);
      if (visuals) {
        visuals.countText.text = `${state.count}/${state.maxCapacity}`;
      }
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
    this.container.destroy({ children: true });
    this.boothVisuals.clear();
  }
}
