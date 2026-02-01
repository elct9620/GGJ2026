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
    test("creates boss health with config value", () => {
      const h = Health.boss();
      // SPEC § 2.6.2: Boss 基礎血量 = 10
      expect(h.current).toBe(10);
      expect(h.max).toBe(10);
    });
  });

  // =========================================================================
  // EN-16 ~ EN-19: 餓鬼各波次 HP 成長測試
  // SPEC § 2.6.2: HP = floor(1 + (W-1) × 0.03)
  // =========================================================================
  describe("static ghostForWave()", () => {
    test("EN-16: wave 1 ghost HP = 1", () => {
      const h = Health.ghostForWave(1);
      expect(h.current).toBe(1);
      expect(h.max).toBe(1);
    });

    test("EN-17: wave 5 ghost HP = 1", () => {
      // floor(1 + 4 × 0.03) = floor(1.12) = 1
      const h = Health.ghostForWave(5);
      expect(h.current).toBe(1);
      expect(h.max).toBe(1);
    });

    test("EN-18: wave 10 ghost HP = 1", () => {
      // floor(1 + 9 × 0.03) = floor(1.27) = 1
      const h = Health.ghostForWave(10);
      expect(h.current).toBe(1);
      expect(h.max).toBe(1);
    });

    test("EN-19: wave 15 ghost HP = 1", () => {
      // floor(1 + 14 × 0.03) = floor(1.42) = 1
      const h = Health.ghostForWave(15);
      expect(h.current).toBe(1);
      expect(h.max).toBe(1);
    });

    test("default wave is 1", () => {
      const h = Health.ghostForWave();
      expect(h.current).toBe(1);
      expect(h.max).toBe(1);
    });
  });

  // =========================================================================
  // EN-20 ~ EN-23: 菁英各波次 HP 成長測試
  // SPEC § 2.6.2: HP = round(2 + (W-1) × 0.6)
  // =========================================================================
  describe("static eliteForWave()", () => {
    test("EN-20: wave 1 elite HP = 2", () => {
      // round(2 + 0 × 0.6) = 2
      const h = Health.eliteForWave(1);
      expect(h.current).toBe(2);
      expect(h.max).toBe(2);
    });

    test("EN-21: wave 5 elite HP = 4", () => {
      // round(2 + 4 × 0.6) = round(4.4) = 4
      const h = Health.eliteForWave(5);
      expect(h.current).toBe(4);
      expect(h.max).toBe(4);
    });

    test("EN-22: wave 10 elite HP = 7", () => {
      // round(2 + 9 × 0.6) = round(7.4) = 7
      const h = Health.eliteForWave(10);
      expect(h.current).toBe(7);
      expect(h.max).toBe(7);
    });

    test("EN-23: wave 15 elite HP = 10", () => {
      // round(2 + 14 × 0.6) = round(10.4) = 10
      const h = Health.eliteForWave(15);
      expect(h.current).toBe(10);
      expect(h.max).toBe(10);
    });

    test("default wave is 1", () => {
      const h = Health.eliteForWave();
      expect(h.current).toBe(2);
      expect(h.max).toBe(2);
    });
  });

  // =========================================================================
  // EN-24 ~ EN-26: Boss 各波次 HP 成長測試
  // SPEC § 2.6.2: HP = round(10 + (W-5) × 1.5)
  // =========================================================================
  describe("static bossForWave()", () => {
    test("EN-24: wave 5 boss HP = 10", () => {
      // round(10 + 0 × 1.5) = 10
      const h = Health.bossForWave(5);
      expect(h.current).toBe(10);
      expect(h.max).toBe(10);
    });

    test("EN-25: wave 10 boss HP = 18", () => {
      // round(10 + 5 × 1.5) = round(17.5) = 18
      const h = Health.bossForWave(10);
      expect(h.current).toBe(18);
      expect(h.max).toBe(18);
    });

    test("EN-26: wave 15 boss HP = 25", () => {
      // round(10 + 10 × 1.5) = round(25) = 25
      const h = Health.bossForWave(15);
      expect(h.current).toBe(25);
      expect(h.max).toBe(25);
    });

    test("default wave is 5", () => {
      const h = Health.bossForWave();
      expect(h.current).toBe(10);
      expect(h.max).toBe(10);
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

      // SPEC § 2.6.2: Boss 基礎血量 = 10，普通子彈傷害 = 1
      // 10 HP boss 需要 10 發子彈才會死亡
      boss = boss.takeDamage(bullet);
      expect(boss.isDead()).toBe(false);
      expect(boss.percentage()).toBeCloseTo(0.9, 2); // 9/10 = 0.9

      // 打到剩 1 HP
      for (let i = 0; i < 8; i++) {
        boss = boss.takeDamage(bullet);
      }
      expect(boss.isDead()).toBe(false);
      expect(boss.percentage()).toBeCloseTo(0.1, 2); // 1/10 = 0.1

      // 最後一擊
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
