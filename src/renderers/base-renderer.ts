/**
 * Base Renderer
 * Abstract base class for entity renderers
 *
 * Provides common sync pattern for managing visual elements:
 * - Create graphics for new active items
 * - Update position of existing items
 * - Remove graphics for inactive items
 */
import { Container, type ContainerChild } from "pixi.js";

/**
 * Minimal state interface required for rendering
 * All entity state interfaces should extend this
 */
export interface VisualState {
  id: string;
  position: { x: number; y: number };
  active: boolean;
}

/**
 * Abstract base renderer for entity visual management
 * TState: Entity state type (e.g., BulletState, FoodState)
 * TVisual: Visual element type (e.g., Graphics, Container)
 */
export abstract class BaseRenderer<
  TState extends VisualState,
  TVisual extends ContainerChild,
> {
  protected container: Container;
  protected visuals: Map<string, TVisual> = new Map();

  constructor() {
    this.container = new Container();
  }

  /**
   * Sync visual state with entity data
   * Creates, updates, or removes visuals based on current state
   * @param items Array of entity states to render
   */
  sync(items: ReadonlyArray<TState>): void {
    const activeIds = new Set<string>();

    for (const item of items) {
      if (!item.active) continue;

      activeIds.add(item.id);

      let visual = this.visuals.get(item.id);

      if (!visual) {
        visual = this.createVisual(item);
        this.visuals.set(item.id, visual);
        this.container.addChild(visual);
      }

      this.updateVisual(visual, item);
    }

    // Remove visuals for inactive items
    for (const [id, visual] of this.visuals) {
      if (!activeIds.has(id)) {
        this.container.removeChild(visual);
        this.destroyVisual(visual);
        this.visuals.delete(id);
      }
    }
  }

  /**
   * Create visual element for an entity
   * Must be implemented by subclasses
   */
  protected abstract createVisual(item: TState): TVisual;

  /**
   * Update visual element with current entity state
   * Default implementation updates position only
   * Override for additional updates (e.g., health bar, animations)
   */
  protected updateVisual(visual: TVisual, item: TState): void {
    visual.position.set(item.position.x, item.position.y);
  }

  /**
   * Destroy a visual element
   * Default implementation calls destroy()
   * Override for custom cleanup (e.g., containers with children)
   */
  protected destroyVisual(visual: TVisual): void {
    visual.destroy();
  }

  /**
   * Get the container for scene integration
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Clean up renderer resources
   */
  destroy(): void {
    for (const visual of this.visuals.values()) {
      this.destroyVisual(visual);
    }
    this.visuals.clear();
    this.container.destroy({ children: true });
  }
}
