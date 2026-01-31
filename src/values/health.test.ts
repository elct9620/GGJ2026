import { describe, test, expect } from "vitest";
import { Health } from "./health";
import { Damage } from "./damage";

describe("Health", () => {
  describe("constructor", () => {
    test("creates health with current and max values", () => {
      const h = new Health(3, 5);
      expect(h.current).toBe(3);
      expect(h.max).toBe(5);
    });

    test("rounds float values to integers", () => {
      const h = new Health(2.7, 4.3);
      expect(h.current).toBe(3);
      expect(h.max).toBe(4);
    });

    test("clamps current to max", () => {
      const h = new Health(10, 5);
      expect(h.current).toBe(5);
      expect(h.max).toBe(5);
    });

    test("accepts zero current", () => {
      const h = new Health(0, 5);
      expect(h.current).toBe(0);
    });

    test("throws TypeError for NaN values", () => {
      expect(() => new Health(NaN, 5)).toThrow(TypeError);
      expect(() => new Health(3, NaN)).toThrow(TypeError);
    });

    test("throws TypeError for Infinity values", () => {
      expect(() => new Health(Infinity, 5)).toThrow(TypeError);
      expect(() => new Health(3, Infinity)).toThrow(TypeError);
    });

    test("throws RangeError for zero max", () => {
      expect(() => new Health(0, 0)).toThrow(RangeError);
      expect(() => new Health(0, 0)).toThrow("Max health must be positive");
    });

    test("throws RangeError for negative max", () => {
      expect(() => new Health(3, -5)).toThrow(RangeError);
    });

    test("throws RangeError for negative current", () => {
      expect(() => new Health(-1, 5)).toThrow(RangeError);
      expect(() => new Health(-1, 5)).toThrow(
        "Current health must be non-negative",
      );
    });
  });

  describe("static player()", () => {
    test("creates player health with 5/5", () => {
      const h = Health.player();
      expect(h.current).toBe(5);
      expect(h.max).toBe(5);
    });
  });

  describe("static ghost()", () => {
    test("creates ghost health with 1/1", () => {
      const h = Health.ghost();
      expect(h.current).toBe(1);
      expect(h.max).toBe(1);
    });
  });

  describe("static boss()", () => {
    test("creates boss health with 3/3", () => {
      const h = Health.boss();
      expect(h.current).toBe(3);
      expect(h.max).toBe(3);
    });
  });

  describe("static full()", () => {
    test("creates full health with specified max", () => {
      const h = Health.full(10);
      expect(h.current).toBe(10);
      expect(h.max).toBe(10);
    });
  });

  describe("takeDamage()", () => {
    test("reduces health by damage amount", () => {
      const h = new Health(5, 5);
      const d = new Damage(2);
      const result = h.takeDamage(d);
      expect(result.current).toBe(3);
      expect(result.max).toBe(5);
    });

    test("returns new instance (immutable)", () => {
      const h = new Health(5, 5);
      const d = new Damage(2);
      const result = h.takeDamage(d);
      expect(result).not.toBe(h);
      expect(h.current).toBe(5); // original unchanged
    });

    test("clamps to zero for excessive damage", () => {
      const h = new Health(3, 5);
      const d = new Damage(10);
      const result = h.takeDamage(d);
      expect(result.current).toBe(0);
    });

    test("handles zero damage", () => {
      const h = new Health(5, 5);
      const d = new Damage(0);
      const result = h.takeDamage(d);
      expect(result.current).toBe(5);
    });

    test("throws TypeError for invalid parameter", () => {
      const h = new Health(5, 5);
      expect(() => h.takeDamage(null as any)).toThrow(TypeError);
      expect(() => h.takeDamage(3 as any)).toThrow(TypeError);
    });
  });

  describe("takeDamageAmount()", () => {
    test("reduces health by numeric amount", () => {
      const h = new Health(5, 5);
      const result = h.takeDamageAmount(2);
      expect(result.current).toBe(3);
    });

    test("clamps to zero for excessive damage", () => {
      const h = new Health(3, 5);
      const result = h.takeDamageAmount(10);
      expect(result.current).toBe(0);
    });

    test("throws TypeError for NaN", () => {
      const h = new Health(5, 5);
      expect(() => h.takeDamageAmount(NaN)).toThrow(TypeError);
    });

    test("throws RangeError for negative amount", () => {
      const h = new Health(5, 5);
      expect(() => h.takeDamageAmount(-1)).toThrow(RangeError);
    });
  });

  describe("heal()", () => {
    test("increases current health", () => {
      const h = new Health(2, 5);
      const result = h.heal(2);
      expect(result.current).toBe(4);
    });

    test("clamps to max health", () => {
      const h = new Health(3, 5);
      const result = h.heal(10);
      expect(result.current).toBe(5);
    });

    test("returns new instance (immutable)", () => {
      const h = new Health(2, 5);
      const result = h.heal(2);
      expect(result).not.toBe(h);
      expect(h.current).toBe(2); // original unchanged
    });

    test("handles zero heal", () => {
      const h = new Health(3, 5);
      const result = h.heal(0);
      expect(result.current).toBe(3);
    });

    test("throws TypeError for NaN", () => {
      const h = new Health(5, 5);
      expect(() => h.heal(NaN)).toThrow(TypeError);
    });

    test("throws RangeError for negative amount", () => {
      const h = new Health(5, 5);
      expect(() => h.heal(-1)).toThrow(RangeError);
    });
  });

  describe("isDead()", () => {
    test("returns true when current is zero", () => {
      const h = new Health(0, 5);
      expect(h.isDead()).toBe(true);
    });

    test("returns false when current is positive", () => {
      const h = new Health(1, 5);
      expect(h.isDead()).toBe(false);
    });
  });

  describe("isFull()", () => {
    test("returns true when current equals max", () => {
      const h = new Health(5, 5);
      expect(h.isFull()).toBe(true);
    });

    test("returns false when current is less than max", () => {
      const h = new Health(4, 5);
      expect(h.isFull()).toBe(false);
    });
  });

  describe("percentage()", () => {
    test("returns 1 for full health", () => {
      const h = new Health(5, 5);
      expect(h.percentage()).toBe(1);
    });

    test("returns 0 for zero health", () => {
      const h = new Health(0, 5);
      expect(h.percentage()).toBe(0);
    });

    test("returns correct ratio", () => {
      const h = new Health(3, 10);
      expect(h.percentage()).toBe(0.3);
    });
  });

  describe("setMax()", () => {
    test("updates max and scales current proportionally", () => {
      const h = new Health(5, 10); // 50%
      const result = h.setMax(20);
      expect(result.max).toBe(20);
      expect(result.current).toBe(10); // 50% of 20
    });

    test("returns new instance (immutable)", () => {
      const h = new Health(5, 10);
      const result = h.setMax(20);
      expect(result).not.toBe(h);
      expect(h.max).toBe(10); // original unchanged
    });

    test("throws TypeError for NaN", () => {
      const h = new Health(5, 10);
      expect(() => h.setMax(NaN)).toThrow(TypeError);
    });

    test("throws RangeError for zero or negative", () => {
      const h = new Health(5, 10);
      expect(() => h.setMax(0)).toThrow(RangeError);
      expect(() => h.setMax(-5)).toThrow(RangeError);
    });
  });

  describe("integration scenarios", () => {
    test("ghost dies from normal bullet", () => {
      const ghost = Health.ghost();
      const bullet = Damage.normal();
      const afterHit = ghost.takeDamage(bullet);
      expect(afterHit.isDead()).toBe(true);
    });

    test("boss survives multiple hits", () => {
      let boss = Health.boss();
      const bullet = Damage.normal();

      boss = boss.takeDamage(bullet);
      expect(boss.isDead()).toBe(false);
      expect(boss.percentage()).toBeCloseTo(0.667, 2);

      boss = boss.takeDamage(bullet);
      expect(boss.isDead()).toBe(false);
      expect(boss.percentage()).toBeCloseTo(0.333, 2);

      boss = boss.takeDamage(bullet);
      expect(boss.isDead()).toBe(true);
    });

    test("player survives 4 hits", () => {
      let player = Health.player();
      const damage = new Damage(1);

      for (let i = 0; i < 4; i++) {
        player = player.takeDamage(damage);
        expect(player.isDead()).toBe(false);
      }

      player = player.takeDamage(damage);
      expect(player.isDead()).toBe(true);
    });

    test("buff damage kills ghost instantly", () => {
      const ghost = Health.ghost();
      const buffedDamage = Damage.normal().multiply(3);
      const afterHit = ghost.takeDamage(buffedDamage);
      expect(afterHit.isDead()).toBe(true);
    });
  });
});
