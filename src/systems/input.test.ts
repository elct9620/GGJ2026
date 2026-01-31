import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputSystem } from "./input";
import { SystemPriority } from "../core/systems/system.interface";

describe("InputSystem", () => {
  let inputSystem: InputSystem;

  beforeEach(() => {
    inputSystem = new InputSystem();
    inputSystem.initialize();
  });

  describe("ISystem Interface", () => {
    it("應有正確的 name", () => {
      expect(inputSystem.name).toBe("InputSystem");
    });

    it("應有正確的 priority", () => {
      expect(inputSystem.priority).toBe(SystemPriority.INPUT);
    });

    it("initialize 應設定事件監聽器", () => {
      const newSystem = new InputSystem();
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      newSystem.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keyup",
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
    });

    it("update 應可被呼叫（無操作）", () => {
      expect(() => inputSystem.update(0.016)).not.toThrow();
    });

    it("destroy 應清理事件監聽器", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      inputSystem.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keyup",
        expect.any(Function),
      );

      removeEventListenerSpy.mockRestore();
    });

    it("destroy 應清空所有按鍵狀態", () => {
      // 模擬按下按鍵
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
      expect(inputSystem.isKeyPressed("w")).toBe(true);

      inputSystem.destroy();

      expect(inputSystem.getPressedKeys().size).toBe(0);
    });
  });

  describe("Movement Input", () => {
    it("應偵測 W 鍵向上移動", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));

      const direction = inputSystem.getMovementDirection();
      expect(direction.y).toBe(-1);
    });

    it("應偵測 S 鍵向下移動", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));

      const direction = inputSystem.getMovementDirection();
      expect(direction.y).toBe(1);
    });

    it("應偵測 A 鍵向左移動", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));

      const direction = inputSystem.getMovementDirection();
      expect(direction.x).toBe(-1);
    });

    it("應偵測 D 鍵向右移動", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));

      const direction = inputSystem.getMovementDirection();
      expect(direction.x).toBe(1);
    });

    it("應支援對角線移動", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));

      const direction = inputSystem.getMovementDirection();
      expect(direction.x).toBe(1);
      expect(direction.y).toBe(-1);
    });

    it("應忽略大小寫", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "W" }));

      const direction = inputSystem.getMovementDirection();
      expect(direction.y).toBe(-1);
    });

    it("keyup 應停止移動", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }));

      const direction = inputSystem.getMovementDirection();
      expect(direction.y).toBe(0);
    });
  });

  describe("Shoot Input", () => {
    it("應偵測 Space 鍵射擊", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));

      expect(inputSystem.isShootPressed()).toBe(true);
    });

    it("未按下時應回傳 false", () => {
      expect(inputSystem.isShootPressed()).toBe(false);
    });
  });

  describe("Booth Key Input", () => {
    it("應偵測數字鍵 1", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "1" }));

      expect(inputSystem.getBoothKeyPressed()).toBe(1);
    });

    it("應偵測數字鍵 2", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "2" }));

      expect(inputSystem.getBoothKeyPressed()).toBe(2);
    });

    it("應偵測數字鍵 3", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "3" }));

      expect(inputSystem.getBoothKeyPressed()).toBe(3);
    });

    it("未按下數字鍵時應回傳 null", () => {
      expect(inputSystem.getBoothKeyPressed()).toBeNull();
    });

    it("按下非數字鍵時應回傳 null", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "4" }));

      expect(inputSystem.getBoothKeyPressed()).toBeNull();
    });
  });

  describe("General Key Input", () => {
    it("應偵測任意鍵按下", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }));

      expect(inputSystem.isKeyPressed("x")).toBe(true);
    });

    it("應忽略大小寫", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "X" }));

      expect(inputSystem.isKeyPressed("x")).toBe(true);
      expect(inputSystem.isKeyPressed("X")).toBe(true);
    });
  });

  describe("Clear", () => {
    it("應清除所有按鍵狀態", () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));

      inputSystem.clear();

      expect(inputSystem.getMovementDirection().x).toBe(0);
      expect(inputSystem.getMovementDirection().y).toBe(0);
    });
  });
});
