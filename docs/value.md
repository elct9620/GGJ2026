# Value Objects Specification

本文件定義遊戲中使用的值物件（Value Objects）的完整規格。

# 1. Vector

## 1.1 Purpose

提供不可變的 2D 座標表示，用於處理遊戲中的位置計算、方向計算和距離計算。

## 1.2 Design Decisions

| 決策                    | 理由                                           |
| ----------------------- | ---------------------------------------------- |
| **不可變（Immutable）** | 防止意外修改，支援函數式編程風格，避免副作用   |
| **整數座標**            | 像素對齊渲染，避免浮點數精度問題               |
| **零向量正規化**        | 返回 (0, 0) 而非拋出錯誤，優雅降級處理邊界情況 |

## 1.3 Properties

```typescript
class Vector {
  public readonly x: number;
  public readonly y: number;
}
```

| 屬性 | 型別     | 說明             |
| ---- | -------- | ---------------- |
| `x`  | `number` | X 軸座標（整數） |
| `y`  | `number` | Y 軸座標（整數） |

## 1.4 Operations

### 1.4.1 add

**用途**：向量加法，用於位置偏移計算

**簽章**：

```typescript
add(other: Vector): Vector
```

**行為**：

```
result.x = this.x + other.x
result.y = this.y + other.y
```

**範例**：

```typescript
const position = new Vector(100, 200);
const velocity = new Vector(10, -5);
const newPosition = position.add(velocity); // Vector(110, 195)
```

**邊界情況**：

- 結果超出整數範圍：返回 JavaScript 最大安全整數範圍內的值
- `other` 為 null/undefined：拋出 TypeError

### 1.4.2 subtract

**用途**：向量減法，用於計算相對位置和方向

**簽章**：

```typescript
subtract(other: Vector): Vector
```

**行為**：

```
result.x = this.x - other.x
result.y = this.y - other.y
```

**範例**：

```typescript
const playerPos = new Vector(500, 400);
const enemyPos = new Vector(300, 300);
const direction = enemyPos.subtract(playerPos); // Vector(-200, -100)
```

**邊界情況**：

- 結果超出整數範圍：返回 JavaScript 最大安全整數範圍內的值
- `other` 為 null/undefined：拋出 TypeError

### 1.4.3 multiply

**用途**：純量乘法，用於縮放向量長度

**簽章**：

```typescript
multiply(scalar: number): Vector
```

**行為**：

```
result.x = Math.round(this.x * scalar)
result.y = Math.round(this.y * scalar)
```

**範例**：

```typescript
const velocity = new Vector(10, 5);
const doubleVelocity = velocity.multiply(2); // Vector(20, 10)
const halfVelocity = velocity.multiply(0.5); // Vector(5, 3)  // 四捨五入
```

**邊界情況**：

- `scalar` 為 0：返回 Vector(0, 0)
- `scalar` 為負數：返回反向向量
- `scalar` 為 NaN：拋出 TypeError
- `scalar` 為 Infinity：拋出 RangeError
- 結果需四捨五入至最接近的整數

### 1.4.4 normalize

**用途**：正規化向量（單位向量），用於方向表示

**簽章**：

```typescript
normalize(): Vector
```

**行為**：

```
magnitude = sqrt(x² + y²)
if (magnitude === 0) return Vector(0, 0)
result.x = Math.round(x / magnitude)
result.y = Math.round(y / magnitude)
```

**範例**：

```typescript
const velocity = new Vector(3, 4);
const direction = velocity.normalize(); // Vector(1, 1)  // 四捨五入後

const zeroVector = new Vector(0, 0);
const normalized = zeroVector.normalize(); // Vector(0, 0)  // 優雅降級
```

**邊界情況**：

- 零向量 (0, 0)：返回 Vector(0, 0)（不拋出錯誤）
- 結果需四捨五入至最接近的整數

### 1.4.5 magnitude

**用途**：計算向量長度（模），用於距離判斷

**簽章**：

```typescript
magnitude(): number
```

**行為**：

```
result = sqrt(x² + y²)
```

**範例**：

```typescript
const distance = new Vector(3, 4);
const length = distance.magnitude(); // 5

const zeroVector = new Vector(0, 0);
const zeroLength = zeroVector.magnitude(); // 0
```

**邊界情況**：

- 零向量 (0, 0)：返回 0
- 結果為浮點數（不進行四捨五入）

### 1.4.6 distance

**用途**：計算兩個向量之間的歐幾里得距離

**簽章**：

```typescript
distance(other: Vector): number
```

**行為**：

```
dx = this.x - other.x
dy = this.y - other.y
result = sqrt(dx² + dy²)
```

**範例**：

```typescript
const player = new Vector(100, 100);
const enemy = new Vector(104, 103);
const dist = player.distance(enemy); // 5
```

**邊界情況**：

- `other` 為 null/undefined：拋出 TypeError
- 兩向量相同：返回 0
- 結果為浮點數（不進行四捨五入）

### 1.4.7 dot

**用途**：點積運算，用於計算向量夾角和投影

**簽章**：

```typescript
dot(other: Vector): number
```

**行為**：

```
result = this.x * other.x + this.y * other.y
```

**範例**：

```typescript
const a = new Vector(2, 3);
const b = new Vector(4, 5);
const dotProduct = a.dot(b); // 8 + 15 = 23

// 用途：判斷方向是否一致
const forward = new Vector(1, 0);
const velocity = new Vector(5, 0);
const isSameDirection = forward.dot(velocity) > 0; // true
```

**邊界情況**：

- `other` 為 null/undefined：拋出 TypeError
- 兩向量垂直：返回 0
- 兩向量反向：返回負數

## 1.5 Common Use Cases

### 1.5.1 子彈追蹤敵人

```typescript
// 計算從子彈到敵人的方向
const bulletPos = new Vector(500, 400);
const enemyPos = new Vector(700, 300);

const direction = enemyPos.subtract(bulletPos); // Vector(200, -100)
const normalizedDirection = direction.normalize(); // Vector(1, 0)  // 四捨五入
const velocity = normalizedDirection.multiply(400); // 400 px/s
```

### 1.5.2 碰撞檢測距離判斷

```typescript
const player = new Vector(500, 500);
const food = new Vector(510, 505);

const dist = player.distance(food); // ~11.18
const collisionRange = 24; // 玩家碰撞箱

if (dist <= collisionRange) {
  // 拾取食材
}
```

### 1.5.3 散射子彈模式

```typescript
const bulletOrigin = new Vector(500, 400);
const baseDirection = new Vector(1, 0); // 向右

// 生成 10 個散射方向
const spreadAngles = [-40, -30, -20, -10, 0, 10, 20, 30, 40]; // 度數
const bullets = spreadAngles.map((angle) => {
  const radians = (angle * Math.PI) / 180;
  const direction = new Vector(
    Math.round(Math.cos(radians)),
    Math.round(Math.sin(radians)),
  );
  return {
    position: bulletOrigin,
    velocity: direction.multiply(400),
  };
});
```

## 1.6 Error Handling

| 錯誤情境              | 處理方式                                                |
| --------------------- | ------------------------------------------------------- |
| 參數為 null/undefined | 拋出 `TypeError: Parameter cannot be null or undefined` |
| 參數為 NaN            | 拋出 `TypeError: Parameter must be a finite number`     |
| 參數為 Infinity       | 拋出 `RangeError: Parameter must be finite`             |
| 座標值非數字          | 拋出 `TypeError: Coordinates must be numbers`           |
| 零向量正規化          | 返回 Vector(0, 0)（不拋出錯誤）                         |

## 1.7 Implementation Notes

**型別定義**：

```typescript
class Vector {
  public readonly x: number;
  public readonly y: number;

  constructor(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new TypeError("Coordinates must be finite numbers");
    }
    this.x = Math.round(x);
    this.y = Math.round(y);
  }

  add(other: Vector): Vector;
  subtract(other: Vector): Vector;
  multiply(scalar: number): Vector;
  normalize(): Vector;
  magnitude(): number;
  distance(other: Vector): number;
  dot(other: Vector): number;
}
```

**測試覆蓋**：

- 每個操作至少 4 個測試案例
- 覆蓋正常情況、邊界情況、錯誤情況
- 總測試案例：32 個單元測試 + 3 個整合測試

**效能考量**：

- 所有操作時間複雜度 O(1)
- 不使用額外記憶體分配（除返回新 Vector 實例）
- 適合在每幀執行大量計算（60 FPS 目標）
