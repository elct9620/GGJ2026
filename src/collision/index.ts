/**
 * Collision Module Exports
 * Provides Strategy Pattern for bullet-enemy collision handling
 */

// Core interfaces and registry
export type { CollisionContext, CollisionHandler } from "./collision-handler";
export { CollisionHandlerRegistry } from "./collision-registry";

// Handler implementations
export { BaseCollisionHandler } from "./handlers/base-collision-handler";
export { NormalCollisionHandler } from "./handlers/normal-collision-handler";
export { StinkyTofuCollisionHandler } from "./handlers/stinky-tofu-collision-handler";
export { BloodCakeCollisionHandler } from "./handlers/blood-cake-collision-handler";
export { OysterOmeletteCollisionHandler } from "./handlers/oyster-omelette-collision-handler";
export { NightMarketCollisionHandler } from "./handlers/night-market-collision-handler";

// Factory function to create and register all handlers
import { CollisionHandlerRegistry } from "./collision-registry";
import { NormalCollisionHandler } from "./handlers/normal-collision-handler";
import { StinkyTofuCollisionHandler } from "./handlers/stinky-tofu-collision-handler";
import { BloodCakeCollisionHandler } from "./handlers/blood-cake-collision-handler";
import { OysterOmeletteCollisionHandler } from "./handlers/oyster-omelette-collision-handler";
import { NightMarketCollisionHandler } from "./handlers/night-market-collision-handler";

/**
 * Create a fully configured collision handler registry
 * with all bullet type handlers registered
 */
export function createCollisionHandlerRegistry(): CollisionHandlerRegistry {
  const registry = new CollisionHandlerRegistry();

  // Register default (normal) handler
  const normalHandler = new NormalCollisionHandler();
  registry.setDefaultHandler(normalHandler);
  registry.register(normalHandler);

  // Register special bullet handlers
  registry.register(new StinkyTofuCollisionHandler());
  registry.register(new BloodCakeCollisionHandler());
  registry.register(new OysterOmeletteCollisionHandler());
  registry.register(new NightMarketCollisionHandler());

  return registry;
}
