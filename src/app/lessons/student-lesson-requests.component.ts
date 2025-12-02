import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { DrivingLessonRequestDTO, DrivingLessonRequestService } from '../services/driving-lesson-request.service';
import { OrganizationService } from '../services/organization.service';
import {MatTimepicker, MatTimepickerInput, MatTimepickerToggle} from '@angular/material/timepicker';

@Component({
  selector: 'app-student-lesson-requests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSelectModule,
    MatTimepicker,
    MatTimepickerInput,
    MatTimepickerToggle,
  ],
  templateUrl: './student-lesson-requests.component.html',
  styleUrl: './student-lesson-requests.component.css'
})
export class StudentLessonRequestsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(DrivingLessonRequestService);
  private readonly orgService = inject(OrganizationService);

  creating = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  instructors = signal<{ id: number; firstName: string; surname: string }[]>([]);
  requests = signal<DrivingLessonRequestDTO[]>([]);

  searchTerm = signal('');
  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.requests();
    return this.requests().filter(r => {
      const s = `${r.id ?? ''} ${r.instructorId} ${r.start} ${r.end} ${r.status ?? ''} ${r.note ?? ''}`.toLowerCase();
      return s.includes(q);
    });
  });
  ordered = computed(() => [...this.filtered()].sort((a, b) => a.start < b.start ? 1 : (a.start > b.start ? -1 : 0)));

  form = this.fb.nonNullable.group({
    instructorId: [0 as number, [Validators.required, Validators.min(1)]],
    startDate: [null as Date | null, [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
    note: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit() {
    this.loadInstructors();
    this.loadRequests();
  }

  private loadInstructors() {
    try {
      this.orgService.getOrganizationInstructorsForStudent().subscribe({
        next: (members: any[]) => {
          const list = (members ?? []);

          this.instructors.set(list);
        },
        error: () => {}
      });
    } catch {
      // keep empty
    }
  }

  private loadRequests() {
    this.loading.set(true);
    this.error.set(null);
    this.service.studentsRequests().subscribe({
      next: list => { this.requests.set(list ?? []); this.loading.set(false); },
      error: () => { this.error.set('Nepodarilo sa načítať žiadosti o jazdy.'); this.loading.set(false); }
    });
  }

  onSearch(term: string) { this.searchTerm.set(term); }

  private combineDateAndTime(date: Date | null, time: any): Date {
    let d: Date = date ? new Date(date) : new Date();
    let hours = 0, minutes = 0;
    if (typeof time === 'string') { const p = time.split(':'); hours = Number(p[0])||0; minutes = Number(p[1])||0; }
    else if (time instanceof Date) { hours = time.getHours(); minutes = time.getMinutes(); }
    else if (typeof time === 'number') { const tmp = new Date(time); hours = tmp.getHours(); minutes = tmp.getMinutes(); }
    else if (typeof time === 'object' && time) { hours = Number(time.hour ?? time.hours ?? 0)||0; minutes = Number(time.minute ?? time.minutes ?? 0)||0; }
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
  private isValidRange(start: Date, end: Date) { return start && end && start.getTime() < end.getTime(); }
  private formatLocalNaiveISO(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }

  submit() {
    if (this.form.invalid || this.creating()) return;
    const { instructorId, startDate, startTime, endTime, note } = this.form.getRawValue();
    if (!startDate) return;
    const startDt = this.combineDateAndTime(startDate as Date, startTime);
    const endDt = this.combineDateAndTime(startDate as Date, endTime);
    if (!this.isValidRange(startDt, endDt)) { this.form.controls.endTime.setErrors({ range: true }); return; }

    const payload: DrivingLessonRequestDTO = {
      instructorId: Number(instructorId),
      start: this.formatLocalNaiveISO(startDt),
      end: this.formatLocalNaiveISO(endDt),
      note: note || undefined,
    };

    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);
    this.service.createRequest(payload).subscribe({
      next: created => {
        this.requests.set([created, ...this.requests()]);
        this.success.set('Žiadosť bola odoslaná inštruktorovi.');
        this.form.reset({ instructorId: 0, startDate: null, startTime: '', endTime: '', note: '' });
        this.creating.set(false);
      },
      error: err => {
        const msg = err?.error?.message || 'Odoslanie žiadosti zlyhalo.';
        this.error.set(msg);
        this.creating.set(false);
      }
    });
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    try {
      return new Intl.DateTimeFormat('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
    } catch {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
}

