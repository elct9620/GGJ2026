import { describe, test, expect } from "vitest";
import { Damage } from "./damage";

describe("Damage", () => {
  describe("constructor", () => {
    test("creates damage with integer value", () => {
      const d = new Damage(5);
      expect(d.value).toBe(5);
    });

    test("rounds float values to integers", () => {
      const d = new Damage(2.7);
      expect(d.value).toBe(3);
    });

    test("accepts zero damage", () => {
      const d = new Damage(0);
      expect(d.value).toBe(0);
    });

    test("throws TypeError for NaN", () => {
      expect(() => new Damage(NaN)).toThrow(TypeError);
      expect(() => new Damage(NaN)).toThrow("Damage must be a finite number");
    });

    test("throws TypeError for Infinity", () => {
      expect(() => new Damage(Infinity)).toThrow(TypeError);
      expect(() => new Damage(-Infinity)).toThrow(TypeError);
    });

    test("throws RangeError for negative values", () => {
      expect(() => new Damage(-1)).toThrow(RangeError);
      expect(() => new Damage(-1)).toThrow("Damage must be non-negative");
    });
  });

  describe("static normal()", () => {
    test("creates damage with value 1", () => {
      const d = Damage.normal();
      expect(d.value).toBe(1);
    });

    test("returns new instance each time", () => {
      const d1 = Damage.normal();
      const d2 = Damage.normal();
      expect(d1).not.toBe(d2);
    });
  });

  describe("static fromPercentage()", () => {
    test("calculates percentage damage correctly", () => {
      const d = Damage.fromPercentage(100, 0.5);
      expect(d.value).toBe(50);
    });

    test("rounds up to nearest integer", () => {
      const d = Damage.fromPercentage(10, 0.33);
      expect(d.value).toBe(4); // ceil(3.3) = 4
    });

    test("returns zero for zero HP", () => {
      const d = Damage.fromPercentage(0, 0.5);
      expect(d.value).toBe(0);
    });

    test("returns zero for zero percentage", () => {
      const d = Damage.fromPercentage(100, 0);
      expect(d.value).toBe(0);
    });

    test("returns full HP for 100%", () => {
      const d = Damage.fromPercentage(50, 1);
      expect(d.value).toBe(50);
    });

    test("throws TypeError for NaN parameters", () => {
      expect(() => Damage.fromPercentage(NaN, 0.5)).toThrow(TypeError);
      expect(() => Damage.fromPercentage(100, NaN)).toThrow(TypeError);
    });

    test("throws RangeError for negative HP", () => {
      expect(() => Damage.fromPercentage(-10, 0.5)).toThrow(RangeError);
      expect(() => Damage.fromPercentage(-10, 0.5)).toThrow(
        "Current HP must be non-negative",
      );
    });

    test("throws RangeError for percentage out of range", () => {
      expect(() => Damage.fromPercentage(100, -0.1)).toThrow(RangeError);
      expect(() => Damage.fromPercentage(100, 1.1)).toThrow(RangeError);
      expect(() => Damage.fromPercentage(100, 1.1)).toThrow(
        "Percentage must be between 0 and 1",
      );
    });
  });

  describe("multiply()", () => {
    test("multiplies damage by scalar", () => {
      const d = new Damage(5);
      const result = d.multiply(2);
      expect(result.value).toBe(10);
    });

    test("rounds result to integer", () => {
      const d = new Damage(3);
      const result = d.multiply(1.5);
      expect(result.value).toBe(5); // round(4.5) = 5
    });

    test("returns new instance (immutable)", () => {
      const d = new Damage(5);
      const result = d.multiply(2);
      expect(result).not.toBe(d);
      expect(d.value).toBe(5); // original unchanged
    });

    test("handles zero scalar", () => {
      const d = new Damage(5);
      const result = d.multiply(0);
      expect(result.value).toBe(0);
    });

    test("throws TypeError for NaN scalar", () => {
      const d = new Damage(5);
      expect(() => d.multiply(NaN)).toThrow(TypeError);
    });

    test("throws TypeError for Infinity scalar", () => {
      const d = new Damage(5);
      expect(() => d.multiply(Infinity)).toThrow(TypeError);
    });

    test("throws RangeError for negative scalar", () => {
      const d = new Damage(5);
      expect(() => d.multiply(-1)).toThrow(RangeError);
      expect(() => d.multiply(-1)).toThrow("Scalar must be non-negative");
    });
  });

  describe("withBonus()", () => {
    test("adds bonus to damage", () => {
      const d = new Damage(5);
      const result = d.withBonus(3);
      expect(result.value).toBe(8);
    });

    test("returns new instance (immutable)", () => {
      const d = new Damage(5);
      const result = d.withBonus(3);
      expect(result).not.toBe(d);
      expect(d.value).toBe(5); // original unchanged
    });

    test("handles negative bonus (damage reduction)", () => {
      const d = new Damage(5);
      const result = d.withBonus(-2);
      expect(result.value).toBe(3);
    });

    test("clamps to zero for large negative bonus", () => {
      const d = new Damage(5);
      const result = d.withBonus(-10);
      expect(result.value).toBe(0);
    });

    test("handles zero bonus", () => {
      const d = new Damage(5);
      const result = d.withBonus(0);
      expect(result.value).toBe(5);
    });

    test("throws TypeError for NaN bonus", () => {
      const d = new Damage(5);
      expect(() => d.withBonus(NaN)).toThrow(TypeError);
    });
  });

  describe("toNumber()", () => {
    test("returns damage value as number", () => {
      const d = new Damage(7);
      expect(d.toNumber()).toBe(7);
    });
  });

  describe("isZero()", () => {
    test("returns true for zero damage", () => {
      const d = new Damage(0);
      expect(d.isZero()).toBe(true);
    });

    test("returns false for non-zero damage", () => {
      const d = new Damage(1);
      expect(d.isZero()).toBe(false);
    });
  });

  describe("integration scenarios", () => {
    test("bullet with damage buff scenario", () => {
      const baseDamage = Damage.normal();
      const buffedDamage = baseDamage.multiply(2).withBonus(1);
      expect(buffedDamage.value).toBe(3);
    });

    test("percentage-based boss damage scenario", () => {
      const bossHP = 100;
      const percentageDamage = Damage.fromPercentage(bossHP, 0.2);
      expect(percentageDamage.value).toBe(20);
    });

    test("chained damage calculations", () => {
      const result = Damage.normal()
        .multiply(3) // 3
        .withBonus(2); // 5
      expect(result.value).toBe(5);
    });
  });
});
