import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WaitingRoomService, WaitingRoomDTO, UserDTO } from '../services/waiting-room.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiting-room.component.html',
  styleUrl: './waiting-room.component.css'
})
export class WaitingRoomComponent {
  private readonly service = inject(WaitingRoomService);
  protected readonly auth = inject(AuthService);

  isUser = computed(() => this.auth.hasRole('USER'));
  isInstructor = computed(() => this.auth.hasRole('INSTRUCTOR'));

  myWaiting = signal<WaitingRoomDTO[]>([]);
  students = signal<UserDTO[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.error.set(null);
    if (this.isUser()) {
      this.service.getUsersWaitingRoom().subscribe({
        next: (r) => { this.myWaiting.set(r); this.loading.set(false); },
        error: () => { this.error.set('Nepodarilo sa načítať čakáreň.'); this.loading.set(false); }
      });
    } else if (this.isInstructor()) {
      this.service.getAllStudentsInWaitingRoom().subscribe({
        next: (r) => { this.students.set(r); this.loading.set(false); },
        error: () => { this.error.set('Nepodarilo sa načítať študentov.'); this.loading.set(false); }
      });
    } else {
      this.loading.set(false);
    }
  }

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
}


