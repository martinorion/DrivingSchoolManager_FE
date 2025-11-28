import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WaitingRoomDTO {
  id?: number;
  organizationId?: number;
  studentId?: number;
}

export interface UserDTO {
  id: number;
  firstName?: string;
  surname?: string;
  username?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class WaitingRoomService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/waitingRoom';

  saveToWaitingRoom(dto: WaitingRoomDTO): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/saveToWaitingRoom`, dto);
  }

  addMembersToOrganization(dto: WaitingRoomDTO): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/addMembersToOrganization`, dto);
  }

  getUsersWaitingRoom(): Observable<WaitingRoomDTO | null> {
    return this.http.get<WaitingRoomDTO>(`${this.baseUrl}/getUsersWaitingRoom`);
  }

  deleteStudentRequest(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteStudentRequest`);
  }

  removeFromWaitingRoom(student: UserDTO): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/deleteStudentRequestById/${student.id}`);
  }

  getAllStudentsInWaitingRoom(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getAllStudentsInWaitingRoom`);
  }
}
