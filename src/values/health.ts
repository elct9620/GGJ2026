import { Damage } from "./damage";
import { PLAYER_CONFIG, ENEMY_CONFIG } from "../config";

/**
 * Health - 不可變的血量值物件
 *
 * 封裝血量管理邏輯，支援：
 * - 當前/最大血量追蹤
 * - 傷害計算（與 Damage 整合）
 * - 血量百分比（Boss 血條顯示）
 */
export class Health {
  public readonly current: number;
  public readonly max: number;

  constructor(current: number, max: number) {
    if (!Number.isFinite(current) || !Number.isFinite(max)) {
      throw new TypeError("Health values must be finite numbers");
    }
    if (max <= 0) {
      throw new RangeError("Max health must be positive");
    }
    if (current < 0) {
      throw new RangeError("Current health must be non-negative");
    }
    this.max = Math.round(max);
    this.current = Math.min(Math.round(current), this.max);
  }

  /**
   * 建立玩家預設血量
   * SPEC § 2.6.1: 玩家血量
   */
  static player(): Health {
    return new Health(PLAYER_CONFIG.maxHealth, PLAYER_CONFIG.maxHealth);
  }

  /**
   * 建立餓鬼預設血量
   * SPEC § 2.6.2: 餓鬼血量
   */
  static ghost(): Health {
    return new Health(ENEMY_CONFIG.ghost.health, ENEMY_CONFIG.ghost.health);
  }

  /**
   * 建立餓死鬼（Boss）預設血量
   * SPEC § 2.6.2: 餓死鬼血量
   */
  static boss(): Health {
    return new Health(ENEMY_CONFIG.boss.health, ENEMY_CONFIG.boss.health);
  }

  /**
   * 建立滿血狀態
   * @param maxHealth 最大血量
   */
  static full(maxHealth: number): Health {
    return new Health(maxHealth, maxHealth);
  }

  /**
   * 受到傷害
   * @param damage Damage 值物件
   */
  takeDamage(damage: Damage): Health {
    if (!(damage instanceof Damage)) {
      throw new TypeError("Parameter must be a Damage instance");
    }
    const newCurrent = Math.max(0, this.current - damage.toNumber());
    return new Health(newCurrent, this.max);
  }

  /**
   * 受到數值傷害（向後相容）
   * @param amount 傷害數值
   */
  takeDamageAmount(amount: number): Health {
    if (!Number.isFinite(amount)) {
      throw new TypeError("Damage amount must be a finite number");
    }
    if (amount < 0) {
      throw new RangeError("Damage amount must be non-negative");
    }
    const newCurrent = Math.max(0, this.current - amount);
    return new Health(newCurrent, this.max);
  }

  /**
   * 恢復血量
   * @param amount 恢復數值
   */
  heal(amount: number): Health {
    if (!Number.isFinite(amount)) {
      throw new TypeError("Heal amount must be a finite number");
    }
    if (amount < 0) {
      throw new RangeError("Heal amount must be non-negative");
    }
    // current 在建構子中會自動限制不超過 max
    return new Health(this.current + amount, this.max);
  }

  /**
   * 檢查是否死亡（血量歸零）
   */
  isDead(): boolean {
    return this.current <= 0;
  }

  /**
   * 檢查是否滿血
   */
  isFull(): boolean {
    return this.current >= this.max;
  }

  /**
   * 取得血量百分比（0-1）
   * 用於 Boss 血條顯示
   */
  percentage(): number {
    return this.current / this.max;
  }

  /**
   * 設定新的最大血量（保留當前血量比例）
   * @param newMax 新最大血量
   */
  setMax(newMax: number): Health {
    if (!Number.isFinite(newMax)) {
      throw new TypeError("New max must be a finite number");
    }
    if (newMax <= 0) {
      throw new RangeError("New max must be positive");
    }
    // 按比例調整當前血量
    const ratio = this.current / this.max;
    const newCurrent = Math.round(ratio * newMax);
    return new Health(newCurrent, newMax);
  }
}
