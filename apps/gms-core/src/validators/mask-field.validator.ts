import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import maskConfig from '../config/masking.config.json';

export function MaskField(type: keyof typeof maskConfig, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'MaskField',
            target: object.constructor,
            propertyName,
            constraints: [type],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const config = maskConfig[type];
                    if (!config || value == null) return false;

                    const len = String(value).length;
                    if (config.condition === 'equalto') {
                        return len === config.fieldLength;
                    }
                    if (config.condition === 'lessthan') {
                        return len < config.fieldLength;
                    }
                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    const config = maskConfig[type];
                    console.log('IN')
                    return `${args.property} should have ${config.condition === 'equalto'
                        ? `exactly ${config.fieldLength}`
                        : `less than ${config.fieldLength}`
                        } characters`;
                },
            },
        });
    };
}