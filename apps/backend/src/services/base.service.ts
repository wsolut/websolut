import z from 'zod';
import { InvalidArgumentError, InvalidArgumentErrorData } from '../entities';
import { formatZodError, toKebabCase } from '../utils';
import { LangService } from './lang.service';
import { I18nService } from 'nestjs-i18n';

export class BaseService {
  langService: LangService;

  constructor(protected readonly i18nService: I18nService) {
    this.langService = new LangService(i18nService, this.i18nNamespace);
  }

  get i18nNamespace(): string {
    return toKebabCase(this.constructor.name.replace(/Service$/, ''));
  }

  validateSchema<T>(
    schema: z.ZodObject<z.ZodRawShape>,
    input: unknown,
  ): { success: boolean; data: T; errors: InvalidArgumentErrorData } {
    const result = schema.safeParse(input);

    if (!result.success) {
      return {
        success: false,
        data: result.data as T,
        errors: formatZodError(result.error),
      };
    }

    return { success: true, data: result.data as T, errors: {} };
  }

  validateSchemaOrFail<T>(
    schema: z.ZodObject<z.ZodRawShape>,
    input: unknown,
  ): { success: boolean; data: T; errors: InvalidArgumentErrorData } {
    const result = this.validateSchema<T>(schema, input);

    if (!result.success) {
      throw new InvalidArgumentError(
        this.langService.t('.ERRORS.INVALID_ARGUMENT'),
        result.errors,
      );
    }

    return result;
  }
}
