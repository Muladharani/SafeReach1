# SafeReach

An emergency shelter discovery prototype for browsing demo shelter listings, capacity, facilities, community reports, and simulated disaster alerts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/safereach run typecheck` — check the SafeReach frontend
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

## Where things live

- `artifacts/safereach/src/App.tsx` — responsive SafeReach routes and interactions
- `artifacts/api-server/src/routes/safereach.ts` — shelter, alert, notification, report, stats, and demo API routes
- `lib/api-spec/openapi.yaml` — source of truth for HTTP contracts
- `lib/db/src/schema/safereach.ts` — PostgreSQL schema
- `artifacts/safereach/src/index.css` — application theme and styles

## Architecture decisions

- The app is a demonstration system; seed listings and alerts are simulated and must not be represented as official or live emergency data.
- The Supabase integration could not be provisioned from the supplied publishable key alone in this workspace. The runnable demo currently persists to the project PostgreSQL database through the shared API.
- Admin operations are demonstration controls, not production-protected emergency management. Add authenticated admin authorization before using real shelter or alert data.
- Directions link to external map providers and are never described as verified safe routes.

## Product

Users can browse and filter shelter listings, inspect reported capacity and facilities, read simulated alerts and notifications, submit condition reports, use emergency guidance, and explore an operations dashboard that edits shared demo data.

## User preferences

- Clearly label simulated emergency data and do not imply that alerts, shelter capacity, or route safety are verified.

## Gotchas

- The API seeds ten demonstration shelters and a simulated warning when the shelter database is empty.
- Re-run API code generation after any OpenAPI change before importing new generated hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
