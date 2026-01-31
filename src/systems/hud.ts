import { Container, Graphics, Text } from "pixi.js";
import { SystemPriority } from "../core/systems/system.interface";
import type { ISystem } from "../core/systems/system.interface";

/**
 * Recipe status for HUD display
 */
export interface RecipeStatus {
  key: string; // "1"-"5"
  name: string; // Recipe name in Chinese
  available: boolean; // Whether the recipe can be synthesized
}

/**
 * HUD (Heads-Up Display) system for game UI
 * Spec: § 2.7.3 HUD Layout
 */
export class HUDSystem implements ISystem {
  public readonly name = "HUDSystem";
  public readonly priority = SystemPriority.HUD;
  private topHUD: Container;
  private bottomHUD: Container;

  // Top HUD elements
  private waveText: Text;
  private enemyCountText: Text;
  private healthDisplay: Graphics;

  // Bottom HUD elements
  private ammoText: Text;
  private reloadText: Text;
  private foodStockText: Text;
  private killCountText: Text;
  private buffStatusText: Text;
  private recipesDisplay: Graphics;

  constructor() {
    this.topHUD = new Container();
    this.bottomHUD = new Container();

    this.waveText = this.createText("Wave: 1", 20, 20);
    this.enemyCountText = this.createText("Enemies: 0", 200, 20);
    this.healthDisplay = new Graphics();

    this.ammoText = this.createText("Ammo: 6/6", 20, 1020);
    this.reloadText = this.createText("", 200, 1020);
    this.foodStockText = this.createText(
      "Pearl:0 Tofu:0 BloodCake:0",
      400,
      1020,
    );
    this.killCountText = this.createText("Kills: 0", 700, 1020);
    this.buffStatusText = this.createText("", 900, 1020);
    this.recipesDisplay = new Graphics();

    this.setupHUD();
  }

  /**
   * Initialize HUD system (ISystem lifecycle)
   */
  public initialize(): void {
    // HUD is already set up in constructor
    // This method is here for ISystem interface compliance
  }

  /**
   * Update method (ISystem lifecycle)
   * HUD updates are triggered by explicit calls to update* methods
   */
  public update(_deltaTime: number): void {
    // HUD updates are event-driven via update* methods
    // No per-frame update needed
  }

  /**
   * Clean up HUD resources (ISystem lifecycle)
   */
  public destroy(): void {
    this.topHUD.destroy({ children: true });
    this.bottomHUD.destroy({ children: true });
  }

  private createText(content: string, x: number, y: number): Text {
    const text = new Text({
      text: content,
      style: {
        fontFamily: "Arial",
        fontSize: 20,
        fill: 0xffffff,
      },
    });
    text.position.set(x, y);
    return text;
  }

  private setupHUD(): void {
    // Top HUD (§ 2.7.3 - Wave, Enemy Count, Health)
    this.topHUD.addChild(this.waveText);
    this.topHUD.addChild(this.enemyCountText);
    this.topHUD.addChild(this.healthDisplay);
    this.updateHealthDisplay(5); // Initial health

    // Bottom HUD (§ 2.7.3 - Ammo, Food Stock, Kill Count, Buff Status, Recipes)
    this.bottomHUD.addChild(this.ammoText);
    this.bottomHUD.addChild(this.reloadText);
    this.bottomHUD.addChild(this.foodStockText);
    this.bottomHUD.addChild(this.killCountText);
    this.bottomHUD.addChild(this.buffStatusText);
    this.bottomHUD.addChild(this.recipesDisplay);
    this.setupRecipeIndicators();
  }

  /**
   * Update wave number display
   */
  public updateWave(wave: number): void {
    this.waveText.text = `Wave: ${wave}`;
  }

  /**
   * Update enemy count display
   */
  public updateEnemyCount(count: number): void {
    this.enemyCountText.text = `Enemies: ${count}`;
  }

  /**
   * Update health display (hearts)
   */
  public updateHealthDisplay(health: number): void {
    this.healthDisplay.clear();

    const heartSize = 20;
    const heartSpacing = 25;
    const startX = 400;
    const startY = 20;

    for (let i = 0; i < 5; i++) {
      const x = startX + i * heartSpacing;

      if (i < health) {
        // Draw filled heart (red rectangle for prototype)
        this.healthDisplay.rect(x, startY, heartSize, heartSize);
        this.healthDisplay.fill(0xe74c3c); // Red
      } else {
        // Draw empty heart (gray rectangle)
        this.healthDisplay.rect(x, startY, heartSize, heartSize);
        this.healthDisplay.fill(0x7f8c8d); // Gray
      }
    }
  }

  /**
   * Update ammo display
   */
  public updateAmmo(current: number, max: number): void {
    this.ammoText.text = `Ammo: ${current}/${max}`;
  }

  /**
   * Update food stock display with colored text
   */
  public updateFoodStock(pearl: number, tofu: number, bloodCake: number): void {
    this.foodStockText.text = `Pearl:${pearl} Tofu:${tofu} BloodCake:${bloodCake}`;
  }

  /**
   * Update kill count display
   */
  public updateKillCount(count: number): void {
    this.killCountText.text = `Kills: ${count}`;
  }

  /**
   * Update buff status display
   */
  public updateBuffStatus(buffName: string, timeLeft: number): void {
    this.buffStatusText.text = `Buff: ${buffName} (${timeLeft.toFixed(1)}s)`;
  }

  /**
   * Clear buff status display
   */
  public clearBuffStatus(): void {
    this.buffStatusText.text = "";
  }

  /**
   * Setup recipe indicators (5 circles for keys 1-5)
   */
  private setupRecipeIndicators(): void {
    const startX = 1400;
    const startY = 1020;
    const radius = 15;
    const spacing = 40;

    for (let i = 0; i < 5; i++) {
      const x = startX + i * spacing;
      // Draw initial gray circles
      this.recipesDisplay.circle(x, startY, radius);
      this.recipesDisplay.fill(0x7f8c8d); // Gray (unavailable)

      // Add key label
      const keyLabel = this.createText(`${i + 1}`, x - 5, startY + 20);
      this.bottomHUD.addChild(keyLabel);
    }
  }

  /**
   * Update recipe availability indicators
   */
  public updateRecipeAvailability(recipes: RecipeStatus[]): void {
    this.recipesDisplay.clear();

    const startX = 1400;
    const startY = 1020;
    const radius = 15;
    const spacing = 40;

    for (let i = 0; i < recipes.length && i < 5; i++) {
      const x = startX + i * spacing;
      const recipe = recipes[i];

      this.recipesDisplay.circle(x, startY, radius);
      if (recipe.available) {
        this.recipesDisplay.fill(0x27ae60); // Green (available)
      } else {
        this.recipesDisplay.fill(0x7f8c8d); // Gray (unavailable)
      }
    }
  }

  /**
   * Show reload status
   */
  public updateReload(isReloading: boolean, timeLeft: number = 0): void {
    if (isReloading) {
      this.reloadText.text = `Reloading... ${timeLeft.toFixed(1)}s`;
    } else {
      this.reloadText.text = "";
    }
  }

  /**
   * Get top HUD container for adding to stage
   */
  public getTopHUD(): Container {
    return this.topHUD;
  }

  /**
   * Get bottom HUD container for adding to stage
   */
  public getBottomHUD(): Container {
    return this.bottomHUD;
  }
}
