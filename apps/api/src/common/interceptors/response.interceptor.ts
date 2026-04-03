import {
  Injectable,
  Logger,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export interface StandardResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const request = context.switchToHttp().getRequest<{ url: string; method: string }>();
    return next.handle().pipe(
      catchError((error: { message?: string }) => {
        this.logger.error('Request failed', {
          path: request.url,
          method: request.method,
          error: error.message,
        });
        return throwError(() => error);
      }),
      map((value) => {
        /** Detects pre-shaped responses by checking for both 'data' and 'meta' keys. Other objects are wrapped in { data, meta }. */
        if (
          value !== null &&
          typeof value === 'object' &&
          'data' in value &&
          'meta' in value
        ) {
          return {
            success: true as const,
            data: (value as { data: T; meta: ResponseMeta }).data,
            meta: (value as { data: T; meta: ResponseMeta }).meta,
          };
        }

        return {
          success: true as const,
          data: value as T,
        };
      }),
    );
  }
}
