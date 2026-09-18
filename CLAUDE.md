# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kelenda is a SaaS for apprentices/alternants juggling school and company schedules (merged calendar, free-slot detection for revision, salary/rights simulation, activity/competency tracking). The project is early-stage: only the monorepo skeleton and `packages/shared` exist so far; the 5 services are empty directories awaiting implementation.

**Before implementing any service, read `docs/Kelenda_Documentation_Complete.md`** — it is the single source of truth for DB schemas (section 9), API endpoints (section 10), NATS event payloads (section 11), K8s manifests (section 12), CI (section 13), and Dockerfiles (section 14). `docs/Kelenda_Plan_Developpement.md` gives the build order and *why* it's ordered that way (dependency-driven, not arbitrary) — check it before assuming a different service order is fine.

## Commands

```bash
docker compose up -d              # PostgreSQL (5 dedicated DBs via infra/dev/init-databases.sh) + NATS JetStream, for local dev
npm install                       # install all workspaces
npm run build                     # build all workspaces (--workspaces --if-present)
npm run lint                      # lint all workspaces
npm run test                      # test all workspaces

# Single workspace:
npm run build --workspace=packages/shared
npm run build --workspace=services/<name>
npx tsc --noEmit                  # type-check only, run from inside a workspace dir
```

There is no root test runner configured yet — each service must add its own `lint`/`test`/`build` npm scripts (see CI convention below) once it has code.

## Architecture

**Monorepo layout**: `services/*` (one Express+TypeScript app per microservice) and `packages/*` (shared code) are npm workspaces, driven by the root `package.json` and `tsconfig.base.json` (each workspace extends it). `packages/shared` is the only cross-service dependency — no service ever imports another service's code directly.

**The 5 services and their strict ownership boundaries** (each has its own Postgres database — no shared tables, no cross-service FKs, only *logical* references to other services' IDs):
- `auth-service` — users, workspaces, JWT (RS256) issuance/verification, OAuth linking. Everything else depends on this being up first.
- `calendar-service` — ICS parsing, CalDAV sync, free-slot detection, conflict detection (`tstzrange` + GiST index). The MVP core.
- `finance-service` — salary simulation, collective-agreement premium checks, financial aid matching. Independent of calendar-service.
- `tracking-service` — missions, competency tracking, tutor follow-up, activity reports. Consumes `mission_scheduled` events.
- `notification-service` — push/email delivery. Consumes almost every event in the catalog; has no business logic of its own.

Build order matters and is documented in `docs/Kelenda_Plan_Developpement.md`: auth-service must be validated first (it gates everything), calendar-service is the MVP core, finance-service can run in parallel, tracking/notification come after a working NATS pub/sub is proven, then end-to-end k3d integration, then homelab deployment, then frontend.

**Inter-service communication is event-driven via NATS JetStream** (JetStream must stay enabled — plain NATS core does not persist messages and would silently drop events emitted while a subscriber is down). Use `packages/shared`'s `publishEvent`/`subscribeToEvent` (in `packages/shared/src/events/nats.ts`) rather than talking to the `nats` client directly — it wraps the standard envelope:
```ts
{ event_type: string, version: string, timestamp: string, payload: {...} }
```
NATS subject convention: `kelenda.<emitting_service>.<event_type>` (built by `buildSubject()`). Full event catalog and payload shapes are in doc section 11.

**Hybrid data-transfer pattern**: an event payload carries only what the subscriber needs immediately (not a full duplicate of the emitting service's row). If a subscriber needs more, it calls the emitting service synchronously via an internal REST endpoint (`/internal/*` routes — never exposed through the api-gateway, ClusterIP-only). Don't "fix" a thin event payload by fattening it — add an internal endpoint call instead, following the existing pairs in doc section 10.

**Service-to-service auth for `/internal/*` calls** uses a per-pair HMAC secret (not a shared secret, not centralized issuance) — implemented in `packages/shared/src/internal-auth/hmac.ts` (`signInternalRequest` / `verifyInternalRequest`). Requests are signed, not just bearing the raw secret: `X-Calling-Service`, `X-Timestamp`, `X-Signature = HMAC-SHA256(secret, method+path+timestamp+body)`. The callee rejects any request whose `X-Timestamp` is more than 30s off from server time (anti-replay) and compares signatures in constant time. This only protects against network interception/replay — it does *not* protect against the secret itself being compromised (bad RBAC, leaked env var, committed `.env`); rotation is the only defense for that vector. Known pairs (MVP): `tracking→calendar`, `tracking→auth`, `notification→auth`.

**The public API surface is fronted by Traefik** (already K3s's default ingress, not a hand-rolled gateway). Public routes get a `forward-auth` middleware that calls `auth-service`'s `GET /auth/verify` and injects `X-User-Id`/`X-Workspace-Id`. Every service still re-verifies the JWT signature itself (`JWT_PUBLIC_KEY`) as defense-in-depth — never trust `X-User-Id` alone, since NetworkPolicies (not enabled by default under Flannel — Calico is required, see doc section 12.11) are the only thing stopping a pod from forging that header directly.

**DB migrations**: `node-pg-migrate`, not an ORM's built-in migration tool — this preserves the raw SQL in doc section 9 (GiST indexes, generated `tstzrange` columns, CHECK constraints) almost as-is. Each service's migrations live in `services/<name>/migrations/` and run via a K8s `initContainer` before the main container starts (same image, different command) — `node-pg-migrate` must be a normal `dependencies` entry, not `devDependencies`, or the initContainer breaks in the production image.

**Docker builds run from the monorepo root, not from `services/<name>/`** — e.g. `docker build -f services/auth-service/Dockerfile -t kelenda-auth-service .` — because each Dockerfile's build stage needs `packages/shared` in its context. The multi-stage pattern (deps → build → runtime, non-root user) is identical across all 5 services; see doc section 14 for the exact template before writing a new one.

**CI** (GitHub Actions, not yet created) will path-filter per service via `dorny/paths-filter`: only changed `services/<name>/` directories get built/tested, except a `packages/shared` change triggers a rebuild of all 5 services since they all depend on it. Every service is expected to expose the same `lint`/`test`/`build` npm scripts so the CI job matrix stays framework-agnostic.

**Backend framework**: Express for all 5 services (not NestJS) — a deliberate, reversible-per-service choice to avoid stacking a second layer of abstraction on top of the K3s/Traefik/NATS/Postgres learning curve. Nothing prevents a future switch to NestJS for a single service if a real need appears.

**Frontend** (not yet started): React + Vite SPA (no Next.js/SSR — the app is entirely behind auth, no public content to pre-render), PWA via `vite-plugin-pwa`.

## Conventions

- One Postgres database per service, always — this is a hard rule from the architecture doc, not a style preference. Never add a foreign key across service boundaries; use a logical UUID reference and, if needed, an internal API call.
- Never commit real secret values — `infra/k8s/02-secrets-template.yaml`-style files are templates with `CHANGE_ME` placeholders only.
- Git commits: never add a `Co-Authored-By` trailer for Claude.
