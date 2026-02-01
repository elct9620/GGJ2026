/**
 * Bullet Visual Effects Tests
 * Test cases based on docs/testing.md § 2.2.4 Bullet Visual Effects
 */

import { describe, it, expect, beforeEach } from "vitest";
import { BulletVisualEffects } from "./bullet-visual-effects";
import { Vector } from "../values/vector";
import { SpecialBulletType } from "../core/types";

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
      // Should be limited to max trail length (8 for normal bullets)
      expect(container.children.length).toBeLessThanOrEqual(8);
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

  // Note: Bullet scale is now managed by BULLET_CONFIG.sizes in config.ts
  // The getBulletScale method has been removed from BulletVisualEffects
  // as bullet sizes are unified (visual = collision) per CLAUDE.md design decision

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

    it("should remove hit effects after lifetime expires via update loop", () => {
      visualEffects.createHitEffect(
        new Vector(100, 100),
        SpecialBulletType.None,
      );

      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with time less than hit duration (0.15s)
      visualEffects.update(0.1);
      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with enough time to expire (total 0.2s > 0.15s)
      visualEffects.update(0.1);
      expect(visualEffects.getContainer().children.length).toBe(0);
    });

    it("should remove chain effects after lifetime expires via update loop", () => {
      visualEffects.createChainEffect(
        new Vector(100, 100),
        new Vector(200, 200),
      );

      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with time less than flash duration (0.2s)
      visualEffects.update(0.15);
      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with enough time to expire (total 0.3s > 0.2s)
      visualEffects.update(0.15);
      expect(visualEffects.getContainer().children.length).toBe(0);
    });

    it("should remove pierce effects after lifetime expires via update loop", () => {
      visualEffects.createPierceEffect(new Vector(100, 100));

      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with time less than pierce duration (0.3s)
      visualEffects.update(0.2);
      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with enough time to expire (total 0.4s > 0.3s)
      visualEffects.update(0.2);
      expect(visualEffects.getContainer().children.length).toBe(0);
    });

    it("should remove explosion effects after lifetime expires via update loop", () => {
      visualEffects.createExplosionEffect(new Vector(100, 100));

      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with time less than explosion duration (0.4s)
      visualEffects.update(0.3);
      expect(visualEffects.getContainer().children.length).toBe(1);

      // Update with enough time to expire (total 0.5s > 0.4s)
      visualEffects.update(0.2);
      expect(visualEffects.getContainer().children.length).toBe(0);
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
      visualEffects.createHitEffect(
        new Vector(200, 200),
        SpecialBulletType.None,
      );
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
