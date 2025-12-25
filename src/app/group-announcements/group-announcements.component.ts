import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GroupDTO, GroupService, GroupAnnouncementDTO, Page } from '../services/group.service';

@Component({
  selector: 'app-group-announcements',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './group-announcements.component.html',
  styleUrl: './group-announcements.component.css'
})
export class GroupAnnouncementsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly auth = inject(AuthService);

  isInstructor = this.auth.hasRole('INSTRUCTOR');

  groups = signal<GroupDTO[]>([]);
  loadingGroups = signal(false);
  selectedGroupId = signal<number | null>(null);

  // Announcements
  announcements = signal<GroupAnnouncementDTO[]>([]);
  totalAnnouncements = signal(0);
  pageIndex = signal(0);
  pageSize = 5;
  loadingAnnouncements = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  announceForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    message: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]]
  });
  creating = signal(false);

  selectedGroupName = computed(() => {
    const gid = this.selectedGroupId();
    if (!gid) return '';
    const g = this.groups().find(it => it.id === gid);
    return g?.name || '';
  });

  ngOnInit() {
    this.loadGroups();
  }

  private loadGroups() {
    this.loadingGroups.set(true);
    const src$ = this.isInstructor ? this.groupService.getInstructorGroups() : this.groupService.getStudentGroups();
    src$.subscribe({
      next: list => { this.groups.set(list || []); this.loadingGroups.set(false); },
      error: err => { this.error.set(err?.error?.message || 'Nepodarilo sa načítať skupiny.'); this.loadingGroups.set(false); }
    });
  }

  selectGroup(id: number) {
    this.selectedGroupId.set(id);
    this.pageIndex.set(0);
    this.loadAnnouncements();
  }

  onPage(e: PageEvent) {
    this.pageIndex.set(e.pageIndex);
    this.loadAnnouncements();
  }

  private loadAnnouncements() {
    const gid = this.selectedGroupId();
    if (!gid) return;
    this.loadingAnnouncements.set(true);
    this.groupService.getAnnouncements(gid, this.pageIndex(), this.pageSize).subscribe({
      next: (page: Page<GroupAnnouncementDTO>) => {
        this.announcements.set(page.content || []);
        this.totalAnnouncements.set(page.totalElements || 0);
        this.loadingAnnouncements.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Nepodarilo sa načítať oznámenia.');
        this.loadingAnnouncements.set(false);
      }
    });
  }

  canPost(): boolean {
    return this.isInstructor && !!this.selectedGroupId();
  }

  submitAnnouncement() {
    if (!this.canPost() || this.announceForm.invalid || this.creating()) return;
    const gid = this.selectedGroupId()!;
    const { title, message } = this.announceForm.getRawValue();
    const payload: GroupAnnouncementDTO = { groupId: gid, title: (title || '')?.trim(), message: message.trim() };
    this.creating.set(true);
    this.error.set(null); this.success.set(null);
    this.groupService.createAnnouncement(payload).subscribe({
      next: created => {
        this.announcements.set([created, ...this.announcements()]);
        this.totalAnnouncements.set(this.totalAnnouncements() + 1);
        this.success.set('Oznámenie bolo pridané.');
        this.announceForm.reset();
        this.creating.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Vytvorenie oznámenia zlyhalo.');
        this.creating.set(false);
      }
    });
  }
}
