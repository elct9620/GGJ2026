import { Container } from "pixi.js";
import { Player } from "./entities/player";
import { Enemy, EnemyType } from "./entities/enemy";
import { Bullet } from "./entities/bullet";
import { Food, FoodType, getBoothIdForFood } from "./entities/booth";
import { InputSystem } from "./systems/input";
import { HUDSystem, type RecipeStatus } from "./systems/hud";
import { BoothSystem } from "./systems/booth";
import { BoxSystem } from "./systems/box";
import { CombatSystem, SpecialBulletType } from "./systems/combat";
import { SynthesisSystem } from "./systems/synthesis";
import { KillCounterSystem } from "./systems/kill-counter";
import { WaveSystem } from "./systems/wave";
import { UpgradeSystem } from "./systems/upgrade";
import { EventQueue, EventType } from "./systems/event-queue";
import { SystemManager } from "./core/systems/system-manager";
import { Vector } from "./values/vector";
import { RECIPES } from "./values/recipes";
import { RECIPE_CONFIG } from "./config";
import type { GameStats } from "./core/game-state";

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

  // Containers for rendering
  private playerContainer: Container;
  private enemiesContainer: Container;
  private bulletsContainer: Container;
  private foodsContainer: Container;
  private boothContainer: Container;
  private uiLayer: Container;

  // Game state (now managed by Wave System)

  // Game statistics (Spec: § 2.8.2)
  private stats: GameStats = {
    wavesSurvived: 0,
    enemiesDefeated: 0,
    specialBulletsUsed: 0,
  };

  // Game over callback
  private onGameOver: ((stats: GameStats) => void) | null = null;

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

    // Provide dependencies for InjectableSystem instances (before initialize)
    this.systemManager.provideDependency("EventQueue", eventQueue);
    this.systemManager.provideDependency("InputSystem", inputSystem);
    this.systemManager.provideDependency("BoothSystem", boothSystem);
    this.systemManager.provideDependency(
      "KillCounterSystem",
      killCounterSystem,
    );

    this.systemManager.initialize();

    // Subscribe to EnemyDeath event for food drops
    eventQueue.subscribe(EventType.EnemyDeath, this.onEnemyDeath.bind(this));

    // Subscribe to WaveStart for HUD updates
    eventQueue.subscribe(EventType.WaveStart, this.onWaveStart.bind(this));

    // Subscribe to WaveComplete for next wave (SPEC § 2.3.5)
    // TODO: Add upgrade UI before enabling upgrade system
    eventQueue.subscribe(
      EventType.WaveComplete,
      this.onWaveComplete.bind(this),
    );

    // Initialize player at center of playable area
    this.player = new Player(new Vector(960, 540)); // Center of 1920×1080
    this.playerContainer.addChild(this.player.sprite);

    // Connect Combat System with game entities (entity references - not injectable)
    combatSystem.setPlayer(this.player);
    combatSystem.setBullets(this.bullets);
    combatSystem.setEnemies(this.enemies);
    combatSystem.subscribeToEvents(); // Subscribe after dependencies injected

    // Connect Box System with enemies (entity reference - not injectable)
    boxSystem.setEnemies(this.enemies);

    // Setup booth visualization
    this.boothContainer.addChild(boothSystem.getContainer());

    // Setup box visualization (SPEC § 2.3.7)
    this.boothContainer.addChild(boxSystem.getContainer());

    // Setup HUD
    const hudSystem = this.systemManager.get<HUDSystem>("HUDSystem");
    this.uiLayer.addChild(hudSystem.getTopHUD());
    this.uiLayer.addChild(hudSystem.getBottomHUD());

    // Connect Wave System spawn callback (SPEC § 2.3.5)
    waveSystem.setSpawnCallback(this.spawnEnemy.bind(this));

    // Start wave 1 (SPEC § 2.3.5)
    waveSystem.startWave(1);
  }

  /**
   * Spawn enemy (callback from Wave System)
   * SPEC § 2.3.5: Wave System calls this to create enemies
   * SPEC § 2.6.2: Supports Ghost, RedGhost, GreenGhost, BlueGhost, Boss
   */
  private spawnEnemy(
    type: "Ghost" | "RedGhost" | "GreenGhost" | "BlueGhost" | "Boss",
    x: number,
    y: number,
  ): void {
    const enemyType = EnemyType[type];
    const enemy = new Enemy(enemyType, new Vector(x, y));
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

    // Handle shooting (delegated to Combat System)
    if (inputSystem.isShootPressed()) {
      if (combatSystem.shoot()) {
        this.spawnBullet();
      }
    }

    // Synthesis is now handled by SynthesisSystem (SPEC § 2.3.3)
    // No manual booth interactions needed
  }

  /**
   * Spawn bullet(s) based on current buff (SPEC § 2.3.3)
   * - BubbleTea: 3-way spread (+2 bullets at ±15°)
   * - BloodCake: Tracking bullet toward nearest enemy
   * - Others: Normal single bullet moving right
   */
  private spawnBullet(): void {
    const combatSystem = this.systemManager.get<CombatSystem>("CombatSystem");
    const currentBuff = combatSystem.getCurrentBuff();

    if (currentBuff === SpecialBulletType.BubbleTea) {
      this.spawnBubbleTeaBullets();
    } else if (currentBuff === SpecialBulletType.BloodCake) {
      this.spawnTrackingBullet();
    } else {
      this.spawnNormalBullet();
    }
  }

  /**
   * Spawn normal bullet moving right
   */
  private spawnNormalBullet(): void {
    const bullet = new Bullet(this.player.position, new Vector(1, 0));
    this.bullets.push(bullet);
    this.bulletsContainer.addChild(bullet.sprite);
  }

  /**
   * Spawn BubbleTea spread bullets (SPEC § 2.3.3)
   * Creates 3 bullets: center + 2 at ±15° angles
   */
  private spawnBubbleTeaBullets(): void {
    const extraBullets = RECIPE_CONFIG.bubbleTea.extraBullets;
    const spreadAngle = 15; // degrees

    // Center bullet
    this.spawnNormalBullet();

    // Extra spread bullets
    for (let i = 0; i < extraBullets; i++) {
      const angleOffset = i % 2 === 0 ? spreadAngle : -spreadAngle;
      const radians = (angleOffset * Math.PI) / 180;
      const direction = new Vector(Math.cos(radians), Math.sin(radians));
      const bullet = new Bullet(this.player.position, direction);
      this.bullets.push(bullet);
      this.bulletsContainer.addChild(bullet.sprite);
    }
  }

  /**
   * Spawn BloodCake tracking bullet (SPEC § 2.3.3)
   * Tracks the nearest enemy
   */
  private spawnTrackingBullet(): void {
    const bullet = new Bullet(this.player.position, new Vector(1, 0));

    // Find nearest enemy to track
    const target = this.findNearestEnemy();
    if (target) {
      bullet.setTracking(target);
    }

    this.bullets.push(bullet);
    this.bulletsContainer.addChild(bullet.sprite);
  }

  /**
   * Find the nearest active enemy to the player
   */
  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let minDistance = Infinity;

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      const distance = this.player.position.distance(enemy.position);
      if (distance < minDistance) {
        nearest = enemy;
        minDistance = distance;
      }
    }

    return nearest;
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
    this.stats.enemiesDefeated++;
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
    hudSystem.updateScore(this.stats.enemiesDefeated * 10);
  }

  /**
   * Update bottom HUD (recipes)
   */
  private updateBottomHUD(
    hudSystem: HUDSystem,
    boothSystem: BoothSystem,
    killCounterSystem: KillCounterSystem,
  ): void {
    // Recipe availability display
    const recipes = this.getRecipeStatuses(boothSystem, killCounterSystem);
    hudSystem.updateRecipeAvailability(recipes);
  }

  /**
   * Get recipe availability statuses for HUD display
   */
  private getRecipeStatuses(
    boothSystem: BoothSystem,
    killCounterSystem: KillCounterSystem,
  ): RecipeStatus[] {
    return Object.values(RECIPES).map((recipe) => ({
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
    }));
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
    if (this.player.health <= 0 && this.onGameOver) {
      this.onGameOver(this.stats);
    }
  }

  /**
   * Handle wave completion event (SPEC § 2.3.6)
   * Start next wave directly (upgrade system disabled until UI implemented)
   */
  private onWaveComplete(data: { waveNumber: number }): void {
    // Update statistics - track waves survived (Spec: § 2.8.2)
    this.stats.wavesSurvived = data.waveNumber;

    // Start next wave directly (SPEC § 2.3.5)
    // TODO: Enable upgrade selection when UI is ready
    const waveSystem = this.systemManager.get<WaveSystem>("WaveSystem");
    waveSystem.startWave(data.waveNumber + 1);
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

    // Reset statistics
    this.stats = {
      wavesSurvived: 0,
      enemiesDefeated: 0,
      specialBulletsUsed: 0,
    };

    // Start wave 1
    waveSystem.startWave(1);
  }
}
