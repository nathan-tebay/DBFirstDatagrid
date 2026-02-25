# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**GitHub remote:** https://github.com/nathan-tebay/DBFirstDatagrid

## Project Overview

MAPDashboard is a full-stack equipment management dashboard. It has a React frontend (`frontend/`) and an Express API server (`server/`) that supports both SQLite (default/dev) and MySQL.

## Commands

### Development

Run both frontend and server concurrently (from repo root):
```bash
npm run devStart       # frontend + server with nodemon (hot reload)
npm start              # frontend + server without nodemon
```

Run individually:
```bash
cd frontend && npm start        # React dev server on :3000
cd server && npm run devStart   # Express with nodemon on :3001
```

### Testing

Run in Podman (from repo root — recommended):
```bash
npm test               # build images and run both test suites
npm run test:server    # server tests only
npm run test:frontend  # frontend tests only
```

Run locally without Podman:
```bash
cd frontend && npm test                        # interactive watch mode
cd frontend && npm test -- --watchAll=false    # single run
cd frontend && npm test -- --testPathPattern=Menu   # single test file
cd server && npm test     # runs __tests__/server.test.js against in-memory SQLite
```

### Container (Podman)

```bash
podman-compose up --build     # build and start both services
podman-compose down
```

### Database

Initialize a new SQLite database manually:
```bash
sqlite3 server/data/mapequipment.db < server/sqlite_schema.sql
```

The container does this automatically on first run if the db file doesn't exist.

## Architecture

### Frontend (`frontend/src/`)

React 17 (CRA), React Router v5, React-Bootstrap. The app is a thin shell — `App.js` declares routes; each **Page** (`Pages/`) composes a `DataGrid` + `EditModal`.

**Data flow:**
1. `DataGrid` fetches `/fetchFields` and `/fetch` in parallel on mount, then passes field descriptors up to the parent page via `setFieldsData`.
2. The parent page holds `fields` state and passes it to `EditModal`, which renders `EditorForm`.
3. `EditorForm` submits new records via `PUT /add`.
4. On save, the parent increments `refreshKey`, which triggers a `DataGrid` re-fetch.

**Key components:**
- `DataGrid` — generic table driven by server-provided field metadata; supports recursive subgrids (e.g., `orderItems` nested inside `orders`), pagination via `Paginator`, and an "Add" button.
- `EditModal` / `EditorForm` — add-only form rendered from the same field metadata; uses `forwardRef`/`useImperativeHandle` so the modal footer's Save button can trigger form submission.
- `Paginator` — page-size is hardcoded to 100; only renders when `itemCount > 100`.
- `apiClient.js` — thin `fetch` wrapper used everywhere instead of calling `fetch` directly.
- `hooks/useFetch.js` — general-purpose data-fetching hook (used by some components; `DataGrid` calls `apiClient` directly).
- `shared.js` — `camelCaseToLabel` utility imported by **both** the frontend and the server (via relative path `../../frontend/src/shared.js`). Do not move or rename it.

### Server (`server/`)

Express 4, ES Modules (`"type": "module"`). A single `index.js` maps HTTP routes to functions in `utils/databaseAPI.js`.

**API endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/fetch` | Paginated rows. Params: `table`, `fields` (CSV), `where`, `page` |
| GET | `/fetchFields` | Field metadata for a table (type, required, dropdown items) |
| GET | `/fetchDistinct` | Distinct values. Params: `table`, `fields` (CSV), `where` |
| PUT | `/add` | Insert a row. Body: `{ table, ...columnValues }` |
| PATCH | `/update` | Update a row. Body: `{ table, id, ...columnValues }` |
| DELETE | `/delete` | Delete a row. Params: `table`, `id` |

**Database abstraction (`databaseAPI.js`):**
- Switches between SQLite and MySQL based on `DB_TYPE=sqlite` / `SQLITE_DB` env vars.
- `fetchFields` converts raw schema info into frontend-ready descriptors: fields ending in `Id` become `type: "dropdown"` with items fetched from the related table via `getDropdownValues`.
- Every `fetchData` response row includes a `count` column (total matching rows) for pagination — the frontend reads `data[0].count`.

**Security model:** All table names, field names, and WHERE clauses are validated against a strict allowlist/regex before any SQL is constructed:
- `validateTable` — checks against `ALLOWED_TABLES` set.
- `validateField` — regex allows `fieldName` or `fieldName as 'alias'` only.
- `validateWhere` — only accepts `fieldName=integer` form.

Adding a new table requires updating `ALLOWED_TABLES` in `databaseAPI.js` and the SQLite schema.

### Database Schema

SQLite schema lives in `server/sqlite_schema.sql` (includes seed data). Core tables: `customers`, `orders`, `orderItems`, `inventory`, `vendor`, `orderStatus`, `shippingCarrier`, `canWeights`.

Foreign keys follow the naming convention `<tableSingular>Id` (e.g., `customerId`, `vendorId`), which the server automatically detects to generate dropdown fields.
