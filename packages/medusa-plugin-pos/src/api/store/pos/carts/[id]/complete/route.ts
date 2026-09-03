import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { completePosOrderWorkflow } from "../../../../../../workflows/pos/complete-pos-order"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id: cart_id } = req.params
  const { pos_session_id, fulfillment_type } = req.body as { 
    pos_session_id: string
    fulfillment_type?: "instore" | "delivery" 
  }

  const { result } = await completePosOrderWorkflow(req.scope).run({
    input: {
      cart_id,
      pos_session_id,
      fulfillment_type
    }
  })

  return res.json({
    type: "order",
    order: result
  })
}
