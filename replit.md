# National Empowerment Scheme — Training and Vocational Skills Registration Portal

A professional Nigerian government-style portal for citizens to register for vocational training grants. Features a 7-step multi-form registration, admin dashboard with statistics, and full backend API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/applicants.ts` — Applicants table schema
- `lib/db/src/schema/admins.ts` — Admins table schema
- `artifacts/api-server/src/routes/applicants.ts` — Applicants API routes
- `artifacts/api-server/src/routes/auth.ts` — Admin auth routes (session via HTTP-only cookie)
- `artifacts/portal/src/pages/` — All frontend pages

## Architecture decisions

- Admin sessions are stored in-memory (Map) — sessions reset on server restart. For production, migrate to a DB-backed session store.
- Password hashing uses SHA-256 + a fixed salt (not bcrypt) — adequate for a starter but upgrade to bcrypt for production.
- Registration numbers are auto-generated: `NES-{YEAR}-{6-digit-random}`.
- Skills are stored as a `text[]` array column in PostgreSQL.
- Stats endpoint computes aggregates in-memory from all applicants — replace with SQL GROUP BY queries for large datasets.

## Product

- **Public Portal**: Landing page, 7-step multi-step registration form (personal info, education, skills, experience, expectation, beneficiary, declaration), success/registration slip page
- **Admin Dashboard**: Secure login, applicant list with search/pagination, detail modal, stats with bar/pie charts, delete applicant

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes before using updated hooks
- `pnpm --filter @workspace/db run push` after schema changes

## Admin Access

- URL: `/admin/login`
- Username: `admin`
- Password: `admin123`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
