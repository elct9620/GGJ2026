/**
 * Player Renderer
 * Handles all Pixi.js rendering for player
 * SPEC § 2.6.1: Player visual representation
 *
 * Separates rendering logic from Player entity to follow
 * the architecture pattern described in docs/architecture.md
 */
import { Container, Sprite } from "pixi.js";
import { getTexture } from "../core/assets";
import { SpecialBulletType } from "../core/types";
import { bulletData } from "../data";
import { LAYOUT } from "../utils/constants";

/**
 * Player state required for rendering
 * Pure data interface - no Pixi.js dependencies
 */
export interface PlayerState {
  position: { x: number; y: number };
  activeBuff: SpecialBulletType;
}

/**
 * Player Renderer - Pure rendering logic for player
 * Separates Pixi.js rendering from player entity logic
 */
export class PlayerRenderer {
  private container: Container;
  private playerSprite: Sprite;
  private dirHintSprite: Sprite;
  private currentBuff: SpecialBulletType = SpecialBulletType.None;

  constructor() {
    this.container = new Container();
    this.playerSprite = this.createPlayerSprite();
    this.dirHintSprite = this.createDirHintSprite();

    this.container.addChild(this.playerSprite);
    this.container.addChild(this.dirHintSprite);
  }

  private createPlayerSprite(): Sprite {
    const assetKey = bulletData.getPlayerAssetForBuff(SpecialBulletType.None);
    const sprite = new Sprite(getTexture(assetKey));

    // Asset size is 256×256, use full size per SPEC § 2.7.2
    sprite.width = LAYOUT.PLAYER_SIZE;
    sprite.height = LAYOUT.PLAYER_SIZE;

    // Set anchor to center for proper positioning
    sprite.anchor.set(0.5, 0.5);

    return sprite;
  }

  private createDirHintSprite(): Sprite {
    const assetKey = bulletData.getDirHintAssetForBuff(SpecialBulletType.None);
    const sprite = new Sprite(getTexture(assetKey));

    // Asset size is 100×256, use full size proportional to player
    sprite.width = 100;
    sprite.height = 256;

    // Position to the right of player
    sprite.anchor.set(0, 0.5);
    sprite.position.set(this.playerSprite.width / 2, 0);

    return sprite;
  }

  /**
   * Sync visual state with player data
   * Updates position and buff appearance
   * @param state Player state to render
   */
  sync(state: PlayerState): void {
    // Update position
    this.container.position.set(state.position.x, state.position.y);

    // Update appearance if buff changed
    if (state.activeBuff !== this.currentBuff) {
      this.updateAppearanceForBuff(state.activeBuff);
      this.currentBuff = state.activeBuff;
    }
  }

  /**
   * Update player appearance based on active buff
   * SPEC § 2.6.1: Player visual changes based on buff state
   * Uses BulletData for centralized property lookup
   */
  private updateAppearanceForBuff(buffType: SpecialBulletType): void {
    const playerAssetKey = bulletData.getPlayerAssetForBuff(buffType);
    this.playerSprite.texture = getTexture(playerAssetKey);

    const dirHintAssetKey = bulletData.getDirHintAssetForBuff(buffType);
    this.dirHintSprite.texture = getTexture(dirHintAssetKey);
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
  }
}
