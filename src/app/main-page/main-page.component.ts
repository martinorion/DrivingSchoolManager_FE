import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrganizationService, Organization } from '../services/organization.service';
import { WaitingRoomService } from '../services/waiting-room.service';
import { AuthService } from '../services/auth.service';
import {Router, RouterLink} from '@angular/router';
import { InstructorRequestService, InstructorRequestDTO } from '../services/instructor-request.service';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {
  private readonly orgService = inject(OrganizationService);
  private readonly fb = inject(FormBuilder);
  private readonly waiting = inject(WaitingRoomService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly instructorReq = inject(InstructorRequestService);

  organizations = signal<Organization[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Instructor request list (for disabling button if already requested)
  instructorRequests = signal<InstructorRequestDTO[]>([]);

  isStudent = computed(() => this.auth.hasRole('STUDENT'));
  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  hasOrg = signal<boolean | null>(null);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit() {
    this.fetchOrganizations();
    if (this.isInstructor()) {
      this.orgService.checkHasOrganization().subscribe({
        next: v => { this.hasOrg.set(v); if (!v) this.fetchInstructorRequests(); },
        error: () => { this.hasOrg.set(false); this.fetchInstructorRequests(); }
      });
    }
  }

  fetchOrganizations() {
    this.loading.set(true);
    this.error.set(null);
    this.orgService.getAllOrganizations().subscribe({
      next: (list) => { this.organizations.set(list); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message || 'Nepodarilo sa načítať organizácie.'); this.loading.set(false); }
    });
  }

  fetchInstructorRequests() {
    this.instructorReq.getAllRequests().subscribe({
      next: r => this.instructorRequests.set(r ?? []),
      error: () => {},
    });
  }

  hasInstructorRequested(orgId: number): boolean {
    return this.instructorRequests().some(r => r.organizationId === orgId);
  }

  join(org: Organization) {
    this.error.set(null);
    this.success.set(null);
    this.waiting.saveToWaitingRoom({ organizationId: org.id }).subscribe({
      next: () => { this.success.set('Žiadosť o pripojenie bola odoslaná.'); },
      error: (err) => this.error.set(err?.error?.message || 'Pripojenie zlyhalo.')
    });
  }

  requestInstructor(org: Organization) {
    if (this.hasInstructorRequested(org.id)) return;
    this.error.set(null);
    this.success.set(null);
    this.instructorReq.sendInstructorRequest(org.id).subscribe({
      next: () => { this.success.set('Inštruktorská žiadosť bola odoslaná.'); this.fetchInstructorRequests(); },
      error: (err) => this.error.set(err?.error?.message || 'Odoslanie žiadosti zlyhalo.')
    });
  }

  create() {
    if (this.createForm.invalid || this.hasOrg()) return;
    const { name } = this.createForm.getRawValue();
    this.error.set(null);
    this.success.set(null);
    this.orgService.createOrganization({ name: name as string }).subscribe({
      next: () => {
        this.success.set('Organizácia bola vytvorená.');
        this.createForm.reset();
        this.hasOrg.set(true);
        this.router.navigateByUrl('/waiting-room');
      },
      error: (err) => this.error.set(err?.error?.message || 'Vytvorenie zlyhalo.')
    });
  }
}
