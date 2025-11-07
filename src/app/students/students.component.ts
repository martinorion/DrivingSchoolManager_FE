import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService, UserDTO } from '../services/organization.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './students.component.html',
  styleUrl: './students.component.css'
})
export class StudentsComponent {
  private readonly org = inject(OrganizationService);
  protected readonly auth = inject(AuthService);

  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  hasOrg = signal<boolean | null>(null);
  students = signal<UserDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    if (this.isInstructor()) {
      this.org.checkHasOrganization().subscribe({
        next: v => { this.hasOrg.set(v); if (v) this.loadStudents(); },
        error: () => this.hasOrg.set(false)
      });
    }
  }

  private loadStudents() {
    this.loading.set(true);
    this.error.set(null);
    this.org.getAllAcceptedStudents().subscribe({
      next: list => { this.students.set(list); this.loading.set(false); },
      error: () => { this.error.set('Nepodarilo sa načítať študentov.'); this.loading.set(false); }
    });
  }
}

