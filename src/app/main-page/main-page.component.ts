import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrganizationService, Organization } from '../services/organization.service';
import { WaitingRoomService } from '../services/waiting-room.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {
  private readonly orgService = inject(OrganizationService);
  private readonly fb = inject(FormBuilder);
  private readonly waiting = inject(WaitingRoomService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  organizations = signal<Organization[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

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
        next: v => this.hasOrg.set(v),
        error: () => this.hasOrg.set(false)
      });
    }
  }

  fetchOrganizations() {
    this.loading.set(true);
    this.error.set(null);
    this.orgService.getAllOrganizations().subscribe({
      next: (list) => {
        this.organizations.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Nepodarilo sa načítať organizácie.');
        this.loading.set(false);
      }
    });
  }

  join(org: Organization) {
    this.error.set(null);
    this.success.set(null);
    this.waiting.saveToWaitingRoom({ organizationId: org.id }).subscribe({
      next: () => { this.success.set('Žiadosť o pripojenie bola odoslaná.'); },
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
        // Immediately show instructor workflow pages
        this.router.navigateByUrl('/waiting-room');
      },
      error: (err) => this.error.set(err?.error?.message || 'Vytvorenie zlyhalo.')
    });
  }
}
