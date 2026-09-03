import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { name } = req.body as { name: string }
  const posModule = req.scope.resolve("pos") as any

  const register = await posModule.updateCashRegisters({
    id,
    name
  })

  return res.json({ register })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const posModule = req.scope.resolve("pos") as any

  await posModule.deleteCashRegisters(id)

  return res.json({ id, object: "cash_register", deleted: true })
}
