import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { createPosReportStep } from "./steps/report-steps"

type GenerateReportInput = {
  pos_session_id: string
}

export const generateXReportWorkflow = createWorkflow(
  "generate-x-report",
  function (input: GenerateReportInput) {
    // 1. Fetch session and its linked orders
    const { data: sessions } = useQueryGraphStep({
      entity: "pos_session",
      fields: ["id", "orders.*", "orders.total", "orders.tax_total"],
      filters: {
        id: input.pos_session_id
      }
    })

    // 2. Calculate totals from the orders
    const calculatedTotals = transform({ sessions }, ({ sessions }) => {
      const session = sessions[0]
      let total_sales = 0
      let tax_total = 0
      
      if (session && session.orders) {
        for (const order of session.orders) {
          total_sales += Number(order?.total || 0)
          tax_total += Number(order?.tax_total || 0)
        }
      }
      
      return {
        total_sales,
        tax_total,
        payment_breakdown: {} // simplified for now
      }
    })

    // 3. Create the X-Report
    const report = createPosReportStep({
      pos_session_id: input.pos_session_id,
      type: "x_report",
      total_sales: calculatedTotals.total_sales,
      tax_total: calculatedTotals.tax_total,
      payment_breakdown: calculatedTotals.payment_breakdown
    })

    return new WorkflowResponse(report)
  }
)
