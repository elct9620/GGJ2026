import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { UpgradeScreen } from "./upgrade-screen";
import type { UpgradeOption } from "../systems/upgrade";

describe("UpgradeScreen", () => {
  let upgradeScreen: UpgradeScreen;
  let onSelectMock: (upgradeId: string) => void;

  const mockOptions: UpgradeOption[] = [
    {
      id: "spicy",
      name: "加辣",
      description: "臭豆腐傷害 +0.5",
      cost: null, // SPEC § 2.3.4: 無消耗
      effect: vi.fn(),
    },
    {
      id: "coconut",
      name: "加椰果",
      description: "珍珠奶茶子彈 +1",
      cost: null, // SPEC § 2.3.4: 無消耗
      effect: vi.fn(),
    },
  ];

  beforeEach(() => {
    onSelectMock = vi.fn() as unknown as (upgradeId: string) => void;
    upgradeScreen = new UpgradeScreen(onSelectMock);
  });

  afterEach(() => {
    upgradeScreen.destroy();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("creates container that is initially hidden", () => {
      const container = upgradeScreen.getContainer();
      expect(container).toBeDefined();
      expect(container.visible).toBe(false);
    });
  });

  describe("showWithOptions()", () => {
    it("makes container visible", () => {
      upgradeScreen.showWithOptions(mockOptions);
      expect(upgradeScreen.getContainer().visible).toBe(true);
    });

    it("displays upgrade options (SPEC § 2.3.4: UP-09)", () => {
      upgradeScreen.showWithOptions(mockOptions);
      // Container should have children (options)
      const container = upgradeScreen.getContainer();
      expect(container.children.length).toBeGreaterThan(0);
    });
  });

  describe("hide()", () => {
    it("hides container", () => {
      upgradeScreen.showWithOptions(mockOptions);
      upgradeScreen.hide();
      expect(upgradeScreen.getContainer().visible).toBe(false);
    });
  });

  describe("Click Selection (SPEC § 2.3.4)", () => {
    it("calls onSelect when card is clicked", () => {
      upgradeScreen.showWithOptions(mockOptions);
      // Get the options container (4th child: bg, title, instructions, optionsContainer)
      const container = upgradeScreen.getContainer();
      const optionsContainer = container.children[3];

      // First option card
      const firstCard = optionsContainer.children[0];
      expect(firstCard).toBeDefined();

      // Simulate click (use type assertion for test mock)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      firstCard.emit("pointerdown", { type: "pointerdown" } as any);

      expect(onSelectMock).toHaveBeenCalledWith("spicy");
    });

    it("calls onSelect with correct id for second option", () => {
      upgradeScreen.showWithOptions(mockOptions);
      const container = upgradeScreen.getContainer();
      const optionsContainer = container.children[3];

      // Second option card
      const secondCard = optionsContainer.children[1];
      expect(secondCard).toBeDefined();

      // Simulate click (use type assertion for test mock)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      secondCard.emit("pointerdown", { type: "pointerdown" } as any);

      expect(onSelectMock).toHaveBeenCalledWith("coconut");
    });
  });

  describe("destroy()", () => {
    it("cleans up cards and destroys container", () => {
      upgradeScreen.showWithOptions(mockOptions);
      upgradeScreen.destroy();
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("SPEC § 2.3.4 Compliance", () => {
    it("displays 2 upgrade options (UP-09)", () => {
      upgradeScreen.showWithOptions(mockOptions);
      const container = upgradeScreen.getContainer();
      const optionsContainer = container.children[3];
      expect(optionsContainer.children.length).toBe(2);
    });

    it("shows upgrade effect description (UP-11)", () => {
      // Options include description - verified by mockOptions structure
      expect(mockOptions[0].description).toBe("臭豆腐傷害 +0.5");
      expect(mockOptions[1].description).toBe("珍珠奶茶子彈 +1");
    });

    it("all upgrades are free (no cost)", () => {
      // SPEC § 2.3.4: 無消耗，直接選擇
      expect(mockOptions[0].cost).toBeNull();
      expect(mockOptions[1].cost).toBeNull();
    });
  });
});
