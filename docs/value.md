# Value Objects Specification

本文件定義遊戲中使用的值物件（Value Objects）的完整規格。

## 設計原則

Value Objects 遵循以下原則：

1. **不可變性 (Immutable)**：所有屬性皆為 `readonly`，操作返回新實例
2. **相等性由值決定**：相同值的兩個實例應視為相等
3. **無副作用**：方法不改變內部狀態，只返回新值
4. **自我驗證**：建構時驗證輸入，確保物件始終有效

## Value Objects 總覽

| Value Object      | 檔案                           | 用途                                |
| ----------------- | ------------------------------ | ----------------------------------- |
| Vector            | `src/values/vector.ts`         | 不可變 2D 座標/方向                 |
| CollisionBox      | `src/values/collision.ts`      | 碰撞箱尺寸介面                      |
| Damage            | `src/values/damage.ts`         | 傷害值封裝                          |
| Health            | `src/values/health.ts`         | 血量管理（current/max）             |
| Ammo              | `src/values/ammo.ts`           | 彈藥管理（current/max）             |
| Recipe            | `src/values/recipes.ts`        | 食譜配方定義                        |
| SpecialBulletType | `src/values/special-bullet.ts` | 特殊子彈類型（Discriminated Union） |

## Barrel Export

使用 `src/values/index.ts` 統一匯入：

```typescript
import { Damage, Health, Ammo, Vector } from "../values";
```

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

# 2. Damage

## 2.1 Purpose

封裝傷害計算邏輯，支援基礎傷害、百分比傷害和傷害加成。

## 2.2 Properties

```typescript
class Damage {
  public readonly value: number;
}
```

| 屬性    | 型別     | 說明               |
| ------- | -------- | ------------------ |
| `value` | `number` | 傷害值（非負整數） |

## 2.3 Factory Methods

### 2.3.1 normal

**用途**：建立普通子彈傷害（1 點）

**簽章**：

```typescript
static normal(): Damage
```

**範例**：

```typescript
const damage = Damage.normal(); // value = 1
```

### 2.3.2 fromPercentage

**用途**：從百分比計算傷害值

**簽章**：

```typescript
static fromPercentage(currentHP: number, percentage: number): Damage
```

**範例**：

```typescript
const damage = Damage.fromPercentage(100, 0.2); // value = 20 (20% of 100)
const rounded = Damage.fromPercentage(10, 0.33); // value = 4 (ceil of 3.3)
```

**邊界情況**：

- `percentage` 必須在 0-1 之間
- 結果使用 `Math.ceil` 無條件進位

## 2.4 Operations

### 2.4.1 multiply

**用途**：傷害倍率（Buff/Upgrade）

**簽章**：

```typescript
multiply(scalar: number): Damage
```

**範例**：

```typescript
const base = Damage.normal();
const doubled = base.multiply(2); // value = 2
```

### 2.4.2 withBonus

**用途**：固定傷害加成

**簽章**：

```typescript
withBonus(bonus: number): Damage
```

**範例**：

```typescript
const base = Damage.normal();
const buffed = base.withBonus(3); // value = 4
const reduced = base.withBonus(-2); // value = 0 (clamped)
```

### 2.4.3 toNumber

**用途**：轉換為數字（向後相容）

**簽章**：

```typescript
toNumber(): number
```

### 2.4.4 isZero

**用途**：檢查是否為零傷害

**簽章**：

```typescript
isZero(): boolean
```

## 2.5 Common Use Cases

```typescript
// 子彈傷害計算
const baseDamage = Damage.normal();
const buffedDamage = baseDamage.multiply(2).withBonus(1); // 3 點傷害

// 百分比傷害
const percentDamage = Damage.fromPercentage(100, 0.2); // 20 點傷害
```

# 3. Health

## 3.1 Purpose

封裝血量管理邏輯，整合 Damage 進行傷害計算，支援 current/max 追蹤。

## 3.2 Properties

```typescript
class Health {
  public readonly current: number;
  public readonly max: number;
}
```

| 屬性      | 型別     | 說明     |
| --------- | -------- | -------- |
| `current` | `number` | 當前血量 |
| `max`     | `number` | 最大血量 |

## 3.3 Factory Methods

### 3.3.1 player

**用途**：建立玩家預設血量（5/5）

**簽章**：

```typescript
static player(): Health
```

### 3.3.2 ghost

**用途**：建立餓鬼預設血量（1/1）

**簽章**：

```typescript
static ghost(): Health
```

### 3.3.3 boss

**用途**：建立餓死鬼（Boss）預設血量（3/3）

**簽章**：

```typescript
static boss(): Health
```

### 3.3.4 full

**用途**：建立滿血狀態

**簽章**：

```typescript
static full(maxHealth: number): Health
```

## 3.4 Operations

### 3.4.1 takeDamage

**用途**：受到傷害（使用 Damage Value Object）

**簽章**：

```typescript
takeDamage(damage: Damage): Health
```

**範例**：

```typescript
const ghost = Health.ghost();
const bullet = Damage.normal();
const afterHit = ghost.takeDamage(bullet); // 0/1, isDead() = true
```

### 3.4.2 takeDamageAmount

**用途**：受到數值傷害（向後相容）

**簽章**：

```typescript
takeDamageAmount(amount: number): Health
```

### 3.4.3 heal

**用途**：恢復血量

**簽章**：

```typescript
heal(amount: number): Health
```

### 3.4.4 isDead

**用途**：檢查是否死亡（血量歸零）

**簽章**：

```typescript
isDead(): boolean
```

### 3.4.5 isFull

**用途**：檢查是否滿血

**簽章**：

```typescript
isFull(): boolean
```

### 3.4.6 percentage

**用途**：取得血量百分比（0-1），用於 Boss 血條顯示

**簽章**：

```typescript
percentage(): number
```

### 3.4.7 setMax

**用途**：設定新的最大血量（按比例調整當前血量）

**簽章**：

```typescript
setMax(newMax: number): Health
```

## 3.5 Common Use Cases

```typescript
// Ghost 被一發擊殺
const ghost = Health.ghost();
const bullet = Damage.normal();
const dead = ghost.takeDamage(bullet);
console.log(dead.isDead()); // true

// Boss 血條顯示
const boss = Health.boss();
const afterHit = boss.takeDamage(Damage.normal());
console.log(afterHit.percentage()); // 0.667 (2/3)
```

# 4. Ammo

## 4.1 Purpose

封裝彈藥管理邏輯，支援 current/max 追蹤、射擊消耗和重裝。

## 4.2 Properties

```typescript
class Ammo {
  public readonly current: number;
  public readonly max: number;
}
```

| 屬性      | 型別     | 說明     |
| --------- | -------- | -------- |
| `current` | `number` | 當前彈藥 |
| `max`     | `number` | 最大彈藥 |

## 4.3 Factory Methods

### 4.3.1 default

**用途**：建立玩家預設彈夾（6/6）

**簽章**：

```typescript
static default(): Ammo
```

### 4.3.2 full

**用途**：建立滿彈夾

**簽章**：

```typescript
static full(maxAmmo: number): Ammo
```

## 4.4 Operations

### 4.4.1 consume

**用途**：消耗一發子彈

**簽章**：

```typescript
consume(): Ammo
```

### 4.4.2 consumeMultiple

**用途**：消耗指定數量子彈

**簽章**：

```typescript
consumeMultiple(amount: number): Ammo
```

### 4.4.3 reload

**用途**：重裝彈夾（填滿）

**簽章**：

```typescript
reload(): Ammo
```

### 4.4.4 setMax

**用途**：設定新的最大彈藥數

**簽章**：

```typescript
setMax(newMax: number): Ammo
```

### 4.4.5 addMaxBonus

**用途**：增加最大彈藥數（用於升級堆疊）

**簽章**：

```typescript
addMaxBonus(bonus: number): Ammo
```

### 4.4.6 isEmpty

**用途**：檢查是否空彈

**簽章**：

```typescript
isEmpty(): boolean
```

### 4.4.7 canShoot

**用途**：檢查是否可射擊

**簽章**：

```typescript
canShoot(): boolean
```

### 4.4.8 isFull

**用途**：檢查是否滿彈

**簽章**：

```typescript
isFull(): boolean
```

## 4.5 Common Use Cases

```typescript
// 射擊與重裝
let ammo = Ammo.default();
for (let i = 0; i < 6; i++) {
  ammo = ammo.consume();
}
console.log(ammo.isEmpty()); // true
ammo = ammo.reload();
console.log(ammo.isFull()); // true

// 大胃王升級
let upgraded = Ammo.default().addMaxBonus(2); // 6/8
upgraded = upgraded.reload(); // 8/8
```

# 5. Entity 整合模式

Value Objects 整合到 Entity 時採用向後相容模式：

```typescript
export class Player extends Entity {
  // Value Object (private)
  private _health: Health = Health.player();
  private _ammo: Ammo = Ammo.default();

  // 向後相容 getter/setter
  public get health(): number {
    return this._health.current;
  }

  public set health(value: number) {
    this._health = new Health(value, this._health.max);
  }

  // Value Object accessor（新程式碼使用）
  public get healthVO(): Health {
    return this._health;
  }

  // 使用 Value Object 方法
  public takeDamage(amount: number = 1): void {
    this._health = this._health.takeDamageAmount(amount);
    if (this._health.isDead()) {
      this.active = false;
    }
  }
}
```

## 5.1 已整合的實體

| Entity | Value Objects |
| ------ | ------------- |
| Player | Health, Ammo  |
| Enemy  | Health        |
| Bullet | Damage        |
