/**
 * A valid UUID v7 that represents a non-existent entity.
 * Used in e2e tests to verify 404 responses for entities that don't exist.
 *
 * Format: UUID v7 requires:
 * - Version nibble (7) in the third group
 * - Variant bits (10xx) in the fourth group (8, 9, a, or b)
 *
 * This UUID passes validation but will never match a real entity.
 */
export const NON_EXISTENT_UUID =
  '01930000-0000-7000-8000-000000000000';

/**
 * Returns the nil UUID for testing "not found" scenarios in unit tests.
 * Use in service specs where UUID format validation is not applied.
 */
export function nonExistentId(): string {
  return '00000000-0000-0000-0000-000000000000';
}