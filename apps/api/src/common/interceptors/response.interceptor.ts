import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    return next.handle().pipe(
      map((value) => {
        // If the handler already returned a shaped response with { data, meta }
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
