import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VehicleReservationDTO {
  id?: number;
  vehicleId: number;
  instructorId?: number;
  start: string; // ISO-like LocalDateTime string, e.g. 2025-11-29T10:30
  end: string;
}

@Injectable({ providedIn: 'root' })
export class VehicleReservationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/vehicleReservation';

  create(dto: VehicleReservationDTO): Observable<VehicleReservationDTO> {
    return this.http.post<VehicleReservationDTO>(`${this.baseUrl}/createReservation`, dto);
    }

  list(): Observable<VehicleReservationDTO[]> {
    return this.http.get<VehicleReservationDTO[]>(`${this.baseUrl}/getReservations`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
