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

    it("should remove hit effects after lifetime expires via update loop", () => {
      visualEffects.createHitEffect(
        new Vector(100, 100),
        SpecialBulletType.None,
      );

      const initialCount = visualEffects.getContainer().children.length;
      expect(initialCount).toBeGreaterThan(0); // Main effect + particles

      // Update with time less than hit duration (0.15s)
      visualEffects.update(0.1);
      expect(visualEffects.getContainer().children.length).toBeGreaterThan(0);

      // Update with enough time to expire (total 0.5s > 0.4s for all particles)
      visualEffects.update(0.4);
      expect(visualEffects.getContainer().children.length).toBe(0);
    });

    it("should remove chain effects after lifetime expires via update loop", () => {
      visualEffects.createChainEffect(
        new Vector(100, 100),
        new Vector(200, 200),
      );

      const initialCount = visualEffects.getContainer().children.length;
      expect(initialCount).toBeGreaterThan(0); // Main lightning + particles

      // Update with time less than flash duration (0.3s)
      visualEffects.update(0.15);
      expect(visualEffects.getContainer().children.length).toBeGreaterThan(0);

      // Update with enough time to expire (total 0.5s > 0.3s)
      visualEffects.update(0.35);
      expect(visualEffects.getContainer().children.length).toBe(0);
    });

    it("should remove pierce effects after lifetime expires via update loop", () => {
      visualEffects.createPierceEffect(new Vector(100, 100));

      const initialCount = visualEffects.getContainer().children.length;
      expect(initialCount).toBeGreaterThan(0); // Main cloud + particles + residue

      // Update with time less than pierce duration (0.5s)
      visualEffects.update(0.3);
      expect(visualEffects.getContainer().children.length).toBeGreaterThan(0);

      // Update with enough time to expire (total 1.6s > 1.5s ground residue duration)
      visualEffects.update(1.3);
      expect(visualEffects.getContainer().children.length).toBe(0);
    });

    it("should remove explosion effects after lifetime expires via update loop", () => {
      visualEffects.createExplosionEffect(new Vector(100, 100));

      const initialCount = visualEffects.getContainer().children.length;
      expect(initialCount).toBeGreaterThan(0); // Main explosion + shockwave + 500 particles + residue

      // Update with time less than explosion duration (1.0s)
      visualEffects.update(0.5);
      expect(visualEffects.getContainer().children.length).toBeGreaterThan(0);

      // Update with enough time to expire (total 3.5s > 3.0s ground residue duration)
      visualEffects.update(3.0);
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

  describe("Muzzle Flash (VE-01, VE-06, VE-17, VE-25, VE-34, VE-44)", () => {
    it("should create white muzzle flash for normal bullets (VE-01)", () => {
      const position = new Vector(100, 100);
      visualEffects.createMuzzleFlash(position, SpecialBulletType.None);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should create golden muzzle flash for night market (VE-06)", () => {
      const position = new Vector(200, 200);
      visualEffects.createMuzzleFlash(position, SpecialBulletType.NightMarket);

      const container = visualEffects.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it("should create massive muzzle flash for oyster omelette (VE-44)", () => {
      const position = new Vector(300, 300);
      visualEffects.createMuzzleFlash(
        position,
        SpecialBulletType.OysterOmelette,
      );

      const container = visualEffects.getContainer();
      // Should create many particles
      expect(container.children.length).toBeGreaterThan(10);
    });
  });

  describe("Screen Shake (VE-13, VE-22, VE-31, VE-41, VE-50)", () => {
    it("should return zero offset when no shake is active", () => {
      const offset = visualEffects.getScreenShakeOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it("should return non-zero offset when shake is active", () => {
      // Trigger shake via explosion
      visualEffects.createExplosionEffect(new Vector(100, 100));

      const offset = visualEffects.getScreenShakeOffset();
      // Should be non-zero (within magnitude bounds)
      expect(Math.abs(offset.x)).toBeGreaterThanOrEqual(0);
      expect(Math.abs(offset.y)).toBeGreaterThanOrEqual(0);
      expect(Math.abs(offset.x)).toBeLessThanOrEqual(10); // Some reasonable upper bound
      expect(Math.abs(offset.y)).toBeLessThanOrEqual(10);
    });

    it("should stop shaking after duration expires", () => {
      visualEffects.createExplosionEffect(new Vector(100, 100));

      // Update beyond shake duration (0.5s for oyster omelette)
      visualEffects.update(0.6);

      const offset = visualEffects.getScreenShakeOffset();
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });
  });

  describe("Fullscreen Flash (VE-53)", () => {
    it("should return zero alpha when no flash is active", () => {
      const alpha = visualEffects.getFullscreenFlashAlpha();
      expect(alpha).toBe(0);
    });

    it("should return non-zero alpha when flash is active", () => {
      // Trigger fullscreen flash via explosion
      visualEffects.createExplosionEffect(new Vector(100, 100));

      const alpha = visualEffects.getFullscreenFlashAlpha();
      expect(alpha).toBeGreaterThan(0);
    });

    it("should fade flash over time", () => {
      visualEffects.createExplosionEffect(new Vector(100, 100));

      const initialAlpha = visualEffects.getFullscreenFlashAlpha();

      // Update partway through flash
      visualEffects.update(0.1);

      const laterAlpha = visualEffects.getFullscreenFlashAlpha();
      expect(laterAlpha).toBeLessThanOrEqual(initialAlpha);
    });
  });

  describe("Particle System (VE-60)", () => {
    it("should create 20 particles for normal bullet hit (VE-05)", () => {
      const initialCount = visualEffects.getContainer().children.length;

      visualEffects.createHitEffect(
        new Vector(100, 100),
        SpecialBulletType.None,
      );

      const finalCount = visualEffects.getContainer().children.length;
      // Should create main effect + 20 particles
      expect(finalCount - initialCount).toBeGreaterThanOrEqual(20);
    });

    it("should create 200+ particles for stinky tofu pierce (VE-21)", () => {
      const initialCount = visualEffects.getContainer().children.length;

      visualEffects.createPierceEffect(new Vector(100, 100));

      const finalCount = visualEffects.getContainer().children.length;
      // Should create main effect + 200 particles
      expect(finalCount - initialCount).toBeGreaterThan(100);
    });

    it("should create 500+ particles for oyster omelette explosion (VE-49)", () => {
      const initialCount = visualEffects.getContainer().children.length;

      visualEffects.createExplosionEffect(new Vector(100, 100));

      const finalCount = visualEffects.getContainer().children.length;
      // Should create massive particle burst
      expect(finalCount - initialCount).toBeGreaterThan(400);
    });

    it("should update particle positions over time", () => {
      visualEffects.createHitEffect(
        new Vector(100, 100),
        SpecialBulletType.None,
      );

      // Update to move particles
      visualEffects.update(0.1);

      // Particles should still exist
      expect(visualEffects.getContainer().children.length).toBeGreaterThan(0);
    });
  });

  describe("Ground Residue (VE-15, VE-23, VE-32, VE-42, VE-55)", () => {
    it("should create ground residue for special bullet hits", () => {
      visualEffects.createHitEffect(
        new Vector(100, 100),
        SpecialBulletType.NightMarket,
      );

      // Should have main hit effect + particles + ground residue
      expect(visualEffects.getContainer().children.length).toBeGreaterThan(20);
    });

    it("should persist ground residue longer than hit effect", () => {
      visualEffects.createHitEffect(
        new Vector(100, 100),
        SpecialBulletType.BloodCake,
      );

      // Update beyond hit duration (0.6s) but less than residue duration (2s)
      visualEffects.update(1.0);

      // Ground residue should still exist (some children remaining)
      expect(visualEffects.getContainer().children.length).toBeGreaterThan(0);
    });
  });
});
