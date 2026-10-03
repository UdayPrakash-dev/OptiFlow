# OptiFlow Backend (Express 5)

High-performance, minimal, multi-tenant backend for **OptiFlow**, migrated from NestJS to Express 5 with JavaScript/ESM, Prisma 6, and PostgreSQL.

---

## 1. Architecture & Design Principles

* **Runtime:** Node.js (ES Modules)
* **Framework:** Express 5
* **ORM:** Prisma 6 with PostgreSQL
* **Authentication:** Stateless JWT with dual identity domains:
  1. **Tenant User Authentication:** Verified against the tenant's `User` and `Company` records.
  2. **Platform Admin Authentication:** Dedicated authentication against `PlatformAdminUser` records.
* **Security & Isolation:**
  * Multi-tenant data scoping enforced on every query and mutation via verified `req.user.companyId`.
  * Headers like `x-company-id`, `x-user-id`, and `x-user-role` are strictly ignored.
  * Role-Based Access Control (RBAC) with hierarchical role mapping and Branch Manager scope isolation.
  * Passwords hashed using `bcryptjs` (min 8 characters); password hashes strictly excluded from API outputs.
  * Security headers via `helmet` and configurable `cors`.
  * In-memory sliding-window rate limiting with RFC-compliant HTTP 429 envelopes and headers.
* **Validation:** Explicit, lightweight manual validation without heavy external validator bloat.
* **Response Envelope:** Standardized `{ success: true, data: ... }` for success and `{ success: false, statusCode: ..., message: ... }` for errors.

---

## 2. Prerequisites & Setup

### Prerequisites
* Node.js >= 20.0.0
* PostgreSQL database connection string

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and configure required variables:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP Server port | `5500` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection URI with schema | Required |
| `JWT_SECRET` | Secret key for signing JWT tokens | Required |
| `JWT_EXPIRES_IN` | JWT expiration duration | `24h` |
| `FRONTEND_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:3000,...` |
| `RATE_LIMIT_MAX` | Max general API requests per 15 min window | `100` |
| `AUTH_RATE_LIMIT_MAX` | Max auth attempts per 15 min window | `10` |
| `TRUST_PROXY` | Set `true` if deployed behind reverse proxy (Nginx, ALB) | `false` |

---

## 3. Running the Application

### Development Server (with hot reloading)
```bash
npm run dev
```

### Production Server
```bash
npm start
```

### Running Test Suites
```bash
npm test
```
The test command executes the comprehensive regression test suite covering Steps 1 through 11.

---

## 4. Feature Implementation & Route Overview

### Implemented Modules:
* **Health & Foundation (Step 1):** `GET /health` with live DB ping.
* **Shared Utilities & Router (Steps 2–3):** Standardized error hierarchy, RBAC mapping, tenant scoping, audit logging.
* **Tenant Auth & Registration (Step 4):** `POST /auth/login`, `POST /auth/register-company`, `GET /auth/me`, `GET /public/plans`.
* **Users, Roles, Branches & Teams (Step 5):** User CRUD, role assignments, branch manager scoping, teams.
* **Projects (Step 6):** Project CRUD, status transitions, branch/company verification, audit logging.
* **Tasks, Subtasks & Escalations (Step 7):** Full task lifecycle, subtasks, escalations with blocker reporting.
* **Notifications, Compliance & Evidence (Step 8):** Notifications CRUD, compliance rules, violations, evidence submissions with auto-resolution.
* **Platform Administration (Step 9):** Platform admin login, SaaS metrics, tenant companies overview, plans CRUD, subscriptions, platform admin users.
* **Rate Limiting & Security (Step 10):** General API limiter (100 req/15m), strict auth limiter (10 req/15m), proxy trust configuration.
* **Integration & Multi-Tenant Workflows (Step 11):** End-to-end integration flows, multi-tenant data isolation verification.
* **Process Engine (Step 12):** Process templates, step configurations, process instance instantiation, step approvals/rejections, and state machine transition loopbacks.
* **Evidence Handling & Uploads:** Validated multipart uploads (Multer), Attachment (`file_objects`) records, and secure authenticated file streaming.

---

## 5. Database Compatibility & PostgreSQL Verification

* **Physical Schema Mapping:** All 33 physical snake_case tables and column names in the Neon PostgreSQL database are mapped to the Prisma schema models via `@@map` and `@map`.
* **Verification:** All 30 Prisma models query successfully live against the PostgreSQL database (`node scripts/verify-all-models-live.js`).
* **Non-Destructive Guarantee:** Existing database tables and records are fully preserved without running destructive resets or blind schema pushes.

\n\n
## Backend Refactoring: Routes and Controllers Separation

The backend has been refactored to separate route definitions from business logic.

| Old File | New Route File | New Controller File |
|---|---|---|
| src/routes/health.js | src/routes/health.routes.js | src/controllers/health.controller.js |
| src/routes/auth.routes.js | src/routes/auth.routes.js | src/controllers/auth.controller.js |
| src/routes/users.routes.js | src/routes/users.routes.js | src/controllers/users.controller.js |
| src/routes/projects.routes.js | src/routes/projects.routes.js | src/controllers/projects.controller.js |
| src/routes/tasks.routes.js | src/routes/tasks.routes.js | src/controllers/tasks.controller.js |
| src/routes/process.routes.js | src/routes/process.routes.js | src/controllers/process.controller.js |
| src/routes/org.routes.js | src/routes/roles.routes.js<br>src/routes/branches.routes.js<br>src/routes/teams.routes.js<br>src/routes/audit-logs.routes.js<br>src/routes/permissions.routes.js<br>src/routes/role-templates.routes.js<br>src/routes/role-assignments.routes.js<br>src/routes/bootstrap.routes.js | src/controllers/roles.controller.js<br>src/controllers/branches.controller.js<br>src/controllers/teams.controller.js<br>src/controllers/audit-logs.controller.js<br>src/controllers/permissions.controller.js<br>src/controllers/role-templates.controller.js<br>src/controllers/role-assignments.controller.js<br>src/controllers/bootstrap.controller.js |
| src/routes/compliance.routes.js | src/routes/compliance-rules.routes.js<br>src/routes/compliance-violations.routes.js<br>src/routes/compliance-evidence.routes.js<br>src/routes/compliance-categories.routes.js<br>src/routes/compliance-bindings.routes.js | src/controllers/compliance-rules.controller.js<br>src/controllers/compliance-violations.controller.js<br>src/controllers/compliance-evidence.controller.js<br>src/controllers/compliance-categories.controller.js<br>src/controllers/compliance-bindings.controller.js |
| src/routes/platform.routes.js | src/routes/platform.routes.js | src/controllers/platform.controller.js |
| src/routes/executive.routes.js | src/routes/executive.routes.js | src/controllers/executive.controller.js |
| src/routes/notifications.routes.js | src/routes/notifications.routes.js | src/controllers/notifications.controller.js |
| src/routes/attachments.routes.js | src/routes/attachments.routes.js | src/controllers/attachments.controller.js |
