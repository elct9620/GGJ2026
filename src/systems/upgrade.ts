/**
 * Upgrade System
 * SPEC § 2.3.4: 回合間及 Boss 擊敗後永久強化玩家能力
 */

import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import type { BoothSystem } from "./booth";
import { type FoodType, getBoothIdForFood } from "../entities/booth";

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
  bubbleTeaBulletBonus: number; // 加椰果: +5 per upgrade
  bloodCakeRangeBonus: number; // 加香菜: +0.5 per upgrade

  // Boss upgrades (SPEC § 2.3.4)
  recipeCostReduction: number; // 打折: -1 per upgrade (min 1)
  magazineMultiplier: number; // 大胃王: ×2 per upgrade
  killThresholdDivisor: number; // 快吃: ÷2 per upgrade
  buffDurationMultiplier: number; // 飢餓三十: ×2 per upgrade
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

  // Dependency keys
  private static readonly DEP_EVENT_QUEUE = "EventQueue";
  private static readonly DEP_BOOTH = "BoothSystem";

  // Upgrade state
  private state: UpgradeState = {
    stinkyTofuDamageBonus: 0,
    bubbleTeaBulletBonus: 0,
    bloodCakeRangeBonus: 0,
    recipeCostReduction: 0,
    magazineMultiplier: 1,
    killThresholdDivisor: 1,
    buffDurationMultiplier: 1,
  };

  // Current upgrade options (shown to player)
  private currentOptions: UpgradeOption[] = [];

  // Pending upgrade (waiting for player selection)
  private isPendingUpgrade = false;

  constructor() {
    super();
    this.declareDependency(UpgradeSystem.DEP_EVENT_QUEUE);
    this.declareDependency(UpgradeSystem.DEP_BOOTH);
  }

  /**
   * Get EventQueue dependency
   */
  private get eventQueue(): EventQueue {
    return this.getDependency<EventQueue>(UpgradeSystem.DEP_EVENT_QUEUE);
  }

  /**
   * Get BoothSystem dependency
   */
  private get boothSystem(): BoothSystem {
    return this.getDependency<BoothSystem>(UpgradeSystem.DEP_BOOTH);
  }

  // Upgrade pools (SPEC § 2.3.4)
  private readonly normalUpgrades: UpgradeOption[] = [
    {
      id: "spicy",
      name: "加辣",
      description: "臭豆腐傷害倍率 +0.5",
      cost: { foodType: "Tofu", amount: 3 },
      effect: (state) => {
        state.stinkyTofuDamageBonus += 0.5;
      },
    },
    {
      id: "coconut",
      name: "加椰果",
      description: "珍珠奶茶子彈數 +5",
      cost: { foodType: "Pearl", amount: 3 },
      effect: (state) => {
        state.bubbleTeaBulletBonus += 5;
      },
    },
    {
      id: "cilantro",
      name: "加香菜",
      description: "豬血糕傷害範圍倍率 +0.5",
      cost: { foodType: "BloodCake", amount: 3 },
      effect: (state) => {
        state.bloodCakeRangeBonus += 0.5;
      },
    },
  ];

  private readonly bossUpgrades: UpgradeOption[] = [
    {
      id: "discount",
      name: "打折",
      description: "臭豆腐/珍珠奶茶/豬血糕消耗 -1",
      cost: null,
      effect: (state) => {
        state.recipeCostReduction += 1;
      },
    },
    {
      id: "bigEater",
      name: "大胃王",
      description: "彈匣容量 ×2",
      cost: null,
      effect: (state) => {
        state.magazineMultiplier *= 2;
      },
    },
    {
      id: "fastEat",
      name: "快吃",
      description: "蚵仔煎擊殺門檻 ÷2",
      cost: null,
      effect: (state) => {
        state.killThresholdDivisor *= 2;
      },
    },
    {
      id: "hunger30",
      name: "飢餓三十",
      description: "特殊子彈 Buff 時間 ×2",
      cost: null,
      effect: (state) => {
        state.buffDurationMultiplier *= 2;
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
    const isBossWave = data.waveNumber % 5 === 0;
    const pool = isBossWave ? this.bossUpgrades : this.normalUpgrades;

    // Randomly select 2 options (SPEC § 2.3.4)
    this.currentOptions = this.selectRandomUpgrades(pool, 2);
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
      const availableFood = this.boothSystem.getFoodCount(boothId);

      if (availableFood < option.cost.amount) {
        return false; // Insufficient food
      }

      // Consume food
      for (let i = 0; i < option.cost.amount; i++) {
        this.boothSystem.retrieveFood(boothId);
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
    this.state = {
      stinkyTofuDamageBonus: 0,
      bubbleTeaBulletBonus: 0,
      bloodCakeRangeBonus: 0,
      recipeCostReduction: 0,
      magazineMultiplier: 1,
      killThresholdDivisor: 1,
      buffDurationMultiplier: 1,
    };
  }
}
