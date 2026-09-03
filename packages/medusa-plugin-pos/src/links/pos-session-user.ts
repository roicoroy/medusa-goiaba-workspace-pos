import { defineLink } from "@medusajs/framework/utils"
import UserModule from "@medusajs/medusa/user"
import PosModule from "../modules/pos"

export default defineLink(
  UserModule.linkable.user,
  {
    linkable: PosModule.linkable.posSession,
    isList: true
  }
)
