import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {catchError, filter, switchMap, take} from 'rxjs/operators';
import {BehaviorSubject, throwError} from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean>(false); // signals when refresh is done
// false = refreshing, true = done

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // req - HttpRequest<any>, for edit need to clone
  // next - HttpHandler to pass the request to the next interceptor in the chain
  const auth = inject(AuthService);
  const router = inject(Router);

  // those api calls don't need the token
  const isAuthCall = /\/api\/(?:auth\/)?(login|register|confirm-account|resetPassword|reset-password|refresh-token)/.test(req.url);
  if (isAuthCall) return next(req);

  const token = auth.token();
  if (!token) return next(req);

  const expiresAt = auth.expiresAtMs() ?? 0;
  const remaining = expiresAt - Date.now();

  if (expiresAt && expiresAt && remaining <= 0) {
    auth.forceLogout();
    router.navigateByUrl('/login');
    return throwError(() => new Error('Access token expired'));
  }

  if (expiresAt && remaining < 60_000 * 15) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshSubject.next(false); // signalize "refreshing"

      return auth.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          refreshSubject.next(true); // signalize "done"

          const newToken = auth.token();
          const newReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(newReq);
        }),
        catchError((err) => {
          isRefreshing = false;
          auth.forceLogout();
          router.navigateByUrl('/login');
          return throwError(() => err);
        })
      );
    } else {

      // wait until the refreshing is done
      return refreshSubject.pipe(
        filter(done => done), // Only pass values that mean "refresh done"
        take(1), // take the first emitted value after that
        // When signal arrives, get new token, clone request with Authorization header and forward it
        switchMap(() => {
          const newToken = auth.token();
          const newReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          });
          return next(newReq);
        })
      );
    }
  }


  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.forceLogout();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
