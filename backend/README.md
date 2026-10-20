# AutoParts Pro API

Django REST Framework backend for AutoParts Pro. The foundation includes environment-based settings, a custom user model, JWT authentication, health checks, OpenAPI docs, role permissions, and branch-scoped access primitives. The product catalogue, branch-scoped inventory, supplier, and purchase-order APIs are implemented in staged PRs; transactional POS checkout, sale history, and return workflows are implemented; external payment-provider verification remains future work.

## Requirements

- Python 3.11+
- PostgreSQL (Neon recommended for hosted development)
- pip and a virtual environment

## Local setup

From the repository root:

```bash
cd backend
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell:
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
```

Set `DJANGO_SECRET_KEY` to a long random value. Set `DATABASE_URL` to the Neon connection string (include SSL settings as provided by Neon). If `DATABASE_URL` is omitted, settings fall back to local SQLite for a quick smoke test only.

Generate database migrations after pulling model changes, then migrate and create an administrator:

```bash
python manage.py makemigrations accounts
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The custom `accounts.User` model must be present before the first migration. If you already created and applied an initial migration in a local or hosted database, do not regenerate or replace it; create a new migration and review the plan before applying it.

## Endpoints

### Authentication and system

- `GET /api/v1/health/` — public health check.
- `POST /api/v1/auth/token/` — obtain JWT access and refresh tokens with Django username/password.
- `POST /api/v1/auth/token/refresh/` — refresh an access token.
- `POST /api/v1/auth/logout/` — blacklist a refresh token to revoke further refreshes.
- `GET/PATCH /api/v1/auth/me/` — view/update the authenticated user's first name, last name, and email. Username and role are read-only.
- `GET /api/schema/` — OpenAPI schema.
- `GET /api/docs/` — Swagger UI.
- `/admin/` — Django admin for authorized administrators.

### Product catalogue

All catalogue endpoints require authentication. Any active authenticated staff member may read the catalogue. Only owners, managers, and inventory staff may create, update, or archive catalogue records.

- `GET /api/v1/categories/` — list categories.
- `POST /api/v1/categories/` — create a category (owner/manager/inventory).
- `GET /api/v1/categories/{id}/` — category details.
- `PATCH /api/v1/categories/{id}/` — update a category.
- `DELETE /api/v1/categories/{id}/` — archive a category.
- `GET /api/v1/products/` — list products.
- `POST /api/v1/products/` — create a product.
- `GET /api/v1/products/{id}/` — product details.
- `PATCH /api/v1/products/{id}/` — update a product.
- `DELETE /api/v1/products/{id}/` — archive a product rather than permanently deleting it.

Product list query parameters:

- `search` — case-insensitive match against name, SKU, brand, barcode, and description.
- `category` — filter by category ID.
- `brand` — case-insensitive brand filter.
- `min_price` and `max_price` — filter on selling price.
- `is_active=true|false` — include active or archived records. Without this parameter, only active records are returned.
- `ordering` — one of `name`, `sku`, `brand`, `cost_price`, `selling_price`, `created_at`, or `updated_at`; prefix with `-` for descending order.
- `page` — page number. Results use the configured page-number pagination (25 per page by default).

Example: `GET /api/v1/products/?search=filter&brand=bosch&min_price=100&max_price=2000&page=1`.

Prices use decimal fields; the API validates non-negative amounts and case-insensitive duplicate SKUs/barcodes. Product records intentionally do not contain a stock quantity: stock-on-hand belongs in the future inventory ledger, separated by branch. Catalogue records are shared product definitions; branch restrictions will apply to branch-owned inventory and transaction records.

The logout endpoint expects the refresh token in the request body as `{"refresh": "<refresh-token>"}`. Clients should also discard their local access token on logout; already-issued access tokens remain valid until their short expiry.

### Inventory and stock

All inventory endpoints require authentication. Any active staff member can read stock for their assigned branch; only owners, managers, and inventory staff can receive or adjust stock.

- `GET /api/v1/stock-balances/` — paginated current stock by branch and product; optional `branch` and `product` filters.
- `GET /api/v1/stock-balances/{id}/` — one stock balance.
- `GET /api/v1/stock-movements/` — immutable movement ledger; optional `branch`, `product`, `movement_type`, and `reference` filters.
- `GET /api/v1/stock-movements/{id}/` — one ledger entry.
- `POST /api/v1/stock/receive/` — receive supplier/opening stock. Body: `{"product": 1, "quantity": 12, "reason": "Supplier delivery", "reference": "GRN-100"}`.
- `POST /api/v1/stock/adjust/` — correct a count using a non-zero signed `quantity_delta`. Body: `{"product": 1, "quantity_delta": -2, "reason": "Damaged stock"}`.

Owners/superusers must include a valid active `branch` ID in write requests. Other staff are automatically scoped to their assigned active branch; attempts to select another branch are rejected. Stock-changing operations use a database transaction and lock the product row, update the current balance, and append an audit movement atomically. Stock cannot fall below zero. Movement rows are read-only through the API and Django admin.

The `sale` and `return` movement types are reserved for the future checkout/returns workflow; this inventory API does not yet implement sales or payment processing.

### Suppliers and purchasing

Supplier records are shared across branches. Supplier list/create/update/archive endpoints require authentication; only owners, managers, and inventory staff may mutate supplier records. Deleting a supplier archives it to preserve purchase history.

- `GET /api/v1/suppliers/` — list active suppliers; supports `search` and `is_active=true|false`.
- `POST /api/v1/suppliers/` — create a supplier.
- `GET/PATCH/DELETE /api/v1/suppliers/{id}/` — retrieve, update, or archive a supplier.
- `GET /api/v1/purchase-orders/` — list purchase orders visible to the user's branch; owners can see all branches.
- `POST /api/v1/purchase-orders/` — create a draft order with a supplier, branch, order number, and item lines.
- `GET/PATCH /api/v1/purchase-orders/{id}/` — view or edit a draft purchase order.
- `POST /api/v1/purchase-orders/{id}/order/` — place a draft order.
- `POST /api/v1/purchase-orders/{id}/receive/` — receive all or part of one or more order lines.
- `POST /api/v1/purchase-orders/{id}/cancel/` — cancel an eligible order before any items have been received.

Create a purchase order with `order_number`, `supplier` (ID), `branch` (ID), and `items` such as `[{"product": 1, "quantity_ordered": 20, "unit_cost": "850.00"}]`. Non-owner staff can only use their assigned branch. Draft orders must be explicitly placed before receiving goods.

For a partial receipt, send `{"items": [{"item_id": 1, "quantity": 8}]}` to the receive action. Each receipt atomically increments the matching branch's stock, increments the purchase line's received quantity, and creates a stock movement referencing the purchase order number. Over-receipt is rejected; the order becomes partially received or received based on outstanding line quantities. This records goods received and the stock cost snapshot, but does not yet record supplier invoices, accounts payable, or supplier payments.

## Roles and branches

Users have one of five roles: `owner`, `manager`, `cashier`, `inventory`, or `accountant`. Branch records and staff assignments can be managed through Django admin. Public self-registration is intentionally not exposed.

- Owners and Django superusers can access records across branches.
- Non-owner staff are restricted to their assigned branch when branch-scoped APIs apply the shared permissions.
- Unassigned non-owner staff receive no branch records and cannot create branch-owned records.
- `BranchScopedQuerysetMixin` and `BranchObjectPermission` are reusable controls; future branch-owned endpoints must explicitly apply them.

## Checks

Run from `backend/`:

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
python manage.py spectacular --validate --file schema.yml
```

## Environment variables

See `.env.example`. Never commit `.env`, production credentials, or payment-provider secrets.


### Point of sale and sales

All endpoints require JWT authentication. Sales are scoped to the assigned branch; owners and superusers can query across branches. Cashiers, managers, and owners can process checkout and returns; staff with read access can view sale history.

- `POST /api/v1/sales/checkout/` — complete a sale atomically, calculate totals from current server-side product prices, decrement stock, and append sale movements to the stock ledger.
- `GET /api/v1/sales/` — list branch-visible sales; supports `status`, `payment_method`, `sale_number`, `from`, and `to` filters.
- `GET /api/v1/sales/{id}/` — sale detail with item price snapshots.
- `POST /api/v1/sales/{id}/returns/` — process a full or partial item return, restore stock, append return movements, and record a refund audit record.

Checkout example:

```json
{
  "sale_number": "POS-1001",
  "idempotency_key": "checkout-request-1001",
  "payment_method": "cash",
  "discount": "100.00",
  "items": [{"product": 1, "quantity": 2}]
}
```

Branch staff are automatically scoped to their active branch. Owners/superusers must include an active `branch` ID. The backend ignores browser-supplied unit prices and computes line totals from the catalogue. Checkout locks product and stock rows in a database transaction; insufficient stock or a duplicate sale number rolls the entire operation back. Send a stable `idempotency_key` when retrying a checkout after a network timeout to avoid processing the same request twice.

Return example:

```json
{
  "return_number": "RET-1001",
  "reason": "Incorrect part supplied",
  "refund_method": "cash",
  "items": [{"sale_item": 1, "quantity": 1}]
}
```

M-Pesa is only stored as a payment-method label at this stage. This API does not initiate payments, verify Daraja callbacks, or confirm settlement; do not treat an M-Pesa-labelled sale as proof of payment. Refund records and stock returns are audit records, not automated money transfers. Run Django checks and tests against a configured database before production use.
