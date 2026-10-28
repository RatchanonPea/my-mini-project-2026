import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth';

const PUBLIC_PATHS = ['/auth/login', '/auth/refresh-token'];

// One refresh at a time: requests that 401 together all wait for the same new token.
let refreshing$: Observable<string> | null = null;

const withToken = (req: HttpRequest<unknown>, token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

// Sends the access token on every API call; on a 401 it refreshes the token once and replays the
// request, and logs the user out if the refresh token is gone or expired too.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/') || PUBLIC_PATHS.some((path) => req.url.includes(path))) {
    return next(req);
  }

  const auth = inject(AuthService);

  return next(withToken(req, auth.getAccessToken())).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      refreshing$ ??= auth.refreshAccessToken().pipe(
        shareReplay(1),
        finalize(() => (refreshing$ = null))
      );
      return refreshing$.pipe(
        switchMap((token) => next(withToken(req, token))),
        catchError((refreshError: unknown) => {
          if (refreshError instanceof HttpErrorResponse && refreshError.status !== 401) {
            return throwError(() => refreshError);
          }
          auth.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
