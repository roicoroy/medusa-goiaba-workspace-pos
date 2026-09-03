import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { AuthenticatedMedusaRequest } from "@medusajs/framework/http"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const posModule = req.scope.resolve("pos") as any
  const registers = await posModule.listCashRegisters()
  return res.json({ registers })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { name } = req.body as { name: string }
  const posModule = req.scope.resolve("pos") as any
  
  const register = await posModule.createCashRegisters({ name })
  
  return res.json({ register })
}
