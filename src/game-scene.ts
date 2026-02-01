import { Container } from "pixi.js";
import { Player } from "./entities/player";
import { Enemy, EnemyType } from "./entities/enemy";
import { Bullet } from "./entities/bullet";
import { Food, FoodType, getBoothIdForFood } from "./entities/booth";
import { InputSystem } from "./systems/input";
import {
  HUDSystem,
  type RecipeStatus,
  type FoodRequirementStatus,
} from "./systems/hud";
import { BoothSystem } from "./systems/booth";
import { BoxSystem } from "./systems/box";
import { CombatSystem, type BulletSpawnRequest } from "./systems/combat";
import { SynthesisSystem } from "./systems/synthesis";
import { KillCounterSystem } from "./systems/kill-counter";
import { WaveSystem } from "./systems/wave";
import { UpgradeSystem } from "./systems/upgrade";
import { BulletVisualEffectsSystem } from "./systems/bullet-visual-effects";
import { EventQueue, EventType } from "./systems/event-queue";
import { SystemManager } from "./core/systems/system-manager";
import { Vector } from "./values/vector";
import { RECIPES, RECIPE_DISPLAY, FOOD_HUD_COLOR } from "./values/recipes";
import { PLAYER_CONFIG } from "./config";
import { GameStateManager, type GameStats } from "./core/game-state";
import { UpgradeScreen } from "./screens/upgrade-screen";

/**
 * Main game scene managing all game entities and systems
 * This is a prototype implementation using basic geometric shapes
 */
export class GameScene {
  // Entities
  private player: Player;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private foods: Food[] = [];

  // Systems
  private systemManager: SystemManager;

  // Centralized Game State Manager
  private gameState: GameStateManager;

  // Containers for rendering
  private playerContainer: Container;
  private enemiesContainer: Container;
  private bulletsContainer: Container;
  private foodsContainer: Container;
  private boothContainer: Container;
  private uiLayer: Container;

  // Game over callback
  private onGameOver: ((stats: GameStats) => void) | null = null;

  // Upgrade screen (SPEC § 2.3.4)
  private upgradeScreen: UpgradeScreen;
  private isPaused: boolean = false;
  private pendingWaveNumber: number = 0;

  constructor(
    playerContainer: Container,
    enemiesContainer: Container,
    bulletsContainer: Container,
    foodsContainer: Container,
    boothContainer: Container,
    uiLayer: Container,
    onGameOver?: (stats: GameStats) => void,
  ) {
    this.playerContainer = playerContainer;
    this.enemiesContainer = enemiesContainer;
    this.bulletsContainer = bulletsContainer;
    this.foodsContainer = foodsContainer;
    this.boothContainer = boothContainer;
    this.uiLayer = uiLayer;
    this.onGameOver = onGameOver || null;

    // Initialize centralized game state
    this.gameState = new GameStateManager();

    // Initialize SystemManager and register all systems
    this.systemManager = new SystemManager();
    const eventQueue = new EventQueue();
    const inputSystem = new InputSystem();
    const boothSystem = new BoothSystem();
    const boxSystem = new BoxSystem();
    const combatSystem = new CombatSystem();
    const synthesisSystem = new SynthesisSystem();
    const killCounterSystem = new KillCounterSystem();
    const waveSystem = new WaveSystem();
    const upgradeSystem = new UpgradeSystem();
    const bulletVisualEffects = new BulletVisualEffectsSystem();

    this.systemManager.register(eventQueue);
    this.systemManager.register(inputSystem);
    this.systemManager.register(combatSystem);
    this.systemManager.register(synthesisSystem);
    this.systemManager.register(killCounterSystem);
    this.systemManager.register(waveSystem);
    this.systemManager.register(upgradeSystem);
    this.systemManager.register(new HUDSystem());
    this.systemManager.register(boothSystem);
    this.systemManager.register(boxSystem);
    this.systemManager.register(bulletVisualEffects);

    // Provide dependencies for InjectableSystem instances (before initialize)
    this.systemManager.provideDependency("EventQueue", eventQueue);
    this.systemManager.provideDependency("InputSystem", inputSystem);
    this.systemManager.provideDependency("BoothSystem", boothSystem);
    this.systemManager.provideDependency(
      "KillCounterSystem",
      killCounterSystem,
    );
    this.systemManager.provideDependency("UpgradeSystem", upgradeSystem);
    this.systemManager.provideDependency(
      "BulletVisualEffectsSystem",
      bulletVisualEffects,
    );
    this.systemManager.provideDependency("GameState", this.gameState);

    this.systemManager.initialize();

    // Subscribe to EnemyDeath event for food drops
    eventQueue.subscribe(EventType.EnemyDeath, this.onEnemyDeath.bind(this));

    // Subscribe to WaveStart for HUD updates
    eventQueue.subscribe(EventType.WaveStart, this.onWaveStart.bind(this));

    // Subscribe to WaveComplete for upgrade selection (SPEC § 2.3.4)
    eventQueue.subscribe(
      EventType.WaveComplete,
      this.onWaveComplete.bind(this),
    );

    // Subscribe to UpgradeSelected to continue to next wave
    eventQueue.subscribe(
      EventType.UpgradeSelected,
      this.onUpgradeSelected.bind(this),
    );

    // Initialize player at center of playable area
    this.player = new Player(new Vector(960, 540)); // Center of 1920×1080
    this.playerContainer.addChild(this.player.sprite);

    // Connect Combat System with game entities (entity references - not injectable)
    combatSystem.setPlayer(this.player);
    combatSystem.setBullets(this.bullets);
    combatSystem.setEnemies(this.enemies);
    combatSystem.subscribeToEvents(); // Subscribe after dependencies injected

    // Setup bullet spawner callback (follows same pattern as WaveSystem.setSpawnCallback)
    combatSystem.setBulletSpawner((request: BulletSpawnRequest) => {
      // CRITICAL: Clone position to prevent shared reference (SPEC § 3.2.1)
      // Without cloning, all bullets share the same Vector instance and move together
      const spawnPosition = new Vector(request.position.x, request.position.y);
      const bullet = new Bullet(
        spawnPosition,
        request.direction,
        request.bulletType,
      );
      if (request.isTracking && request.trackingTarget) {
        bullet.setTracking(request.trackingTarget);
      }
      this.bullets.push(bullet);
      this.bulletsContainer.addChild(bullet.sprite);
      return bullet;
    });

    // Connect Box System with enemies (entity reference - not injectable)
    boxSystem.setEnemies(this.enemies);

    // Connect Bullet Visual Effects System with bullets (SPEC § 2.6.3)
    bulletVisualEffects.setBullets(this.bullets);

    // Setup booth visualization
    this.boothContainer.addChild(boothSystem.getContainer());

    // Setup box visualization (SPEC § 2.3.7)
    this.boothContainer.addChild(boxSystem.getContainer());

    // Setup bullet visual effects container (SPEC § 2.6.3)
    // Add to bullets container so effects render with bullets
    this.bulletsContainer.addChild(bulletVisualEffects.getContainer());

    // Setup HUD
    const hudSystem = this.systemManager.get<HUDSystem>("HUDSystem");
    this.uiLayer.addChild(hudSystem.getTopHUD());
    this.uiLayer.addChild(hudSystem.getBottomHUD());

    // Setup Upgrade Screen (SPEC § 2.3.4)
    this.upgradeScreen = new UpgradeScreen(this.onUpgradeSelect.bind(this));
    this.uiLayer.addChild(this.upgradeScreen.getContainer());

    // Connect Wave System spawn callback (SPEC § 2.3.5)
    waveSystem.setSpawnCallback(this.spawnEnemy.bind(this));

    // Start wave 1 (SPEC § 2.3.5)
    waveSystem.startWave(1);
  }

  /**
   * Spawn enemy (callback from Wave System)
   * SPEC § 2.3.5: Wave System calls this to create enemies
   * SPEC § 2.6.2: Supports Ghost, RedGhost, GreenGhost, BlueGhost, Boss
   *               HP scales with wave number
   */
  private spawnEnemy(
    type: "Ghost" | "RedGhost" | "GreenGhost" | "BlueGhost" | "Boss",
    x: number,
    y: number,
    wave: number,
  ): void {
    const enemyType = EnemyType[type];
    const enemy = new Enemy(enemyType, new Vector(x, y), wave);
    this.enemies.push(enemy);
    this.enemiesContainer.addChild(enemy.sprite);
  }

  /**
   * Handle WaveStart event (SPEC § 2.3.6)
   */
  private onWaveStart(data: { waveNumber: number }): void {
    const hudSystem = this.systemManager.get<HUDSystem>("HUDSystem");
    // SPEC: enemy count = wave × 2
    const totalEnemies = data.waveNumber * 2;
    hudSystem.updateWave(data.waveNumber, totalEnemies);
    hudSystem.updateEnemyCount(this.enemies.length);
  }

  /**
   * Main update loop
   */
  public update(deltaTime: number): void {
    // Skip game updates when paused (upgrade screen visible)
    if (this.isPaused) {
      return;
    }

    // Update all systems (EventQueue will process first due to priority)
    // Combat System handles: shooting, collisions, buff management
    // Wave System handles: enemy spawning, wave progression
    this.systemManager.update(deltaTime);

    this.handleInput(deltaTime);
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBullets(deltaTime);
    this.updateHUD();
    this.checkFoodCollection(); // Auto-collect dropped food
    this.checkGameOver(); // Check game over condition
  }

  private handleInput(deltaTime: number): void {
    const inputSystem = this.systemManager.get<InputSystem>("InputSystem");
    const combatSystem = this.systemManager.get<CombatSystem>("CombatSystem");

    // Handle movement
    const moveDirection = inputSystem.getMovementDirection();
    if (moveDirection.magnitude() > 0) {
      this.player.move(moveDirection, deltaTime);
    }

    // Handle shooting (fully delegated to Combat System via performShoot)
    if (inputSystem.isShootPressed()) {
      combatSystem.performShoot();
    }

    // Synthesis is now handled by SynthesisSystem (SPEC § 2.3.3)
    // No manual booth interactions needed
  }

  private updatePlayer(deltaTime: number): void {
    this.player.update(deltaTime);
  }

  private updateEnemies(deltaTime: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (!enemy.active) {
        // Remove inactive enemies
        this.enemiesContainer.removeChild(enemy.sprite);
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(deltaTime);

      // Check if enemy reached baseline (SPEC § 2.8.2)
      if (enemy.hasReachedBaseline()) {
        this.player.takeDamage(1);
        enemy.active = false;
        this.enemiesContainer.removeChild(enemy.sprite);
        this.enemies.splice(i, 1);

        // Publish EnemyReachedEnd event for Wave System (SPEC § 2.3.6)
        const eventQueue = this.systemManager.get<EventQueue>("EventQueue");
        eventQueue.publish(EventType.EnemyReachedEnd, { enemyId: enemy.id });
      }
    }
  }

  private updateBullets(deltaTime: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      if (!bullet.active) {
        this.bulletsContainer.removeChild(bullet.sprite);
        this.bullets.splice(i, 1);
        continue;
      }

      bullet.update(deltaTime);
    }
  }

  /**
   * Check and collect dropped food (auto-collect)
   * SPEC § 2.3.1: Food is automatically stored in booth
   */
  private checkFoodCollection(): void {
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const food = this.foods[i];

      if (!food.active) {
        this.foodsContainer.removeChild(food.sprite);
        this.foods.splice(i, 1);
        continue;
      }

      // Auto-store food in booth (SPEC § 2.3.1)
      const boothSystem = this.systemManager.get<BoothSystem>("BoothSystem");
      boothSystem.storeFood(food.type);
      food.active = false;
      this.foodsContainer.removeChild(food.sprite);
      this.foods.splice(i, 1);
    }
  }

  /**
   * Handle EnemyDeath event (SPEC § 2.3.6)
   * Drop food when enemy dies
   */
  private onEnemyDeath(data: {
    enemyId: string;
    position: { x: number; y: number };
  }): void {
    // Find the enemy that died
    const enemy = this.enemies.find((e) => e.id === data.enemyId);
    if (!enemy) return;

    // Drop food at enemy position (only Elite enemies drop food per SPEC § 2.6.2)
    const foodType = enemy.dropFood();
    if (foodType !== null) {
      this.spawnFood(foodType, new Vector(data.position.x, data.position.y));
    }

    // Track statistics (Spec: § 2.8.2)
    this.gameState.incrementEnemiesDefeated();
  }

  private spawnFood(type: FoodType, position: Vector): void {
    const food = new Food(type, position);
    this.foods.push(food);
    this.foodsContainer.addChild(food.sprite);
  }

  private updateHUD(): void {
    const hudSystem = this.systemManager.get<HUDSystem>("HUDSystem");
    const boothSystem = this.systemManager.get<BoothSystem>("BoothSystem");
    const killCounterSystem =
      this.systemManager.get<KillCounterSystem>("KillCounterSystem");

    this.updateTopHUD(hudSystem);
    this.updateBottomHUD(hudSystem, boothSystem, killCounterSystem);
  }

  /**
   * Update top HUD (wave, enemy count, score)
   */
  private updateTopHUD(hudSystem: HUDSystem): void {
    hudSystem.updateEnemyCount(this.enemies.length);
    hudSystem.updateScore(this.gameState.stats.enemiesDefeated * 10);
  }

  /**
   * Update bottom HUD (recipes and kill counter)
   * SPEC § 2.3.8: UI 顯示擊殺總數和蚵仔煎可用狀態
   */
  private updateBottomHUD(
    hudSystem: HUDSystem,
    boothSystem: BoothSystem,
    killCounterSystem: KillCounterSystem,
  ): void {
    // Recipe availability display
    const recipes = this.getRecipeStatuses(boothSystem, killCounterSystem);
    hudSystem.updateRecipeAvailability(recipes);

    // Kill counter display (SPEC § 2.3.8)
    hudSystem.updateKillCount(
      killCounterSystem.getKillCount(),
      killCounterSystem.getConsumeThreshold(),
    );
  }

  /**
   * Get recipe availability statuses for HUD display
   * Includes individual food requirement collection status for visual feedback
   */
  private getRecipeStatuses(
    boothSystem: BoothSystem,
    killCounterSystem: KillCounterSystem,
  ): RecipeStatus[] {
    return Object.values(RECIPES).map((recipe) => {
      const displayConfig = RECIPE_DISPLAY[recipe.id];
      const requirements = this.getRequirementStatuses(
        recipe.id,
        displayConfig.costs,
        boothSystem,
        killCounterSystem,
      );

      return {
        key: recipe.id,
        name: recipe.name,
        available: this.checkRecipeAvailability(
          {
            requirements: recipe.foodRequirements,
            requiresKillCounter: recipe.requiresKillCounter,
          },
          boothSystem,
          killCounterSystem,
        ),
        requirements,
      };
    });
  }

  /**
   * Get individual food requirement collection statuses
   * Used for HUD indicators to show which foods are collected
   */
  private getRequirementStatuses(
    recipeId: string,
    costs: FoodType[],
    boothSystem: BoothSystem,
    killCounterSystem: KillCounterSystem,
  ): FoodRequirementStatus[] {
    // Special case for 蚵仔煎 (skill 5): uses kill counter
    if (recipeId === "5") {
      const killCount = killCounterSystem.getKillCount();
      const threshold = killCounterSystem.getConsumeThreshold();
      // Show green indicator if kill threshold met
      return [
        {
          type: FOOD_HUD_COLOR.Tofu, // Use Tofu color (green) as placeholder
          collected: killCount >= threshold,
        },
      ];
    }

    // Track food consumption to handle duplicate food types
    const foodCounters: Record<string, number> = {};

    return costs.map((foodType) => {
      const boothId = getBoothIdForFood(foodType);
      const available = boothSystem.getFoodCount(boothId);

      // Track how many of this food type we've already "used"
      if (foodCounters[foodType] === undefined) {
        foodCounters[foodType] = 0;
      }
      const usedCount = foodCounters[foodType];
      foodCounters[foodType]++;

      // Check if this specific food slot is collected
      const collected = available > usedCount;

      return {
        type: FOOD_HUD_COLOR[foodType],
        collected,
      };
    });
  }

  /**
   * Check if a recipe can be synthesized
   */
  private checkRecipeAvailability(
    recipe: {
      requirements: Partial<Record<FoodType, number>>;
      requiresKillCounter?: boolean;
    },
    boothSystem: BoothSystem,
    killCounterSystem: KillCounterSystem,
  ): boolean {
    // Special check: 蚵仔煎 (SPEC § 2.3.8: 需要 20 擊殺數)
    if (recipe.requiresKillCounter) {
      return killCounterSystem.canConsume();
    }

    // Food requirements check
    for (const [foodType, required] of Object.entries(recipe.requirements)) {
      if (required === undefined) continue;
      const boothId = getBoothIdForFood(foodType as FoodType);
      const available = boothSystem.getFoodCount(boothId);
      if (available < required) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check game over condition (Spec: § 2.8.2)
   */
  private checkGameOver(): void {
    if (this.player.healthVO.isDead() && this.onGameOver) {
      this.onGameOver(this.gameState.stats);
    }
  }

  /**
   * Handle wave completion event (SPEC § 2.3.4, § 2.3.6)
   * Show upgrade selection screen before starting next wave
   */
  private onWaveComplete(data: { waveNumber: number }): void {
    // Update statistics - track waves survived (Spec: § 2.8.2)
    this.gameState.setWavesSurvived(data.waveNumber);

    // Store pending wave for after upgrade selection
    this.pendingWaveNumber = data.waveNumber + 1;

    // Pause game and show upgrade screen (SPEC § 2.3.4)
    const upgradeSystem =
      this.systemManager.get<UpgradeSystem>("UpgradeSystem");
    const options = upgradeSystem.getCurrentOptions();

    if (options.length > 0) {
      this.isPaused = true;
      this.upgradeScreen.show([...options]);
    } else {
      // No options available, continue to next wave
      const waveSystem = this.systemManager.get<WaveSystem>("WaveSystem");
      waveSystem.startWave(this.pendingWaveNumber);
    }
  }

  /**
   * Handle upgrade selection from UpgradeScreen
   */
  private onUpgradeSelect(upgradeId: string): void {
    const upgradeSystem =
      this.systemManager.get<UpgradeSystem>("UpgradeSystem");

    // Apply the selected upgrade
    const success = upgradeSystem.selectUpgrade(upgradeId);

    if (success) {
      // Hide upgrade screen and resume game
      this.upgradeScreen.hide();
      this.isPaused = false;

      // Start next wave (SPEC § 2.3.5)
      const waveSystem = this.systemManager.get<WaveSystem>("WaveSystem");
      waveSystem.startWave(this.pendingWaveNumber);
    }
    // If upgrade failed (insufficient resources), keep screen visible
  }

  /**
   * Handle UpgradeSelected event from UpgradeSystem (SPEC § 2.3.6)
   * This is published after upgrade is successfully applied
   * Apply Player-related upgrades: 大胃王 (magazine), 好餓好餓 (reload time)
   */
  private onUpgradeSelected(data: { upgradeId: string }): void {
    const upgradeSystem =
      this.systemManager.get<UpgradeSystem>("UpgradeSystem");
    const state = upgradeSystem.getState();

    // Apply 大胃王 upgrade (magazine capacity)
    if (data.upgradeId === "bigEater") {
      const newCapacity =
        PLAYER_CONFIG.magazineCapacity + (state.magazineMultiplier - 1);
      this.player.updateMagazineCapacity(newCapacity);
    }

    // Apply 好餓好餓 upgrade (reload time reduction)
    if (data.upgradeId === "veryHungry") {
      this.player.setReloadTimeReduction(state.reloadTimeReduction);
    }
  }

  /**
   * Reset game scene for restart
   * Clears all entities and resets to wave 1
   */
  public reset(): void {
    // Clear all entities
    this.enemies.forEach((enemy) => {
      this.enemiesContainer.removeChild(enemy.sprite);
    });
    this.bullets.forEach((bullet) => {
      this.bulletsContainer.removeChild(bullet.sprite);
    });
    this.foods.forEach((food) => {
      this.foodsContainer.removeChild(food.sprite);
    });

    this.enemies = [];
    this.bullets = [];
    this.foods = [];

    // Reset player
    this.playerContainer.removeChild(this.player.sprite);
    this.player = new Player(new Vector(960, 540));
    this.playerContainer.addChild(this.player.sprite);

    // Reset booth system
    const boothSystem = this.systemManager.get<BoothSystem>("BoothSystem");
    boothSystem.reset();

    // Reset wave system and start wave 1
    const waveSystem = this.systemManager.get<WaveSystem>("WaveSystem");
    waveSystem.reset();

    // Reset upgrade system (SPEC § 2.3.4)
    const upgradeSystem =
      this.systemManager.get<UpgradeSystem>("UpgradeSystem");
    upgradeSystem.reset();

    // Hide upgrade screen if visible
    this.upgradeScreen.hide();
    this.isPaused = false;
    this.pendingWaveNumber = 0;

    // Reset game state (includes statistics, kills, wave, combat)
    this.gameState.reset();

    // Start wave 1
    waveSystem.startWave(1);
  }
}
