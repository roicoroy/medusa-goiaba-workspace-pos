import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext, Selector, Store } from '@ngxs/store';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { CheckoutActions } from './checkout.actions';
import { CheckoutApiService } from '../../shared/services/checkout/checkout.api';
import { CartState } from '../cart/cart.state';
import { CartActions } from '../cart/cart.actions';
import { ShiftState } from '../shift/shift.state';

export interface CheckoutStateModel {
  paymentSessions: any[];
  paymentCollectionId: string | null;
  selectedPaymentSession: string | null;
  loading: boolean;
  error: string | null;
}

@State<CheckoutStateModel>({
  name: 'checkout',
  defaults: {
    paymentSessions: [],
    paymentCollectionId: null,
    selectedPaymentSession: null,
    loading: false,
    error: null
  }
})
@Injectable()
export class CheckoutState {
  private checkoutApi = inject(CheckoutApiService);
  private store = inject(Store);

  @Selector()
  static getPaymentSessions(state: CheckoutStateModel) {
    return state.paymentSessions;
  }

  @Selector()
  static getSelectedSession(state: CheckoutStateModel) {
    return state.selectedPaymentSession;
  }

  @Selector()
  static isLoading(state: CheckoutStateModel) {
    return state.loading;
  }

  @Selector()
  static getError(state: CheckoutStateModel) {
    return state.error;
  }

  @Selector()
  static getPaymentCollectionId(state: CheckoutStateModel) {
    return state.paymentCollectionId;
  }

  @Action(CheckoutActions.InitializeCheckout)
  initializeCheckout(ctx: StateContext<CheckoutStateModel>) {
    ctx.patchState({ loading: true, error: null });

    const cart = this.store.selectSnapshot(CartState.getCart);
    if (!cart || !cart.id) {
      ctx.patchState({ loading: false, error: 'No active cart found' });
      return;
    }

    // Step 1: Fetch regions if cart has no region
    return this.checkoutApi.getRegions().pipe(
      switchMap((regions: any[]) => {
        if (!regions || regions.length === 0) {
          return throwError(() => new Error('No regions configured on the server'));
        }
        const regionId = cart.region_id || regions[0].id;
        // Step 2: Update the cart with region, dummy email, and dummy address (since POS doesn't need real shipping)
        const dummyAddress = {
          first_name: 'POS',
          last_name: 'Customer',
          address_1: 'In-Store',
          city: 'Local',
          country_code: cart.shipping_address?.country_code || 'dk', // Fallback to DK or current
          postal_code: '0000',
          phone: '00000000'
        };

        return this.checkoutApi.updateCart(cart.id, { 
          region_id: regionId,
          email: cart.email || 'pos@store.com',
          shipping_address: dummyAddress,
          billing_address: dummyAddress
        }).pipe(
          switchMap(() => this.checkoutApi.getShippingOptions(cart.id).pipe(
            switchMap((shippingOptions) => {
              if (!shippingOptions || shippingOptions.length === 0) {
                return throwError(() => new Error('No shipping options available for this region'));
              }
              // Prefer free in-store option if exists, otherwise first option
              const selectedOption = shippingOptions.find(o => 
                o.name?.toLowerCase().includes('pickup') || 
                o.name?.toLowerCase().includes('in-store') || 
                o.name?.toLowerCase().includes('store') || 
                o.amount === 0
              ) || shippingOptions[0];

              return this.checkoutApi.addShippingMethod(cart.id, selectedOption.id);
            }),
            switchMap(() => this.checkoutApi.getPaymentProviders(regionId).pipe(
              switchMap((providers) => this.checkoutApi.createPaymentCollection(cart.id).pipe(
                tap((paymentCollection) => {
                  ctx.dispatch(new CartActions.InitializeCart());
                  ctx.patchState({
                    paymentCollectionId: paymentCollection.id,
                    paymentSessions: providers.map(p => ({ provider_id: p.id })),
                    loading: false
                  });
                })
              ))
            ))
          ))
        );
      }),
      catchError(error => {
        console.error('Checkout Init Error:', error);
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(CheckoutActions.SelectPaymentSession)
  selectPaymentSession(ctx: StateContext<CheckoutStateModel>, { providerId }: CheckoutActions.SelectPaymentSession) {
    ctx.patchState({ loading: true, error: null });

    const paymentCollectionId = ctx.getState().paymentCollectionId;
    if (!paymentCollectionId) {
      ctx.patchState({ loading: false, error: 'No active payment collection found' });
      return;
    }

    return this.checkoutApi.setPaymentSession(paymentCollectionId, providerId).pipe(
      tap((updatedCollection) => {
        ctx.patchState({
          selectedPaymentSession: providerId,
          loading: false
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(CheckoutActions.UpdateDeliveryAddress)
  updateDeliveryAddress(ctx: StateContext<CheckoutStateModel>, { address }: CheckoutActions.UpdateDeliveryAddress) {
    const cart = this.store.selectSnapshot(CartState.getCart);
    if (!cart || !cart.id) return;

    ctx.patchState({ loading: true, error: null });

    return this.checkoutApi.updateCart(cart.id, {
      shipping_address: {
        first_name: address.first_name || 'POS',
        last_name: address.last_name || 'Customer',
        address_1: address.address_1,
        city: address.city,
        postal_code: address.postal_code,
        phone: address.phone,
        country_code: cart.shipping_address?.country_code || 'dk'
      }
    }).pipe(
      tap(() => {
        ctx.patchState({ loading: false });
        ctx.dispatch(new CartActions.InitializeCart());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(CheckoutActions.CompleteOrder)
  completeOrder(ctx: StateContext<CheckoutStateModel>, { fulfillmentType }: CheckoutActions.CompleteOrder) {
    ctx.patchState({ loading: true, error: null });
    
    const cart = this.store.selectSnapshot(CartState.getCart);
    if (!cart || !cart.id) {
      ctx.patchState({ loading: false, error: 'No active cart found' });
      return;
    }

    const activeSession = this.store.selectSnapshot(ShiftState.getActiveSession);
    const checkoutObs = activeSession && activeSession.id
      ? this.checkoutApi.completePosCart(cart.id, activeSession.id, fulfillmentType || "instore")
      : this.checkoutApi.completeCart(cart.id);

    return checkoutObs.pipe(
      tap((response) => {
        ctx.patchState({ loading: false });
        ctx.dispatch(new CartActions.ClearCart());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message || 'Error completing checkout' });
        return throwError(() => error);
      })
    );
  }
}
