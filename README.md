# AutoParts Pro

AutoParts Pro is an automotive parts shop management application. The repository contains a React, TypeScript, and Vite frontend and a Django REST API backend under active staged development.

> **Integration status:** JWT authentication, product catalogue, and branch-scoped inventory screens are connected to Django. POS checkout, dashboard reporting, purchasing, and customer records still contain prototype behavior. M-Pesa checkout is a simulation and does not initiate or verify real transactions. Do not treat the application as production-ready until remaining integrations and end-to-end tests are complete.

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
5. **POS and financial integrity:** transactional checkout, server-side totals, stock checks, idempotency, sale history, return/refund audit records. External payment-provider verification and settlement remain future work.
6. **Reporting:** dashboard KPIs, daily sales, inventory valuation/low-stock, and top-product reports.
7. **Remaining frontend integrations:** live POS, dashboard, purchases, sales history, customer records, and reports.

Each stage should be implemented on a focused feature branch and reviewed before merging. No CI/CD workflows are part of this implementation plan.
