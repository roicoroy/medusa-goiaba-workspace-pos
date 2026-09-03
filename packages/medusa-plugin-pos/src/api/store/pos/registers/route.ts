import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { data: registers } = await query.graph({
    entity: "cash_register",
    fields: ["id", "name", "status"]
  })
  
  const { data: sessions } = await query.graph({
    entity: "pos_session",
    fields: [
      "id",
      "cash_register_id",
      "status",
      "opening_float",
      "closing_cash",
      "opened_at",
      "closed_at",
      "orders.id",
      "orders.display_id",
      "orders.total",
      "orders.tax_total",
      "orders.created_at",
      "orders.currency_code"
    ]
  })
  
  return res.json({ registers, sessions })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { name } = req.body as { name: string }
  const posModule = req.scope.resolve("pos") as any

  const register = await posModule.createCashRegisters({
    name
  })

  return res.json({ register })
}
