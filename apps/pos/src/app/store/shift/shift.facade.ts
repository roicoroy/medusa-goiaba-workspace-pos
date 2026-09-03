import { Injectable, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { ShiftActions } from './shift.actions';
import { ShiftState } from './shift.state';

@Injectable({
  providedIn: 'root'
})
export class ShiftFacade {
  private store = inject(Store);

  registers$ = this.store.select(ShiftState.getRegisters);
  activeSession$ = this.store.select(ShiftState.getActiveSession);
  selectedRegisterId$ = this.store.select(ShiftState.getSelectedRegisterId);
  isLoading$ = this.store.select(ShiftState.isLoading);

  loadRegisters() {
    this.store.dispatch(new ShiftActions.LoadRegisters());
  }

  createRegister(name: string) {
    return this.store.dispatch(new ShiftActions.CreateRegister(name));
  }

  updateRegister(id: string, name: string) {
    return this.store.dispatch(new ShiftActions.UpdateRegister(id, name));
  }

  deleteRegister(id: string) {
    return this.store.dispatch(new ShiftActions.DeleteRegister(id));
  }

  selectRegister(registerId: string) {
    this.store.dispatch(new ShiftActions.SelectRegister(registerId));
  }

  openShift(registerId: string, openingFloat: number) {
    return this.store.dispatch(new ShiftActions.OpenShift(registerId, openingFloat));
  }

  closeShift(sessionId: string, registerId: string, closingCash: number) {
    return this.store.dispatch(new ShiftActions.CloseShift(sessionId, registerId, closingCash));
  }
}
