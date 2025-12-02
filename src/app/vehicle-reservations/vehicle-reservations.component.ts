import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VehicleReservationDTO, VehicleReservationService } from '../services/vehicle-reservation.service';
import { VehicleDTO, VehicleService } from '../services/vehicle.service';
// Angular Material modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTimepickerModule } from '@angular/material/timepicker';

@Component({
  selector: 'app-vehicle-reservations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTimepickerModule
  ],
  templateUrl: './vehicle-reservations.component.html',
  styleUrl: './vehicle-reservations.component.css'
})
export class VehicleReservationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly reservationService = inject(VehicleReservationService);
  private readonly vehicleService = inject(VehicleService);

  vehicles = signal<VehicleDTO[]>([]);
  reservations = signal<VehicleReservationDTO[]>([]);

  loading = signal(false);
  creating = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  searchTerm = signal('');
  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.reservations(); // no filtering because empty search
    const vehiclesMap = new Map(this.vehicles().map(v => [v.id, v] as const)); // map for quick lookup Map<vehicleId, vehicleObject>.
    return this.reservations().filter(r => {
      const v = vehiclesMap.get(r.vehicleId); // get vehicle for this reservation
      const haystack = [r.id, r.vehicleId, v?.name, v?.brand, v?.model, v?.plateNumber, r.start, r.end] // build searchable string vehicle + reservation
        .filter(Boolean) // remove null/undefined
        .join(' ') // join to single string separated by spaces
        .toLowerCase();
      return haystack.includes(q); // return whether search term is found
    });
  });

  ordered = computed(() => [...this.filtered()].sort((a, b) => a.start < b.start ? 1 : (a.start > b.start ? -1 : 0)));

  form = this.fb.nonNullable.group({
    vehicleId: [0 as number, [Validators.required, Validators.min(1)]],
    startDate: [null as Date | null, [Validators.required]],
    startTime: ['', [Validators.required]],
    endTime: ['', [Validators.required]],
  });

  ngOnInit() {
    this.loadVehicles();
    this.loadReservations();
  }

  private loadVehicles() {
    this.vehicleService.getAll().subscribe({
      next: list => this.vehicles.set(list ?? []),
      error: () => {}
    });
  }

  private loadReservations() {
    this.loading.set(true);
    this.error.set(null);
    this.reservationService.list().subscribe({
      next: list => { this.reservations.set(list ?? []); this.loading.set(false); },
      error: () => { this.error.set('Nepodarilo sa načítať rezervácie.'); this.loading.set(false); }
    });
  }

  onSearch(term: string) { this.searchTerm.set(term); }

  private combineDateAndTime(date: Date | null, time: any): Date {
    // Start from provided date if available, otherwise try to take date from time if it's a Date, otherwise use now
    let d: Date;
    if (date) d = new Date(date);
    else if (time instanceof Date) d = new Date(time); // if time is Date, use its date part
    else if (typeof time === 'number') d = new Date(time); // if time is timestamp, use its date part
    else d = new Date(); // otherwise use current date

    let hours = 0;
    let minutes = 0;

    if (time == null || time === '') {
      // keep 00:00
    }
    else if (typeof time === 'string') {
      const parts = time.split(':');
      hours = Number(parts[0]) || 0;
      minutes = Number(parts[1]) || 0;
    }
    else if (time instanceof Date) {
      hours = time.getHours();
      minutes = time.getMinutes();
    }
    else if (typeof time === 'number') {
      const tmp = new Date(time);
      hours = tmp.getHours();
      minutes = tmp.getMinutes();
    }
    else if (typeof time === 'object') {
      // common shapes: { hour: 8, minute: 30 } or { hours: 8, minutes: 30 }
      hours = Number(time.hour ?? time.hours ?? time.h ?? 0) || 0;
      minutes = Number(time.minute ?? time.minutes ?? time.m ?? 0) || 0;
    }

    d.setHours(hours, minutes, 0, 0); // set hours and minutes, zero seconds and ms
    return d;
  }

  private isValidRange(start: Date, end: Date) {
    if (!start || !end) return false;
    return start.getTime() < end.getTime();
  }

  // New helper: format a Date as local naive ISO datetime (no offset) e.g. 2025-11-30T11:00:00
  private formatLocalNaiveISO(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0'); // function to pad numbers to 2 digits, e.g. 5 -> "05"
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate()); // getDate() is day of month
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    const second = pad(d.getSeconds());
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  }

  submit() {
    if (this.form.invalid || this.creating()) return;
    const { vehicleId, startDate, startTime, endTime } = this.form.getRawValue();
    if (!startDate) return;

    const startDt = this.combineDateAndTime(startDate as Date, startTime);
    const endDt = this.combineDateAndTime(startDate as Date, endTime);

    if (!this.isValidRange(startDt, endDt)) {
      this.form.controls.endTime.setErrors({ range: true });
      return;
    }

    const payload: VehicleReservationDTO = {
      vehicleId: Number(vehicleId),
      // Send naive local datetime string (no offset) so backend mapping to LocalDateTime succeeds
      start: this.formatLocalNaiveISO(startDt),
      end: this.formatLocalNaiveISO(endDt),
    };

    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);
    this.reservationService.create(payload).subscribe({
      next: created => {
        this.reservations.set([created, ...this.reservations()]);
        this.success.set('Rezervácia bola vytvorená.');
        // Reset to initial values
        this.form.reset({ vehicleId: 0, startDate: null, startTime: '', endTime: '' });
        this.creating.set(false);
      },
      error: err => {
        const msg = err?.error?.message || 'Vytvorenie rezervácie zlyhalo.';
        this.error.set(msg);
        this.creating.set(false);
      }
    });
  }

  delete(res: VehicleReservationDTO) {
    if (!res.id) return;
    const v = this.vehicles().find(x => x.id === res.vehicleId);
    const label = v ? `${v.name} (${v.plateNumber})` : `ID ${res.vehicleId}`;
    const startLabel = this.formatDateTime(res.start);
    const endLabel = this.formatDateTime(res.end);
    if (!confirm(`Naozaj chcete odstrániť rezerváciu vozidla ${label} od ${startLabel} do ${endLabel}?`)) return;

    this.error.set(null);
    this.success.set(null);
    this.reservationService.delete(res.id).subscribe({
      next: () => {
        this.reservations.update(list => list.filter(x => x.id !== res.id));
        this.success.set('Rezervácia bola odstránená.');
      },
      error: err => {
        const msg = err?.error?.message || 'Odstránenie rezervácie zlyhalo.';
        this.error.set(msg);
      }
    });
  }

  vehicleLabel(id?: number) {
    if (!id) return '';
    const v = this.vehicles().find(x => x.id === id);
    return v ? `${v.name} · ${v.brand} ${v.model} · ${v.plateNumber}` : `Vozidlo #${id}`;
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    try {
      return new Intl.DateTimeFormat('sk-SK', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(d);
    } catch (e) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hour = String(d.getHours()).padStart(2, '0');
      const minute = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hour}:${minute}`;
    }
  }
}
