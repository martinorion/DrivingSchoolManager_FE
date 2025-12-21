import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService, UserDTO } from '../services/organization.service';
import { AuthService } from '../services/auth.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {MatCardActions} from '@angular/material/card';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatCardActions],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit {
  private readonly org = inject(OrganizationService);
  protected readonly auth = inject(AuthService);

  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  hasOrg = signal<boolean | null>(null);

  // Students state
  students = signal<UserDTO[]>([]);
  studentsLoading = signal(false);
  error = signal<string | null>(null);

  readonly pageSize = 10;
  studentsPageIndex = signal(0);
  pagedStudents = computed(() => {
    const start = this.studentsPageIndex() * this.pageSize;
    return this.students().slice(start, start + this.pageSize);

  });

  // Instructors state
  instructors = signal<UserDTO[]>([]);
  instructorsLoading = signal(false);
  instructorsPageIndex = signal(0);
  pagedInstructors = computed(() => {
    const start = this.instructorsPageIndex() * this.pageSize;
    return this.instructors().slice(start, start + this.pageSize);
  });

  ngOnInit() {
    if (this.isInstructor()) {
      this.org.checkHasOrganization().subscribe({
        next: v => {
          this.hasOrg.set(v);
          if (v) {
            this.loadStudents();
            this.loadInstructors();
          }
        },
        error: () => this.hasOrg.set(false)
      });
    }
  }

  private loadStudents() {
    this.studentsLoading.set(true);
    this.error.set(null);
    this.org.getAllAcceptedStudents().subscribe({
      next: list => { this.students.set(list); this.studentsPageIndex.set(0); this.studentsLoading.set(false); },
      error: () => { this.error.set('Nepodarilo sa načítať študentov.'); this.studentsLoading.set(false); }
    });
  }

  private loadInstructors() {
    this.instructorsLoading.set(true);
    this.org.getOrganizationInstructors().subscribe({
      next: list => { this.instructors.set(list); this.instructorsPageIndex.set(0); this.instructorsLoading.set(false); },
      error: () => { this.instructors.set([]); this.instructorsLoading.set(false); }
    });
  }

  onStudentsPage(e: PageEvent) { this.studentsPageIndex.set(e.pageIndex); }
  onInstructorsPage(e: PageEvent) { this.instructorsPageIndex.set(e.pageIndex); }
}

