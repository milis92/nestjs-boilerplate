/**
 * Strips keys with `undefined` values from an object.
 * Used in service `update()` methods to prevent Drizzle from setting columns to `undefined`
 * when the caller only wants to update a subset of fields.
 *
 * @example
 * omitUndefined({ name: 'foo', notes: undefined }) // { name: 'foo' }
 */
export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
