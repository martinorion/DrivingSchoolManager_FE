import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDTO } from './organization.service';

export interface GroupDTO {
  id?: number;
  organizationId?: number;
  name: string;
  description?: string;
  // Optional fields if backend returns creator info
  createdByInstructorId?: number;
  createdByInstructorUsername?: string;
  createdByInstructorFirstName?: string;
  createdByInstructorSurname?: string;
  // Optional members array if backend includes it in get(id)
  members?: GroupMemberDTO[];
}

export interface GroupMemberDTO {
  id?: number;
  groupId: number;
  studentId: number;
  // Optional student info if backend returns it
  studentUsername?: string;
  studentFirstName?: string;
  studentSurname?: string;
}

// Minimal Page interface matching Spring Data's Page
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page index (0-based)
}

// Group announcement shape aligned with backend
export interface GroupAnnouncementDTO {
  id?: number;
  groupId: number;
  title: string;
  message: string;
  createdAt?: string;
  updatedAt?: string;
  authorId?: number;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/group';

  getAllGroups(): Observable<GroupDTO[]> {
    return this.http.get<GroupDTO[]>(`${this.baseUrl}/getAllGroups`);
  }

  // Return current student's groups
  getStudentGroups(): Observable<GroupDTO[]> {
    return this.http.get<GroupDTO[]>(`${this.baseUrl}/studentGroups`);
  }

  // Return current instructor's groups
  getInstructorGroups(): Observable<GroupDTO[]> {
    return this.http.get<GroupDTO[]>(`${this.baseUrl}/instructorGroups`);
  }

  createGroup(dto: GroupDTO): Observable<GroupDTO> {
    return this.http.post<GroupDTO>(`${this.baseUrl}/createGroup`, dto);
  }

  getGroup(id: number): Observable<GroupDTO> {
    return this.http.get<GroupDTO>(`${this.baseUrl}/${id}`);
  }

  getGroupMembers(groupId: number): Observable<UserDTO[]> {
    return this.http.get<UserDTO[]>(`${this.baseUrl}/getGroupMembers/${groupId}`);
  }

  // Announcements
  createAnnouncement(dto: GroupAnnouncementDTO): Observable<GroupAnnouncementDTO> {
    return this.http.post<GroupAnnouncementDTO>(`${this.baseUrl}/announcements`, dto);
  }

  getAnnouncements(groupId: number, page = 0, size = 10): Observable<Page<GroupAnnouncementDTO>> {
    return this.http.get<Page<GroupAnnouncementDTO>>(`${this.baseUrl}/announcements/${groupId}`, { params: { page, size } as any });
  }

  updateGroup(id: number, dto: GroupDTO): Observable<GroupDTO> {
    return this.http.put<GroupDTO>(`${this.baseUrl}/${id}`, dto);
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addMember(dto: GroupMemberDTO): Observable<GroupMemberDTO> {
    return this.http.post<GroupMemberDTO>(`${this.baseUrl}/addMember`, dto);
  }
}
