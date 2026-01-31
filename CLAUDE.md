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
- **Visual/E2E tests** - Manual testing in browser (Game Jam time constraints)

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
- Visual correctness verified through manual playtesting
- Prioritize test execution speed (< 500ms total runtime)

## Code Architecture

### Specification-Driven Development

This project uses a **three-layer specification framework** (Intent → Design → Consistency):

- **SPEC.md**: Complete game specification including systems, entities, behaviors, and constraints
- **docs/testing.md**: Test cases mapped to SPEC.md requirements
- **docs/raw_design.md**: Original design document (reference only)

**IMPORTANT**: Always consult SPEC.md before making design decisions. Use the `/align-design` skill to ensure code matches specifications.

### Pixi.js Scene Structure

```
Application.stage
├── Background Layer (z-index: 0)
│   └── 攤位區域背景 (384px width, left 20%)
├── Game Layer (z-index: 1)
│   ├── Booth Container (3 booths: 珍珠/豆腐/米血)
│   ├── Food Drops Container (dynamic)
│   ├── Player Sprite (24×24 collision box)
│   ├── Enemies Container (Ghosts + Bosses)
│   └── Bullets Container (Normal + Special)
└── UI Layer (z-index: 2)
    ├── Top HUD (Wave, Enemy Count, Health)
    └── Bottom HUD (Synthesis Slot, Buff, Ammo)
```

### Core Game Systems

每個系統應該是獨立的模組，位於 `src/systems/` 下：

1. **Booth System** (`src/systems/booth/`): 食材儲存與提取
2. **Combat System** (`src/systems/combat/`): 射擊、重裝、子彈管理
3. **Synthesis System** (`src/systems/synthesis/`): 食材合成與特殊子彈
4. **Upgrade System** (`src/systems/upgrade/`): 回合間永久升級
5. **Wave System** (`src/systems/wave/`): 敵人生成與回合進程

遊戲實體應位於 `src/entities/` 下：
- `Player`, `Ghost`, `Boss`, `Bullet`, `Food`

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
- 攤位區域: x = 0 to 384 (left 20%)
- 遊戲活動區: x = 384 to 1920 (right 80%)
- 底線（敵人到達扣血）: x = 384
- 玩家邊界: x ∈ [384, 1920], y ∈ [0, 1080]

## Key Design Decisions (from SPEC.md 5.1)

1. 攤位位置固定（不可移動）
2. 特殊子彈為臨時 Buff（不替換彈夾內容）
3. 自動合成觸發（放入第 3 個食材時）
4. 敵人數量公式: 回合數 × 2
5. Boss 出現頻率: 每 5 回合
6. 玩家碰撞箱: 24×24 px（縮小碰撞，提高容錯率）
7. 食材掉落率: 100%（類型隨機）
8. 使用物件池管理子彈和敵人

## Git Workflow

This project uses **conventional commits**:

```
feat: add player movement system
fix: correct collision detection boundary
test: add booth system unit tests
docs: update SPEC.md with upgrade system details
```

**Claude Code hooks are configured** (see `.github/workflows/claude.yml` and `claude-code-review.yml`):
- Pre-commit formatting with Prettier
- Type checking before commits
- Automated PR reviews

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
# Node version: 18.x
```

## Critical Reminders

1. **Always read SPEC.md** before implementing features - it contains complete system behaviors, constraints, and error scenarios
2. **Write tests before code** - test cases are pre-defined in `docs/testing.md`
3. **Use strict TypeScript** - all compiler warnings must be resolved
4. **Follow object pool pattern** for bullets and enemies
5. **Maintain 60 FPS** - profile performance regularly
6. **Consult SPEC.md for game values** (damage, speed, cooldowns) - do not hardcode arbitrary numbers
7. **Use conventional commits** - follow user's commit message style
8. **Test coverage minimum 80%** - verify with `pnpm test:coverage`
