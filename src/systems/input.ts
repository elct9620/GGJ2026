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
  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keysPressed.add(event.key.toLowerCase());
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keysPressed.delete(event.key.toLowerCase());
  };

  /**
   * Initialize event listeners (System lifecycle)
   */
  public initialize(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  /**
   * Update method (System lifecycle)
   * InputSystem is event-driven, no update needed
   */
  public update(_deltaTime: number): void {
    // Input is event-driven, no per-frame update needed
  }

  /**
   * Clean up event listeners (System lifecycle)
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
   * Check if shoot button is pressed
   * Spec: § 2.4.1 - Space for shooting
   */
  public isShootPressed(): boolean {
    return this.keysPressed.has(" ");
  }

  /**
   * Check if synthesis key is pressed (1-5)
   * SPEC § 2.3.3: 數字鍵 1-5 直接觸發合成
   */
  public getSynthesisKeyPressed(): number | null {
    if (this.keysPressed.has("1")) return 1;
    if (this.keysPressed.has("2")) return 2;
    if (this.keysPressed.has("3")) return 3;
    if (this.keysPressed.has("4")) return 4;
    if (this.keysPressed.has("5")) return 5;
    return null;
  }

  /**
   * Check if a specific key is pressed
   */
  public isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key.toLowerCase());
  }

  /**
   * Clear all pressed keys
   */
  public clear(): void {
    this.keysPressed.clear();
  }
}
