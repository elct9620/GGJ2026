/**
 * Bullet Visual Effects Tests
 * SPEC § 2.6.3: 子彈視覺效果測試
 */

import { describe, it, expect } from "vitest";
import { BulletVisualEffects } from "./bullet-visual-effects";
import { SpecialBulletType } from "../values/special-bullet";

describe("BulletVisualEffects", () => {
  describe("getEffectDescription", () => {
    it("should return correct description for normal bullet", () => {
      const description = BulletVisualEffects.getEffectDescription(
        SpecialBulletType.None,
      );
      expect(description).toBe("白色風切線條 + Pop 特效");
    });

    it("should return correct description for NightMarket bullet", () => {
      const description = BulletVisualEffects.getEffectDescription(
        SpecialBulletType.NightMarket,
      );
      expect(description).toBe("金黃色電流環繞 + 閃電鏈");
    });

    it("should return correct description for StinkyTofu bullet", () => {
      const description = BulletVisualEffects.getEffectDescription(
        SpecialBulletType.StinkyTofu,
      );
      expect(description).toBe("綠色氣體尾跡 + 貫穿臭氣");
    });

    it("should return correct description for BubbleTea bullet", () => {
      const description = BulletVisualEffects.getEffectDescription(
        SpecialBulletType.BubbleTea,
      );
      expect(description).toBe("三向散射");
    });

    it("should return correct description for BloodCake bullet", () => {
      const description = BulletVisualEffects.getEffectDescription(
        SpecialBulletType.BloodCake,
      );
      expect(description).toBe("黑色黏稠殘影 + 曲線軌跡");
    });

    it("should return correct description for OysterOmelette bullet", () => {
      const description = BulletVisualEffects.getEffectDescription(
        SpecialBulletType.OysterOmelette,
      );
      expect(description).toBe("拋物線投擲 + 螢幕震動");
    });
  });

  describe("createEffects", () => {
    it("should not throw error when called (placeholder)", () => {
      // This is a placeholder test for future visual effects implementation
      // Currently, createEffects does nothing
      expect(() => {
        BulletVisualEffects.createEffects(null as any, null as any);
      }).not.toThrow();
    });
  });
});
