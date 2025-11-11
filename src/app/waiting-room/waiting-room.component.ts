import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaitingRoomService, WaitingRoomDTO, UserDTO } from '../services/waiting-room.service';
import { AuthService } from '../services/auth.service';
import { OrganizationService } from '../services/organization.service';
import { InstructorRequestService, InstructorRequestDTO } from '../services/instructor-request.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule],
  templateUrl: './waiting-room.component.html',
  styleUrl: './waiting-room.component.css'
})
export class WaitingRoomComponent {
  private readonly service = inject(WaitingRoomService);
  protected readonly auth = inject(AuthService);
  private readonly org = inject(OrganizationService);
  private readonly instructorReq = inject(InstructorRequestService);

  isStudent = computed(() => this.auth.hasRole('STUDENT'));
  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  hasOrg = signal<boolean | null>(null);

  // Data
  myWaiting = signal<WaitingRoomDTO[]>([]);
  students = signal<UserDTO[]>([]);
  instructorRequests = signal<InstructorRequestDTO[]>([]);

  // Pagination
  readonly pageSize = 10;
  studentsPageIndex = signal(0);
  instructorsPageIndex = signal(0);
  myWaitingPageIndex = signal(0);

  pagedStudents = computed(() => {
    const start = this.studentsPageIndex() * this.pageSize;
    return this.students().slice(start, start + this.pageSize);
  });
  pagedInstructorRequests = computed(() => {
    const start = this.instructorsPageIndex() * this.pageSize;
    return this.instructorRequests().slice(start, start + this.pageSize);
  });
  pagedMyWaiting = computed(() => {
    const start = this.myWaitingPageIndex() * this.pageSize;
    return this.myWaiting().slice(start, start + this.pageSize);
  });

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit() {
    this.initialize();
  }

  private initialize() {
    if (this.isInstructor()) {
      this.org.checkHasOrganization().subscribe({
        next: (v) => { this.hasOrg.set(v); this.refresh(); },
        error: () => { this.hasOrg.set(false); this.refresh(); }
      });
    } else {
      this.refresh();
    }
  }

  refresh() {
    this.loading.set(true);
    this.error.set(null);
    if (this.isStudent()) {
      this.service.getUsersWaitingRoom().subscribe({
        next: (r) => { this.myWaiting.set(r); this.myWaitingPageIndex.set(0); this.loading.set(false); },
        error: () => { this.error.set('Nepodarilo sa načítať čakáreň.'); this.loading.set(false); }
      });
    } else if (this.isInstructor() && this.hasOrg()) {
      this.service.getAllStudentsInWaitingRoom().subscribe({
        next: (r) => { this.students.set(r); this.studentsPageIndex.set(0); },
        error: () => { this.error.set('Nepodarilo sa načítať študentov.'); }
      });
      this.instructorReq.getAllRequests().subscribe({
        next: (r) => { this.instructorRequests.set(r ?? []); this.instructorsPageIndex.set(0); this.loading.set(false); },
        error: () => { this.loading.set(false); }
      });
    } else {
      this.loading.set(false);
    }
  }

  onStudentsPage(e: PageEvent) { this.studentsPageIndex.set(e.pageIndex); }
  onInstructorsPage(e: PageEvent) { this.instructorsPageIndex.set(e.pageIndex); }
  onMyWaitingPage(e: PageEvent) { this.myWaitingPageIndex.set(e.pageIndex); }

  approve(student: UserDTO) {
    this.success.set(null);
    this.error.set(null);
    this.service.addMembersToOrganization({ studentId: student.id }).subscribe({
      next: () => { this.success.set('Študent bol pridaný do organizácie.'); this.refresh(); },
      error: () => this.error.set('Schválenie zlyhalo.')
    });
  }

  reject(student: UserDTO) {
    this.success.set(null);
    this.error.set(null);
    this.service.removeFromWaitingRoom({ studentId: student.id }).subscribe({
      next: () => { this.success.set('Žiadosť bola odmietnutá.'); this.refresh(); },
      error: () => this.error.set('Odmietnutie zlyhalo.')
    });
  }

  cancel(wait: WaitingRoomDTO) {
    this.success.set(null);
    this.error.set(null);
    this.service.removeFromWaitingRoom({ id: wait.id, organizationId: wait.organizationId }).subscribe({
      next: () => { this.success.set('Žiadosť bola zrušená.'); this.refresh(); },
      error: () => this.error.set('Zrušenie zlyhalo.')
    });
  }

  approveInstructor(req: InstructorRequestDTO) {
    if (!req.instructorId || !req.organizationId) return;
    this.success.set(null);
    this.error.set(null);
    this.instructorReq.addInstructorToOrganization(req.instructorId, req.organizationId).subscribe({
      next: () => { this.success.set('Inštruktor bol pridaný do organizácie.'); this.refresh(); },
      error: () => this.error.set('Pridanie inštruktora zlyhalo.')
    });
  }
}
