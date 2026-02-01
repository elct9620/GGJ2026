/**
 * BulletData Catalog Tests
 * SPEC § 2.6.3: Centralized bullet type property management
 */

import { describe, it, expect } from "vitest";
import { SpecialBulletType } from "../core/types";
import { AssetKeys } from "../core/assets";
import { BulletData, bulletData } from "./bullet-data";

describe("BulletData", () => {
  describe("data structure", () => {
    it("should have entry for all bullet types", () => {
      const bulletTypes = Object.values(SpecialBulletType);
      for (const type of bulletTypes) {
        expect(bulletData.get(type)).toBeDefined();
      }
    });

    it("should have all required properties for each entry", () => {
      for (const [_type, props] of Object.entries(bulletData.entries)) {
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

  describe("getSize", () => {
    it("should return correct size for normal bullet", () => {
      expect(bulletData.getSize(SpecialBulletType.None)).toBe(24);
    });

    it("should return correct size for NightMarket bullet", () => {
      expect(bulletData.getSize(SpecialBulletType.NightMarket)).toBe(48);
    });

    it("should return correct size for OysterOmelette bullet", () => {
      expect(bulletData.getSize(SpecialBulletType.OysterOmelette)).toBe(192);
    });
  });

  describe("getColor", () => {
    it("should return correct color for normal bullet", () => {
      expect(bulletData.getColor(SpecialBulletType.None)).toBe(16376591); // 0xf1c40f
    });

    it("should return correct color for StinkyTofu bullet", () => {
      expect(bulletData.getColor(SpecialBulletType.StinkyTofu)).toBe(2600672); // 0x27ae60
    });
  });

  describe("getHitEffectConfigKey", () => {
    it("should return 'normal' for None type", () => {
      expect(bulletData.getHitEffectConfigKey(SpecialBulletType.None)).toBe(
        "normal",
      );
    });

    it("should return 'nightMarket' for NightMarket type", () => {
      expect(
        bulletData.getHitEffectConfigKey(SpecialBulletType.NightMarket),
      ).toBe("nightMarket");
    });

    it("should return 'oysterOmelette' for OysterOmelette type", () => {
      expect(
        bulletData.getHitEffectConfigKey(SpecialBulletType.OysterOmelette),
      ).toBe("oysterOmelette");
    });
  });

  describe("getVisualEffectConfig", () => {
    it("should return visual config for normal bullet", () => {
      const config = bulletData.getVisualEffectConfig(SpecialBulletType.None);
      expect(config.trailColor).toBe(16777215); // 0xffffff
      expect(config.hitDuration).toBe(0.15);
    });

    it("should return visual config with chain properties for NightMarket", () => {
      const config = bulletData.getVisualEffectConfig(
        SpecialBulletType.NightMarket,
      );
      expect(config.chainColor).toBeDefined();
      expect(config.chainWidth).toBeDefined();
    });

    it("should return visual config with pierce properties for StinkyTofu", () => {
      const config = bulletData.getVisualEffectConfig(
        SpecialBulletType.StinkyTofu,
      );
      expect(config.pierceColor).toBeDefined();
      expect(config.pierceRadius).toBeDefined();
    });

    it("should return visual config with explosion properties for OysterOmelette", () => {
      const config = bulletData.getVisualEffectConfig(
        SpecialBulletType.OysterOmelette,
      );
      expect(config.explosionColor).toBeDefined();
      expect(config.explosionRadius).toBeDefined();
    });
  });

  describe("getPlayerAssetForBuff", () => {
    it("should return playerBase for None buff", () => {
      expect(bulletData.getPlayerAssetForBuff(SpecialBulletType.None)).toBe(
        AssetKeys.playerBase,
      );
    });

    it("should return playerNightMarket for NightMarket buff", () => {
      expect(
        bulletData.getPlayerAssetForBuff(SpecialBulletType.NightMarket),
      ).toBe(AssetKeys.playerNightMarket);
    });

    it("should return correct asset for all buff types", () => {
      expect(
        bulletData.getPlayerAssetForBuff(SpecialBulletType.StinkyTofu),
      ).toBe(AssetKeys.playerStinkyTofu);
      expect(
        bulletData.getPlayerAssetForBuff(SpecialBulletType.BubbleTea),
      ).toBe(AssetKeys.playerBubbleTea);
      expect(
        bulletData.getPlayerAssetForBuff(SpecialBulletType.BloodCake),
      ).toBe(AssetKeys.playerBloodCake);
      expect(
        bulletData.getPlayerAssetForBuff(SpecialBulletType.OysterOmelette),
      ).toBe(AssetKeys.playerOysterOmelette);
    });
  });

  describe("getDirHintAssetForBuff", () => {
    it("should return DirHint01 for most buff types", () => {
      expect(bulletData.getDirHintAssetForBuff(SpecialBulletType.None)).toBe(
        AssetKeys.playerDirHint01,
      );
      expect(
        bulletData.getDirHintAssetForBuff(SpecialBulletType.NightMarket),
      ).toBe(AssetKeys.playerDirHint01);
      expect(
        bulletData.getDirHintAssetForBuff(SpecialBulletType.StinkyTofu),
      ).toBe(AssetKeys.playerDirHint01);
    });

    it("should return DirHint02 for BubbleTea (scatter indicator)", () => {
      expect(
        bulletData.getDirHintAssetForBuff(SpecialBulletType.BubbleTea),
      ).toBe(AssetKeys.playerDirHint02);
    });
  });

  describe("custom instance", () => {
    it("should allow creating instance with custom JSON", () => {
      const customJson = {
        None: {
          size: 100,
          color: 0xff0000,
          configKey: "normal" as const,
          playerAsset: "Player_Base",
          dirHintAsset: "Player_DirHint01",
          visualConfig: {
            trailColor: 0xffffff,
            trailLength: 8,
            trailLifetime: 0.2,
          },
        },
        NightMarket: {
          size: 100,
          color: 0xff0000,
          configKey: "nightMarket" as const,
          playerAsset: "Player_NightMarket",
          dirHintAsset: "Player_DirHint01",
          visualConfig: {
            trailColor: 0xffffff,
            trailLength: 8,
            trailLifetime: 0.2,
          },
        },
        StinkyTofu: {
          size: 100,
          color: 0xff0000,
          configKey: "stinkyTofu" as const,
          playerAsset: "Player_StinkyTofu",
          dirHintAsset: "Player_DirHint01",
          visualConfig: {
            trailColor: 0xffffff,
            trailLength: 8,
            trailLifetime: 0.2,
          },
        },
        BubbleTea: {
          size: 100,
          color: 0xff0000,
          configKey: "bubbleTea" as const,
          playerAsset: "Player_BubbleTea",
          dirHintAsset: "Player_DirHint02",
          visualConfig: {
            trailColor: 0xffffff,
            trailLength: 8,
            trailLifetime: 0.2,
          },
        },
        BloodCake: {
          size: 100,
          color: 0xff0000,
          configKey: "bloodCake" as const,
          playerAsset: "Player_BloodCake",
          dirHintAsset: "Player_DirHint01",
          visualConfig: {
            trailColor: 0xffffff,
            trailLength: 8,
            trailLifetime: 0.2,
          },
        },
        OysterOmelette: {
          size: 100,
          color: 0xff0000,
          configKey: "oysterOmelette" as const,
          playerAsset: "Player_OysterOmelette",
          dirHintAsset: "Player_DirHint01",
          visualConfig: {
            trailColor: 0xffffff,
            trailLength: 8,
            trailLifetime: 0.2,
          },
        },
      };

      const customBulletData = new BulletData(customJson);
      expect(customBulletData.getSize(SpecialBulletType.None)).toBe(100);
    });
  });
});
