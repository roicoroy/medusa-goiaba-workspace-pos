import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Table, Badge } from "@medusajs/ui"
import { ArrowLeft, BuildingStorefront, CheckCircleSolid } from "@medusajs/icons"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../../../lib/client"

type OrderItem = {
  id: string
  title: string
  quantity: number
  unit_price: number
  total: number
}

type OrderPayment = {
  id: string
  amount: number
  provider_id: string
  captured_at?: string
}

type PosOrder = {
  id: string
  display_id: number
  status: string
  total: number
  subtotal: number
  tax_total: number
  discount_total?: number
  created_at: string
  currency_code: string
  email: string
  items: OrderItem[]
  shipping_address?: {
    first_name?: string
    last_name?: string
    address_1?: string
    city?: string
    postal_code?: string
    phone?: string
  }
  payment_collections?: {
    payments?: OrderPayment[]
  }[]
  pos_session?: {
    id: string
    status: string
    opened_at: string
    cash_register?: {
      name: string
    }
    user?: {
      first_name?: string
      last_name?: string
      email?: string
    }
  }
}

const PosOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["admin_pos_order_detail", id],
    queryFn: () => sdk.client.fetch<{ order: PosOrder }>(`/admin/pos/orders/${id}`),
    enabled: !!id,
  })

  const order = data?.order

  if (isLoading) {
    return (
      <Container className="p-8 text-center text-ui-fg-subtle">
        Loading POS Order details...
      </Container>
    )
  }

  if (!order) {
    return (
      <Container className="p-8 text-center">
        <Text className="text-ui-fg-error mb-4">POS Order not found.</Text>
        <Button size="small" onClick={() => navigate("/pos")}>
          Back to POS Management
        </Button>
      </Container>
    )
  }

  const payments = order.payment_collections?.flatMap((pc) => pc.payments || []) || []
  const cashierName = order.pos_session?.user?.first_name 
    ? `${order.pos_session.user.first_name} ${order.pos_session.user.last_name || ""}` 
    : order.pos_session?.user?.email || "Store Cashier"

  return (
    <div className="flex flex-col gap-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Button 
            size="small" 
            variant="secondary" 
            onClick={() => navigate("/pos")}
            className="flex items-center gap-x-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to POS Hub
          </Button>
          <Heading level="h1" className="text-xl">
            POS Order #{order.display_id || order.id.slice(0, 8)}
          </Heading>
          <Badge color="green" className="flex items-center gap-x-1">
            <CheckCircleSolid className="w-3 h-3" /> PAID & COMPLETED
          </Badge>
        </div>
        <Text className="text-ui-fg-subtle text-sm">
          {new Date(order.created_at).toLocaleString()}
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Purchased Items & Financial Breakdown */}
        <div className="md:col-span-2 flex flex-col gap-y-6">
          <Container className="p-6">
            <Heading level="h2" className="text-base mb-4">Purchased Items</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Item</Table.HeaderCell>
                  <Table.HeaderCell>Unit Price</Table.HeaderCell>
                  <Table.HeaderCell>Quantity</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {order.items?.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>
                      <Text weight="plus">{item.title}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>${Number(item.unit_price || 0).toFixed(2)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text>{item.quantity}x</Text>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <Text weight="plus">${Number(item.total || item.unit_price * item.quantity).toFixed(2)}</Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {/* Financial Summary */}
            <div className="mt-6 pt-4 border-t border-ui-border-base flex flex-col gap-y-2 text-sm">
              <div className="flex justify-between">
                <Text className="text-ui-fg-subtle">Item Subtotal:</Text>
                <Text>${Number(order.subtotal || 0).toFixed(2)}</Text>
              </div>
              {Number(order.discount_total || 0) > 0 && (
                <div className="flex justify-between text-ui-fg-interactive">
                  <Text>Promotions / Discounts:</Text>
                  <Text>-${Number(order.discount_total).toFixed(2)}</Text>
                </div>
              )}
              <div className="flex justify-between">
                <Text className="text-ui-fg-subtle">Tax Total:</Text>
                <Text>${Number(order.tax_total || 0).toFixed(2)}</Text>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-ui-border-base">
                <Text weight="plus">Total Collected:</Text>
                <Text weight="plus">${Number(order.total || 0).toFixed(2)} {order.currency_code?.toUpperCase()}</Text>
              </div>
            </div>
          </Container>

          {/* Payment Capture Information */}
          <Container className="p-6">
            <Heading level="h2" className="text-base mb-4">Payment & Settlement</Heading>
            {payments.length === 0 ? (
              <Text className="text-ui-fg-muted">Payment captured via POS terminal.</Text>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-ui-bg-subtle p-4 rounded-lg">
                  <div>
                    <Text weight="plus">Counter Sale ({p.provider_id})</Text>
                    <Text className="text-xs text-ui-fg-subtle">
                      Captured: {p.captured_at ? new Date(p.captured_at).toLocaleTimeString() : 'Immediate'}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text weight="plus">${Number(p.amount || order.total).toFixed(2)}</Text>
                    <Badge color="green">CAPTURED</Badge>
                  </div>
                </div>
              ))
            )}
          </Container>
        </div>

        {/* Right 1 Col: Till Shift & Store Origin */}
        <div className="flex flex-col gap-y-6">
          <Container className="p-6">
            <div className="flex items-center gap-x-2 mb-4">
              <BuildingStorefront className="w-5 h-5 text-ui-fg-interactive" />
              <Heading level="h2" className="text-base">Store & Till Origin</Heading>
            </div>

            <div className="flex flex-col gap-y-3 text-sm">
              <div className="flex justify-between border-b pb-2 border-ui-border-base">
                <Text className="text-ui-fg-subtle">Cash Register:</Text>
                <Text weight="plus">{order.pos_session?.cash_register?.name || "Main Counter Register"}</Text>
              </div>
              <div className="flex justify-between border-b pb-2 border-ui-border-base">
                <Text className="text-ui-fg-subtle">Cashier on Duty:</Text>
                <Text weight="plus">{cashierName}</Text>
              </div>
              <div className="flex justify-between border-b pb-2 border-ui-border-base">
                <Text className="text-ui-fg-subtle">Shift Session:</Text>
                <Text className="font-mono text-xs">{order.pos_session?.id?.slice(0, 12) || "—"}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-ui-fg-subtle">Handover Type:</Text>
                <Badge color="blue">IN-STORE COUNTER</Badge>
              </div>
            </div>
          </Container>

          {/* Quick Actions */}
          <Container className="p-6 flex flex-col gap-y-3">
            <Heading level="h2" className="text-base">Receipt Actions</Heading>
            <Button 
              size="small" 
              variant="secondary" 
              className="w-full"
              onClick={() => window.print()}
            >
              Print Fiscal Receipt
            </Button>
          </Container>
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "POS Order Details",
})

export default PosOrderDetailPage
