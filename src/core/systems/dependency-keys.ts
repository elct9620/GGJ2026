/**
 * Centralized dependency keys for system dependency injection.
 * All systems should use these constants instead of defining their own.
 */
export const DependencyKeys = {
  EventQueue: "EventQueue",
  InputSystem: "InputSystem",
  BoothSystem: "BoothSystem",
  KillCounterSystem: "KillCounterSystem",
  UpgradeSystem: "UpgradeSystem",
  BulletVisualEffects: "BulletVisualEffectsSystem",
  GameState: "GameState",
  HUDSystem: "HUDSystem",
  WaveSystem: "WaveSystem",
  AudioSystem: "AudioSystem",
} as const;

export type DependencyKey =
  (typeof DependencyKeys)[keyof typeof DependencyKeys];
