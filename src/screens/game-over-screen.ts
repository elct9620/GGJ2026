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
  private onQuit?: () => void;
  private statsText: Text | null = null;
  private isListening: boolean = false;

  constructor(onRestart: () => void, onQuit?: () => void) {
    this.onRestart = onRestart;
    this.onQuit = onQuit;
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

    // Layout calculation (CANVAS_HEIGHT = 1080, center = 540)
    // Title: 2 lines × 72px ≈ 173px height
    // Stats: 7 lines × 44px lineHeight ≈ 308px height
    // Restart: 2 lines × 36px ≈ 86px height
    // Quit: 2 lines × 28px ≈ 67px height

    // Game Over Title (Y = 160, range: ~73 to ~247)
    const title = new Text({
      text: "遊戲結束\nGAME OVER",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 72,
        fill: 0xff0000,
        align: "center",
      },
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS_WIDTH / 2, 160);
    this.container.addChild(title);

    // Statistics (Y = 480, range: ~326 to ~634)
    this.statsText = new Text({
      text: "",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 28,
        fill: 0xffffff,
        align: "center",
        lineHeight: 44,
      },
    });
    this.statsText.anchor.set(0.5);
    this.statsText.position.set(CANVAS_WIDTH / 2, 480);
    this.container.addChild(this.statsText);

    // Restart instructions (Y = 780, range: ~737 to ~823)
    const restartText = new Text({
      text: "按 Space 重新開始\nPress Space to Restart",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 36,
        fill: 0x00ff00,
        align: "center",
      },
    });
    restartText.anchor.set(0.5);
    restartText.position.set(CANVAS_WIDTH / 2, 780);
    this.container.addChild(restartText);

    // Quit instructions (Y = 920, range: ~886 to ~954)
    const quitText = new Text({
      text: "按 Escape 結束遊戲\nPress Escape to Quit",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 28,
        fill: 0xaaaaaa,
        align: "center",
      },
    });
    quitText.anchor.set(0.5);
    quitText.position.set(CANVAS_WIDTH / 2, 920);
    this.container.addChild(quitText);
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
    } else if (event.code === "Escape" && this.onQuit) {
      this.onQuit();
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
