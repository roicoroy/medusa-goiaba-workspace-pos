import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseHttpService } from './base-http.service';

/**
 * MedusaService
 * 
 * Handles all Medusa API interactions.
 * 
 * NOTE: Headers (publishable key, auth token, content-type) are automatically
 * added by MedusaInterceptor. Global error handling is done by ErrorInterceptor.
 * This service focuses on Medusa-specific business logic.
 */
@Injectable({
  providedIn: 'root'
})
export class MedusaService extends BaseHttpService {
  protected baseUrl = environment.MEDUSA_API_BASE_PATH;

  cartsCreate(region_id: string, currency_code: string = 'usd'): Observable<any> {
    const data = { region_id, currency_code };
    return this.post<any>(`/store/carts`, data);
  }

  retrieveCart(cartId: string): Observable<any> {
    return this.get<any>(`/store/carts/${cartId}?fields=*items,*items.variant`);
  }

  addCartLineItem(cartId: string, variant_id: string, quantity: number): Observable<any> {
    const data = { variant_id, quantity };
    return this.post<any>(`/store/carts/${cartId}/line-items`, data);
  }

  updateCartLineItem(cartId: string, lineId: string, quantity: number): Observable<any> {
    const data = { quantity };
    return this.post<any>(`/store/carts/${cartId}/line-items/${lineId}`, data);
  }

  deleteCartLineItem(cartId: string, lineId: string): Observable<any> {
    return this.delete<any>(`/store/carts/${cartId}/line-items/${lineId}`);
  }

  regionsList(): Observable<any> {
    return this.get<any>('/store/regions');
  }

  // POS Promotions & Discounts
  applyPromotions(cartId: string, promoCodes: string[]): Observable<any> {
    return this.post<any>(`/store/carts/${cartId}/promotions`, { promo_codes: promoCodes });
  }

  removePromotions(cartId: string, promoCodes: string[]): Observable<any> {
    return this.delete<any>(`/store/carts/${cartId}/promotions`, { promo_codes: promoCodes });
  }

  // POS Shift Management
  listRegisters(): Observable<any> {
    return this.get<any>('/store/pos/registers');
  }

  createRegister(name: string): Observable<any> {
    return this.post<any>('/store/pos/registers', { name });
  }

  updateRegister(id: string, name: string): Observable<any> {
    return this.post<any>(`/store/pos/registers/${id}`, { name });
  }

  deleteRegister(id: string): Observable<any> {
    return this.delete<any>(`/store/pos/registers/${id}`);
  }

  openShift(cash_register_id: string, opening_float: number): Observable<any> {
    return this.post<any>('/store/pos/sessions', { cash_register_id, opening_float });
  }

  closeShift(session_id: string, cash_register_id: string, closing_cash: number): Observable<any> {
    return this.post<any>(`/store/pos/sessions/${session_id}/close`, { cash_register_id, closing_cash });
  }
}