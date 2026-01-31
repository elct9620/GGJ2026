# Bug & Inconsistency Report

Based on a review of `SPEC.md`, `docs/raw_design.md`, and the current implementation in the `src` directory.

**Last Updated**: 2026-02-01

---

## ✅ Fixed Issues

### 1. Box System Implementation (Critical) — FIXED

- **Original Issue**: The `BoxSystem` only managed a single box positioned at the center of the screen.
- **Resolution**: `BoxSystem` now uses dependency injection to access `BoothSystem`. Collision detection covers all three booth pool areas (`src/systems/box.ts:103-114`), and total food count is derived from `BoothSystem.getTotalFoodCount()` as the single source of truth.

### 4. Booth Capacity Enforcement — FIXED

- **Original Issue**: Concern that capacity limit might be bypassed during food collection.
- **Resolution**: `Booth.addFood()` (`src/systems/booth.ts:305-312`) correctly checks `count >= maxCapacity` and returns `false` when full, causing food to be lost per SPEC § 2.3.1.

### 5. Wave System Spawn Logic — FIXED

- **Original Issue**: All enemies were spawned at once at the start of the wave with staggered X positions.
- **Resolution**: `WaveSystem.update()` (`src/systems/wave.ts:90-121`) now implements progressive spawning with 2-3 second random intervals per SPEC § 2.3.5. First enemy spawns immediately, subsequent enemies spawn progressively.

### 2. Enemy Variety — FIXED

- **Original Issue**: The code only implemented `Ghost` and `Boss` types, and Ghost incorrectly dropped random food.
- **Resolution**:
  - `EnemyType` (`src/entities/enemy.ts:12-17`) now includes `RedGhost`, `GreenGhost`, `BlueGhost` (Elite types)
  - `dropFood()` method returns fixed food type per enemy type:
    - Ghost → `null` (no drop per SPEC § 2.6.2)
    - RedGhost → Tofu
    - GreenGhost → Pearl
    - BlueGhost → BloodCake
    - Boss → `null` (special upgrade handled by UpgradeSystem)
  - `WaveSystem.selectEnemyType()` generates enemies by probability: Ghost 40%, RedGhost/GreenGhost/BlueGhost each 20%
  - Elite enemies have 2 HP, speed 40 px/s with colored visual tints

---

## ⚠️ Open Issues

### 3. Special Bullet Mechanics

- **Issue**: The `Bullet` class only handles basic movement and a single damage value.
- **Spec Reference**: `SPEC.md § 2.6.3` and `§ 2.3.3` describe piercing (Stinky Tofu), scattering (Bubble Tea), tracking (Blood Cake), and chain lightning (Night Market) effects.
- **Current State**: `src/entities/bullet.ts` has no special effect implementation.
- **Impact**: Special bullets currently don't provide the strategic advantages described in the design.

### 6. Upgrade System Integration (Partial)

- **Issue**: The `UpgradeSystem` is implemented but bypassed in `GameScene`.
- **Spec Reference**: `SPEC.md § 2.3.4`.
- **Current State**: `UpgradeSystem` is fully implemented and registered (`src/game-scene.ts:82,90`), but `onWaveComplete()` (`src/game-scene.ts:405-413`) directly starts the next wave, skipping upgrade selection. A TODO comment indicates UI implementation is needed.
- **Impact**: Players cannot currently upgrade their abilities between waves until upgrade selection UI is built.
