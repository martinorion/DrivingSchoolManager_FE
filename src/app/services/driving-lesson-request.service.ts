import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DrivingLessonRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DrivingLessonRequestDTO {
  id?: number;
  organizationId?: number;
  instructorId: number;
  start: string; // naive local ISO e.g. 2025-11-30T10:00:00
  end: string;
  status?: DrivingLessonRequestStatus;
  note?: string;
  instructorFullName?: string;
}

@Injectable({ providedIn: 'root' })
export class DrivingLessonRequestService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/api/lessonRequests';

  // Student: list own
  studentsRequests(): Observable<DrivingLessonRequestDTO[]> {
    return this.http.get<DrivingLessonRequestDTO[]>(`${this.base}/students`);
  }

  // Instructor: list incoming
  instructorIncoming(): Observable<DrivingLessonRequestDTO[]> {
    return this.http.get<DrivingLessonRequestDTO[]>(`${this.base}/instructorIncoming`);
  }

  // Student: create request
  createRequest(payload: DrivingLessonRequestDTO): Observable<DrivingLessonRequestDTO> {
    return this.http.post<DrivingLessonRequestDTO>(`${this.base}/createRequest`, payload);
  }

  // Instructor: approve
  approve(id: number): Observable<DrivingLessonRequestDTO> {
    return this.http.post<DrivingLessonRequestDTO>(`${this.base}/${id}/approve`, {});
  }

  // Instructor: reject
  reject(id: number): Observable<DrivingLessonRequestDTO> {
    return this.http.post<DrivingLessonRequestDTO>(`${this.base}/${id}/reject`, {});
  }
}

