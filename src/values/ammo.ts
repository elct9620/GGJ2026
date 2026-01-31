import { PLAYER_CONFIG } from "../config";

/**
 * Ammo - 不可變的彈夾值物件
 *
 * 封裝彈藥管理邏輯，支援：
 * - 當前/最大彈藥追蹤
 * - 射擊消耗
 * - 重裝填彈
 * - 大胃王升級（增加彈夾容量）
 */
export class Ammo {
  public readonly current: number;
  public readonly max: number;

  constructor(current: number, max: number) {
    if (!Number.isFinite(current) || !Number.isFinite(max)) {
      throw new TypeError("Ammo values must be finite numbers");
    }
    if (max <= 0) {
      throw new RangeError("Max ammo must be positive");
    }
    if (current < 0) {
      throw new RangeError("Current ammo must be non-negative");
    }
    this.max = Math.round(max);
    this.current = Math.min(Math.round(current), this.max);
  }

  /**
   * 建立玩家預設彈夾
   * SPEC § 2.6.1: 彈夾容量
   */
  static default(): Ammo {
    return new Ammo(
      PLAYER_CONFIG.magazineCapacity,
      PLAYER_CONFIG.magazineCapacity,
    );
  }

  /**
   * 建立滿彈夾
   * @param maxAmmo 最大彈藥數
   */
  static full(maxAmmo: number): Ammo {
    return new Ammo(maxAmmo, maxAmmo);
  }

  /**
   * 消耗一發子彈
   */
  consume(): Ammo {
    const newCurrent = Math.max(0, this.current - 1);
    return new Ammo(newCurrent, this.max);
  }

  /**
   * 消耗指定數量子彈
   * @param amount 消耗數量
   */
  consumeMultiple(amount: number): Ammo {
    if (!Number.isFinite(amount)) {
      throw new TypeError("Amount must be a finite number");
    }
    if (amount < 0) {
      throw new RangeError("Amount must be non-negative");
    }
    const newCurrent = Math.max(0, this.current - Math.round(amount));
    return new Ammo(newCurrent, this.max);
  }

  /**
   * 重裝彈夾（填滿）
   */
  reload(): Ammo {
    return new Ammo(this.max, this.max);
  }

  /**
   * 設定新的最大彈藥數（用於大胃王升級）
   * @param newMax 新最大值
   */
  setMax(newMax: number): Ammo {
    if (!Number.isFinite(newMax)) {
      throw new TypeError("New max must be a finite number");
    }
    if (newMax <= 0) {
      throw new RangeError("New max must be positive");
    }
    // 保留當前彈藥數，但不超過新上限
    return new Ammo(this.current, newMax);
  }

  /**
   * 增加最大彈藥數（用於升級堆疊）
   * @param bonus 增加量
   */
  addMaxBonus(bonus: number): Ammo {
    if (!Number.isFinite(bonus)) {
      throw new TypeError("Bonus must be a finite number");
    }
    const newMax = Math.max(1, this.max + Math.round(bonus));
    return new Ammo(this.current, newMax);
  }

  /**
   * 檢查是否空彈
   */
  isEmpty(): boolean {
    return this.current <= 0;
  }

  /**
   * 檢查是否可射擊
   */
  canShoot(): boolean {
    return this.current > 0;
  }

  /**
   * 檢查是否滿彈
   */
  isFull(): boolean {
    return this.current >= this.max;
  }
}
