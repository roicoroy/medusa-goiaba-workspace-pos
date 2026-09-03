import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "total",
      "subtotal",
      "tax_total",
      "discount_total",
      "created_at",
      "currency_code",
      "email",
      "items.id",
      "items.title",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "shipping_address.*",
      "payment_collections.payments.id",
      "payment_collections.payments.amount",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.captured_at",
      "pos_session.id",
      "pos_session.status",
      "pos_session.opened_at",
      "pos_session.cash_register.name",
      "pos_session.user.first_name",
      "pos_session.user.last_name",
      "pos_session.user.email"
    ],
    filters: { id }
  })

  const order = orders?.[0]
  if (!order) {
    return res.status(404).json({ message: `POS Order ${id} not found` })
  }

  return res.json({ order })
}
