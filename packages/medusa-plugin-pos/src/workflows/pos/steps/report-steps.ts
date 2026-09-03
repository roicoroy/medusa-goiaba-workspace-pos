import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type CreateReportInput = {
  pos_session_id: string
  type: "x_report" | "z_report"
  total_sales: number
  tax_total: number
  payment_breakdown: Record<string, any>
}

export const createPosReportStep = createStep(
  "create-pos-report",
  async (input: CreateReportInput, { container }) => {
    const posModule = container.resolve("pos") as any
    const report = await posModule.createPosReports({
      pos_session_id: input.pos_session_id,
      type: input.type,
      total_sales: input.total_sales,
      tax_total: input.tax_total,
      payment_breakdown: input.payment_breakdown,
      generated_at: new Date()
    })
    return new StepResponse(report, report.id)
  },
  async (id, { container }) => {
    if (!id) return
    const posModule = container.resolve("pos") as any
    await posModule.deletePosReports(id)
  }
)

export const closePosSessionStep = createStep(
  "close-pos-session-step",
  async (input: { session_id: string; closing_cash: number }, { container }) => {
    const posModule = container.resolve("pos") as any
    const session = await posModule.updatePosSessions({
      id: input.session_id,
      closing_cash: input.closing_cash,
      closed_at: new Date(),
      status: "closed"
    })
    return new StepResponse(session, input.session_id)
  },
  async (sessionId, { container }) => {
    if (!sessionId) return
    const posModule = container.resolve("pos") as any
    await posModule.updatePosSessions({
      id: sessionId,
      status: "open",
      closed_at: null,
      closing_cash: null
    })
  }
)
