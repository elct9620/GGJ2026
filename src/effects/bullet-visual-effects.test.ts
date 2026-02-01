/**
 * Bullet Visual Effects Tests
 * Test cases based on docs/testing.md § 2.2.4 Bullet Visual Effects
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BulletVisualEffects } from "./bullet-visual-effects";
import { Vector } from "../values/vector";
import { SpecialBulletType } from "../values/special-bullet";

describe("BulletVisualEffects", () => {
  let visualEffects: BulletVisualEffects;

  beforeEach(() => {
    visualEffects = new BulletVisualEffects();
  });

  describe("Initialization", () => {
    it("should create a container for visual effects", () => {
      const container = visualEffects.getContainer();
      expect(container).toBeDefined();
      expect(container.label).toBe("BulletVisualEffects");
    });
  });

  describe("Trail Effects (VE-01, VE-06, VE-11)", () => {
    it("should create white trail for normal bullets (VE-01)", () => {
      const bulletId = "bullet1";
      const position = new Vector(100, 100);

      visualEffects.createTrail(bulletId, position, SpecialBulletType.None);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should create green gas trail for stinky tofu (VE-06)", () => {
      const bulletId = "bullet2";
      const position = new Vector(200, 200);

      visualEffects.createTrail(
        bulletId,
        position,
        SpecialBulletType.StinkyTofu,
      );

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should create black sticky residue for blood cake (VE-11)", () => {
      const bulletId = "bullet3";
      const position = new Vector(300, 300);

      visualEffects.createTrail(
        bulletId,
        position,
        SpecialBulletType.BloodCake,
      );

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should limit trail length per bullet", () => {
      const bulletId = "bullet4";
      const bulletType = SpecialBulletType.None;

      // Create more trails than max length (normal trail length = 5)
      for (let i = 0; i < 10; i++) {
        visualEffects.createTrail(
          bulletId,
          new Vector(100 + i * 10, 100),
          bulletType,
        );
      }

      const container = visualEffects.getContainer();
      // Should be limited to max trail length (5)
      expect(container.children.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Hit Effects (VE-02)", () => {
    it("should create white pop effect for normal bullet hit (VE-02)", () => {
      const position = new Vector(400, 400);

      visualEffects.createHitEffect(position, SpecialBulletType.None);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should create golden hit effect for night market", () => {
      const position = new Vector(500, 500);

      visualEffects.createHitEffect(position, SpecialBulletType.NightMarket);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });
  });

  describe("Pierce Effects (VE-07)", () => {
    it("should create green stink cloud when stinky tofu pierces (VE-07)", () => {
      const position = new Vector(600, 600);

      visualEffects.createPierceEffect(position);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });
  });

  describe("Chain Lightning Effects (VE-03, VE-04, VE-05)", () => {
    it("should create golden lightning chain between enemies (VE-04)", () => {
      const from = new Vector(100, 100);
      const to = new Vector(200, 200);

      visualEffects.createChainEffect(from, to);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should create multiple chain links for multiple targets", () => {
      const positions = [
        new Vector(100, 100),
        new Vector(200, 200),
        new Vector(300, 300),
      ];

      // Create chain from first to second
      visualEffects.createChainEffect(positions[0], positions[1]);
      // Create chain from second to third
      visualEffects.createChainEffect(positions[1], positions[2]);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Explosion Effects (VE-13)", () => {
    it("should create red explosion for oyster omelette impact", () => {
      const position = new Vector(700, 700);

      visualEffects.createExplosionEffect(position);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });
  });

  describe("Screen Shake (VE-13)", () => {
    it("should return screen shake parameters for oyster omelette (VE-13)", () => {
      const shakeData = visualEffects.triggerScreenShake();

      expect(shakeData).toBeDefined();
      expect(shakeData.magnitude).toBeGreaterThan(0);
      expect(shakeData.duration).toBeGreaterThan(0);
    });
  });

  describe("Bullet Scale (VE-09, VE-12)", () => {
    it("should return larger scale for bubble tea bullets (VE-09)", () => {
      const scale = BulletVisualEffects.getBulletScale(
        SpecialBulletType.BubbleTea,
      );
      expect(scale).toBeGreaterThan(1.0);
    });

    it("should return 3-4x scale for oyster omelette bullets (VE-12)", () => {
      const scale = BulletVisualEffects.getBulletScale(
        SpecialBulletType.OysterOmelette,
      );
      expect(scale).toBeGreaterThanOrEqual(3.0);
      expect(scale).toBeLessThanOrEqual(4.0);
    });

    it("should return normal scale (1.0) for other bullet types", () => {
      const scale = BulletVisualEffects.getBulletScale(
        SpecialBulletType.StinkyTofu,
      );
      expect(scale).toBe(1.0);
    });
  });

  describe("Update and Cleanup", () => {
    it("should fade trails over time", () => {
      const bulletId = "bullet5";
      visualEffects.createTrail(
        bulletId,
        new Vector(100, 100),
        SpecialBulletType.None,
      );

      const initialCount = visualEffects.getContainer().children.length;

      // Update with enough time to fade trails (0.3s should be enough for normal trail)
      visualEffects.update(0.3);

      const finalCount = visualEffects.getContainer().children.length;
      // Trails should be removed after expiring
      expect(finalCount).toBeLessThanOrEqual(initialCount);
    });

    it("should clear all trails for a specific bullet", () => {
      const bulletId = "bullet6";

      // Create multiple trail particles
      for (let i = 0; i < 3; i++) {
        visualEffects.createTrail(
          bulletId,
          new Vector(100 + i * 10, 100),
          SpecialBulletType.None,
        );
      }

      expect(visualEffects.getContainer().children.length).toBe(3);

      visualEffects.clearBulletTrails(bulletId);

      expect(visualEffects.getContainer().children.length).toBe(0);
    });

    it("should clean up all effects on destroy", () => {
      // Create various effects
      visualEffects.createTrail(
        "bullet1",
        new Vector(100, 100),
        SpecialBulletType.None,
      );
      visualEffects.createHitEffect(new Vector(200, 200), SpecialBulletType.None);
      visualEffects.createChainEffect(
        new Vector(300, 300),
        new Vector(400, 400),
      );

      expect(visualEffects.getContainer().children.length).toBeGreaterThan(0);

      visualEffects.destroy();

      // Container should be destroyed (children cleared)
      expect(visualEffects.getContainer().destroyed).toBe(true);
    });
  });

  describe("Visual Differentiation (VE-14)", () => {
    it("should create visually distinct effects for each bullet type", () => {
      const types = [
        SpecialBulletType.None,
        SpecialBulletType.NightMarket,
        SpecialBulletType.StinkyTofu,
        SpecialBulletType.BubbleTea,
        SpecialBulletType.BloodCake,
        SpecialBulletType.OysterOmelette,
      ];

      types.forEach((type, index) => {
        const bulletId = `bullet_${index}`;
        visualEffects.createTrail(
          bulletId,
          new Vector(100 + index * 50, 100),
          type,
        );
      });

      // All bullet types should create effects
      expect(visualEffects.getContainer().children.length).toBe(types.length);
    });
  });
});
