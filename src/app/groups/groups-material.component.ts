import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { OrganizationService, UserDTO } from '../services/organization.service';
import { GroupDTO, GroupMemberDTO, GroupService } from '../services/group.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatExpansionModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './groups-material.component.html',
  styleUrl: './groups-material.component.css'
})
export class GroupsMaterialComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly orgService = inject(OrganizationService);
  private readonly fb = inject(FormBuilder);

  groups = signal<GroupDTO[]>([]);
  loadingGroups = signal(false);
  creating = signal(false);
  savingEdit = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Students for adding to group
  students = signal<UserDTO[]>([]);
  loadingStudents = signal(false);

  // Search
  searchTerm = signal('');
  filteredGroups = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (!q) return this.groups();
    return this.groups().filter(g => (g.name || '').toLowerCase().includes(q) || (g.description || '').toLowerCase().includes(q));
  });

  // Pagination (simple client-side)
  readonly pageSize = 5;
  pageIndex = signal(0);
  pagedGroups = computed(() => {
    const list = this.filteredGroups();
    const start = this.pageIndex() * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  // Create form
  createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    description: ['']
  });

  // Edit form
  editingId = signal<number | null>(null);
  editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    description: ['']
  });

  // Add member form
  expandedGroupId = signal<number | null>(null);
  addMemberForm = this.fb.nonNullable.group({
    studentId: [null as number | null, [Validators.required]]
  });
  addingMember = signal(false);

  ngOnInit() {
    this.loadGroups();
    this.loadStudents();
  }

  private loadGroups() {
    this.loadingGroups.set(true);
    this.error.set(null);
    this.groupService.getAllGroups().subscribe({
      next: list => {
        this.groups.set(list || []);
        this.pageIndex.set(0);
        this.loadingGroups.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Nepodarilo sa načítať skupiny.');
        this.loadingGroups.set(false);
      }
    });
  }

  private loadStudents() {
    this.loadingStudents.set(true);
    this.orgService.getAllAcceptedStudents().subscribe({
      next: list => { this.students.set(list || []); this.loadingStudents.set(false); },
      error: () => { this.loadingStudents.set(false); }
    });
  }

  onSearch(term: string) { this.searchTerm.set(term); this.pageIndex.set(0); }

  onPage(e: PageEvent) { this.pageIndex.set(e.pageIndex); }

  submitCreate() {
    if (this.createForm.invalid || this.creating()) return;
    const payload: GroupDTO = this.createForm.getRawValue();
    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);
    this.groupService.createGroup(payload).subscribe({
      next: created => {
        this.success.set('Skupina bola vytvorená.');
        this.groups.set([created, ...this.groups()]);
        this.createForm.reset();
        this.creating.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Vytvorenie skupiny zlyhalo.');
        this.creating.set(false);
      }
    });
  }

  startEdit(g: GroupDTO) {
    if (!g.id) return;
    this.editingId.set(g.id);
    this.editForm.reset({
      name: g.name || '',
      description: g.description || ''
    });
  }

  cancelEdit() { this.editingId.set(null); this.editForm.reset(); }

  saveEdit(g: GroupDTO) {
    const id = g.id; if (!id || this.editForm.invalid || this.savingEdit()) return;
    this.savingEdit.set(true);
    this.error.set(null); this.success.set(null);
    const payload: GroupDTO = { ...g, ...this.editForm.getRawValue() };
    this.groupService.updateGroup(id, payload).subscribe({
      next: updated => {
        this.groups.update(list => list.map(it => it.id === id ? { ...it, ...updated } : it));
        this.success.set('Skupina bola upravená.');
        this.savingEdit.set(false);
        this.cancelEdit();
      },
      error: err => {
        this.error.set(err?.error?.message || 'Úprava skupiny zlyhala.');
        this.savingEdit.set(false);
      }
    });
  }

  deleteGroup(g: GroupDTO) {
    if (!g.id) return;
    const ok = confirm(`Naozaj chcete odstrániť skupinu "${g.name}"?`);
    if (!ok) return;
    this.error.set(null); this.success.set(null);
    this.groupService.deleteGroup(g.id).subscribe({
      next: () => {
        this.groups.update(list => list.filter(it => it.id !== g.id));
        const after = this.filteredGroups().length;
        const lastPage = Math.max(0, Math.ceil(after / this.pageSize) - 1);
        if (this.pageIndex() > lastPage) this.pageIndex.set(lastPage);
        this.success.set('Skupina bola odstránená.');
      },
      error: err => {
        this.error.set(err?.error?.message || 'Odstránenie skupiny zlyhalo.');
      }
    });
  }

  toggleExpand(g: GroupDTO) {
    if (!g.id) return;
    this.expandedGroupId.set(this.expandedGroupId() === g.id ? null : g.id);
    this.addMemberForm.reset();
    // Load members from dedicated endpoint when expanding
    if (this.expandedGroupId() === g.id) {
      this.groupService.getGroupMembers(g.id).subscribe({
        next: users => {
          // Map returned UserDTO[] to GroupMemberDTO[] so the template can display student info
          const members = (users || []).map(u => ({
            id: undefined,
            groupId: g.id as number,
            studentId: u.id as number,
            studentUsername: u.username || u.email || '',
            studentFirstName: u.firstName || '',
            studentSurname: u.surname || ''
          }));
          this.groups.update(list => list.map(it => it.id === g.id ? { ...it, members } : it));
        },
        error: () => {
          // leave existing members as-is on error
        }
      });
    }
  }

  isExpanded(g: GroupDTO) { return this.expandedGroupId() === g.id; }

  submitAddMember(g: GroupDTO) {
    const id = g.id; if (!id || this.addMemberForm.invalid || this.addingMember()) return;
    const studentId = this.addMemberForm.value.studentId as number;
    const payload: GroupMemberDTO = { groupId: id, studentId };
    this.addingMember.set(true);
    this.error.set(null); this.success.set(null);
    this.groupService.addMember(payload).subscribe({
      next: created => {
        // Find student details from local students cache to enrich the returned GroupMemberDTO
        const student = this.students().find(s => s.id === studentId);
        const enriched: GroupMemberDTO = {
          ...created,
          groupId: id,
          studentId,
          studentUsername: student?.username || student?.email || '',
          studentFirstName: student?.firstName || '',
          studentSurname: student?.surname || ''
        };
        // Update local members list if present
        this.groups.update(list => list.map(it => {
          if (it.id === id) {
            const members = [...(it.members || []), enriched];
            return { ...it, members };
          }
          return it;
        }));
        this.success.set('Študent bol pridaný do skupiny.');
        this.addMemberForm.reset();
        this.addingMember.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message || 'Pridanie študenta zlyhalo.');
        this.addingMember.set(false);
      }
    });
  }
}
