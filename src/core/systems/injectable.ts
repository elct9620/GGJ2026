/**
 * Dependency Injection Infrastructure for Systems
 * Provides type-safe dependency management with validation
 */

import type { ISystem } from "./system.interface";
import { SystemPriority } from "./system.interface";

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
export abstract class InjectableSystem implements ISystem {
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

  /**
   * Get all declared dependency keys (for debugging)
   */
  public getDeclaredDependencies(): { required: string[]; optional: string[] } {
    const allKeys = new Set([...this._dependencies.keys()]);
    const required = Array.from(this._requiredKeys);
    const optional = Array.from(allKeys).filter(
      (k) => !this._requiredKeys.has(k),
    );
    return { required, optional };
  }

  public abstract update(deltaTime: number): void;
  public initialize?(): void;
  public destroy?(): void;
}

/**
 * Type guard to check if a system is injectable
 */
export function isInjectableSystem(
  system: ISystem,
): system is InjectableSystem {
  return (
    typeof (system as InjectableSystem).inject === "function" &&
    typeof (system as InjectableSystem).validateDependencies === "function"
  );
}
