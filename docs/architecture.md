# Game Architecture Guide

本文件描述 Bite Back! The Booth Defense 的架構設計原則。

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

## 5. Implementation Guidelines

### 5.1 System 設計準則

- **無狀態優先**：System 應盡量無狀態，狀態集中於 GameStateManager
- **實作細節例外**：如 shootCooldown 等純實作細節可保留於 System 內
- **依賴注入**：使用 InjectableSystem 基底類別管理依賴

### 5.2 Renderer 設計準則

- **純同步職責**：Renderer 僅負責 Entity 狀態到 Sprite 的同步
- **獨立容器**：每個 Renderer 管理自己的 Container
- **ID 對應**：使用 Entity ID 對應 Sprite，確保正確清理

### 5.3 未來方向

- **Component 系統**：引入 Component 系統增加 Entity 組合彈性
