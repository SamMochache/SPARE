# AutoParts Pro

AutoParts Pro is an automotive parts shop management application. The repository contains a React, TypeScript, and Vite frontend and a Django REST API backend under active staged development.

> **Integration status:** JWT authentication, product catalogue, branch-scoped inventory, purchasing, sales history/returns, POS checkout, dashboard reporting, and the customer directory are connected to Django. The POS customer picker still uses prototype browser data and is the next customer-integration task. Customer credit limits are stored for reference only; credit sales, balances, and statements are not implemented. Payment-provider verification and VAT/tax persistence remain future work. Do not treat the application as production-ready until remaining integrations and end-to-end tests are complete.

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

Set `VITE_API_BASE_URL` in `frontend/.env.local` to point to Django (default: `http://localhost:8000`). Sign in with a backend user created by an administrator.

## Customer directory

The Customers screen uses the authenticated Django API for search, create, edit, and archive operations. Customer records include name, phone, email, retail/wholesale type, KRA PIN, profile discount, and an informational credit limit. The API uses soft-archive so old customer records are not permanently deleted. Active phone numbers must be unique when provided.

- `GET /api/v1/customers/?search=...` — paginated active customer directory.
- `POST /api/v1/customers/` — create a customer.
- `GET/PATCH /api/v1/customers/{id}/` — retrieve or update a customer.
- `DELETE /api/v1/customers/{id}/` — archive a customer.
- `POST /api/v1/customers/{id}/restore/` — restore an archived customer.

All endpoints require JWT authentication. Read access is available to active staff; customer mutations are limited to owners, managers, and cashiers. Credit limits are not a credit accounting ledger: this stage does not create credit sales, payments, outstanding balances, or statements. The POS customer picker still uses local prototype data and will be connected to this API in a follow-up stage.

## Live dashboard and reporting

The dashboard reads Django reporting endpoints for the selected date range and shows API-backed net sales, sales trend, inventory valuation, low-stock positions, top-selling products, and recent sales. Branch scope is enforced server-side.

- `GET /api/v1/reports/dashboard/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET /api/v1/reports/sales/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET /api/v1/reports/inventory/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- `GET /api/v1/reports/top-products/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Revenue is based on recorded sales/refunds and does not verify payment settlement. Inventory valuation uses current catalogue cost prices. Top-product sales values are before sale-level discounts and are not profit.

## Inventory, purchasing and sales

Inventory uses branch-scoped stock balances and movement history; stock receipts and adjustments update the balance and audit ledger transactionally. Purchasing supports supplier and purchase-order APIs, order placement, and partial/complete goods receipts. Sales history and returns are API-backed, and checkout validates prices/totals and stock on the server.

- `GET /api/v1/stock-balances/`, `GET /api/v1/stock-movements/`
- `POST /api/v1/stock/receive/`, `POST /api/v1/stock/adjust/`
- `GET/POST /api/v1/suppliers/`, `GET/POST /api/v1/purchase-orders/`
- `POST /api/v1/sales/checkout/`, `GET /api/v1/sales/`, `POST /api/v1/sales/{id}/returns/`

M-Pesa is a recorded payment method only; the UI does not initiate or verify real payments or refunds. Fiscal eTIMS receipts, VAT calculation, payment settlement, and credit accounting are not implemented.

## Backend stack and checks

- Python, Django, Django REST Framework, and Neon-hosted PostgreSQL.
- JWT authentication, role permissions, OpenAPI schema, and Swagger docs.
- Use Decimal money fields and server-side validation; never trust browser totals.
- Run backend checks from `backend/`: `python manage.py check`, `python manage.py makemigrations --check --dry-run`, and `python manage.py test`.
- Run frontend checks from `frontend/`: `npm run build` and `npm run lint`.

No CI/CD workflows are part of this implementation plan. Each stage is developed on a feature branch and reviewed before merging.
