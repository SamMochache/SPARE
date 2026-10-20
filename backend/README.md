# AutoParts Pro API

Django REST Framework backend for AutoParts Pro. The foundation includes environment-based settings, a custom user model, JWT authentication, a health endpoint, OpenAPI docs, and basic role-based access-control primitives. Catalog, inventory, purchasing, sales, and payment modules will be implemented in later stages.

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

Run the initial migration and create an administrator:

```bash
python manage.py makemigrations accounts
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The custom `accounts.User` model must be present before the first migration. Do not change `AUTH_USER_MODEL` after production data exists without a planned migration.

## Endpoints

- `GET /api/v1/health/` — public health check.
- `POST /api/v1/auth/token/` — obtain JWT access and refresh tokens with Django username/password.
- `POST /api/v1/auth/token/refresh/` — refresh an access token.
- `POST /api/v1/auth/logout/` — blacklist a refresh token to revoke further refreshes.
- `GET/PATCH /api/v1/auth/me/` — view or update the authenticated user's own first name, last name, and email. Username and role are read-only.
- `GET /api/schema/` — OpenAPI schema.
- `GET /api/docs/` — Swagger UI.
- `/admin/` — Django admin for authorized administrators.

The logout endpoint expects the refresh token in the request body as `{"refresh": "<refresh-token>"}`. Token blacklist support is enabled in Django settings. Clients should also discard their local access token on logout; already-issued access tokens remain valid until their short expiry.

## Roles and permissions

Users have one of five roles: `owner`, `manager`, `cashier`, `inventory`, or `accountant`. Create and assign staff accounts through Django admin; public self-registration is intentionally not exposed.

Reusable DRF permission classes are available in `apps.accounts.permissions`:

- `OwnerOrManager` — owner or manager.
- `InventoryStaff` — owner, manager, or inventory.
- `SalesStaff` — owner, manager, or cashier.
- `FinanceStaff` — owner, manager, or accountant.

These classes are building blocks for the upcoming domain APIs. Apply the appropriate permission class to each view; authentication alone is not sufficient to protect sensitive operations. Branch-level access restrictions will be added when the branch model is introduced.

## Checks

```bash
python manage.py check
python manage.py test
python manage.py spectacular --validate --file schema.yml
```

## Environment variables

See `.env.example`. Never commit `.env`, production credentials, or payment-provider secrets.
