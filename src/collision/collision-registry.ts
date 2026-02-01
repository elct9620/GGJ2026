/**
 * Collision Handler Registry
 * Manages registration and lookup of collision handlers by bullet type
 */

import type { CollisionHandler } from "./collision-handler";
import type { SpecialBulletType } from "../values/special-bullet";

/**
 * Registry for collision handlers
 * Allows dynamic registration of handlers for different bullet types
 */
export class CollisionHandlerRegistry {
  private handlers = new Map<SpecialBulletType, CollisionHandler>();
  private defaultHandler: CollisionHandler | null = null;

  /**
   * Register a collision handler for a specific bullet type
   * @param handler The collision handler to register
   */
  register(handler: CollisionHandler): void {
    this.handlers.set(handler.bulletType, handler);
  }

  /**
   * Set the default handler for unregistered bullet types
   * @param handler The default collision handler
   */
  setDefaultHandler(handler: CollisionHandler): void {
    this.defaultHandler = handler;
  }

  /**
   * Get the collision handler for a specific bullet type
   * Falls back to default handler if no specific handler is registered
   * @param bulletType The bullet type to get handler for
   * @returns The collision handler, or null if none registered
   */
  getHandler(bulletType: SpecialBulletType): CollisionHandler | null {
    return this.handlers.get(bulletType) ?? this.defaultHandler;
  }

  /**
   * Check if a handler is registered for a specific bullet type
   * @param bulletType The bullet type to check
   */
  hasHandler(bulletType: SpecialBulletType): boolean {
    return this.handlers.has(bulletType) || this.defaultHandler !== null;
  }

  /**
   * Clear all registered handlers
   */
  clear(): void {
    this.handlers.clear();
    this.defaultHandler = null;
  }
}
