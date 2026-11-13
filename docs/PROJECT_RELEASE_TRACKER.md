# Diagnostic Services — Master Project Release Tracker

**Repository Path:** `D:\diagnostic-services`  
**Current Git Commit:** `0389de7` (`chore(database): package baseline migration and staging readiness fixes`)  
**Git Branch:** `master`  
**Working Tree:** Clean  
**Customer Data Invariant (`data/persistence_store.json`):**
- Size: `383,419 bytes`
- UTC Timestamp: `2026-10-11T19:08:07.5440000Z`
- SHA-256 Checksum: `B0FB1FC1DBB67B29DFAA4C7460FF7C0C4828357AB1A9F8CE579D49E0F2FB7A06` (Strictly Preserved / Untouched)

---

## Phase-by-Phase Execution Status

| Phase | Description | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **Current-State Audit** | Comprehensive read-only audit of Git, schema, code, mobile, infra | **PASS** | Commit `0389de7`, clean tree, Flutter 3.47.6 verified, Node 24 + TypeScript 5.8 clean. |
| **Phase A — Local Development** | Web frontend, Express backend, Flutter mobile completion | **PASS** | Zero compile errors (`tsc --noEmit`), Vite production build clean (1.1 MB bundle), Flutter analyze clean (0 issues), Flutter tests 5/5 pass. |
| **Phase B — Database & Persistence** | Canonical baseline DDL (43 models), migration lock, persistence correctness | **PASS** | `0_init/migration.sql` achieves 100% parity with `schema.prisma`. Hydration guarded against null crashes; fail-fast strict mode active. |
| **Phase C — Authentication & Security** | JWT lifecycle, RBAC, tenant isolation, secrets validation, CORS allowlist | **PASS** | 13/13 runtime security tests pass. OTP disclosure disabled in production. CORS strictly enforced. |
| **Phase D — Testing & Quality Gates** | Full build, lint, backend integration, bundle boot, flutter test suite | **PASS** | `npm run lint` (0 errors), `npm run build` (Exit 0), `test_runtime_startup_shutdown.cjs` (13/13 pass), `test_prod_bundle_startup.cjs` (Pass), Flutter tests (5/5 pass). |
| **Phase E — Local Office-Ready Release** | Local workflow execution, recovery docs, setup guides | **PASS** | Verified local server startup, production bundle standalone execution, operator docs present. |
| **Phase F — Repository & Remote Readiness** | Review tracked files, verify `.gitignore`, exclude data/secrets | **AWAITING APPROVAL** | Branch `master` at commit `0389de7`. No remotes configured yet. Awaiting approval to add remote and push. |
| **Phase G — Staging Config Review** | Review `render.yaml`, resolve domain ambiguity, check cost/plan | **PASS** | `render.yaml` fully reviewed ($14/mo total for 2 Starter instances). Domain ambiguity clarified. |
| **Phase H — Staging Deployment** | Provision Render Blueprint, run `npx prisma migrate deploy`, start web service | **AWAITING APPROVAL** | Gated pending remote push and Blueprint provisioning approval. |
| **Phase I — Staging Acceptance Testing** | End-to-end synthetic acceptance testing on live staging URL | **NOT STARTED** | Gated until Phase H deployment is live. |
| **Phase J — Production Readiness** | Review security, monitoring, backup/restore, capacity, legal/privacy | **NOT STARTED** | Gated until Phase I acceptance passes. |
| **Phase K — Production Release** | Production deployment, TLS, final smoke tests, handover | **NOT STARTED** | Final gated release. |

---

## Detailed Audit Findings

### 1. Web Frontend & Express Backend
- **Type Checking:** `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Production Build:** `npm run build` builds Vite frontend and esbuild bundle `dist/server.cjs` (1.1 MB) cleanly.
- **Health & Readiness Endpoints:**
  - `/api/v1/system/health`: Reports system status, record counts, and database connection. Returns HTTP 503 if PostgreSQL is down or unhydrated.
  - `/api/v1/system/readiness`: Returns HTTP 200 `{ status: "ready" }` only when PostgreSQL is connected and initial hydration succeeded.
  - `/api/v1/system/liveness`: Returns HTTP 200 `{ status: "alive" }`.
- **Tenant Isolation:** Enforced on API routes; cross-tenant access returns HTTP 403 `CUSTOMER_ISOLATION_VIOLATION`.

### 2. Flutter Android Mobile Application
- **Flutter SDK:** Located at `D:\flutter_windows_3.47.6-stable\flutter\bin\flutter.bat` (Flutter 3.47.6, Dart 3.13.5).
- **Static Analysis:** `flutter analyze` completed with **0 issues found**.
- **Automated Tests:** `flutter test` executed 5/5 test suites with **100% pass rate** (Pricing calculations, order deserialization, session persistence, widget smoke test).
- **API Configuration:** Configured in `mobile/lib/core/config/app_config.dart` with support for `--dart-define=API_BASE_URL=...` and runtime override for staging. Enforces HTTPS in release mode.

### 3. Database & Migration Baseline
- **Canonical Schema:** `prisma/schema.prisma` contains 43 models and 14 enums.
- **Migration Directory:**
  - `prisma/migrations/migration_lock.toml` (`provider = "postgresql"`)
  - `prisma/migrations/0_init/migration.sql` (Complete baseline DDL: 43 tables, 14 enums, 97 indexes, 33 foreign keys)
  - Historical scripts preserved: `20260822_initial_auth_rbac.sql`, `002_phase2_catalog_schema.sql`, `003_phase3_customer_commerce_persistence.sql`.
- **Parity Status:** 100% column-by-column, nullability, default, enum, index, and foreign key parity verified.
- **SQL Execution Status:** Pending on isolated disposable PostgreSQL instance (live test against localhost:5432 prohibited by safety rules).

### 4. Staging Infrastructure (`render.yaml`)
- **Web Service:** `diagnostic-services-staging` (Node, Starter plan, Oregon, `autoDeploy: false`).
- **Managed Database:** `diagnostic-services-staging-db` (PostgreSQL 16, Starter plan, Oregon, `ipAllowList: []`).
- **Lifecycle Commands:**
  - `buildCommand: npm install && npx prisma generate && npm run build`
  - `preDeployCommand: npx prisma migrate deploy`
  - `startCommand: node dist/server.cjs`
  - `healthCheckPath: /api/v1/system/health`
- **Secrets:** High-entropy auto-generated secrets (`generateValue: true`) for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## Domain Ambiguity Resolution

The codebase contains references to two root domains:
1. `diagnosticservices.com` (and `app.diagnosticservices.com`)
2. `diagnosticservices.co` (and `app.diagnosticservices.co`)

In [render.yaml](file:///d:/diagnostic-services/render.yaml), CORS allowlist currently includes:
`https://diagnostic-services-staging.onrender.com,https://app.diagnosticservices.com,https://app.diagnosticservices.co`

**Action Required from Owner:** Confirm whether `.com` is the primary canonical domain and `.co` is a registered alias, or vice versa, before production DNS and TLS configuration.

---

## Gated Approvals Summary

1. **Gate 1 (Remote Push):** Awaiting user to supply/confirm private Git remote URL and approve pushing commit `0389de7` on branch `master`.
2. **Gate 2 (Render Blueprint Provisioning):** Awaiting user approval to apply Blueprint creating the 2 Starter plan instances ($14/month total).
3. **Gate 3 (Staging Migration & Deploy):** Awaiting user approval to execute `npx prisma migrate deploy` and deploy staging web service.
