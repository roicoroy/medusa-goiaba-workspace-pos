import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonButtons,
  AlertController
} from '@ionic/angular/standalone';
import { CartFacade } from '../store/cart/cart.facade';
import { ProductsFacade } from '../store/products/products.facade';
import { NavigationService } from '../shared/services/navigation/navigation.service';
import { RegionSelectComponent } from '../components/region-select/region-select.component';
import { RegisterApiService, RegisterCurrentResponse } from '../shared/services/register/register.api';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonButton,
    IonButtons,
    IonCol,
    RegionSelectComponent
  ],
})
export class HomePage implements OnInit {
  private readonly navigationService = inject(NavigationService);
  public readonly cartFacade = inject(CartFacade);
  public readonly productsFacade = inject(ProductsFacade);
  private readonly registerApi = inject(RegisterApiService);
  private readonly alertCtrl = inject(AlertController);

  public registerSession: RegisterCurrentResponse | null = null;
  public loadingRegister = true;

  ngOnInit() {
    // this.checkRegisterStatus();
  }

  checkRegisterStatus() {
    this.loadingRegister = true;
    this.registerApi.getCurrentRegister().subscribe({
      next: (res) => {
        this.registerSession = res;
        this.loadingRegister = false;
      },
      error: (err) => {
        this.registerSession = null;
        this.loadingRegister = false;
      }
    });
  }

  async promptOpenRegister() {
    const alert = await this.alertCtrl.create({
      header: 'Open Register',
      message: 'Enter the starting cash float for this shift:',
      inputs: [
        {
          name: 'float',
          type: 'number',
          placeholder: 'e.g. 100.00',
          min: 0
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Open', 
          handler: (data) => {
            if (data.float) {
              this.registerApi.openRegister(parseFloat(data.float)).subscribe({
                next: () => this.checkRegisterStatus(),
                error: (err) => console.error('Failed to open register', err)
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async promptCloseRegister() {
    if (!this.registerSession) return;
    
    const expected = this.registerSession.sales.calculated_expected_cash;

    const alert = await this.alertCtrl.create({
      header: 'Close Register',
      subHeader: `Expected Cash: €${expected.toFixed(2)}`,
      message: 'Count the physical cash in the drawer and enter it below:',
      inputs: [
        {
          name: 'actual',
          type: 'number',
          placeholder: 'Actual cash amount',
          min: 0
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Cash Out', 
          handler: (data) => {
            if (data.actual) {
              this.registerApi.closeRegister(parseFloat(data.actual)).subscribe({
                next: () => this.checkRegisterStatus(),
                error: (err) => console.error('Failed to close register', err)
              });
            }
          }
        }
      ]
    });
    await alert.present();
  }

  start() {
    // if (!this.registerSession) {
    //   this.promptOpenRegister();
    //   return;
    // }
    this.navigationService.navigate('/cart');
  }
}
