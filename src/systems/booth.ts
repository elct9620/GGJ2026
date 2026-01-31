import { Container, Graphics, Text } from "pixi.js";
import { FoodType } from "../entities/enemy";

/**
 * Booth system for storing food ingredients
 * Spec: § 2.3.1 Booth System
 */
export class BoothSystem {
  private booths: Map<number, Booth> = new Map();
  private container: Container;

  constructor() {
    this.container = new Container();
    this.initializeBooths();
  }

  private initializeBooths(): void {
    // Create 3 booths (SPEC § 2.3.1)
    // Booth 1: Pearl (珍珠)
    // Booth 2: Tofu (豆腐)
    // Booth 3: Blood Cake (米血)

    const boothHeight = 300;
    const boothSpacing = 60;
    const startY = (1080 - (boothHeight * 3 + boothSpacing * 2)) / 2;

    this.booths.set(
      1,
      new Booth(1, FoodType.Pearl, 50, startY, this.container),
    );
    this.booths.set(
      2,
      new Booth(
        2,
        FoodType.Tofu,
        50,
        startY + boothHeight + boothSpacing,
        this.container,
      ),
    );
    this.booths.set(
      3,
      new Booth(
        3,
        FoodType.BloodCake,
        50,
        startY + (boothHeight + boothSpacing) * 2,
        this.container,
      ),
    );
  }

  /**
   * Store food in appropriate booth
   * Returns true if successful, false if booth is full
   */
  public storeFood(foodType: FoodType): boolean {
    for (const [_id, booth] of this.booths) {
      if (booth.foodType === foodType) {
        return booth.addFood();
      }
    }
    return false;
  }

  /**
   * Retrieve food from booth to synthesis slot
   * Returns true if successful, false if booth is empty
   */
  public retrieveFood(boothNumber: number): FoodType | null {
    const booth = this.booths.get(boothNumber);
    if (booth && booth.removeFood()) {
      return booth.foodType;
    }
    return null;
  }

  /**
   * Enemy steals food from booth
   */
  public stealFood(boothNumber: number): boolean {
    const booth = this.booths.get(boothNumber);
    return booth ? booth.removeFood() : false;
  }

  /**
   * Get booth container for rendering
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Get food count for specific booth
   */
  public getFoodCount(boothNumber: number): number {
    return this.booths.get(boothNumber)?.count ?? 0;
  }
}

/**
 * Individual booth for storing one food type
 */
class Booth {
  public readonly id: number;
  public readonly foodType: FoodType;
  public count: number = 0;
  public readonly maxCapacity: number = 6; // SPEC § 2.3.1

  private graphics: Graphics;
  private countText: Text;
  private nameText: Text;

  constructor(
    id: number,
    foodType: FoodType,
    x: number,
    y: number,
    parent: Container,
  ) {
    this.id = id;
    this.foodType = foodType;

    this.graphics = new Graphics();
    this.countText = new Text({
      text: "0/6",
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
      },
    });

    this.nameText = new Text({
      text: this.getFoodName(),
      style: {
        fontFamily: "Arial",
        fontSize: 18,
        fill: 0xffffff,
      },
    });

    this.setupVisuals(x, y);
    parent.addChild(this.graphics);
    parent.addChild(this.countText);
    parent.addChild(this.nameText);
  }

  private getFoodName(): string {
    switch (this.foodType) {
      case FoodType.Pearl:
        return "珍珠 (1)";
      case FoodType.Tofu:
        return "豆腐 (2)";
      case FoodType.BloodCake:
        return "米血 (3)";
    }
  }

  private getBoothColor(): number {
    switch (this.foodType) {
      case FoodType.Pearl:
        return 0xecf0f1; // White/gray
      case FoodType.Tofu:
        return 0xf39c12; // Orange
      case FoodType.BloodCake:
        return 0xc0392b; // Dark red
    }
  }

  private setupVisuals(x: number, y: number): void {
    // Draw booth background (simple rectangle)
    this.graphics.rect(x, y, 280, 280);
    this.graphics.fill(0x34495e); // Dark gray

    // Draw booth border
    this.graphics.rect(x, y, 280, 280);
    this.graphics.stroke({ width: 3, color: this.getBoothColor() });

    // Position texts
    this.nameText.position.set(x + 10, y + 10);
    this.countText.position.set(x + 10, y + 240);

    this.updateVisuals();
  }

  /**
   * Add food to booth
   * Returns true if successful, false if full
   */
  public addFood(): boolean {
    if (this.count >= this.maxCapacity) {
      return false; // Booth is full, food is lost (SPEC § 2.3.1)
    }

    this.count++;
    this.updateVisuals();
    return true;
  }

  /**
   * Remove food from booth
   * Returns true if successful, false if empty
   */
  public removeFood(): boolean {
    if (this.count <= 0) {
      return false; // Booth is empty
    }

    this.count--;
    this.updateVisuals();
    return true;
  }

  /**
   * Update visual representation
   */
  private updateVisuals(): void {
    this.countText.text = `${this.count}/${this.maxCapacity}`;

    // Draw food items as small squares (2 rows of 3)
    // This is a simple prototype visualization
    const startX = this.graphics.x + 50;
    const startY = this.graphics.y + 80;
    const itemSize = 30;
    const spacing = 40;

    // Clear previous items
    this.graphics.clear();

    // Redraw booth background
    const x = this.graphics.x;
    const y = this.graphics.y;
    this.graphics.rect(x, y, 280, 280);
    this.graphics.fill(0x34495e);
    this.graphics.rect(x, y, 280, 280);
    this.graphics.stroke({ width: 3, color: this.getBoothColor() });

    // Draw food items
    for (let i = 0; i < this.count; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const itemX = startX + col * spacing;
      const itemY = startY + row * spacing;

      this.graphics.rect(itemX, itemY, itemSize, itemSize);
      this.graphics.fill(this.getBoothColor());
    }
  }
}
