import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { OrganizationService } from '../../services/organization.service';
import { catchError, map, of } from 'rxjs';

// Allow only authenticated INSTRUCTORs who already belong to an organization.
// If instructor has no organization, redirect to the instructor-request page to request/join.
export const instructorWithOrgGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const org = inject(OrganizationService);
  const router = inject(Router);

  if (!auth.isAuthenticated() || !auth.hasRole('INSTRUCTOR')) {
    return router.createUrlTree(['/login']);
  }

  return org.getCurrentOrganization().pipe(
    map(current => (current ? true : router.createUrlTree(['/instructor-request']))),
    catchError(() => of(router.createUrlTree(['/instructor-request'])))
  );
};

