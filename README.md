# AutoParts Pro Frontend

AutoParts Pro is a browser-based prototype for an automotive parts shop. It provides a dashboard, product catalog, and point-of-sale workflow for exploring common shop operations. The application is built with React, TypeScript, and Vite.

> **Prototype notice:** This frontend currently uses bundled sample data and browser storage. It is not connected to an API or production payment services. Do not use it to store real customer, payment, or inventory information.

## Contents

- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Available commands](#available-commands)
- [Features and routes](#features-and-routes)
- [Project structure](#project-structure)
- [Data and persistence](#data-and-persistence)
- [Development notes](#development-notes)

## Requirements

- Node.js 18 or newer
- npm (included with Node.js)

## Run locally

From this directory (`frontend/`):

1. Install dependencies with `npm install`.
2. Start the development server with `npm run dev`.
3. Open the local URL printed by Vite in your browser (typically `http://localhost:5173`).

To create and serve a production build locally, run `npm run build` followed by `npm run preview`.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Bundle the application for production using Vite. |
| `npm run preview` | Serve the most recent production build locally. Run the build first. |
| `npm run lint` | Run ESLint across the frontend source and configuration files. |

## Features and routes

| Route | Status | Description |
| --- | --- | --- |
| `/` | Available | Business overview with sales, inventory, payment, and activity panels. |
| `/pos` | Available | Product search, cart, customer selection, discounts, held sales, and checkout simulation. |
| `/products` | Available | Product catalog with search, filters, sorting, pagination, product editing, and CSV export. |
| Other sidebar routes | Planned | Inventory, sales history, customers, suppliers, purchases, reports, users, and settings currently display planned-module information. |

The point-of-sale screen simulates payment methods, including M-Pesa, card, bank transfer, cash, and split payments. It does not initiate or verify real transactions.

## Project structure

```text
frontend/
├── index.html                 # HTML entry point and page metadata
├── package.json               # Dependencies and developer scripts
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind theme and content paths
└── src/
	├── App.tsx                # Routes and application providers
	├── index.tsx              # React application entry point
	├── components/
	│   ├── dashboard/         # Dashboard panels and charts
	│   ├── layout/            # Application shell, navigation, and menus
	│   ├── pos/               # Point-of-sale and checkout workflow
	│   ├── products/          # Product catalog, forms, and list behavior
	│   └── ui/                # Shared interface components
	├── contexts/              # Shared application state
	├── data/                  # Sample catalog, customers, shop, and dashboard data
	├── pages/                 # Route-level screens
	├── types/                 # Shared TypeScript domain types
	└── utils/                 # Currency, search, receipt, file, and stock helpers
```

## Data and persistence

- Initial products, customers, shop details, and dashboard figures are defined in `src/data/`.
- Shared state and browser persistence are managed in `src/contexts/AppDataContext.tsx`.
- Product and point-of-sale changes are stored in the browser's `localStorage` under `autoparts-pro:prototype-v1` when storage is available. Data is local to that browser and is not shared between users or devices.
- Use the application's **Reset demo data** control to restore the bundled sample state. Clearing the site's local storage also removes saved prototype changes.
- Dashboard charts and several summary panels use static example figures. They should not be treated as a live business report.

## Development notes

- Add or update application routes in `src/App.tsx` and navigation definitions in `src/data/navigation.ts`.
- Keep sample records and shop configuration in `src/data/`; use `src/types/` for shared domain contracts.
- Reuse shared UI primitives from `src/components/ui/` and utility functions from `src/utils/` where practical.
- Before submitting changes, run `npm run build` and `npm run lint` from `frontend/`.
- There is no automated test script configured at this time.
