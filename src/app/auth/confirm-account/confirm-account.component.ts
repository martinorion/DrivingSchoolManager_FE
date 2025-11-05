import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './confirm-account.component.html',
  styleUrl: './confirm-account.component.css'
})
export class ConfirmAccountComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group(
    {
      password: [''],
      confirmPassword: [''],
    },
    { validators: [this.passwordsMatchValidator] }
  );

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value as string | undefined;
    const confirm = group.get('confirmPassword')?.value as string | undefined;
    if (!password && !confirm) return null; // empty is allowed
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('Chýba token v URL.');
      return;
    }
    if (this.form.errors?.['passwordMismatch']) return;

    const password = (this.form.controls.password.value || '') as string;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.auth.confirmAccount(token, password).subscribe({
      next: () => {
        this.success.set('Účet bol potvrdený. Môžete sa prihlásiť.');
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nepodarilo sa potvrdiť účet.');
        this.loading.set(false);
      }
    });
  }
}
