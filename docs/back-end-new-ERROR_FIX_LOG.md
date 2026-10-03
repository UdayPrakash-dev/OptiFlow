# OptiFlow Section B — Consolidated Error & Fix Register (ERROR_FIX_LOG.md)

## Summary Table

| Severity | Total | FIXED | OPEN | BLOCKED | SUSPECTED | NOT VERIFIED |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Critical** | 1 | 1 | 0 | 0 | 0 | 0 |
| **High** | 3 | 3 | 0 | 0 | 0 | 0 |
| **Medium** | 3 | 3 | 0 | 0 | 0 | 0 |
| **Low** | 1 | 1 | 0 | 0 | 0 | 0 |
| **Total** | **8** | **8** | **0** | **0** | **0** | **0** |

---

## Issue Details

### [B-001] Missing Frontend JWT Token Propagation in API Client
* **Date/Time:** 2026-10-02T15:25:00+05:30
* **Severity:** Critical
* **Step / Subsystem:** Step 3 & Step 4 / Frontend Authentication & API Client
* **Symptom / Observed Behavior:** After logging in or registering, subsequent frontend API calls sent `Bearer <actorId>` (e.g. `Bearer user-uuid` or `Bearer undefined`) rather than the signed JWT token returned by `/auth/login`.
* **Expected vs Actual:**
  * *Expected:* Frontend stores the JWT `token` in `sessionStorage` and attaches `Authorization: Bearer <signed_jwt>` to all authenticated API requests.
  * *Actual:* Backend rejected subsequent requests with `401 Unauthorized` (`Invalid token signature or format`) because only user metadata was stored without `token`.
* **Root Cause (CONFIRMED):** `front-end/js/pages/auth-flows.js` omitted `token` when building the `currentUser` session object, and `front-end/js/utils/helpers.js` defaulted to using user identifier strings instead of the JWT.
* **File & Line Range:** [`front-end/js/pages/auth-flows.js`](file:///D:/Codes/FDFED/2_OptiFlow/front-end/js/pages/auth-flows.js) (lines 95–125, 270–295) and [`front-end/js/utils/helpers.js`](file:///D:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js) (lines 140–165).
* **Fix Applied:**
  1. Updated `front-end/js/pages/auth-flows.js` to persist `token` in `sessionStorage.setItem("authToken", token)` and inside the `currentUser` JSON payload.
  2. Updated `front-end/js/utils/helpers.js` to prioritize `session.token` and `sessionStorage.getItem('authToken')` when building the `Authorization: Bearer <token>` header.
* **Test Command & Results:**
  * `npm.cmd test` (130/130 passed across 14 suites)
  * Verified token extraction logic and JWT Bearer formation.
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** None. Fallback to mock identifiers is retained for offline UI prototyping mode if no token exists.

---

### [B-002] Missing Audit Logs Endpoints in Backend (`/audit-logs`)
* **Date/Time:** 2026-10-02T15:24:00+05:30
* **Severity:** High
* **Step / Subsystem:** Step 3 & Step 8 / Audit Trail & Frontend State Aggregator
* **Symptom / Observed Behavior:** `window.Helpers.getState()` in `front-end/js/utils/helpers.js` requested `GET /audit-logs` and `window.Helpers.log()` posted to `POST /audit-logs`, which returned `404 Not Found`.
* **Expected vs Actual:**
  * *Expected:* Backend provides tenant-scoped `GET /audit-logs`, `GET /audit-logs/by-user/:userId`, `GET /audit-logs/by-entity/:entityType/:entityId`, and `POST /audit-logs` matching the NestJS audit-logs module.
  * *Actual:* `back-end-new` had internal audit logging utility (`src/utils/audit.js`) but lacked public HTTP route registrations.
* **Root Cause (CONFIRMED):** Express migration implemented `createAuditLog` helper for internal services but had not mounted the corresponding route controller.
* **File & Line Range:** [`src/routes/org.routes.js`](file:///D:/Codes/FDFED/2_OptiFlow/back-end-new/src/routes/org.routes.js) (lines 580–630).
* **Fix Applied:** Implemented `listAuditLogs`, `listAuditLogsByUser`, `listAuditLogsByEntity`, and `createAuditLogEndpoint` in `src/routes/org.routes.js` with tenant isolation (`companyId: req.user.companyId`) and validation.
* **Test Command & Results:**
  * `npm.cmd test` (130/130 passed across 14 suites)
  * Live Neon DB AuditLog table query verified (`scripts/verify-all-models-live.js`).
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** None. Audits are strictly company-scoped.

---

### [B-003] Frontend Departments Route Alias Missing
* **Date/Time:** 2026-10-02T15:23:00+05:30
* **Severity:** Medium
* **Step / Subsystem:** Step 3 & Step 5 / Organization & Branch Management
* **Symptom / Observed Behavior:** Older dashboard pages queried `GET /departments`, which was unmapped in the backend router.
* **Expected vs Actual:**
  * *Expected:* `/departments` routes cleanly resolve to company branches.
  * *Actual:* `404 Not Found` when loading department list in legacy PM views.
* **Root Cause (CONFIRMED):** In the original database schema, branches represent organizational divisions, but legacy frontend scripts used `/departments` interchangeably with `/branches`.
* **File & Line Range:** [`src/routes/org.routes.js`](file:///D:/Codes/FDFED/2_OptiFlow/back-end-new/src/routes/org.routes.js) (lines 580–605).
* **Fix Applied:** Added route aliases `['/branches', '/api/branches', '/departments', '/api/departments']` to `listBranches`, `getBranchById`, and branch mutation handlers.
* **Test Command & Results:**
  * `npm.cmd test` (130/130 passed across 14 suites)
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** None.

---

### [B-004] Compliance Evidence Upload Missing Authorization Header in Frontend
* **Date/Time:** 2026-10-02T15:26:00+05:30
* **Severity:** High
* **Step / Subsystem:** Step 7 & Step 9 / Compliance Evidence Multipart Uploads
* **Symptom / Observed Behavior:** In `front-end/js/pages/compliance/evidence.js`, `uploadEvidenceFile()` created `FormData` and sent `x-user-role`, `x-company-id`, `x-user-id` headers but omitted the `Authorization: Bearer <jwt>` header.
* **Expected vs Actual:**
  * *Expected:* Multipart upload fetch request includes `Authorization: Bearer <jwt>`.
  * *Actual:* Backend `authenticate` middleware rejected upload with `401 Unauthorized`.
* **Root Cause (CONFIRMED):** Frontend script relied on legacy unauthenticated header spoofing instead of passing the bearer token.
* **File & Line Range:** [`front-end/js/pages/compliance/evidence.js`](file:///D:/Codes/FDFED/2_OptiFlow/front-end/js/pages/compliance/evidence.js) (lines 460–485).
* **Fix Applied:** Updated `uploadEvidenceFile()` in `evidence.js` to read session token and attach `Authorization: Bearer ${authToken}`.
* **Test Command & Results:**
  * `node test-step8.js` (8/8 passed)
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** None.

---

### [B-005] Process Engine Endpoints & State Machine Missing in Initial Router
* **Date/Time:** 2026-10-02T14:45:00+05:30
* **Severity:** High
* **Step / Subsystem:** Step 6 / Process Engine State Machine
* **Symptom / Observed Behavior:** `src/routes/process.routes.js` contained only placeholder comments.
* **Expected vs Actual:**
  * *Expected:* Full implementation of process templates, step ordering, instance instantiation, step approvals/rejections, loopbacks, and state completion.
  * *Actual:* Routes were unimplemented.
* **Root Cause (CONFIRMED):** Process Engine was pending implementation during the initial skeleton phase.
* **File & Line Range:** [`src/routes/process.routes.js`](file:///D:/Codes/FDFED/2_OptiFlow/back-end-new/src/routes/process.routes.js).
* **Fix Applied:** Implemented complete template CRUD, instance lifecycle, step action transitions (`Approved`, `Rejected` with `onRejectGotoStepId` loopback), role scoping, and audit logs.
* **Test Command & Results:**
  * `node test-process.js` (10/10 passed)
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** None.

---

### [B-006] Evidence Upload Was Metadata-Only (Physical Upload & Streaming Missing)
* **Date/Time:** 2026-10-02T14:51:00+05:30
* **Severity:** Medium
* **Step / Subsystem:** Step 7 / Compliance Evidence & File Storage
* **Symptom / Observed Behavior:** `POST /evidence` only accepted JSON metadata; physical file uploads and authenticated file streaming were not implemented.
* **Expected vs Actual:**
  * *Expected:* Real multipart upload endpoint (`POST /evidence/:id/upload`) and secure authenticated stream (`GET /evidence/:id/file`).
  * *Actual:* Only metadata JSON was accepted.
* **Root Cause (CONFIRMED):** Multer integration from NestJS had not yet been ported to Express 5.
* **File & Line Range:** [`src/routes/compliance.routes.js`](file:///D:/Codes/FDFED/2_OptiFlow/back-end-new/src/routes/compliance.routes.js).
* **Fix Applied:** Installed `multer`, configured disk storage (`./uploads`), 20MB limit, MIME whitelist, Attachment (`file_objects`) record persistence, and directory-traversal-safe file streaming.
* **Test Command & Results:**
  * `node test-step8.js` (8/8 passed)
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** Local disk storage requires persistent volume or cloud storage integration in multi-node production clusters.

---

### [B-007] Frontend Login Payload Compatibility
* **Date/Time:** 2026-10-02T15:08:00+05:30
* **Severity:** Medium
* **Step / Subsystem:** Step 3 & Step 4 / Authentication Envelope
* **Symptom / Observed Behavior:** Frontend `auth-flows.js` unwrapped `authData.data` and checked `loginPayload.success`, which was undefined when `success: true` was only on the outer envelope.
* **Expected vs Actual:**
  * *Expected:* `loginPayload.success` is truthy.
  * *Actual:* `loginPayload.success` was undefined.
* **Root Cause (CONFIRMED):** Envelope mismatch between backend standard response and frontend helper unwrapping assumptions.
* **File & Line Range:** [`src/routes/auth.routes.js`](file:///D:/Codes/FDFED/2_OptiFlow/back-end-new/src/routes/auth.routes.js).
* **Fix Applied:** Added `success: true` inside the inner `data` payload for login and registration responses.
* **Test Command & Results:**
  * `node test-step4.js` (11/11 passed)
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** None.

---

### [B-008] Missing `/public/plans` Route Alias
* **Date/Time:** 2026-10-02T15:09:00+05:30
* **Severity:** Low
* **Step / Subsystem:** Step 3 / Public Plans
* **Symptom / Observed Behavior:** API contract documented `GET /public/plans`, while router only mounted `GET /auth/public-plans`.
* **Expected vs Actual:**
  * *Expected:* Both `/public/plans` and `/auth/public-plans` resolve.
  * *Actual:* `/public/plans` returned 404.
* **Root Cause (CONFIRMED):** Router only registered `/auth/public-plans`.
* **File & Line Range:** [`src/routes/auth.routes.js`](file:///D:/Codes/FDFED/2_OptiFlow/back-end-new/src/routes/auth.routes.js).
* **Fix Applied:** Added route alias `['/auth/public-plans', '/public/plans']`.
* **Test Command & Results:**
  * `node test-step4.js` (11/11 passed)
* **Status:** **FIXED**
* **Residual Risk & Follow-up:** None.
