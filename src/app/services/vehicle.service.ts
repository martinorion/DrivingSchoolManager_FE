import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VehicleDTO {
  id?: number;
  organizationId?: number; // informational
  name: string;
  brand: string;
  model: string;
  plateNumber: string;
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/vehicle';

  getAll(): Observable<VehicleDTO[]> {
    return this.http.get<VehicleDTO[]>(`${this.baseUrl}/getAllVehicles`);
  }

  create(dto: VehicleDTO): Observable<VehicleDTO> {
    return this.http.post<VehicleDTO>(`${this.baseUrl}/createVehicle`, dto);
  }

  update(id: number, dto: VehicleDTO): Observable<VehicleDTO> {
    return this.http.put<VehicleDTO>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

