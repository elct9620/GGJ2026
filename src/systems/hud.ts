import { Container, Sprite, Text } from "pixi.js";
import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import { getTexture, AssetKeys, GAME_FONT_FAMILY } from "../core/assets";
import { CANVAS_HEIGHT, CANVAS_WIDTH, LAYOUT } from "../utils/constants";
import { RECIPE_DISPLAY, FOOD_HUD_COLOR } from "../values/recipes";
import { KILL_COUNTER_CONFIG } from "../config";

/**
 * Individual food requirement status
 */
export interface FoodRequirementStatus {
  type: number; // HUD color type: 0=gray, 1=red, 2=blue, 3=green
  collected: boolean; // Whether this food is collected
}

/**
 * Recipe status for HUD display
 */
export interface RecipeStatus {
  key: string; // "1"-"5"
  name: string; // Recipe name in Chinese
  available: boolean; // Whether the recipe can be synthesized
  requirements: FoodRequirementStatus[]; // Individual food requirements with collection status
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
    // Row 1: 剩餘敵人 (center) + 分數 (right) - container height = 86px (full HUD height)
    // Row 2: 餓鬼人潮 (center) - container height = 56px, placed below row 1
    // Container defines the vertical centering range, not a clipping boundary

    // Row 1: container height = 86px (full HUD), text vertically centered
    const row1CenterY = LAYOUT.TOP_HUD_HEIGHT / 2; // 43

    // Row 2: container height = 56px, starts after row 1
    const row2CenterY =
      LAYOUT.TOP_HUD_HEIGHT + LAYOUT.TOP_HUD.WAVE_AREA_HEIGHT / 2; // 86 + 28 = 114

    // Row 1: "剩餘敵人:20" - 50px font, vertically centered in 50px container
    this.enemyCountText = this.createText(
      "剩餘敵人: 0",
      CANVAS_WIDTH / 2,
      row1CenterY,
      LAYOUT.TOP_HUD.FONT_SIZE_LARGE,
      { stroke: true, strokeColor: 0x000000, strokeWidth: 3 },
    );
    this.enemyCountText.anchor.set(0.5, 0.5);
    this.topHUD.addChild(this.enemyCountText);

    // Row 1: "分數:9999" - 50px font, right-aligned, same level as 剩餘敵人
    this.scoreText = this.createText(
      "分數: 0",
      CANVAS_WIDTH - 20,
      row1CenterY,
      LAYOUT.TOP_HUD.FONT_SIZE_LARGE,
      { stroke: true, strokeColor: 0x000000, strokeWidth: 3 },
    );
    this.scoreText.anchor.set(1, 0.5);
    this.topHUD.addChild(this.scoreText);

    // Row 2: "餓鬼人潮:1/3" - 33px font, vertically centered in 56px container
    this.waveText = this.createText(
      "餓鬼人潮: 1/1",
      CANVAS_WIDTH / 2,
      row2CenterY,
      LAYOUT.TOP_HUD.FONT_SIZE_SMALL,
      { stroke: true, strokeColor: 0x000000, strokeWidth: 3 },
    );
    this.waveText.anchor.set(0.5, 0.5);
    this.topHUD.addChild(this.waveText);

    // Create bottom UI base sprites
    this.upgradeBaseSprite = this.createUpgradeBaseSprite();
    this.bulletClassBaseSprite = this.createBulletClassBaseSprite();
    this.keyBindSprite = this.createKeyBindSprite();

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
    options?: { stroke?: boolean; strokeColor?: number; strokeWidth?: number },
  ): Text {
    const text = new Text({
      text: content,
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize,
        fill: 0xffffff,
        ...(options?.stroke && {
          stroke: {
            color: options.strokeColor ?? 0x000000,
            width: options.strokeWidth ?? 3,
          },
        }),
      },
    });
    text.position.set(x, y);
    return text;
  }

  private setupHUD(): void {
    // Top HUD texts are added in constructor

    // Bottom HUD base sprites
    this.bottomHUD.addChild(this.upgradeBaseSprite);
    this.bottomHUD.addChild(this.bulletClassBaseSprite);
    this.bottomHUD.addChild(this.keyBindSprite);

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
   * Based on ui_rough_pixelSpec.png:
   * - keyBindTip (white box with number 1-5) positioned ABOVE skill icon by 32px
   * - Skill icons (116×116px) showing actual skill images
   * - Cost indicators (colored dots) below skill icon showing food requirements
   * Layout: 68px left margin, 30px gap between buttons
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
      KEY_TIP_ABOVE_OFFSET,
      NUMBER_LABEL_Y_OFFSET,
      NUMBER_LABEL_FONT_SIZE,
      INDICATOR_BOTTOM_OFFSET,
      INDICATOR_GAP,
      LABEL_FONT_SIZE,
    } = LAYOUT.SKILL_SECTION;

    const skillIconSize = BACKGROUND_SIZE;
    const keyTipSize = BUTTON_SIZE;
    const costIndicatorSize = INDICATOR_SIZE;

    // Skill icon textures mapped to button index (1-5)
    // Key 1: 夜市總匯, Key 2: 臭豆腐, Key 3: 珍珠奶茶, Key 4: 豬血糕, Key 5: 蚵仔煎
    const skillIconKeys = [
      AssetKeys.skillNightMarket,
      AssetKeys.skillStinkyTofu,
      AssetKeys.skillBubbleTea,
      AssetKeys.skillBloodCake,
      AssetKeys.skillOysterOmelette,
    ] as const;

    // Get skill display configs from centralized recipes
    const recipeIds = ["1", "2", "3", "4", "5"];
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

      // Add skill button with actual skill icon
      const skillBg = new Sprite(getTexture(skillIconKeys[i]));
      skillBg.width = skillIconSize;
      skillBg.height = skillIconSize;
      const skillBgX = buttonCenterX - skillIconSize / 2;
      const skillBgY = bottomY + (LAYOUT.BOTTOM_HUD_HEIGHT - skillIconSize) / 2;
      skillBg.position.set(skillBgX, skillBgY);
      this.bottomHUD.addChild(skillBg);

      // Create keyBindTip sprite (46×46px) - positioned ABOVE skill icon by 32px
      const keyTip = new Sprite(getTexture(AssetKeys.keyBindTip));
      keyTip.width = keyTipSize;
      keyTip.height = keyTipSize;
      const keyTipX = buttonCenterX - keyTipSize / 2;
      const keyTipY = skillBgY - KEY_TIP_ABOVE_OFFSET;
      keyTip.position.set(keyTipX, keyTipY);

      this.skillKeyTips.push(keyTip);
      this.bottomHUD.addChild(keyTip);

      // Add number label centered on keyBindTip with black stroke
      const numberLabel = this.createText(
        `${i + 1}`,
        keyTipX + keyTipSize / 2,
        keyTipY + keyTipSize / 2,
        NUMBER_LABEL_FONT_SIZE,
        { stroke: true, strokeColor: 0x000000, strokeWidth: 3 },
      );
      numberLabel.anchor.set(0.5, 0.5);
      this.bottomHUD.addChild(numberLabel);

      // Add skill cost indicators at bottom of skill icon (inside, to stay within HUD)
      const indicators: Sprite[] = [];
      const costCount = skillCosts[i];
      const costTypes = skillCostTypes[i];
      const indicatorY =
        skillBgY + skillIconSize - costIndicatorSize - INDICATOR_BOTTOM_OFFSET;
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

      // For skill 5 (大招), add kill threshold text next to indicator
      if (i === 4) {
        const threshold = KILL_COUNTER_CONFIG.oysterOmeletThreshold;
        const killCountLabel = this.createText(
          `×${threshold}`,
          indicatorStartX + costIndicatorSize + INDICATOR_GAP,
          indicatorY - NUMBER_LABEL_Y_OFFSET,
          LABEL_FONT_SIZE,
          { stroke: true, strokeColor: 0x000000, strokeWidth: 2 },
        );
        this.bottomHUD.addChild(killCountLabel);
      }
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
   * Update recipe availability indicators
   * Based on ui_rough_pixelSpec.png: colored dots show food collection status
   * - Collected: show original color (red/blue/green)
   * - Not collected: show gray
   */
  public updateRecipeAvailability(recipes: RecipeStatus[]): void {
    recipes.forEach((recipe, recipeIndex) => {
      const indicators = this.skillCostIndicators[recipeIndex];
      if (!indicators || !recipe.requirements) return;

      recipe.requirements.forEach((req, reqIndex) => {
        const indicator = indicators[reqIndex];
        if (!indicator) return;

        // Update texture based on collection status
        const textureKey = req.collected
          ? this.getSkillTipKey(req.type)
          : AssetKeys.skillTip0; // gray for uncollected
        indicator.texture = getTexture(textureKey);
      });
    });
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
