import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organization, OrganizationService } from '../services/organization.service';
import { InstructorRequestDTO, InstructorRequestService } from '../services/instructor-request.service';
import { AuthService } from '../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-instructor-request',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-request-component.html',
  styleUrl: './instructor-request-component.css'
})
export class InstructorRequestComponent {
  private readonly org = inject(OrganizationService);
  private readonly reqService = inject(InstructorRequestService);
  protected readonly auth = inject(AuthService);

  organizations = signal<Organization[]>([]);
  existingRequest = signal<InstructorRequestDTO | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  constructor() {
    if (this.isInstructor()) {
      this.refresh();
    }
  }

  refresh() {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const orgs$ = this.org.getAllOrganizations().pipe(catchError(() => of([] as Organization[])));
    const req$ = this.reqService.getInstructorRequest().pipe(catchError(() => of(null)));

    forkJoin([orgs$, req$]).subscribe({
      next: ([orgs, req]) => {
        this.organizations.set(orgs ?? []);
        this.existingRequest.set(req);
      },
      error: () => {
        this.organizations.set([]);
        this.existingRequest.set(null);
        this.error.set('Nepodarilo sa načítať údaje.');
      },
      complete: () => this.loading.set(false)
    });
  }

  requestJoin(org: Organization) {
    if (this.existingRequest()) return; // already has one
    this.error.set(null);
    this.success.set(null);
    this.reqService.sendInstructorRequest(org.id).subscribe({
      next: () => {
        this.success.set('Žiadosť bola odoslaná.');
        // Mark locally to avoid re-click while we re-fetch
        this.existingRequest.set({ organizationId: org.id });
        this.refresh();
      },
      error: (err) => this.error.set(err?.error?.message || 'Odoslanie žiadosti zlyhalo.')
    });
  }

  organizationNameById(id?: number): string {
    if (!id) return '';
    const found = this.organizations().find(o => o.id === id);
    return found?.name ?? `ID ${id}`;
  }
}
