/**
 * Data Interface
 * Generic data abstraction for type-to-properties mappings
 */

// =============================================================================
// Generic Data Interface
// =============================================================================

/**
 * Generic Data interface for type-to-properties mapping
 * @template K - Type key (e.g., EnemyType, SpecialBulletType)
 * @template V - Properties type (e.g., EnemyTypeProperties)
 */
export interface Data<K extends string, V> {
  readonly entries: Record<K, V>;
  get(key: K): V;
}

/**
 * Factory function to create a Data instance
 * @template K - Type key
 * @template V - Properties type
 * @param entries - Record of key-value pairs
 * @returns A Data instance
 */
export function createData<K extends string, V>(
  entries: Record<K, V>,
): Data<K, V> {
  return {
    entries,
    get(key: K): V {
      const value = entries[key];
      if (value === undefined) {
        throw new Error(`Unknown key: ${key}`);
      }
      return value;
    },
  };
}
