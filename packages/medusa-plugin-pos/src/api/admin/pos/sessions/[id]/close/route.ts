import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { closePosSessionWorkflow } from "../../../../../../workflows/pos/close-session"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { closing_cash, cash_register_id } = req.body as any

  const { result } = await closePosSessionWorkflow(req.scope).run({
    input: {
      pos_session_id: id,
      closing_cash,
      cash_register_id
    }
  })

  return res.json({ report: result })
}
