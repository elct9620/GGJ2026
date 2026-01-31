import { Container, Graphics, Text } from "pixi.js";
import { SystemPriority } from "../core/systems/system.interface";
import type { ISystem } from "../core/systems/system.interface";

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
  private synthesisText: Text;
  private reloadText: Text;

  constructor() {
    this.topHUD = new Container();
    this.bottomHUD = new Container();

    this.waveText = this.createText("Wave: 1", 20, 20);
    this.enemyCountText = this.createText("Enemies: 0", 200, 20);
    this.healthDisplay = new Graphics();

    this.ammoText = this.createText("Ammo: 6/6", 20, 1020);
    this.synthesisText = this.createText("Synthesis: 0/3", 200, 1020);
    this.reloadText = this.createText("", 400, 1020);

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

    // Bottom HUD (§ 2.7.3 - Ammo, Synthesis Slot)
    this.bottomHUD.addChild(this.ammoText);
    this.bottomHUD.addChild(this.synthesisText);
    this.bottomHUD.addChild(this.reloadText);
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
   * Update synthesis slot display
   */
  public updateSynthesis(count: number): void {
    this.synthesisText.text = `Synthesis: ${count}/3`;
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
