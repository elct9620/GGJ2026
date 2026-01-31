/**
 * Combat System
 * SPEC § 2.3.2: 管理玩家射擊、碰撞檢測、特殊子彈 Buff
 */

import type { ISystem } from "../core/systems/system.interface";
import { SystemPriority } from "../core/systems/system.interface";
import type { Player } from "../entities/player";
import type { Bullet } from "../entities/bullet";
import type { Enemy } from "../entities/enemy";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { checkAABBCollision } from "../values/collision";
/**
 * Special bullet types (SPEC § 2.3.3)
 */
export const SpecialBulletType = {
  None: "None", // 普通子彈
  NightMarket: "NightMarket", // 夜市總匯（連鎖閃電）
  StinkyTofu: "StinkyTofu", // 臭豆腐（貫穿）
  BubbleTea: "BubbleTea", // 珍珠奶茶（散射）
  BloodCake: "BloodCake", // 豬血糕（追蹤）
  OysterOmelette: "OysterOmelette", // 蚵仔煎（高傷害）
} as const;

export type SpecialBulletType =
  (typeof SpecialBulletType)[keyof typeof SpecialBulletType];

/**
 * Combat System
 * SPEC § 2.3.2: 玩家透過射擊擊敗敵人
 *
 * Responsibilities:
 * - 射擊冷卻管理
 * - 彈夾重裝管理（3 秒）
 * - 特殊子彈 Buff 管理（2 秒）
 * - 子彈 vs 敵人碰撞檢測
 * - 發佈事件: ReloadComplete, BuffExpired, EnemyDeath
 */
export class CombatSystem implements ISystem {
  public readonly name = "CombatSystem";
  public readonly priority = SystemPriority.COMBAT;

  // References to game entities
  private player: Player | null = null;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private eventQueue: EventQueue | null = null;

  // Shooting cooldown (SPEC § 2.3.2)
  private shootCooldown = 0;
  private readonly shootCooldownTime = 0.2; // 200ms between shots

  // Special bullet buff state (SPEC § 2.3.2)
  private currentBuff: SpecialBulletType = SpecialBulletType.None;
  private buffTimer = 0;
  private readonly buffDuration = 2; // 2 seconds (SPEC § 2.3.2)

  /**
   * Initialize combat system
   */
  public initialize(): void {
    this.shootCooldown = 0;
    this.currentBuff = SpecialBulletType.None;
    this.buffTimer = 0;
  }

  /**
   * Update combat system (每幀呼叫)
   */
  public update(deltaTime: number): void {
    this.updateShootCooldown(deltaTime);
    this.updateBuff(deltaTime);
    this.checkCollisions();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.player = null;
    this.bullets = [];
    this.enemies = [];
    this.eventQueue = null;
  }

  /**
   * Set player reference
   */
  public setPlayer(player: Player): void {
    this.player = player;
  }

  /**
   * Set bullet array reference
   */
  public setBullets(bullets: Bullet[]): void {
    this.bullets = bullets;
  }

  /**
   * Set enemy array reference
   */
  public setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies;
  }

  /**
   * Set EventQueue reference
   */
  public setEventQueue(eventQueue: EventQueue): void {
    this.eventQueue = eventQueue;

    // Subscribe to SynthesisTriggered event (SPEC § 2.3.6)
    this.eventQueue.subscribe(
      EventType.SynthesisTriggered,
      this.onSynthesisTriggered.bind(this),
    );
  }

  /**
   * Attempt to shoot a bullet
   * Returns true if shooting was successful
   */
  public shoot(): boolean {
    if (!this.player || this.shootCooldown > 0) {
      return false;
    }

    // Player.shoot() handles ammo and reload logic
    if (this.player.shoot()) {
      this.shootCooldown = this.shootCooldownTime;

      // Check if reload was triggered (SPEC § 2.3.2)
      if (this.player.isReloading && this.eventQueue) {
        this.eventQueue.publish(EventType.ReloadComplete, {}, 3000);
      }

      return true;
    }

    return false;
  }

  /**
   * Get current special bullet buff type
   */
  public getCurrentBuff(): SpecialBulletType {
    return this.currentBuff;
  }

  /**
   * Get remaining buff time
   */
  public getBuffTimer(): number {
    return this.buffTimer;
  }

  /**
   * Check if buff is active
   */
  public isBuffActive(): boolean {
    return this.currentBuff !== SpecialBulletType.None && this.buffTimer > 0;
  }

  /**
   * Update shooting cooldown
   */
  private updateShootCooldown(deltaTime: number): void {
    this.shootCooldown = Math.max(0, this.shootCooldown - deltaTime);
  }

  /**
   * Update buff timer (SPEC § 2.3.2)
   */
  private updateBuff(deltaTime: number): void {
    if (this.buffTimer > 0) {
      this.buffTimer -= deltaTime;

      if (this.buffTimer <= 0) {
        // Buff expired
        const expiredBuff = this.currentBuff;
        this.currentBuff = SpecialBulletType.None;
        this.buffTimer = 0;

        // Publish BuffExpired event (SPEC § 2.3.6)
        if (this.eventQueue) {
          this.eventQueue.publish(EventType.BuffExpired, {
            buffType: expiredBuff,
          });
        }
      }
    }
  }

  /**
   * Check bullet-enemy collisions (SPEC § 2.3.2, § 4.2.5)
   * 使用 AABB 碰撞檢測
   */
  private checkCollisions(): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      for (const enemy of this.enemies) {
        if (!enemy.active) continue;

        // AABB collision detection (SPEC § 4.2.5)
        if (
          checkAABBCollision(
            bullet.position,
            bullet.collisionBox,
            enemy.position,
            enemy.collisionBox,
          )
        ) {
          // Hit detected
          const died = enemy.takeDamage(bullet.damage);

          if (died) {
            // Publish EnemyDeath event (SPEC § 2.3.6)
            if (this.eventQueue) {
              this.eventQueue.publish(EventType.EnemyDeath, {
                enemyId: enemy.id,
                position: { x: enemy.position.x, y: enemy.position.y },
              });
            }
          }

          // Consume bullet (unless piercing buff active)
          if (this.currentBuff !== SpecialBulletType.StinkyTofu) {
            bullet.active = false;
            break;
          }
        }
      }
    }
  }

  /**
   * Handle SynthesisTriggered event (SPEC § 2.3.6)
   */
  private onSynthesisTriggered(data: { recipeId: string }): void {
    // Prevent buff stacking (SPEC § 2.3.2 Error Scenarios)
    if (this.isBuffActive()) {
      return;
    }

    // Map recipe ID to bullet type
    const buffType = this.mapRecipeToBuffType(data.recipeId);
    if (buffType === SpecialBulletType.None) {
      return;
    }

    // Activate buff
    this.currentBuff = buffType;
    this.buffTimer = this.buffDuration;

    // Publish BuffExpired event with delay (SPEC § 2.3.6)
    if (this.eventQueue) {
      this.eventQueue.publish(
        EventType.BuffExpired,
        { buffType },
        this.buffDuration * 1000,
      );
    }
  }

  /**
   * Map recipe ID (1-5) to buff type (SPEC § 2.3.3)
   */
  private mapRecipeToBuffType(recipeId: string): SpecialBulletType {
    switch (recipeId) {
      case "1":
        return SpecialBulletType.NightMarket;
      case "2":
        return SpecialBulletType.StinkyTofu;
      case "3":
        return SpecialBulletType.BubbleTea;
      case "4":
        return SpecialBulletType.BloodCake;
      case "5":
        return SpecialBulletType.OysterOmelette;
      default:
        return SpecialBulletType.None;
    }
  }
}
