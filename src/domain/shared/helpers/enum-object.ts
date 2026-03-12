/**
 * Creates a string enum object from a Drizzle pgEnum's `enumValues` tuple.
 * Returns `{ value: value }` for each enum member, enabling both type-level
 * and runtime access to enum values.
 *
 * @example
 * const AccountType = createEnumObject(accountType.enumValues);
 * // { checking: 'checking', savings: 'savings', ... }
 * type AccountType = keyof typeof AccountType;
 * // 'checking' | 'savings' | ...
 */
export const createEnumObject = <
  T extends readonly [string, ...string[]],
>(
  values: T,
): Record<T[number], T[number]> => {
  const obj: Record<string, T[number]> = {};
  for (const value of values) {
    obj[value] = value;
  }
  return obj;
};
