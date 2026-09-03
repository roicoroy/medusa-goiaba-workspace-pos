import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateXReportWorkflow } from "../../../../../../../workflows/pos/generate-x-report"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  const { result } = await generateXReportWorkflow(req.scope).run({
    input: {
      pos_session_id: id
    }
  })

  return res.json({ report: result })
}
