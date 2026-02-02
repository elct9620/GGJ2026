# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

**Night Market Defense** - Global Game Jam 2026 參賽作品，主題為「Mask」。這是一款橫向塔防遊戲，玩家在台灣夜市攤位區防守，透過射擊餓鬼、收集食材、合成特殊子彈來生存。

## Technology Stack

- **Runtime**: TypeScript 5.9.3 (ES2022, strict mode)
- **Rendering**: Pixi.js v8.x (2D WebGL)
- **Build Tool**: Vite (rolldown-vite 7.2.5)
- **Testing**: Vitest 4.x + @vitest/ui + @vitest/coverage-v8
- **Formatting**: Prettier 3.8.1
- **Deployment**: Cloudflare Pages (via wrangler)
- **Package Manager**: pnpm

## Coding Standards

- Use discriminated unions in TypeScript for variant types
- Prefer SOLID principles and modular design
- Prefer Design Patterns (e.g., Object Pool for bullets/enemies)
- Prefer Dependency Injection for system dependencies

## Development Commands

```bash
# 開發伺服器（帶熱重載）
pnpm dev

# TypeScript 型別檢查與建置
pnpm build

# 預覽生產建置
pnpm preview

# 執行測試（watch mode）
pnpm test

# 執行單一測試檔案
pnpm test -- <filename>.test.ts

# 測試 UI 介面
pnpm test:ui

# 測試覆蓋率報告
pnpm test:coverage

# 格式化程式碼
pnpm format

# 檢查格式
pnpm format:check
```

## Testing Workflow

**CRITICAL**: This project follows Test-Driven Development (TDD) practices:

1. **Read** `docs/testing.md` before implementing features
2. **Write tests first** based on test specifications
3. **Run tests** with `pnpm test` to verify implementation
4. **Target coverage**: 80% overall (90% for core systems)
5. **Test levels**: Unit tests → Integration tests → Acceptance tests

Test files should be colocated with source files using `.test.ts` suffix.

### Testing Strategy

**Primary Focus: Unit Testing**

This project prioritizes **unit tests** for rapid development and reliable coverage:

- **Unit tests** - Test individual modules, functions, and classes in isolation
- **Integration tests** - Only for critical system interactions (e.g., booth + synthesis)
- **Visual/E2E tests** - Use `/agent-browser` skill for automated visual testing (screenshots, interactions)

**WebGL Mocking Strategy:**

The project uses a **custom WebGL mock** (`src/test/setup.ts`) designed for unit testing:

- ✅ **Sufficient for**: Testing game logic, state management, configuration
- ✅ **Fast**: No native dependencies, runs in Node.js environment (happy-dom)
- ✅ **Maintainable**: Full control over mock behavior
- ❌ **Not for**: Shader logic, visual rendering, texture operations

**When to upgrade to full WebGL testing:**

Consider using [vitest-webgl-canvas-mock](https://github.com/RSamaium/vitest-webgl-canvas-mock) or [headless-gl](https://github.com/stackgl/headless-gl) if:
- Testing complex shader interactions
- Validating WebGL-specific rendering logic
- Encountering limitations in current mock implementation

**Testing Philosophy:**

- Focus on **what** the code does, not **how** it renders
- Test state transitions, calculations, and business logic
- Visual correctness verified via `/agent-browser` skill or manual playtesting
- Prioritize test execution speed (< 500ms total runtime)

**Visual Testing with agent-browser:**

Use the `/agent-browser` skill for automated visual verification:
- Take screenshots of game states (start screen, gameplay, game over)
- Verify UI elements are positioned correctly (HUD, booths, player)
- Check bullet visual effects and animations
- Test keyboard interactions in browser environment

```bash
# Start dev server before visual testing
pnpm dev
# Then use /agent-browser to navigate to http://localhost:5173
```

## Code Architecture

### Specification-Driven Development

This project uses a **three-layer specification framework** (Intent → Design → Consistency):

- **SPEC.md**: Complete game specification including systems, entities, behaviors, and constraints
- **docs/testing.md**: Test cases mapped to SPEC.md requirements
- **docs/raw_design.md**: Original design document (reference only)

**IMPORTANT**: Always consult SPEC.md before making design decisions. Use the `/align-design` skill to ensure code matches specifications.

### Architecture Guide

本專案採用 **ECS-like 事件驅動架構**，將 Input、Logic、Render 三層分離：

- **事件驅動**：系統間透過 EventQueue 鬆耦合通訊
- **無狀態系統**：System 讀取 GameStateManager，狀態集中管理
- **渲染分離**：Entity 為純資料容器，Renderer 負責視覺同步

詳細架構設計參見 [docs/architecture.md](docs/architecture.md)。

### Pixi.js Scene Structure

**Container hierarchy** (managed by `GameScene`):

```
Application.stage
├── Background Layer (z-index: 0)
│   └── 攤位區域背景 (340px width)
├── Game Layer (z-index: 1)
│   ├── Booth Container
│   │   ├── 3 booths (Tofu/Pearl/BloodCake) - BoothSystem.getContainer()
│   │   └── Box sprite (x=340) - BoxSystem.getContainer()
│   ├── Food Drops Container (dynamic, auto-collected)
│   ├── Player Sprite (256×256 collision box)
│   ├── Enemies Container (Ghosts + Bosses)
│   ├── Bullets Container (Normal + Special)
│   └── Bullet Visual Effects Container (trails, hit effects, particles)
└── UI Layer (z-index: 2)
    ├── Top HUD - HUDSystem.getTopHUD()
    │   └── Wave, Enemy Count, Health
    └── Bottom HUD - HUDSystem.getBottomHUD()
        └── Buff Display, Ammo, Reload Progress
```

**Important**: Container visibility is managed by screen state (start/game/gameover).

### Core Game Systems

**System Architecture**: All systems implement `System` interface and are managed by `SystemManager`:

```typescript
interface System {
  name: string;
  priority: SystemPriority;  // Execution order (EVENT_QUEUE → BOOTH → DEFAULT)
  initialize(): void;
  update(deltaTime: number): void;
  destroy(): void;
}
```

**Implemented Systems** (`src/systems/`):

1. **EventQueue System**: 事件中樞，替代 setTimeout 的延遲執行機制
   - Priority: `EVENT_QUEUE` (highest, executes first)
   - 14 event types: WaveStart, WaveComplete, EnemyDeath, SynthesisTriggered, BulletFired, EnemyHit, ButtonClicked, etc.
   - Publish/Subscribe pattern for system decoupling

2. **Input System**: 鍵盤輸入處理 (WASD 移動, Space 射擊, 1-5 合成)

3. **Booth System**: 食材儲存與提取 (3 booths: Pearl/Tofu/BloodCake, max 6 each)
   - Publishes `FoodStored` and `FoodConsumed` events

4. **Box System**: 寶箱防禦機制 (spawns at x=340, durability = total booth food)
   - Subscribes to `FoodStored`/`FoodConsumed` events

5. **Combat System**: 射擊、重裝、Buff 管理、碰撞檢測
   - Manages reload (3s cooldown), shooting cooldown (200ms)
   - Buff duration: 2s (affected by Upgrade System)

6. **Synthesis System**: 按鍵 1-5 直接觸發合成 (no slot UI)
   - 5 recipes: NightMarket, StinkyTofu, BubbleTea, BloodCake, OysterOmelette
   - Publishes `SynthesisTriggered` event

7. **Kill Counter System**: 累積擊殺計數，10 隻解鎖蚵仔煎

8. **Wave System**: 敵人生成與回合進程
   - Enemy count formula: `wave × 2`
   - Boss every 5 waves
   - Publishes `WaveStart` and `WaveComplete` (2s delay) events

9. **Upgrade System**: 回合間永久升級 (3 normal + 4 boss upgrades)
   - Normal: cost food, stacking bonuses
   - Boss: no cost, multiplicative effects

10. **HUD System**: UI 顯示 (Wave, Health, Ammo, Enemy Count)

11. **Audio System**: 音效系統 (SPEC § 2.3.9)
    - 預載入音效（背景非阻塞載入）
    - 不重疊播放（每個音效 ID 同時只播放一個實例）
    - 訂閱 BulletFired, EnemyHit, ButtonClicked 事件

**Entities** (`src/entities/`):
- All extend `Entity` base class (id generation, active state)
- `Player`, `Enemy` (Ghost/Boss), `Bullet`, `Food`

**Collision Handlers** (`src/collision/`):
- **CollisionRegistry**: 註冊與取得碰撞處理器
- **BaseCollisionHandler**: 基底類別，定義共用邏輯
- 子彈類型專屬 handlers: Normal, StinkyTofu, BloodCake, NightMarket, OysterOmelette

**Visual Effects** (`src/effects/`):
- **BulletVisualEffects**: Lightweight particle system for bullet visual feedback (SPEC § 2.6.3)
  - Trail effects: White wind切線條 (normal), golden electric (night market), green gas (stinky tofu), black sticky (blood cake)
  - Hit effects: Pop animations, pierce clouds, chain lightning, explosions
  - Screen shake support for ultimate abilities (oyster omelette)
  - No external dependencies (@pixi/particle-emitter not required)
  - Performance: < 500ms test runtime, designed for 60 FPS

### Object Pool Pattern

**Required for performance**: Use object pooling for frequently created/destroyed entities:

- **Bullets**: Pool size ~100
- **Enemies**: Pool size ~50
- Prevents GC pressure during gameplay
- Target: 60 FPS with 50 enemies + 100 bullets

### Performance Constraints

- **Target resolution**: 1920×1080 (16:9)
- **Target FPS**: 60 (16.67ms per frame)
- **Memory budget**: < 200 MB
- **Asset size**: < 10 MB total (< 25 MB hard limit for Cloudflare)

## Canvas & Coordinate System

```typescript
// Canvas setup reference (from SPEC.md 4.2.1)
{
  width: 1920,
  height: 1080,
  backgroundColor: 0x1a1a1a,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  antialias: true
}
```

**Critical boundaries**:
- 攤位區域: x = 0 to 340
- 遊戲活動區: x = 340 to 1920
- 底線（敵人到達扣血）: x = 340
- 玩家邊界: x ∈ [340, 1920], y ∈ [0, 1080]

## Key Design Decisions (from SPEC.md 5.1)

1. 攤位位置固定（不可移動）
2. 特殊子彈為臨時 Buff（不替換彈夾內容，持續 2 秒）
3. **合成機制**: 按鍵 1-5 直接觸發合成（**已移除** 3-slot 槽位機制）
4. 敵人數量公式: 回合數 × 2
5. Boss 出現頻率: 每 5 回合
6. 碰撞箱與視覺同步: Player/Enemy 256×256 px, Bullet 24~192 px (依類型), Food 16×16 px
7. 食材掉落率: 100%（類型隨機）
8. 使用物件池管理子彈和敵人（**計劃中，尚未實作**）
9. Booth ID mapping: **1-indexed** (1=Tofu, 2=Pearl, 3=BloodCake)

## Git Workflow

This project uses **conventional commits**:

```
feat: add player movement system
fix: correct collision detection boundary
test: add booth system unit tests
docs: update SPEC.md with upgrade system details
```

**Claude Code hooks are configured** (see `.github/workflows/claude.yml`):
- Pre-commit formatting with Prettier
- Type checking before commits

## Browser Compatibility

**Target browsers** (from SPEC.md 4.3):
- Chrome 120+
- Firefox 120+
- Safari 17+

**Required features**:
- WebGL 2.0
- ES2022+ syntax
- Keyboard API

**Desktop only** - mobile browsers not supported in this version.

## Deployment

**Build output**: `dist/` directory
**Platform**: Cloudflare Pages (configured via `wrangler.jsonc`)

```bash
# Build for production
pnpm build

# Deploy command (handled by Cloudflare Pages)
# Build command: pnpm build
# Output directory: dist
# Node version: 22.x
```

## System Integration Pattern

When adding new systems, follow this integration pattern (see `GameScene` constructor):

```typescript
// 1. Create system instances
const eventQueue = new EventQueue();
const mySystem = new MySystem();

// 2. Register with SystemManager
this.systemManager.register(eventQueue);  // EventQueue first!
this.systemManager.register(mySystem);

// 3. Connect dependencies (before initialize)
mySystem.setEventQueue(eventQueue);
mySystem.setOtherDependency(dependency);

// 4. Initialize all systems
this.systemManager.initialize();

// 5. Subscribe to events (after initialize)
eventQueue.subscribe(EventType.SomeEvent, this.onSomeEvent.bind(this));

// 6. Add visual containers if needed
this.container.addChild(mySystem.getContainer());
```

**Critical order**: EventQueue must be registered first (highest priority).

## Event-Driven Communication

Systems communicate via `EventQueue` (publish/subscribe pattern):

```typescript
// Publishing events
eventQueue.publish(EventType.EnemyDeath, {
  enemyId: enemy.id,
  position: { x: enemy.x, y: enemy.y }
});

// With delay (2000ms)
eventQueue.publish(EventType.WaveComplete, { waveNumber: 5 }, 2000);

// Subscribing to events
eventQueue.subscribe(EventType.EnemyDeath, (data) => {
  // Handle enemy death
});
```

**Available events**: See `EventType` and `EventData` in `src/systems/event-queue.ts`.

## Critical Reminders

1. **Always read SPEC.md** before implementing features - it contains complete system behaviors, constraints, and error scenarios
2. **Write tests before code** - test cases are pre-defined in `docs/testing.md`
3. **Use strict TypeScript** - all compiler warnings must be resolved
4. **Booth ID mapping**: 1-indexed (1=Pearl, 2=Tofu, 3=BloodCake) - not 0-indexed
5. **Event-driven architecture**: Systems communicate via EventQueue, avoid direct coupling
6. **Consult SPEC.md for game values** (damage, speed, cooldowns) - do not hardcode arbitrary numbers
7. **Use conventional commits** - follow user's commit message style
8. **Test coverage minimum 80%** - verify with `pnpm test:coverage` (currently at 92%+)
