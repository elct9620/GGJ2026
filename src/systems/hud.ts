import { Container, Sprite, Text } from "pixi.js";
import { SystemPriority } from "../core/systems/system.interface";
import type { ISystem } from "../core/systems/system.interface";
import { getTexture, AssetKeys } from "../core/assets";
import { CANVAS_HEIGHT, CANVAS_WIDTH, LAYOUT } from "../utils/constants";

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
export class HUDSystem implements ISystem {
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
    this.topHUD = new Container();
    this.bottomHUD = new Container();

    // Top HUD text elements (SPEC § 2.7.3: 86px height)
    const topHudY = 33;

    // Left: "剩餘敵人:20"
    this.enemyCountText = this.createText("剩餘敵人: 0", 50, topHudY);

    // Center: "餓鬼人潮:1/3" (512×56px area, centered)
    this.waveText = this.createText(
      "餓鬼人潮: 1/1",
      CANVAS_WIDTH / 2 - 80,
      topHudY,
    );

    // Right: "分數:9999"
    this.scoreText = this.createText("分數: 0", CANVAS_WIDTH - 150, topHudY);

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

  private createText(content: string, x: number, y: number): Text {
    const text = new Text({
      text: content,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
        fontWeight: "bold",
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

    // Add upgrade icons to left section
    this.setupUpgradeIcons();

    // Add skill key tips and cost indicators to center section
    this.setupSkillButtons();
  }

  /**
   * Setup upgrade icons in the upgradeBase area (550×126px)
   * 5 icons of 88×88px each
   */
  private setupUpgradeIcons(): void {
    const bottomY = CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT;
    const iconSize = 88;
    const sectionWidth = 550;
    const iconCount = 5;
    const spacing = sectionWidth / iconCount; // 110px per icon area
    const iconOffsetY = (LAYOUT.BOTTOM_HUD_HEIGHT - iconSize) / 2; // Center vertically

    for (let i = 0; i < iconCount; i++) {
      const icon = new Sprite(getTexture(AssetKeys.upgradeIcon));
      icon.width = iconSize;
      icon.height = iconSize;

      // Center icon in its area
      const x = i * spacing + (spacing - iconSize) / 2;
      const y = bottomY + iconOffsetY;
      icon.position.set(x, y);

      this.upgradeIcons.push(icon);
      this.bottomHUD.addChild(icon);
    }
  }

  /**
   * Setup skill buttons in the bulletClassBase area (820×126px)
   * 5 keyBindTip icons (46×46px) with skill cost indicators below
   */
  private setupSkillButtons(): void {
    const bottomY = CANVAS_HEIGHT - LAYOUT.BOTTOM_HUD_HEIGHT;
    const baseX = 550; // Start of bulletClassBase
    const sectionWidth = 820;
    const buttonCount = 5;
    const spacing = sectionWidth / buttonCount; // 164px per button area

    const keyTipSize = 46;
    const costIndicatorSize = 20;

    // Skill names for labels
    const skillLabels = ["技能1", "技能2", "技能3", "技能4", "大招"];

    // Skill costs (number of indicators to show)
    // Skills 1-4 use 3 materials, skill 5 (大招) uses kill count
    const skillCosts = [3, 3, 3, 3, 1];

    // Cost indicator types per skill (which skillTip image to use)
    // 0=red, 1=blue, 2=green, 3=special
    const skillCostTypes = [
      [0, 1, 2], // Skill 1: red, blue, green (夜市總匯: Pearl+Tofu+BloodCake)
      [2, 2, 2], // Skill 2: green×3 (臭豆腐: Tofu×3)
      [1, 1, 1], // Skill 3: blue×3 (珍珠奶茶: Pearl×3)
      [0, 0, 0], // Skill 4: red×3 (豬血糕: BloodCake×3)
      [3], // Skill 5: special (蚵仔煎: 10 kills)
    ];

    for (let i = 0; i < buttonCount; i++) {
      // Create keyBindTip sprite
      const keyTip = new Sprite(getTexture(AssetKeys.keyBindTip));
      keyTip.width = keyTipSize;
      keyTip.height = keyTipSize;

      // Position: center in button area, upper part
      const buttonCenterX = baseX + i * spacing + spacing / 2;
      const keyTipX = buttonCenterX - keyTipSize / 2;
      const keyTipY = bottomY + 10;
      keyTip.position.set(keyTipX, keyTipY);

      this.skillKeyTips.push(keyTip);
      this.bottomHUD.addChild(keyTip);

      // Add number label on keyBindTip
      const numberLabel = this.createSmallText(
        `${i + 1}`,
        buttonCenterX - 6,
        keyTipY + 12,
      );
      this.bottomHUD.addChild(numberLabel);

      // Add skill cost indicators below keyBindTip
      const indicators: Sprite[] = [];
      const costCount = skillCosts[i];
      const costTypes = skillCostTypes[i];
      const indicatorStartX =
        buttonCenterX - (costCount * (costIndicatorSize + 4)) / 2;
      const indicatorY = keyTipY + keyTipSize + 5;

      for (let j = 0; j < costCount; j++) {
        const costType = costTypes[j];
        const indicatorKey = this.getSkillTipKey(costType);
        const indicator = new Sprite(getTexture(indicatorKey));
        indicator.width = costIndicatorSize;
        indicator.height = costIndicatorSize;
        indicator.position.set(
          indicatorStartX + j * (costIndicatorSize + 4),
          indicatorY,
        );

        indicators.push(indicator);
        this.bottomHUD.addChild(indicator);
      }
      this.skillCostIndicators.push(indicators);

      // Add skill label below indicators
      const labelY = indicatorY + costIndicatorSize + 2;
      const label = this.createSmallText(
        skillLabels[i],
        buttonCenterX - 20,
        labelY,
      );
      this.bottomHUD.addChild(label);
    }
  }

  private getSkillTipKey(
    type: number,
  ): "skillTip0" | "skillTip1" | "skillTip2" | "skillTip3" {
    switch (type) {
      case 0:
        return AssetKeys.skillTip0;
      case 1:
        return AssetKeys.skillTip1;
      case 2:
        return AssetKeys.skillTip2;
      case 3:
        return AssetKeys.skillTip3;
      default:
        return AssetKeys.skillTip0;
    }
  }

  private createSmallText(content: string, x: number, y: number): Text {
    const text = new Text({
      text: content,
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    text.position.set(x, y);
    return text;
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
   * Update health display (no-op per reference design)
   */
  public updateHealthDisplay(_health: number): void {
    // Health not shown in HUD per ui_rough_pixelSpec.png
  }

  /**
   * Update ammo display (no-op per reference design)
   */
  public updateAmmo(_current: number, _max: number): void {
    // Ammo not shown in HUD per ui_rough_pixelSpec.png
  }

  /**
   * Update food stock display (no-op per reference design)
   */
  public updateFoodStock(
    _pearl: number,
    _tofu: number,
    _bloodCake: number,
  ): void {
    // Food stock shown in booth pools, not HUD
  }

  /**
   * Update kill count display (no-op per reference design)
   */
  public updateKillCount(_count: number): void {
    // Kill count not shown as text in HUD
  }

  /**
   * Update buff status display (no-op per reference design)
   */
  public updateBuffStatus(_buffName: string, _timeLeft: number): void {
    // Buff status not shown in HUD per reference
  }

  /**
   * Clear buff status display
   */
  public clearBuffStatus(): void {
    // No-op
  }

  /**
   * Update recipe availability indicators
   */
  public updateRecipeAvailability(_recipes: RecipeStatus[]): void {
    // Recipe availability visual feedback could be implemented
    // by changing the tint/alpha of skill indicators
  }

  /**
   * Show reload status (no-op per reference design)
   */
  public updateReload(_isReloading: boolean, _timeLeft: number = 0): void {
    // Reload status not shown in HUD per reference
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
