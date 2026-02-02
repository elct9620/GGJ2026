import { Container, Text, Graphics } from "pixi.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../utils/constants";
import { GAME_FONT_FAMILY } from "../core/assets";
import type { UpgradeOption } from "../systems/upgrade";
import type { EventQueue } from "../systems/event-queue";
import { EventType } from "../systems/event-queue";
import { BaseScreen } from "./base-screen";

/** Card style configuration */
interface CardStyle {
  bg: number;
  border: number;
  borderWidth: number;
}

/**
 * Upgrade Selection Screen
 * Spec: § 2.3.4 - 回合間升級選擇畫面
 *
 * Displays upgrade options between waves
 * Players select by clicking on upgrade cards
 */
export class UpgradeScreen extends BaseScreen {
  // Card dimension constants
  private static readonly CARD_WIDTH = 400;
  private static readonly CARD_HEIGHT = 200;
  private static readonly CARD_BORDER_RADIUS = 16;
  private static readonly CARD_GAP = 100;

  // Card style presets
  private static readonly CARD_STYLES: Record<"normal" | "hover", CardStyle> = {
    normal: { bg: 0x2a2a2a, border: 0xffd700, borderWidth: 3 },
    hover: { bg: 0x3a3a3a, border: 0xffff00, borderWidth: 4 },
  };

  private onSelect: (upgradeId: string) => void;
  private optionsContainer: Container;
  private currentOptions: UpgradeOption[] = [];
  private optionCards: Container[] = [];
  private eventQueue: EventQueue | null;

  constructor(onSelect: (upgradeId: string) => void, eventQueue?: EventQueue) {
    super();
    this.onSelect = onSelect;
    this.eventQueue = eventQueue ?? null;
    this.optionsContainer = new Container();
    this.setupUI();
  }

  private setupUI(): void {
    // Background overlay (using BaseScreen helper)
    const background = this.createBackground(0x000000, 0.85);
    this.container.addChild(background);

    // Title
    const title = new Text({
      text: "選擇升級\nChoose Upgrade",
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 48,
        fill: 0xffd700,
        align: "center",
      },
    });
    title.anchor.set(0.5);
    title.position.set(CANVAS_WIDTH / 2, 150);
    this.container.addChild(title);

    // Instructions (SPEC § 2.3.4: 點選選擇)
    const instructions = new Text({
      text: "點選升級項目\nClick to select",
      style: {
        fontFamily: GAME_FONT_FAMILY,
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

  public showWithOptions(options: UpgradeOption[]): void {
    this.currentOptions = options;
    this.updateOptions();
    super.show();
  }

  public override hide(): void {
    this.cleanupCards();
    super.hide();
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

    const { CARD_WIDTH, CARD_HEIGHT, CARD_GAP } = UpgradeScreen;
    const totalWidth =
      this.currentOptions.length * CARD_WIDTH +
      (this.currentOptions.length - 1) * CARD_GAP;
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    this.currentOptions.forEach((option, index) => {
      const optionContainer = this.createOptionCard(option);
      optionContainer.position.set(
        startX + index * (CARD_WIDTH + CARD_GAP),
        CANVAS_HEIGHT / 2 - CARD_HEIGHT / 2,
      );
      this.optionsContainer.addChild(optionContainer);
      this.optionCards.push(optionContainer);
    });
  }

  /**
   * Draw card background with specified style
   */
  private drawCardBackground(bg: Graphics, style: "normal" | "hover"): void {
    const { CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS, CARD_STYLES } =
      UpgradeScreen;
    const { bg: bgColor, border, borderWidth } = CARD_STYLES[style];

    bg.clear();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS);
    bg.fill({ color: bgColor });
    bg.stroke({ color: border, width: borderWidth });
  }

  private createOptionCard(option: UpgradeOption): Container {
    const card = new Container();

    // Make card interactive for click events
    card.eventMode = "static";
    card.cursor = "pointer";

    // Card background
    const bg = new Graphics();
    this.drawCardBackground(bg, "normal");
    card.addChild(bg);

    // Option name (SPEC § 2.3.4: 顯示升級效果)
    const nameText = new Text({
      text: option.name,
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 36,
        fill: 0xffffff,
      },
    });
    nameText.position.set(20, 20);
    card.addChild(nameText);

    // Option description (SPEC § 2.3.4: 顯示升級效果)
    const descText = new Text({
      text: option.description,
      style: {
        fontFamily: GAME_FONT_FAMILY,
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
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 18,
        fill: 0x6bff6b,
      },
    });
    freeText.position.set(20, 160);
    card.addChild(freeText);

    // Click handler
    card.on("pointerdown", () => {
      // Publish ButtonClicked event for audio system
      if (this.eventQueue) {
        this.eventQueue.publish(EventType.ButtonClicked, {});
      }
      this.onSelect(option.id);
    });

    // Hover effects
    card.on("pointerover", () => {
      this.drawCardBackground(bg, "hover");
    });

    card.on("pointerout", () => {
      this.drawCardBackground(bg, "normal");
    });

    return card;
  }

  public override destroy(): void {
    this.cleanupCards();
    super.destroy();
  }
}
