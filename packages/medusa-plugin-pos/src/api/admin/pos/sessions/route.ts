import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { openPosSessionWorkflow } from "../../../../workflows/pos/open-session"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { cash_register_id, opening_float } = req.body as any
  const cashier_id = req.auth_context.actor_id

  const { result } = await openPosSessionWorkflow(req.scope).run({
    input: {
      cash_register_id,
      opening_float,
      cashier_id
    }
  })

  return res.json({ session: result })
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")
  const { data: sessions } = await query.graph({
    entity: "pos_session",
    fields: [
      "id",
      "cash_register_id",
      "cash_register.name",
      "status",
      "opening_float",
      "closing_cash",
      "opened_at",
      "closed_at",
      "orders.id",
      "orders.display_id",
      "orders.total",
      "orders.subtotal",
      "orders.tax_total",
      "orders.discount_total",
      "orders.created_at",
      "orders.currency_code",
      "orders.items.id",
      "orders.items.title",
      "orders.items.quantity",
      "orders.items.unit_price",
      "orders.items.total",
      "orders.payment_collections.payments.id",
      "orders.payment_collections.payments.amount",
      "orders.payment_collections.payments.provider_id",
      "orders.payment_collections.payments.captured_at",
      "user.id",
      "user.email",
      "user.first_name",
      "user.last_name"
    ]
  })
  return res.json({ sessions })
}

