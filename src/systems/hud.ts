import { Container, Sprite, Text } from "pixi.js";
import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import { getTexture, AssetKeys, GAME_FONT_FAMILY } from "../core/assets";
import { CANVAS_HEIGHT, CANVAS_WIDTH, LAYOUT } from "../utils/constants";
import { RECIPE_DISPLAY, FOOD_HUD_COLOR } from "../values/recipes";

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
 *
 * Based on ui_rough_pixelSpec.png reference:
 * - Top HUD (1920×86px): enemy count (left), wave info (center), score (right)
 * - Bottom HUD Left (550×126px): upgrade icons (5× 88×88px)
 * - Bottom HUD Center (820×126px): skill buttons with keyBindTip (5× 46×46px)
 * - Bottom HUD Right (550×126px): key binding instructions
 */
export class HUDSystem extends InjectableSystem {
  public readonly name = "HUDSystem";
  public readonly priority = SystemPriority.HUD;
  private topHUD: Container;
  private bottomHUD: Container;

  // Top HUD elements
  private enemyCountText: Text;
  private waveText: Text;
  private scoreText: Text;

  // Bottom HUD elements
  private killCountText: Text;

  // Bottom HUD base sprites
  private upgradeBaseSprite: Sprite;
  private bulletClassBaseSprite: Sprite;
  private keyBindSprite: Sprite;

  // Bottom HUD icons
  private upgradeIcons: Sprite[] = [];
  private skillKeyTips: Sprite[] = [];
  private skillCostIndicators: Sprite[][] = [];

  constructor() {
    super();
    this.topHUD = new Container();
    this.bottomHUD = new Container();

    // Top HUD text elements (SPEC § 2.7.3: 86px height)
    // Based on ui_rough_pixelSpec.png layout:
    // - Center-top: "剩餘敵人:20" 50px font
    // - Center-bottom: "餓鬼人潮:1/3" 33px font (512×56px area)
    // - Right: "分數:9999" 50px font

    // Center-top: "剩餘敵人:20" - 50px font
    this.enemyCountText = this.createText(
      "剩餘敵人: 0",
      CANVAS_WIDTH / 2 - 100,
      10,
      50,
    );

    // Center-bottom: "餓鬼人潮:1/3" (512×56px area) - 33px font
    this.waveText = this.createText(
      "餓鬼人潮: 1/1",
      CANVAS_WIDTH / 2 - 80,
      50,
      33,
    );

    // Right: "分數:9999" - 50px font (right-aligned to prevent overflow)
    this.scoreText = this.createText("分數: 0", CANVAS_WIDTH - 20, 10, 50);
    this.scoreText.anchor.set(1, 0); // Right-align

    // Create bottom UI base sprites
    this.upgradeBaseSprite = this.createUpgradeBaseSprite();
    this.bulletClassBaseSprite = this.createBulletClassBaseSprite();
    this.keyBindSprite = this.createKeyBindSprite();

    // Bottom HUD text (SPEC § 2.7.3: Kill Counter display)
    // Position: Right section of bottom HUD (keyBind area)
    const killCountY = CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT + 50;
    this.killCountText = this.createText("擊殺: 0/20", 1420, killCountY);

    this.setupHUD();
  }

  private createUpgradeBaseSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.upgradeBase));
    sprite.width = 550;
    sprite.height = LAYOUT.BOTTOM_HUD_HEIGHT;
    sprite.position.set(0, CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT);
    return sprite;
  }

  private createBulletClassBaseSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.bulletClassBase));
    sprite.width = 820;
    sprite.height = LAYOUT.BOTTOM_HUD_HEIGHT;
    sprite.position.set(550, CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT);
    return sprite;
  }

  private createKeyBindSprite(): Sprite {
    const sprite = new Sprite(getTexture(AssetKeys.keyBind));
    sprite.width = 550;
    sprite.height = LAYOUT.BOTTOM_HUD_HEIGHT;
    sprite.position.set(1370, CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT);
    return sprite;
  }

  /**
   * Initialize HUD system (ISystem lifecycle)
   */
  public initialize(): void {
    // HUD is already set up in constructor
  }

  /**
   * Update method (ISystem lifecycle)
   */
  public update(_deltaTime: number): void {
    // HUD updates are event-driven via update* methods
  }

  /**
   * Clean up HUD resources (ISystem lifecycle)
   */
  public destroy(): void {
    this.topHUD.destroy({ children: true });
    this.bottomHUD.destroy({ children: true });
  }

  private createText(
    content: string,
    x: number,
    y: number,
    fontSize: number = 50,
  ): Text {
    const text = new Text({
      text: content,
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize,
        fill: 0xffffff,
      },
    });
    text.position.set(x, y);
    return text;
  }

  private setupHUD(): void {
    // Top HUD
    this.topHUD.addChild(this.enemyCountText);
    this.topHUD.addChild(this.waveText);
    this.topHUD.addChild(this.scoreText);

    // Bottom HUD base sprites
    this.bottomHUD.addChild(this.upgradeBaseSprite);
    this.bottomHUD.addChild(this.bulletClassBaseSprite);
    this.bottomHUD.addChild(this.keyBindSprite);

    // Bottom HUD text elements
    this.bottomHUD.addChild(this.killCountText);

    // Add upgrade icons to left section
    this.setupUpgradeIcons();

    // Add skill key tips and cost indicators to center section
    this.setupSkillButtons();
  }

  /**
   * Setup upgrade icons in the upgradeBase area (550×126px)
   * 5 icons of 88×88px each
   * Layout: 40px left margin, 7px gap between icons
   */
  private setupUpgradeIcons(): void {
    const bottomY = CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT;
    const { LEFT_MARGIN, ICON_SIZE, ICON_GAP } = LAYOUT.UPGRADE_SECTION;
    const iconCount = 5;
    const iconOffsetY = (LAYOUT.BOTTOM_HUD_HEIGHT - ICON_SIZE) / 2; // Center vertically

    for (let i = 0; i < iconCount; i++) {
      const icon = new Sprite(getTexture(AssetKeys.upgradeIcon));
      icon.width = ICON_SIZE;
      icon.height = ICON_SIZE;

      // Position with left margin and gap
      const x = LEFT_MARGIN + i * (ICON_SIZE + ICON_GAP);
      const y = bottomY + iconOffsetY;
      icon.position.set(x, y);

      this.upgradeIcons.push(icon);
      this.bottomHUD.addChild(icon);
    }
  }

  /**
   * Setup skill buttons in the bulletClassBase area (820×126px)
   * Each skill has: btn_skillIcon (116×116px) background, keyBindTip (46×46px), cost indicators (20×20px)
   * Layout: 30px left margin, 68px gap between buttons
   */
  private setupSkillButtons(): void {
    const bottomY = CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT;
    const buttonCount = 5;
    const {
      BASE_X,
      LEFT_MARGIN,
      BUTTON_GAP,
      BACKGROUND_SIZE,
      BUTTON_SIZE,
      INDICATOR_SIZE,
      KEY_TIP_Y_OFFSET,
      NUMBER_LABEL_X_OFFSET,
      NUMBER_LABEL_Y_OFFSET,
      NUMBER_LABEL_FONT_SIZE,
      INDICATOR_Y_OFFSET,
      INDICATOR_GAP,
      LABEL_FONT_SIZE,
      LABEL_X_OFFSET,
      LABEL_Y_OFFSET,
    } = LAYOUT.SKILL_SECTION;

    const skillIconSize = BACKGROUND_SIZE;
    const keyTipSize = BUTTON_SIZE;
    const costIndicatorSize = INDICATOR_SIZE;

    // Get skill display configs from centralized recipes
    const recipeIds = ["1", "2", "3", "4", "5"];
    const skillLabels = recipeIds.map((id) => RECIPE_DISPLAY[id].label);
    const skillCosts = recipeIds.map((id) => RECIPE_DISPLAY[id].costs.length);
    const skillCostTypes = recipeIds.map((id) =>
      RECIPE_DISPLAY[id].costs.map((foodType) => FOOD_HUD_COLOR[foodType]),
    );

    for (let i = 0; i < buttonCount; i++) {
      // Calculate button center: left margin + half icon size + i * (icon size + gap)
      const buttonCenterX =
        BASE_X +
        LEFT_MARGIN +
        skillIconSize / 2 +
        i * (skillIconSize + BUTTON_GAP);

      // Add skill button background (btn_skillIcon.png 116×116px)
      const skillBg = new Sprite(getTexture(AssetKeys.skillIcon));
      skillBg.width = skillIconSize;
      skillBg.height = skillIconSize;
      const skillBgX = buttonCenterX - skillIconSize / 2;
      const skillBgY = bottomY + (LAYOUT.BOTTOM_HUD_HEIGHT - skillIconSize) / 2;
      skillBg.position.set(skillBgX, skillBgY);
      this.bottomHUD.addChild(skillBg);

      // Create keyBindTip sprite (46×46px) - positioned at top of skill button
      const keyTip = new Sprite(getTexture(AssetKeys.keyBindTip));
      keyTip.width = keyTipSize;
      keyTip.height = keyTipSize;
      const keyTipX = buttonCenterX - keyTipSize / 2;
      const keyTipY = skillBgY + KEY_TIP_Y_OFFSET;
      keyTip.position.set(keyTipX, keyTipY);

      this.skillKeyTips.push(keyTip);
      this.bottomHUD.addChild(keyTip);

      // Add number label on keyBindTip
      const numberLabel = this.createText(
        `${i + 1}`,
        buttonCenterX - NUMBER_LABEL_X_OFFSET,
        keyTipY + NUMBER_LABEL_Y_OFFSET,
        NUMBER_LABEL_FONT_SIZE,
      );
      this.bottomHUD.addChild(numberLabel);

      // Add skill cost indicators below keyBindTip
      const indicators: Sprite[] = [];
      const costCount = skillCosts[i];
      const costTypes = skillCostTypes[i];
      const indicatorY = keyTipY + keyTipSize + INDICATOR_Y_OFFSET;
      const indicatorTotalWidth =
        costCount * costIndicatorSize + (costCount - 1) * INDICATOR_GAP;
      const indicatorStartX = buttonCenterX - indicatorTotalWidth / 2;

      for (let j = 0; j < costCount; j++) {
        const costType = costTypes[j];
        const indicatorKey = this.getSkillTipKey(costType);
        const indicator = new Sprite(getTexture(indicatorKey));
        indicator.width = costIndicatorSize;
        indicator.height = costIndicatorSize;
        indicator.position.set(
          indicatorStartX + j * (costIndicatorSize + INDICATOR_GAP),
          indicatorY,
        );

        indicators.push(indicator);
        this.bottomHUD.addChild(indicator);
      }
      this.skillCostIndicators.push(indicators);

      // For skill 5 (大招), add "×10" text next to indicator
      if (i === 4) {
        const killCountLabel = this.createText(
          "×10",
          indicatorStartX + costIndicatorSize + INDICATOR_GAP,
          indicatorY - NUMBER_LABEL_Y_OFFSET,
          LABEL_FONT_SIZE,
        );
        this.bottomHUD.addChild(killCountLabel);
      }

      // Add skill label below indicators
      const labelY = indicatorY + costIndicatorSize + LABEL_Y_OFFSET;
      const label = this.createText(
        skillLabels[i],
        buttonCenterX - LABEL_X_OFFSET,
        labelY,
        LABEL_FONT_SIZE,
      );
      this.bottomHUD.addChild(label);
    }
  }

  private getSkillTipKey(
    type: number,
  ): "skillTip0" | "skillTip1" | "skillTip2" | "skillTip3" {
    // skillTip_0=gray, skillTip_1=red, skillTip_2=blue, skillTip_3=green
    switch (type) {
      case 0:
        return AssetKeys.skillTip0; // gray
      case 1:
        return AssetKeys.skillTip1; // red
      case 2:
        return AssetKeys.skillTip2; // blue
      case 3:
        return AssetKeys.skillTip3; // green
      default:
        return AssetKeys.skillTip0;
    }
  }

  /**
   * Update wave number display
   */
  public updateWave(wave: number, totalEnemies?: number): void {
    if (totalEnemies !== undefined) {
      this.waveText.text = `餓鬼人潮: ${wave}/${totalEnemies}`;
    } else {
      this.waveText.text = `餓鬼人潮: ${wave}`;
    }
  }

  /**
   * Update enemy count display
   */
  public updateEnemyCount(count: number): void {
    this.enemyCountText.text = `剩餘敵人: ${count}`;
  }

  /**
   * Update score display
   */
  public updateScore(score: number): void {
    this.scoreText.text = `分數: ${score}`;
  }

  /**
   * Update kill counter display
   * SPEC § 2.3.8: UI 顯示當前擊殺總數和蚵仔煎可用狀態
   */
  public updateKillCount(current: number, threshold: number): void {
    this.killCountText.text = `擊殺: ${current}/${threshold}`;
  }

  /**
   * Update recipe availability indicators
   */
  public updateRecipeAvailability(_recipes: RecipeStatus[]): void {
    // Recipe availability visual feedback could be implemented
    // by changing the tint/alpha of skill indicators
  }

  /**
   * Get top HUD container
   */
  public getTopHUD(): Container {
    return this.topHUD;
  }

  /**
   * Get bottom HUD container
   */
  public getBottomHUD(): Container {
    return this.bottomHUD;
  }
}
