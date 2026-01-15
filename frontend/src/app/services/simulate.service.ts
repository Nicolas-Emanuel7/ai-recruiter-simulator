import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimulateRequest, SimulateResponse } from '../models/simulate.models';

@Injectable({
  providedIn: 'root',
})
export class SimulateService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  simulate(request: SimulateRequest): Observable<SimulateResponse> {
    return this.http.post<SimulateResponse>(`${this.apiUrl}/simulate`, request);
  }

  simulateWithPdf(
    file: File,
    jobTitle: string,
    jobDescription: string | undefined,
    experienceLevel: 'Júnior' | 'Pleno' | 'Sênior',
    language: 'pt-br' | 'en' = 'pt-br'
  ): Observable<SimulateResponse> {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobTitle', jobTitle);
    if (jobDescription) {
      formData.append('jobDescription', jobDescription);
    }
    formData.append('experienceLevel', experienceLevel);
    formData.append('language', language);

    return this.http.post<SimulateResponse>(
      `${this.apiUrl}/simulate/upload`,
      formData
    );
  }
}
