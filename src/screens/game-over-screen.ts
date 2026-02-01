import { Container, Text, Graphics } from "pixi.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../utils/constants";
import { GAME_FONT_FAMILY } from "../core/assets";
import type { GameStats } from "../core/game-state";

/**
 * Game Over Screen
 * Spec: § 2.8.2 Defeat Condition - 遊戲結束行為
 *
 * Displays game statistics and options to restart or quit
 */
export class GameOverScreen {
  private container: Container;
  private onRestart: () => void;
  private statsText: Text | null = null;
  private isListening: boolean = false;

  constructor(onRestart: () => void) {
    this.onRestart = onRestart;
    this.container = new Container();
    this.container.visible = false; // Initially hidden
    this.setupUI();
  }

  private setupUI(): void {
    // Background overlay
    const background = new Graphics();
    background.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    background.fill({ color: 0x000000, alpha: 0.85 });
    this.container.addChild(background);

    // Game Over Title
    const title = new Text({
      text: "遊戲結束\nGAME OVER",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 64,
        fill: 0xff0000,
        align: "center",
      },
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 200);
    this.container.addChild(title);

    // Statistics (will be updated when shown)
    this.statsText = new Text({
      text: "",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 28,
        fill: 0xffffff,
        align: "center",
        lineHeight: 45,
      },
    });
    this.statsText.anchor.set(0.5);
    this.statsText.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.container.addChild(this.statsText);

    // Restart instructions
    const restartText = new Text({
      text: "按 Space 重新開始\nPress Space to Restart",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 32,
        fill: 0x00ff00,
        align: "center",
      },
    });
    restartText.anchor.set(0.5);
    restartText.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 150);
    this.container.addChild(restartText);
  }

  public getContainer(): Container {
    return this.container;
  }

  public show(stats: GameStats): void {
    this.updateStats(stats);
    this.container.visible = true;
    this.startListening();
  }

  public hide(): void {
    this.container.visible = false;
    this.stopListening();
  }

  /**
   * Updates the statistics display
   * Spec: § 2.8.2 - Display: 存活回合數、擊敗敵人總數、使用特殊子彈次數
   */
  private updateStats(stats: GameStats): void {
    if (this.statsText) {
      const statsLines = [
        `存活回合數：${stats.wavesSurvived}`,
        `擊敗敵人總數：${stats.enemiesDefeated}`,
        `使用特殊子彈次數：${stats.specialBulletsUsed}`,
        "",
        `Waves Survived: ${stats.wavesSurvived}`,
        `Enemies Defeated: ${stats.enemiesDefeated}`,
        `Special Bullets Used: ${stats.specialBulletsUsed}`,
      ];
      this.statsText.text = statsLines.join("\n");
    }
  }

  private handleKeyPress = (event: KeyboardEvent): void => {
    if (event.code === "Space") {
      this.onRestart();
    }
  };

  private startListening(): void {
    if (!this.isListening) {
      window.addEventListener("keydown", this.handleKeyPress);
      this.isListening = true;
    }
  }

  private stopListening(): void {
    if (this.isListening) {
      window.removeEventListener("keydown", this.handleKeyPress);
      this.isListening = false;
    }
  }

  public destroy(): void {
    this.stopListening();
    this.container.destroy({ children: true });
  }
}
