<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa POS Plugin (Point of Sale)
</h1>

<h4 align="center">
  Decoupled Point of Sale Module, Workflows, Store/Admin APIs & Admin UI for Medusa v2
</h4>

---

## 📖 Overview

The `medusa-plugin-pos` package provides an end-to-end **Point of Sale (POS)** engine for Medusa v2. It includes data models for physical registers and cashier shifts, automated checkout workflows (instant capture, inventory deduction, and auto-fulfillment), end-of-day Z-report generation, admin notification triggers, and dedicated Medusa Admin dashboard extensions.

---

## ✨ Features

- **Cash Registers & Shift Sessions**: Manage physical counter terminals and track active/closed cashier shifts with opening floats and closing cash reconciliations.
- **Automated POS Checkout Lifecycle**:
  - Automatically captures payment authorized via POS (Stripe Terminal, Manual Cash, etc.).
  - Deducts inventory and executes counter fulfillment.
  - Automatically completes Medusa orders.
- **Z-Report Generation**: Calculates total sales, cash collected, card revenue, discounts, and cash discrepancies (over/short) on shift close.
- **Admin Notifications**: Automatically triggers feed notifications to store managers on POS sales and shift closings.
- **Admin Dashboard UI Extension**:
  - Dedicated POS Management Hub at `/app/pos`.
  - Cashier shift monitoring and session breakdown drawer.
  - Deep-linkable POS Order Details view at `/app/pos/orders/:id`.

---

## 🏛️ Architecture & Design

```
packages/medusa-plugin-pos
├── src/
│   ├── admin/                    # Medusa Admin UI extensions
│   │   ├── routes/
│   │   │   └── pos/              # Main POS hub & /orders/:id view
│   │   └── lib/                  # Admin API client helpers
│   ├── api/                      # REST API routes
│   │   ├── admin/pos/            # Admin endpoints (registers, sessions, reports)
│   │   └── store/pos/            # Storefront endpoints (cashier shift open/close, active status)
│   ├── links/                    # Medusa v2 Dynamic Links (Links pos_session to order and user)
│   ├── modules/
│   │   └── pos/                  # Custom DML Data Models, Service & Migrations
│   │       ├── models/           # CashRegister, PosSession, PosReport
│   │       └── service.ts        # PosModuleService
│   └── workflows/
│       └── pos/                  # Workflows for Open Session, Close Session, POS Checkout
└── package.json
```

### 1. Data Models (`src/modules/pos/models`)

- **`CashRegister` (`pos_register`)**: Represents a physical counter terminal or register device (Name, Status: `open` | `closed`).
- **`PosSession` (`pos_session`)**: Represents a cashier's active shift session (Cash register ID, Opening float, Closing cash, Opened at, Closed at, Status: `open` | `closed`).
- **`PosReport` (`pos_report`)**: Z-report generated upon shift closure containing total sales, cash totals, card totals, discounts, refund amounts, and cash discrepancy.

### 2. Module Links (`src/links`)

- **`pos-session-order.ts`**: Links `PosModule.linkable.posSession` $\leftrightarrow$ `OrderModule.linkable.order`.
- **`pos-session-user.ts`**: Links `PosModule.linkable.posSession` $\leftrightarrow$ `UserModule.linkable.user`.

### 3. Workflows (`src/workflows/pos`)

- **`openPosSessionWorkflow`**: Validates register status, creates new `PosSession`, and links active user.
- **`closePosSessionWorkflow`**: Calculates order totals for the session, closes shift, computes cash difference, generates `PosReport`, and sends a manager notification.
- **`completePosOrderWorkflow`**: Coordinates payment capture, automatic order fulfillment, order completion, session linking, and dispatching a `pos-sale` notification.

---

## 🚀 Installation & Configuration

### 1. Register in `medusa-config.ts`

Add the plugin to your Medusa backend application's `medusa-config.ts`:

```ts
import { defineConfig } from "@medusajs/framework/utils"

module.exports = defineConfig({
  plugins: [
    {
      resolve: "medusa-plugin-pos",
      options: {},
    },
  ],
})
```

### 2. Run Migrations

```bash
npx medusa db:migrate
```

---

## 📡 API Reference

### Store API (Cashier Frontend)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/store/pos/registers` | List cash registers and active sessions |
| `POST` | `/store/pos/registers` | Create a new cash register |
| `POST` | `/store/pos/sessions` | Open a cashier shift with opening float |
| `POST` | `/store/pos/sessions/:id/close` | Close shift, provide closing cash, generate Z-report |
| `POST` | `/store/pos/carts/:id/complete` | Complete POS checkout with auto-capture and fulfillment |

### Admin API (Backoffice)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/pos/sessions` | List shift sessions with linked orders & users |
| `GET` | `/admin/pos/sessions/:id` | Get details and Z-report for a specific session |
| `GET` | `/admin/pos/orders/:id` | Get POS order details (payment method, counter items, cashier) |
| `GET` | `/admin/pos/registers` | List all registered terminals |

---

## 🛠️ Development & Building

Within the monorepo:

```bash
# Build plugin bundle (.medusa/server)
pnpm run build

# Develop plugin in watch mode
pnpm run dev
```
