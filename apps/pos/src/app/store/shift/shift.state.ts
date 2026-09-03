import { State, Action, StateContext, Selector } from '@ngxs/store';
import { Injectable, inject } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { ShiftActions } from './shift.actions';
import { MedusaService } from '../../shared/api/medusa.service';

export interface ShiftStateModel {
  registers: any[];
  sessions: any[];
  selectedRegisterId: string | null;
  loading: boolean;
  error: string | null;
}

@State<ShiftStateModel>({
  name: 'shift',
  defaults: {
    registers: [],
    sessions: [],
    selectedRegisterId: null,
    loading: false,
    error: null
  }
})
@Injectable()
export class ShiftState {
  private medusaApi = inject(MedusaService);

  @Selector()
  static getRegisters(state: ShiftStateModel) {
    return state.registers;
  }

  @Selector()
  static getActiveSession(state: ShiftStateModel) {
    if (!state.selectedRegisterId) return null;
    return state.sessions.find(s => s.cash_register_id === state.selectedRegisterId && s.status === 'open') || null;
  }

  @Selector()
  static getSelectedRegisterId(state: ShiftStateModel) {
    return state.selectedRegisterId;
  }

  @Selector()
  static isLoading(state: ShiftStateModel) {
    return state.loading;
  }

  @Action(ShiftActions.LoadRegisters)
  loadRegisters(ctx: StateContext<ShiftStateModel>) {
    ctx.patchState({ loading: true, error: null });
    return this.medusaApi.listRegisters().pipe(
      tap((res: any) => {
        ctx.patchState({
          registers: res.registers || [],
          sessions: res.sessions || [],
          loading: false
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(ShiftActions.CreateRegister)
  createRegister(ctx: StateContext<ShiftStateModel>, { name }: ShiftActions.CreateRegister) {
    ctx.patchState({ loading: true, error: null });
    return this.medusaApi.createRegister(name).pipe(
      tap(() => {
        ctx.dispatch(new ShiftActions.LoadRegisters());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(ShiftActions.UpdateRegister)
  updateRegister(ctx: StateContext<ShiftStateModel>, { id, name }: ShiftActions.UpdateRegister) {
    ctx.patchState({ loading: true, error: null });
    return this.medusaApi.updateRegister(id, name).pipe(
      tap(() => {
        ctx.dispatch(new ShiftActions.LoadRegisters());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(ShiftActions.DeleteRegister)
  deleteRegister(ctx: StateContext<ShiftStateModel>, { id }: ShiftActions.DeleteRegister) {
    ctx.patchState({ loading: true, error: null });
    return this.medusaApi.deleteRegister(id).pipe(
      tap(() => {
        ctx.dispatch(new ShiftActions.LoadRegisters());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(ShiftActions.SelectRegister)
  selectRegister(ctx: StateContext<ShiftStateModel>, { registerId }: ShiftActions.SelectRegister) {
    ctx.patchState({ selectedRegisterId: registerId });
  }

  @Action(ShiftActions.OpenShift)
  openShift(ctx: StateContext<ShiftStateModel>, { registerId, openingFloat }: ShiftActions.OpenShift) {
    ctx.patchState({ loading: true, error: null });
    return this.medusaApi.openShift(registerId, openingFloat).pipe(
      tap(() => {
        ctx.dispatch(new ShiftActions.LoadRegisters());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(ShiftActions.CloseShift)
  closeShift(ctx: StateContext<ShiftStateModel>, { sessionId, registerId, closingCash }: ShiftActions.CloseShift) {
    ctx.patchState({ loading: true, error: null });
    return this.medusaApi.closeShift(sessionId, registerId, closingCash).pipe(
      tap(() => {
        ctx.dispatch(new ShiftActions.LoadRegisters());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }
}
