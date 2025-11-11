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

  removeFromWaitingRoom(dto: WaitingRoomDTO): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/removeFromWaitingRoom`, dto);
  }

  getUsersWaitingRoom(): Observable<WaitingRoomDTO[]> {
    return this.http.get<WaitingRoomDTO[]>(`${this.baseUrl}/getUsersWaitingRoom`);
  }

  getAllStudentsInWaitingRoom(): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getAllStudentsInWaitingRoom`);
  }
}


