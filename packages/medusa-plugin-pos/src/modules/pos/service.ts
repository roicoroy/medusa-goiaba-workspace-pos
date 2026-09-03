import { MedusaService } from "@medusajs/framework/utils"
import CashRegister from "./models/cash_register"
import PosSession from "./models/pos_session"
import PosReport from "./models/pos_report"

class PosModuleService extends MedusaService({
  CashRegister,
  PosSession,
  PosReport,
}) {}

export default PosModuleService
