/**
 * Player Renderer
 * Handles all Pixi.js rendering for player
 * SPEC § 2.6.1: Player visual representation
 * SPEC § 2.7.4: Player Floating Info (health icons + ammo progress bar)
 *
 * Separates rendering logic from Player entity to follow
 * the architecture pattern described in docs/architecture.md
 */
import { Container, Sprite, Graphics } from "pixi.js";
import { getTexture } from "../core/assets";
import { SpecialBulletType } from "../core/types";
import { bulletData } from "../data";
import { LAYOUT } from "../utils/constants";
import { PLAYER_CONFIG } from "../config";

/**
 * Player state required for rendering
 * Pure data interface - no Pixi.js dependencies
 * Extended with health and ammo info for SPEC § 2.7.4
 */
export interface PlayerState {
  position: { x: number; y: number };
  activeBuff: SpecialBulletType;
  health: { current: number; max: number };
  ammo: { current: number; max: number };
  isReloading: boolean;
  reloadProgress: number; // 0-1, percentage of reload complete
}

/**
 * Floating Info layout constants
 * SPEC § 2.7.4: Player Floating Info
 */
const FLOATING_INFO = {
  // Health icons
  HEART_SIZE: 20,
  HEART_GAP: 4,
  HEART_OFFSET_Y: 140, // Distance below player center
  HEART_FILLED_COLOR: 0xe74c3c,
  HEART_EMPTY_COLOR: 0x666666,

  // Ammo progress bar
  AMMO_BAR_WIDTH: 80,
  AMMO_BAR_HEIGHT: 8,
  AMMO_BAR_OFFSET_Y: 140, // Distance below direction hint center
  AMMO_BAR_BG_COLOR: 0x333333,
  AMMO_BAR_FILL_COLOR: 0xf1c40f,
  AMMO_BAR_RELOAD_COLOR: 0x3498db,
} as const;

/**
 * Player Renderer - Pure rendering logic for player
 * Separates Pixi.js rendering from player entity logic
 */
export class PlayerRenderer {
  private container: Container;
  private playerSprite: Sprite;
  private dirHintSprite: Sprite;
  private currentBuff: SpecialBulletType = SpecialBulletType.None;

  // Floating info elements (SPEC § 2.7.4)
  private healthContainer: Container;
  private heartGraphics: Graphics[] = [];
  private ammoBarContainer: Container;
  private ammoBarBackground: Graphics;
  private ammoBarFill: Graphics;

  // State tracking for optimization
  private lastHealthCurrent: number = -1;
  private lastAmmoCurrent: number = -1;
  private lastAmmoMax: number = -1;
  private lastReloadProgress: number = -1;
  private lastIsReloading: boolean = false;

  constructor() {
    this.container = new Container();
    this.playerSprite = this.createPlayerSprite();
    this.dirHintSprite = this.createDirHintSprite();

    // Create floating info elements
    this.healthContainer = this.createHealthContainer();
    this.ammoBarContainer = new Container();
    this.ammoBarBackground = this.createAmmoBarBackground();
    this.ammoBarFill = this.createAmmoBarFill();

    this.ammoBarContainer.addChild(this.ammoBarBackground);
    this.ammoBarContainer.addChild(this.ammoBarFill);

    // Position ammo bar below direction hint
    this.ammoBarContainer.position.set(
      this.dirHintSprite.position.x + 50, // Center of dirHint (100px width / 2)
      FLOATING_INFO.AMMO_BAR_OFFSET_Y,
    );

    this.container.addChild(this.playerSprite);
    this.container.addChild(this.dirHintSprite);
    this.container.addChild(this.healthContainer);
    this.container.addChild(this.ammoBarContainer);
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
   * Create health icons container
   * SPEC § 2.7.4: 5 heart icons below player
   */
  private createHealthContainer(): Container {
    const container = new Container();
    const maxHealth = PLAYER_CONFIG.maxHealth;
    const totalWidth =
      maxHealth * FLOATING_INFO.HEART_SIZE +
      (maxHealth - 1) * FLOATING_INFO.HEART_GAP;
    const startX = -totalWidth / 2;

    for (let i = 0; i < maxHealth; i++) {
      const heart = new Graphics();
      this.drawHeart(heart, FLOATING_INFO.HEART_FILLED_COLOR);
      heart.position.set(
        startX + i * (FLOATING_INFO.HEART_SIZE + FLOATING_INFO.HEART_GAP),
        0,
      );
      this.heartGraphics.push(heart);
      container.addChild(heart);
    }

    // Position below player sprite
    container.position.set(0, FLOATING_INFO.HEART_OFFSET_Y);

    return container;
  }

  /**
   * Draw a heart shape on a Graphics object
   * Uses bezier curves to create heart shape
   */
  private drawHeart(graphics: Graphics, color: number): void {
    const size = FLOATING_INFO.HEART_SIZE;
    const halfSize = size / 2;

    graphics.clear();
    graphics.fill({ color });

    // Draw heart shape using bezier curves
    // Start at bottom point
    graphics.moveTo(halfSize, size * 0.85);

    // Left curve to top-left bump
    graphics.bezierCurveTo(
      halfSize * 0.1,
      size * 0.6,
      0,
      size * 0.3,
      halfSize * 0.5,
      size * 0.1,
    );

    // Top-left bump to center top
    graphics.bezierCurveTo(
      halfSize * 0.8,
      0,
      halfSize,
      size * 0.1,
      halfSize,
      size * 0.25,
    );

    // Center top to top-right bump
    graphics.bezierCurveTo(
      halfSize,
      size * 0.1,
      halfSize * 1.2,
      0,
      halfSize * 1.5,
      size * 0.1,
    );

    // Top-right bump to right curve
    graphics.bezierCurveTo(
      size,
      size * 0.3,
      size * 0.9,
      size * 0.6,
      halfSize,
      size * 0.85,
    );

    graphics.fill();
  }

  /**
   * Create ammo bar background
   */
  private createAmmoBarBackground(): Graphics {
    const graphics = new Graphics();
    graphics.roundRect(
      -FLOATING_INFO.AMMO_BAR_WIDTH / 2,
      -FLOATING_INFO.AMMO_BAR_HEIGHT / 2,
      FLOATING_INFO.AMMO_BAR_WIDTH,
      FLOATING_INFO.AMMO_BAR_HEIGHT,
      3,
    );
    graphics.fill({ color: FLOATING_INFO.AMMO_BAR_BG_COLOR });
    return graphics;
  }

  /**
   * Create ammo bar fill (will be updated dynamically)
   */
  private createAmmoBarFill(): Graphics {
    const graphics = new Graphics();
    return graphics;
  }

  /**
   * Sync visual state with player data
   * Updates position, buff appearance, health, and ammo
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

    // Update health display (only if changed)
    if (state.health.current !== this.lastHealthCurrent) {
      this.updateHealthDisplay(state.health.current, state.health.max);
      this.lastHealthCurrent = state.health.current;
    }

    // Update ammo bar (only if changed)
    const ammoChanged =
      state.ammo.current !== this.lastAmmoCurrent ||
      state.ammo.max !== this.lastAmmoMax ||
      state.isReloading !== this.lastIsReloading ||
      (state.isReloading && state.reloadProgress !== this.lastReloadProgress);

    if (ammoChanged) {
      this.updateAmmoBar(state);
      this.lastAmmoCurrent = state.ammo.current;
      this.lastAmmoMax = state.ammo.max;
      this.lastIsReloading = state.isReloading;
      this.lastReloadProgress = state.reloadProgress;
    }
  }

  /**
   * Update health display icons
   * SPEC § 2.7.4: Filled hearts for current health, empty for lost
   */
  private updateHealthDisplay(current: number, _max: number): void {
    for (let i = 0; i < this.heartGraphics.length; i++) {
      const isFilled = i < current;
      const color = isFilled
        ? FLOATING_INFO.HEART_FILLED_COLOR
        : FLOATING_INFO.HEART_EMPTY_COLOR;
      this.drawHeart(this.heartGraphics[i], color);
    }
  }

  /**
   * Update ammo progress bar
   * SPEC § 2.7.4: Progress = current / max, with reload animation
   */
  private updateAmmoBar(state: PlayerState): void {
    this.ammoBarFill.clear();

    const width = FLOATING_INFO.AMMO_BAR_WIDTH;
    const height = FLOATING_INFO.AMMO_BAR_HEIGHT;

    let fillRatio: number;
    let fillColor: number;

    if (state.isReloading) {
      // During reload: show reload progress with blue color
      fillRatio = state.reloadProgress;
      fillColor = FLOATING_INFO.AMMO_BAR_RELOAD_COLOR;
    } else {
      // Normal: show ammo ratio with yellow color
      fillRatio = state.ammo.max > 0 ? state.ammo.current / state.ammo.max : 0;
      fillColor = FLOATING_INFO.AMMO_BAR_FILL_COLOR;
    }

    const fillWidth = Math.max(0, Math.min(1, fillRatio)) * width;

    if (fillWidth > 0) {
      this.ammoBarFill.roundRect(-width / 2, -height / 2, fillWidth, height, 3);
      this.ammoBarFill.fill({ color: fillColor });
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
