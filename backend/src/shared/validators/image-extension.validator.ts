import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsAllowedImageExtension(extensions: string[], validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAllowedImageExtension',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [extensions],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true;
          try {
            const url = new URL(value);
            const pathname = url.pathname;
            const ext = pathname.split('.').pop()?.toLowerCase();
            return !!ext && (args.constraints[0] as string[]).includes(ext);
          } catch (e) {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `La imagen debe tener alguna de las extensiones: ${(args.constraints[0] as string[]).join(', ')}`;
        }
      }
    });
  };
}
