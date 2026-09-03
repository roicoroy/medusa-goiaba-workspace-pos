export namespace ShiftActions {
  export class CreateRegister {
    static readonly type = '[Shift] Create Register';
    constructor(public name: string) {}
  }

  export class UpdateRegister {
    static readonly type = '[Shift] Update Register';
    constructor(public id: string, public name: string) {}
  }

  export class DeleteRegister {
    static readonly type = '[Shift] Delete Register';
    constructor(public id: string) {}
  }

  export class LoadRegisters {
    static readonly type = '[Shift] Load Registers';
  }
  
  export class SelectRegister {
    static readonly type = '[Shift] Select Register';
    constructor(public registerId: string) {}
  }

  export class OpenShift {
    static readonly type = '[Shift] Open Shift';
    constructor(public registerId: string, public openingFloat: number) {}
  }

  export class CloseShift {
    static readonly type = '[Shift] Close Shift';
    constructor(public sessionId: string, public registerId: string, public closingCash: number) {}
  }
}
