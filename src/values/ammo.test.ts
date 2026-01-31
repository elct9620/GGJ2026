import { describe, test, expect } from "vitest";
import { Ammo } from "./ammo";

describe("Ammo", () => {
  describe("constructor", () => {
    test("creates ammo with current and max values", () => {
      const a = new Ammo(3, 6);
      expect(a.current).toBe(3);
      expect(a.max).toBe(6);
    });

    test("rounds float values to integers", () => {
      const a = new Ammo(2.7, 5.3);
      expect(a.current).toBe(3);
      expect(a.max).toBe(5);
    });

    test("clamps current to max", () => {
      const a = new Ammo(10, 6);
      expect(a.current).toBe(6);
      expect(a.max).toBe(6);
    });

    test("accepts zero current", () => {
      const a = new Ammo(0, 6);
      expect(a.current).toBe(0);
    });

    test("throws TypeError for NaN values", () => {
      expect(() => new Ammo(NaN, 6)).toThrow(TypeError);
      expect(() => new Ammo(3, NaN)).toThrow(TypeError);
    });

    test("throws TypeError for Infinity values", () => {
      expect(() => new Ammo(Infinity, 6)).toThrow(TypeError);
      expect(() => new Ammo(3, Infinity)).toThrow(TypeError);
    });

    test("throws RangeError for zero max", () => {
      expect(() => new Ammo(0, 0)).toThrow(RangeError);
      expect(() => new Ammo(0, 0)).toThrow("Max ammo must be positive");
    });

    test("throws RangeError for negative max", () => {
      expect(() => new Ammo(3, -6)).toThrow(RangeError);
    });

    test("throws RangeError for negative current", () => {
      expect(() => new Ammo(-1, 6)).toThrow(RangeError);
      expect(() => new Ammo(-1, 6)).toThrow(
        "Current ammo must be non-negative",
      );
    });
  });

  describe("static default()", () => {
    test("creates default ammo with 6/6", () => {
      const a = Ammo.default();
      expect(a.current).toBe(6);
      expect(a.max).toBe(6);
    });
  });

  describe("static full()", () => {
    test("creates full ammo with specified max", () => {
      const a = Ammo.full(10);
      expect(a.current).toBe(10);
      expect(a.max).toBe(10);
    });
  });

  describe("consume()", () => {
    test("reduces current by 1", () => {
      const a = new Ammo(6, 6);
      const result = a.consume();
      expect(result.current).toBe(5);
      expect(result.max).toBe(6);
    });

    test("returns new instance (immutable)", () => {
      const a = new Ammo(6, 6);
      const result = a.consume();
      expect(result).not.toBe(a);
      expect(a.current).toBe(6); // original unchanged
    });

    test("clamps to zero", () => {
      const a = new Ammo(0, 6);
      const result = a.consume();
      expect(result.current).toBe(0);
    });

    test("can consume all ammo", () => {
      let a = Ammo.default();
      for (let i = 0; i < 6; i++) {
        a = a.consume();
      }
      expect(a.current).toBe(0);
      expect(a.isEmpty()).toBe(true);
    });
  });

  describe("consumeMultiple()", () => {
    test("reduces current by specified amount", () => {
      const a = new Ammo(6, 6);
      const result = a.consumeMultiple(3);
      expect(result.current).toBe(3);
    });

    test("clamps to zero", () => {
      const a = new Ammo(3, 6);
      const result = a.consumeMultiple(10);
      expect(result.current).toBe(0);
    });

    test("handles zero amount", () => {
      const a = new Ammo(6, 6);
      const result = a.consumeMultiple(0);
      expect(result.current).toBe(6);
    });

    test("throws TypeError for NaN", () => {
      const a = new Ammo(6, 6);
      expect(() => a.consumeMultiple(NaN)).toThrow(TypeError);
    });

    test("throws RangeError for negative amount", () => {
      const a = new Ammo(6, 6);
      expect(() => a.consumeMultiple(-1)).toThrow(RangeError);
    });
  });

  describe("reload()", () => {
    test("fills current to max", () => {
      const a = new Ammo(2, 6);
      const result = a.reload();
      expect(result.current).toBe(6);
      expect(result.max).toBe(6);
    });

    test("returns new instance (immutable)", () => {
      const a = new Ammo(2, 6);
      const result = a.reload();
      expect(result).not.toBe(a);
      expect(a.current).toBe(2); // original unchanged
    });

    test("handles empty ammo", () => {
      const a = new Ammo(0, 6);
      const result = a.reload();
      expect(result.current).toBe(6);
    });

    test("handles already full ammo", () => {
      const a = new Ammo(6, 6);
      const result = a.reload();
      expect(result.current).toBe(6);
    });
  });

  describe("setMax()", () => {
    test("updates max while preserving current", () => {
      const a = new Ammo(3, 6);
      const result = a.setMax(10);
      expect(result.current).toBe(3);
      expect(result.max).toBe(10);
    });

    test("clamps current if exceeds new max", () => {
      const a = new Ammo(6, 6);
      const result = a.setMax(4);
      expect(result.current).toBe(4);
      expect(result.max).toBe(4);
    });

    test("returns new instance (immutable)", () => {
      const a = new Ammo(3, 6);
      const result = a.setMax(10);
      expect(result).not.toBe(a);
      expect(a.max).toBe(6); // original unchanged
    });

    test("throws TypeError for NaN", () => {
      const a = new Ammo(6, 6);
      expect(() => a.setMax(NaN)).toThrow(TypeError);
    });

    test("throws RangeError for zero or negative", () => {
      const a = new Ammo(6, 6);
      expect(() => a.setMax(0)).toThrow(RangeError);
      expect(() => a.setMax(-5)).toThrow(RangeError);
    });
  });

  describe("addMaxBonus()", () => {
    test("increases max by bonus", () => {
      const a = new Ammo(6, 6);
      const result = a.addMaxBonus(2);
      expect(result.max).toBe(8);
      expect(result.current).toBe(6);
    });

    test("handles negative bonus (but clamps to 1)", () => {
      const a = new Ammo(3, 3);
      const result = a.addMaxBonus(-10);
      expect(result.max).toBe(1);
    });

    test("returns new instance (immutable)", () => {
      const a = new Ammo(6, 6);
      const result = a.addMaxBonus(2);
      expect(result).not.toBe(a);
      expect(a.max).toBe(6); // original unchanged
    });

    test("throws TypeError for NaN", () => {
      const a = new Ammo(6, 6);
      expect(() => a.addMaxBonus(NaN)).toThrow(TypeError);
    });
  });

  describe("isEmpty()", () => {
    test("returns true when current is zero", () => {
      const a = new Ammo(0, 6);
      expect(a.isEmpty()).toBe(true);
    });

    test("returns false when current is positive", () => {
      const a = new Ammo(1, 6);
      expect(a.isEmpty()).toBe(false);
    });
  });

  describe("canShoot()", () => {
    test("returns true when current is positive", () => {
      const a = new Ammo(1, 6);
      expect(a.canShoot()).toBe(true);
    });

    test("returns false when current is zero", () => {
      const a = new Ammo(0, 6);
      expect(a.canShoot()).toBe(false);
    });
  });

  describe("isFull()", () => {
    test("returns true when current equals max", () => {
      const a = new Ammo(6, 6);
      expect(a.isFull()).toBe(true);
    });

    test("returns false when current is less than max", () => {
      const a = new Ammo(5, 6);
      expect(a.isFull()).toBe(false);
    });
  });

  describe("integration scenarios", () => {
    test("shoot and reload cycle", () => {
      let ammo = Ammo.default();
      expect(ammo.canShoot()).toBe(true);

      // Shoot 6 times
      for (let i = 0; i < 6; i++) {
        ammo = ammo.consume();
      }
      expect(ammo.isEmpty()).toBe(true);
      expect(ammo.canShoot()).toBe(false);

      // Reload
      ammo = ammo.reload();
      expect(ammo.isFull()).toBe(true);
      expect(ammo.canShoot()).toBe(true);
    });

    test("大胃王升級 scenario", () => {
      let ammo = Ammo.default();
      expect(ammo.max).toBe(6);

      // Apply upgrade
      ammo = ammo.addMaxBonus(2);
      expect(ammo.max).toBe(8);
      expect(ammo.current).toBe(6); // Current not affected

      // Reload to get full bonus
      ammo = ammo.reload();
      expect(ammo.current).toBe(8);
    });

    test("multiple upgrades stack", () => {
      let ammo = Ammo.default();

      ammo = ammo.addMaxBonus(2);
      ammo = ammo.addMaxBonus(2);
      ammo = ammo.addMaxBonus(2);

      expect(ammo.max).toBe(12);
    });
  });
});
