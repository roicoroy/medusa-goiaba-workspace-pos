import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ViewWillEnter } from '@ionic/angular';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, cardOutline } from 'ionicons/icons';
import { CartFacade } from '../store/cart/cart.facade';
import { CheckoutFacade } from '../store/checkout/checkout.facade';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonGrid, IonRow, IonCol, IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonList, IonItem, IonLabel, IonInput, IonSegment, IonSegmentButton, IonIcon
  ]
})
export class CheckoutPage implements ViewWillEnter {
  private readonly cartFacade = inject(CartFacade);
  private readonly checkoutFacade = inject(CheckoutFacade);
  private readonly router = inject(Router);

  cartViewState$ = this.cartFacade.viewState$;
  checkoutViewState$ = this.checkoutFacade.viewState$;

  fulfillmentMode: 'instore' | 'delivery' = 'instore';

  deliveryForm = {
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  };

  constructor() {
    addIcons({ cashOutline, cardOutline });
  }

  ionViewWillEnter() {
    this.checkoutFacade.initializeCheckout();
  }

  selectMethod(providerId: string) {
    this.checkoutFacade.selectPaymentSession(providerId);
  }

  onFulfillmentModeChange() {
    if (this.fulfillmentMode === 'delivery' && this.deliveryForm.address) {
      this.syncDeliveryAddress();
    }
  }

  private syncDeliveryAddress() {
    this.checkoutFacade.updateDeliveryAddress({
      first_name: this.deliveryForm.name || 'POS',
      last_name: 'Customer',
      address_1: this.deliveryForm.address,
      city: this.deliveryForm.city,
      postal_code: this.deliveryForm.postalCode,
      phone: this.deliveryForm.phone
    });
  }

  payWithCash() {
    if (this.fulfillmentMode === 'delivery') {
      this.syncDeliveryAddress();
    }
    this.checkoutFacade.selectPaymentSession('pp_system_default');
    setTimeout(() => {
      this.checkoutFacade.completeOrder(this.fulfillmentMode);
      this.router.navigate(['/home']);
    }, 500);
  }

  payWithCredit() {
    if (this.fulfillmentMode === 'delivery') {
      this.syncDeliveryAddress();
    }
    this.checkoutFacade.selectPaymentSession('pp_system_default');
    setTimeout(() => {
      this.checkoutFacade.completeOrder(this.fulfillmentMode);
      this.router.navigate(['/home']);
    }, 500);
  }
}

