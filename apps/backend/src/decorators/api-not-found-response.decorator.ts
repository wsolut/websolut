import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { HttpNotFoundErrorResponseDto } from '../entities';

export function ApiNotFoundResponse() {
  return applyDecorators(
    ApiResponse({
      status: 404,
      description: 'Resource not found',
      type: HttpNotFoundErrorResponseDto,
    }),
  );
}
