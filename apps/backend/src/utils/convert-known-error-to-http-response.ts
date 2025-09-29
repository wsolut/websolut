import {
  InvalidArgumentError,
  NotFoundError,
  PermissionDeniedError,
  ServiceUnavailableError,
} from '../entities/errors';
import {
  HttpInvalidArgumentErrorResponseDto,
  HttpResponseDto,
} from '../entities';

export function convertKnownErrorToHttpResponse(
  error: unknown,
): HttpInvalidArgumentErrorResponseDto | HttpResponseDto {
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred.';

  if (error instanceof InvalidArgumentError) {
    return { code: 422, message, errors: error.errors };
  }

  if (error instanceof NotFoundError) {
    return { code: 404, message };
  }

  if (error instanceof PermissionDeniedError) {
    return { code: 403, message };
  }

  if (error instanceof ServiceUnavailableError) {
    return { code: 503, message };
  }

  // Report error to Sentry or similar service

  // return { code: 500, message };

  throw error;
}
