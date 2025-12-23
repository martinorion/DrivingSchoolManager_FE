import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { OrganizationService, UserDTO } from '../services/organization.service';
import { AuthService, StudentStatusDTO } from '../services/auth.service';

@Component({
  selector: 'app-lesson-counts-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <h2 mat-dialog-title>Nastaviť minúty pre študenta</h2>
  <div mat-dialog-content>
    <p><strong>Študent:</strong> {{ data?.firstName || '' }} {{ data?.surname || '' }} ({{ data?.email || data?.username }})</p>
    <form [formGroup]="form" class="form">
      <div class="row">
        <mat-form-field appearance="outline">
          <mat-label>Teória (min)</mat-label>
          <input matInput type="number" formControlName="theoryLessonsCount" min="1" />
          @if (form.controls.theoryLessonsCount.invalid && (form.controls.theoryLessonsCount.touched || form.controls.theoryLessonsCount.dirty)) { <mat-error>Povinné kladné celé číslo</mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Jazdy (min)</mat-label>
          <input matInput type="number" formControlName="drivingLessonsCount" min="1" />
          @if (form.controls.drivingLessonsCount.invalid && (form.controls.drivingLessonsCount.touched || form.controls.drivingLessonsCount.dirty)) { <mat-error>Povinné kladné celé číslo</mat-error> }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Simulácie (min)</mat-label>
          <input matInput type="number" formControlName="drivingSimulationsCount" min="1" />
          @if (form.controls.drivingSimulationsCount.invalid && (form.controls.drivingSimulationsCount.touched || form.controls.drivingSimulationsCount.dirty)) { <mat-error>Povinné kladné celé číslo</mat-error> }
        </mat-form-field>
      </div>
    </form>
  </div>
  <div mat-dialog-actions>
    <button mat-stroked-button type="button" (click)="close()">Zrušiť</button>
    <button mat-flat-button color="primary" type="button" (click)="save()" [disabled]="form.invalid">Uložiť</button>
  </div>
  `,
  styles: [`
    .row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    @media (max-width: 720px) { .row { grid-template-columns: 1fr; } }
  `]
})
export class LessonCountsDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<LessonCountsDialogComponent>);
  private orgService = inject(OrganizationService);
  private authService = inject(AuthService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: UserDTO | null) {}

  form = this.fb.group({
    theoryLessonsCount: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    drivingLessonsCount: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
    drivingSimulationsCount: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]]
  });

  ngOnInit() {
    // Prefill from backend for the selected student
    const id = this.data?.id;
    if (id) {
      this.authService.getStudentStatusById(Number(id)).subscribe({
        next: (dto: StudentStatusDTO) => {
          this.form.patchValue({
            theoryLessonsCount: dto?.theoryLessonsCount ?? null,
            drivingLessonsCount: dto?.drivingLessonsCount ?? null,
            drivingSimulationsCount: dto?.drivingSimulationsCount ?? null,
          });
        },
        error: () => {}
      });
    }
  }

  close() { this.dialogRef.close(); }

  save() {
    if (this.form.invalid || !this.data || !this.data.id) return;
    const { theoryLessonsCount, drivingLessonsCount, drivingSimulationsCount } = this.form.getRawValue();
    this.orgService.setStudentLessonCounts(Number(drivingLessonsCount), Number(drivingSimulationsCount), Number(theoryLessonsCount), Number(this.data.id))
      .subscribe({
        next: () => this.dialogRef.close({ success: true }),
        error: () => this.dialogRef.close({ success: false })
      });
  }
}
