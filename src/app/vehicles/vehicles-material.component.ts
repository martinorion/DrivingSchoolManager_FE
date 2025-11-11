import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { VehicleDTO, VehicleService } from '../services/vehicle.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatPaginatorModule],
  templateUrl: './vehicles-material.component.html',
  styleUrl: './vehicles-material.component.css'
})
export class VehiclesMaterialComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly fb = inject(FormBuilder);

  vehicles = signal<VehicleDTO[]>([]);
  loading = signal(false);
  creating = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // search
  searchTerm = signal('');
  filteredVehicles = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.vehicles();
    return this.vehicles().filter(v =>
      (v.name || '').toLowerCase().includes(q) ||
      (v.brand || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.plateNumber || '').toLowerCase().includes(q)
    );
  });

  readonly pageSize = 10;
  pageIndex = signal(0);
  pagedVehicles = computed(() => {
    const list = this.filteredVehicles();
    const start = this.pageIndex() * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    brand: ['', [Validators.required]],
    model: ['', [Validators.required]],
    plateNumber: ['', [Validators.required]],
  });

  // inline edit state
  editingId = signal<number | null>(null);
  editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    brand: ['', [Validators.required]],
    model: ['', [Validators.required]],
    plateNumber: ['', [Validators.required]],
  });
  savingEdit = signal(false);

  ngOnInit() { this.loadVehicles(); }

  private loadVehicles() {
    this.loading.set(true);
    this.error.set(null);
    this.vehicleService.getAll().subscribe({
      next: list => { this.vehicles.set(list ?? []); this.pageIndex.set(0); this.loading.set(false); },
      error: () => { this.error.set('Nepodarilo sa načítať vozidlá.'); this.loading.set(false); }
    });
  }

  onSearch(term: string) { this.searchTerm.set(term); this.pageIndex.set(0); }

  private hasDuplicatePlate(plate: string, excludeId?: number) {
    const p = (plate || '').trim().toLowerCase();
    return this.vehicles().some(v => (excludeId ? v.id !== excludeId : true) && (v.plateNumber || '').trim().toLowerCase() === p);
  }

  submit() {
    if (this.form.invalid || this.creating()) return;
    const payload: VehicleDTO = this.form.getRawValue();
    if (this.hasDuplicatePlate(payload.plateNumber)) {
      this.form.controls.plateNumber.setErrors({ duplicate: true });
      return;
    }
    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);

    this.vehicleService.create(payload).subscribe({
      next: (created) => {
        this.success.set('Vozidlo bolo vytvorené.');
        this.vehicles.set([created, ...this.vehicles()]);
        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.creating.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Vytvorenie vozidla zlyhalo.';
        this.error.set(msg);
        this.creating.set(false);
      }
    });
  }

  startEdit(v: VehicleDTO) {
    if (!v.id) return;
    this.editingId.set(v.id);
    this.editForm.reset({
      name: v.name || '',
      brand: v.brand || '',
      model: v.model || '',
      plateNumber: v.plateNumber || '',
    });
  }

  cancelEdit() { this.editingId.set(null); this.editForm.reset(); }

  saveEdit(v: VehicleDTO) {
    if (!v.id || this.editForm.invalid || this.savingEdit()) return;
    const payload: VehicleDTO = this.editForm.getRawValue();
    if (this.hasDuplicatePlate(payload.plateNumber, v.id)) {
      this.editForm.controls.plateNumber.setErrors({ duplicate: true });
      return;
    }
    this.savingEdit.set(true);
    this.error.set(null);
    this.success.set(null);

    this.vehicleService.update(v.id, payload).subscribe({
      next: (updated) => {
        this.vehicles.update(list => list.map(it => it.id === v.id ? { ...it, ...updated } : it));
        this.success.set('Vozidlo bolo upravené.');
        this.savingEdit.set(false);
        this.cancelEdit();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Úprava vozidla zlyhala.';
        this.error.set(msg);
        this.savingEdit.set(false);
      }
    });
  }

  delete(v: VehicleDTO) {
    if (!v.id) return;
    const ok = confirm(`Naozaj chcete odstrániť vozidlo "${v.name}"?`);
    if (!ok) return;
    this.error.set(null);
    this.success.set(null);

    this.vehicleService.delete(v.id).subscribe({
      next: () => {
        this.vehicles.update(list => list.filter(it => it.id !== v.id));
        const after = this.filteredVehicles().length;
        const lastPageIndex = Math.max(0, Math.ceil(after / this.pageSize) - 1);
        if (this.pageIndex() > lastPageIndex) this.pageIndex.set(lastPageIndex);
        this.success.set('Vozidlo bolo odstránené.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Odstránenie vozidla zlyhalo.';
        this.error.set(msg);
      }
    });
  }

  onPage(e: PageEvent) { this.pageIndex.set(e.pageIndex); }
}

