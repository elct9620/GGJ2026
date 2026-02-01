/**
 * HitEffectData Catalog Tests
 * SPEC § 2.6.3: Hit visual effects
 */

import { describe, it, expect } from "vitest";
import {
  HitEffectData,
  hitEffectData,
  HIT_EFFECTS_CONFIG,
} from "./hit-effect-data";

describe("HitEffectData", () => {
  describe("flash configs", () => {
    it("should have normal flash config", () => {
      const config = hitEffectData.getFlash("normal");
      expect(config.color).toBe(16764108); // 0xffcccc
      expect(config.duration).toBe(0.12);
    });

    it("should have nightMarket flash config", () => {
      const config = hitEffectData.getFlash("nightMarket");
      expect(config.color).toBe(16766720); // 0xffd700
      expect(config.duration).toBe(0.15);
    });

    it("should have stinkyTofu flash config", () => {
      const config = hitEffectData.getFlash("stinkyTofu");
      expect(config.color).toBe(2600672); // 0x27ae60
      expect(config.duration).toBe(0.12);
    });

    it("should have bubbleTea flash config", () => {
      const config = hitEffectData.getFlash("bubbleTea");
      expect(config.color).toBe(16764108); // 0xffcccc
      expect(config.duration).toBe(0.12);
    });

    it("should have bloodCake flash config", () => {
      const config = hitEffectData.getFlash("bloodCake");
      expect(config.color).toBe(9109504); // 0x8b0000
      expect(config.duration).toBe(0.13);
    });

    it("should have oysterOmelette flash config", () => {
      const config = hitEffectData.getFlash("oysterOmelette");
      expect(config.color).toBe(16728132); // 0xff4444
      expect(config.duration).toBe(0.3);
    });
  });

  describe("knockback config", () => {
    it("should have knockback distance and duration", () => {
      expect(hitEffectData.knockback.distance).toBe(15);
      expect(hitEffectData.knockback.duration).toBe(0.08);
    });
  });

  describe("screenShake configs", () => {
    it("should have normal screen shake config", () => {
      const config = hitEffectData.getScreenShake("normal");
      expect(config.magnitude).toBe(2);
      expect(config.duration).toBe(0.08);
    });

    it("should have nightMarket screen shake config", () => {
      const config = hitEffectData.getScreenShake("nightMarket");
      expect(config.magnitude).toBe(3);
      expect(config.duration).toBe(0.1);
    });

    it("should have oysterOmelette screen shake config", () => {
      const config = hitEffectData.getScreenShake("oysterOmelette");
      expect(config.magnitude).toBe(8);
      expect(config.duration).toBe(0.5);
    });
  });

  describe("error handling", () => {
    it("should throw for unknown flash key", () => {
      expect(() =>
        hitEffectData.getFlash("unknown" as "normal"),
      ).toThrowError();
    });

    it("should throw for unknown screen shake key", () => {
      expect(() =>
        hitEffectData.getScreenShake("unknown" as "normal"),
      ).toThrowError();
    });
  });

  describe("custom instance", () => {
    it("should allow creating instance with custom JSON", () => {
      const customJson = {
        flash: {
          normal: { color: 0xff0000, duration: 0.5 },
          nightMarket: { color: 0x00ff00, duration: 0.5 },
          stinkyTofu: { color: 0x0000ff, duration: 0.5 },
          bubbleTea: { color: 0xff00ff, duration: 0.5 },
          bloodCake: { color: 0xffff00, duration: 0.5 },
          oysterOmelette: { color: 0x00ffff, duration: 0.5 },
        },
        knockback: { distance: 30, duration: 0.2 },
        screenShake: {
          normal: { magnitude: 5, duration: 0.2 },
          nightMarket: { magnitude: 10, duration: 0.3 },
          stinkyTofu: { magnitude: 10, duration: 0.3 },
          bubbleTea: { magnitude: 10, duration: 0.3 },
          bloodCake: { magnitude: 10, duration: 0.3 },
          oysterOmelette: { magnitude: 20, duration: 1.0 },
        },
      };

      const customHitEffectData = new HitEffectData(customJson);
      expect(customHitEffectData.getFlash("normal").color).toBe(0xff0000);
      expect(customHitEffectData.knockback.distance).toBe(30);
    });
  });

  describe("backwards compatibility", () => {
    it("HIT_EFFECTS_CONFIG should work", () => {
      expect(HIT_EFFECTS_CONFIG.flash.normal.color).toBe(16764108); // 0xffcccc
      expect(HIT_EFFECTS_CONFIG.knockback.distance).toBe(15);
      expect(HIT_EFFECTS_CONFIG.screenShake.normal.magnitude).toBe(2);
    });
  });
});
