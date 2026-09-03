import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"

export const verifyRegisterClosedStep = createStep(
  "verify-register-closed",
  async (cash_register_id: string, { container }) => {
    const posModule = container.resolve("pos") as any
    const register = await posModule.retrieveCashRegister(cash_register_id)
    if (register.status === "open") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Register is already open")
    }
    return new StepResponse(register)
  }
)

type CreateSessionInput = {
  cash_register_id: string
  opening_float: number
}

export const createPosSessionStep = createStep(
  "create-pos-session",
  async (input: CreateSessionInput, { container }) => {
    const posModule = container.resolve("pos") as any
    const session = await posModule.createPosSessions({
      cash_register_id: input.cash_register_id,
      opening_float: input.opening_float,
      status: "open",
      opened_at: new Date()
    })
    return new StepResponse(session, session.id)
  },
  async (id, { container }) => {
    if (!id) return
    const posModule = container.resolve("pos") as any
    await posModule.deletePosSessions(id)
  }
)

export const updateRegisterStatusStep = createStep(
  "update-register-status",
  async (input: { id: string; status: "open" | "closed" }, { container }) => {
    const posModule = container.resolve("pos") as any
    const register = await posModule.updateCashRegisters({
      id: input.id,
      status: input.status
    })
    // For compensation, we would need to know the previous status, but assuming it toggles
    const previousStatus = input.status === "open" ? "closed" : "open"
    return new StepResponse(register, { id: input.id, status: previousStatus })
  },
  async (data, { container }) => {
    if (!data) return
    const posModule = container.resolve("pos") as any
    await posModule.updateCashRegisters({
      id: data.id,
      status: data.status as any
    })
  }
)
