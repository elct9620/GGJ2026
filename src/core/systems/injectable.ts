/**
 * Dependency Injection Infrastructure for Systems
 * Provides type-safe dependency management with validation
 */

import type { System } from "./system.interface";
import { SystemPriority } from "./system.interface";
import type {
  EventQueue,
  EventType,
  EventData,
} from "../../systems/event-queue";
import { DependencyKeys } from "./dependency-keys";

/**
 * Dependency injection error
 * Thrown when a required dependency is missing or access fails
 */
export class DependencyError extends Error {
  public readonly systemName: string;
  public readonly dependencyKey: string;

  constructor(systemName: string, dependencyKey: string, message: string) {
    super(`[${systemName}] Dependency "${dependencyKey}": ${message}`);
    this.name = "DependencyError";
    this.systemName = systemName;
    this.dependencyKey = dependencyKey;
  }
}

/**
 * Injectable System base class
 * Provides type-safe dependency management with declaration and validation
 *
 * Usage:
 * ```typescript
 * class MySystem extends InjectableSystem {
 *   private static readonly DEP_EVENT_QUEUE = "EventQueue";
 *
 *   constructor() {
 *     super();
 *     this.declareDependency(MySystem.DEP_EVENT_QUEUE);
 *   }
 *
 *   private get eventQueue(): EventQueue {
 *     return this.getDependency<EventQueue>(MySystem.DEP_EVENT_QUEUE);
 *   }
 * }
 * ```
 */
export abstract class InjectableSystem implements System {
  public abstract readonly name: string;
  public abstract readonly priority: SystemPriority;

  private readonly _dependencies = new Map<string, unknown>();
  private readonly _requiredKeys = new Set<string>();

  /**
   * Declare a dependency (call in constructor)
   * @param key Unique identifier for the dependency
   * @param required If true (default), validation will fail if not injected
   */
  protected declareDependency(key: string, required = true): void {
    if (required) {
      this._requiredKeys.add(key);
    }
  }

  /**
   * Get an injected dependency (type-safe)
   * @throws DependencyError if dependency is not injected
   */
  protected getDependency<T>(key: string): T {
    const dep = this._dependencies.get(key);
    if (dep === undefined) {
      throw new DependencyError(this.name, key, "Not injected");
    }
    return dep as T;
  }

  /**
   * Check if a dependency has been injected
   */
  protected hasDependency(key: string): boolean {
    return this._dependencies.has(key);
  }

  /**
   * Get an optional dependency (returns null if not injected)
   */
  protected getOptionalDependency<T>(key: string): T | null {
    if (this.hasDependency(key)) {
      return this.getDependency<T>(key);
    }
    return null;
  }

  /**
   * Publish an event via EventQueue (standardized pattern)
   * This method provides a unified way to publish events across all systems,
   * reducing code duplication and ensuring consistent event handling.
   *
   * @param eventType The type of event to publish
   * @param data The event data payload (must match EventData[eventType])
   * @param delay Optional delay in milliseconds before the event is processed
   */
  protected publishEvent<T extends EventType>(
    eventType: T,
    data: EventData[T],
    delay?: number,
  ): void {
    const eventQueue = this.getOptionalDependency<EventQueue>(
      DependencyKeys.EventQueue,
    );
    eventQueue?.publish(eventType, data, delay);
  }

  /**
   * Inject a dependency
   * Called by SystemManager during initialization
   */
  public inject<T>(key: string, dependency: T): void {
    this._dependencies.set(key, dependency);
  }

  /**
   * Validate all required dependencies are injected
   * @throws DependencyError if any required dependency is missing
   */
  public validateDependencies(): void {
    for (const key of this._requiredKeys) {
      if (!this._dependencies.has(key)) {
        throw new DependencyError(
          this.name,
          key,
          "Required dependency not injected",
        );
      }
    }
  }

  public abstract update(deltaTime: number): void;
  public initialize?(): void;
  public destroy?(): void;
}

/**
 * Type guard to check if a system is injectable
 */
export function isInjectableSystem(system: System): system is InjectableSystem {
  return (
    typeof (system as InjectableSystem).inject === "function" &&
    typeof (system as InjectableSystem).validateDependencies === "function"
  );
}
