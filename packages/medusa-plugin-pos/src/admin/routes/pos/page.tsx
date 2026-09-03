import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Table, Drawer, FocusModal, Input, Label, Badge } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/client"
import { useState } from "react"

// Types
type CashRegister = {
  id: string
  name: string
  status: "open" | "closed"
}

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
  total: number
  subtotal: number
  tax_total: number
  discount_total?: number
  created_at: string
  currency_code: string
  items?: OrderItem[]
  payment_collections?: {
    payments?: OrderPayment[]
  }[]
}

type PosSession = {
  id: string
  cash_register_id: string
  status: "open" | "closed"
  opening_float?: number
  closing_cash?: number
  opened_at?: string
  closed_at?: string
  orders?: PosOrder[]
  cash_register?: CashRegister
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

const PosManagementPage = () => {
  const queryClient = useQueryClient()
  
  // Modals & Drawer state
  const [openShiftModal, setOpenShiftModal] = useState<string | null>(null)
  const [closeShiftModal, setCloseShiftModal] = useState<string | null>(null)
  const [reportDrawer, setReportDrawer] = useState<string | null>(null)
  const [selectedSessionOrders, setSelectedSessionOrders] = useState<PosSession | null>(null)
  const [selectedPosOrder, setSelectedPosOrder] = useState<PosOrder | null>(null)
  
  const [floatAmount, setFloatAmount] = useState("")
  const [closingCash, setClosingCash] = useState("")
  const [newRegisterName, setNewRegisterName] = useState("")

  // Queries
  const { data: registersData, isLoading: isLoadingRegisters } = useQuery({
    queryKey: ["pos_registers"],
    queryFn: () => sdk.client.fetch(`/admin/pos/registers`)
  })

  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["pos_sessions"],
    queryFn: () => sdk.client.fetch(`/admin/pos/sessions`)
  })
  
  const { data: reportData } = useQuery({
    queryKey: ["pos_x_report", reportDrawer],
    queryFn: () => sdk.client.fetch(`/admin/pos/sessions/${reportDrawer}/reports/x`, { method: "POST" }),
    enabled: !!reportDrawer
  })

  // Mutations
  const createRegister = useMutation({
    mutationFn: (name: string) => sdk.client.fetch(`/admin/pos/registers`, {
      method: "POST",
      body: { name }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos_registers"] })
      setNewRegisterName("")
    }
  })

  const openShift = useMutation({
    mutationFn: (data: { cash_register_id: string, opening_float: number }) => 
      sdk.client.fetch(`/admin/pos/sessions`, {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos_registers"] })
      queryClient.invalidateQueries({ queryKey: ["pos_sessions"] })
      setOpenShiftModal(null)
      setFloatAmount("")
    }
  })

  const closeShift = useMutation({
    mutationFn: (data: { session_id: string, cash_register_id: string, closing_cash: number }) => 
      sdk.client.fetch(`/admin/pos/sessions/${data.session_id}/close`, {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos_registers"] })
      queryClient.invalidateQueries({ queryKey: ["pos_sessions"] })
      setCloseShiftModal(null)
      setClosingCash("")
    }
  })

  const registers: CashRegister[] = (registersData as any)?.registers || []
  const sessions: PosSession[] = (sessionsData as any)?.sessions || []

  // Helper to find active session for a register
  const getActiveSession = (registerId: string) => {
    return sessions.find((s: PosSession) => s.cash_register_id === registerId && s.status === "open")
  }

  return (
    <div className="flex flex-col gap-y-6">
      {/* Registers Overview */}
      <Container className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h2">POS Registers & Live Shifts</Heading>
            <Text className="text-ui-fg-subtle text-sm">Manage store cash registers, active cashier shifts, and live sales.</Text>
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="Register Name" 
              value={newRegisterName}
              onChange={(e) => setNewRegisterName(e.target.value)}
            />
            <Button 
              size="small" 
              disabled={!newRegisterName || createRegister.isPending}
              onClick={() => createRegister.mutate(newRegisterName)}
            >
              Add Register
            </Button>
          </div>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Register Name</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Active Shift Orders</Table.HeaderCell>
              <Table.HeaderCell>Active Shift Sales</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {registers.map((register: CashRegister) => {
              const activeSession = getActiveSession(register.id)
              const sessionOrders = activeSession?.orders || []
              const sessionSalesTotal = sessionOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
              
              return (
                <Table.Row key={register.id}>
                  <Table.Cell><Text weight="plus">{register.name}</Text></Table.Cell>
                  <Table.Cell>
                    <Badge color={register.status === 'open' ? 'green' : 'grey'}>
                      {register.status.toUpperCase()}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {activeSession ? (
                      <Button 
                        size="small" 
                        variant="transparent" 
                        className="text-ui-fg-interactive font-medium p-0"
                        onClick={() => setSelectedSessionOrders(activeSession)}
                      >
                        {sessionOrders.length} {sessionOrders.length === 1 ? 'Order' : 'Orders'} (View)
                      </Button>
                    ) : (
                      <Text className="text-ui-fg-muted">—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {activeSession ? (
                      <Text weight="plus">${sessionSalesTotal.toFixed(2)}</Text>
                    ) : (
                      <Text className="text-ui-fg-muted">—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-2">
                      {register.status === "closed" ? (
                        <Button size="small" onClick={() => setOpenShiftModal(register.id)}>
                          Open Shift
                        </Button>
                      ) : (
                        <>
                          <Button size="small" variant="secondary" onClick={() => setReportDrawer(activeSession?.id || null)}>
                            X-Report
                          </Button>
                          <Button size="small" variant="danger" onClick={() => setCloseShiftModal(register.id)}>
                            Close Shift
                          </Button>
                        </>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </Container>

      {/* Shift Sessions History & Orders Widget */}
      <Container className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Heading level="h2">Shift Sessions History</Heading>
            <Text className="text-ui-fg-subtle text-sm">Review previous cashier shifts, completed orders, and cash variance reconciliations.</Text>
          </div>
        </div>

        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Session ID</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Opened At</Table.HeaderCell>
              <Table.HeaderCell>Closed At</Table.HeaderCell>
              <Table.HeaderCell>Orders Count</Table.HeaderCell>
              <Table.HeaderCell>Shift Total</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Shift Details</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sessions.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-6 text-ui-fg-muted">
                  No shift sessions found.
                </Table.Cell>
              </Table.Row>
            ) : (
              sessions.map((session: PosSession) => {
                const orders = session.orders || []
                const totalRevenue = orders.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
                
                return (
                  <Table.Row key={session.id}>
                    <Table.Cell><Text className="font-mono text-xs">{session.id.slice(0, 12)}...</Text></Table.Cell>
                    <Table.Cell>
                      <Badge color={session.status === 'open' ? 'green' : 'grey'}>
                        {session.status.toUpperCase()}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="text-xs">
                        {session.opened_at ? new Date(session.opened_at).toLocaleString() : "—"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text className="text-xs">
                        {session.closed_at ? new Date(session.closed_at).toLocaleString() : "—"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text weight="plus">{orders.length}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text weight="plus">${totalRevenue.toFixed(2)}</Text>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <Button 
                        size="small" 
                        variant="secondary"
                        onClick={() => setSelectedSessionOrders(session)}
                      >
                        View Shift Orders
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                )
              })
            )}
          </Table.Body>
        </Table>
      </Container>

      {/* Shift Orders Drawer */}
      <Drawer open={!!selectedSessionOrders} onOpenChange={(open) => !open && setSelectedSessionOrders(null)}>
        <Drawer.Content aria-describedby={undefined} className="max-w-xl">
          <Drawer.Header className="border-b pb-4 border-ui-border-base">
            <div className="flex items-center justify-between">
              <div>
                <Heading level="h2" className="text-lg">Shift #{selectedSessionOrders?.id.slice(0, 8)} Orders</Heading>
                <Text className="text-ui-fg-subtle text-xs">
                  Register: <strong>{selectedSessionOrders?.cash_register?.name || 'Main Till'}</strong> • Status: <Badge color={selectedSessionOrders?.status === 'open' ? 'green' : 'grey'}>{selectedSessionOrders?.status.toUpperCase()}</Badge>
                </Text>
              </div>
            </div>
          </Drawer.Header>
          <Drawer.Body className="p-6 overflow-y-auto">
            {(!selectedSessionOrders?.orders || selectedSessionOrders.orders.length === 0) ? (
              <div className="text-center py-12 text-ui-fg-muted flex flex-col items-center gap-2">
                <Text>No orders recorded in this shift session yet.</Text>
              </div>
            ) : (
              <div className="flex flex-col gap-y-4">
                {/* Revenue Header Card */}
                <div className="bg-ui-bg-subtle p-4 rounded-xl flex items-center justify-between border border-ui-border-base">
                  <div>
                    <Text className="text-xs text-ui-fg-subtle uppercase tracking-wider font-semibold">Total Shift Sales</Text>
                    <Text weight="plus" className="text-2xl text-ui-fg-base">
                      ${selectedSessionOrders.orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toFixed(2)}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text className="text-xs text-ui-fg-subtle font-medium">Orders Count</Text>
                    <Text weight="plus" className="text-lg text-ui-fg-interactive">
                      {selectedSessionOrders.orders.length}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Text className="text-xs uppercase font-semibold text-ui-fg-subtle">Completed Shift Sales</Text>
                  <Text className="text-xs text-ui-fg-muted">Click order to view full page</Text>
                </div>

                {/* Orders List Cards */}
                <div className="flex flex-col gap-y-3">
                  {selectedSessionOrders.orders.map((order) => {
                    const itemCount = order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || order.items?.length || 1
                    
                    return (
                      <div 
                        key={order.id}
                        className="bg-ui-bg-base hover:bg-ui-bg-component-hover border border-ui-border-base rounded-lg p-4 transition-all flex items-center justify-between shadow-elevation-card-rest hover:shadow-elevation-card-hover"
                      >
                        <div className="flex flex-col gap-y-1">
                          <div className="flex items-center gap-x-2">
                            <Link 
                              to={`/pos/orders/${order.id}`}
                              className="text-ui-fg-interactive font-bold hover:underline text-sm"
                            >
                              #{order.display_id || order.id.slice(0, 6)}
                            </Link>
                            <Badge color="green" size="small">PAID</Badge>
                          </div>
                          <Text className="text-xs text-ui-fg-subtle">
                            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </Text>
                          {order.items && order.items.length > 0 && (
                            <Text className="text-xs text-ui-fg-muted truncate max-w-xs">
                              {order.items.map(i => `${i.quantity}x ${i.title}`).join(', ')}
                            </Text>
                          )}
                        </div>

                        <div className="flex items-center gap-x-4">
                          <Text weight="plus" className="text-base text-ui-fg-base">
                            ${Number(order.total || 0).toFixed(2)}
                          </Text>
                          <Button 
                            asChild
                            size="small" 
                            variant="secondary"
                          >
                            <Link to={`/pos/orders/${order.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>

      {/* POS Order Receipt Drawer */}
      <Drawer open={!!selectedPosOrder} onOpenChange={(open) => !open && setSelectedPosOrder(null)}>
        <Drawer.Content aria-describedby={undefined}>
          <Drawer.Header>
            <Heading>POS Receipt #{selectedPosOrder?.display_id || selectedPosOrder?.id.slice(0, 6)}</Heading>
            <Text className="text-ui-fg-subtle text-sm">
              Processed on {selectedPosOrder ? new Date(selectedPosOrder.created_at).toLocaleString() : ''}
            </Text>
          </Drawer.Header>
          <Drawer.Body className="p-6">
            {selectedPosOrder && (
              <div className="flex flex-col gap-y-6 bg-ui-bg-subtle p-6 rounded-lg font-mono text-sm">
                <div className="text-center border-b pb-4 border-ui-border-base">
                  <Heading level="h2" className="text-base font-bold">STORE POS RECEIPT</Heading>
                  <Text className="text-xs text-ui-fg-subtle">Register Sale • In-Store Counter</Text>
                </div>

                {/* Items List */}
                <div className="flex flex-col gap-y-2 border-b pb-4 border-ui-border-base">
                  <Text weight="plus" className="text-xs uppercase text-ui-fg-subtle">Purchased Items</Text>
                  {selectedPosOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <div>
                        <span>{item.quantity}x </span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <span>${Number(item.total || item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="flex flex-col gap-y-2 border-b pb-4 border-ui-border-base text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${Number(selectedPosOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {Number(selectedPosOrder.discount_total || 0) > 0 && (
                    <div className="flex justify-between text-ui-fg-interactive">
                      <span>Discount:</span>
                      <span>-${Number(selectedPosOrder.discount_total).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${Number(selectedPosOrder.tax_total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-ui-border-base">
                    <span>TOTAL PAID:</span>
                    <span>${Number(selectedPosOrder.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="flex flex-col gap-y-1 text-xs">
                  <Text weight="plus" className="text-xs uppercase text-ui-fg-subtle">Payment Method</Text>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge color="green">PAID & CAPTURED</Badge>
                  </div>
                </div>
              </div>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>

      {/* Open Shift Modal */}
      <FocusModal open={!!openShiftModal} onOpenChange={(open) => !open && setOpenShiftModal(null)}>
        <FocusModal.Content aria-describedby={undefined}>
          <FocusModal.Header>
            <Button variant="transparent" onClick={() => setOpenShiftModal(null)}>Cancel</Button>
            <Button 
              disabled={!floatAmount || openShift.isPending}
              onClick={() => openShift.mutate({ cash_register_id: openShiftModal!, opening_float: Number(floatAmount) })}
            >
              Start Shift
            </Button>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center justify-center py-16">
            <div className="max-w-md w-full flex flex-col gap-y-4">
              <Heading>Open POS Shift</Heading>
              <Text className="text-ui-fg-subtle">Enter the starting cash float for this register.</Text>
              
              <div className="flex flex-col gap-y-2 mt-4">
                <Label>Opening Float Amount</Label>
                <Input 
                  type="number" 
                  value={floatAmount} 
                  onChange={(e) => setFloatAmount(e.target.value)} 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      {/* Close Shift Modal */}
      <FocusModal open={!!closeShiftModal} onOpenChange={(open) => !open && setCloseShiftModal(null)}>
        <FocusModal.Content aria-describedby={undefined}>
          <FocusModal.Header>
            <Button variant="transparent" onClick={() => setCloseShiftModal(null)}>Cancel</Button>
            <Button 
              variant="danger"
              disabled={!closingCash || closeShift.isPending}
              onClick={() => {
                const session = getActiveSession(closeShiftModal!)
                if (session) {
                  closeShift.mutate({ 
                    session_id: session.id, 
                    cash_register_id: closeShiftModal!, 
                    closing_cash: Number(closingCash) 
                  })
                }
              }}
            >
              Confirm Close Shift
            </Button>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center justify-center py-16">
            <div className="max-w-md w-full flex flex-col gap-y-4">
              <Heading>Close POS Shift</Heading>
              <Text className="text-ui-fg-subtle">Count the drawer and enter the final cash amount. This will generate the final Z-Report.</Text>
              
              <div className="bg-ui-bg-subtle p-4 rounded-lg flex flex-col gap-y-2 mt-4">
                <div className="flex justify-between">
                  <Text weight="plus">Opening Float:</Text>
                  <Text>${getActiveSession(closeShiftModal || "")?.opening_float || 0}</Text>
                </div>
                <div className="flex justify-between border-t pt-2 border-ui-border-base">
                  <Text weight="plus">Shift Orders Revenue:</Text>
                  <Text>
                    ${(getActiveSession(closeShiftModal || "")?.orders || []).reduce((acc, o) => acc + Number(o.total || 0), 0).toFixed(2)}
                  </Text>
                </div>
              </div>

              <div className="flex flex-col gap-y-2 mt-4">
                <Label>Actual Closing Cash</Label>
                <Input 
                  type="number" 
                  value={closingCash} 
                  onChange={(e) => setClosingCash(e.target.value)} 
                  placeholder="0.00" 
                />
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      {/* X-Report Drawer */}
      <Drawer open={!!reportDrawer} onOpenChange={(open) => !open && setReportDrawer(null)}>
        <Drawer.Content aria-describedby={undefined}>
          <Drawer.Header>
            <Heading>X-Report (Mid-Shift)</Heading>
            <Text className="text-ui-fg-subtle text-sm">Generated at {new Date().toLocaleString()}</Text>
          </Drawer.Header>
          <Drawer.Body className="p-4">
            {reportData ? (
              <div className="flex flex-col gap-y-6">
                
                {/* Cash Drawer Status */}
                <div className="flex flex-col gap-y-2 bg-ui-bg-subtle p-4 rounded-lg">
                  <Heading level="h3" className="text-sm">Cash Drawer Status</Heading>
                  <div className="flex justify-between border-b pb-2 border-ui-border-base">
                    <Text>Opening Float:</Text>
                    <Text>${sessions.find((s: PosSession) => s.id === reportDrawer)?.opening_float || 0}</Text>
                  </div>
                  <div className="flex justify-between border-b pb-2 border-ui-border-base">
                    <Text>Cash Sales:</Text>
                    <Text>${(reportData as any).report?.total_sales || 0}</Text>
                  </div>
                  <div className="flex justify-between pt-2 font-bold">
                    <Text weight="plus">Expected Cash in Drawer:</Text>
                    <Text weight="plus">${((sessions.find((s: PosSession) => s.id === reportDrawer)?.opening_float || 0) + ((reportData as any).report?.total_sales || 0)).toFixed(2)}</Text>
                  </div>
                </div>

                {/* Sales Summary */}
                <div className="flex flex-col gap-y-2">
                  <Heading level="h3" className="text-sm">Sales Summary</Heading>
                  <div className="flex justify-between border-b pb-2 border-ui-border-base">
                    <Text>Total Revenue:</Text>
                    <Text>${(reportData as any).report?.total_sales || 0}</Text>
                  </div>
                  <div className="flex justify-between border-b pb-2 border-ui-border-base">
                    <Text>Tax Total:</Text>
                    <Text>${(reportData as any).report?.tax_total || 0}</Text>
                  </div>
                </div>

              </div>
            ) : (
              <Text>Loading report...</Text>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "POS Management",
  icon: () => <span>POS</span>,
})

export default PosManagementPage
