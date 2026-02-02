import { Text } from "pixi.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../utils/constants";
import { GAME_FONT_FAMILY } from "../core/assets";
import { BaseScreen } from "./base-screen";

/**
 * Start Screen
 * Spec: § 2.4.2 User Journey - 遊戲開始
 *
 * Displays game title and instructions to start the game
 */
export class StartScreen extends BaseScreen {
  private onStart: () => void;

  constructor(onStart: () => void) {
    super();
    this.onStart = onStart;
    this.setupUI();
  }

  private setupUI(): void {
    // Background overlay
    const background = this.createBackground(0x1a1a1a, 0.95);
    this.container.addChild(background);

    // Game Title
    const title = new Text({
      text: "反擊吧！攤位防衛戰\nBite Back! The Booth Defense",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 72,
        fill: 0xffffff,
        align: "center",
      },
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 200);
    this.container.addChild(title);

    // Subtitle (Theme)
    const subtitle = new Text({
      text: "Global Game Jam 2026 - 主題：「Mask」",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 28,
        fill: 0xaaaaaa,
        align: "center",
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
    this.container.addChild(subtitle);

    // Instructions
    const instructions = new Text({
      text: "按 Space 開始遊戲\nPress Space to Start",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 36,
        fill: 0x00ff00,
        align: "center",
      },
    });
    instructions.anchor.set(0.5);
    instructions.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    this.container.addChild(instructions);

    // Controls hint (SPEC § 2.4.2: 1-5 觸發特殊子彈)
    const controls = new Text({
      text: "操作說明：WASD 移動 | Space 射擊 | 1-5 觸發特殊子彈",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 24,
        fill: 0xcccccc,
        align: "center",
      },
    });
    controls.anchor.set(0.5);
    controls.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    this.container.addChild(controls);
  }

  protected override handleKeyPress(event: KeyboardEvent): void {
    if (event.code === "Space") {
      this.onStart();
    }
  }
}
