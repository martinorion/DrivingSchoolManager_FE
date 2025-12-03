import {Component, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService, EditProfileDTO, EditProfileResponseDTO, UserDTO } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { usernameValidators, emailValidators, phoneValidators, nameValidators, getErrorMessage } from '../../validators/form-validators';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    username: ['', usernameValidators],
    email: ['', emailValidators],
    phone: ['', phoneValidators],
    firstName: ['', nameValidators],
    surname: ['', nameValidators],
    // optional password: reuse same rules but not required; keep hints
    password: ['', [Validators.minLength(8), Validators.maxLength(30), Validators.pattern(/.*\d.*/)]],
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
}
