import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, EditProfileDTO, EditProfileResponseDTO, UserDTO } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z][a-zA-Z0-9._-]*$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^[0-9+\s-]*$/)]],
    firstName: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ž' -]+$/)]],
    surname: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ž' -]+$/)]],
    password: ['', [Validators.minLength(8), Validators.maxLength(30), Validators.pattern(/.*\d.*/)]], // optional
  });

  // load current profile and prefill
  ngOnInit() {
    this.loading.set(true);
    this.auth.getUserProfile().subscribe({
      next: (user: UserDTO) => {
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
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const dto: EditProfileDTO = this.form.getRawValue();
    // if password is empty string, send null to avoid backend change (optional)
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
}
