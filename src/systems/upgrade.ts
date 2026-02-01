/**
 * Upgrade System
 * SPEC § 2.3.4: 回合間及 Boss 擊敗後永久強化玩家能力
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import type { BoothSystem } from "./booth";
import { type FoodType, getBoothIdForFood } from "../core/types";
import { upgradeData, waveData } from "../data";
import { DependencyKeys } from "../core/systems/dependency-keys";

/**
 * Upgrade option definition
 */
export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  cost: { foodType: FoodType; amount: number } | null;
  effect: (state: UpgradeState) => void;
}

/**
 * Upgrade state tracking all permanent upgrades
 */
export interface UpgradeState {
  // Normal upgrades (SPEC § 2.3.4)
  stinkyTofuDamageBonus: number; // 加辣: +0.5 per upgrade
  bubbleTeaBulletBonus: number; // 加椰果: +1 per upgrade
  bloodCakeRangeBonus: number; // 加香菜: +0.5 per upgrade

  // Boss upgrades (SPEC § 2.3.4)
  recipeCostReduction: number; // 打折: -1 per upgrade (min 1)
  magazineMultiplier: number; // 大胃王: +6 per upgrade
  killThresholdDivisor: number; // 快吃: +10% per upgrade
  buffDurationMultiplier: number; // 飢餓三十: +2s per upgrade

  // NEW: Missing Boss upgrades
  reloadTimeReduction: number; // 好餓好餓: -0.5s per upgrade
  nightMarketChainMultiplier: number; // 總匯吃到飽: ×2 per upgrade (初始 1)
  nightMarketDecayReduction: number; // 總匯吃到飽: -0.1 per upgrade
}

/**
 * Create default upgrade state
 * Single source of truth for initial upgrade values
 */
export function createDefaultUpgradeState(): UpgradeState {
  return {
    stinkyTofuDamageBonus: 0,
    bubbleTeaBulletBonus: 0,
    bloodCakeRangeBonus: 0,
    recipeCostReduction: 0,
    magazineMultiplier: 1,
    killThresholdDivisor: 1,
    buffDurationMultiplier: 1,
    reloadTimeReduction: 0,
    nightMarketChainMultiplier: 1,
    nightMarketDecayReduction: 0,
  };
}

/**
 * Upgrade System
 * SPEC § 2.3.4: 回合間及 Boss 擊敗後永久強化玩家能力
 *
 * Responsibilities:
 * - 訂閱 WaveComplete 事件
 * - 隨機抽取 2 個升級選項（普通 vs Boss 池）
 * - 玩家選擇後消耗食材並套用效果
 * - 永久修改遊戲參數
 */
export class UpgradeSystem extends InjectableSystem {
  public readonly name = "UpgradeSystem";
  public readonly priority = SystemPriority.DEFAULT;

  // Upgrade state (initialized using factory function)
  private state: UpgradeState = createDefaultUpgradeState();

  // Current upgrade options (shown to player)
  private currentOptions: UpgradeOption[] = [];

  // Pending upgrade (waiting for player selection)
  private isPendingUpgrade = false;

  constructor() {
    super();
    this.declareDependency(DependencyKeys.EventQueue);
    this.declareDependency(DependencyKeys.BoothSystem);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(DependencyKeys.EventQueue);
  }

  /**
   * Get BoothSystem dependency
   */
  private get boothSystem(): BoothSystem {
    return this.getDependency<BoothSystem>(DependencyKeys.BoothSystem);
  }

  // Upgrade pools (SPEC § 2.3.4 - 無消耗，直接選擇)
  private readonly normalUpgrades: UpgradeOption[] = [
    {
      id: "spicy",
      name: "加辣",
      description: `臭豆腐傷害 +${upgradeData.getNormal("spicy").damageBonus}`,
      cost: null, // SPEC § 2.3.4: 無消耗
      effect: (state) => {
        state.stinkyTofuDamageBonus +=
          upgradeData.getNormal("spicy").damageBonus ?? 0;
      },
    },
    {
      id: "coconut",
      name: "加椰果",
      description: `珍珠奶茶子彈 +${upgradeData.getNormal("coconut").bulletBonus}`,
      cost: null, // SPEC § 2.3.4: 無消耗
      effect: (state) => {
        state.bubbleTeaBulletBonus +=
          upgradeData.getNormal("coconut").bulletBonus ?? 0;
      },
    },
    {
      id: "cilantro",
      name: "加香菜",
      description: `豬血糕範圍 +${upgradeData.getNormal("cilantro").rangeBonus}`,
      cost: null, // SPEC § 2.3.4: 無消耗
      effect: (state) => {
        state.bloodCakeRangeBonus +=
          upgradeData.getNormal("cilantro").rangeBonus ?? 0;
      },
    },
  ];

  private readonly bossUpgrades: UpgradeOption[] = [
    {
      id: "discount",
      name: "打折",
      description: `臭豆腐/珍珠奶茶/豬血糕消耗 -${upgradeData.getBoss("discount").costReduction}`,
      cost: null,
      effect: (state) => {
        state.recipeCostReduction +=
          upgradeData.getBoss("discount").costReduction ?? 0;
      },
    },
    {
      id: "bigEater",
      name: "大胃王",
      description: `彈匣容量 +${upgradeData.getBoss("bigEater").magazineBonus}`,
      cost: null,
      effect: (state) => {
        state.magazineMultiplier +=
          upgradeData.getBoss("bigEater").magazineBonus ?? 0;
      },
    },
    {
      id: "fastEat",
      name: "快吃",
      description: `蚵仔煎傷害 +${(upgradeData.getBoss("fastEat").damageBonus ?? 0) * 100}%`,
      cost: null,
      effect: (state) => {
        state.killThresholdDivisor +=
          upgradeData.getBoss("fastEat").damageBonus ?? 0;
      },
    },
    {
      id: "hunger30",
      name: "飢餓三十",
      description: `特殊子彈 Buff 時間 +${upgradeData.getBoss("hunger30").durationBonus}s`,
      cost: null,
      effect: (state) => {
        state.buffDurationMultiplier +=
          upgradeData.getBoss("hunger30").durationBonus ?? 0;
      },
    },
    {
      id: "veryHungry",
      name: "好餓好餓",
      description: `換彈時間 -${upgradeData.getBoss("veryHungry").reloadReduction}s`,
      cost: null,
      effect: (state) => {
        state.reloadTimeReduction +=
          upgradeData.getBoss("veryHungry").reloadReduction ?? 0;
      },
    },
    {
      id: "buffet",
      name: "總匯吃到飽",
      description: `夜市總匯連鎖 ×${upgradeData.getBoss("buffet").chainMultiplier}、衰減 -${(upgradeData.getBoss("buffet").decayReduction ?? 0) * 100}%`,
      cost: null,
      effect: (state) => {
        state.nightMarketChainMultiplier *=
          upgradeData.getBoss("buffet").chainMultiplier ?? 1;
        state.nightMarketDecayReduction +=
          upgradeData.getBoss("buffet").decayReduction ?? 0;
      },
    },
  ];

  /**
   * Initialize upgrade system
   */
  public initialize(): void {
    this.resetState();

    // Subscribe to WaveComplete event (SPEC § 2.3.4)
    this.eventQueue.subscribe(
      EventType.WaveComplete,
      this.onWaveComplete.bind(this),
    );
  }

  /**
   * Update upgrade system
   */
  public update(): void {
    // Upgrade system is event-driven
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Dependencies are managed by InjectableSystem
  }

  /**
   * Get upgrade state (read by other systems)
   */
  public getState(): Readonly<UpgradeState> {
    return this.state;
  }

  /**
   * Get current upgrade options
   */
  public getCurrentOptions(): readonly UpgradeOption[] {
    return this.currentOptions;
  }

  /**
   * Check if upgrade selection is pending
   */
  public isPending(): boolean {
    return this.isPendingUpgrade;
  }

  /**
   * Handle WaveComplete event (SPEC § 2.3.4)
   */
  private onWaveComplete(data: { waveNumber: number }): void {
    this.isPendingUpgrade = true;

    // Determine upgrade pool based on wave type
    const isBossWave = data.waveNumber % waveData.bossWaveInterval === 0;
    const pool = isBossWave ? this.bossUpgrades : this.normalUpgrades;

    // Randomly select options (SPEC § 2.3.4)
    this.currentOptions = this.selectRandomUpgrades(
      pool,
      upgradeData.optionsCount,
    );
  }

  /**
   * Select random upgrades from pool
   */
  private selectRandomUpgrades(
    pool: UpgradeOption[],
    count: number,
  ): UpgradeOption[] {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Apply selected upgrade
   * Returns true if successful, false if insufficient food
   */
  public selectUpgrade(upgradeId: string): boolean {
    if (!this.isPendingUpgrade) return false;

    const option = this.currentOptions.find((opt) => opt.id === upgradeId);
    if (!option) return false;

    // Check and consume food for normal upgrades
    if (option.cost) {
      const boothId = getBoothIdForFood(option.cost.foodType);
      const success = this.boothSystem.consumeFood(boothId, option.cost.amount);
      if (!success) {
        return false; // Insufficient food
      }
    }

    // Apply upgrade effect
    option.effect(this.state);

    // Publish UpgradeSelected event (SPEC § 2.3.6)
    this.eventQueue.publish(EventType.UpgradeSelected, {
      upgradeId: option.id,
    });

    // Clear pending state
    this.isPendingUpgrade = false;
    this.currentOptions = [];

    return true;
  }

  /**
   * Reset upgrade state for new game
   */
  public reset(): void {
    this.resetState();
    this.isPendingUpgrade = false;
    this.currentOptions = [];
  }

  /**
   * Reset upgrade state to initial values
   */
  private resetState(): void {
    this.state = createDefaultUpgradeState();
  }
}
