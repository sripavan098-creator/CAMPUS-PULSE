# CampusPulse: Implementation & Verification Status

**Repository:** `campus-pulse` (Branch: `main`)  
**Hackathon:** Agentic AI Hackathon 2.0 (Track 1, Problem 3) — VFSTR  
**Verification Date:** 6 November 2026  
**Test Suite:** 84/84 passing tests across 8 test suites  

---

## Section-by-Section Verification Summary

| Section | Spec Item | Status | Verification Detail |
|---|---|---|---|
| **Section 1** | **Stack & Frameworks** | **DONE** | Node.js, TypeScript, Express 5, Prisma 6.4.1 with SQLite, Zod request validation, Helmet with Swagger-compatible CSP, bcrypt password hashing, structured JSON logging, Vitest & Supertest. |
| **Section 2** | **Dual-Client Authentication** | **DONE** | **Web Browser:** `cp_session` HttpOnly cookie (`SameSite=Lax` / `None; Secure`), CSRF token via `GET /api/auth/csrf` enforced with `X-CSRF-Token` header.<br>**Android APK:** Bearer token returned in `POST /api/auth/login` body (`{ token, expiresAt }`), stored in Capacitor Preferences, sent via `Authorization: Bearer <token>`, bypassing CSRF.<br>**Security:** Only SHA-256 token hashes stored in DB; 12h idle / 7d absolute expiry; 5 failed logins per 15 min triggers lock with constant-time generic 401 error. |
| **Section 3** | **Timetable Import Pipeline** | **DONE** | Validates magic bytes (PDF & XLSX/ZIP), SHA-256 deduplication, file staging outside web root, atomic commit via transaction, audit log entry recorded. Official university timetables ingested (ACSE, ECE, CSE, SASH, Bioinformatics) totaling 93 sections and over 2,800 live entries. Demo section `II AIML-J` (w.e.f. 17-08-2026) loaded with real entries (`is_mock = false`). |
| **Section 4** | **Room Code Classification** | **DONE** | Pure engine functions in `src/engine/roomCodes.ts` correctly parsing blocks (A, H, U, N, P), floors, inferred patterns (VBFFT, VPSF, VPTF, VPFTF), and library/non-room slots. 10/10 Vitest tests passing. |
| **Section 5** | **Database Schema & Models** | **DONE** | Complete Prisma models: `User`, `Session`, `FailedLogin`, `Block`, `Floor`, `Room`, `Department`, `Group`, `Faculty`, `SourceFile`, `Entry`, `Disruption`, `Proposal`, `Notification`, `AuditLog`. Composite indexes on `Entry(roomId, day, startTime)`, `Entry(facultyId, day, startTime)`, `Entry(groupId, day)`, and `AuditLog(createdAt)`. |
| **Section 6** | **OpenAPI & Public API Contract** | **DONE** | Interactive Swagger UI at `GET /api/docs`, OpenAPI 3.1 specification at `GET /api/openapi.json`. Endpoints for `/api/campus/blocks`, `/api/availability/now`, `/api/availability/search`, `/api/rooms/:id/timetable`, `/api/groups/:id/timetable`, `/api/faculty/:id/timetable` (zero private contacts exposed), student `/api/me/*`, faculty `/api/faculty/me/*`, admin `/api/admin/*`, and deterministic assistant `/api/assistant/query` with citations. |
| **Section 7** | **Deployment Specification** | **DONE** | `render.yaml` configured with Node environment, build/start commands, persistent disk mounted at `/data` (`file:/data/campuspulse.db`), `/api/health` healthcheck endpoint, and production environment variables. Frontend deployed on Vercel at `campus-pulse-two-gilt.vercel.app`. |
| **Section 8** | **Frontend & Mobile App Wiring** | **DONE** | **Web App:** Central `src/services/api.ts` with `VITE_API_BASE` prepending, `credentials: 'include'`, automatic `X-CSRF-Token` header injection, and `src/services/authService.ts` / `timetableService.ts` connected to live API.<br>**Android APK:** Capacitor initialized with `server.androidScheme: "https"`. `AndroidManifest.xml` has `android.permission.INTERNET` only (zero `DUMP` permissions). Bearer token persisted via `@capacitor/preferences`.<br>**Zero Passwords:** Plaintext demo passwords completely removed from version control. |
| **Section 9** | **Verification Checks** | **DONE** | 84/84 Vitest tests passing across 8 test files (engine unit tests, parser tests, contract tests, and backend integration tests). Production build (`npm run build`) passing cleanly. Android web assets synchronized via `npx cap sync android`. |
| **Section 10** | **Demonstrator & Delivery** | **DONE** | Automated test suite and end-to-end scenario script (`scripts/demo-scenario.ts`) demonstrating observation, disruption detection, candidate search, hard constraint verification, proposal ranking, approval, live schedule update, notification dispatch, and audit logging. |

---

## Phase 2 & 3 Additions (accounts, swap, replace)

| Section | Spec Item | Status | Verification Detail |
|---|---|---|---|
| **A** | **Student self-registration** | **DONE** | `POST /api/auth/signup/student` validates the roll number (`211FA04001` style) and the section, rejects duplicates with `409 EMAIL_TAKEN`, and enrols the account in an existing `Group`. UI at `/signup/student`. |
| **B** | **Admin-provisioned faculty logins** | **DONE** | `POST /api/admin/faculty` creates the `Faculty` row and a linked `User` with `mustChangePassword = true`. `requireAuth` blocks every other route with `403 PASSWORD_CHANGE_REQUIRED` until `POST /api/auth/change-password` succeeds. UI form on the Faculty Roster page. |
| **C** | **Faculty swap** | **DONE** | `POST /api/faculty/me/requests/swap` records a `ScheduleRequest`. Accepting re-validates both slots inside one transaction and swaps `facultyId`; a conflict returns `409 SWAP_CONFLICT`. |
| **D** | **Faculty replace** | **DONE** | `POST /api/faculty/me/requests/replace` hands a period to a free faculty member who already teaches the same section. `GET /api/faculty/me/replacement-candidates` lists only valid substitutes. |
| **E** | **Admin oversight** | **DONE** | `GET /api/admin/schedule-requests` lists requests by status; `POST /api/admin/schedule-requests/:id/override` forces an accept or reject and writes an audit log entry. UI at `/admin/swap-requests`. |
| **F** | **Migration** | **DONE** | Additive migration `20261106152206_add_schedule_requests_signup` copies existing rows and adds `is_demo`, `lockedUntil`, `mustChangePassword`, and the `ScheduleRequest` table. |

The shared `applyScheduleRequest` helper in `server/lib/scheduleRequests.ts` is the single place that applies a swap or replace, so the faculty decision route and the admin override cannot drift apart.

---

## Test Verification Output

```text
 RUN  v3.2.7 /workspace/project/CAMPUS-PULSE

 ✓ server/__tests__/api.test.ts (18 tests)
 ✓ server/__tests__/phase2.test.ts (8 tests)
 ✓ server/__tests__/phase3.test.ts (15 tests)
 ✓ server/__tests__/contract.test.ts (11 tests)
 ✓ server/lib/__tests__/timetableParser.test.ts (13 tests)
 ✓ src/engine/__tests__/roomCodes.test.ts (10 tests)
 ✓ src/engine/__tests__/repairSearch.test.ts (5 tests)
 ✓ src/engine/__tests__/intervalSearch.test.ts (4 tests)

 Test Files  8 passed (8)
      Tests  84 passed (84)
```
