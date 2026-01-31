import { Vector } from "../values/vector";

/**
 * Input system for keyboard controls
 * Spec: § 2.4.1 Input Controls
 */
export class InputSystem {
  private keysPressed: Set<string> = new Set();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener("keydown", (event) => {
      this.keysPressed.add(event.key.toLowerCase());
    });

    window.addEventListener("keyup", (event) => {
      this.keysPressed.delete(event.key.toLowerCase());
    });
  }

  /**
   * Get movement direction based on WASD keys
   * Spec: § 2.4.1 - W/A/S/D for movement
   */
  public getMovementDirection(): Vector {
    let x = 0;
    let y = 0;

    if (this.keysPressed.has("w")) y -= 1;
    if (this.keysPressed.has("s")) y += 1;
    if (this.keysPressed.has("a")) x -= 1;
    if (this.keysPressed.has("d")) x += 1;

    return new Vector(x, y);
  }

  /**
   * Check if shoot button is pressed
   * Spec: § 2.4.1 - Space for shooting
   */
  public isShootPressed(): boolean {
    return this.keysPressed.has(" ");
  }

  /**
   * Check if booth key is pressed (1, 2, or 3)
   * Spec: § 2.4.1 - 1/2/3 for retrieving food
   */
  public getBoothKeyPressed(): number | null {
    if (this.keysPressed.has("1")) return 1;
    if (this.keysPressed.has("2")) return 2;
    if (this.keysPressed.has("3")) return 3;
    return null;
  }

  /**
   * Check if a specific key is pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase());
  }

  /**
   * Clear all pressed keys (useful for cleanup)
   */
  public clear(): void {
    this.keysPressed.clear();
  }
}
