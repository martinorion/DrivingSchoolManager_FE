import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organization, OrganizationService } from '../services/organization.service';
import { InstructorRequestDTO, InstructorRequestService } from '../services/instructor-request.service';
import { AuthService } from '../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-instructor-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './instructor-request-component.html',
  styleUrl: './instructor-request-component.css'
})
export class InstructorRequestComponent implements OnInit {
  private readonly org = inject(OrganizationService);
  private readonly reqService = inject(InstructorRequestService);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  organizations = signal<Organization[]>([]);
  existingRequest = signal<InstructorRequestDTO | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Image file required for creating organization (match main-page shape)
  imageFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);

  createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
  });

  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  ngOnInit() {
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

  // Handle image selection (match main-page names)
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

  triggerFileInput(inputId: string) {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    el?.click();
  }

  createOrganization() {
    if (this.createForm.invalid) return;
    const { name } = this.createForm.getRawValue();
    // Require image file
    const file = this.imageFile();
    if (!file) {
      this.error.set('Prosím nahrajte obrázok organizácie.');
      return;
    }
    this.error.set(null);
    this.success.set(null);
    this.org.createOrganizationWithImage({ name: name as string }, file).subscribe({
      next: () => {
        this.success.set('Organizácia bola vytvorená.');
        this.createForm.reset();
        this.imageFile.set(null);
        // refresh list
        this.refresh();
      },
      error: (err) => this.error.set(err?.error?.message || 'Vytvorenie zlyhalo.')
    });
  }

  organizationNameById(id?: number): string {
    if (!id) return '';
    const found = this.organizations().find(o => o.id === id);
    return found?.name ?? `ID ${id}`;
  }

  // Allow instructor to cancel their own existing request
  cancelMyRequest() {
    if (!this.existingRequest()) return;
    this.error.set(null);
    this.success.set(null);
    this.reqService.deleteInstructorRequest().subscribe({
      next: () => { this.success.set('Vaša žiadosť bola zrušená.'); this.existingRequest.set(null); this.refresh(); },
      error: () => this.error.set('Zrušenie žiadosti zlyhalo.')
    });
  }
}
