// import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
// import { catchError } from 'rxjs/operators';
// import { throwError } from 'rxjs';
//
// export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
//   return next(req).pipe(
//     catchError((err: any) => {
//
//       if (!(err instanceof HttpErrorResponse)) {
//         return throwError(() => err);
//       }
//
//       // Normalize backend error into an object
//       const originalError = err.error;
//       const backend: any =
//         typeof originalError === 'object' && originalError !== null
//           ? originalError
//           : { raw: originalError };
//
//       // Extract most meaningful error message
//       const backendMessage =
//         backend.message ||
//         backend.error ||
//         backend.detail ||
//         null;
//
//       let message = backendMessage;
//
//       // Provide fallback message if backend didn't offer one
//       if (!message) {
//         switch (err.status) {
//           case 0:
//             message = 'Server je nedostupný alebo došlo k chybe siete.';
//             break;
//           case 400:
//             message = 'Neplatná požiadavka.';
//             break;
//           case 401:
//             message = 'Nie ste prihlásený.';
//             break;
//           case 403:
//             message = 'Nemáte oprávnenie na vykonanie akcie.';
//             break;
//           case 404:
//             message = 'Zdroj nebol nájdený.';
//             break;
//           case 409:
//             message = 'Konflikt požiadavky.';
//             break;
//           case 422:
//             message = 'Neplatné dáta.';
//             break;
//           case 500:
//             message = 'Interná chyba servera.';
//             break;
//           default:
//             message = `Chyba (${err.status}). Skúste znova.`;
//         }
//       }
//
//       // Construct normalized HttpErrorResponse
//       const normalized = new HttpErrorResponse({
//         error: { ...backend, message },
//         headers: err.headers,
//         status: err.status,
//         statusText: err.statusText,
//         url: err.url || req.url
//       });
//
//       return throwError(() => normalized);
//     })
//   );
// };
