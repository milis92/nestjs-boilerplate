import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

/**
 * Validates and transforms environment configuration using class-validator decorators.
 *
 * @template Config - The configuration class type
 * @param config - Raw configuration object (typically process.env)
 * @param validator - Configuration class with validation decorators
 * @param options - Optional validation options
 * @returns Validated and transformed configuration instance
 * @throws {Error} When validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * const config = validatedConfig(process.env, DatabaseConfig);
 * ```
 */
export default function validatedConfig<Config extends object>(
  config: Record<string, unknown>,
  validator: ClassConstructor<Config>,
  options?: {
    /**
     * Custom error message prefix
     * @default 'Configuration validation failed'
     */
    errorPrefix?: string;
  },
): Config {
  const validatedConfig = plainToInstance(validator, config, {
    enableImplicitConversion: true,
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
    exposeUnsetFields: false,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    skipUndefinedProperties: false,
    skipNullProperties: false,
  });

  if (errors.length > 0) {
    const errorPrefix =
      options?.errorPrefix ?? 'Configuration validation failed';
    const formattedErrors = formatValidationErrors(errors);

    throw new Error(`${errorPrefix}:\n${formattedErrors}`);
  }

  return validatedConfig;
}

/**
 * Formats validation errors into a readable error message.
 *
 * @param errors - Array of validation errors
 * @returns Formatted error message string
 */
function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((error) => {
      const propertyPath = getPropertyPath(error);
      const constraints = error.constraints
        ? Object.entries(error.constraints)
            .map(([key, value]) => `  • ${key}: ${value}`)
            .join('\n')
        : '';

      const childErrors = error.children?.length
        ? '\n' + formatValidationErrors(error.children)
        : '';

      return `\nProperty: ${propertyPath}${constraints ? '\n' + constraints : ''}${childErrors}`;
    })
    .join('\n');
}

/**
 * Builds the full property path for nested validation errors.
 *
 * @param error - Validation error
 * @param path - Accumulated path (for recursion)
 * @returns Full property path string
 */
function getPropertyPath(error: ValidationError, path = ''): string {
  return path ? `${path}.${error.property}` : error.property;
}
