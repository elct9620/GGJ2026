import { Container, Graphics } from "pixi.js";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "../utils/constants";

/**
 * Base Screen abstract class
 * Provides common functionality for all game screens:
 * - Container management
 * - Background overlay creation
 * - Keyboard event listening lifecycle
 * - Show/hide/destroy lifecycle
 */
export abstract class BaseScreen {
  protected container: Container;
  private isListening: boolean = false;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
  }

  /**
   * Create a background overlay
   */
  protected createBackground(color: number, alpha: number): Graphics {
    const background = new Graphics();
    background.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    background.fill({ color, alpha });
    return background;
  }

  /**
   * Get the container for adding to stage
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Show the screen
   * Override in subclass to add custom show logic
   */
  public show(): void {
    this.container.visible = true;
    this.startListening();
  }

  /**
   * Hide the screen
   * Override in subclass to add custom hide logic
   */
  public hide(): void {
    this.container.visible = false;
    this.stopListening();
  }

  /**
   * Handle key press events
   * Override in subclass to handle specific keys
   */
  protected handleKeyPress(_event: KeyboardEvent): void {
    // Default implementation does nothing
  }

  /**
   * Start listening for keyboard events
   */
  protected startListening(): void {
    if (!this.isListening) {
      window.addEventListener("keydown", this.onKeyDown);
      this.isListening = true;
    }
  }

  /**
   * Stop listening for keyboard events
   */
  protected stopListening(): void {
    if (this.isListening) {
      window.removeEventListener("keydown", this.onKeyDown);
      this.isListening = false;
    }
  }

  /**
   * Bound key handler for event listener
   */
  private onKeyDown = (event: KeyboardEvent): void => {
    this.handleKeyPress(event);
  };

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopListening();
    this.container.destroy({ children: true });
  }
}
