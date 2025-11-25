import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

export interface Organization {
  id: number;
  name: string;
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
    return this.http.get<Organization[]>(`${this.baseUrl}/allOrganization`);
  }

  createOrganization(body: CreateOrganizationRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/createOrganization`, body);
  }

  // Fetch current user's organization (null if none)
  getCurrentOrganization(): Observable<Organization | null> {
    return this.http.get<Organization>(`${this.baseUrl}/getCurrentOrganization`).pipe(
      catchError(() => of(null))
    );
  }

  // Returns instructor-request in the current user's organization (backend derives org from authenticated user)
  getOrganizationInstructors(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getOrganizationInstructors`);
  }

  // Returns all accepted students in the current user's organization
  getAllAcceptedStudents(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getAllAcceptedStudents`);
  }

  // Deprecated helper; prefer getCurrentOrganization
  checkHasOrganization(): Observable<boolean> {
    return this.getCurrentOrganization().pipe(map(org => !!org), catchError(() => of(false)));
  }
}
