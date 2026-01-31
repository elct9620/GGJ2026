import { Container, Text, Graphics } from "pixi.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../utils/constants";
import type { UpgradeOption } from "../systems/upgrade";

/**
 * Upgrade Selection Screen
 * Spec: § 2.3.4 - 回合間升級選擇畫面
 *
 * Displays upgrade options between waves
 * Players select by clicking on upgrade cards
 */
export class UpgradeScreen {
  private container: Container;
  private onSelect: (upgradeId: string) => void;
  private optionsContainer: Container;
  private currentOptions: UpgradeOption[] = [];
  private optionCards: Container[] = [];

  constructor(onSelect: (upgradeId: string) => void) {
    this.onSelect = onSelect;
    this.container = new Container();
    this.optionsContainer = new Container();
    this.container.visible = false;
    this.setupUI();
  }

  private setupUI(): void {
    // Background overlay
    const background = new Graphics();
    background.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    background.fill({ color: 0x000000, alpha: 0.85 });
    this.container.addChild(background);

    // Title
    const title = new Text({
      text: "選擇升級\nChoose Upgrade",
      style: {
        fontFamily: "Arial",
        fontSize: 48,
        fill: 0xffd700,
        align: "center",
        fontWeight: "bold",
      },
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS_WIDTH / 2, 150);
    this.container.addChild(title);

    // Instructions (SPEC § 2.3.4: 點選選擇)
    const instructions = new Text({
      text: "點選升級項目\nClick to select",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xaaaaaa,
        align: "center",
      },
    });
    instructions.anchor.set(0.5);
    instructions.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    this.container.addChild(instructions);

    // Options container (will be populated when shown)
    this.container.addChild(this.optionsContainer);
  }

  public getContainer(): Container {
    return this.container;
  }

  public show(options: UpgradeOption[]): void {
    this.currentOptions = options;
    this.updateOptions();
    this.container.visible = true;
  }

  public hide(): void {
    this.container.visible = false;
    this.cleanupCards();
  }

  private cleanupCards(): void {
    // Remove event listeners from cards
    this.optionCards.forEach((card) => {
      card.removeAllListeners();
    });
    this.optionCards = [];
  }

  private updateOptions(): void {
    // Clear previous options
    this.cleanupCards();
    this.optionsContainer.removeChildren();

    const optionWidth = 400;
    const optionHeight = 200;
    const gap = 100;
    const totalWidth =
      this.currentOptions.length * optionWidth +
      (this.currentOptions.length - 1) * gap;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    this.currentOptions.forEach((option, index) => {
      const optionContainer = this.createOptionCard(option, index);
      optionContainer.position.set(
        startX + index * (optionWidth + gap),
        CANVAS_HEIGHT / 2 - optionHeight / 2,
      );
      this.optionsContainer.addChild(optionContainer);
      this.optionCards.push(optionContainer);
    });
  }

  private createOptionCard(option: UpgradeOption, _index: number): Container {
    const card = new Container();

    // Make card interactive for click events
    card.eventMode = "static";
    card.cursor = "pointer";

    // Card background
    const bg = new Graphics();
    bg.roundRect(0, 0, 400, 200, 16);
    bg.fill({ color: 0x2a2a2a });
    bg.stroke({ color: 0xffd700, width: 3 });
    card.addChild(bg);

    // Option name (SPEC § 2.3.4: 顯示升級效果)
    const nameText = new Text({
      text: option.name,
      style: {
        fontFamily: "Arial",
        fontSize: 36,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    nameText.position.set(20, 20);
    card.addChild(nameText);

    // Option description (SPEC § 2.3.4: 顯示升級效果)
    const descText = new Text({
      text: option.description,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xcccccc,
        wordWrap: true,
        wordWrapWidth: 360,
      },
    });
    descText.position.set(20, 80);
    card.addChild(descText);

    // Free upgrade indicator (SPEC § 2.3.4: 無消耗)
    const freeText = new Text({
      text: "免費升級",
      style: {
        fontFamily: "Arial",
        fontSize: 18,
        fill: 0x6bff6b,
      },
    });
    freeText.position.set(20, 160);
    card.addChild(freeText);

    // Click handler
    card.on("pointerdown", () => {
      this.onSelect(option.id);
    });

    // Hover effects
    card.on("pointerover", () => {
      bg.clear();
      bg.roundRect(0, 0, 400, 200, 16);
      bg.fill({ color: 0x3a3a3a });
      bg.stroke({ color: 0xffff00, width: 4 });
    });

    card.on("pointerout", () => {
      bg.clear();
      bg.roundRect(0, 0, 400, 200, 16);
      bg.fill({ color: 0x2a2a2a });
      bg.stroke({ color: 0xffd700, width: 3 });
    });

    return card;
  }

  public destroy(): void {
    this.cleanupCards();
    this.container.destroy({ children: true });
  }
}
