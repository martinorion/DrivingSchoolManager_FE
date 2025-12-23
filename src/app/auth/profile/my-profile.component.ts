import {Component, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { AuthService, EditProfileDTO, EditProfileResponseDTO, UserDTO } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { usernameValidators, emailValidators, phoneValidators, nameValidators, getErrorMessage } from '../../validators/form-validators';
import { OrganizationService, Organization } from '../../services/organization.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, RouterLink],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  protected auth = inject(AuthService);
  private orgService = inject(OrganizationService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  currentUserId = signal<number | null>(null);

  form = this.fb.group({
    username: ['', usernameValidators],
    email: ['', emailValidators],
    phone: ['', phoneValidators],
    firstName: ['', nameValidators],
    surname: ['', nameValidators],
    // optional password: reuse same rules but not required; keep hints
    password: ['', [Validators.minLength(8), Validators.maxLength(30), Validators.pattern(/^(?=.*\d)(?=.*[^\w\s]).+$/)]],
  });

  // Organization edit form (for instructors)
  orgForm = this.fb.group({
    id: [null as number | null],
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    theoryLessonsCount: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    drivingLessonsCount: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    drivingSimulationsCount: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]]
  });
  orgImageFile = signal<File | null>(null);
  orgImagePreviewUrl = signal<string | null>(null);
  currentOrg = signal<Organization | null>(null);

  // load current profile and prefill
  ngOnInit() {
    this.loading.set(true);
    this.auth.getUserProfile().subscribe({
      next: (user: UserDTO) => {
        this.currentUserId.set(user.id ?? null);
        this.form.patchValue({
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          firstName: user.firstName || '',
          surname: user.surname || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nepodarilo sa načítať profil.');
        this.loading.set(false);
      }
    });

    // If instructor, prefill organization info
    if (this.auth.hasRole('INSTRUCTOR')) {
      this.orgService.getCurrentOrganization().subscribe({
        next: (org) => {
          this.currentOrg.set(org);
          if (org) {
            this.orgForm.patchValue({
              id: org.id,
              name: org.name,
              theoryLessonsCount: org.theoryLessonsCount ?? null,
              drivingLessonsCount: org.drivingLessonsCount ?? null,
              drivingSimulationsCount: org.drivingSimulationsCount ?? null,
            });
            if (org.imageUrl !== undefined && org.imageUrl !== null) {
              this.orgImagePreviewUrl.set(org.imageUrl);
            }
          }
        },
        error: () => {
          // no org or failed to load; keep empty
        }
      });
    }
  }

  // Delegate to shared error message helper
  getMessage(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[controlName];
    return getErrorMessage(controlName as string, control, this.form);
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const dto: EditProfileDTO = this.form.getRawValue();
    if (dto.password !== undefined && dto.password !== null && String(dto.password).trim() === '') {
      dto.password = null;
    }

    this.auth.editProfile(dto).subscribe({
      next: (res: EditProfileResponseDTO) => {
        if (res.status === 'success') {
          this.success.set(res.message || 'Úspešne ste si upravili profil.');
        } else {
          this.error.set(res.message || 'Úprava profilu zlyhala.');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Úprava profilu zlyhala.');
        this.loading.set(false);
      }
    });
  }

  // Organization image select
  onOrgFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;
    this.orgImageFile.set(file);
    this.orgImagePreviewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  // Submit organization update (name change or optional new image)
  updateOrganization() {
    if (this.orgForm.invalid) return;
    const { id, name, theoryLessonsCount, drivingLessonsCount, drivingSimulationsCount } = this.orgForm.getRawValue();
    const file = this.orgImageFile();
    const dto: Partial<Organization> = {
      id: id as number,
      name: name as string,
      theoryLessonsCount: theoryLessonsCount != null ? Number(theoryLessonsCount) : undefined,
      drivingLessonsCount: drivingLessonsCount != null ? Number(drivingLessonsCount) : undefined,
      drivingSimulationsCount: drivingSimulationsCount != null ? Number(drivingSimulationsCount) : undefined,
    };
    this.error.set(null);
    this.success.set(null);
    this.orgService.updateOrganizationWithOptionalImage(dto, file).subscribe({
      next: () => {
        this.success.set('Organizácia bola upravená.');
        // refresh current organization
        this.orgService.getCurrentOrganization().subscribe(org => this.currentOrg.set(org));
        // clear selected file
        this.orgImageFile.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Úprava organizácie zlyhala.');
      }
    });
  }

  deleteMyOrganization() {
    const org = this.currentOrg();
    if (!org || !org.id) return;
    const ok = confirm('Naozaj chcete zmazať celú organizáciu? Táto akcia je nezvratná.');
    if (!ok) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.orgService.deleteMyOrganization(org.id).subscribe({
      next: () => {
        this.success.set('Organizácia bola zmazaná.');
        this.currentOrg.set(null);
        this.orgForm.reset({ id: null, name: '' });
        this.orgImageFile.set(null);
        this.orgImagePreviewUrl.set(null);
        this.loading.set(false);
        this.router.navigateByUrl('dashboard');
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Zmazanie organizácie zlyhalo.');
        this.loading.set(false);
      }
    });
  }

  triggerFileInput(inputId: string) {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    el?.click();
  }
}
