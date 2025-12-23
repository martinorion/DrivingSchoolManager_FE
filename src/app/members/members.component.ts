import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationService, UserDTO } from '../services/organization.service';
import { AuthService } from '../services/auth.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { LessonCountsDialogComponent } from './lesson-counts-dialog.component';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, MatListModule, MatProgressSpinnerModule, MatDialogModule, MatButtonModule],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})
export class MembersComponent implements OnInit {
  private readonly org = inject(OrganizationService);
  protected readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  hasOrg = signal<boolean | null>(null);

  // Students state
  students = signal<UserDTO[]>([]);
  studentsLoading = signal(false);
  error = signal<string | null>(null);

  // Instructors state
  instructors = signal<UserDTO[]>([]);
  instructorsLoading = signal(false);

  // Search queries
  studentsQuery = signal('');
  instructorsQuery = signal('');

  readonly pageSize = 5;
  studentsPageIndex = signal(0);
  instructorsPageIndex = signal(0);

  filteredStudents = computed(() => {
    const q = this.studentsQuery().toLowerCase().trim();
    if (!q) return this.students();
    return this.students().filter(s => `${s.firstName || ''} ${s.surname || ''} ${s.email || ''} ${s.username || ''}`.toLowerCase().includes(q));
  });
  filteredInstructors = computed(() => {
    const q = this.instructorsQuery().toLowerCase().trim();
    if (!q) return this.instructors();
    return this.instructors().filter((i: UserDTO) => `${i.firstName || ''} ${i.surname || ''} ${i.email || ''} ${i.username || ''}`.toLowerCase().includes(q));
  });

  pagedStudents = computed(() => {
    const start = this.studentsPageIndex() * this.pageSize;
    const arr = this.filteredStudents();
    return arr.slice(start, start + this.pageSize);
  });
  pagedInstructors = computed(() => {
    const start = this.instructorsPageIndex() * this.pageSize;
    const arr = this.filteredInstructors();
    return arr.slice(start, start + this.pageSize);
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
      next: (list: UserDTO[]) => { this.instructors.set(list); this.instructorsPageIndex.set(0); this.instructorsLoading.set(false); },
      error: () => { this.instructors.set([]); this.instructorsLoading.set(false); }
    });
  }

  onStudentsPage(e: PageEvent) { this.studentsPageIndex.set(e.pageIndex); }
  onInstructorsPage(e: PageEvent) { this.instructorsPageIndex.set(e.pageIndex); }

  onStudentsQueryInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.studentsQuery.set(val);
    this.studentsPageIndex.set(0);
  }
  onInstructorsQueryInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.instructorsQuery.set(val);
    this.instructorsPageIndex.set(0);
  }

  // Open dialog with selected student
  openLessonCountsDialogWith(student: UserDTO) {
    const ref = this.dialog.open(LessonCountsDialogComponent, {
      width: '600px',
      data: student
    });
    ref.afterClosed().subscribe(res => {
      if (res && res.success) {
        this.loadStudents();
      }
    });
  }
}
