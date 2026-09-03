import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RegisterSession {
  id: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  opening_float: number;
  expected_cash: number | null;
  actual_cash: number | null;
  difference: number | null;
}

export interface RegisterCurrentResponse {
  session: RegisterSession;
  sales: {
    total_orders: number;
    cash_sales: number;
    credit_sales: number;
    other_sales: number;
    calculated_expected_cash: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RegisterApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.MEDUSA_BACKEND_URL || 'http://localhost:9000';

  openRegister(opening_float: number): Observable<{ session: RegisterSession }> {
    return this.http.post<{ session: RegisterSession }>(`${this.baseUrl}/admin/pos/register/open`, { opening_float });
  }

  getCurrentRegister(): Observable<RegisterCurrentResponse> {
    return this.http.get<RegisterCurrentResponse>(`${this.baseUrl}/admin/pos/register/current`);
  }

  closeRegister(actual_cash: number): Observable<{ session: RegisterSession }> {
    return this.http.post<{ session: RegisterSession }>(`${this.baseUrl}/admin/pos/register/close`, { actual_cash });
  }
}
