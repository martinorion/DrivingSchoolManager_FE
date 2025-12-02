import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DrivingLessonRequestDTO, DrivingLessonRequestService } from '../services/driving-lesson-request.service';

@Component({
  selector: 'app-instructor-incoming-requests',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './instructor-incoming-requests.component.html',
  styleUrl: './instructor-incoming-requests.component.css'
})
export class InstructorIncomingRequestsComponent implements OnInit {
  private readonly service = inject(DrivingLessonRequestService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  requests = signal<DrivingLessonRequestDTO[]>([]);

  searchTerm = signal('');
  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.requests();
    return this.requests().filter(r => {
      const s = `${r.id ?? ''} ${r.start} ${r.end} ${r.status ?? ''} ${r.note ?? ''}`.toLowerCase();
      return s.includes(q);
    });
  });
  ordered = computed(() => [...this.filtered()].sort((a, b) => a.start < b.start ? 1 : (a.start > b.start ? -1 : 0)));

  ngOnInit() { this.loadRequests(); }

  private loadRequests() {
    this.loading.set(true);
    this.error.set(null);
    this.service.instructorIncoming().subscribe({
      next: list => { this.requests.set(list ?? []); this.loading.set(false); },
      error: () => { this.error.set('Nepodarilo sa načítať žiadosti.'); this.loading.set(false); }
    });
  }

  onSearch(term: string) { this.searchTerm.set(term); }

  approve(r: DrivingLessonRequestDTO) {
    if (!r.id) return;
    this.error.set(null);
    this.success.set(null);
    this.service.approve(r.id).subscribe({
      next: updated => {
        this.requests.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.success.set('Žiadosť bola schválená.');
      },
      error: err => { this.error.set(err?.error?.message || 'Schválenie zlyhalo.'); }
    });
  }

  reject(r: DrivingLessonRequestDTO) {
    if (!r.id) return;
    if (!confirm('Naozaj chcete zamietnuť žiadosť?')) return;
    this.error.set(null);
    this.success.set(null);
    this.service.reject(r.id).subscribe({
      next: updated => {
        this.requests.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.success.set('Žiadosť bola zamietnutá.');
      },
      error: err => { this.error.set(err?.error?.message || 'Zamietnutie zlyhalo.'); }
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

