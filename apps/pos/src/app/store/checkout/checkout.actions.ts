export namespace CheckoutActions {
  export class InitializeCheckout {
    static readonly type = '[Checkout] Initialize Checkout';
  }

  export class SelectPaymentSession {
    static readonly type = '[Checkout] Select Payment Session';
    constructor(public providerId: string) {}
  }

  export class CompleteOrder {
    static readonly type = '[Checkout] Complete Order';
    constructor(public fulfillmentType: "instore" | "delivery" = "instore") {}
  }

  export class UpdateDeliveryAddress {
    static readonly type = '[Checkout] Update Delivery Address';
    constructor(public address: {
      first_name: string;
      last_name: string;
      address_1: string;
      city: string;
      postal_code: string;
      phone: string;
    }) {}
  }
}
