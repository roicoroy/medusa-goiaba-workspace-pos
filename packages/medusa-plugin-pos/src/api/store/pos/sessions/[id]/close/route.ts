import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { closePosSessionWorkflow } from "../../../../../../workflows/pos/close-session"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { cash_register_id, closing_cash } = req.body as any

  const { result } = await closePosSessionWorkflow(req.scope).run({
    input: {
      pos_session_id: id,
      cash_register_id,
      closing_cash
    }
  })

  return res.json({ session: result })
}
