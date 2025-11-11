import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrganizationService, Organization } from '../services/organization.service';
import { WaitingRoomService, WaitingRoomDTO } from '../services/waiting-room.service';
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
export class MainPageComponent implements OnInit {
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

  instructorRequests = signal<InstructorRequestDTO[]>([]);

  // Student pending waiting-room requests
  private readonly studentRequests = signal<WaitingRoomDTO[]>([]);
  readonly studentHasPending = computed(() => this.studentRequests().length > 0);
  pendingOrgName(): string {
    const first = this.studentRequests()[0];
    if (!first?.organizationId) return '';
    const org = this.organizations().find(o => o.id === first.organizationId);
    return org?.name || 'Názov organizácie';
  }

  isStudent = computed(() => this.auth.hasRole('STUDENT'));
  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  hasOrg = signal<boolean | null>(null);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit() {
    this.fetchOrganizations();
    this.fetchStudentRequests();
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

  fetchStudentRequests() {
    // Get current student's pending waiting-room requests
    this.waiting.getUsersWaitingRoom().subscribe({
      next: (list) => this.studentRequests.set(list ?? []),
      error: () => this.studentRequests.set([])
    });
  }

  join(org: Organization) {
    // Prevent multiple pending joins
    if (this.studentHasPending()) return;
    this.error.set(null);
    this.success.set(null);
    this.waiting.saveToWaitingRoom({ organizationId: org.id }).subscribe({
      next: () => {
        this.success.set('Žiadosť o pripojenie bola odoslaná.');
        // Optimistically reflect pending state; backend will confirm on next fetch
        const current = this.studentRequests();
        this.studentRequests.set([...current, { organizationId: org.id } as WaitingRoomDTO]);
      },
      error: (err) => this.error.set(err?.error?.message || 'Pripojenie zlyhalo.')
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
