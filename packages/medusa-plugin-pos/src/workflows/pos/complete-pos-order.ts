import { createWorkflow, WorkflowResponse, transform } from "@medusajs/framework/workflows-sdk"
import { completeCartWorkflow, createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { 
  validateActiveSessionStep, 
  autoCapturePosPaymentStep,
  autoFulfillPosOrderStep 
} from "./steps/checkout-steps"

type CompletePosOrderWorkflowInput = {
  cart_id: string
  pos_session_id: string
  fulfillment_type?: "instore" | "delivery"
}

export const completePosOrderWorkflow = createWorkflow(
  "complete-pos-order",
  function (input: CompletePosOrderWorkflowInput) {
    // 1. Verify that the shift/session is open
    validateActiveSessionStep(input.pos_session_id)

    // 2. Complete the cart to create the order
    const order = completeCartWorkflow.runAsStep({
      input: {
        id: input.cart_id
      }
    })

    // 3. Link the created order to the active pos_session
    const linkData = transform({ order, input }, ({ order, input }) => {
      return [
        {
          pos: {
            pos_session_id: input.pos_session_id
          },
          [Modules.ORDER]: {
            order_id: order.id
          }
        }
      ]
    })

    createRemoteLinkStep(linkData)

    // 4. Auto-capture payment for instant in-store POS sales
    autoCapturePosPaymentStep(order)

    // 5. Fulfillment handling (Auto-fulfill if in-store, or leave for delivery)
    autoFulfillPosOrderStep({
      order,
      fulfillment_type: input.fulfillment_type
    })

    return new WorkflowResponse(order)
  }
)


