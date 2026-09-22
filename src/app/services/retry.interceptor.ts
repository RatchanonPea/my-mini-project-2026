import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { retry, throwError } from 'rxjs';
import { NetworkService } from './network';

const MAX_RETRIES_WHILE_ONLINE = 3;

// Only GET is replayed: repeating a POST after a dropped connection could save the same record twice.
export const retryOnReconnectInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }
  const network = inject(NetworkService);
  return next(req).pipe(
    retry({
      delay: (error, retryCount) => {
        const networkError = error instanceof HttpErrorResponse && error.status === 0;
        if (!networkError || (network.online() && retryCount > MAX_RETRIES_WHILE_ONLINE)) {
          return throwError(() => error);
        }
        return network.whenReady();
      },
    }),
  );
};
