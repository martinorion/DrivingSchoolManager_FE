import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface Organization {
  id: number;
  name: string;
  isAccepted?: boolean; // new flag from backend
  ownerId?: number; // owner user id for ownership checks
  imageBase64Data?: string | null;
  contentType?: string | null; // optional if backand send that
  imageUrl?: string | null; // convience for rendering
}

export interface CreateOrganizationRequest {
  name: string;
}

export interface UserDTO {
  id: number;
  firstName?: string;
  surname?: string;
  username?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/organization';

  getAllOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.baseUrl}/allOrganization`, { params: { includeImage: true as any } }).pipe(
      map(list => list.map(org => {
        const ct = org.contentType || 'image/jpeg';
        const img = org.imageBase64Data || null;
        return {
          ...org,
          imageUrl: img ? `data:${ct};base64,${img}` : null
        } as Organization;
      }))
    );
  }

  // Multipart create with required image file
  createOrganizationWithImage(dto: CreateOrganizationRequest, file: File): Observable<void> {
    const formData = new FormData();
    // Send dto as JSON blob under key "dto" to match backend
    formData.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    formData.append('file', file);
    return this.http.post<void>(`${this.baseUrl}/createOrganization`, formData);
  }

  getCurrentOrganization(): Observable<Organization | null> {
    return this.http.get<Organization>(`${this.baseUrl}/getCurrentOrganization`).pipe(
      map(org => {
        if (!org) return null as any;
        const ct = org.contentType || 'image/jpeg';
        const img = org.imageBase64Data || null;
        return { ...org, imageUrl: img ? `data:${ct};base64,${img}` : null } as Organization;
      }),
      catchError(() => of(null))
    );
  }

  getOrganizationInstructors(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getOrganizationInstructors`);
  }

  getOrganizationInstructorsForStudent(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getOrganizationInstructorsForStudent`);
  }

  // Returns all accepted students in the current user's organization
  getAllAcceptedStudents(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getAllAcceptedStudents`);
  }

  // Deprecated helper; prefer getCurrentOrganization
  checkHasOrganization(): Observable<boolean> {
    return this.getCurrentOrganization().pipe(map(org => !!org), catchError(() => of(false)));
  }

  // Multipart update with optional image; dto should include at least id and name
  updateOrganizationWithOptionalImage(dto: Partial<Organization>, file?: File | null): Observable<void> {
    const formData = new FormData();
    formData.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    return this.http.post<void>(`${this.baseUrl}/update`, formData);
  }

  // --- Admin-only endpoints ---
  // List organizations awaiting acceptance
  getAllUnacceptedOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`${this.baseUrl}/getAllUnacceptedOrganizations`).pipe(
      map(list => list.map(org => {
        const ct = org.contentType || 'image/jpeg';
        const img = org.imageBase64Data || null;
        return { ...org, imageUrl: img ? `data:${ct};base64,${img}` : null } as Organization;
      }))
    );
  }

  // Accept an organization by id
  acceptOrganization(organizationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/acceptOrganization/${organizationId}`, {});
  }

  // Delete an organization by id
  deleteOrganizationAsAdmin(organizationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteOrganization/${organizationId}`);
  }

  // Delete my organization (as instructor/owner)
  deleteMyOrganization(organizationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteMyOrganization/${organizationId}`);
  }
}
