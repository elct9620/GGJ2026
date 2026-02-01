import { InjectableSystem } from "../core/systems/injectable";
import { SystemPriority } from "../core/systems/system.interface";
import { Vector } from "../values/vector";

/**
 * Input system for keyboard controls
 * Spec: § 2.4.1 Input Controls
 */
export class InputSystem extends InjectableSystem {
  public readonly name = "InputSystem";
  public readonly priority = SystemPriority.INPUT;

  private keysPressed: Set<string> = new Set();
  private keysPressedLastFrame: Set<string> = new Set();

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keysPressed.add(event.key.toLowerCase());
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keysPressed.delete(event.key.toLowerCase());
  };

  /**
   * Initialize event listeners (ISystem lifecycle)
   */
  public initialize(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  /**
   * Update method (ISystem lifecycle)
   * SPEC § 2.3.3: Update last frame state for edge detection
   */
  public update(_deltaTime: number): void {
    // Update last frame state for edge detection
    this.keysPressedLastFrame = new Set(this.keysPressed);
  }

  /**
   * Clean up event listeners (ISystem lifecycle)
   */
  public destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.keysPressed.clear();
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
   * Check if shoot button is pressed (edge detection)
   * SPEC § 2.4.1: Space for shooting (edge trigger)
   */
  public isShootPressed(): boolean {
    return this.wasKeyJustPressed(" ");
  }

  /**
   * Check if synthesis key is pressed (1-5) with edge detection
   * SPEC § 2.3.3: 數字鍵 1-5 直接觸發合成（邊緣觸發）
   */
  public getSynthesisKeyPressed(): number | null {
    if (this.wasKeyJustPressed("1")) return 1;
    if (this.wasKeyJustPressed("2")) return 2;
    if (this.wasKeyJustPressed("3")) return 3;
    if (this.wasKeyJustPressed("4")) return 4;
    if (this.wasKeyJustPressed("5")) return 5;
    return null;
  }

  /**
   * Edge detection: Check if key was just pressed this frame
   * SPEC § 2.3.3: 邊緣觸發（Edge Detection）
   * @param key - The key to check
   * @returns true if key is pressed this frame but was not pressed last frame
   */
  public wasKeyJustPressed(key: string): boolean {
    const keyLower = key.toLowerCase();
    return (
      this.keysPressed.has(keyLower) &&
      !this.keysPressedLastFrame.has(keyLower)
    );
  }

  /**
   * Check if a specific key is pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase());
  }

  /**
   * Clear all pressed keys (useful for testing or manual cleanup)
   */
  public clear(): void {
    this.keysPressed.clear();
    this.keysPressedLastFrame.clear();
  }

  /**
   * Get all currently pressed keys (useful for testing)
   */
  public getPressedKeys(): ReadonlySet<string> {
    return this.keysPressed;
  }
}
