import { model } from "@medusajs/framework/utils"
import CashRegister from "./cash_register"
import PosReport from "./pos_report"

const PosSession = model.define("pos_session", {
  id: model.id().primaryKey(),
  cash_register: model.belongsTo(() => CashRegister, {
    mappedBy: "pos_sessions",
  }),
  status: model.enum(['open', 'closed']).default('open'),
  opening_float: model.bigNumber(),
  closing_cash: model.bigNumber().nullable(),
  opened_at: model.dateTime(),
  closed_at: model.dateTime().nullable(),
  pos_reports: model.hasMany(() => PosReport, {
    mappedBy: "pos_session",
  }),
})

export default PosSession
