import { createWorkflow, WorkflowResponse, transform, createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { createPosReportStep, closePosSessionStep } from "./steps/report-steps"
import { updateRegisterStatusStep } from "./steps/open-session-steps"

type CloseSessionInput = {
  pos_session_id: string
  cash_register_id: string
  closing_cash: number
}

export const notifyShiftClosedStep = createStep(
  "notify-shift-closed",
  async (input: { session_id: string; total_sales: number; closing_cash: number }, { container }) => {
    try {
      const notificationModule = container.resolve(Modules.NOTIFICATION)
      await notificationModule.createNotifications({
        to: "admin",
        channel: "feed",
        template: "pos-shift-closed",
        data: {
          title: `POS Shift Closed (${input.session_id.slice(0, 8)})`,
          description: `Z-Report Ready. Sales: €${Number(input.total_sales || 0).toFixed(2)}, Final Cash Count: €${Number(input.closing_cash || 0).toFixed(2)}`,
          session_id: input.session_id
        }
      }).catch(() => null)
    } catch (e: any) {
      console.warn(`[POS] Notification note:`, e.message)
    }
    return new StepResponse(true)
  }
)

export const closePosSessionWorkflow = createWorkflow(
  "close-pos-session",
  function (input: CloseSessionInput) {
    // 1. Fetch session and its linked orders
    const { data: sessions } = useQueryGraphStep({
      entity: "pos_session",
      fields: ["id", "cash_register_id", "orders.*", "orders.total", "orders.tax_total"],
      filters: {
        id: input.pos_session_id
      }
    })

    // 2. Calculate totals from the orders & extract register id
    const calculatedData = transform({ sessions, input }, ({ sessions, input }) => {
      const session = sessions[0]
      let total_sales = 0
      let tax_total = 0
      
      if (session && session.orders) {
        for (const order of session.orders) {
          total_sales += Number(order?.total || 0)
          tax_total += Number(order?.tax_total || 0)
        }
      }
      
      const cash_register_id = input.cash_register_id || session?.cash_register_id
      
      return {
        total_sales,
        tax_total,
        cash_register_id,
        payment_breakdown: {}
      }
    })

    // 3. Create the Z-Report
    const report = createPosReportStep({
      pos_session_id: input.pos_session_id,
      type: "z_report",
      total_sales: calculatedData.total_sales,
      tax_total: calculatedData.tax_total,
      payment_breakdown: calculatedData.payment_breakdown
    })
    
    // 4. Close the session
    closePosSessionStep({
      session_id: input.pos_session_id,
      closing_cash: input.closing_cash
    })
    
    // 5. Update cash register status
    updateRegisterStatusStep({
      id: calculatedData.cash_register_id,
      status: "closed"
    }).config({ name: "update-register-status-closed" })

    // 6. Notify Admin
    notifyShiftClosedStep({
      session_id: input.pos_session_id,
      total_sales: calculatedData.total_sales,
      closing_cash: input.closing_cash
    })

    return new WorkflowResponse(report)
  }
)

