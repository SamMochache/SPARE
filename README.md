# AutoParts Pro

AutoParts Pro is an automotive parts shop management application. The repository currently contains a React, TypeScript, and Vite frontend prototype. A Django REST API backend is being developed on a separate feature branch.

> **Prototype and integration status:** The existing frontend uses sample data and browser storage. The backend roadmap below describes planned work; do not treat API, inventory, payment, or reporting capabilities as production-ready until implemented, tested, and documented. The current M-Pesa checkout is a simulation and does not initiate or verify real transactions.

## Repository layout

- `frontend/` — React + TypeScript + Vite application.
- `backend/` — planned Django + Django REST Framework API (being added in staged work).

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

The frontend's available routes include `/` (dashboard), `/pos` (simulated point of sale), and `/products` (sample product catalog). Other sidebar modules are planned.

## Backend technology and architecture

The intended backend stack is:

- Python and Django
- Django REST Framework (DRF)
- Neon-hosted PostgreSQL, configured via environment variables
- JWT-based API authentication
- OpenAPI schema and browsable API documentation
- Automated tests for permissions, inventory integrity, sales, purchasing, and financial calculations

The backend should be modular, with Django apps for accounts/core, catalog, customers, suppliers, inventory, purchasing, sales, payments, and reporting. Keep secrets out of source control and provide an `.env.example` containing placeholders only.

### API conventions

- Version endpoints under `/api/v1/`.
- Validate input and enforce object-level permissions server-side.
- Use decimal arithmetic for money; never trust totals supplied by the browser.
- Wrap sale and stock-changing operations in database transactions and lock affected inventory rows to prevent overselling.
- Record inventory movements and audit-relevant actions rather than silently overwriting history.
- Support idempotency for retryable sale/payment operations.
- Purchases increase sellable stock only when goods are received; support partial receipts.
- Keep payment providers behind an abstraction. Do not claim M-Pesa integration is live until Daraja credentials, callbacks, signature/validation, idempotency, and end-to-end tests are implemented.
- Do not store card data or secrets in application logs.

## Backend delivery roadmap

1. **Foundation:** Django project, settings split, dependency management, environment configuration, Neon connection, health endpoint, OpenAPI, and CI.
2. **Authentication and access control:** custom user model from the first migration, JWT, roles, permissions, and branch-scoped access where applicable.
3. **Business records:** product categories, products/SKUs, customers, suppliers, validation, pagination, filtering, and search.
4. **Inventory and purchasing:** stock locations, movement ledger, adjustments, purchase orders, goods receipt, partial receipt, and supplier balances.
5. **POS and financial integrity:** transactional checkout, server-side totals, discounts, stock checks, idempotency, sale history, returns/refunds, and payment records.
6. **Reporting and integration:** dashboard/report endpoints, API documentation, frontend API client integration, tests, and deployment instructions.

Each stage should be implemented on a focused feature branch, tested, and reviewed before merging. Track implementation status in GitHub issues; roadmap items are not complete merely because they are listed here.

## Local backend setup (when the backend directory is available)

Use the backend-specific README and `.env.example` as the source of truth for exact commands and variables. Never commit a real `.env`, database URL, API key, JWT secret, or payment-provider credential.

## Development checks

- Frontend: run `npm run build` and `npm run lint` from `frontend/`.
- Backend: run the documented Django checks and test suite from `backend/` once the backend setup has landed.
- Document migrations, environment variables, API changes, and any changes to business rules in the same pull request.
