# Game Architecture Guide

本文件描述 Night Market Defense 的**目標架構方向**，作為未來重構的指引。

## 1. Overview

### 1.1 設計原則

- **關注點分離**：Input、Logic、Render 三層獨立
- **事件驅動**：系統間透過 EventQueue 鬆耦合通訊
- **無狀態系統**：System 只讀取 GameState，不持有內部狀態
- **資料導向**：Entity 為純資料容器，邏輯由 System 處理

### 1.2 三層架構

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1: Input Layer                                   │
│  ─────────────────                                      │
│  Input 模組產生事件 (e.g. Shoot, Move)                  │
│  只負責讀取輸入，不處理邏輯                             │
└───────────────────────────┬─────────────────────────────┘
                            │ Events
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 2: System Layer (Stateless)                      │
│  ─────────────────────────────────                      │
│  System 處理事件並產生新事件                            │
│  e.g. Shoot → SpawnBullet, MoveBullet                   │
│  系統無內部狀態，只讀取 GameState                       │
└───────────────────────────┬─────────────────────────────┘
                            │ GameState / Entities
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Phase 3: Render Layer (Pixi.js)                        │
│  ───────────────────────────────                        │
│  同步 GameState/Entities 狀態進行繪製                   │
│  - Entity ID 存在 → 更新 Sprite 狀態                    │
│  - Entity ID 不存在 → 清理 Sprite 資源                  │
└─────────────────────────────────────────────────────────┘
```

## 2. Event-Driven Design

### 2.1 EventQueue 作為事件中樞

EventQueue 是系統間通訊的核心，負責：

- **事件發佈**：系統透過 `publish()` 發送事件
- **事件訂閱**：系統透過 `subscribe()` 監聽事件
- **延遲執行**：支援 `delay` 參數實現定時事件

### 2.2 事件流範例

```
Player Input (Space)
    ↓
InputSystem 發佈 ShootRequested 事件
    ↓
CombatSystem 訂閱，檢查彈藥，發佈 BulletFired 事件
    ↓
AudioSystem 訂閱 BulletFired，播放音效
RenderSystem 訂閱 BulletFired，建立 Sprite
```

### 2.3 事件類型設計原則

- **意圖事件**：描述「想要做什麼」（e.g. `ShootRequested`）
- **結果事件**：描述「發生了什麼」（e.g. `BulletFired`, `EnemyDeath`）
- **狀態事件**：描述「狀態變更」（e.g. `WaveStart`, `BuffExpired`）

## 3. System Design (Stateless)

### 3.1 System 介面

```typescript
interface System {
  name: string;
  priority: SystemPriority;
  initialize(): void;
  update(deltaTime: number): void;
  destroy(): void;
}
```

### 3.2 無狀態原則

理想情況下，System 應：

- **只讀取** GameState/Entities 資料
- **只發佈** 事件來觸發狀態變更
- **不持有** 可變的內部狀態

```typescript
// 理想：無狀態的 System
class CombatSystem implements System {
  update(deltaTime: number) {
    // 讀取 GameState
    const bullets = this.gameState.getActiveBullets();
    const enemies = this.gameState.getActiveEnemies();

    // 計算碰撞
    for (const bullet of bullets) {
      for (const enemy of enemies) {
        if (this.checkCollision(bullet, enemy)) {
          // 發佈事件，不直接修改狀態
          this.eventQueue.publish(EventType.EnemyHit, {
            bulletId: bullet.id,
            enemyId: enemy.id,
          });
        }
      }
    }
  }
}
```

### 3.3 狀態管理

集中的 GameState 管理所有遊戲狀態：

```typescript
interface GameState {
  // Entity 集合
  player: Player;
  enemies: Map<string, Enemy>;
  bullets: Map<string, Bullet>;

  // 遊戲狀態
  wave: number;
  score: number;
  booths: Booth[];
}
```

## 4. Render Synchronization

### 4.1 Pixi.js 作為獨立渲染層

Render Layer 的職責：

- **同步** Entity 狀態到 Sprite
- **管理** Sprite 生命週期
- **處理** 視覺特效和動畫

### 4.2 Entity-Sprite 同步機制

```typescript
class RenderSystem {
  private spriteMap: Map<string, Sprite> = new Map();

  sync(entities: Entity[]) {
    const activeIds = new Set<string>();

    // 同步現有 Entity
    for (const entity of entities) {
      if (!entity.active) continue;
      activeIds.add(entity.id);

      let sprite = this.spriteMap.get(entity.id);
      if (!sprite) {
        // Entity 存在，Sprite 不存在 → 建立
        sprite = this.createSprite(entity);
        this.spriteMap.set(entity.id, sprite);
      }

      // 更新 Sprite 狀態
      sprite.x = entity.x;
      sprite.y = entity.y;
    }

    // 清理不再存在的 Sprite
    for (const [id, sprite] of this.spriteMap) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.spriteMap.delete(id);
      }
    }
  }
}
```

### 4.3 資源生命週期

```
Entity 建立 → RenderSystem 偵測 → 建立 Sprite
Entity 更新 → RenderSystem 同步 → 更新 Sprite 位置/狀態
Entity 停用 → RenderSystem 偵測 → 銷毀 Sprite
```

## 5. Current vs Target

### 5.1 目前實作摘要

目前架構已達到高度符合無狀態原則（96.5% 遵循度）：

- **EventQueue**：已實作 publish/subscribe 模式，14 種事件類型支援系統通訊
- **GameStateManager**：集中管理所有遊戲狀態（combat、wave、upgrades、kills）
- **Systems**：大部分已無狀態，僅持有必要的實作細節（如 shootCooldown）
- **BoothRenderer**：已分離，Booth 渲染邏輯獨立於 BoothSystem

### 5.2 目標架構差異

| 面向     | 目前實作                      | 目標架構               | 狀態    |
| -------- | ----------------------------- | ---------------------- | ------- |
| 狀態管理 | 集中於 GameStateManager       | 集中於 GameState       | ✅ 完成 |
| 渲染同步 | 6 個 Renderer 類別已完成分離  | 獨立 RenderSystem 同步 | ✅ 完成 |
| Entity   | 純資料容器（無 Pixi.js 依賴） | 純資料容器             | ✅ 完成 |
| 事件流   | 高度事件驅動（14 種事件）     | 完全事件驅動           | ✅ 接近 |

### 5.3 重構進度

1. ✅ **Phase 1**：抽取 GameState，集中狀態管理
2. ✅ **Phase 2**：分離 RenderSystem，統一 Entity-Sprite 同步
   - ✅ BoothRenderer 已分離
   - ✅ HUDRenderer 已分離（原 HUDSystem 重構為純渲染器）
   - ✅ BulletRenderer 已分離（子彈渲染獨立）
   - ✅ PlayerRenderer 已分離（玩家渲染獨立，Buff 外觀透過 GameState）
   - ✅ EnemyRenderer 已分離（敵人渲染獨立，閃白效果透過 GameState）
   - ✅ FoodRenderer 已分離（食材渲染獨立）
   - ✅ SpriteEntity 已移除（Entity 為純資料容器）
3. ✅ **Phase 3**：將 System 內部狀態移至 GameState
   - BoothSystem、BoxSystem、WaveSystem 已無狀態
   - CombatSystem 僅保留 shootCooldown（實作細節）
4. ⏳ **Phase 4**：引入 Component 系統，增加 Entity 組合彈性（未來方向）

### 5.4 重構原則

- **漸進式**：每次重構只改變一個面向
- **測試保護**：重構前確保測試覆蓋（目前 92%+）
- **行為不變**：重構不改變遊戲行為
