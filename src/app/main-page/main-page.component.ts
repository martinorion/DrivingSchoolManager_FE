import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrganizationService, Organization } from '../services/organization.service';
import { WaitingRoomService, WaitingRoomDTO } from '../services/waiting-room.service';
import { AuthService } from '../services/auth.service';
import {Router, RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButton, MatFormField, MatInput, MatLabel, MatError],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit {
  private readonly orgService = inject(OrganizationService);
  private readonly fb = inject(FormBuilder);
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
  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));
  hasOrg = signal<boolean | null>(null);

  // Image file required for creating organization
  imageFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
  });

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

    // Instructor-specific metadata
    if (this.auth.isAuthenticated() && this.isInstructor()) {
      this.orgService.checkHasOrganization().subscribe({
        next: v => {
          this.hasOrg.set(v);
        },
        error: () => {
          this.hasOrg.set(false);
        }
      });
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

  // Handle image selection
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.imageFile.set(file);
    this.imagePreviewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  removeSelectedImage() {
    this.imageFile.set(null);
    this.imagePreviewUrl.set(null);
  }

  createOrganization() {
    if (this.createForm.invalid || this.hasOrg()) return;
    const { name } = this.createForm.getRawValue();
    // Require image file
    const file = this.imageFile();
    if (!file) {
      this.error.set('Prosím nahrajte obrázok organizácie.');
      return;
    }
    this.error.set(null);
    this.success.set(null);
    this.orgService.createOrganizationWithImage({ name: name as string }, file).subscribe({
      next: () => {
        this.success.set('Organizácia bola vytvorená.');
        this.createForm.reset();
        this.imageFile.set(null);
        this.hasOrg.set(true);
        this.router.navigateByUrl('/waiting-room');
      },
      error: (err) => this.error.set(err?.error?.message || 'Vytvorenie zlyhalo.')
    });
  }

  triggerFileInput(inputId: string) {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    el?.click();
  }
}
