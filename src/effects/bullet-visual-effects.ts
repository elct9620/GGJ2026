/**
 * Bullet Visual Effects
 * SPEC § 2.6.3: 子彈視覺效果系統
 * SPEC § 4.2.4: Animation System - Phase 1 (MVP)
 *
 * 此檔案為未來視覺效果實作的佔位符
 * 目前子彈視覺由 Bullet 實體的顏色系統處理
 */

import type { Graphics } from "pixi.js";
import type { Bullet } from "../entities/bullet";
import { SpecialBulletType } from "../values/special-bullet";

/**
 * Bullet visual effects manager (placeholder)
 * 未來將實作粒子效果、尾跡、爆炸特效等
 */
export class BulletVisualEffects {
  /**
   * Create visual effects for bullet (placeholder)
   * @param bullet Bullet entity
   * @param container Graphics container for effects
   */
  public static createEffects(_bullet: Bullet, _container: Graphics): void {
    // Placeholder: Visual effects not yet implemented
    // Phase 1 (MVP): 使用 Bullet 實體的顏色系統
    // Phase 2: 實作粒子效果、尾跡、爆炸特效
  }

  /**
   * Get effect description for bullet type (for testing/debugging)
   */
  public static getEffectDescription(type: SpecialBulletType): string {
    switch (type) {
      case SpecialBulletType.None:
        return "白色風切線條 + Pop 特效";
      case SpecialBulletType.NightMarket:
        return "金黃色電流環繞 + 閃電鏈";
      case SpecialBulletType.StinkyTofu:
        return "綠色氣體尾跡 + 貫穿臭氣";
      case SpecialBulletType.BubbleTea:
        return "三向散射";
      case SpecialBulletType.BloodCake:
        return "黑色黏稠殘影 + 曲線軌跡";
      case SpecialBulletType.OysterOmelette:
        return "拋物線投擲 + 螢幕震動";
      default:
        return "未知效果";
    }
  }
}
