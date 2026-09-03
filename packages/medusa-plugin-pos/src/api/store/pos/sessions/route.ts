import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { openPosSessionWorkflow } from "../../../../workflows/pos/open-session"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cash_register_id, opening_float } = req.body as any
  
  // Hardcode cashier_id for now as we have no auth
  const cashier_id = "pos_user"

  const { result } = await openPosSessionWorkflow(req.scope).run({
    input: {
      cash_register_id,
      opening_float,
      cashier_id
    }
  })

  return res.json({ session: result })
}
