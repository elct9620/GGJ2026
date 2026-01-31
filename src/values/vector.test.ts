import { describe, test, expect } from "vitest";
import { Vector } from "./vector";

describe("Vector", () => {
  describe("constructor", () => {
    test("creates vector with integer coordinates", () => {
      const v = new Vector(100, 200);
      expect(v.x).toBe(100);
      expect(v.y).toBe(200);
    });

    test("rounds float coordinates to integers", () => {
      const v = new Vector(100.6, 200.4);
      expect(v.x).toBe(101);
      expect(v.y).toBe(200);
    });

    test("throws TypeError for NaN coordinates", () => {
      expect(() => new Vector(NaN, 100)).toThrow(TypeError);
      expect(() => new Vector(100, NaN)).toThrow(TypeError);
    });

    test("throws TypeError for Infinity coordinates", () => {
      expect(() => new Vector(Infinity, 100)).toThrow(TypeError);
      expect(() => new Vector(100, -Infinity)).toThrow(TypeError);
    });

    test("accepts negative coordinates", () => {
      const v = new Vector(-50, -100);
      expect(v.x).toBe(-50);
      expect(v.y).toBe(-100);
    });

    test("accepts zero coordinates", () => {
      const v = new Vector(0, 0);
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });
  });

  describe("add", () => {
    test("adds two vectors correctly", () => {
      const v1 = new Vector(100, 200);
      const v2 = new Vector(10, -5);
      const result = v1.add(v2);
      expect(result.x).toBe(110);
      expect(result.y).toBe(195);
    });

    test("returns new Vector instance (immutable)", () => {
      const v1 = new Vector(100, 200);
      const v2 = new Vector(10, -5);
      const result = v1.add(v2);
      expect(result).not.toBe(v1);
      expect(result).not.toBe(v2);
      expect(v1.x).toBe(100); // 原向量不變
      expect(v1.y).toBe(200);
    });

    test("handles zero vector addition", () => {
      const v1 = new Vector(100, 200);
      const zero = new Vector(0, 0);
      const result = v1.add(zero);
      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });

    test("throws TypeError for null/undefined parameter", () => {
      const v = new Vector(100, 200);
      expect(() => v.add(null as any)).toThrow(TypeError);
      expect(() => v.add(undefined as any)).toThrow(TypeError);
    });
  });

  describe("subtract", () => {
    test("subtracts two vectors correctly", () => {
      const v1 = new Vector(500, 400);
      const v2 = new Vector(300, 300);
      const result = v1.subtract(v2);
      expect(result.x).toBe(200);
      expect(result.y).toBe(100);
    });

    test("returns new Vector instance (immutable)", () => {
      const v1 = new Vector(500, 400);
      const v2 = new Vector(300, 300);
      const result = v1.subtract(v2);
      expect(result).not.toBe(v1);
      expect(result).not.toBe(v2);
    });

    test("handles negative results", () => {
      const v1 = new Vector(100, 100);
      const v2 = new Vector(200, 300);
      const result = v1.subtract(v2);
      expect(result.x).toBe(-100);
      expect(result.y).toBe(-200);
    });

    test("throws TypeError for invalid parameter", () => {
      const v = new Vector(100, 200);
      expect(() => v.subtract(null as any)).toThrow(TypeError);
    });
  });

  describe("multiply", () => {
    test("multiplies vector by scalar correctly", () => {
      const v = new Vector(10, 5);
      const result = v.multiply(2);
      expect(result.x).toBe(20);
      expect(result.y).toBe(10);
    });

    test("rounds result to nearest integer", () => {
      const v = new Vector(10, 5);
      const result = v.multiply(0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(3); // 2.5 rounds to 3
    });

    test("handles zero scalar", () => {
      const v = new Vector(10, 5);
      const result = v.multiply(0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    test("handles negative scalar", () => {
      const v = new Vector(10, 5);
      const result = v.multiply(-1);
      expect(result.x).toBe(-10);
      expect(result.y).toBe(-5);
    });

    test("throws TypeError for NaN scalar", () => {
      const v = new Vector(10, 5);
      expect(() => v.multiply(NaN)).toThrow(TypeError);
    });

    test("throws RangeError for Infinity scalar", () => {
      const v = new Vector(10, 5);
      expect(() => v.multiply(Infinity)).toThrow(RangeError);
      expect(() => v.multiply(-Infinity)).toThrow(RangeError);
    });
  });

  describe("normalize", () => {
    test("normalizes vector to unit length", () => {
      const v = new Vector(3, 4);
      const result = v.normalize();
      // magnitude = 5, normalized = (3/5, 4/5) = (0.6, 0.8) → rounds to (1, 1)
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    test("handles zero vector gracefully", () => {
      const v = new Vector(0, 0);
      const result = v.normalize();
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    test("rounds result to nearest integer", () => {
      const v = new Vector(100, 0);
      const result = v.normalize();
      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
    });

    test("returns new Vector instance (immutable)", () => {
      const v = new Vector(3, 4);
      const result = v.normalize();
      expect(result).not.toBe(v);
      expect(v.x).toBe(3); // 原向量不變
      expect(v.y).toBe(4);
    });
  });

  describe("magnitude", () => {
    test("calculates magnitude correctly", () => {
      const v = new Vector(3, 4);
      expect(v.magnitude()).toBe(5);
    });

    test("handles zero vector", () => {
      const v = new Vector(0, 0);
      expect(v.magnitude()).toBe(0);
    });

    test("returns float result (not rounded)", () => {
      const v = new Vector(1, 1);
      expect(v.magnitude()).toBeCloseTo(Math.sqrt(2), 5);
    });

    test("handles negative coordinates", () => {
      const v = new Vector(-3, -4);
      expect(v.magnitude()).toBe(5);
    });
  });

  describe("distance", () => {
    test("calculates distance between two vectors", () => {
      const v1 = new Vector(100, 100);
      const v2 = new Vector(104, 103);
      expect(v1.distance(v2)).toBe(5);
    });

    test("returns zero for identical vectors", () => {
      const v1 = new Vector(100, 100);
      const v2 = new Vector(100, 100);
      expect(v1.distance(v2)).toBe(0);
    });

    test("returns float result (not rounded)", () => {
      const v1 = new Vector(0, 0);
      const v2 = new Vector(1, 1);
      expect(v1.distance(v2)).toBeCloseTo(Math.sqrt(2), 5);
    });

    test("throws TypeError for null/undefined parameter", () => {
      const v = new Vector(100, 100);
      expect(() => v.distance(null as any)).toThrow(TypeError);
      expect(() => v.distance(undefined as any)).toThrow(TypeError);
    });
  });

  describe("dot", () => {
    test("calculates dot product correctly", () => {
      const v1 = new Vector(2, 3);
      const v2 = new Vector(4, 5);
      expect(v1.dot(v2)).toBe(23); // 2*4 + 3*5 = 8 + 15 = 23
    });

    test("returns zero for perpendicular vectors", () => {
      const v1 = new Vector(1, 0);
      const v2 = new Vector(0, 1);
      expect(v1.dot(v2)).toBe(0);
    });

    test("returns negative for opposite direction vectors", () => {
      const v1 = new Vector(1, 0);
      const v2 = new Vector(-1, 0);
      expect(v1.dot(v2)).toBe(-1);
    });

    test("throws TypeError for invalid parameter", () => {
      const v = new Vector(1, 0);
      expect(() => v.dot(null as any)).toThrow(TypeError);
    });
  });

  describe("integration scenarios", () => {
    test("bullet tracking enemy scenario", () => {
      const bulletPos = new Vector(500, 400);
      const enemyPos = new Vector(700, 300);

      const direction = enemyPos.subtract(bulletPos);
      expect(direction.x).toBe(200);
      expect(direction.y).toBe(-100);

      const normalized = direction.normalize();
      const velocity = normalized.multiply(400);

      // Verify all steps produce valid vectors
      expect(velocity.x).toBeTypeOf("number");
      expect(velocity.y).toBeTypeOf("number");
    });

    test("collision detection distance scenario", () => {
      const player = new Vector(500, 500);
      const food = new Vector(510, 505);

      const dist = player.distance(food);
      const collisionRange = 24;

      expect(dist).toBeCloseTo(11.18, 1);
      expect(dist <= collisionRange).toBe(true);
    });

    test("chained vector operations", () => {
      const start = new Vector(0, 0);
      const result = start
        .add(new Vector(100, 100))
        .multiply(2)
        .subtract(new Vector(50, 50));

      expect(result.x).toBe(150);
      expect(result.y).toBe(150);
    });
  });
});
