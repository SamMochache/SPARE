# AutoParts Pro API

Django REST Framework backend for AutoParts Pro. The foundation includes environment-based settings, a custom user model, JWT authentication, a health endpoint, OpenAPI docs, role permissions, and branch-scoped access primitives. Catalog, inventory, purchasing, sales, and payment modules will be implemented in later stages.

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

- `GET /api/v1/health/` — public health check.
- `POST /api/v1/auth/token/` — obtain JWT access and refresh tokens with Django username/password.
- `POST /api/v1/auth/token/refresh/` — refresh an access token.
- `POST /api/v1/auth/logout/` — blacklist a refresh token to revoke further refreshes.
- `GET/PATCH /api/v1/auth/me/` — view or update the authenticated user's own first name, last name, and email. Username and role are read-only.
- `GET /api/schema/` — OpenAPI schema.
- `GET /api/docs/` — Swagger UI.
- `/admin/` — Django admin for authorized administrators.

The logout endpoint expects the refresh token in the request body as `{"refresh": "<refresh-token>"}`. Token blacklist support is enabled in Django settings. Clients should also discard their local access token on logout; already-issued access tokens remain valid until their short expiry.

## Roles, branches, and permissions

Users have one of five roles: `owner`, `manager`, `cashier`, `inventory`, or `accountant`. Branch records and staff assignments can be managed through Django admin. Public self-registration is intentionally not exposed.

- Owners and Django superusers can access records across branches.
- Non-owner staff are restricted to the branch assigned to their account.
- Unassigned non-owner staff receive no branch records and cannot create branch-owned records.
- `BranchScopedQuerysetMixin` filters list/queryset results for views whose model has a `branch` foreign key.
- `BranchObjectPermission` protects object-level access. Use it on detail/update/delete views as well as the queryset mixin.
- `OwnerOrManager`, `InventoryStaff`, `SalesStaff`, and `FinanceStaff` provide role gates for domain operations.

These are reusable security building blocks; they only protect a domain endpoint when that endpoint explicitly applies the appropriate permission/mixin. Branch-level access has not yet been wired into catalogue, inventory, purchasing, or sales endpoints because those modules are not implemented yet.

## Checks

```bash
python manage.py check
python manage.py test
python manage.py spectacular --validate --file schema.yml
```

## Environment variables

See `.env.example`. Never commit `.env`, production credentials, or payment-provider secrets.
