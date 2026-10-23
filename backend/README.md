# AutoParts Pro API

Django REST Framework backend for AutoParts Pro. It provides JWT authentication, role permissions, branch-scoped inventory and sales, catalogue, purchasing, reporting, and customer management APIs.

## Requirements and setup

- Python 3.11+
- PostgreSQL (Neon recommended for hosted development)
- pip and a virtual environment

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Set a strong `DJANGO_SECRET_KEY` and the Neon `DATABASE_URL` in `.env`. SQLite fallback is for quick local checks only. Never commit secrets.

## Customer management

All customer endpoints require JWT authentication. Active staff may read customers; only owners, managers, and cashiers may create, update, archive, or restore customer records.

- `GET /api/v1/customers/` — paginated active customers; optional `search` matches name, phone, email, and KRA PIN.
- `POST /api/v1/customers/` — create a customer.
- `GET/PATCH /api/v1/customers/{id}/` — retrieve or update a customer.
- `DELETE /api/v1/customers/{id}/` — soft-archive a customer.
- `POST /api/v1/customers/{id}/restore/` — restore an archived customer.

Fields include `name`, `phone`, `email`, `type` (`retail` or `wholesale`), `kraPin`, `discountRate` (0–100), and `creditLimit` (non-negative). Active phone numbers must be unique when provided. A credit limit is informational only: credit checkout, customer balances, payment posting, and statements are not implemented.

## Other API groups

- Authentication: `/api/v1/auth/`
- Catalogue: `/api/v1/categories/`, `/api/v1/products/`
- Inventory: `/api/v1/stock-balances/`, `/api/v1/stock-movements/`, `/api/v1/stock/receive/`, `/api/v1/stock/adjust/`
- Purchasing: `/api/v1/suppliers/`, `/api/v1/purchase-orders/`
- Sales: `/api/v1/sales/`, `/api/v1/sales/checkout/`
- Reporting: `/api/v1/reports/dashboard/`, `/api/v1/reports/sales/`, `/api/v1/reports/inventory/`, `/api/v1/reports/top-products/`
- Schema and docs: `/api/schema/`, `/api/docs/`

Run checks with `python manage.py check`, `python manage.py makemigrations --check --dry-run`, and `python manage.py test`. Test against a configured database before deployment. No CI/CD workflows are included.
