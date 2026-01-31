# Game Systems Implementation Guide

本文件提供每個遊戲系統的詳細實作指南，補充 [SPEC.md](../SPEC.md) § 2.9 System Architecture 的規格定義。

## 目錄

1. [Input System](#1-input-system)
2. [Player System](#2-player-system)
3. [Combat System](#3-combat-system)
4. [Enemy System](#4-enemy-system)
5. [Bullet System](#5-bullet-system)
6. [Collision System](#6-collision-system)
7. [Booth System](#7-booth-system)
8. [Synthesis System](#8-synthesis-system)
9. [Wave System](#9-wave-system)
10. [Cleanup System](#10-cleanup-system)

---

## 1. Input System

### Purpose

讀取鍵盤輸入，更新 `GameState.input`。

### Implementation

**讀取鍵盤狀態**：

```typescript
class InputSystem implements System {
  process(gameState: GameState): void {
    // 讀取鍵盤狀態並更新 gameState.input.keys
    gameState.input.keys.w = isKeyPressed("KeyW");
    gameState.input.keys.a = isKeyPressed("KeyA");
    gameState.input.keys.s = isKeyPressed("KeyS");
    gameState.input.keys.d = isKeyPressed("KeyD");
    gameState.input.keys.space = isKeyPressed("Space");
    gameState.input.keys.digit1 = isKeyPressed("Digit1");
    gameState.input.keys.digit2 = isKeyPressed("Digit2");
    gameState.input.keys.digit3 = isKeyPressed("Digit3");
  }
}
```

### Dependencies

- **Reads**: 瀏覽器 Keyboard API
- **Writes**: `gameState.input`

### Notes

- 使用 Pixi.js 或原生 `addEventListener('keydown')` / `addEventListener('keyup')` 監聽鍵盤事件
- 應處理鍵盤重複觸發（防止 Space 鍵長按連續射擊）

---

## 2. Player System

### Purpose

處理玩家移動和邊界限制。

### Implementation

**移動邏輯**：

```typescript
class PlayerSystem implements System {
  process(gameState: GameState): void {
    const player = gameState.player;
    const input = gameState.input.keys;
    const speed = 200; // px/s
    const deltaTime = gameState.deltaTime;

    // 計算移動向量
    let dx = 0;
    let dy = 0;
    if (input.w) dy -= speed * deltaTime;
    if (input.s) dy += speed * deltaTime;
    if (input.a) dx -= speed * deltaTime;
    if (input.d) dx += speed * deltaTime;

    // 更新玩家位置
    player.position = player.position.add(new Vector(dx, dy));

    // 邊界限制（遊戲活動區：x ∈ [384, 1920], y ∈ [0, 1080]）
    player.position = new Vector(
      Math.max(384, Math.min(1920, player.position.x)),
      Math.max(0, Math.min(1080, player.position.y)),
    );
  }
}
```

### Dependencies

- **Reads**: `gameState.player`, `gameState.input`, `gameState.deltaTime`
- **Writes**: `gameState.player.position`

### Notes

- 使用 `Vector` 不可變操作（`add`）
- 邊界檢查確保玩家不會離開遊戲區域

---

## 3. Combat System

### Purpose

處理射擊、重裝、子彈生成。

### Implementation

**射擊邏輯**：

```typescript
class CombatSystem implements System {
  private reloadTimer = 0;
  private magazineSize = 6;
  private currentAmmo = 6;

  process(gameState: GameState): void {
    const player = gameState.player;
    const input = gameState.input.keys;
    const deltaTime = gameState.deltaTime;
    const activeBuff = gameState.synthesis.activeBuff;

    // 重裝計時
    if (this.currentAmmo === 0) {
      this.reloadTimer += deltaTime;
      if (this.reloadTimer >= 3) {
        this.currentAmmo = this.magazineSize;
        this.reloadTimer = 0;
      }
      return; // 重裝期間無法射擊
    }

    // 射擊
    if (input.space && this.currentAmmo > 0) {
      this.currentAmmo--;

      // 根據 Buff 產生對應子彈
      if (activeBuff) {
        this.createSpecialBullet(gameState, player.position, activeBuff);
      } else {
        this.createNormalBullet(gameState, player.position);
      }
    }
  }

  private createNormalBullet(gameState: GameState, position: Vector): void {
    const bullet = this.getBulletFromPool(gameState);
    bullet.position = position;
    bullet.velocity = new Vector(400, 0); // 向右飛行
    bullet.damage = 1;
    gameState.bullets.push(bullet);
  }

  private createSpecialBullet(
    gameState: GameState,
    position: Vector,
    type: SpecialBulletType,
  ): void {
    // 根據 type 產生不同特殊子彈（參見 SPEC.md § 2.3.3）
    // 例：珍珠奶茶散射 10 個小子彈
  }
}
```

### Dependencies

- **Reads**: `gameState.player`, `gameState.input`, `gameState.synthesis.activeBuff`, `gameState.deltaTime`
- **Writes**: `gameState.bullets`

### Notes

- 特殊子彈效果參見 SPEC.md § 2.3.3 Synthesis Recipes
- 使用物件池取得子彈實體

---

## 4. Enemy System

### Purpose

處理敵人移動和行為。

### Implementation

**移動邏輯**：

```typescript
class EnemySystem implements System {
  process(gameState: GameState): void {
    const deltaTime = gameState.deltaTime;

    for (const enemy of gameState.enemies) {
      if (!enemy.active) continue;

      // 向左移動
      const speed = enemy.type === "ghost" ? 50 : 30; // Ghost: 50 px/s, Boss: 30 px/s
      enemy.position = enemy.position.add(new Vector(-speed * deltaTime, 0));

      // 到達底線（x = 384）
      if (enemy.position.x <= 384) {
        gameState.player.health--;
        enemy.active = false;
      }
    }
  }
}
```

### Dependencies

- **Reads**: `gameState.enemies`, `gameState.deltaTime`
- **Writes**: `gameState.enemies[].position`, `gameState.player.health`, `gameState.enemies[].active`

### Notes

- 敵人到達底線後設定 `active = false`，等待 Cleanup System 清理
- 敵人偷取食材由 Collision System 處理

---

## 5. Bullet System

### Purpose

處理子彈移動和特殊效果（穿透、追蹤、連鎖）。

### Implementation

**移動邏輯**：

```typescript
class BulletSystem implements System {
  process(gameState: GameState): void {
    const deltaTime = gameState.deltaTime;

    for (const bullet of gameState.bullets) {
      if (!bullet.active) continue;

      // 基本移動
      bullet.position = bullet.position.add(
        bullet.velocity.multiply(deltaTime),
      );

      // 追蹤邏輯（豬血糕系列）
      if (bullet.hasTracking) {
        const target = this.findNearestEnemy(gameState, bullet.position);
        if (target) {
          const direction = target.position
            .subtract(bullet.position)
            .normalize();
          bullet.velocity = direction.multiply(400); // 追蹤速度
        }
      }

      // 離開畫面
      if (bullet.position.x > 1920 || bullet.position.x < 0) {
        bullet.active = false;
      }
    }
  }

  private findNearestEnemy(
    gameState: GameState,
    position: Vector,
  ): Entity | null {
    // 找到最近的敵人
  }
}
```

### Dependencies

- **Reads**: `gameState.bullets`, `gameState.enemies`, `gameState.deltaTime`
- **Writes**: `gameState.bullets[].position`, `gameState.bullets[].velocity`, `gameState.bullets[].active`

### Notes

- 連鎖子彈（夜市總匯）在 Collision System 中處理
- 穿透子彈不會在碰撞後設定 `active = false`

---

## 6. Collision System

### Purpose

檢測碰撞並觸發對應事件。

### Implementation

**AABB 碰撞檢測**：

```typescript
class CollisionSystem implements System {
  process(gameState: GameState): void {
    // 子彈 vs 敵人
    for (const bullet of gameState.bullets) {
      if (!bullet.active) continue;
      for (const enemy of gameState.enemies) {
        if (!enemy.active) continue;
        if (this.checkAABB(bullet, enemy)) {
          enemy.health -= bullet.damage;
          if (!bullet.isPenetrating) bullet.active = false;

          if (enemy.health <= 0) {
            this.dropFood(gameState, enemy.position);
            enemy.active = false;
          }
        }
      }
    }

    // 玩家 vs 食材
    for (const food of gameState.foods) {
      if (!food.active) continue;
      if (this.checkAABB(gameState.player, food)) {
        food.active = false;
        // Booth System 會處理食材儲存
      }
    }

    // 敵人 vs 攤位
    for (const enemy of gameState.enemies) {
      if (!enemy.active) continue;
      for (const booth of gameState.booths) {
        if (this.checkBoothCollision(enemy, booth) && booth.count > 0) {
          booth.count--;
        }
      }
    }
  }

  private checkAABB(a: Entity, b: Entity): boolean {
    // AABB 碰撞檢測實作
  }

  private dropFood(gameState: GameState, position: Vector): void {
    const food = this.getFoodFromPool(gameState);
    food.position = position;
    food.type = this.randomFoodType(); // 'pearl' | 'tofu' | 'blood-cake'
    gameState.foods.push(food);
  }
}
```

### Dependencies

- **Reads**: `gameState.bullets`, `gameState.enemies`, `gameState.player`, `gameState.foods`, `gameState.booths`
- **Writes**: `gameState.enemies[].health`, `gameState.bullets[].active`, `gameState.enemies[].active`, `gameState.foods`, `gameState.booths[].count`

### Notes

- AABB 碰撞檢測：檢查兩個矩形是否重疊
- 食材掉落率 100%，類型隨機

---

## 7. Booth System

### Purpose

處理食材儲存和提取。

### Implementation

**儲存與提取邏輯**：

```typescript
class BoothSystem implements System {
  private booths: Map<number, Booth> = new Map();

  // 儲存食材（自動收集後觸發）
  public storeFood(foodType: FoodType): boolean {
    for (const [id, booth] of this.booths) {
      if (booth.foodType === foodType) {
        const success = booth.addFood();
        if (success && this.eventQueue) {
          this.eventQueue.publish(EventType.FoodStored, {
            boothId: String(id),
            foodType,
          });
        }
        return success;
      }
    }
    return false;
  }

  // 提取食材（供 Synthesis System 呼叫）
  public retrieveFood(boothNumber: number): FoodType | null {
    const booth = this.booths.get(boothNumber);
    if (booth && booth.removeFood()) {
      if (this.eventQueue) {
        this.eventQueue.publish(EventType.FoodConsumed, {
          boothId: String(boothNumber),
          amount: 1,
        });
      }
      return booth.foodType;
    }
    return null;
  }

  private findBoothByType(
    gameState: GameState,
    type: string,
  ): BoothState | null {
    return gameState.booths.find((b) => b.type === type) || null;
  }
}
```

### Dependencies

- **Reads**: `gameState.foods`, `gameState.booths`, `gameState.input`
- **Writes**: `gameState.booths[].count`

### Notes

- 攤位滿時（6/6）無法儲存食材（食材遺失）
- Booth ID 使用 1-indexed（1=Pearl, 2=Tofu, 3=BloodCake）
- 透過 EventQueue 發布 FoodStored/FoodConsumed 事件

---

## 8. Synthesis System

### Purpose

處理按鍵觸發合成和 Buff 計時。

### Implementation

**按鍵觸發合成邏輯**（SPEC § 2.3.3）：

```typescript
class SynthesisSystem implements System {
  // 5 種合成配方對應按鍵 1-5
  private recipes: Map<number, Recipe> = new Map([
    [1, { key: 1, name: "NightMarket", ingredients: [Pearl, Tofu, BloodCake] }],
    [2, { key: 2, name: "StinkyTofu", ingredients: [Tofu, Tofu, Tofu] }],
    [3, { key: 3, name: "BubbleTea", ingredients: [Pearl, Pearl, Pearl] }],
    [
      4,
      {
        key: 4,
        name: "BloodCake",
        ingredients: [BloodCake, BloodCake, BloodCake],
      },
    ],
    [5, { key: 5, name: "OysterOmelette", ingredients: [Pearl, Tofu, Tofu] }], // 需解鎖
  ]);

  process(gameState: GameState): void {
    const synthesis = gameState.synthesis;
    const deltaTime = gameState.deltaTime;

    // Buff 計時
    if (synthesis.activeBuff) {
      synthesis.buffTimeRemaining -= deltaTime;
      if (synthesis.buffTimeRemaining <= 0) {
        synthesis.activeBuff = null;
        synthesis.buffTimeRemaining = 0;
      }
    }
  }

  // 按鍵觸發合成（由 Input System 呼叫）
  public trySynthesize(recipeKey: number): boolean {
    const recipe = this.recipes.get(recipeKey);
    if (!recipe) return false;

    // 檢查食材是否足夠
    if (!this.hasIngredients(recipe.ingredients)) {
      return false;
    }

    // 消耗食材
    this.consumeIngredients(recipe.ingredients);

    // 啟動 Buff
    this.activeBuff = recipe.bulletType;
    this.buffTimeRemaining = 2; // 2 秒

    // 發布合成事件
    this.eventQueue.publish(EventType.SynthesisTriggered, {
      recipeKey,
      recipeName: recipe.name,
    });

    return true;
  }
}
```

### Dependencies

- **Reads**: `gameState.synthesis`, `gameState.deltaTime`, `gameState.booths`
- **Writes**: `gameState.synthesis.activeBuff`, `gameState.synthesis.buffTimeRemaining`, `gameState.booths[].count`

### Notes

- 合成配方參見 SPEC.md § 2.3.3 Synthesis Recipes
- 按鍵 1-5 直接觸發對應配方合成
- 蚵仔煎（按鍵 5）需擊殺 10 隻敵人後解鎖
- Buff 持續時間：2 秒（受升級系統影響）

---

## 9. Wave System

### Purpose

處理敵人生成和回合進程。

### Implementation

**回合管理邏輯**：

```typescript
class WaveSystem implements System {
  process(gameState: GameState): void {
    const wave = gameState.wave;

    // 更新剩餘敵人數量
    wave.remainingEnemies = gameState.enemies.filter((e) => e.active).length;

    // 回合結束條件
    if (wave.remainingEnemies === 0 && !wave.isUpgrading) {
      wave.isUpgrading = true;
      this.showUpgradeOptions(gameState);
      return;
    }

    // 升級完成，進入下一回合
    if (wave.isUpgrading && this.isUpgradeComplete(gameState)) {
      wave.isUpgrading = false;
      wave.currentWave++;
      this.spawnEnemies(gameState);
    }
  }

  private spawnEnemies(gameState: GameState): void {
    const wave = gameState.wave.currentWave;
    const ghostCount = wave * 2;
    const hasBoss = wave % 5 === 0;

    // 生成一般敵人
    for (let i = 0; i < ghostCount; i++) {
      const ghost = this.getEnemyFromPool(gameState, "ghost");
      ghost.position = new Vector(1920 + i * 50, Math.random() * 1080);
      gameState.enemies.push(ghost);
    }

    // 生成 Boss
    if (hasBoss) {
      const boss = this.getEnemyFromPool(gameState, "boss");
      boss.position = new Vector(1920, 540);
      gameState.enemies.push(boss);
    }
  }

  private showUpgradeOptions(gameState: GameState): void {
    // 顯示升級選項 UI（此處省略）
  }

  private isUpgradeComplete(gameState: GameState): boolean {
    // 檢查玩家是否已選擇升級（此處省略）
    return true;
  }
}
```

### Dependencies

- **Reads**: `gameState.enemies`, `gameState.wave`
- **Writes**: `gameState.wave.remainingEnemies`, `gameState.wave.currentWave`, `gameState.wave.isUpgrading`, `gameState.enemies`

### Notes

- 敵人數量公式：回合數 × 2
- Boss 每 5 回合出現一次
- 升級系統細節需進一步定義

---

## 10. Cleanup System

### Purpose

清理停用實體，返回物件池。

### Implementation

**清理邏輯**：

```typescript
class CleanupSystem implements System {
  process(gameState: GameState): void {
    // 清理子彈
    gameState.bullets = gameState.bullets.filter((b) => b.active);

    // 清理敵人
    gameState.enemies = gameState.enemies.filter((e) => e.active);

    // 清理食材
    gameState.foods = gameState.foods.filter((f) => f.active);
  }
}
```

### Dependencies

- **Reads**: `gameState.bullets`, `gameState.enemies`, `gameState.foods`
- **Writes**: `gameState.bullets`, `gameState.enemies`, `gameState.foods`

### Notes

- 簡化版：直接過濾 `active = true` 的實體
- 完整版：應將停用實體返回物件池以供重用

---

## System Execution Flow

每幀執行順序：

```
Input System (讀取輸入)
    ↓
Player System (玩家移動)
    ↓
Combat System (射擊)
    ↓
Enemy System (敵人移動)
    ↓
Bullet System (子彈移動)
    ↓
Collision System (碰撞檢測)
    ↓
Booth System (食材管理)
    ↓
Synthesis System (合成邏輯)
    ↓
Wave System (回合管理)
    ↓
Cleanup System (清理)
```

## Dependencies Graph

```
Input System
    ↓ (writes: input)
Player System (reads: input, player)
    ↓ (writes: player.position)
Combat System (reads: input, player, synthesis.activeBuff)
    ↓ (writes: bullets)
Enemy System (reads: enemies)
    ↓ (writes: enemies[].position, player.health)
Bullet System (reads: bullets, enemies)
    ↓ (writes: bullets[].position)
Collision System (reads: bullets, enemies, player, foods, booths)
    ↓ (writes: enemies[].health, bullets[].active, foods, booths[].count)
Booth System (reads: foods, booths, input)
    ↓ (writes: booths[].count)
Synthesis System (reads: synthesis, booths)
    ↓ (writes: synthesis.activeBuff, booths[].count)
Wave System (reads: enemies, wave)
    ↓ (writes: wave.*, enemies)
Cleanup System (reads: bullets, enemies, foods)
    ↓ (writes: bullets, enemies, foods)
```

## Extension Guide

### Adding a New System

1. **定義系統職責**：確保系統只負責單一領域
2. **實作 System 介面**：

```typescript
class MyNewSystem implements System {
  process(gameState: GameState): void {
    // 實作邏輯
  }
}
```

3. **確定執行順序**：決定系統應在哪個階段執行
4. **註冊系統**：將系統加入 `SystemManager` 的執行列表

### Example: Adding a Score System

```typescript
class ScoreSystem implements System {
  process(gameState: GameState): void {
    // 計算分數：擊敗敵人 +10 分，合成特殊子彈 +5 分
    for (const enemy of gameState.enemies) {
      if (!enemy.active && enemy.justKilled) {
        gameState.score += 10;
        enemy.justKilled = false;
      }
    }
  }
}
```

執行順序：Collision System 之後（確保敵人被標記為已擊殺）

---

## Testing Strategy

每個系統應有對應的單元測試，測試案例參見 [testing.md](testing.md)。

**測試重點**:

- 系統輸入（GameState）→ 系統輸出（GameState 變更）
- 邊界條件（空列表、滿容量、邊界位置）
- 錯誤處理（null GameState、未初始化狀態）

**範例**:

```typescript
test("PlayerSystem: moves player based on input", () => {
  const gameState = createTestGameState();
  gameState.input.keys.d = true;
  gameState.deltaTime = 0.1; // 100ms

  const playerSystem = new PlayerSystem();
  playerSystem.process(gameState);

  expect(gameState.player.position.x).toBe(384 + 200 * 0.1); // 384 + 20 = 404
});
```

---

## Performance Considerations

1. **避免每幀建立物件**：使用物件池重用實體
2. **減少不必要的迭代**：只處理 `active = true` 的實體
3. **優化碰撞檢測**：使用空間分區（Spatial Partitioning）減少檢測次數
4. **延遲刪除**：設定 `active = false` 而非立即刪除，由 Cleanup System 統一處理

---

## References

- [SPEC.md](../SPEC.md) - 完整遊戲規格
- [testing.md](testing.md) - 測試規格
- [value.md](value.md) - 值物件（Vector）規格
