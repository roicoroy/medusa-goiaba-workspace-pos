import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError, Modules } from "@medusajs/framework/utils"

export const validateActiveSessionStep = createStep(
  "validate-active-pos-session",
  async (sessionId: string, { container }) => {
    if (!sessionId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "A valid pos_session_id is required to complete a POS order."
      )
    }

    const posModule = container.resolve("pos") as any
    const session = await posModule.retrievePosSession(sessionId).catch(() => null)

    if (!session) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `POS Session with id ${sessionId} was not found.`
      )
    }

    if (session.status !== "open") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot place order: Register shift is ${session.status}. Please open a shift first.`
      )
    }

    return new StepResponse(session)
  }
)

export const autoCapturePosPaymentStep = createStep(
  "auto-capture-pos-payment",
  async (order: any, { container }) => {
    console.log(`[POS] >>> autoCapturePosPaymentStep started for order:`, order?.id)
    if (!order || !order.id) return new StepResponse(null)

    const paymentModule = container.resolve(Modules.PAYMENT)
    const query = container.resolve("query")

    // Fetch the payment collection linked to the order
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "total",
        "payment_collections.id",
        "payment_collections.payments.id",
        "payment_collections.payments.amount",
        "payment_collections.payments.captured_at"
      ],
      filters: { id: order.id }
    })

    const foundOrder = orders?.[0]
    console.log(`[POS] Found order for payment:`, foundOrder?.id, "total:", foundOrder?.total)
    const payments = foundOrder?.payment_collections?.flatMap((pc: any) => pc.payments || []) || []
    console.log(`[POS] Payment collections payments count:`, payments.length)

    for (const payment of payments) {
      if (!payment.captured_at) {
        console.log(`[POS] Capturing payment ${payment.id} for amount ${payment.amount || foundOrder.total}`)
        await paymentModule.capturePayment({
          payment_id: payment.id,
          amount: payment.amount || foundOrder.total
        }).then((res: any) => {
          console.log(`[POS] Payment captured successfully:`, res?.id)
        }).catch((err: any) => {
          console.warn(`[POS] Payment auto-capture failed:`, err.message)
        })
      } else {
        console.log(`[POS] Payment ${payment.id} already captured at ${payment.captured_at}`)
      }
    }

    return new StepResponse(order)
  }
)

import { 
  createOrderFulfillmentWorkflow, 
  createOrderShipmentWorkflow,
  completeOrderWorkflow 
} from "@medusajs/core-flows"

export const autoFulfillPosOrderStep = createStep(
  "auto-fulfill-pos-order",
  async (input: { order: any; fulfillment_type?: "instore" | "delivery" }, { container }) => {
    const { order, fulfillment_type = "instore" } = input
    console.log(`[POS] >>> autoFulfillPosOrderStep started for order:`, order?.id, "fulfillment_type:", fulfillment_type)
    if (!order || !order.id) return new StepResponse(null)

    // If order was marked as delivery, leave it for warehouse staff to fulfill
    if (fulfillment_type === "delivery") {
      console.log(`[POS] Order ${order.id} flagged for warehouse delivery. Leaving for warehouse fulfillment.`)
      return new StepResponse(order)
    }

    const query = container.resolve("query")

    try {
      // 1. Fetch order items, shipping methods, and stock locations
      const { data: orders } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "total",
          "items.id",
          "items.quantity",
          "shipping_methods.id",
          "shipping_methods.shipping_option_id"
        ],
        filters: { id: order.id }
      })

      const foundOrder = orders?.[0]
      console.log(`[POS] Found order items for fulfillment:`, foundOrder?.items)
      if (!foundOrder || !foundOrder.items?.length) {
        console.warn(`[POS] No items found on order ${order.id} to fulfill!`)
        return new StepResponse(order)
      }

      // 2. Fetch active stock location
      const { data: stockLocations } = await query.graph({
        entity: "stock_location",
        fields: ["id", "name"]
      })
      const defaultLocationId = stockLocations?.[0]?.id
      console.log(`[POS] Using stock location for fulfillment:`, defaultLocationId)

      // 3. Run the official Medusa createOrderFulfillmentWorkflow with exact parameters
      console.log(`[POS] Executing createOrderFulfillmentWorkflow...`)
      const shippingOptionId = foundOrder.shipping_methods?.[0]?.shipping_option_id || undefined
      const locationId = defaultLocationId || undefined

      const fulfillmentItems = foundOrder.items.map((item: any) => ({
        id: item.id,
        quantity: Number(item.quantity || 1)
      }))

      const { result: fulfillment, errors } = await createOrderFulfillmentWorkflow(container).run({
        input: {
          order_id: foundOrder.id,
          location_id: locationId,
          shipping_option_id: shippingOptionId,
          items: fulfillmentItems
        },
        throwOnError: false
      })

      if (errors && errors.length > 0) {
        console.error(`[POS] createOrderFulfillmentWorkflow errors:`, JSON.stringify(errors, null, 2))
      } else {
        console.log(`[POS] Fulfillment created successfully:`, fulfillment?.id)
      }

      // 4. Mark the fulfillment as shipped / handed over immediately
      if (fulfillment?.id) {
        console.log(`[POS] Executing createOrderShipmentWorkflow for fulfillment ${fulfillment.id}...`)
        const { result: shipment, errors: shipmentErrors } = await createOrderShipmentWorkflow(container).run({
          input: {
            order_id: foundOrder.id,
            fulfillment_id: fulfillment.id,
            items: fulfillmentItems
          },
          throwOnError: false
        })

        if (shipmentErrors && shipmentErrors.length > 0) {
          console.error(`[POS] createOrderShipmentWorkflow errors:`, JSON.stringify(shipmentErrors, null, 2))
        } else {
          console.log(`[POS] Shipment created successfully. Handed over at store counter!`)
        }
      }

      // 5. Officially mark the order as COMPLETED in Medusa
      console.log(`[POS] Executing completeOrderWorkflow to mark order ${foundOrder.id} as completed...`)
      await completeOrderWorkflow(container).run({
        input: {
          orderIds: [foundOrder.id]
        },
        throwOnError: false
      }).catch((err) => {
        console.warn(`[POS] completeOrderWorkflow note:`, err.message)
      })

      // 6. Emit real-time Notification to Medusa Admin Bell
      try {
        const orderDisplay = foundOrder.display_id ? `#${foundOrder.display_id}` : `#${foundOrder.id.slice(0, 6)}`
        const orderAmount = Number(foundOrder.total || order.total || 0).toFixed(2)
        const notificationModule = container.resolve(Modules.NOTIFICATION)
        await notificationModule.createNotifications({
          to: "admin",
          channel: "feed",
          template: "pos-sale",
          data: {
            title: `New POS Sale ${orderDisplay}`,
            description: `A sale of €${orderAmount} was completed at the store counter.`,
            order_id: foundOrder.id
          }
        }).catch(() => null)
        console.log(`[POS] Admin notification emitted for sale ${orderDisplay}`)
      } catch (err: any) {
        console.warn(`[POS] Notification note:`, err.message)
      }

    } catch (err: any) {
      console.error(`[POS] Auto-fulfillment execution error:`, err)
    }

    return new StepResponse(order)
  }
)



