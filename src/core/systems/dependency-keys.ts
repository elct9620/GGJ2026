/**
 * Centralized dependency keys for system dependency injection.
 * All systems should use these constants instead of defining their own.
 */
export const DependencyKeys = {
  EventQueue: "EventQueue",
  InputSystem: "InputSystem",
  BoothSystem: "BoothSystem",
  KillCounterSystem: "KillCounterSystem",
} as const;

export type DependencyKey =
  (typeof DependencyKeys)[keyof typeof DependencyKeys];
