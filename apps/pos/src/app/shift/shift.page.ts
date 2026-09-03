import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  AlertController,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, create, trash, logOut, logIn, cash } from 'ionicons/icons';
import { ShiftFacade } from '../store/shift/shift.facade';

@Component({
  selector: 'app-shift',
  templateUrl: './shift.page.html',
  styleUrls: ['./shift.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    SlicePipe,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonGrid, IonRow, IonCol, IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent, IonIcon, IonFab, IonFabButton, IonSpinner, 
    IonBadge, IonList, IonItem, IonLabel, IonNote
  ]
})
export class ShiftPage implements OnInit {
  private shiftFacade = inject(ShiftFacade);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  registers$ = this.shiftFacade.registers$;
  activeSession$ = this.shiftFacade.activeSession$;
  isLoading$ = this.shiftFacade.isLoading$;

  constructor() {
    addIcons({ add, create, trash, logOut, logIn, cash });
  }

  ngOnInit() {
    this.shiftFacade.loadRegisters();
  }

  getShiftTotal(orders?: any[]): number {
    if (!orders || !orders.length) return 0;
    return orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  }

  // --- Register CRUD ---

  async promptCreateRegister() {
    const alert = await this.alertCtrl.create({
      header: 'New Cash Register',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'e.g. Front Register 1' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Create',
          handler: (data) => {
            if (data.name) {
              this.shiftFacade.createRegister(data.name);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async promptEditRegister(register: any, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Edit Register',
      inputs: [
        { name: 'name', type: 'text', value: register.name, placeholder: 'Name' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Save',
          handler: (data) => {
            if (data.name) {
              this.shiftFacade.updateRegister(register.id, data.name);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async promptDeleteRegister(register: any, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Are you sure you want to delete ${register.name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.shiftFacade.deleteRegister(register.id);
          }
        }
      ]
    });
    await alert.present();
  }

  // --- Shift Operations ---

  async promptOpenShift(register: any) {
    const alert = await this.alertCtrl.create({
      header: 'Open Shift',
      message: `Enter the starting cash float for ${register.name}:`,
      inputs: [
        { name: 'float', type: 'number', placeholder: '0.00', min: 0 }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Start Shift',
          handler: (data) => {
            if (data.float) {
              this.shiftFacade.openShift(register.id, parseFloat(data.float));
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async promptCloseShift(register: any, session: any) {
    const expected = session.sales?.calculated_expected_cash || session.opening_float;
    const alert = await this.alertCtrl.create({
      header: 'Close Shift',
      subHeader: `Expected Cash: €${expected.toFixed(2)}`,
      message: 'Count the physical cash in the drawer and enter it below:',
      inputs: [
        { name: 'actual', type: 'number', placeholder: '0.00', min: 0 }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { 
          text: 'Close Shift',
          role: 'destructive',
          handler: (data) => {
            if (data.actual) {
              this.shiftFacade.closeShift(session.id, register.id, parseFloat(data.actual));
            }
          }
        }
      ]
    });
    await alert.present();
  }

  handleRegisterClick(register: any) {
    if (register.status === 'open') {
      // Find the open session from the register data
      const session = register.sessions?.find((s: any) => s.status === 'open');
      if (session) {
        this.promptCloseShift(register, session);
      }
    } else {
      this.promptOpenShift(register);
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}
