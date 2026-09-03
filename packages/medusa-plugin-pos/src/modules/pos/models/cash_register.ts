import { model } from "@medusajs/framework/utils"
import PosSession from "./pos_session"

const CashRegister = model.define("cash_register", {
  id: model.id().primaryKey(),
  name: model.text(),
  status: model.enum(['open', 'closed']).default('closed'),
  pos_sessions: model.hasMany(() => PosSession, {
    mappedBy: "cash_register",
  }),
})

export default CashRegister
