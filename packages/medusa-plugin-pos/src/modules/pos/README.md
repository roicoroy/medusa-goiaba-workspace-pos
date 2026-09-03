# Point of Sale (POS) Module & Architecture

This custom Medusa module and backend architecture provides the foundational data models, business logic, workflows, and API endpoints for our Point of Sale system. It manages the full lifecycle of cash registers, cashier sessions/shifts, and interim/end-of-day reporting (X/Z Reports).

---

## 1. Data Models (`src/modules/pos/models`)

- **Cash Register (`cash_register.ts`)**
  - Represents a physical or logical till inside a store.
  - Fields: `id`, `name`, `status` (`open` | `closed`), timestamps.
- **POS Session (`pos_session.ts`)**
  - Represents a cashier's shift on a specific cash register.
  - Fields: `id`, `cash_register_id`, `opened_by`, `closed_by`, `opening_cash`, `closing_cash`, `opened_at`, `closed_at`, `status` (`open` | `closed`).
  - Linked to `orders` processed during the active session.
- **POS Report (`pos_report.ts`)**
  - Represents snapshot financial reports generated for a session.
  - Fields: `id`, `session_id`, `type` (`x_report` | `z_report`), `total_sales`, `tax_total`, `payment_breakdown`, timestamps.

---

## 2. API Endpoints

### Store POS API (`/store/pos/...`)
Endpoints dedicated to cashier interactions from the POS client application:

| Method | Path | Description | Workflow / Step |
| :--- | :--- | :--- | :--- |
| `GET` | `/store/pos/registers` | List all available cash registers | Direct query |
| `GET` | `/store/pos/registers/:id` | Retrieve details of a specific cash register | Direct query |
| `POST` | `/store/pos/sessions` | Open a new register session / cashier shift | `openPosSessionWorkflow` |
| `POST` | `/store/pos/sessions/:id/close` | Close an active shift and generate a Z-Report | `closePosSessionWorkflow` |

### Admin POS API (`/admin/pos/...`)
Endpoints dedicated to back-office management, auditing, and store administration:

| Method | Path | Description | Workflow / Step |
| :--- | :--- | :--- | :--- |
| `POST` | `/admin/pos/registers` | Create and provision a new cash register | Direct mutation |
| `GET` | `/admin/pos/sessions` | List all POS sessions with audit details | Direct query |
| `POST` | `/admin/pos/sessions/:id/close` | Force-close a session from the back-office | `closePosSessionWorkflow` |
| `POST` | `/admin/pos/sessions/:id/reports/x` | Generate an interim **X-Report** snapshot | `generateXReportWorkflow` |

---

## 3. Workflows (`src/workflows/pos/...`)

Orchestrated with `@medusajs/framework/workflows-sdk`:

- **`openPosSessionWorkflow`**: Creates a new session entry and updates the corresponding cash register status to `open`.
- **`closePosSessionWorkflow`**: Aggregates all linked order sales and taxes, generates an immutable `z_report`, sets `closing_cash`, marks the session as closed, and sets the register status back to `closed`.
- **`generateXReportWorkflow`**: Calculates current order sales/tax totals without closing the active session, creating an `x_report` audit snapshot.

