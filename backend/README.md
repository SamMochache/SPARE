# AutoParts Pro API

Django REST Framework backend for AutoParts Pro. This is the initial foundation: settings, a custom user model, JWT token endpoints, API schema/docs, and a health endpoint. Catalog, inventory, purchasing, sales, and payment modules will be implemented in later stages.

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
# Windows PowerShell: .venv\\Scripts\\Activate.ps1
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
- `POST /api/v1/auth/token/refresh/` — refresh access token.
- `GET /api/schema/` — OpenAPI schema.
- `GET /api/docs/` — Swagger UI.
- `/admin/` — Django admin.

All other DRF endpoints require authentication by default. Role-based object-level permissions are not yet implemented; do not expose this API publicly for production use until access control and deployment hardening are complete.

## Checks

```bash
python manage.py check
python manage.py test
python manage.py spectacular --validate --file schema.yml
```

## Environment variables

See `.env.example`. Never commit `.env`, production credentials, or payment-provider secrets.
