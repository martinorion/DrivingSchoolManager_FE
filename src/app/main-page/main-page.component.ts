import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { OrganizationService, Organization } from '../services/organization.service';
import { WaitingRoomService, WaitingRoomDTO } from '../services/waiting-room.service';
import { AuthService } from '../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit {
  private readonly orgService = inject(OrganizationService);
  private readonly waiting = inject(WaitingRoomService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  organizations = signal<Organization[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Student pending waiting-room request (single)
  private readonly studentRequest = signal<WaitingRoomDTO | null>(null);
  readonly studentHasPending = computed(() => !!this.studentRequest());

  // If a student already belongs to an organization, store it here
  private readonly myOrganization = signal<Organization | null>(null);
  readonly isStudentInOrg = computed(() => this.auth.hasRole('STUDENT') && !!this.myOrganization());

  isStudent = computed(() => this.auth.hasRole('STUDENT'));

  ngOnInit() {
    // For students, first check if they already belong to an organization. If yes, display only that one.
    if (this.auth.isAuthenticated() && this.isStudent()) {
      this.loading.set(true);
      this.orgService.getCurrentOrganization().subscribe({
        next: (org) => {
          this.myOrganization.set(org);
          if (org) {
            this.organizations.set([org]);
            this.loading.set(false);
          } else {
            this.fetchOrganizations();
          }
        },
        error: () => {
          this.fetchOrganizations();
        }
      });
      // Also reflect pending request state to disable join buttons
      this.fetchStudentRequest();
    } else {
      // Non-students or unauthenticated users just see the list
      this.fetchOrganizations();
    }
  }

  fetchOrganizations() {
    this.loading.set(true);
    this.error.set(null);
    this.orgService.getAllOrganizations().subscribe({
      next: (list) => { this.organizations.set(list); this.loading.set(false); console.log(list)},
      error: (err) => { this.error.set(err?.error?.message || 'Nepodarilo sa načítať organizácie.'); this.loading.set(false); }
    });
  }

  fetchStudentRequest() {
    this.waiting.getUsersWaitingRoom().subscribe({
      next: (dto) => this.studentRequest.set(dto ?? null),
      error: () => this.studentRequest.set(null)
    });
  }

  joinSendRequest(org: Organization) {
    if (this.studentHasPending() || this.isStudentInOrg()) return;
    this.error.set(null);
    this.success.set(null);
    this.waiting.saveToWaitingRoom({ organizationId: org.id }).subscribe({
      next: () => {
        this.success.set('Žiadosť o pripojenie bola odoslaná.');
        this.studentRequest.set({ organizationId: org.id } as WaitingRoomDTO);
        // redirect student to the waiting-room so they see the waiting UI
        this.router.navigateByUrl('/waiting-room');
      },
      error: (err) => this.error.set(err?.error?.message || 'Pripojenie zlyhalo.')
    });
  }
}
