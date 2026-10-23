# AutoParts Pro

AutoParts Pro is an automotive parts shop management application. The repository contains a React, TypeScript, and Vite frontend and a Django REST API backend under active staged development.

> **Integration status:** JWT authentication, product catalogue, branch-scoped inventory, purchasing (suppliers, purchase orders, and goods receipts), sales history/returns, POS checkout, and dashboard reporting are connected to Django. Customer records still contain prototype behavior. Payment-provider verification and split/credit checkout are not connected. M-Pesa checkout is a simulation and does not initiate or verify real transactions. Do not treat the application as production-ready until remaining integrations and end-to-end tests are complete.

## Repository layout

- `frontend/` — React + TypeScript + Vite application.
- `backend/` — Django + Django REST Framework API.

## Frontend quick start

Requirements: Node.js 18+ and npm.

```bash
cd frontend
npm install
npm run dev
```

Other commands, run from `frontend/`:

| Command | Description |
| --- | --- |
| `npm run build` | Build the frontend for production. |
| `npm run preview` | Preview the latest production build. |
| `npm run lint` | Run ESLint. |

The frontend uses `VITE_API_BASE_URL` in `frontend/.env.local` to point to Django (default: `http://localhost:8000`). Sign in with a backend user created by an administrator. Product catalogue data and inventory stock balances are loaded from the API. Product fields not represented by the backend schema (such as VAT rate, image, reorder level, and some fitment fields) are not yet first-class persisted fields.

## Live dashboard and reporting

The dashboard now reads the Django reporting endpoints for the selected date range and shows API-backed net sales, sales trend, inventory valuation, low-stock positions, top-selling products, and recent sales. Date filters are sent to the backend. Reporting permissions and branch scope are enforced server-side: owners/superusers may query all branches or a selected active branch, while other users are restricted to their assigned branch.

- `GET /api/v1/reports/dashboard/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET /api/v1/reports/sales/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET /api/v1/reports/inventory/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET /api/v1/reports/top-products/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Revenue uses recorded sales and recorded refunds; it is not payment settlement verification. Inventory valuation uses current catalogue cost prices rather than historical purchase cost. Top-product sales values are line totals before sale-level discounts and do not represent profit.

## Purchasing screen

The Purchasing & Restocking screen is connected to Django suppliers and purchase orders. Authorized staff can create suppliers, create draft purchase orders with multiple product lines, mark drafts as ordered, cancel eligible orders, and record partial or complete goods receipts. Receipt operations update branch stock balances and append inventory movement records atomically in the backend.

- `GET/POST /api/v1/suppliers/` — supplier directory and supplier creation.
- `GET/POST /api/v1/purchase-orders/` — list and create purchase orders.
- `POST /api/v1/purchase-orders/{id}/order/` — submit a draft order.
- `POST /api/v1/purchase-orders/{id}/receive/` — receive quantities against purchase-order lines.
- `POST /api/v1/purchase-orders/{id}/cancel/` — cancel an eligible order.

The backend enforces branch scope, purchasing roles, valid order states, active suppliers/products, and outstanding receipt quantities. Supplier invoice matching, accounts payable, expected delivery dates, damaged-quantity workflows, and purchase-order editing UI are not included yet.

## Sales history and returns

The Sales & Orders screen reads transaction history from Django, supports receipt-number, status, payment-method and date filters, and displays sale lines and refund totals. Authorized owners, managers, and cashiers can record partial or full returns. The backend validates quantities and refund totals, updates branch stock, and appends return movements atomically. Sales and returns remain branch-scoped by the API.

- `GET /api/v1/sales/` — list sales; supports `sale_number`, `status`, `payment_method`, `from`, and `to` filters.
- `GET /api/v1/sales/{id}/` — sale detail.
- `POST /api/v1/sales/{id}/returns/` — record a return using sale line IDs and quantities.

M-Pesa remains a recorded payment method only; no real payment or refund is initiated or verified by this UI.

## Inventory screen

Inventory Management uses the branch-scoped endpoints to display current balances and movement history. Owners can select any active branch; other users only receive their assigned branch. Owner stock receipts and adjustments include the selected branch ID. The backend validates permissions, prevents negative stock, and updates the balance and append-only movement ledger atomically.

- `GET /api/v1/auth/branches/` — active branches visible to the authenticated user.
- `GET /api/v1/stock-balances/?branch={id}` — current balances for a branch.
- `GET /api/v1/stock-movements/?branch={id}` — movement history.
- `POST /api/v1/stock/receive/` — receive stock.
- `POST /api/v1/stock/adjust/` — signed stock adjustment with a reason.

Transfers between branches, approval workflows, and full purchase-order receipt integration remain future work.

## Backend stack and conventions

- Python, Django, and Django REST Framework.
- Neon-hosted PostgreSQL configured through environment variables.
- JWT authentication, role-based permissions, and branch-scoping controls.
- Versioned endpoints under `/api/v1/`, OpenAPI schema, and Swagger documentation.
- Decimal arithmetic for money; never trust totals supplied by the browser.
- Keep stock movement history and financial records auditable. Use database transactions and row locks for stock-changing operations.
- Keep secrets out of source control. The M-Pesa provider must remain marked as a simulation until Daraja credentials, callback validation, idempotency, and end-to-end tests are implemented.

See [backend/README.md](backend/README.md) for setup, API endpoints, permissions, and checks.

## Delivery roadmap

1. **Foundation and access control:** Django project, environment configuration, Neon support, JWT, roles, and branch model.
2. **Product catalogue:** categories, SKUs, prices, filtering, pagination, and role-protected CRUD/archive endpoints.
3. **Inventory:** branch stock balances, append-only movement ledger, transactional receipts/adjustments, and live frontend integration.
4. **Purchasing:** supplier management, draft/order/cancel workflows, partial goods receipt, and stock-ledger integration. Supplier invoicing and accounts payable remain future work.
5. **POS and financial integrity:** transactional checkout, server-side prices/totals, stock checks, idempotency, sale history, return/refund audit records. Payment-provider verification, payment references, split payments, customer credit accounting, VAT/tax persistence, and settlement remain future work.
6. **Reporting:** dashboard KPIs, daily sales, inventory valuation/low-stock, and top-product reports.
7. **Remaining frontend integrations:** customer records and full end-to-end validation.

Each stage should be implemented on a focused feature branch and reviewed before merging. No CI/CD workflows are part of this implementation plan.
