import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Interceptor to handle API errors and provide user-friendly messages
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: any) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }

      const originalError = err.error;
      const backend: any =
        typeof originalError === 'object' && originalError !== null
          ? originalError
          : { raw: originalError };

      // Priama extrakcia správy
      let message = backend.message || backend.error || backend.detail || backend.description || null;

      if (!message) {
        switch (err.status) {
          case 0:
            message = 'Server je nedostupný alebo došlo k chybe siete.';
            break;
          case 400:
            message = 'Neplatná požiadavka.';
            break;
          case 401:
            message = 'Neautorizované – prihláste sa prosím.';
            break;
          case 403:
            message = 'Nemáte oprávnenie na vykonanie akcie.';
            break;
          case 404:
            message = 'Zdroj nebol nájdený.';
            break;
          case 409:
            message = 'Konflikt – položka už existuje alebo stav koliduje.';
            break;
          case 422:
            message = 'Neplatné dáta.';
            break;
          case 500:
            message = 'Interná chyba servera.';
            break;
          default:
            message = `Chyba (${err.status}). Skúste znova.`;
        }
      }

      const normalized = new HttpErrorResponse({
        error: { ...backend, message },
        headers: err.headers,
        status: err.status,
        statusText: err.statusText,
        url: err.url || req.url
      });

      return throwError(() => normalized);
    })
  );
};
