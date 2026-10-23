# AutoParts Pro

AutoParts Pro is an automotive parts shop management application. The repository contains a React, TypeScript, and Vite frontend and a Django REST API backend under active staged development.

 > **Integration status:** JWT authentication and the product catalogue API are connected. POS, dashboard reporting, purchasing, customer records, and stock-changing workflows still contain prototype behavior. M-Pesa checkout is a simulation and does not initiate or verify real transactions. Do not treat the application as production-ready until remaining integrations and end-to-end tests are complete.

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

The frontend includes a live product catalogue backed by Django, plus prototype dashboard and simulated POS routes. Configure `VITE_API_BASE_URL` in `frontend/.env.local` to point to the Django API (default: `http://localhost:8000`). Sign in with a backend user created by an administrator. The catalogue displays backend product records and current stock balances; opening stock must be recorded separately through the inventory workflows. Product fields not represented by the backend schema (such as VAT rate, image, reorder level, and some fitment fields) are not yet first-class persisted fields.

## Backend stack and conventions

- Python, Django, and Django REST Framework.
- Neon-hosted PostgreSQL configured through environment variables.
- JWT authentication, role-based permissions, and reusable branch-scoping controls.
- Versioned endpoints under `/api/v1/`, OpenAPI schema, and Swagger documentation.
- Decimal arithmetic for money; never trust totals supplied by the browser.
- Keep stock movement history and financial records auditable. Use database transactions and row locks for stock-changing operations.
- Keep secrets out of source control. The M-Pesa provider must remain marked as a simulation until Daraja credentials, callback validation, idempotency, and end-to-end tests are implemented.

See [backend/README.md](backend/README.md) for setup, API endpoints, permissions, and checks.

## Delivery roadmap

1. **Foundation and access control:** Django project, environment configuration, Neon support, JWT, roles, and branch model — implemented in staged PRs.
2. **Product catalogue:** categories, SKUs, prices, filtering, pagination, and role-protected CRUD/archive endpoints — implemented in PR #11.
3. **Inventory:** branch stock balances, append-only movement ledger, transactional receipts/adjustments, and non-negative stock integrity — implemented in PR #12.
4. **Purchasing:** supplier management, draft/order/cancel workflows, partial goods receipt, and stock-ledger integration — implemented in PR #13. Supplier invoicing and accounts payable remain future work.
5. **POS and financial integrity:** transactional checkout, server-side totals, stock checks, idempotency, sale history, return/refund audit records — implemented in PR #14. External payment-provider verification and settlement remain future work.
6. **Reporting:** dashboard KPIs, daily sales, inventory valuation/low-stock, and top-product reports — implemented in PR #15.
7. **Frontend API/auth foundation:** shared HTTP client, JWT login/refresh/logout, protected routes, and environment configuration — implemented in PR #16. Product, POS, inventory, and dashboard screens still require live-data wiring.

Each stage should be implemented on a focused feature branch and reviewed before merging. No CI/CD workflows are part of this implementation plan.
