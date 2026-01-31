import { Container, Sprite, Text } from "pixi.js";
import { FoodType } from "../entities/enemy";
import { SystemPriority } from "../core/systems/system.interface";
import type { ISystem } from "../core/systems/system.interface";
import type { EventQueue } from "./event-queue";
import { EventType } from "./event-queue";
import { getTexture, AssetKeys } from "../core/assets";

/**
 * Booth system for storing food ingredients
 * Spec: § 2.3.1 Booth System
 */
export class BoothSystem implements ISystem {
  public readonly name = "BoothSystem";
  public readonly priority = SystemPriority.BOOTH;

  private booths: Map<number, Booth> = new Map();
  private container: Container;
  private eventQueue: EventQueue | null = null;

  constructor() {
    this.container = new Container();
    this.initializeBooths();
  }

  /**
   * Initialize booth system (ISystem lifecycle)
   */
  public initialize(): void {
    // Booths are already initialized in constructor
  }

  /**
   * Update method (ISystem lifecycle)
   * Booth state updates are triggered by external events
   */
  public update(_deltaTime: number): void {
    // Booth updates are event-driven
    // No per-frame update needed
  }

  /**
   * Clean up booth resources (ISystem lifecycle)
   */
  public destroy(): void {
    this.container.destroy({ children: true });
    this.booths.clear();
    this.eventQueue = null;
  }

  /**
   * Set EventQueue reference
   */
  public setEventQueue(eventQueue: EventQueue): void {
    this.eventQueue = eventQueue;
  }

  private initializeBooths(): void {
    // Create 3 booths (SPEC § 2.3.1)
    // Booth 1: Pearl (珍珠)
    // Booth 2: Tofu (豆腐)
    // Booth 3: Blood Cake (米血)

    // New layout: 128×256 sprites aligned to right of booth area
    // X position: 384 - 128 = 256 (right-aligned to baseline)
    // Start Y: (1080 - 768) / 2 = 156 (vertically centered)
    const boothWidth = 128;
    const boothHeight = 256;
    const startX = 384 - boothWidth; // 256
    const startY = (1080 - boothHeight * 3) / 2; // 156

    this.booths.set(
      1,
      new Booth(1, FoodType.Pearl, startX, startY, this.container),
    );
    this.booths.set(
      2,
      new Booth(2, FoodType.Tofu, startX, startY + boothHeight, this.container),
    );
    this.booths.set(
      3,
      new Booth(
        3,
        FoodType.BloodCake,
        startX,
        startY + boothHeight * 2,
        this.container,
      ),
    );
  }

  /**
   * Store food in appropriate booth
   * Returns true if successful, false if booth is full
   */
  public storeFood(foodType: FoodType): boolean {
    for (const [id, booth] of this.booths) {
      if (booth.foodType === foodType) {
        const success = booth.addFood();
        if (success && this.eventQueue) {
          // Publish FoodStored event (SPEC § 2.3.7)
          this.eventQueue.publish(EventType.FoodStored, {
            boothId: String(id),
            foodType,
          });
        }
        return success;
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
      // Publish FoodConsumed event (SPEC § 2.3.7)
      if (this.eventQueue) {
        this.eventQueue.publish(EventType.FoodConsumed, {
          boothId: String(boothNumber),
          amount: 1,
        });
      }
      return booth.foodType;
    }
    return null;
  }

  /**
   * Enemy steals food from booth
   */
  public stealFood(boothNumber: number): boolean {
    const booth = this.booths.get(boothNumber);
    const success = booth ? booth.removeFood() : false;
    if (success && this.eventQueue) {
      // Publish FoodConsumed event (SPEC § 2.3.7)
      this.eventQueue.publish(EventType.FoodConsumed, {
        boothId: String(boothNumber),
        amount: 1,
      });
    }
    return success;
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

  /**
   * Reset all booths to empty state
   */
  public reset(): void {
    for (const [_id, booth] of this.booths) {
      booth.reset();
    }
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

  private sprite: Sprite;
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

    // Create sprite using booth pool assets
    this.sprite = this.createSprite();
    this.sprite.position.set(x, y);

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

    this.setupTextPositions(x, y);
    parent.addChild(this.sprite);
    parent.addChild(this.countText);
    parent.addChild(this.nameText);
  }

  private createSprite(): Sprite {
    // Map booth id to corresponding pool asset
    let assetKey: keyof typeof AssetKeys;
    switch (this.id) {
      case 1:
        assetKey = "boothPool0";
        break;
      case 2:
        assetKey = "boothPool1";
        break;
      case 3:
        assetKey = "boothPool2";
        break;
      default:
        assetKey = "boothPool0";
    }

    const sprite = new Sprite(getTexture(AssetKeys[assetKey]));
    // Asset size is 128×256, use as-is
    sprite.width = 128;
    sprite.height = 256;
    return sprite;
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

  private setupTextPositions(x: number, y: number): void {
    // Position texts relative to booth sprite
    this.nameText.position.set(x + 10, y + 10);
    this.countText.position.set(x + 10, y + 220);
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
  }

  /**
   * Reset booth to empty state
   */
  public reset(): void {
    this.count = 0;
    this.updateVisuals();
  }
}
