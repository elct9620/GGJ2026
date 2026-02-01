import { describe, it, expect, beforeEach } from "vitest";
import {
  DependencyError,
  InjectableSystem,
  isInjectableSystem,
} from "./injectable";
import { SystemPriority } from "./system.interface";

/**
 * Test implementation of InjectableSystem
 */
class TestSystem extends InjectableSystem {
  public readonly name = "TestSystem";
  public readonly priority = SystemPriority.DEFAULT;

  private static readonly DEP_A = "DependencyA";
  private static readonly DEP_B = "DependencyB";
  private static readonly DEP_OPTIONAL = "OptionalDep";

  constructor(declareRequired = true) {
    super();
    if (declareRequired) {
      this.declareDependency(TestSystem.DEP_A);
      this.declareDependency(TestSystem.DEP_B);
    }
    this.declareDependency(TestSystem.DEP_OPTIONAL, false);
  }

  public getDependencyA(): string {
    return this.getDependency<string>(TestSystem.DEP_A);
  }

  public getDependencyB(): number {
    return this.getDependency<number>(TestSystem.DEP_B);
  }

  public getOptionalDep(): object | null {
    if (this.hasDependency(TestSystem.DEP_OPTIONAL)) {
      return this.getDependency<object>(TestSystem.DEP_OPTIONAL);
    }
    return null;
  }

  public injectDependencyA(value: string): void {
    this.inject(TestSystem.DEP_A, value);
  }

  public injectDependencyB(value: number): void {
    this.inject(TestSystem.DEP_B, value);
  }

  public injectOptional(value: object): void {
    this.inject(TestSystem.DEP_OPTIONAL, value);
  }

  public update(): void {
    // No-op for testing
  }
}

describe("DependencyError", () => {
  it("should include system name and dependency key in message", () => {
    const error = new DependencyError("MySystem", "EventQueue", "Not injected");

    expect(error.message).toBe(
      '[MySystem] Dependency "EventQueue": Not injected',
    );
    expect(error.systemName).toBe("MySystem");
    expect(error.dependencyKey).toBe("EventQueue");
    expect(error.name).toBe("DependencyError");
  });

  it("should be instanceof Error", () => {
    const error = new DependencyError("Sys", "Dep", "msg");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("InjectableSystem", () => {
  let system: TestSystem;

  beforeEach(() => {
    system = new TestSystem();
  });

  describe("dependency injection", () => {
    it("should allow injecting and retrieving dependencies", () => {
      system.injectDependencyA("test-value");
      system.injectDependencyB(42);

      expect(system.getDependencyA()).toBe("test-value");
      expect(system.getDependencyB()).toBe(42);
    });

    it("should throw DependencyError when getting non-injected dependency", () => {
      expect(() => system.getDependencyA()).toThrow(DependencyError);
      expect(() => system.getDependencyA()).toThrow(
        '[TestSystem] Dependency "DependencyA": Not injected',
      );
    });

    it("should handle optional dependencies correctly", () => {
      system.injectDependencyA("value");
      system.injectDependencyB(1);

      // Optional not injected - should return null via hasDependency check
      expect(system.getOptionalDep()).toBeNull();

      // After injection, should return value
      const optValue = { key: "value" };
      system.injectOptional(optValue);
      expect(system.getOptionalDep()).toBe(optValue);
    });
  });

  describe("dependency validation", () => {
    it("should throw DependencyError when required dependency is missing", () => {
      // Only inject one of two required dependencies
      system.injectDependencyA("value");

      expect(() => system.validateDependencies()).toThrow(DependencyError);
      expect(() => system.validateDependencies()).toThrow(
        'Dependency "DependencyB": Required dependency not injected',
      );
    });

    it("should pass validation when all required dependencies are injected", () => {
      system.injectDependencyA("value");
      system.injectDependencyB(123);

      expect(() => system.validateDependencies()).not.toThrow();
    });

    it("should not require optional dependencies for validation", () => {
      system.injectDependencyA("value");
      system.injectDependencyB(123);
      // Optional dep not injected

      expect(() => system.validateDependencies()).not.toThrow();
    });

    it("should pass validation when no dependencies are declared", () => {
      const systemWithNoDeps = new TestSystem(false);
      expect(() => systemWithNoDeps.validateDependencies()).not.toThrow();
    });
  });

  describe("inject method", () => {
    it("should be callable from outside (by SystemManager)", () => {
      system.inject("DependencyA", "external-value");
      expect(system.getDependencyA()).toBe("external-value");
    });

    it("should allow overwriting dependencies", () => {
      system.inject("DependencyA", "first");
      system.inject("DependencyA", "second");
      expect(system.getDependencyA()).toBe("second");
    });
  });
});

describe("isInjectableSystem", () => {
  it("should return true for InjectableSystem instances", () => {
    const system = new TestSystem();
    expect(isInjectableSystem(system)).toBe(true);
  });

  it("should return false for regular System objects", () => {
    const regularSystem = {
      name: "RegularSystem",
      priority: SystemPriority.DEFAULT,
      update: () => {},
    };

    expect(isInjectableSystem(regularSystem)).toBe(false);
  });

  it("should return false for objects with only partial interface", () => {
    const partialSystem = {
      name: "PartialSystem",
      priority: SystemPriority.DEFAULT,
      update: () => {},
      inject: () => {}, // Has inject but no validateDependencies
    };

    expect(isInjectableSystem(partialSystem as any)).toBe(false);
  });
});
