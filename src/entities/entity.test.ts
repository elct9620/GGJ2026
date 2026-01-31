import { describe, test, expect, beforeEach } from "vitest";
import { Entity, resetEntityIdCounter } from "./entity";

// Test implementation of Entity
class TestEntity extends Entity {}

describe("Entity", () => {
  beforeEach(() => {
    resetEntityIdCounter();
  });

  describe("constructor", () => {
    test("assigns unique ID as string", () => {
      const entity1 = new TestEntity();
      const entity2 = new TestEntity();

      expect(entity1.id).toBe("1");
      expect(entity2.id).toBe("2");
    });

    test("sets active to true by default", () => {
      const entity = new TestEntity();
      expect(entity.active).toBe(true);
    });

    test("generates sequential IDs", () => {
      const entities = Array.from({ length: 10 }, () => new TestEntity());
      const ids = entities.map((e) => e.id);

      expect(ids).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    });

    test("ID is readonly (TypeScript constraint)", () => {
      const entity = new TestEntity();
      // TypeScript 會阻止編譯時修改 readonly 屬性
      // 在 JavaScript 運行時不會拋出錯誤，因為 readonly 是 TypeScript 的編譯時檢查
      // 只需驗證 ID 屬性存在且為字串即可
      expect(entity.id).toBeTruthy();
      expect(typeof entity.id).toBe("string");
    });
  });

  describe("activate", () => {
    test("sets active to true", () => {
      const entity = new TestEntity();
      entity.active = false;
      entity.activate();
      expect(entity.active).toBe(true);
    });

    test("has no effect if already active", () => {
      const entity = new TestEntity();
      expect(entity.active).toBe(true);
      entity.activate();
      expect(entity.active).toBe(true);
    });
  });

  describe("deactivate", () => {
    test("sets active to false", () => {
      const entity = new TestEntity();
      entity.deactivate();
      expect(entity.active).toBe(false);
    });

    test("has no effect if already inactive", () => {
      const entity = new TestEntity();
      entity.deactivate();
      expect(entity.active).toBe(false);
      entity.deactivate();
      expect(entity.active).toBe(false);
    });
  });

  describe("object pool integration", () => {
    test("can be reactivated after deactivation", () => {
      const entity = new TestEntity();
      const originalId = entity.id;

      entity.deactivate();
      expect(entity.active).toBe(false);

      entity.activate();
      expect(entity.active).toBe(true);
      expect(entity.id).toBe(originalId); // ID 不變
    });

    test("maintains unique ID across activate/deactivate cycles", () => {
      const entity = new TestEntity();
      const id = entity.id;

      for (let i = 0; i < 5; i++) {
        entity.deactivate();
        entity.activate();
      }

      expect(entity.id).toBe(id); // ID 始終不變
    });
  });

  describe("resetEntityIdCounter", () => {
    test("resets ID counter to 1", () => {
      new TestEntity();
      new TestEntity();
      new TestEntity();

      resetEntityIdCounter();

      const entity = new TestEntity();
      expect(entity.id).toBe("1");
    });
  });
});
