import { model } from "@medusajs/framework/utils"
import PosSession from "./pos_session"

const PosReport = model.define("pos_report", {
  id: model.id().primaryKey(),
  pos_session: model.belongsTo(() => PosSession, {
    mappedBy: "pos_reports",
  }),
  type: model.enum(['x_report', 'z_report']),
  total_sales: model.bigNumber(),
  tax_total: model.bigNumber(),
  payment_breakdown: model.json(),
  generated_at: model.dateTime(),
})

export default PosReport
