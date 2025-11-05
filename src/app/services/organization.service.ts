import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Organization {
  id: number;
  name: string;
}

export interface CreateOrganizationRequest {
  name: string;
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

}


