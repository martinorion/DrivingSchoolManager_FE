import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const email = this.form.controls.email.value as string;
    this.auth.resetPassword(email).subscribe({
      next: () => {
        this.success.set('Ak účet existuje, poslali sme e-mail s ďalšími inštrukciami.');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nepodarilo sa odoslať požiadavku.');
        this.loading.set(false);
      }
    });
  }
}

