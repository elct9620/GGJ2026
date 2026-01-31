import { Container, Text, Graphics } from "pixi.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../utils/constants";

/**
 * Start Screen
 * Spec: § 2.4.2 User Journey - 遊戲開始
 *
 * Displays game title and instructions to start the game
 */
export class StartScreen {
  private container: Container;
  private onStart: () => void;
  private isListening: boolean = false;

  constructor(onStart: () => void) {
    this.onStart = onStart;
    this.container = new Container();
    this.setupUI();
  }

  private setupUI(): void {
    // Background overlay
    const background = new Graphics();
    background.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    background.fill({ color: 0x1a1a1a, alpha: 0.95 });
    this.container.addChild(background);

    // Game Title
    const title = new Text({
      text: "夜市防衛戰\nNight Market Defense",
      style: {
        fontFamily: "Arial",
        fontSize: 72,
        fill: 0xffffff,
        align: "center",
        fontWeight: "bold",
      },
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 150);
    this.container.addChild(title);

    // Subtitle (Theme)
    const subtitle = new Text({
      text: 'Global Game Jam 2026 - 主題：「Mask」',
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xaaaaaa,
        align: "center",
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    this.container.addChild(subtitle);

    // Instructions
    const instructions = new Text({
      text: "按 Space 開始遊戲\nPress Space to Start",
      style: {
        fontFamily: "Arial",
        fontSize: 32,
        fill: 0x00ff00,
        align: "center",
      },
    });
    instructions.anchor.set(0.5);
    instructions.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    this.container.addChild(instructions);

    // Controls hint
    const controls = new Text({
      text: "操作說明：WASD 移動 | Space 射擊 | 1/2/3 提取食材",
      style: {
        fontFamily: "Arial",
        fontSize: 20,
        fill: 0xcccccc,
        align: "center",
      },
    });
    controls.anchor.set(0.5);
    controls.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    this.container.addChild(controls);
  }

  public getContainer(): Container {
    return this.container;
  }

  public show(): void {
    this.container.visible = true;
    this.startListening();
  }

  public hide(): void {
    this.container.visible = false;
    this.stopListening();
  }

  private handleKeyPress = (event: KeyboardEvent): void => {
    if (event.code === "Space") {
      this.onStart();
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
