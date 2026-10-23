# Frontend

React, TypeScript, and Vite client for AutoParts Pro.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_API_BASE_URL` to the base URL of the Django API (without a trailing slash). The local default is `http://localhost:8000`.

## Authentication

The sign-in screen uses Django SimpleJWT:

- `POST /api/v1/auth/token/` to obtain access and refresh tokens.
- `GET /api/v1/auth/me/` to load the current user and role.
- `POST /api/v1/auth/token/refresh/` to refresh an expired access token.
- `POST /api/v1/auth/logout/` to blacklist the refresh token.

Tokens are kept in `sessionStorage`, so they are removed when the browser tab session ends. This reduces persistence but does not eliminate the risk of token theft from a successful XSS attack. Use HTTPS in deployment, keep dependencies updated, and never store credentials in source control.

The client currently provides the shared request layer and authentication foundation. Existing product, dashboard, and POS screens still contain prototype data and must not be treated as connected to the live API yet.

## Build

```bash
npm run build
npm run lint
```
