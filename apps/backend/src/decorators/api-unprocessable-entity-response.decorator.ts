import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { HttpInvalidArgumentErrorResponseDto } from '../entities';

export function ApiUnprocessableEntityResponse() {
  return applyDecorators(
    ApiResponse({
      status: 422,
      description: 'Missing or invalid fields',
      type: HttpInvalidArgumentErrorResponseDto,
    }),
  );
}
