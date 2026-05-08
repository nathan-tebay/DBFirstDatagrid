# MAPDashboard — DBFirstDataGrid

Full-stack equipment management dashboard. React 17 frontend driven by server-side field metadata — add a table to the server and the UI builds itself.

**GitHub:** https://github.com/nathan-tebay/DBFirstDatagrid

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 17 (CRA), React Router v5, React-Bootstrap |
| Backend | Express 4, ES Modules |
| Database | SQLite (default/dev) or MySQL |
| Container | Podman, podman-compose |

## Quick start

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..
cd server && npm install && cd ..

# Start both services with hot-reload
npm run devStart
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

## Development commands

```bash
# From repo root
npm run devStart       # frontend + server with nodemon (hot reload)
npm start              # frontend + server without nodemon

# Individual services
cd frontend && npm start          # React dev server on :3000
cd server && npm run devStart     # Express with nodemon on :3001
```

## Testing

```bash
# Run both test suites via Podman (recommended)
npm test
npm run test:server    # server tests only
npm run test:frontend  # frontend tests only

# Run locally without Podman
cd frontend && npm test -- --watchAll=false
cd server && npm test
```

## Container

```bash
podman-compose up --build
podman-compose down
```

## Database

The SQLite schema lives in `server/sqlite_schema.sql` (includes seed data). The container initialises it automatically on first run.

```bash
# Initialise manually
sqlite3 server/data/mapequipment.db < server/sqlite_schema.sql
```

Core tables: `customers`, `orders`, `orderItems`, `inventory`, `vendor`, `orderStatus`, `shippingCarrier`, `canWeights`.

## API reference

| Method | Path | Description |
|---|---|---|
| GET | `/fetch` | Paginated rows. Params: `table`, `fields` (CSV), `where`, `page` |
| GET | `/fetchFields` | Field metadata for a table (type, required, dropdown items) |
| GET | `/fetchDistinct` | Distinct values. Params: `table`, `fields` (CSV), `where` |
| PUT | `/add` | Insert a row. Body: `{ table, ...columnValues }` |
| PATCH | `/update` | Update a row. Body: `{ table, id, ...columnValues }` |
| DELETE | `/delete` | Delete a row. Params: `table`, `id` |

## Project structure

```
DBFirstDataGrid/
├── frontend/
│   └── src/
│       ├── DataGrid.jsx       # Generic table: server-driven columns, subgrids, pagination
│       ├── EditModal.jsx      # Add-record modal
│       ├── EditorForm.jsx     # Form rendered from field metadata
│       ├── Pages/             # One page per table
│       ├── apiClient.js       # fetch wrapper (used everywhere)
│       ├── hooks/useFetch.js  # General-purpose fetch hook
│       └── shared.js          # camelCaseToLabel — imported by BOTH frontend and server
├── server/
│   ├── index.js               # Express routes
│   ├── utils/databaseAPI.js   # DB abstraction (SQLite/MySQL), security allowlist
│   └── sqlite_schema.sql      # Schema + seed data
├── podman-compose.yml
├── podman-compose.test.yml
└── package.json               # Root — concurrent dev scripts
```

## Architecture

**Data flow:**
1. `DataGrid` fetches `/fetchFields` and `/fetch` in parallel on mount
2. Field metadata is passed up to the parent `Page` via `setFieldsData`
3. Parent passes `fields` to `EditModal` → `EditorForm` for the add-record form
4. On save, parent increments `refreshKey` → triggers `DataGrid` re-fetch

**Auto-generated dropdowns:** Fields named `<tableSingular>Id` (e.g. `customerId`) are automatically detected by the server and rendered as dropdowns with values fetched from the related table.

**Security:** All table names, field names, and WHERE clauses are validated against a strict allowlist/regex before any SQL is constructed. Adding a new table requires updating `ALLOWED_TABLES` in `server/utils/databaseAPI.js`.

**`shared.js`** is imported by both the frontend and the server via a relative path — do not move or rename it.
