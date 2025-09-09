import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiI18n } from './api-i18n.decorator';
import { KnownErrorToHttpInterceptor } from '../interceptors';

export function ApiController() {
  return applyDecorators(
    UseInterceptors(KnownErrorToHttpInterceptor),
    ApiI18n(),
  );
}
