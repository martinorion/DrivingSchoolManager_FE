import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { OrganizationService, Organization } from '../services/organization.service';
import { AdminUsersService, UserSummary } from './admin-users.service';
// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-admin-portal',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule
  ],
  templateUrl: './admin-portal.component.html',
  styleUrl: './admin-portal.component.css'
})
export class AdminPortalComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly org = inject(OrganizationService);
  private readonly users = inject(AdminUsersService);

  isAdmin = computed(() => this.auth.hasRole('ADMINISTRATOR'));

  // Organizations (unaccepted)
  unaccepted = signal<Organization[]>([]);
  orgLoading = signal(false);
  orgError = signal<string | null>(null);
  unacceptedQuery = signal('');
  readonly pageSize = 5;
  unacceptedPageIndex = signal(0);
  filteredUnaccepted = computed(() => {
    const q = this.unacceptedQuery().toLowerCase().trim();
    const list = this.unaccepted();
    return q ? list.filter(o => o.name.toLowerCase().includes(q)) : list;
  });
  pagedUnaccepted = computed(() => {
    const start = this.unacceptedPageIndex() * this.pageSize;
    return this.filteredUnaccepted().slice(start, start + this.pageSize);
  });

  // Approved organizations
  approved = signal<Organization[]>([]);
  approvedLoading = signal(false);
  approvedError = signal<string | null>(null);
  approvedQuery = signal('');
  approvedPageIndex = signal(0);
  filteredApproved = computed(() => {
    const q = this.approvedQuery().toLowerCase().trim();
    const list = this.approved();
    return q ? list.filter(o => o.name.toLowerCase().includes(q)) : list;
  });
  pagedApproved = computed(() => {
    const start = this.approvedPageIndex() * this.pageSize;
    return this.filteredApproved().slice(start, start + this.pageSize);
  });

  // Users
  allUsers = signal<UserSummary[]>([]);
  usersLoading = signal(false);
  usersError = signal<string | null>(null);
  usersQuery = signal('');
  usersPageIndex = signal(0);
  filteredUsers = computed(() => {
    const q = this.usersQuery().toLowerCase().trim();
    const list = this.allUsers();
    return q ? list.filter(u => `${u.firstName ?? ''} ${u.surname ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q)) : list;
  });
  pagedUsers = computed(() => {
    const start = this.usersPageIndex() * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  ngOnInit() {
    if (!this.isAdmin()) {
      this.orgError.set('Nemáte oprávnenie na prístup do Admin portálu.');
      return;
    }
    this.loadUnaccepted();
    this.loadApproved();
    this.loadUsers();
  }

  loadUnaccepted() {
    this.orgLoading.set(true);
    this.orgError.set(null);
    this.org.getAllUnacceptedOrganizations().subscribe({
      next: list => { this.unaccepted.set(list); this.unacceptedPageIndex.set(0); this.orgLoading.set(false); },
      error: () => { this.orgError.set('Nepodarilo sa načítať organizácie.'); this.orgLoading.set(false); }
    });
  }

  loadApproved() {
    this.approvedLoading.set(true);
    this.approvedError.set(null);
    this.org.getAllOrganizations().subscribe({
      next: (list: Organization[]) => { this.approved.set(list); this.approvedPageIndex.set(0); this.approvedLoading.set(false); },
      error: () => { this.approvedError.set('Nepodarilo sa načítať schválené organizácie.'); this.approvedLoading.set(false); }
    });
  }

  acceptOrg(id: number) {
    this.org.acceptOrganization(id).subscribe({
      next: () => { this.loadUnaccepted(); this.loadApproved(); },
      error: () => this.orgError.set('Nepodarilo sa schváliť organizáciu.')
    });
  }

  deleteOrg(id: number) {
    if (!confirm('Naozaj chcete zmazať organizáciu?')) return;
    this.org.deleteOrganizationAsAdmin(id).subscribe({
      next: () => { this.loadUnaccepted(); this.loadApproved(); },
      error: () => this.orgError.set('Nepodarilo sa zmazať organizáciu.')
    });
  }

  loadUsers() {
    this.usersLoading.set(true);
    this.usersError.set(null);
    this.users.getAllUsers().subscribe({
      next: (list: UserSummary[]) => { this.allUsers.set(list); this.usersPageIndex.set(0); this.usersLoading.set(false); },
      error: () => { this.usersError.set('Nepodarilo sa načítať používateľov.'); this.usersLoading.set(false); }
    });
  }

  // Pagination handlers
  onUnacceptedPage(e: PageEvent) { this.unacceptedPageIndex.set(e.pageIndex); }
  onApprovedPage(e: PageEvent) { this.approvedPageIndex.set(e.pageIndex); }
  onUsersPage(e: PageEvent) { this.usersPageIndex.set(e.pageIndex); }

  // Input handlers for search fields
  onUnacceptedQueryInput(event: Event) {
    const value = (event.target as HTMLInputElement).value || '';
    this.unacceptedQuery.set(value);
    this.unacceptedPageIndex.set(0);
  }

  onApprovedQueryInput(event: Event) {
    const value = (event.target as HTMLInputElement).value || '';
    this.approvedQuery.set(value);
    this.approvedPageIndex.set(0);
  }

  onUsersQueryInput(event: Event) {
    const value = (event.target as HTMLInputElement).value || '';
    this.usersQuery.set(value);
    this.usersPageIndex.set(0);
  }

  deleteUser(id: number) {
    if (!confirm('Naozaj chcete zmazať používateľa?')) return;
    this.users.deleteUserById(id).subscribe({
      next: (_: void) => this.loadUsers(),
      error: () => this.usersError.set('Nepodarilo sa zmazať používateľa.')
    });
  }
}
