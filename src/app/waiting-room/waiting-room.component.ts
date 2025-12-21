import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaitingRoomService, WaitingRoomDTO, UserDTO } from '../services/waiting-room.service';
import { AuthService } from '../services/auth.service';
import { OrganizationService, Organization } from '../services/organization.service';
import { InstructorRequestService, InstructorRequestDTO } from '../services/instructor-request.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, MatCardModule, MatButtonModule],
  templateUrl: './waiting-room.component.html',
  styleUrl: './waiting-room.component.css'
})
export class WaitingRoomComponent implements OnInit {
  private readonly service = inject(WaitingRoomService);
  protected readonly auth = inject(AuthService);
  private readonly org = inject(OrganizationService);
  private readonly instructorReq = inject(InstructorRequestService);
  private readonly router = inject(Router);

  isStudent = computed(() => this.auth.hasRole('STUDENT'));
  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  hasOrg = signal<boolean | null>(null);

  // Student has at most one pending waiting-room request
  myWaiting = signal<WaitingRoomDTO | null>(null);
  // Lightweight org cache for name lookup
  organizations = signal<Organization[]>([]);

  students = signal<UserDTO[]>([]);
  instructorRequests = signal<InstructorRequestDTO[]>([]);

  readonly pageSize = 10;
  studentsPageIndex = signal(0);
  instructorsPageIndex = signal(0);

  pagedStudents = computed(() => {
    const start = this.studentsPageIndex() * this.pageSize;
    return this.students().slice(start, start + this.pageSize);
  });
  pagedInstructorRequests = computed(() => {
    const start = this.instructorsPageIndex() * this.pageSize;
    return this.instructorRequests().slice(start, start + this.pageSize);
  });

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit() {
    this.initialize();
  }

  private initialize() {
    this.org.getAllOrganizations().subscribe({
      next: (list) => this.organizations.set(list),
      error: () => this.organizations.set([])
    });

    if (this.isInstructor()) {
      this.org.checkHasOrganization().subscribe({
        next: (v) => { this.hasOrg.set(v); this.refresh(); },
        error: () => { this.hasOrg.set(false); this.refresh(); }
      });
    } else if (this.isStudent()) {
      // If the user is a student and already belongs to an organization, always redirect to main page
      this.org.getCurrentOrganization().subscribe({
        next: (org) => {
          if (org) {
            this.router.navigateByUrl('/dashboard');
          } else {
            this.refresh();
          }
        },
        error: () => {
          this.refresh();
        }
      });
    } else {
      this.refresh();
    }
  }

  orgNameForMyWaiting(): string {
    const w = this.myWaiting();
    if (!w?.organizationId) return '';
    const org = this.organizations().find(o => o.id === w.organizationId);
    return org?.name || `Organizácia #${w.organizationId}`;
  }

  refresh() {
    this.loading.set(true);
    this.error.set(null);
    if (this.isStudent()) {
      this.service.getUsersWaitingRoom().subscribe({
        next: (r) => { this.myWaiting.set(r ?? null); this.loading.set(false); },
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
    this.service.removeFromWaitingRoom(student).subscribe({
      next: () => { this.success.set('Žiadosť bola odmietnutá.'); this.refresh(); },
      error: () => this.error.set('Odmietnutie zlyhalo.')
    });
  }

  cancelStudentsRequest() {
    if (!this.myWaiting()) return;
    this.success.set(null);
    this.error.set(null);
    this.service.deleteStudentRequest().subscribe({
      next: () => { this.success.set('Žiadosť bola zrušená.'); this.router.navigateByUrl('/dashboard'); },
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

  removeInstructorRequest(req: InstructorRequestDTO) {
    if (!req.id) return;
    this.success.set(null);
    this.error.set(null);
    this.instructorReq.deleteInstructorRequestById(req.id).subscribe({
      next: () => { this.success.set('Žiadosť inštruktora bola odstránená.'); this.refresh(); },
      error: () => this.error.set('Odstránenie žiadosti zlyhalo.')
    });
  }
}
