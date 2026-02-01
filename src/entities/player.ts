import { SpriteEntity } from "./entity";
import { Vector } from "../values/vector";
import { Health } from "../values/health";
import { Ammo } from "../values/ammo";
import type { CollisionBox } from "../values/collision";
import { Container, Sprite } from "pixi.js";
import { getTexture, AssetKeys, type AssetKey } from "../core/assets";
import { LAYOUT, getEntityBounds } from "../utils/constants";
import { PLAYER_CONFIG } from "../config";
import { SpecialBulletType } from "../values/special-bullet";

/**
 * Player entity with keyboard controls and shooting capability
 * Spec: § 2.6.1 Player
 */
export class Player extends SpriteEntity {
  /**
   * Buff type to player sprite asset key mapping
   * SPEC § 2.6.1: Player appearance changes based on active buff
   */
  private static readonly BUFF_SPRITE_MAP: Record<SpecialBulletType, AssetKey> =
    {
      [SpecialBulletType.None]: AssetKeys.playerBase,
      [SpecialBulletType.NightMarket]: AssetKeys.playerNightMarket,
      [SpecialBulletType.StinkyTofu]: AssetKeys.playerStinkyTofu,
      [SpecialBulletType.BubbleTea]: AssetKeys.playerBubbleTea,
      [SpecialBulletType.BloodCake]: AssetKeys.playerBloodCake,
      [SpecialBulletType.OysterOmelette]: AssetKeys.playerOysterOmelette,
    };
  public position: Vector;
  public readonly speed: number = PLAYER_CONFIG.speed;

  // Value Objects
  private _health: Health = Health.player();
  private _ammo: Ammo = Ammo.default();

  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  private baseReloadTime: number = PLAYER_CONFIG.reloadTime;
  private reloadTimeReduction: number = 0;

  // Read-only health accessor (use takeDamage/heal for modifications)
  public get health(): number {
    return this._health.current;
  }

  public get ammo(): number {
    return this._ammo.current;
  }

  public set ammo(value: number) {
    this._ammo = new Ammo(value, this._ammo.max);
  }

  public get maxAmmo(): number {
    return this._ammo.max;
  }

  /**
   * Get effective reload time after upgrades
   * SPEC § 2.3.4: 好餓好餓升級減少重裝時間
   */
  public get reloadTime(): number {
    return Math.max(0.5, this.baseReloadTime - this.reloadTimeReduction);
  }

  // Value Object accessors
  public get healthVO(): Health {
    return this._health;
  }

  public get ammoVO(): Ammo {
    return this._ammo;
  }

  // Visual representation
  public sprite: Container;
  private playerSprite: Sprite;
  private dirHintSprite: Sprite;

  constructor(initialPosition: Vector) {
    super();
    this.position = initialPosition;

    // Create container to hold player sprite and direction hint
    this.sprite = new Container();
    this.playerSprite = this.createPlayerSprite();
    this.dirHintSprite = this.createDirHintSprite();

    this.sprite.addChild(this.playerSprite);
    this.sprite.addChild(this.dirHintSprite);

    this.updateSpritePosition();
  }

  private createPlayerSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.playerBase));

    // Asset size is 256×256, use full size per SPEC § 2.7.2
    sprite.width = LAYOUT.PLAYER_SIZE;
    sprite.height = LAYOUT.PLAYER_SIZE;

    // Set anchor to center for proper positioning
    sprite.anchor.set(0.5, 0.5);

    return sprite;
  }

  private createDirHintSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.playerDirHint));

    // Asset size is 100×256, use full size proportional to player
    sprite.width = 100;
    sprite.height = 256;

    // Position to the right of player
    sprite.anchor.set(0, 0.5);
    sprite.position.set(this.playerSprite.width / 2, 0);

    return sprite;
  }

  /**
   * Move the player based on input direction
   * Constrains movement within game boundaries (SPEC § 2.7.2)
   * Player position is center-based, so boundaries account for half the player size
   */
  public move(direction: Vector, deltaTime: number): void {
    if (!this.active) return;

    // Calculate displacement based on speed and delta time
    const displacement = direction.normalize().multiply(this.speed * deltaTime);
    const newPosition = this.position.add(displacement);

    // Apply boundary constraints using centralized bounds calculation
    const bounds = getEntityBounds(LAYOUT.PLAYER_SIZE);
    const clampedX = Math.max(
      bounds.minX,
      Math.min(bounds.maxX, newPosition.x),
    );
    const clampedY = Math.max(
      bounds.minY,
      Math.min(bounds.maxY, newPosition.y),
    );

    this.position = new Vector(clampedX, clampedY);
    this.updateSpritePosition();
  }

  /**
   * Attempt to shoot a bullet
   * Returns true if shooting was successful
   */
  public shoot(): boolean {
    if (!this.active || this.isReloading || !this._ammo.canShoot()) {
      return false;
    }

    this._ammo = this._ammo.consume();

    // Auto-reload when ammo reaches zero (SPEC § 2.3.2)
    if (this._ammo.isEmpty()) {
      this.startReload();
    }

    return true;
  }

  /**
   * Start the reload process
   */
  public startReload(): void {
    this.isReloading = true;
    this.reloadTimer = this.reloadTime;
  }

  /**
   * Update reload timer
   */
  public update(deltaTime: number): void {
    if (!this.active) return;

    if (this.isReloading) {
      this.reloadTimer -= deltaTime;

      if (this.reloadTimer <= 0) {
        this._ammo = this._ammo.reload();
        this.isReloading = false;
        this.reloadTimer = 0;
      }
    }

    this.updateSpritePosition();
  }

  /**
   * 碰撞箱（與視覺大小同步）
   * SPEC § 4.2.5: AABB 碰撞檢測
   */
  public get collisionBox(): CollisionBox {
    return { width: LAYOUT.PLAYER_SIZE, height: LAYOUT.PLAYER_SIZE };
  }

  /**
   * Take damage from enemies reaching the baseline
   */
  public takeDamage(amount: number = 1): void {
    this._health = this._health.takeDamageAmount(amount);

    if (this._health.isDead()) {
      this.active = false;
    }
  }

  /**
   * Update magazine capacity (大胃王升級)
   * SPEC § 2.3.4: 增加彈匣容量
   * @param newMax New maximum ammo capacity
   */
  public updateMagazineCapacity(newMax: number): void {
    this._ammo = this._ammo.setMax(newMax);
  }

  /**
   * Set reload time reduction (好餓好餓升級)
   * SPEC § 2.3.4: 減少重裝時間
   * @param reduction Total reduction in seconds
   */
  public setReloadTimeReduction(reduction: number): void {
    this.reloadTimeReduction = reduction;
  }

  /**
   * Update player appearance based on active buff
   * SPEC § 2.6.1: Player visual changes based on buff state
   * @param buffType The current active buff type
   */
  public updateAppearanceForBuff(buffType: SpecialBulletType): void {
    const assetKey = Player.BUFF_SPRITE_MAP[buffType];
    this.playerSprite.texture = getTexture(assetKey);
  }

  /**
   * Reset player state for object pool reuse
   */
  public reset(position: Vector): void {
    this.active = true;
    this.position = position;
    this._health = Health.player();
    this._ammo = Ammo.default();
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadTimeReduction = 0;
    this.updateAppearanceForBuff(SpecialBulletType.None);
    this.updateSpritePosition();
  }
}
