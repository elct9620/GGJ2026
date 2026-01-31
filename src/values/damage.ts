import { BULLET_CONFIG } from "../config";

/**
 * Damage - 不可變的傷害值物件
 *
 * 封裝傷害計算邏輯，支援：
 * - 基礎傷害值
 * - 百分比傷害（Boss 戰等）
 * - 傷害加成（Buff / Upgrade）
 */
export class Damage {
  public readonly value: number;

  constructor(value: number) {
    if (!Number.isFinite(value)) {
      throw new TypeError("Damage must be a finite number");
    }
    if (value < 0) {
      throw new RangeError("Damage must be non-negative");
    }
    this.value = Math.round(value);
  }

  /**
   * 建立普通子彈傷害
   * SPEC § 2.6.3: 普通子彈傷害
   */
  static normal(): Damage {
    return new Damage(BULLET_CONFIG.normalDamage);
  }

  /**
   * 從百分比計算傷害值
   * @param currentHP 當前血量
   * @param percentage 百分比（0-1）
   */
  static fromPercentage(currentHP: number, percentage: number): Damage {
    if (!Number.isFinite(currentHP) || !Number.isFinite(percentage)) {
      throw new TypeError("Parameters must be finite numbers");
    }
    if (currentHP < 0) {
      throw new RangeError("Current HP must be non-negative");
    }
    if (percentage < 0 || percentage > 1) {
      throw new RangeError("Percentage must be between 0 and 1");
    }
    return new Damage(Math.ceil(currentHP * percentage));
  }

  /**
   * 乘以倍率（用於 Buff / Upgrade）
   * @param scalar 倍率
   */
  multiply(scalar: number): Damage {
    if (!Number.isFinite(scalar)) {
      throw new TypeError("Scalar must be a finite number");
    }
    if (scalar < 0) {
      throw new RangeError("Scalar must be non-negative");
    }
    return new Damage(this.value * scalar);
  }

  /**
   * 加上固定傷害加成
   * @param bonus 加成值
   */
  withBonus(bonus: number): Damage {
    if (!Number.isFinite(bonus)) {
      throw new TypeError("Bonus must be a finite number");
    }
    // 允許負數加成（減傷），但結果不能為負
    const newValue = Math.max(0, this.value + bonus);
    return new Damage(newValue);
  }

  /**
   * 轉換為數字（向後相容）
   */
  toNumber(): number {
    return this.value;
  }

  /**
   * 檢查是否為零傷害
   */
  isZero(): boolean {
    return this.value === 0;
  }
}
