import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InstructorRequestDTO {
  id?: number;
  instructorId?: number;
  organizationId?: number;
}

@Injectable({ providedIn: 'root' })
export class InstructorRequestService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/instructorRequest';

  getAllRequests(): Observable<InstructorRequestDTO[]> {
    return this.http.get<InstructorRequestDTO[]>(`${this.baseUrl}/getAllRequests`);
  }

  sendInstructorRequest(organizationId: number): Observable<void> {
    const body: InstructorRequestDTO = { organizationId };
    return this.http.post<void>(`${this.baseUrl}/sendInstructorRequest`, body);
  }

  addInstructorToOrganization(instructorId: number, organizationId: number): Observable<void> {
    const body: InstructorRequestDTO = { instructorId, organizationId };
    return this.http.post<void>(`${this.baseUrl}/addInstructorToOrganization`, body);
  }

  getInstructorRequest(): Observable<InstructorRequestDTO> {
    return this.http.get<InstructorRequestDTO>(`${this.baseUrl}/getInstructorRequest`);
  }

  // Delete the current instructor's own request
  deleteInstructorRequest(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteInstructorRequest`);
  }

  // Delete a request by its ID (for instructors managing their org)
  deleteInstructorRequestById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteInstructorRequestById/${id}`);
  }
}
