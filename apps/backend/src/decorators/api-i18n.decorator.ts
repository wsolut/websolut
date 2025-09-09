import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function ApiI18n() {
  return applyDecorators(
    ApiHeader({
      name: 'Accept-Language',
      required: false,
      description: 'Language preference header (e.g., en, ja)',
    }),
  );
}
