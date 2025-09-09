import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { convertKnownErrorToHttpResponse } from '../utils';

@Injectable()
export class KnownErrorToHttpInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        const httpResponse = convertKnownErrorToHttpResponse(error);

        return throwError(
          () => new HttpException(httpResponse, httpResponse.code),
        );
      }),
    );
  }
}
