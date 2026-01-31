/**
 * Vector - 不可變的 2D 座標值物件
 *
 * 遵循 SPEC.md § 3.2.1 Vector 規格
 * - 不可變（Immutable）：所有操作返回新 Vector 實例
 * - 整數座標：像素對齊渲染，避免浮點精度問題
 * - 零向量正規化：返回 (0, 0) 而非錯誤，優雅降級
 */
export class Vector {
  public readonly x: number;
  public readonly y: number;

  constructor(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError("Coordinates must be finite numbers");
    }
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  /**
   * 向量加法 - 用於位置偏移計算
   */
  add(other: Vector): Vector {
    if (!(other instanceof Vector)) {
      throw new TypeError("Parameter must be a Vector instance");
    }
    return new Vector(this.x + other.x, this.y + other.y);
  }

  /**
   * 向量減法 - 用於計算相對位置和方向
   */
  subtract(other: Vector): Vector {
    if (!(other instanceof Vector)) {
      throw new TypeError("Parameter must be a Vector instance");
    }
    return new Vector(this.x - other.x, this.y - other.y);
  }

  /**
   * 純量乘法 - 用於縮放向量長度
   */
  multiply(scalar: number): Vector {
    if (!Number.isFinite(scalar)) {
      if (Number.isNaN(scalar)) {
        throw new TypeError("Parameter must be a finite number");
      }
      throw new RangeError("Parameter must be finite");
    }
    return new Vector(Math.round(this.x * scalar), Math.round(this.y * scalar));
  }

  /**
   * 正規化向量（單位向量）- 用於方向表示
   * 零向量正規化返回 (0, 0) 而非拋出錯誤
   */
  normalize(): Vector {
    const mag = this.magnitude();
    if (mag === 0) {
      return new Vector(0, 0); // 優雅降級
    }
    return new Vector(Math.round(this.x / mag), Math.round(this.y / mag));
  }

  /**
   * 計算向量長度（模）- 用於距離判斷
   */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 計算兩個向量之間的歐幾里得距離
   */
  distance(other: Vector): number {
    if (!(other instanceof Vector)) {
      throw new TypeError("Parameter must be a Vector instance");
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 點積運算 - 用於計算向量夾角和投影
   */
  dot(other: Vector): number {
    if (!(other instanceof Vector)) {
      throw new TypeError("Parameter must be a Vector instance");
    }
    return this.x * other.x + this.y * other.y;
  }
}
