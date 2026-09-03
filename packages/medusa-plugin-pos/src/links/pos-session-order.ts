import { defineLink } from "@medusajs/framework/utils"
import PosModule from "../modules/pos"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
  PosModule.linkable.posSession,
  {
    linkable: OrderModule.linkable.order,
    isList: true
  }
)
