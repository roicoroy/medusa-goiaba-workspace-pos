import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { verifyRegisterClosedStep, createPosSessionStep, updateRegisterStatusStep } from "./steps/open-session-steps"

type OpenSessionWorkflowInput = {
  cash_register_id: string
  opening_float: number
  cashier_id: string
}

export const openPosSessionWorkflow = createWorkflow(
  "open-pos-session",
  function (input: OpenSessionWorkflowInput) {
    verifyRegisterClosedStep(input.cash_register_id)

    const session = createPosSessionStep({
      cash_register_id: input.cash_register_id,
      opening_float: input.opening_float
    })

    const linkData = transform({ session, input }, ({ session, input }) => {
      return [{
        [Modules.USER]: {
          user_id: input.cashier_id,
        },
        pos: {
          pos_session_id: session.id,
        }
      }]
    })

    createRemoteLinkStep(linkData)

    updateRegisterStatusStep({
      id: input.cash_register_id,
      status: "open"
    })

    return new WorkflowResponse(session)
  }
)
