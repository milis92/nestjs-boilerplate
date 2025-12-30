import {
  Transform,
  TransformFnParams,
  Type,
} from 'class-transformer';

export function AsBoolean(): PropertyDecorator {
  // Creates both `@Type` and `@Transform` decorators
  const typeDecorator = Type(() => String);
  const transformDecorator = Transform(
    (transformParams: TransformFnParams): boolean | undefined =>
      transformParams.value != null &&
      typeof transformParams.value === 'string'
        ? transformParams.value.toLowerCase() === 'true'
        : undefined,
  );
  return function ToBooleanTransform(
    target,
    propertyName: string | symbol,
  ): void {
    // When my decorator runs, first runs Type (so we go back to string),
    // then Transform (So we properly convert it)
    typeDecorator(target, propertyName);
    transformDecorator(target, propertyName);
  };
}
