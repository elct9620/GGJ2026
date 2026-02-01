/**
 * Bullet Type Registry Tests
 * SPEC § 2.6.3: Centralized bullet type property management
 */

import { describe, it, expect } from "vitest";
import { SpecialBulletType } from "./special-bullet";
import { BULLET_CONFIG } from "../config";
import { AssetKeys } from "../core/assets";
import {
  BulletTypeRegistry,
  getBulletProperties,
  getBulletSize,
  getBulletColor,
  getHitEffectConfigKey,
  getVisualEffectConfig,
  getPlayerAssetForBuff,
  getDirHintAssetForBuff,
} from "./bullet-type-registry";

describe("BulletTypeRegistry", () => {
  describe("registry structure", () => {
    it("should have entry for all bullet types", () => {
      const bulletTypes = Object.values(SpecialBulletType);
      for (const type of bulletTypes) {
        expect(BulletTypeRegistry[type]).toBeDefined();
      }
    });

    it("should have all required properties for each entry", () => {
      for (const [_type, props] of Object.entries(BulletTypeRegistry)) {
        expect(props.size).toBeTypeOf("number");
        expect(props.color).toBeTypeOf("number");
        expect(props.configKey).toBeTypeOf("string");
        expect(props.playerAsset).toBeTypeOf("string");
        expect(props.dirHintAsset).toBeTypeOf("string");
        expect(props.visualConfig).toBeDefined();
        expect(props.visualConfig.trailColor).toBeTypeOf("number");
        expect(props.visualConfig.trailLength).toBeTypeOf("number");
        expect(props.visualConfig.trailLifetime).toBeTypeOf("number");
      }
    });
  });

  describe("getBulletSize", () => {
    it("should return correct size for normal bullet", () => {
      expect(getBulletSize(SpecialBulletType.None)).toBe(
        BULLET_CONFIG.sizes.normal,
      );
    });

    it("should return correct size for NightMarket bullet", () => {
      expect(getBulletSize(SpecialBulletType.NightMarket)).toBe(
        BULLET_CONFIG.sizes.nightMarket,
      );
    });

    it("should return correct size for OysterOmelette bullet", () => {
      expect(getBulletSize(SpecialBulletType.OysterOmelette)).toBe(
        BULLET_CONFIG.sizes.oysterOmelette,
      );
    });
  });

  describe("getBulletColor", () => {
    it("should return correct color for normal bullet", () => {
      expect(getBulletColor(SpecialBulletType.None)).toBe(
        BULLET_CONFIG.colors.normal,
      );
    });

    it("should return correct color for StinkyTofu bullet", () => {
      expect(getBulletColor(SpecialBulletType.StinkyTofu)).toBe(
        BULLET_CONFIG.colors.stinkyTofu,
      );
    });
  });

  describe("getHitEffectConfigKey", () => {
    it("should return 'normal' for None type", () => {
      expect(getHitEffectConfigKey(SpecialBulletType.None)).toBe("normal");
    });

    it("should return 'nightMarket' for NightMarket type", () => {
      expect(getHitEffectConfigKey(SpecialBulletType.NightMarket)).toBe(
        "nightMarket",
      );
    });

    it("should return 'oysterOmelette' for OysterOmelette type", () => {
      expect(getHitEffectConfigKey(SpecialBulletType.OysterOmelette)).toBe(
        "oysterOmelette",
      );
    });
  });

  describe("getVisualEffectConfig", () => {
    it("should return visual config for normal bullet", () => {
      const config = getVisualEffectConfig(SpecialBulletType.None);
      expect(config.trailColor).toBe(0xffffff);
      expect(config.hitDuration).toBe(0.15);
    });

    it("should return visual config with chain properties for NightMarket", () => {
      const config = getVisualEffectConfig(SpecialBulletType.NightMarket);
      expect(config.chainColor).toBeDefined();
      expect(config.chainWidth).toBeDefined();
    });

    it("should return visual config with pierce properties for StinkyTofu", () => {
      const config = getVisualEffectConfig(SpecialBulletType.StinkyTofu);
      expect(config.pierceColor).toBeDefined();
      expect(config.pierceRadius).toBeDefined();
    });

    it("should return visual config with explosion properties for OysterOmelette", () => {
      const config = getVisualEffectConfig(SpecialBulletType.OysterOmelette);
      expect(config.explosionColor).toBeDefined();
      expect(config.explosionRadius).toBeDefined();
    });
  });

  describe("getPlayerAssetForBuff", () => {
    it("should return playerBase for None buff", () => {
      expect(getPlayerAssetForBuff(SpecialBulletType.None)).toBe(
        AssetKeys.playerBase,
      );
    });

    it("should return playerNightMarket for NightMarket buff", () => {
      expect(getPlayerAssetForBuff(SpecialBulletType.NightMarket)).toBe(
        AssetKeys.playerNightMarket,
      );
    });

    it("should return correct asset for all buff types", () => {
      expect(getPlayerAssetForBuff(SpecialBulletType.StinkyTofu)).toBe(
        AssetKeys.playerStinkyTofu,
      );
      expect(getPlayerAssetForBuff(SpecialBulletType.BubbleTea)).toBe(
        AssetKeys.playerBubbleTea,
      );
      expect(getPlayerAssetForBuff(SpecialBulletType.BloodCake)).toBe(
        AssetKeys.playerBloodCake,
      );
      expect(getPlayerAssetForBuff(SpecialBulletType.OysterOmelette)).toBe(
        AssetKeys.playerOysterOmelette,
      );
    });
  });

  describe("getDirHintAssetForBuff", () => {
    it("should return DirHint01 for most buff types", () => {
      expect(getDirHintAssetForBuff(SpecialBulletType.None)).toBe(
        AssetKeys.playerDirHint01,
      );
      expect(getDirHintAssetForBuff(SpecialBulletType.NightMarket)).toBe(
        AssetKeys.playerDirHint01,
      );
      expect(getDirHintAssetForBuff(SpecialBulletType.StinkyTofu)).toBe(
        AssetKeys.playerDirHint01,
      );
    });

    it("should return DirHint02 for BubbleTea (scatter indicator)", () => {
      expect(getDirHintAssetForBuff(SpecialBulletType.BubbleTea)).toBe(
        AssetKeys.playerDirHint02,
      );
    });
  });

  describe("getBulletProperties", () => {
    it("should return complete properties for a bullet type", () => {
      const props = getBulletProperties(SpecialBulletType.NightMarket);
      expect(props.size).toBe(BULLET_CONFIG.sizes.nightMarket);
      expect(props.color).toBe(BULLET_CONFIG.colors.nightMarket);
      expect(props.configKey).toBe("nightMarket");
      expect(props.playerAsset).toBe(AssetKeys.playerNightMarket);
      expect(props.dirHintAsset).toBe(AssetKeys.playerDirHint01);
      expect(props.visualConfig).toBeDefined();
    });
  });
});
