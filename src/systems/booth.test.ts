import { beforeEach, describe, expect, it } from "vitest";
import { BoothSystem } from "./booth";
import { FoodType, BoothId } from "../entities/booth";
import { SystemPriority } from "../core/systems/system.interface";

describe("BoothSystem", () => {
  let boothSystem: BoothSystem;

  beforeEach(() => {
    boothSystem = new BoothSystem();
  });

  describe("ISystem Interface", () => {
    it("應有正確的 name", () => {
      expect(boothSystem.name).toBe("BoothSystem");
    });

    it("應有正確的 priority", () => {
      expect(boothSystem.priority).toBe(SystemPriority.BOOTH);
    });

    it("initialize 應可被呼叫", () => {
      expect(() => boothSystem.initialize()).not.toThrow();
    });

    it("update 應可被呼叫（無操作）", () => {
      expect(() => boothSystem.update(0.016)).not.toThrow();
    });

    it("destroy 應清理資源", () => {
      expect(() => boothSystem.destroy()).not.toThrow();
    });
  });

  describe("Booth Container", () => {
    it("應提供渲染容器", () => {
      const container = boothSystem.getContainer();
      expect(container).toBeDefined();
      expect(container.children.length).toBeGreaterThan(0);
    });
  });

  describe("Store Food", () => {
    it("應成功儲存珍珠", () => {
      const result = boothSystem.storeFood(FoodType.Pearl);
      expect(result).toBe(true);
      expect(boothSystem.getFoodCount(BoothId.Pearl)).toBe(1);
    });

    it("應成功儲存豆腐", () => {
      const result = boothSystem.storeFood(FoodType.Tofu);
      expect(result).toBe(true);
      expect(boothSystem.getFoodCount(BoothId.Tofu)).toBe(1);
    });

    it("應成功儲存米血", () => {
      const result = boothSystem.storeFood(FoodType.BloodCake);
      expect(result).toBe(true);
      expect(boothSystem.getFoodCount(BoothId.BloodCake)).toBe(1);
    });

    it("攤位滿時應回傳 false", () => {
      // 填滿攤位（容量 6）
      for (let i = 0; i < 6; i++) {
        boothSystem.storeFood(FoodType.Pearl);
      }

      // 第 7 個應失敗
      const result = boothSystem.storeFood(FoodType.Pearl);
      expect(result).toBe(false);
      expect(boothSystem.getFoodCount(BoothId.Pearl)).toBe(6);
    });
  });

  describe("Retrieve Food", () => {
    it("應成功提取食材", () => {
      boothSystem.storeFood(FoodType.Pearl);

      const food = boothSystem.retrieveFood(BoothId.Pearl);
      expect(food).toBe(FoodType.Pearl);
      expect(boothSystem.getFoodCount(BoothId.Pearl)).toBe(0);
    });

    it("攤位空時應回傳 null", () => {
      const food = boothSystem.retrieveFood(BoothId.Pearl);
      expect(food).toBeNull();
    });
  });

  describe("Steal Food", () => {
    it("應成功偷取食材", () => {
      boothSystem.storeFood(FoodType.Pearl);

      const result = boothSystem.stealFood(BoothId.Pearl);
      expect(result).toBe(true);
      expect(boothSystem.getFoodCount(BoothId.Pearl)).toBe(0);
    });

    it("攤位空時應回傳 false", () => {
      const result = boothSystem.stealFood(BoothId.Pearl);
      expect(result).toBe(false);
    });
  });

  describe("Reset", () => {
    it("應清空所有攤位", () => {
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Tofu);
      boothSystem.storeFood(FoodType.BloodCake);

      boothSystem.reset();

      expect(boothSystem.getFoodCount(BoothId.Pearl)).toBe(0);
      expect(boothSystem.getFoodCount(BoothId.Tofu)).toBe(0);
      expect(boothSystem.getFoodCount(BoothId.BloodCake)).toBe(0);
    });
  });

  describe("Consume Food", () => {
    it("應成功消耗指定數量的食材", () => {
      // 儲存 4 個珍珠
      for (let i = 0; i < 4; i++) {
        boothSystem.storeFood(FoodType.Pearl);
      }

      const result = boothSystem.consumeFood(BoothId.Pearl, 3);
      expect(result).toBe(true);
      expect(boothSystem.getFoodCount(BoothId.Pearl)).toBe(1);
    });

    it("食材不足時應回傳 false 且不消耗", () => {
      boothSystem.storeFood(FoodType.Pearl);

      const result = boothSystem.consumeFood(BoothId.Pearl, 3);
      expect(result).toBe(false);
      expect(boothSystem.getFoodCount(BoothId.Pearl)).toBe(1);
    });

    it("攤位空時應回傳 false", () => {
      const result = boothSystem.consumeFood(BoothId.Pearl, 1);
      expect(result).toBe(false);
    });

    it("消耗全部食材應成功", () => {
      for (let i = 0; i < 3; i++) {
        boothSystem.storeFood(FoodType.Tofu);
      }

      const result = boothSystem.consumeFood(BoothId.Tofu, 3);
      expect(result).toBe(true);
      expect(boothSystem.getFoodCount(BoothId.Tofu)).toBe(0);
    });
  });

  describe("getTotalFoodCount", () => {
    it("空攤位應回傳 0", () => {
      expect(boothSystem.getTotalFoodCount()).toBe(0);
    });

    it("應正確計算單一攤位的食材數", () => {
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Pearl);

      expect(boothSystem.getTotalFoodCount()).toBe(2);
    });

    it("應正確加總多攤位的食材數", () => {
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Tofu);
      boothSystem.storeFood(FoodType.BloodCake);
      boothSystem.storeFood(FoodType.BloodCake);
      boothSystem.storeFood(FoodType.BloodCake);

      expect(boothSystem.getTotalFoodCount()).toBe(6);
    });

    it("提取食材後應更新總數", () => {
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Tofu);

      boothSystem.retrieveFood(BoothId.Pearl);

      expect(boothSystem.getTotalFoodCount()).toBe(2);
    });

    it("reset 後應回傳 0", () => {
      boothSystem.storeFood(FoodType.Pearl);
      boothSystem.storeFood(FoodType.Tofu);
      boothSystem.storeFood(FoodType.BloodCake);

      boothSystem.reset();

      expect(boothSystem.getTotalFoodCount()).toBe(0);
    });
  });
});
