import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  isURL,
  isBoolean,
} from 'class-validator';

/**
 * Validates CORS origin values.
 * Accepts:
 * - boolean (true/false)
 * - "*" (wildcard)
 * - single URL string
 * - array of URL strings
 */
export function IsCorsOrigin(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCorsOrigin',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Allow boolean
          if (isBoolean(value)) {
            return true;
          }

          // Allow wildcard
          if (value === '*') {
            return true;
          }

          // Allow single URL string
          if (typeof value === 'string') {
            return isValidUrl(value);
          }

          // Allow array of URLs
          if (Array.isArray(value)) {
            return (
              value.length > 0 &&
              value.every(
                (item) =>
                  typeof item === 'string' && isValidUrl(item),
              )
            );
          }

          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a boolean, "*", a valid URL string, or an array of valid URL strings`;
        },
      },
    });
  };
}

/**
 * Validates if a string is a valid URL.
 * More permissive than standard isURL to allow localhost and development URLs.
 */
function isValidUrl(url: string): boolean {
  // Allow localhost URLs with or without port
  if (url.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
    return true;
  }

  // Use class-validator's isURL for standard validation
  // require_tld: false allows URLs without top-level domain (useful for development)
  return isURL(url, {
    require_tld: false,
    require_protocol: true,
    require_valid_protocol: true,
    protocols: ['http', 'https'],
  });
}
