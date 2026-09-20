# Project Understanding — OptiFlow

> **Methodology**: Evidence-based, phase-by-phase audit.
> Legend: ✅ Confirmed | 🔶 Likely | ❓ Unknown

---

## Audit Progress

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Project Overview | ✅ Complete |
| 2 | Technology Stack | ✅ Complete |
| 3 | Repository Structure | ✅ Complete |
| 4 | Entry Points | ✅ Complete |
| 5 | System Architecture | ✅ Complete |
| 6 | Core Features | ✅ Complete |
| 7 | Feature/Data Flows | ✅ Complete |
| 8 | Backend | ✅ Complete |
| 9 | Frontend | ✅ Complete |
| 10 | Database | ✅ Complete |
| 11 | Authentication & Authorization | ✅ Complete |
| 12 | Configuration & Environment | ✅ Complete |
| 13 | External Services / APIs | ✅ Complete |
| 14 | Error Handling | ✅ Complete |
| 15 | Testing | ✅ Complete |
| 16 | Deployment & Infrastructure | ✅ Complete |
| 17 | Current Flaws & Bugs | ✅ Complete |
| 18 | Missing Functionality | ✅ Complete |
| 19 | Technical Risks | ✅ Complete |
| 20 | Recommended Fixes | ✅ Complete |
| 21 | Final System Map | ✅ Complete |
| 22 | Open Questions & Audit Sign-Off | ✅ Complete |

---

## 1. Project Overview

### Purpose

**OptiFlow** is a centralized, web-based **Office & Organizational Workflow Management System**. It is built as a multi-tenant SaaS platform that standardizes task execution, enforces predefined workflows, integrates automated compliance checks, and maintains immutable audit logs.

It targets organizations that currently rely on fragmented tools (emails, spreadsheets, chat) for operations and compliance.

### Application Type

✅ **Multi-Tenant SaaS Web Application** with a clear separation between:
- A platform layer (SaaS business owner / superuser controlling tenant companies)
- A company/org layer (each tenant company managing its own branches, employees, and work)
- An end-user layer (employees executing tasks, submitting evidence)

### Intended Users / Actors

| Actor | Scope | Responsibilities |
|-------|-------|-----------------|
| **Superuser / Platform Admin** | Platform-wide | Manage tenant companies, plans, billing, global audit |
| **Company Owner / Org Admin** | Per company | Branches, departments, employee roles, company billing |
| **Executive** | Per company | Cross-branch dashboards, reports, analytics (read-only) |
| **Compliance Officer** | Per company | Define compliance rules, audit evidence, resolve violations |
| **HR** | Per company | Employee profiles, role assignments, team hierarchy |
| **Process Admin** | Per company | Design workflow templates, configure stages & approvals |
| **Project Manager (PM)** | Per company | Create projects/tasks, assign to Team Leaders, escalations |
| **Team Leader (TL)** | Per team | Break tasks into subtasks, assign to members, review submissions |
| **Team Member** | Per task | Execute tasks, update status, submit evidence |

### Major Features

✅ (confirmed from README + module list + frontend directory structure)

1. **Multi-Tenant Company Management** — onboard companies, manage subscriptions/plans
2. **Task & Project Management** — projects → tasks → subtasks hierarchy with status tracking
3. **Workflow / Process Engine** — configurable process templates with stages and approval sequences
4. **Compliance Engine** — compliance rules, categories, bindings to tasks/processes, violation tracking
5. **Evidence Management** — file uploads attached to tasks/subtasks for compliance verification
6. **Role-Based Access Control (RBAC)** — granular roles, permissions, role templates
7. **Escalations** — task/subtask escalation chains
8. **Audit Logs** — immutable event log across the platform
9. **Notifications** — event-driven notification system (EventEmitter2)
10. **Executive Analytics** — cross-branch performance dashboards and reports
11. **Comments & Attachments** — collaboration on tasks
12. **Platform Support Access** — controlled support access for the SaaS operator

### High-Level Architecture

✅ **Separated frontend/backend monorepo** (not microservices):

```
front-end/          ← Vanilla JS + HTML5 static web application
back-end/           ← NestJS (TypeScript) REST API server
Database/           ← PostgreSQL via Prisma ORM
```

- Frontend is a **pure static site** (no framework, no bundler) — served independently
- Backend is a **NestJS monolith** with a modular domain structure (34 domain modules)
- Database is **PostgreSQL** accessed exclusively through **Prisma ORM**
- Communication is via **HTTP REST API** with custom headers for auth/tenant context

### Monolithic vs Distributed

✅ **Monolithic backend** — single NestJS application with 34 domain modules all in one process.
✅ **Separate frontend** — static HTML/JS served by any static web server.
❓ **No Docker, CI/CD, or deployment configuration** found yet — deployment approach unknown.

### Swagger / API Documentation

✅ Swagger UI is generated and available at `http://localhost:5500/api/docs`.
✅ `swagger.json` is written to `back-end/docs/` on every startup.

### Notable Observations (Phase 1)

- The Swagger `DocumentBuilder` title still reads **"OfficeSync API"** (old project name), not "OptiFlow" — indicating a rename occurred mid-development. ⚠️
- Authentication appears to use **custom HTTP headers** (`x-user-role`, `x-user-id`, `x-company-id`, `x-platform-admin-id`) rather than standard JWT Bearer tokens — this is architecturally unusual and a likely security risk to examine in Phase 11.
- The frontend has **9 distinct role-based UI areas**: `platform-admin/`, `admin/hr/`, `admin/pm/`, `admin/compliance/`, `admin/executive/`, `enduser/` (TL + Member), `superuser/`, `admin/processes/`, `modules/`.

---

## 2. Technology Stack

### Backend

| Technology | Version (package.json) | Where Used |
|------------|----------------------|------------|
| **NestJS** | ^11.0.1 | Core framework — all modules, controllers, services, guards |
| **TypeScript** | ^5.7.3 | All backend source code (`src/**/*.ts`) |
| **Node.js** | ≥18 (required) | Runtime |
| **Express** | (via `@nestjs/platform-express ^11`) | Underlying HTTP adapter |
| **Prisma ORM** | ^6.19.3 (client + CLI) | Sole database access layer; `PrismaService` injected everywhere |
| **PostgreSQL** | Not versioned here | Database; connection string in `DATABASE_URL` env var |
| **bcryptjs** | ^3.0.3 | Password hashing in `auth.service.ts` (login + register) |
| **jsonwebtoken** | ^9.0.3 | JWT signing in `auth.service.ts` → `registerCompany()` only |
| **Helmet** | ^8.3.0 | Security headers in `main.ts` |
| **EventEmitter2** | ^12.0.0 (via `@nestjs/event-emitter`) | Event-driven notifications; registered globally in `app.module.ts` |
| **class-validator** | ^0.15.1 | DTO validation via `ValidationPipe` (global in `main.ts`) |
| **class-transformer** | ^0.5.1 | DTO transformation via `ValidationPipe` |
| **@nestjs/swagger** | ^11.3.0 | Auto-generated OpenAPI docs at `/api/docs`; `swagger.json` written to `docs/` on start |
| **@nestjs/config** | ^4.0.4 | Global `ConfigModule` loaded from `.env` |
| **Multer** | (types only: `@types/multer ^2.2.0`) | File upload handling (evidence attachments) |
| **Jest** | ^30.0.0 | Unit and e2e test runner |
| **ts-jest** | ^29.2.5 | TypeScript Jest transform |
| **Supertest** | ^7.0.0 | HTTP assertion for e2e tests |
| **Prettier** | ^3.4.2 | Code formatter (`.prettierrc`) |
| **ESLint** | ^9.18.0 | Linter (`eslint.config.mjs`) |

### Frontend

| Technology | Where Used |
|------------|------------|
| **Vanilla JavaScript (ES6+)** | All frontend pages — no framework, no bundler |
| **HTML5** | All pages (`.html` files are the "components") |
| **Modular CSS3** | Role-scoped CSS files in `front-end/css/` |
| **Browser sessionStorage** | Auth session storage — `currentUser` key stores user object post-login |
| **Browser localStorage** | Secondary session persistence (same keys) |
| **No build tool / bundler** | ✅ Confirmed — static files served directly |
| **`serve.json`** | Minimal config for `npx serve` static server |

### Database

| Technology | Details |
|------------|--------|
| **PostgreSQL** | Target database; version unspecified |
| **Prisma ORM** | Schema at `back-end/prisma/schema.prisma` (731 lines); client auto-generated |
| **Prisma Migrations** | `back-end/prisma/migrations/` directory present |
| **Seed scripts** | `prisma/seed.ts` (49 KB — very large) + `seed-demo-rich.ts` (5 KB) |

### Security & Auth Technologies

| Technology | Status | Notes |
|------------|--------|-------|
| **bcryptjs** | ✅ Used | Password hashing at registration and login |
| **jsonwebtoken** | ⚠️ Partially used | JWT is only generated during `registerCompany()`. The `login()` method does **NOT** issue a JWT — it returns user data directly. |
| **Custom HTTP headers** | ✅ Primary auth mechanism | `x-user-id`, `x-user-role`, `x-company-id`, `x-platform-admin-id` — parsed by `TenantMiddleware` and `RolesGuard` |
| **sessionStorage** | ✅ Frontend session | `currentUser` JSON object stored post-login; checked by `auth.js` |
| **Helmet** | ✅ Used | Security headers in `main.ts` with CSP directives |

### Build & Tooling

| Tool | Purpose |
|------|---------|
| `@nestjs/cli` | Code generation, build (`nest build`), dev server (`nest start --watch`) |
| `tsconfig.json` | ES2023 target, `nodenext` module resolution, `experimentalDecorators` enabled, **`noImplicitAny: false`** (weak typing) |
| `tsconfig.build.json` | Build-specific exclusions |
| `nest-cli.json` | Source root `src/`, `deleteOutDir: true` on build |
| `npx serve` | Frontend static serving in dev |

### Infrastructure

| Technology | Status |
|------------|--------|
| Docker / Docker Compose | ❓ Not found yet |
| CI/CD pipeline | ❓ Not found yet |
| Cloud hosting config | ❓ Not found yet |

---

### ⚠️ Critical Technology Findings (Phase 2)

1. **Hybrid / inconsistent auth**: `jsonwebtoken` is installed and used in `registerCompany()` (returns a JWT). But the `login()` endpoint does **not** issue any token. Post-login, the frontend stores raw user data in `sessionStorage` and sends it back as plain HTTP headers (`x-user-id`, `x-user-role`). The backend `TenantMiddleware` trusts these headers to resolve the acting user. This is a **security design mismatch** — JWT exists in the codebase but is not being used for the main auth flow.

2. **`noImplicitAny: false`** in `tsconfig.json`: TypeScript's strongest safety net is disabled, meaning untyped `any` values silently propagate. This increases the risk of runtime type errors.

3. **Old project name residue**: `auth.js` still references `officesync_global_state` in `clearAppSession()`, and the Swagger title is "OfficeSync API" — confirming an incomplete rename from a prior project name.

---

## 3. Repository Structure

```
2_OptiFlow/                          ← Monorepo root
├── README.md                        ← Project overview, setup guide, actor table
├── definitions.yaml                 ← OpenAPI-style entity definitions (supplementary docs)
├── DomainExpertInteraction.md       ← Domain expert interview notes / requirements log
├── SRS.pdf                          ← Software Requirements Specification document
├── LICENSE
├── .gitattributes
│
├── back-end/                        ← NestJS API server (TypeScript)
│   ├── src/
│   │   ├── main.ts                  ← App bootstrap: Helmet, CORS, Swagger, GlobalPipes, Guards
│   │   ├── app.module.ts            ← Root module: registers all 34 domain modules + middleware
│   │   ├── app.controller.ts        ← Health-check / ping endpoint
│   │   ├── app.service.ts           ← Trivial stub
│   │   │
│   │   ├── core/                    ← Cross-cutting infrastructure (not domain logic)
│   │   │   ├── database/
│   │   │   │   ├── database.module.ts
│   │   │   │   └── database.service.ts  ← ⚠️ 63 KB — likely a large query/helper service
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts    ← PrismaClient wrapper; injected across all modules
│   │   │   ├── guards/
│   │   │   │   ├── roles.guard.ts       ← Global RBAC guard (x-user-role / req.user check)
│   │   │   │   ├── roles.decorator.ts   ← @Roles() decorator
│   │   │   │   ├── company-id.guard.ts  ← Validates x-company-id header presence
│   │   │   │   └── platform-admin.guard.ts ← Guard for platform-only routes
│   │   │   ├── middleware/
│   │   │   │   ├── tenant.middleware.ts  ← ⚠️ Core auth: resolves req.user from DB via headers
│   │   │   │   ├── logger.middleware.ts  ← HTTP request logger
│   │   │   │   └── route-request.middleware.ts
│   │   │   ├── interceptors/
│   │   │   │   └── transform.interceptor.ts ← Wraps all responses in standard envelope
│   │   │   ├── filters/
│   │   │   │   └── global-exception.filter.ts ← Global error handler
│   │   │   ├── decorators/
│   │   │   │   ├── actor-user.decorators.ts    ← @ActorUser() param decorator
│   │   │   │   ├── company-id.decorator.ts     ← @CompanyId() param decorator
│   │   │   │   ├── platform-admin.decorators.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── logging/
│   │   │   │   ├── logging.module.ts
│   │   │   │   └── logging.service.ts          ← File-based logger (writes to back-end/logs/)
│   │   │   ├── services/
│   │   │   │   └── plan-limit.service.ts       ← Enforces subscription plan limits
│   │   │   └── utils/
│   │   │       └── tenant-scope.util.ts        ← Prisma WHERE clause builder for tenant scoping
│   │   │
│   │   └── modules/                 ← 34 domain modules (each: module.ts, controller.ts, service.ts, dto/)
│   │       │
│   │       ├── ── PLATFORM LAYER ──
│   │       ├── plans/               ← SaaS subscription plan definitions
│   │       ├── platform-admin-users/← Platform superuser accounts
│   │       ├── platform/            ← Platform-level management endpoints
│   │       ├── platform-support-access/ ← Controlled support impersonation
│   │       ├── subscriptions/       ← Company subscription management
│   │       ├── companies/           ← Tenant company CRUD + onboarding
│   │       │
│   │       ├── ── IDENTITY & ACCESS ──
│   │       ├── auth/                ← login(), registerCompany(), getPublicPlans()
│   │       ├── permissions/         ← Granular permission definitions
│   │       ├── roles/               ← Company-scoped role definitions
│   │       ├── role-templates/      ← Platform-level role templates (cloned on company creation)
│   │       ├── role-assignments/    ← Assigns roles to users with scope
│   │       │
│   │       ├── ── ORGANISATION ──
│   │       ├── branches/            ← Company branch management
│   │       ├── teams/               ← Team definitions and membership
│   │       ├── users/               ← Employee user management
│   │       │
│   │       ├── ── WORK ──
│   │       ├── projects/            ← Project CRUD and assignment
│   │       ├── tasks/               ← Task lifecycle (Draft→Active→InReview→Completed)
│   │       ├── subtasks/            ← Subtask breakdown and assignment
│   │       ├── escalations/         ← Task/subtask escalation chains
│   │       │
│   │       ├── ── PROCESS ENGINE ──
│   │       ├── process-templates/   ← Configurable workflow template definitions
│   │       ├── process-instances/   ← Active workflow runs
│   │       ├── process-instance-steps/ ← Individual step state in a running process
│   │       │
│   │       ├── ── COMPLIANCE ──
│   │       ├── compliance-categories/   ← Category groupings for rules
│   │       ├── compliance-rules/        ← Rule definitions (severity, policy)
│   │       ├── compliance-bindings/     ← Rules bound to tasks/processes
│   │       ├── compliance-violations/   ← Detected violation records
│   │       ├── evidence/                ← File evidence submissions (Multer uploads)
│   │       │
│   │       ├── ── CROSS-CUTTING ──
│   │       ├── comments/            ← Comments on tasks/subtasks
│   │       ├── attachments/         ← File attachments (general)
│   │       ├── audit-logs/          ← Immutable event log
│   │       ├── notifications/       ← In-app notification records
│   │       │
│   │       ├── ── RBAC ROLE-GATED CONTROLLERS ──
│   │       ├── metrics/             ← Aggregated metrics endpoints
│   │       ├── executive/           ← Executive analytics (cross-branch)
│   │       ├── process/             ← Process admin view endpoints
│   │       └── governance/          ← HR/Access governance endpoints
│   │
│   ├── prisma/
│   │   ├── schema.prisma            ← Full DB schema (731 lines, 30+ models)
│   │   ├── seed.ts                  ← ⚠️ 49 KB — large seeder with realistic company data
│   │   ├── seed-demo-rich.ts        ← Lighter demo seed variant
│   │   └── migrations/
│   │       └── 20260824182231_init/ ← Single initial migration (entire schema in one shot)
│   │
│   ├── test/                        ← e2e test suite (8 spec files)
│   │   ├── app.e2e-spec.ts
│   │   ├── cors-security.e2e-spec.ts
│   │   ├── error-handling.e2e-spec.ts
│   │   ├── helmet-security.e2e-spec.ts
│   │   ├── rbac-routing.e2e-spec.ts
│   │   ├── router-middleware.e2e-spec.ts
│   │   ├── system-logging.e2e-spec.ts
│   │   └── jest-e2e.json
│   │
│   ├── docs/                        ← Auto-generated swagger.json (written on startup)
│   ├── logs/                        ← Runtime log files (application + error, date-stamped)
│   ├── uploads/                     ← Uploaded evidence files (served at /uploads/*)
│   ├── dist/                        ← Compiled output (nest build)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── eslint.config.mjs
│   ├── .env                         ← Actual env values (gitignored)
│   ├── .env.example                 ← Template: DATABASE_URL, PORT, JWT_SECRET, FRONTEND_ORIGINS
│   ├── inject-seed.js               ← Utility: injects seed data into running DB
│   ├── rename_workflow.js           ← One-off dev script (file renaming)
│   ├── scaffold.js                  ← Code scaffold generator
│   └── update_controllers.py        ← Python script to batch-update controller files
│
├── front-end/                       ← Static HTML/JS/CSS application
│   ├── index.html                   ← Landing/marketing page
│   ├── login.html                   ← Shared login page (all roles)
│   ├── register.html                ← Company self-registration form
│   ├── forgot-password.html         ← Password reset request
│   ├── reset-password.html          ← Password reset form
│   ├── settings.html                ← Global settings page
│   ├── about.html / contact.html    ← Marketing pages
│   ├── unauthorized.html            ← 403 / access denied page
│   ├── serve.json                   ← npx serve config
│   │
│   ├── platform-admin/              ← Superuser / SaaS platform admin dashboards
│   │   ├── dashboard.html           ← Platform overview
│   │   ├── companies.html           ← Tenant company management
│   │   ├── plans.html               ← Subscription plan management
│   │   ├── subscriptions.html       ← Subscription records
│   │   ├── platform-admins.html     ← Platform admin user management
│   │   ├── platform-login.html      ← Separate login for platform admins
│   │   └── support-access.html      ← Support impersonation access log
│   │
│   ├── admin-console/               ← System Admin (Org Owner post-registration) dashboard
│   │   ├── admin-dashboard.html     ← Top-level org admin overview
│   │   ├── admin-billing.html
│   │   ├── admin-governance.html
│   │   └── admin-organization.html
│   │
│   ├── superuser/                   ← ⚠️ Confusingly named: actually 'Process Admin' dashboard
│   │   ├── dashboard.html
│   │   ├── analytics.html
│   │   ├── audit.html
│   │   ├── billing.html
│   │   ├── branches.html
│   │   ├── process-builder.html
│   │   ├── processes.html
│   │   ├── settings.html
│   │   └── users.html
│   │
│   ├── admin/                       ← Role-specific admin dashboards (HR / PM / Compliance / Executive)
│   │   ├── hr/                      ← HR Manager / Access Governance dashboards
│   │   │   ├── dashboard.html / hr-dashboard.html
│   │   │   ├── new-employee.html
│   │   │   ├── employee-detail.html
│   │   │   ├── roles-access.html / roles-individual.html / roles-system.html
│   │   │   ├── teams-structure.html
│   │   │   └── settings.html
│   │   ├── pm/                      ← Project Manager + HR shared dashboards
│   │   │   ├── pm-dashboard.html
│   │   │   ├── hr-dashboard.html    ← ⚠️ HR dashboard duplicated under PM directory
│   │   │   ├── compliance-dashboard.html
│   │   │   ├── evidence-review.html
│   │   │   ├── violations.html
│   │   │   ├── employees.html
│   │   │   └── settings.html
│   │   ├── compliance/              ← Compliance Officer dashboards
│   │   │   ├── compliance_audit_log.html
│   │   │   ├── compliance_evidence.html
│   │   │   ├── compliance_reports.html
│   │   │   ├── compliance_rules.html
│   │   │   └── compliance_violations.html
│   │   ├── executive/               ← Executive role dashboards
│   │   │   ├── executive_dashboard.html/js
│   │   │   ├── executive_compliance.html/js
│   │   │   ├── executive_projects.html/js
│   │   │   ├── executive_reports.html/js
│   │   │   └── executive_tasks.html/js
│   │   └── processes/               ← Process builder (single file only)
│   │       └── process-builder.js
│   │
│   ├── enduser/                     ← Team Leader + Team Member dashboards
│   │   ├── tl-dashboard.html/js     ← Team Leader dashboard + logic
│   │   ├── member-dashboard.html/js ← Team Member dashboard + logic
│   │   ├── my-tasks.html
│   │   ├── task-detail.html/js      ← Task detail view (41 KB JS — complex)
│   │   ├── evidence.html
│   │   ├── evidence-review.html
│   │   └── tl-evidence-review.html
│   │
│   ├── modules/                     ← Shared feature pages (used across roles)
│   │   ├── compliance.html
│   │   ├── governance.html
│   │   ├── process-builder.html
│   │   ├── projects.html
│   │   └── tasks.html
│   │
│   ├── js/                          ← Shared JavaScript
│   │   ├── helpers.js               ← 40 KB general-purpose API helper/utilities
│   │   ├── tasks-store.js           ← Client-side task state store
│   │   ├── components/              ← Reusable UI components
│   │   │   ├── sidebar.js           ← Dynamic sidebar (23 KB)
│   │   │   ├── modal.js             ← Modal manager
│   │   │   ├── notifications.js     ← Notification panel
│   │   │   ├── toast.js             ← Toast notifications
│   │   │   ├── table.js             ← Table renderer
│   │   │   └── executive-branch-switcher.js
│   │   ├── utils/
│   │   │   ├── auth.js              ← Session management, protectPage(), logout()
│   │   │   ├── helpers.js           ← 40 KB API call wrappers + utilities
│   │   │   └── validator.js         ← Client-side form validation
│   │   ├── data/                    ← Client-side data stores (mock + live)
│   │   │   ├── db.js                ← API base config / fetch wrapper
│   │   │   ├── hr-data-store.js     ← HR data cache/state (17 KB)
│   │   │   ├── roles-store.js       ← Roles data cache (16 KB)
│   │   │   ├── pm-data-store.js     ← PM data cache
│   │   │   ├── processes.js         ← Process data helper (13 KB)
│   │   │   ├── new-employee.js      ← Employee creation data helper
│   │   │   ├── audit-store.js
│   │   │   ├── branches.js
│   │   │   ├── departments.js
│   │   │   ├── permissions.js
│   │   │   └── workflows.js
│   │   └── pages/                   ← Page-specific JS (loaded per HTML page)
│   │       ├── auth-flows.js        ← Login/register form handlers
│   │       ├── landing.js
│   │       ├── hr/                  ← HR page scripts
│   │       ├── pm/                  ← PM page scripts (projects.js 27KB, tasks.js 30KB)
│   │       ├── compliance/          ← Compliance page scripts
│   │       └── superuser/           ← Process admin page scripts
│   │
│   ├── css/                         ← Stylesheets
│   │   ├── base.css / components.css / layout.css
│   │   ├── auth.css / landing.css / marketing.css
│   │   ├── hr/ pm/ compliance/      ← Role-scoped CSS subdirectories
│   │   └── ...
│   └── assets/
│       └── images/                  ← Image assets
│
├── Database/
│   ├── schema.prisma                ← Copy of DB schema (canonical is in back-end/prisma/)
│   ├── ER Diagram.svg               ← Visual ER diagram (1.2 MB)
│   └── ER diagram.png               ← PNG export of ER diagram
│
├── Figma designs/                   ← UI/UX mockups and design exports
└── Video/                           ← Demo video assets
```

### Notable Structural Observations

| Observation | Severity | Detail |
|-------------|----------|--------|
| `database.service.ts` is **63 KB** | ⚠️ High | Unusually large for a single service; suggests massive query logic all in one file |
| `seed.ts` is **49 KB** | ℹ️ Info | Very rich seed data; good for demos but slow to re-run |
| Single Prisma migration | ℹ️ Info | Only one migration (`_init`); entire schema created in one shot — no incremental migrations |
| `front-end/superuser/` is actually the **Process Admin** dashboard | ⚠️ Medium | The auth service routes `process_admin` → `superuser/dashboard.html`, creating a naming mismatch |
| `admin/pm/` contains an `hr-dashboard.html` | ⚠️ Medium | HR dashboard appears duplicated across `admin/hr/` and `admin/pm/` |
| `helpers.js` exists in BOTH `js/` root AND `js/utils/` | ⚠️ Medium | Two files named `helpers.js` — likely a duplication/conflict |
| One-off dev scripts in `back-end/` root | ℹ️ Info | `scaffold.js`, `rename_workflow.js`, `update_controllers.py` are development utilities left in the root |

---

## 4. Application Entry Points

### Backend Entry Point

**File**: [`back-end/src/main.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/main.ts)
**Start command**: `npm run start:dev` → `nest start --watch`
**Production command**: `npm run start:prod` → `node dist/main`

#### Backend Startup Sequence

```
npm run start:dev
        ↓
NestJS creates NestExpressApplication (AppModule)
        ↓
[Step 1] ConfigModule loaded (global) ← reads back-end/.env
        ↓
[Step 2] EventEmitterModule initialized (global)
        ↓
[Step 3] PrismaModule initialized
          └── PrismaService.onModuleInit()
               └── prisma.$connect() with 5 retries (2s delay each)
               └── Connects to DATABASE_URL (Neon hosted PostgreSQL)
        ↓
[Step 4] LoggingModule initialized
          └── LoggingService resolves logs/ directory
          └── Creates back-end/logs/ if not exists
          └── Writes date-stamped application-YYYY-MM-DD.log and error-YYYY-MM-DD.log
        ↓
[Step 5] All 34 domain modules initialized (order by AppModule imports)
        ↓
[Step 6] Helmet security headers applied
          └── CSP, CORS-OP=cross-origin, HSTS only in production
        ↓
[Step 7] CORS enabled
          └── Origins from FRONTEND_ORIGINS env var
          └── Fallback: localhost:5500, 127.0.0.1:5500, localhost:3000, localhost:64064
        ↓
[Step 8] Global pipes, guards, interceptors registered
          ├── ValidationPipe (transform + whitelist)
          ├── RolesGuard (global, reads @Roles() decorators)
          └── TransformInterceptor (wraps all responses: { success, data })
        ↓
[Step 9] Middleware bound to all routes ('*')
          ├── LoggerMiddleware (records HTTP method/path/status/duration)
          └── TenantMiddleware (resolves req.user from x-user-id header via DB lookup)
        ↓
[Step 10] Swagger document built → written to back-end/docs/swagger.json
        ↓
[Step 11] uploads/ directory created if not exists
        ↓
[Step 12] app.listen(PORT) — defaults to 5500
          └── http://localhost:5500 (API)
          └── http://localhost:5500/api/docs (Swagger UI)
```

#### Backend Route Registration

Each NestJS module registers its own controller routes automatically when the module is imported into `AppModule`. No manual route registration is needed.

#### Important: Global Exception Filter

The `GlobalExceptionFilter` is **NOT registered globally in `main.ts`** — it is not in the `useGlobalFilters()` call. ✅ Confirmed: it must be registered elsewhere or not at all. This needs follow-up in Phase 14.

---

### Frontend Entry Points

The frontend has **no build step** and **no bundler**. Each HTML page is its own entry point. Scripts are loaded via `<script>` tags directly in each HTML file.

#### Public Entry Points (no auth required)

| URL Path | File | Purpose |
|----------|------|---------|
| `/index.html` | `front-end/index.html` | Landing / marketing page |
| `/login.html` | `front-end/login.html` | Shared login for all company roles |
| `/register.html` | `front-end/register.html` | Company self-registration |
| `/forgot-password.html` | `front-end/forgot-password.html` | Password reset request |
| `/reset-password.html` | `front-end/reset-password.html` | Password reset form |
| `/platform-admin/platform-login.html` | `front-end/platform-admin/platform-login.html` | Platform admin separate login |

#### Role-Based Entry Points (auth-guarded)

| Role | Entry Page | Auth Guard |
|------|-----------|------------|
| System Admin (Org Owner) | `admin-console/admin-dashboard.html` | `protectPage(['system_admin'])` |
| Company Owner / Branch Manager | `admin/executive/executive_dashboard.html` | `protectPage(['company_owner', 'branch_manager'])` |
| HR / Access Governance | `admin/pm/hr-dashboard.html` | `protectPage(['hr_manager'])` |
| Process Admin | `superuser/dashboard.html` | `protectPage(['process_admin'])` |
| Project Manager | `admin/pm/pm-dashboard.html` | `protectPage(['project_manager'])` |
| Compliance Officer | `modules/compliance.html` | `protectPage(['compliance_officer'])` |
| Team Leader | `enduser/tl-dashboard.html` | `protectPage(['team_leader'])` |
| Team Member | `enduser/member-dashboard.html` | `protectPage(['team_member'])` |
| Platform Admin | `platform-admin/dashboard.html` | Separate platform login flow |

#### Frontend Login Flow (Traced)

```
User opens login.html
        ↓
login.html loads css/auth.css, js/pages/auth-flows.js
        ↓
User submits email + password
        ↓
auth-flows.js: fetch POST http://localhost:5500/auth/login
  { email, password }
        ↓
    ┌──────────────────────────────────────────────────────┐
    │ Backend: AuthController.login()                          │
    │   └─ AuthService.login()                                 │
    │       └─ bcrypt.compare(password, user.passwordHash)      │
    │       └─ Resolve roleLabel from RoleAssignments           │
    │       └─ Determine targetRoute (hardcoded path map)       │
    │       └─ Write audit log entry                           │
    │       └─ Return { success, targetRoute, roleSlug, user } │
    └──────────────────────────────────────────────────────┘
        ↓ (200 OK + user payload)
Frontend stores user object in sessionStorage["currentUser"]
  { id, name, email, role, roleLabel, companyId, ... }
        ↓
window.location.href = targetRoute  ← redirects to role dashboard
        ↓
Dashboard page loads, calls protectPage([allowedRoles])
  └─ Reads sessionStorage["currentUser"]
  └─ Checks user.role against allowedRoles
  └─ If mismatch → redirect to login.html
```

#### Frontend API Base URL

✅ **Confirmed hardcoded**: `http://localhost:5500` appears in:
- `front-end/js/pages/auth-flows.js` line 88 (login fetch)
- `front-end/js/pages/auth-flows.js` line 76 (fallback fetch)
- `front-end/js/utils/helpers.js` (Helpers.api.request base URL)

This means the frontend **cannot be deployed to any environment** without manually changing the API URL everywhere.

---

### ⚠️ Critical Entry Point Findings (Phase 4)

| Finding | Severity | Detail |
|---------|----------|--------|
| **API URL hardcoded to `localhost:5500`** | 🔴 Critical | `auth-flows.js` line 88 and Helpers both use `http://localhost:5500`. No environment config exists in the frontend. |
| **Login has a dangerous password-bypass fallback** | 🔴 Critical | If `/auth/login` throws a network error, `auth-flows.js` falls back to fetching the full `/users` list and comparing emails **without password verification** (lines 132–195). Any user can log in as anyone if the backend is temporarily unreachable or throws. |
| **`JWT_SECRET` is absent from actual `.env`** | 🔴 Critical | The `.env` only has `DATABASE_URL` and `NODE_ENV`. `JWT_SECRET` is missing — the app falls back to `'fallback_secret'` (hardcoded in `auth.service.ts` line 342). |
| **Database is hosted on Neon cloud** | ℹ️ Info | `DATABASE_URL` points to `ep-floral-grass-az05r3yb.c-3.ap-southeast-1.aws.neon.tech` — a real hosted cloud DB, not local PostgreSQL. This is important for deployment context. |
| **`GlobalExceptionFilter` not applied globally** | ⚠️ Medium | Not found in `main.ts` `useGlobalFilters()`. Needs confirmation in Phase 14. |
| **`db.js` has hardcoded password `'123'`** | ⚠️ Medium | Line 86 sets `password: '123'` as a legacy field on every user object returned by `getUsers()`. This is leftover mock data. |

---

## 5. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│              USER (Browser)                                │
└─────────────────────────────┬────────────────────────────┘
                             │
         ┌───────────────┴───────────────┐
         │                              │
         ↓ Page Navigation              ↓ HTTP REST API calls
         │  (HTML files)                │  (fetch to localhost:5500)
         │                              │
┌────────────────────┐  ┌────────────────────────────────────┐
│   FRONTEND (Static)    │  │      BACKEND (NestJS Monolith)      │
│                        │  │  Port: 5500                        │
│  Vanilla JS + HTML5    │  │  ================================= │
│  Served by: npx serve  │  │  Middleware Layer:                 │
│                        │  │   LoggerMiddleware                 │
│  sessionStorage:       │  │   TenantMiddleware (user resolve)  │
│   currentUser{         │  │  Guard Layer:                      │
│     id, role,          │  │   RolesGuard (RBAC check)          │
│     companyId, ...     │  │  Interceptor:                      │
│   }                    │  │   TransformInterceptor             │
│                        │  │  Domain Modules (34):              │
│  Headers sent:         │  │   Controller → Service → Prisma   │
│   x-user-id            │  │  EventEmitter2 (internal):         │
│   x-user-role          │  │   task.completed → compliance     │
│   x-company-id         │  │  PlanLimitService (cross-cutting)  │
│   Authorization: Bearer│  │  LoggingService (file-based)       │
└────────────────────┘  └───────────────┬────────────────────┘
                                          │
                               ┌────────┴────────┐
                               │  Prisma ORM  │
                               └────────┬────────┘
                                        │
                               ┌───────┴──────────┐
                               │  PostgreSQL             │
                               │  (Neon Cloud)           │
                               │  ap-southeast-1.aws     │
                               └────────────────────┘

     FILE STORAGE (local disk)
     back-end/uploads/  ← evidence files served at /uploads/*
     back-end/logs/     ← date-stamped application + error logs
```

> ✅ **Confirmed**: No external third-party APIs, message queues, Redis, S3, or email service exist. All communication is internal HTTP REST + in-process EventEmitter2.

---

### Layer Responsibilities

#### 1. Frontend Layer

| Responsibility | How |
|----------------|-----|
| Render role-based dashboards | Each role has dedicated HTML pages |
| Client-side auth guard | `protectPage()` in `auth.js` reads `sessionStorage` |
| API communication | `window.Helpers.api.request()` — sends headers from session |
| Session management | `sessionStorage["currentUser"]` JSON object |
| Global state cache | `window.Helpers.getState()` with 30-second TTL in sessionStorage |
| Role routing | `auth-flows.js` redirects to role-specific page post-login |

#### 2. Backend Middleware Layer (per request)

Every request passes through this pipeline in order:

```
HTTP Request
    ↓
LoggerMiddleware  ← records method/path/duration to file
    ↓
TenantMiddleware  ← resolves req.user from x-user-id header via DB lookup
    ↓              (or falls back to first user in DB if no header provided)
RolesGuard        ← checks @Roles() against req.user.role / req.user.roleLabel
    ↓
TransformInterceptor  ← wraps response in { success: true, data: ... }
    ↓
Controller Handler
    ↓
Service / PrismaService
    ↓
HTTP Response
```

#### 3. Backend Service Layer (Domain Modules)

Each of the 34 domain modules follows the same pattern:

```
Controller  ← receives HTTP, validates DTO, extracts headers/params
    ↓
Service     ← business logic, calls PrismaService
    ↓
PrismaService  ← single shared Prisma client, executes typed queries
    ↓
PostgreSQL (Neon)
```

Cross-cutting services available to all modules:
- **`PrismaService`** — shared DB client (injected everywhere)
- **`AuditLogsService`** — write immutable audit records (injected by tasks, subtasks, auth, etc.)
- **`EventEmitter2`** — publish domain events (e.g., `task.completed`)
- **`PlanLimitService`** — check subscription limits before create operations
- **`LoggingService`** — file-based structured logger

#### 4. Event-Driven Layer (Internal)

```
TasksService.updateStatus()
    ↓ (status becomes 'Completed')
this.eventEmitter.emit('task.completed', task)
    ↓ (in-process, synchronous-like)
ComplianceObserverService.handleTaskCompleted(task)
    ↓
  IF task has no evidence AND 'Mandatory Code Review' binding exists
    THEN auto-create ComplianceViolation record
```

> ⚠️ **Only one event** (`task.completed`) and **one listener** found. The EventEmitter2 infrastructure is largely unused beyond this single flow.

#### 5. Database Layer

| Aspect | Detail |
|--------|--------|
| ORM | Prisma (type-safe queries; no raw SQL found) |
| DB | PostgreSQL on Neon cloud (shared dev instance) |
| Connection | `PrismaService` with 5-retry connect on startup |
| Migrations | Single `_init` migration; schema changes via `npx prisma db push` |
| Seeding | `prisma/seed.ts` (49 KB) via `npm run seed` |
| File storage | Local disk (`uploads/`) — not in DB, not in cloud storage |

---

### Multi-Tenancy Architecture

OptiFlow uses a **shared-database, separate-data** multi-tenancy model:

```
Platform Layer
  └─ PlatformAdminUser (SaaS operator)
       └─ Plan (defines limits)
            └─ Subscription (per company)

Tenant Layer (per Company)
  Company
    ├─ Branch[]
    │    └─ Team[]
    │         └─ Project[]
    │              └─ Task[]
    │                   └─ Subtask[]
    ├─ User[]
    ├─ Role[]
    ├─ ComplianceRule[]
    └─ AuditLog[]
```

**Tenancy enforcement strategy** (confirmed from code):

| Mechanism | Where | How |
|-----------|-------|-----|
| `TenantMiddleware` | Every request | Resolves `req.user.companyId` from DB (not just trusted from header) |
| `tenant-scope.util.ts` | Service layer | Builds Prisma `WHERE` clauses scoped to `companyId` |
| `buildTaskListWhere()` | Tasks queries | Adds `companyId` + optional `branchId` filter |
| `buildProjectListWhere()` | Project queries | Same pattern |
| `assertBranchManagerScope()` | Mutations | Throws 403 if branch manager acts outside their branch |
| Plan limits | `PlanLimitService` | Enforces `maxBranches`, `maxUsers` per subscription |

> ✅ **Confirmed**: Multi-tenancy IS enforced server-side via DB-resolved `companyId` on `req.user`. It is NOT purely header-trusted (resolves answer to Open Question #4).
>
> ⚠️ **However**: The `TenantMiddleware` fallback path (lines 118–124) resolves to the **first user in the entire database** when no `x-user-id` or `x-company-id` header is present. This effectively bypasses tenancy for unauthenticated requests.

---

### Internal Module Dependency Map (Key Dependencies)

```
auth            → PrismaService, bcryptjs, jsonwebtoken
tasks           → PrismaService, AuditLogsService, EventEmitter2, tenant-scope.util
subtasks        → PrismaService, AuditLogsService, EventEmitter2 (likely)
evidence        → PrismaService, Multer (file upload)
complianceViol. → PrismaService, EventEmitter2 (@OnEvent listener)
branches        → PrismaService, PlanLimitService
users           → PrismaService, PlanLimitService
all modules     → PrismaService (shared singleton)
```

---

### Architecture Summary Table

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| Browser | Vanilla JS + HTML5 | UI rendering, role routing, session management |
| HTTP Transport | Fetch API → Express | REST calls with custom headers |
| Auth/Tenant | TenantMiddleware + RolesGuard | User resolution + RBAC enforcement |
| Application | NestJS 34 modules | Domain logic (projects, tasks, compliance, etc.) |
| Event Bus | EventEmitter2 (in-process) | `task.completed` → compliance auto-check |
| ORM | Prisma 6 | Type-safe DB access; tenant-scoped queries |
| Database | PostgreSQL (Neon cloud) | Persistent data storage |
| File Storage | Local `uploads/` dir | Evidence file storage (served at `/uploads/*`) |
| Logging | File-based (LoggingService) | Date-stamped application + error logs |

---

## 6. Core Features

---

### Feature 1: Authentication & Company Registration

| | |
|--|--|
| **Purpose** | Allow company self-registration and user login with role-based routing |
| **Entry point (FE)** | `login.html`, `register.html` |
| **Frontend scripts** | `js/pages/auth-flows.js`, `js/utils/auth.js` |
| **API endpoints** | `POST /auth/login`, `POST /auth/register-company`, `GET /auth/public-plans` |
| **Backend** | `AuthController` → `AuthService` |
| **DB interaction** | `User`, `Company`, `Subscription`, `RoleTemplate`, `Role`, `RoleAssignment`, `ComplianceRule`, `AuditLog` |
| **External deps** | bcryptjs (password), jsonwebtoken (registration only) |
| **Status** | ✅ Login works. Registration works with DB transaction. ⚠️ JWT not used on login path. ⚠️ Password-bypass fallback exists. |

---

### Feature 2: Project Management

| | |
|--|--|
| **Purpose** | Create, assign, and track projects within branches/teams |
| **Entry point (FE)** | `admin/pm/pm-dashboard.html`, `modules/projects.html` |
| **Frontend scripts** | `js/pages/pm/projects.js` (27 KB) |
| **API endpoints** | `GET /projects`, `POST /projects`, `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id` |
| **Allowed roles** | GET: all roles; POST/PATCH/DELETE: `project_manager`, `superuser`, `branch_manager` |
| **Backend** | `ProjectsController` → `ProjectsService` |
| **DB interaction** | `Project`, `Team`, `Branch`, `User`, `AuditLog` |
| **External deps** | None |
| **Status** | ✅ Full CRUD implemented. Tenant-scoped by `buildProjectListWhere()`. Branch Manager scope enforced. |

---

### Feature 3: Task Management

| | |
|--|--|
| **Purpose** | Full task lifecycle: create, assign, update status, soft-delete |
| **Entry point (FE)** | `admin/pm/tasks.html`, `enduser/my-tasks.html`, `enduser/task-detail.html` |
| **Frontend scripts** | `js/pages/pm/tasks.js` (30 KB), `enduser/task-detail.js` (41 KB) |
| **API endpoints** | `GET /tasks`, `GET /tasks/assignee/:userId`, `GET /tasks/:id`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` |
| **Allowed roles** | GET: most roles; POST: `team_leader`, `project_manager`, `branch_manager`; DELETE: `project_manager`, `team_leader`, `branch_manager` |
| **Backend** | `TasksController` → `TasksService` + `AuditLogsService` + `EventEmitter2` |
| **DB interaction** | `Task`, `Subtask`, `User`, `Project`, `Escalation`, `AuditLog` |
| **Events emitted** | `task.completed` → triggers `ComplianceObserverService` |
| **Status** | ✅ Full CRUD + soft delete. Status lifecycle enforced. Role-scoped listing. Auto-compliance check on completion. |

---

### Feature 4: Subtask Management

| | |
|--|--|
| **Purpose** | Break tasks into subtasks; assign to team members; review/approve submissions |
| **Entry point (FE)** | `enduser/task-detail.html`, `enduser/tl-dashboard.html` |
| **Frontend scripts** | `enduser/task-detail.js`, `enduser/tl-dashboard.js` (33 KB) |
| **API endpoints** | `GET /subtasks`, `POST /subtasks`, `PATCH /subtasks/:id`, `DELETE /subtasks/:id` |
| **Allowed roles** | `team_leader`, `project_manager`, `team_member` (view/update own) |
| **Backend** | `SubtasksController` → `SubtasksService` |
| **DB interaction** | `Subtask`, `Task`, `User`, `AuditLog` |
| **Status** | ✅ CRUD implemented. |

---

### Feature 5: Escalation Management

| | |
|--|--|
| **Purpose** | Raise escalations when tasks/subtasks are blocked or unresolved |
| **Entry point (FE)** | `enduser/task-detail.html` (raise escalation), `admin/pm/pm-dashboard.html` (view) |
| **Frontend scripts** | `enduser/task-detail.js` |
| **API endpoints** | `GET /escalations`, `POST /escalations`, `PATCH /escalations/:id` |
| **Allowed roles** | `team_member`, `team_leader`, `project_manager` |
| **Backend** | `EscalationsController` → `EscalationsService` |
| **DB interaction** | `Escalation`, `Task`, `User` |
| **Status** | ✅ Basic CRUD. Status tracking (Open/Resolved). |

---

### Feature 6: Evidence Submission & File Upload

| | |
|--|--|
| **Purpose** | Submit compliance evidence files tied to tasks/subtasks |
| **Entry point (FE)** | `enduser/evidence.html`, `enduser/evidence-review.html`, `admin/pm/evidence-review.html` |
| **Frontend scripts** | `js/pages/compliance/evidence.js` (24 KB) |
| **API endpoints** | `GET /evidence`, `POST /evidence` (multipart), `PATCH /evidence/:id`, `DELETE /evidence/:id`, `PATCH /evidence/:id/approve`, `PATCH /evidence/:id/reject` |
| **Allowed roles** | GET: `compliance_officer`, `project_manager`, `team_leader`, `team_member`; POST: `team_member`, `team_leader` |
| **Backend** | `EvidenceController` → `EvidenceService` + Multer (`FileInterceptor`) |
| **DB interaction** | `ComplianceEvidence`, `Task`, `User` |
| **File storage** | Uploaded to `back-end/uploads/` — served at `/uploads/*` |
| **Status** | ✅ File upload implemented with disk storage. Approve/reject actions present. |

---

### Feature 7: Compliance Engine

| | |
|--|--|
| **Purpose** | Define compliance rules, bind them to tasks/processes, detect violations, generate reports |
| **Entry point (FE)** | `admin/compliance/compliance_rules.html`, `admin/compliance/compliance_violations.html`, `modules/compliance.html` |
| **Frontend scripts** | `js/pages/compliance/rules.js`, `js/pages/compliance/violations.js`, `js/pages/compliance/evidence.js` |
| **API endpoints** | `GET/POST/PATCH/DELETE /compliance-rules`, `GET/POST /compliance-bindings`, `GET/POST/PATCH /compliance-violations`, `GET/POST /compliance-categories` |
| **Allowed roles** | `compliance_officer`, `project_manager`, `superuser` |
| **Backend** | `ComplianceRulesController`, `ComplianceBindingsController`, `ComplianceViolationsController` + `ComplianceObserverService` |
| **DB interaction** | `ComplianceRule`, `ComplianceBinding`, `ComplianceViolation`, `ComplianceCategory` |
| **Auto-trigger** | `task.completed` event → auto-creates violation if no evidence + 'Mandatory Code Review' binding found |
| **Status** | ✅ Core CRUD implemented. Auto-violation detection on task completion confirmed. ⚠️ Only 1 rule name hardcoded in observer ('Mandatory Code Review'). |

---

### Feature 8: Process Engine (Workflow Templates)

| | |
|--|--|
| **Purpose** | Design configurable workflow templates with stages and approval sequences; run process instances |
| **Entry point (FE)** | `superuser/process-builder.html`, `superuser/processes.html`, `modules/process-builder.html` |
| **Frontend scripts** | `js/pages/superuser/process-builder.js` (12 KB), `js/pages/superuser/processes.js` (11 KB), `admin/processes/process-builder.js` (7 KB) |
| **API endpoints** | `GET/POST/PATCH/DELETE /process-templates`, `GET/POST /process-instances`, `GET/POST/PATCH /process-instance-steps` |
| **Allowed roles** | Templates: `process_admin`, `superuser`, `project_manager`; Instances: wider access |
| **Backend** | `ProcessTemplatesController` → `ProcessTemplatesService`; `ProcessInstancesController`; `ProcessInstanceStepsController` |
| **DB interaction** | `ProcessTemplate`, `ProcessInstance`, `ProcessInstanceStep` |
| **Status** | ⚠️ Backend CRUD exists. Frontend process builder UI exists but appears lightweight. Full approval/loopback/rejection workflow logic status unknown. |

---

### Feature 9: HR & User Management

| | |
|--|--|
| **Purpose** | Create/manage employee profiles, assign roles, manage team structure |
| **Entry point (FE)** | `admin/hr/hr-dashboard.html`, `admin/hr/new-employee.html`, `admin/hr/employee-detail.html`, `admin/hr/roles-system.html` |
| **Frontend scripts** | `js/pages/hr/dashboard.js`, `js/pages/hr/employee-detail.js` (25 KB), `js/pages/hr/roles-individual.js` (20 KB) |
| **API endpoints** | `GET/POST/PATCH/DELETE /users`, `GET/POST /roles`, `GET/POST /role-assignments`, `GET/POST /role-templates`, `GET/POST /teams`, `GET/POST /branches` |
| **Allowed roles** | `hr_manager`, `superuser`, `project_manager` |
| **Backend** | `UsersController`, `RolesController`, `RoleAssignmentsController`, `RoleTemplatesController`, `TeamsController`, `BranchesController` |
| **DB interaction** | `User`, `Role`, `RoleAssignment`, `RoleTemplate`, `Team`, `Branch`, `Subscription` (plan limit check) |
| **Plan enforcement** | `PlanLimitService` checks `maxUsers` and `maxBranches` before creation |
| **Status** | ✅ Full CRUD implemented. Plan limits enforced. Password hashing on user create/update. |

---

### Feature 10: Executive Analytics Dashboard

| | |
|--|--|
| **Purpose** | Company-wide and branch-level KPIs for executives and company owners |
| **Entry point (FE)** | `admin/executive/executive_dashboard.html`, `admin/executive/executive_projects.html`, `admin/executive/executive_tasks.html`, `admin/executive/executive_compliance.html`, `admin/executive/executive_reports.html` |
| **Frontend scripts** | `admin/executive/executive_dashboard.js`, `executive_projects.js`, `executive_tasks.js`, `executive_compliance.js`, `executive_reports.js` |
| **API endpoints** | `GET /executive/branches`, `GET /executive/metrics`, `GET /executive/projects`, `GET /executive/tasks`, `GET /executive/compliance`, `GET /executive/reports` |
| **Allowed roles** | `Company Owner`, `superuser`, `Branch Manager` |
| **Backend** | `ExecutiveController` — ⚠️ **queries `PrismaService` directly** (no service class) |
| **DB interaction** | `User`, `Team`, `Branch`, `Project`, `Task`, `Escalation`, `ComplianceViolation`, `Subscription` |
| **Status** | ✅ Endpoints exist. Branch Manager scoped to their own branch. ⚠️ Controller directly uses Prisma instead of a service (breaks layered architecture pattern). |

---

### Feature 11: Platform Admin (SaaS Management)

| | |
|--|--|
| **Purpose** | SaaS platform operator manages tenant companies, subscription plans, billing, and support access |
| **Entry point (FE)** | `platform-admin/dashboard.html`, `platform-admin/companies.html`, `platform-admin/plans.html`, `platform-admin/subscriptions.html`, `platform-admin/support-access.html` |
| **API endpoints** | `GET/POST /companies`, `GET/POST/PATCH/DELETE /plans`, `GET/POST /subscriptions`, `GET/POST /platform-admin-users`, `GET/POST /platform-support-access` |
| **Allowed roles** | `platform_admin` |
| **Backend** | `CompaniesController`, `PlansController`, `SubscriptionsController`, `PlatformAdminUsersController`, `PlatformSupportAccessController` |
| **DB interaction** | `Company`, `Plan`, `Subscription`, `PlatformAdminUser`, `PlatformSupportAccess` |
| **Status** | ✅ Core implemented. Separate auth path (`x-platform-admin-id` header). |

---

### Feature 12: Audit Logs & Notifications

| | |
|--|--|
| **Purpose** | Immutable event log for all significant actions; in-app notification system |
| **Entry point (FE)** | `admin/compliance/compliance_audit_log.html`, `js/components/notifications.js` |
| **Frontend scripts** | `js/pages/compliance/audit-log.js` (10 KB), `js/components/notifications.js` |
| **API endpoints** | `GET /audit-logs`, `GET /notifications`, `POST /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| **Allowed roles** | Audit: `compliance_officer`, `superuser`, `project_manager`; Notifications: user-scoped |
| **Backend** | `AuditLogsController` → `AuditLogsService`; `NotificationsController` → `NotificationsService` |
| **DB interaction** | `AuditLog`, `Notification`, `User` |
| **Status** | ✅ Audit log written on login and task changes. Notifications persisted to DB. ⚠️ Notifications are not real-time (no WebSocket/SSE — polling only). |

---

### Feature Status Summary

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Auth / Registration | ✅ | ✅ | JWT only on register; bypass risk on login |
| Project Management | ✅ | ✅ | Full CRUD |
| Task Management | ✅ | ✅ | Rich; auto-compliance trigger |
| Subtask Management | ✅ | ✅ | |
| Escalations | ✅ | ⚠️ Partial | Backend complete; FE integrated in task-detail |
| Evidence / File Upload | ✅ | ✅ | Local disk only |
| Compliance Engine | ✅ | ✅ | 1 auto-rule hardcoded |
| Process Engine | ⚠️ Partial | ⚠️ Partial | CRUD exists; approval flow completeness unknown |
| HR / User Management | ✅ | ✅ | |
| Executive Analytics | ✅ | ✅ | Controller bypasses service layer |
| Platform Admin | ✅ | ✅ | |
| Audit Logs / Notifications | ✅ | ✅ | No real-time push |
| **Password Reset** | ❌ Missing | ⚠️ UI exists | `forgot-password.html` + `reset-password.html` exist; backend not found |

---

## 7. Feature/Data Flows

---

### Flow 1: User Login

```
FRONTEND
┌─────────────────────────────────────────────────────────────────┐
│ 1. User fills in email + password, submits #loginForm                        │
│ 2. auth-flows.js: fetch POST http://localhost:5500/auth/login                │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTP POST /auth/login  { email, password }
BACKEND
┌─────────────────────────────────────────────────────────────────┐
│ Middleware: LoggerMiddleware → TenantMiddleware (skipped for /auth/login)   │
│ AuthController.login(dto)                                                   │
│   │                                                                          │
│   AuthService.login(dto)                                                     │
│     1. prisma.user.findFirst({ email: insensitive, include: company + roles })│
│     2. If user not found → throw UnauthorizedException                       │
│     3. bcrypt.compare(dto.password, user.passwordHash)                       │
│     4. If no match → throw UnauthorizedException                             │
│     5. Walk roleAssignments[] with priority order:                           │
│          systemAdmin > owner/CEO > branchManager > hr > process >            │
│          compliance > pm > teamLeader > first assignment                      │
│     6. Map roleLabel → roleSlug + targetRoute (hardcoded if/else chain)      │
│     7. For Branch Manager: extra DB query to resolve branchName               │
│     8. Write AuditLog (non-blocking try/catch — won't fail login if DB error)│
│     9. Return { success, targetRoute, roleSlug, user{...} }                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓ { success: true, targetRoute, roleSlug, user }
FRONTEND (resume)
┌─────────────────────────────────────────────────────────────────┐
│ 3. sessionStorage.setItem("currentUser", JSON.stringify({                    │
│       id, name, email, role, roleLabel, companyId, scopeType, scopeId, ...   │
│    }))                                                                        │
│ 4. window.location.href = targetRoute                                        │
│ 5. Dashboard loads, calls protectPage([allowedRoles])                        │
│    └─ If role mismatch → redirect to login.html                               │
└─────────────────────────────────────────────────────────────────┘
```

**Bugs / issues found in this flow:**
- ⚠️ If the user has `passwordHash = null` (blank-password user created from admin), bcrypt.compare is skipped and `isMatch = false` — they can never log in.
- 🔴 If `/auth/login` throws a **network error**, `auth-flows.js` falls through to the password-bypass fallback (fetches full user list, matches email only).
- ⚠️ Role resolution is a fragile `if/else` string-matching chain (both here in `AuthService` AND duplicated in `auth-flows.js`). Any role label not matching the expected substrings defaults to `team_member`.
- ⚠️ `ipAddress` hardcoded to `'127.0.0.1'` in the audit log (line 175). No real IP capture.

---

### Flow 2: Company Registration

```
FRONTEND
  register.html → POST /auth/register-company
  { companyLegalName, ownerFullName, ownerEmail, password, planId, billingCycle }

BACKEND: AuthService.registerCompany()
  ┌────────────────────────────────────────────────────────┐
  │  prisma.$transaction(async (tx) => {                                   │
  │                                                                          │
  │   Step 1: tx.company.create({ legalName, status:'Active' })              │
  │           └─ writes: Company row                                          │
  │                                                                          │
  │   Step 2: tx.user.create({ companyId, fullName, email, passwordHash })   │
  │           └─ writes: User row (registering user)                          │
  │                                                                          │
  │   Step 2.5: tx.subscription.create({ companyId, planId, billingCycle,   │
  │             status:'Active', currentPeriodEnd: +30 or +365 days })       │
  │             └─ writes: Subscription row                                  │
  │                                                                          │
  │   Step 3: tx.roleTemplate.findMany({ origin: platform_predefined })      │
  │           If 'System Admin' template missing → create it                 │
  │                                                                          │
  │   Step 4: For each platform RoleTemplate → tx.role.create(companyId)    │
  │           └─ writes: Role rows (clones of all platform templates)         │
  │           Captures sysAdminRole reference                                │
  │                                                                          │
  │   Step 5: tx.roleAssignment.create(userId, sysAdminRole.id,             │
  │           scopeType:'Company', scopeId: company.id)                      │
  │           └─ writes: RoleAssignment (owner = System Admin)               │
  │                                                                          │
  │   Step 6: tx.complianceRule.findMany({ companyId: null })                │
  │           For each platform rule → clone to new company                  │
  │           └─ writes: ComplianceRule rows (tenant copies)                  │
  │  })                                                                       │
  └────────────────────────────────────────────────────────┘
  Step 7: jwt.sign({ sub, companyId, role }, JWT_SECRET || 'fallback_secret')
          Return { success, token, targetRoute: 'admin-console/admin-dashboard.html', user }

FRONTEND (resume)
  Store token + user in sessionStorage → redirect to admin-console/admin-dashboard.html
```

**Bugs / issues found in this flow:**
- 🔴 `require('jsonwebtoken')` and `require('@prisma/client')` are called **inside** the service method at runtime. This is a Node.js anti-pattern that bypasses NestJS DI and will fail if the module is not installed.
- 🔴 `JWT_SECRET` falls back to `'fallback_secret'` (line 342). The JWT signed with this can be trivially forged by anyone who reads the source code.
- ⚠️ The registration flow creates roles by cloning **all** platform role templates. If a template was added to the platform after older companies registered, those companies won't have the new role — no migration/sync mechanism exists.
- ⚠️ No email verification step exists. Any email address can be used to register.

---

### Flow 3: Task Creation → Assignment → Completion → Auto-Compliance Check

This is the most important business flow in the application.

```
[PHASE A: Task Creation]

FRONTEND
  pm-dashboard or tl-dashboard: POST /tasks
  Headers: { x-user-id, x-user-role, x-company-id }
  Body: { title, description, project_id, assigned_to, status, priority, due_date }

BACKEND: TenantMiddleware
  └─ prisma.user.findUnique(x-user-id) → populates req.user
     { id, companyId, role, roleLabel, scopeType, scopeId }

BACKEND: RolesGuard
  └─ Checks req.user.role against @Roles('team_leader','project_manager','branch_manager')

BACKEND: TasksService.create(dto, actorUserId, req.user)
  1. If dto.project_id: assertTaskProjectBranchAccess(project_id, user)
       └─ If Branch Manager → confirm project is in their branch
  2. If PM role + assigned_to: assertProjectManagerAssigneeIsTeamLeader(assigned_to)
       └─ PM can only assign to a Team Leader (DB lookup + role check)
  3. prisma.task.create({ title, status:'Draft', companyId, projectId, assignedToId, ... })
  4. auditLogs.create({ action:'CREATE', entity_id: newTask.id })  ← FIRE & FORGET (no await)
  5. Return findOne(newTask.id) with full includes

[PHASE B: Status Update → Complete]

FRONTEND
  task-detail.js: PATCH /tasks/:id  { status: 'Completed' }

BACKEND: TasksService.update(id, dto, actorUserId, actorRole, user)
  1. findOne(id) → capture state BEFORE update
  2. assertTaskBranchAccess(id, user)
  3. If reassigning + actor not in CAN_DELEGATE set → throw ForbiddenException
  4. If PM + reassigning → assertProjectManagerAssigneeIsTeamLeader(new_assignee)
  5. prisma.task.update({ status:'Completed', completedAt: new Date() })
  6. auditLogs.create({ action:'STATUS_CHANGE', old_value: before, new_value: updated })
     └─ FIRE & FORGET (no await)
  7. IF statusChanged && updated.status === 'Completed':
       eventEmitter.emit('task.completed', updated)  ← in-process, synchronous dispatch

[PHASE C: Auto-Compliance Check (triggered by event)]

BACKEND: ComplianceObserverService.handleTaskCompleted(task)
  1. prisma.complianceEvidence.count({ where: { taskId: task.id } })
     └─ If evidence exists → EXIT (task is compliant)
  2. prisma.task.findUnique(task.id, include: project)
  3. If task has no project or no teamId → EXIT
  4. prisma.complianceBinding.findFirst({
       scopeType: 'Team', scopeId: teamId,
       rule: { name: 'Mandatory Code Review', isActive: true }
     })
  5. If binding found:
       prisma.complianceViolation.create({
         companyId, ruleId, entityType:'Task', entityId: task.id,
         status: 'Open', severity, reportedById: null,  ← system-generated
         resolutionRemarks: 'Auto-flagged by Automated Compliance Engine'
       })
```

**Bugs / issues found in this flow:**
- ⚠️ `auditLogs.create()` is called without `await` at lines 124 and 197. This is fire-and-forget — if it throws, it becomes an **unhandled promise rejection**.
- ⚠️ The auto-compliance check is hardcoded to the rule name `'Mandatory Code Review'`. Any other rule name, even if bound to the team, will NOT trigger auto-detection.
- ⚠️ `CAN_DELEGATE` set (line 19–28 of tasks.service.ts) mixes slug-style and label-style strings (`'team_leader'` AND `'Team Leader'`). If the actor's role comes from DB as `'Team Leader'` (label) it works, but if it comes as `'team_leader'` (slug) it also works. However, any casing difference would silently allow or block reassignment.
- ⚠️ The compliance check queries the entire team's evidence count, but does not check per-binding — any evidence (even for a different task) would mark it as compliant.

---

### Flow 4: Evidence Upload → Review → Auto-Violation Resolution

```
[PHASE A: Evidence Submission (File Upload)]

FRONTEND
  evidence.html: POST /evidence/:id/upload (multipart/form-data)
  Headers: { x-user-id, x-user-role, x-company-id }
  Body: FormData { file: <File> }

BACKEND: EvidenceController (FileInterceptor)
  └─ Multer intercepts multipart request
  └─ diskStorage: saves to back-end/uploads/{timestamp}-{random}-{original_name}
  └─ EvidenceService.attachFile(id, file, companyId, actorUserId)
       1. findOne(id) → validates evidence record exists
       2. fileUrl = '/uploads/' + file.filename
       3. prisma.attachment.create({ entityType:'ComplianceEvidence', fileUrl, ... })
          └─ Creates Attachment record (try/catch — non-blocking if Attachment fails)
       4. prisma.complianceEvidence.update({ fileUrl })  ← links file to evidence record
       5. Return { evidence, attachment }

[PHASE B: Evidence Review (Approve/Reject)]

FRONTEND
  evidence-review.html: PATCH /evidence/:id  { status: 'Approved' }

BACKEND: EvidenceService.update(id, dto, reviewerUserId)
  1. findOne(id) ← load evidence + old state
  2. prisma.complianceEvidence.update({
       status: 'Approved',
       reviewedById: reviewerUserId,
       reviewedAt: new Date()
     })
  3. IF newStatus === 'Approved' AND evidence.violationId exists:
       prisma.complianceViolation.update({
         status: 'Resolved',
         resolvedById: reviewerUserId,
         resolvedAt: new Date(),
         resolutionRemarks: 'Auto-resolved via approved evidence "<title>"'
       })
┌─────────────────────────────────────────────────────────────────┐
│ Final state: ComplianceViolation.status = 'Resolved'                       │
└─────────────────────────────────────────────────────────────────┘
```

**Bugs / issues found in this flow:**
- ⚠️ The `Attachment.create()` is inside a `try/catch` that silently swallows errors. If the Attachment table write fails, the evidence record is still updated with a `fileUrl` that points to a file with no corresponding `Attachment` DB row — data inconsistency.
- ⚠️ Auto-resolve only works if `evidence.violationId` is set. If evidence was submitted directly to a task (not to a violation), no violation will be resolved, even if one exists for that task.
- ⚠️ No role check on the approve/reject endpoints beyond the `@Roles()` guard — any `compliance_officer` or `project_manager` can approve any company's evidence (cross-tenant risk if `companyId` filter is not applied).

---

### Flow Anomaly: Hardcoded companyId in AuditLogsService

In [`audit-logs.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/audit-logs/audit-logs.service.ts#L53), line 53:

```typescript
const resolvedCompanyId = companyId || dto.companyId || 'b7744408-190c-4b83-82c5-ab0049afb6b2';
```

> 🔴 **Critical Bug**: If no `companyId` is passed and none is on the DTO, all audit logs fallback to a **hardcoded UUID** (`b77...`). This was clearly a seed/dev company ID that was left in the code. Any audit log written without an explicit `companyId` will appear to belong to this hardcoded company, corrupting audit trail data for all tenants.

---

## 8. Backend

---

### 8.1 Bootstrap & Global Configuration (`main.ts`)

| Item | Value / Setting | Notes |
|------|----------------|-------|
| Framework | NestJS on Express | `NestExpressApplication` |
| Port | `process.env.PORT ?? 5500` | Configurable via `.env` |
| Security headers | `helmet()` | CSP allows `'unsafe-inline'` and `'unsafe-eval'` — weakens CSP |
| CORS | Explicit allowlist | Defaults to `localhost:5500`, `localhost:3000`, `localhost:64064`. `FRONTEND_ORIGINS` env var overrides this |
| Validation pipe | `ValidationPipe({ transform: true, whitelist: true })` | Global; strips unknown properties; transforms types |
| RBAC guard | `RolesGuard` applied globally via `useGlobalGuards` | Also registered inside `@UseGuards(RolesGuard)` on each controller — **double application** |
| Response interceptor | `TransformInterceptor` — wraps all responses in `{ success: true, data: ... }` | Global |
| Exception filter | `GlobalExceptionFilter` registered via `APP_FILTER` in `LoggingModule` | Writes errors to file-based logs |
| Static files | `uploads/` served at `/uploads/*` | Created on startup if not exists |
| Swagger | `SwaggerModule` at `/api/docs`; JSON saved to `docs/swagger.json` | ⚠️ Title still reads `'OfficeSync API'` — not updated to OptiFlow |
| Swagger auth model | `x-user-role` header as API key | Does not model JWT or Bearer auth |

---

### 8.2 Middleware Layer (Complete Analysis)

#### LoggerMiddleware
- Applied globally before `TenantMiddleware`
- Records request method, path, status, and duration
- Writes to `LoggingService` (file-based, date-stamped)
- No issues found

#### TenantMiddleware — **Critical Security Analysis**

Applied globally to all routes via `consumer.apply(LoggerMiddleware, TenantMiddleware).forRoutes('*')`.

**Bypass paths (no DB lookup, no auth):**

| Pattern | Bypasses | Risk |
|---------|----------|------|
| `/auth/login`, `/auth/register-company`, `/auth/public-plans`, `/companies/register` | Full middleware | Safe — intended public endpoints |
| Any URL containing `/platform`, `/plans`, `/subscriptions`, `/platform-support-access`, `/platform-admin-users`, `/companies` | Full middleware | ⚠️ URL-string matching is fragile — a route like `/user-plans` matches `/plans` |
| Any request with `x-platform-admin-id` header OR `x-user-role: platform_admin` | Full middleware | 🔴 **Anyone can send `x-user-role: platform_admin` and bypass tenant resolution** |

**User resolution order (Three-tier fallback):**

```
Tier 1: prisma.user.findFirst({ OR: [{ id: x-user-id }, { email: x-user-id }] })
         └─ Normal operation

Tier 2: (if Tier 1 fails) prisma.user.findFirst({ companyId: x-company-id })
         └─ Returns FIRST user of the company — no identity guarantee

Tier 3: (if Tier 2 fails) prisma.user.findFirst()
         └─ 🔴 Returns FIRST USER IN THE ENTIRE DATABASE
         └─ Anyone with no headers can become the first seeded user
```

**Role resolution (inside TenantMiddleware):**
- `req.user.role` = the `x-user-role` header value (client-trusted slug)
- `req.user.roleLabel` = DB-resolved canonical label (trusted)
- `req.user.companyId` = DB-resolved (trusted)
- ⚠️ **`role` slug is taken from header, not from DB**. A client can set `x-user-role: superuser` to any value and it becomes the session role slug used in guard comparisons.

---

### 8.3 Guard Layer

#### RolesGuard (`roles.guard.ts`)

Matches against three surfaces:
1. `req.user.roleLabel` (DB-resolved label — canonical, trusted)
2. `req.user.role` (from `x-user-role` header — **client-controlled**, untrusted)
3. `req.headers['x-user-role']` (raw header — **client-controlled**, untrusted)

> 🔴 **Design Flaw**: The guard trusts the raw `x-user-role` header directly. If a controller `@Roles()` list includes a role slug that matches any header value a client sends, access is granted **even if the TenantMiddleware DB lookup would resolve a different role**.

**Guard application issue:**
- `RolesGuard` is registered both `useGlobalGuards` in `main.ts` AND via `@UseGuards(RolesGuard)` on every controller.
- This means the guard runs **twice per request** on all domain endpoints.
- Functionally harmless today, but wastes a Reflector lookup cycle on every request.

**Routes without any `@Roles()` guard:**
- No `@Roles()` on handler = guard returns `true` (public). This is used on `GET /projects/:id` which has no `@Roles()` decorator — any authenticated user can fetch any project by ID if they know it.

---

### 8.4 DTO Validation Audit

| Module | DTO | Issue |
|--------|-----|-------|
| `tasks` | `CreateTaskDto` | `status` and `priority` typed as `any` — no enum enforcement. Client can pass any string status value. |
| `tasks` | `CreateTaskDto` | `companyId` in DTO is supplied by client body, but the service uses `dto.companyId` directly. The middleware-resolved `user.companyId` is not cross-checked. |
| `users` | `CreateUserDto` | `password_hash` field — raw hash accepted from client. If caller sends a known hash, they can set any password. |
| All modules | Various | `whitelist: true` on ValidationPipe strips unknown fields, but many DTO fields are `@IsOptional()` with no format validation (e.g. UUIDs not validated with `@IsUUID()`). |
| `auth` | `LoginDto` | Not inspected in detail but: no rate-limiting, no account lockout, no CAPTCHA. |

---

### 8.5 Service Layer Patterns

#### Standard Pattern (used by 32/34 modules)

```typescript
@Injectable()
export class XyzService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs?: AuditLogsService,
  ) {}

  async findAll(companyId: string) { ... }  // tenant-scoped
  async findOne(id: string) { ... }          // throws NotFoundException
  async create(dto, actorUserId) { ... }     // validates, creates, audit-logs
  async update(id, dto, actorUserId) { ... } // validates, updates, audit-logs
  async remove(id, actorUserId) { ... }      // soft delete or deactivate
}
```

#### Deviations from Standard Pattern

| Module | Deviation | Risk |
|--------|-----------|------|
| `ExecutiveModule` | **No service class**. `ExecutiveController` directly injects and queries `PrismaService`. | Breaks layered architecture; complex query logic is untestable without integration tests |
| `AuthService` | Uses `require()` for `jsonwebtoken` and `@prisma/client` inside method body | Bypasses NestJS module system; will throw if packages are absent |
| `AuditLogsService.create()` | Hardcoded fallback `companyId = 'b7744408-...'` | Corrupts audit trail data across all tenants |

#### Fire-and-Forget Audit Logging Pattern

In `TasksService`, `SubtasksService` (likely similar), `auditLogs.create()` is called without `await`:

```typescript
// No await — fire and forget
this.auditLogs.create({ ... });
```

This means:
- If the audit log write fails, the error is an **unhandled promise rejection**.
- The main operation (task create/update) still succeeds — which may be intentional.
- But any exception in `auditLogs.create()` will surface as an unhandled rejection warning in logs.

---

### 8.6 User Management — Key Issues

Found in [`users.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/users/users.service.ts):

| Issue | Line | Detail |
|-------|------|--------|
| **Literal `'default_hash'` as password** | L110 | `passwordHash: dto.password_hash ?? 'default_hash'`. If `password_hash` is not provided, the user is created with the literal string `'default_hash'` as their bcrypt hash. bcrypt will never match any password against this. **User cannot log in.** |
| **All role assignments deleted on update** | L200 | `roleAssignment.deleteMany({ where: { userId: id } })` — Updating a user's role deletes **every** role assignment and creates one new one. If the user had multiple assignments (branch scope, etc.), all are lost. |
| **User delete is soft-only** | L218 | `user.update({ isActive: false, deactivatedAt: new Date() })`. User record stays in the DB. Their JWT (if any) is still technically valid. No session invalidation mechanism exists. |
| **Manager cross-tenant** | L97–103 | `managerUserId` is validated by existence only. The manager could belong to a different company. No `companyId` cross-check on the manager lookup. |

---

### 8.7 Backend Consistency Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| Module structure | ✅ Consistent | All 34 modules follow Controller/Service/Module/DTO pattern |
| Tenant scoping on reads | ✅ Generally applied | `companyId` filter present on most `findAll()` methods |
| Tenant scoping on mutations | ⚠️ Inconsistent | Some services use `user.companyId` from `req.user`; others trust `dto.companyId` from body |
| DTO input validation | ⚠️ Gaps | `status`, `priority` as `any`; no UUID format validation on IDs |
| Error handling | ✅ Good | `NotFoundException` / `BadRequestException` / `ForbiddenException` used correctly |
| Global exception filter | ✅ Present | Via `APP_FILTER` in `LoggingModule` — logs to file |
| Audit logging | ⚠️ Broken | Fire-and-forget + hardcoded fallback `companyId` |
| RBAC enforcement | ⚠️ Partially trust client | `x-user-role` header trusted in guard surface check |
| Password handling | 🔴 Critical | `'default_hash'` literal used as fallback hash; users created without password cannot log in |
| Soft delete consistency | ✅ Applied to Tasks, Users | Subtasks likely similar — unverified |
| Unit tests | ⚠️ Minimal | `.spec.ts` files exist but contain only scaffolding (empty `it()` blocks) |

---

## 9. Frontend

---

### 9.1 Frontend Architecture Overview

The frontend is a **Multi-Page Application (MPA)** built with Vanilla JS and HTML5. There is no build system, bundler, or framework. Each role-based page is a standalone HTML file that loads shared JS utilities via `<script>` tags.

**Technology stack:**

| Item | Detail |
|------|--------|
| Rendering | Server-side static HTML (no SSR, no SPA router) |
| JS | Vanilla JS (ES6+) — no TypeScript, no framework |
| CSS | Custom CSS with CSS variables (design tokens in `:root`) |
| Assets | Served by `npx serve` (or any static server) on port 5500 |
| Icons | Font Awesome 6 (CDN) |
| Fonts | Google Fonts (CDN) — Inter |
| Charts | Not identified (executive dashboard may use Chart.js — unconfirmed) |

---

### 9.2 Session & Authentication Model

**Session storage structure:**

```javascript
sessionStorage["currentUser"] = JSON.stringify({
  id: "<uuid>",          // actorUserId for API headers
  name: "<string>",
  fullName: "<string>",
  email: "<string>",
  role: "<slug>",         // e.g. 'company_owner', 'project_manager'
  roleLabel: "<label>",   // e.g. 'Company Owner', 'Project Manager'
  assignedRole: "<label>",
  companyId: "<uuid>",
  roleId: "<id>",
  targetRoute: "<path>",
  scopeType: "<type>",    // Only for Branch Managers
  scopeId: "<uuid>",      // Only for Branch Managers
  branchName: "<string>" // Only for Branch Managers
})
```

**Additional sessionStorage keys:**

| Key | Purpose |
|-----|---------|
| `officesync_global_state` | 30-second cache of the full app state (all 19 endpoints) |
| `officesync_global_state_time` | Timestamp for TTL check |
| `selectedProjectId` | Persisted between PM sub-pages |

> ⚠️ `sessionStorage` is **tab-isolated**. Opening a second tab requires a fresh login per browser tab. State is not shared.

---

### 9.3 Page Protection (`protectPage()`)

Every protected page calls `protectPage([allowedRoles])` at page load.

```javascript
function protectPage(allowedRoles) {
  const currentUserStr = sessionStorage.getItem("currentUser");
  if (!currentUserStr) { goToLogin(); return; }           // No session → redirect

  const currentUser = JSON.parse(currentUserStr);

  // GOD MODE: superuser / company_owner bypass all role checks
  if (currentUser.role === "superuser" || currentUser.role === "company_owner") return;

  if (!allowedRoles.includes(currentUser.role)) { goToLogin(); }  // Wrong role → redirect
}
```

**Issues found:**
- ⚠️ `protectPage()` is entirely **client-side**. If a user modifies `sessionStorage` in DevTools (e.g. change `role` to `superuser`), all page restrictions are bypassed. This is only a UI-layer guard — the backend must (and mostly does) enforce RBAC independently.
- ⚠️ `goToLogin()` uses a complex path-depth detection heuristic using `window.location.pathname` to calculate relative path to `login.html`. If any future page is nested at an unexpected depth, the redirect will break.
- ⚠️ The `Auth.requireRole()` function (line 168–175 of `auth.js`) does NOT check the role argument at all — it returns the session if it exists, regardless of whether the caller's required role matches.

---

### 9.4 API Abstraction Layer (`Helpers.api.request()`)

All API calls go through a single function: `window.Helpers.api.request(endpoint, method, body, headers)`.

**Headers sent on every request (built from session):**

| Header | Value | Trusted by backend? |
|--------|-------|--------------------|
| `Authorization` | `Bearer <actorId or email>` | No — backend doesn't validate JWT on login path |
| `x-user-role` | Session `role` slug | ⚠️ Used directly in RolesGuard (security risk) |
| `x-user-id` | Session `id` UUID | ✅ TenantMiddleware DB-resolves this |
| `x-company-id` | Session `companyId` | ✅ Used as fallback if user ID fails |
| `x-user-email` | Session `email` | Used by TenantMiddleware as fallback identifier |
| `x-platform-admin-id` | Session `id` (if platform_admin) | Used by platform admin bypass path |

**Fallback when no session exists:**
```javascript
const tokenIdentifier = actorId || userEmail || 'acme-ceo-uuid';
```
> 🔴 **If both `actorId` and `userEmail` are null, the hardcoded string `'acme-ceo-uuid'` is used as the Authorization Bearer token and as the x-user-id.** This is a dev artifact left in production code.

**Base URL:**
```javascript
baseUrl: 'http://localhost:5500'  // Hardcoded — cannot be deployed without changing this
```

---

### 9.5 State Management (`Helpers.getState()`)

`getState()` is the central data-fetching function. It fires **19 concurrent API requests** using `Promise.allSettled` and maps them into a unified state object.

**Endpoints fetched:**
`/users`, `/tasks`, `/projects`, `/escalations`, `/evidence`, `/branches`, `/roles`, `/subtasks`, `/audit-logs`, `/compliance-rules`, `/compliance-violations`, `/users/roles/mapping`, `/process-instances`, `/process-templates`, `/process-instance-steps`, `/teams`, `/notifications`, `/compliance-categories`, `/compliance-bindings`

**Caching:**
- In-memory: `window.Helpers._stateCache` (via `Object.defineProperty`)
- Persistent: `sessionStorage["officesync_global_state"]` with 30-second TTL
- Deduplication: `this._statePromise` prevents concurrent re-fetches

**Critical Bug — Dead Code After `return`:**

```javascript
// Line 714: This return statement exits the function immediately!
return {
  users, tasks, projects, ...
};

// Lines 744–753: THIS CODE IS UNREACHABLE — NEVER EXECUTES
try {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(resObj)); // ❌ NEVER RUNS
  sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));// ❌ NEVER RUNS
} catch (err) { ... }
window.Helpers._stateCache = resObj;  // ❌ NEVER RUNS
```

> 🔴 **Critical Bug**: The `return` on line 714 precedes the sessionStorage save and the in-memory cache assignment. This means the **30-second cache is never populated from the `getState()` response**. Every call to `getState()` fires all 19 API requests fresh. The cache at line 244–255 can only be populated if it was somehow already set from a previous call — which it never is due to this bug. This causes a **significant performance issue** on every page load.

**Data transformation:**
- `getState()` performs extensive mapping of backend camelCase fields to a frontend schema.
- `isActive` for all users is hardcoded to `true` (line 449) regardless of the actual DB value.
- `processTemplate.status` is hardcoded to `'Active'` for all templates (line 664).

---

### 9.6 Role System — Triple Translation Problem

Roles are translated three separate times across the codebase. Each translation adds a point of failure:

```
DB: Role.label  (e.g. "Company Owner", "Access Governance", "Project Manager")
    ↓ Translation 1: AuthService (backend)
    roleSlug returned to frontend (e.g. "company_owner", "hr_manager", "project_manager")
    ↓ Translation 2: Auth.getSession() (auth.js)
    pmRoleName computed (e.g. "Company_Owner", "HR_Manager")
    ↓ Translation 3: helpers.js getState() users map
    roleLabelMap[] lookup (e.g. "Access Governance" → "hr_manager")
```

**Each translation uses a different matching strategy:**

| Translation | Method | Risk |
|-------------|--------|------|
| `AuthService` | Hardcoded `if/else` with `includes()` | Ambiguous: `'compliance pm'` would match `project_manager` |
| `Auth.getSession()` | String slug comparison | Fails if `roleLabel` is used instead of slug |
| `helpers.js roleLabelMap` | Exact string key lookup | Fails silently if label doesn't match exactly |

> ⚠️ A new role added in the DB (e.g., `"Senior Team Leader"`) will not be recognized by any of the three translators and will default to `team_member` silently.

---

### 9.7 Test Preset System (Dev Artifact in Production Code)

In [`helpers.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L119), lines 119–130:

```javascript
window.TEST_ACTOR_PRESETS = {
  ACME_CEO:     { email: "ceo@acmecorp.com",     role: "superuser",          label: "Acme Corp CEO" },
  ACME_PM:      { email: "pm@acmecorp.com",      role: "project_manager",    label: "Acme Corp PM" },
  ACME_TL:      { email: "tl@acmecorp.com",      role: "team_leader",        label: "Acme Corp TL" },
  ACME_MEMBER1: { email: "member1@acmecorp.com", role: "team_member",        label: "Acme Corp Team Member 1" },
  BETA_CEO:     { email: "ceo@betallc.com",      role: "superuser",          label: "Beta LLC CEO" },
  BETA_MEMBER:  { email: "member1@betallc.com",  role: "team_member",        label: "Beta LLC Team Member" },
};

window.ACTIVE_PRESET_KEY = null;  // Set to a key to impersonate a user
```

> ⚠️ These presets are **shipped to all users in the browser** and are globally accessible via the browser console (`window.TEST_ACTOR_PRESETS`). Setting `window.ACTIVE_PRESET_KEY = 'ACME_CEO'` in the console would make all subsequent API requests appear to come from the seed CEO user. This is a **dev testing tool that was not removed before shipping**.

---

### 9.8 Other Frontend Issues

| Issue | Location | Detail |
|-------|----------|--------|
| **XSS risk via `setHTML(id, html)`** | `helpers.js` L816 | `el.innerHTML = html` is used throughout for rendering. If any API response field is user-controlled and contains `<script>` or event handlers, it would execute in the page. |
| **Hardcoded companyId fallback** | `auth.js` L160 | `companyId: u.companyId \|\| 'b7744408-190c-4b83-82c5-ab0049afb6b2'` — same hardcoded seed company ID appears on the frontend as well as backend audit logs service. |
| **`user_id` sent as `Number()`** | `helpers.js` L776 | Notifications API called with `user_id: Number(targetUserId)`. If `targetUserId` is a UUID string, `Number()` returns `NaN`. |
| **`officesync_global_state` key** | `auth.js` L77 | Session cleared by key `'officesync_global_state'` but `getState()` cache is never actually written (see §9.5 bug). Clearing a key that was never set is a no-op. |
| **Legacy `saveState()` deprecation warning** | `helpers.js` L788 | `saveState()` is a no-op with a console.warn. Still called by some older pages — confirms not all pages have been updated to the new API model. |
| **`Auth.can(slug)` is stub** | `auth.js` L177 | Only checks `roleId === 1 \|\| 2` (superuser/PM) or team_leader on `task:` slugs. All other permission slugs return `false`. Feature permission system is incomplete. |

---

### 9.9 Frontend Component Inventory

| Component | File | Purpose |
|-----------|------|---------|
| `Auth` | `js/utils/auth.js` | Session read, logout, page protection, PM bridge |
| `Helpers` | `js/utils/helpers.js` | API abstraction, state fetch, DOM utils, date utils |
| `Sidebar` | `js/components/sidebar.js` (23 KB) | Navigation sidebar, active state, notification badge |
| `Notifications` | `js/components/notifications.js` | Bell dropdown, mark-as-read |
| `Toast` | `js/components/toast.js` | Error/success notification toasts |
| `Modal` | `js/components/modal.js` | Shared modal open/close logic |
| `ExecutiveBranchSwitcher` | `js/components/executive-branch-switcher.js` | Branch filter for executive analytics |
| `TasksStore` | `js/tasks-store.js` | Thin wrapper for task list unwrapping |

---

### 9.10 Frontend Consistency Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| Page protection | ✅ Present on all protected pages | But purely client-side — bypassable via DevTools |
| API abstraction | ✅ Centralized in `Helpers.api.request()` | Hardcoded `localhost:5500` base URL |
| State management | ⚠️ Broken cache | 30-second cache never actually saves due to `return` before cache write |
| Role translation | ⚠️ Triple translation | 3 separate string-matching chains; any new role silently defaults to `team_member` |
| XSS protection | ⚠️ None | `setHTML()` / `el.innerHTML` used everywhere; no sanitization |
| Test artifacts | ⚠️ Present | `TEST_ACTOR_PRESETS` and `ACTIVE_PRESET_KEY` shipped in production JS |
| Hardcoded URLs | 🔴 Yes | `baseUrl: 'http://localhost:5500'` prevents any deployment |
| Error handling | ✅ Toast notifications | `notifyApiError()` shows user-friendly error toasts |
| Responsive design | ❓ Unknown | CSS not audited in this phase |

---

## 10. Database

---

### 10.1 Database Overview

| Item | Detail |
|------|--------|
| Engine | PostgreSQL (hosted on Neon cloud, ap-southeast-1) |
| ORM | Prisma 6 (Prisma Client JS) |
| Schema file | `back-end/prisma/schema.prisma` (731 lines) |
| Total models | 27 models |
| Total enums | 13 enums |
| Migrations | 1 migration (`_init`) — single flat migration |
| Schema management | `npx prisma db push` for schema changes (no incremental migrations) |
| Seeding | `prisma/seed.ts` (49 KB) via `npm run seed` |

---

### 10.2 Entity Relationship Hierarchy

```
PLATFORM LAYER
  Plan
    └─ Subscription (companyId FK)
         └─ Company

  PlatformAdminUser
    └─ PlatformSupportAccess (adminUserId, companyId FKs)

TENANT LAYER  (Company is the root of every tenant)
  Company
    ├─ User[] (companyId FK, UNIQUE[companyId, email])
    │    ├─ RoleAssignment[] (userId, roleId FKs)
    │    └─ PermissionGrant[]
    ├─ Branch[]
    │    └─ Team[]
    │         └─ Project[]
    │              ├─ Task[] (companyId FK also)
    │              │    └─ Subtask[]
    │              └─ Escalation[]
    ├─ Role[] (cloned from RoleTemplate)
    │    └─ RolePermission[]
    ├─ ProcessTemplate[]
    │    ├─ ProcessTemplateStep[]
    │    └─ ProcessInstance[]
    │         └─ ProcessInstanceStep[]
    ├─ ComplianceCategory[]
    ├─ ComplianceRule[]
    │    └─ ComplianceBinding[]
    ├─ ComplianceViolation[]
    └─ ComplianceEvidence[]

CROSS-CUTTING (companyId carried on each row)
  Comment       (entityType + entityId polymorphic FK)
  Attachment    (entityType + entityId polymorphic FK)
  AuditLog      (entityType + entityId polymorphic FK)
  Notification  (userId FK)

PLATFORM SHARED (companyId = null = platform-level template)
  RoleTemplate  (origin: platform_predefined | company_custom)
  Permission    (companyId nullable = shared across tenants)
  ComplianceRule (companyId nullable = platform template)
```

---

### 10.3 Complete Model Inventory

| # | Model | PK | Tenant-Scoped | Soft Delete | Index Count |
|---|-------|-----|--------------|-------------|-------------|
| 1 | `Plan` | UUID | No (platform) | No | 0 |
| 2 | `Subscription` | UUID | Yes (`companyId`) | No | 2 |
| 3 | `PlatformAdminUser` | UUID | No | No | 0 |
| 4 | `PlatformSupportAccess` | UUID | Partial | No | 2 |
| 5 | `Company` | UUID | Self | No | 0 |
| 6 | `User` | UUID | Yes | `deactivatedAt` | 1 + UNIQUE |
| 7 | `Permission` | UUID | Optional | No | 0 + UNIQUE |
| 8 | `RoleTemplate` | UUID | Optional | No | 0 |
| 9 | `RoleTemplatePermission` | Composite | No | No | 0 |
| 10 | `Role` | UUID | Yes | No | 1 |
| 11 | `RolePermission` | Composite | No | No | 0 |
| 12 | `RoleAssignment` | UUID | Indirect | `revokedAt` | 3 |
| 13 | `PermissionGrant` | UUID | Yes | `revokedAt` | 2 |
| 14 | `Branch` | UUID | Yes | No | 1 |
| 15 | `Team` | UUID | Indirect (via Branch) | No | 1 |
| 16 | `Project` | UUID | Indirect (via Team) | No | 1 |
| 17 | `Task` | UUID | Yes + Indirect | `deletedAt` | 2 |
| 18 | `Subtask` | UUID | Yes (companyId) | `deletedAt` | 2 |
| 19 | `ProcessTemplate` | UUID | Yes | No | 1 + UNIQUE |
| 20 | `ProcessTemplateStep` | UUID | Indirect | No | 1 + UNIQUE |
| 21 | `ProcessInstance` | UUID | Yes | No | 2 |
| 22 | `ProcessInstanceStep` | UUID | Indirect | No | 1 + UNIQUE |
| 23 | `ComplianceCategory` | UUID | Optional | No | 1 |
| 24 | `ComplianceRule` | UUID | Optional | No | 2 |
| 25 | `ComplianceBinding` | UUID | Indirect (via rule) | No | 1 + UNIQUE |
| 26 | `ComplianceViolation` | UUID | Yes | No | 3 |
| 27 | `Escalation` | UUID | Yes | No | 2 |
| 28 | `ComplianceEvidence` | UUID | Yes | No | 3 |
| 29 | `Comment` | UUID | Yes | `deletedAt` | 2 |
| 30 | `Attachment` | UUID | Yes | No | 2 |
| 31 | `AuditLog` | UUID | Yes | No | 3 |
| 32 | `Notification` | UUID | Indirect (via User) | No | 1 |

---

### 10.4 Enum Inventory

| Enum | Values |
|------|--------|
| `SubscriptionStatus` | `Active`, `PastDue`, `Cancelled` |
| `CompanyStatus` | `Active`, `Suspended`, `Closed` |
| `RoleTemplateOrigin` | `platform_predefined`, `company_custom` |
| `ScopeType` | `Company`, `Branch`, `Team`, `Project` |
| `TaskStatus` | `Draft`, `Active`, `In_Review`, `Blocked`, `Completed`, `Cancelled` |
| `TaskPriority` | `Low`, `Medium`, `High`, `Urgent` |
| `StepType` | `Approval`, `Input_Required`, `Automated_Task` |
| `ProcessInstanceStatus` | `Draft`, `Active`, `Completed`, `Cancelled`, `Rejected` |
| `StepStatus` | `Pending`, `Approved`, `Rejected`, `Skipped` |
| `Severity` | `Low`, `Medium`, `High`, `Critical` |
| `ViolationStatus` | `Open`, `Under_Review`, `Resolved`, `Ignored` |
| `EscalationStatus` | `Open`, `Reviewed`, `Resolved`, `Closed` |
| `EvidenceStatus` | `Pending`, `Under_Review`, `Approved`, `Rejected` |
| `AuditAction` | `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `LOGIN`, `PERMISSION_CHANGE` |

---

### 10.5 Index Coverage Analysis

**Well-indexed fields:**
- All `companyId` fields on tenant-scoped models ✔
- `AuditLog.entityType + entityId` (composite) — supports entity history queries ✔
- `ComplianceViolation.entityType + entityId` — supports cross-entity violation lookups ✔
- `RoleAssignment.scopeType + scopeId` (composite) — supports scope-based queries ✔

**Missing or potentially missing indexes:**

| Table | Missing Index | Impact |
|-------|--------------|--------|
| `Task` | `assignedToId` | `GET /tasks/assignee/:userId` does a full table scan on `assignedToId` without index. Performance degrades with many tasks. |
| `Task` | `deletedAt` | Soft delete filter (`deletedAt IS NULL`) on every query has no partial index support. |
| `Subtask` | `assignedToId` | Similar issue for subtask queries by assignee. |
| `User` | `email` (global) | `email` is UNIQUE only within `companyId`. Cross-tenant email lookup (during login via `findFirst({ email })`) is efficient only if Postgres uses the composite unique index. |
| `ComplianceEvidence` | `userId` | No index on evidence by submitting user. |
| `Notification` | `isRead` | No index on `isRead` — filtering unread notifications requires full scan of user's notifications. |

---

### 10.6 Cascade Delete Coverage

| Relation | `onDelete` behavior | Risk |
|----------|---------------------|------|
| `RoleTemplatePermission → RoleTemplate` | `Cascade` ✔ | Safe |
| `RolePermission → Role` | `Cascade` ✔ | Safe |
| `ComplianceBinding → ComplianceRule` | `Cascade` ✔ | Deleting a rule auto-deletes all bindings |
| `Notification → User` | `Cascade` ✔ | Deleting a user removes their notifications |
| `Subtask → Task` | **No cascade** | ⚠️ Soft-deleting a Task (`deletedAt`) does NOT cascade to Subtasks. Subtasks remain visible in queries if `deletedAt` not filtered at Subtask level too. |
| `Task → Company` | **No cascade** | If a Company were deleted, orphaned Task rows would remain (referential integrity violation). Postgres prevents deletion. |
| `User → Company` | **No cascade** | Same — Company cannot be deleted while it has users. |
| `RoleAssignment → User` | **No cascade** | If a user were hard-deleted, RoleAssignment rows remain. (Users are soft-deleted so this is safe in practice.) |
| `AuditLog → User` (performedBy) | **No cascade** | `performedById` is nullable, so audit logs survive user deletion. Safe by design. |

---

### 10.7 Data Integrity Issues

#### 10.7.1 Missing FK on AuditLog.companyId

```prisma
model AuditLog {
  companyId String   // ❌ No @relation() — no FK constraint to Company
  ...
}
```

> 🔴 `AuditLog.companyId` is stored as a plain String with **no foreign key constraint** to `Company`. This means:
> - Invalid / fake `companyId` values (e.g. the hardcoded `'b7744408-...'`) can be inserted without DB rejection.
> - The hardcoded fallback from `AuditLogsService` will insert without error even if the company UUID doesn't exist in the DB.

#### 10.7.2 `Project.status` is a Plain String, Not an Enum

```prisma
status String @default("Active")  // ⚠️ No enum constraint
```

Contrary to `Task` (which uses `TaskStatus` enum), `Project.status` is a free-form string. The frontend sends `"Active"`, `"Completed"`, `"On_Hold"` but the DB will accept any string.

#### 10.7.3 `Task.estimatedHours` Default Inconsistency

```prisma
estimatedHours Decimal? @db.Decimal(5, 2)   // nullable, no default
actualHours    Decimal? @default(0) @db.Decimal(5, 2)   // nullable with default 0
```

`estimatedHours` is nullable with no default while `actualHours` defaults to 0. In the `create` DTO, both default to `0` in the service, but the schema difference means DB-level inserts without the service layer could produce null `estimatedHours`.

#### 10.7.4 User.email UNIQUE Scope

```prisma
@@unique([companyId, email])  // Unique WITHIN company
// No global uniqueness constraint
```

The same email address can be registered by two different companies. This is intentional for multi-tenancy, but it means:
- Login's `findFirst({ email: ... })` (without `companyId` filter) could match the wrong tenant's user if two companies share an employee email.
- No way to do a cross-tenant "password reset via email" without knowing the company first.

#### 10.7.5 `ComplianceBinding` Has No `companyId`

```prisma
model ComplianceBinding {
  ruleId    String
  rule      ComplianceRule @relation(..., onDelete: Cascade)
  scopeType ScopeType
  scopeId   String         // Could be Team ID, Branch ID, or Company ID
}
```

`ComplianceBinding` has **no `companyId`** field. Tenant isolation relies entirely on `ComplianceRule.companyId` being set correctly. The observer (`ComplianceObserverService`) queries bindings by `scopeType: 'Team'` and `scopeId: teamId` without a `companyId` filter — if two companies happen to have a `scopeId` collision (UUIDs guarantee uniqueness, so risk is low but architectural debt exists).

#### 10.7.6 `Subtask.companyId` Not FK-Linked to Company

```prisma
model Subtask {
  companyId String   // ⚠️ No @relation() to Company
  taskId    String
  task      Task     @relation(...)
}
```

Similar to `AuditLog`, `Subtask.companyId` is a plain string with no FK enforcement.

---

### 10.8 Schema Design Strengths

| Strength | Detail |
|----------|--------|
| UUID PKs everywhere | No sequential integer IDs exposed — no enumeration attack risk |
| Soft delete on critical entities | `Task`, `Subtask`, `Comment` all use `deletedAt` pattern |
| Well-normalized structure | No denormalized JSON blobs in operational tables (only `AuditLog.oldValue/newValue` which is appropriate) |
| Enum-typed status fields | `TaskStatus`, `ViolationStatus`, `EvidenceStatus` etc. prevent arbitrary string values |
| Self-referential RoleTemplate loopback | `ProcessTemplateStep.onRejectGotoStepId` self-references for workflow loopback |
| Audit trail built-in | `AuditLog` is a first-class model with action enum, old/new values, IP, user agent |
| `@@unique` compound constraints | `User[companyId, email]`, `ProcessTemplate[companyId, name, version]`, `ProcessInstanceStep[instanceId, templateStepId]` all have appropriate compound uniqueness |

---

### 10.9 Migration Strategy Risk

| Item | Status | Risk |
|------|--------|------|
| Migration count | 1 (single `_init`) | ⚠️ All schema changes since init were done via `db push`, not migrations. Rollback is impossible. |
| Production migration path | Unknown | If the team deploys to a new server, `db push` will try to match schema to DB destructively. |
| Seed data dependency | High | Seed creates platform-level role templates and compliance rules. Without seed, the company registration flow (`cloneRoleTemplates`) may create no roles. |
| No schema versioning | Confirmed | No `version` or `applied_at` in migration records beyond the init file. |

---

### 10.10 Database Consistency Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| FK coverage | ⚠️ Gaps | `AuditLog.companyId`, `Subtask.companyId` are plain strings without FK |
| Cascade deletes | ⚠️ Partial | Only 4 relations have cascade; soft-delete doesn't cascade to children |
| Enum enforcement | ✅ Good | Status, priority, severity fields use Prisma enums |
| Index coverage | ⚠️ Gaps | Missing indexes on `Task.assignedToId`, `Subtask.assignedToId`, `Notification.isRead` |
| Multi-tenancy at DB level | ⚠️ Partial | `companyId` is present on all tenant models but enforced by app layer, not DB-level RLS |
| Unique constraints | ✅ Good | `User[companyId, email]`, `ProcessTemplate[companyId, name, version]` etc. |
| Migration strategy | ⚠️ Risky | Single `_init` migration + `db push` only; no rollback path |
| Schema documentation | ⚠️ Minimal | Comments in schema are section headers only; no field-level docs |

---

## 11. Authentication & Authorization

---

### 11.1 Authentication Architecture Overview

The system uses a **hybrid auth model** that mixes concepts without fully committing to any single standard approach:

| Mechanism | Used For | Status |
|-----------|----------|--------|
| **bcrypt password hashing** | User login | ✅ Implemented correctly |
| **JWT (jsonwebtoken)** | Company registration response only | ⚠️ Generated but never validated on subsequent requests |
| **Custom HTTP headers** (`x-user-id`, `x-user-role`, `x-company-id`) | All API request identity | ⚠️ Client-controlled, partially trusted |
| **SessionStorage** | Frontend session persistence | Tab-isolated; clears on tab close |
| **No JWT validation middleware** | N/A | ❌ JWT is issued on registration but the backend never validates it on subsequent requests |
| **No refresh tokens** | N/A | N/A — JWT expires in 24h but there's no renewal mechanism |

---

### 11.2 Login Flow — Complete End-to-End Trace

#### Normal Path (Backend Login)

```
User submits email + password to login form
  ↓
fetch("http://localhost:5500/auth/login", { email, password })
  ↓
[TenantMiddleware skips /auth/login URL]
  ↓
AuthController.login(dto) → AuthService.login(dto)
  ↓
1. prisma.user.findFirst({ email: { equals: dto.email, mode: 'insensitive' } })
   ⚠️ No companyId filter — returns FIRST user with that email across ALL companies
   ⚠️ If two companies have the same email, the first created user wins
  ↓
2. bcrypt.compare(dto.password, user.passwordHash)
   ↓ Throws UnauthorizedException if no match
  ↓
3. Role resolution: 8-step if/else chain using .includes() on role labels
   ↓
4. auditLog.create({ ipAddress: '127.0.0.1' })   ← 🔴 IP always hardcoded
  ↓
5. Return { success: true, targetRoute, roleSlug, user: { ... } }
   ⚠️ No JWT token is returned on login — the frontend stores role/id in sessionStorage
  ↓
Frontend: sessionStorage.setItem('currentUser', JSON.stringify(user))
Frontend: window.location.href = targetRoute
```

#### Fallback Path (Password Bypass — Critical Bug)

```javascript
// auth-flows.js lines 127-195
// If /auth/login returns any error (network, 500, etc.):
try {
  const authRes = await fetch("/auth/login", ...);
  // ... handle success ...
} catch (e) {
  console.warn("Backend attempt failed, attempting fallback...", e);
}

// FALLBACK: Fetches ALL users from /users (no password check)
const rawUsers = await api.request('/users', 'GET', null, { 'x-company-id': 'all' });
const validUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
// If email matches ANY user, session is created WITHOUT password verification
sessionStorage.setItem('currentUser', JSON.stringify({ ...validUser, role: resolvedRole }));
window.location.href = targetRedirect;
```

> 🔴 **Critical Security Bug**: If the `/auth/login` endpoint throws any exception (e.g. a 500 error, network timeout, or any uncaught runtime error), the frontend silently falls through to a **password-less email-only lookup**. Any user who knows a valid email address can log in by exploiting this fallback. This is a **complete authentication bypass**.

---

### 11.3 JWT Architecture — Issued But Never Validated

#### When JWT is Generated

JWT is only generated in `AuthService.registerCompany()` (line 336), **not** in `AuthService.login()`:

```typescript
const token = jwt.sign(
  { sub: result.user.id, companyId: result.company.id, role: 'System Admin' },
  process.env.JWT_SECRET || 'fallback_secret',  // 🔴 Hardcoded fallback
  { expiresIn: '24h' }
);
```

#### What Happens to the JWT

| Step | Detail |
|------|--------|
| Generated | Only on `POST /auth/register-company` |
| Returned to client | Yes — in `{ token: "..."}` response body |
| Stored by frontend | No — `auth-flows.js` does not read or store `token` from the registration response |
| Validated on API calls | ❌ **Never** — no `JwtAuthGuard`, no JWT middleware, no `Authorization: Bearer` validation on the backend |
| Used in API headers | Helpers.api.request sends `Authorization: Bearer <actorId>` — **not a JWT**, just the user's UUID |

> 🔴 **The JWT is a dead artifact.** It is generated, returned, ignored by the frontend, and never validated by the backend. The entire system runs on header-based identity (`x-user-id`, `x-user-role`).

---

### 11.4 Platform Admin Authentication

Platform admins have a **completely separate authentication path** from regular users:

```
Login form submits email
  ↓
  (1) /auth/login fails (no platform admin match — different DB table)
  ↓
  (2) /users fallback fails (no match in Users table)
  ↓
  (3) Fallback: fetch all platform admins from /platform-admin-users
      with headers: { 'x-platform-admin-id': 'bootstrap', 'x-user-role': 'platform_admin' }
  ↓
  (4) Find admin by email ONLY — no password check
  ↓
  (5) Set session and redirect to /platform-admin/dashboard.html
```

> 🔴 **Platform admin login has NO password verification at all.** Any person who knows a platform admin's email address can authenticate as that admin from the frontend login page. The password field on the login form is completely ignored for platform admins.

---

### 11.5 Password Security Audit

| Item | Implementation | Status |
|------|---------------|--------|
| Hashing algorithm | `bcrypt` (bcryptjs) with salt rounds = 10 | ✅ Adequate |
| Import style | `import bcrypt from 'bcryptjs'` (AuthService) / `import * as bcrypt from 'bcryptjs'` (PlatformAdminService) | ⚠️ Inconsistent import style |
| Default hash on user create | `passwordHash: dto.password_hash ?? 'default_hash'` | ❌ Literal string `'default_hash'` — user can never log in |
| Default hash on platform admin create | `passwordHash = await bcrypt.hash('PlatformAdmin123!', 10)` | ⚠️ Known default password hardcoded |
| Password minimum length | None — `@IsString() @IsNotEmpty()` only | ⚠️ No minimum length or complexity enforcement |
| Password reset | Fake UI-only flow (no backend call, just redirects to `reset-password.html`) | ❌ Not implemented |
| Forgot password | Fake UI-only flow (shows success message with no email sent) | ❌ Not implemented |
| Brute force protection | None — no rate limiting, no account lockout | ❌ Missing |
| CAPTCHA | None | ❌ Missing |

---

### 11.6 RBAC Enforcement Chain

The following 5 layers enforce role-based access. **Each layer is a different check** and they are not always consistent:

```
Layer 1: TenantMiddleware (per-request, global)
  └─ Resolves user from DB using x-user-id / x-user-email header
  └─ Sets req.user.roleLabel (DB-resolved ✔) and req.user.role (header-trusted ❌)
  └─ Platform admin bypass: anyone with x-user-role: platform_admin header bypasses

Layer 2: RolesGuard (per-request, global + per-controller)
  └─ Checks @Roles() decorator against 3 surfaces:
       req.user.roleLabel (trusted) OR req.user.role (untrusted) OR x-user-role header (untrusted)
  └─ A match on ANY untrusted surface grants access

Layer 3: protectPage() (frontend, page load)
  └─ Reads role from sessionStorage["currentUser"].role
  └─ superuser / company_owner bypass ALL role checks (god-mode)
  └─ Bypassable via DevTools sessionStorage edit

Layer 4: Auth.can(slug) (frontend, action-level)
  └─ Stub implementation — only checks roleId === 1 or 2
  └─ All other permission slugs return false (incomplete)

Layer 5: Service-level validation (per-method, inconsistent)
  └─ Some services validate actor role from req.user
  └─ Others trust dto.companyId from request body
  └─ ExecutiveController has NO service layer
```

---

### 11.7 Session Lifecycle

| Event | Behavior |
|-------|----------|
| Login | Session written to `sessionStorage["currentUser"]` |
| Page load | `protectPage()` reads session |
| API call | `Helpers.api.request()` reads session to build headers |
| Tab close | Session lost (sessionStorage is tab-isolated) |
| Logout | `clearAppSession()` clears both `sessionStorage` and `localStorage` |
| User deactivation | Soft-delete only — existing session remains valid until tab close |
| Token expiry | No server-side expiry check; session persists indefinitely unless tab is closed |
| Concurrent tabs | No shared state; each tab has independent login state |

---

### 11.8 Auth Vulnerability Summary

| # | Vulnerability | Severity | Location |
|---|--------------|----------|----------|
| 1 | Frontend fallback login bypasses password verification | 🔴 Critical | `auth-flows.js` L127–195 |
| 2 | Platform admin login has NO password check | 🔴 Critical | `auth-flows.js` L198–218 |
| 3 | `JWT_SECRET` falls back to `'fallback_secret'` in production | 🔴 Critical | `auth.service.ts` L342 |
| 4 | JWT is issued on registration but never validated | 🔴 Critical | `main.ts` — no JWT guard |
| 5 | `x-user-role: platform_admin` bypasses TenantMiddleware for any requester | 🔴 Critical | `tenant.middleware.ts` L66–82 |
| 6 | Tier-3 fallback resolves first DB user with no auth | 🔴 Critical | `tenant.middleware.ts` L118–124 |
| 7 | RolesGuard trusts raw `x-user-role` header | 🔴 High | `roles.guard.ts` L71–72 |
| 8 | `'default_hash'` literal used as password fallback | 🔴 High | `users.service.ts` L110 |
| 9 | Platform admin default password `'PlatformAdmin123!'` | 🔴 High | `platform-admin-users.service.ts` L66 |
| 10 | No password minimum length or complexity | ⚠️ Medium | `login.dto.ts` |
| 11 | Forgot password / reset password are fake (no backend) | ⚠️ Medium | `auth-flows.js` L309–339 |
| 12 | Login audit log IP always `'127.0.0.1'` | ⚠️ Medium | `auth.service.ts` L175 |
| 13 | No brute force protection / rate limiting on `/auth/login` | ⚠️ Medium | `main.ts` |
| 14 | Login does not filter by `companyId` — cross-tenant email ambiguity | ⚠️ Low | `auth.service.ts` L11–12 |
| 15 | `Auth.requireRole()` does not verify the required role | ⚠️ Low | `auth.js` L168–175 |

---

### 11.9 Auth Consistency Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| Password hashing | ✅ Correct | bcrypt-10 used correctly in all places that matter |
| JWT issuance | ⚠️ Inconsistent | Only on registration; never on login |
| JWT validation | ❌ None | No backend JWT guard exists |
| Session management | ⚠️ Weak | sessionStorage only; no server-side sessions |
| RBAC enforcement (backend) | ⚠️ Partial | 2 of 3 guard surfaces are client-controlled |
| RBAC enforcement (frontend) | ⚠️ Bypassable | DevTools sessionStorage edit defeats all page guards |
| Password reset | ❌ Not implemented | UI exists but no backend integration |
| Platform admin auth | ❌ No password check | Email-only authentication for highest privilege role |

---

## 12. Configuration & Environment

---

### 12.1 Environment File Audit

#### Actual `.env` (2 lines only)

```dotenv
DATABASE_URL="URL_TO_CLOUD_DB"
NODE_ENV="development"
```

> 🔴 **The actual `.env` file contains live production database credentials** (user, password, and full Neon cloud connection string). The `.gitignore` correctly excludes `.env`, but the risk depends on whether this file has ever been committed to the repo.

> ⚠️ **`JWT_SECRET` is NOT set in `.env`**. The application falls back to `'fallback_secret'` for JWT signing on every run of this repository.

> ⚠️ **`NODE_ENV` is set to `'development'`** in the only `.env` file that exists. This means HSTS (`Strict-Transport-Security`) is disabled (it's guarded by `process.env.NODE_ENV === 'production'`), and the app always runs in dev mode.

#### `.env.example` (Documented variables)

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/optiflow?schema=public"
PORT=5500
JWT_SECRET="replace-with-a-long-random-secret"
FRONTEND_ORIGINS="http://localhost:3000,..."
```

**Gap**: `.env.example` documents 4 variables. The real `.env` only sets 2. `PORT`, `JWT_SECRET`, and `FRONTEND_ORIGINS` are absent from the real `.env`.

---

### 12.2 Environment Variable Coverage

| Variable | Where Used | Set in `.env` | Fallback |
|----------|-----------|--------------|----------|
| `DATABASE_URL` | Prisma datasource | ✅ Yes | None (hard crash if missing) |
| `NODE_ENV` | Helmet HSTS guard | ✅ Yes (`development`) | Implicit `undefined` |
| `PORT` | `main.ts` L134 | ❌ Not set | `5500` (hardcoded fallback) |
| `JWT_SECRET` | `auth.service.ts` L342 | ❌ Not set | `'fallback_secret'` (hardcoded) |
| `FRONTEND_ORIGINS` | `main.ts` CORS L34 | ❌ Not set | Hardcoded localhost list |
| `FRONTEND_ORIGIN` | `main.ts` CORS L34 | ❌ Not set | Same fallback |

**Summary**: Only 2 of 6 known environment variables are actually configured.

---

### 12.3 ConfigService Adoption

`@nestjs/config` (`ConfigModule`, `ConfigService`) is **installed** as a dependency and registered globally in `AppModule`:

```typescript
ConfigModule.forRoot({ isGlobal: true })  // app.module.ts L65
```

However, `ConfigService` is **never injected or used** in any service or controller across the entire codebase:

```
Search for 'ConfigService' in back-end/src: 0 results
```

All environment access is done via **raw `process.env` calls** directly in code, not through the managed `ConfigService`. This means:
- No type safety on env vars
- No validation at startup (missing required vars fail silently)
- No centralized env var documentation in code

---

### 12.4 Hardcoded Values Inventory

The following values are hardcoded in source code and should be environment variables:

| Value | Location | Severity |
|-------|----------|----------|
| `'fallback_secret'` (JWT signing key) | `auth.service.ts` L342 | 🔴 Critical |
| `'default_hash'` (user password fallback) | `users.service.ts` L110 | 🔴 Critical |
| `'PlatformAdmin123!'` (admin default password) | `platform-admin-users.service.ts` L66 | 🔴 Critical |
| `'b7744408-190c-4b83-82c5-ab0049afb6b2'` (fallback companyId) | `audit-logs.service.ts`, `auth.js` | 🔴 Critical |
| `'127.0.0.1'` (hardcoded login IP) | `auth.service.ts` L175 | ⚠️ Medium |
| `'http://localhost:5500'` (backend base URL) | `helpers.js` L134 + 27 other frontend files | 🔴 Deployment Blocker |
| Port `5500` | `main.ts` L134 | ⚠️ Low (has env fallback) |
| `'platform-admin-system'` (fallback admin ID) | `tenant.middleware.ts` L74 | ⚠️ Low |
| `'admin@system.com'` (fake admin email) | `tenant.middleware.ts` L78 | ⚠️ Low |

---

### 12.5 Frontend Hardcoded URL Scope

`http://localhost:5500` appears in **at least 28 locations** across the frontend:

| File | Count | Notes |
|------|-------|-------|
| `js/utils/helpers.js` | 1 | `Helpers.api.baseUrl` — used by most pages via the API abstraction layer |
| `js/pages/auth-flows.js` | 3 | Login, fallback fetch, registration form |
| `admin/processes/process-builder.js` | 4 | Direct `fetch()` bypassing Helpers.api |
| `admin/hr/dashboard.js` | 3 | Direct `fetch()` bypassing Helpers.api |
| `js/pages/hr/dashboard.js` | 3 | Duplicate of admin/hr/dashboard.js |
| `admin/pm/hr-dashboard.html` | 3 | Inline script in HTML file |
| `js/pages/pm/tasks.js` | 2 | Evidence upload direct fetch |
| `register.html` | 2 | Registration form inline script |
| `admin/executive/executive_dashboard.js` | 2 | Metrics fetch |
| `js/pages/compliance/evidence.js` | 2 | Evidence list and upload |
| `js/data/new-employee.js` | 1 | HR invite |
| `platform-admin/platform-login.html` | 1 | Platform admin login fetch |

> ⚠️ Many of these are **direct `fetch()` calls that bypass `Helpers.api.request()`**. Changing the base URL in `helpers.js` alone will not fix all 28 occurrences.

---

### 12.6 Logging Configuration

**LoggingService** writes to local filesystem:

| Log Type | File Pattern | Rotation |
|----------|-------------|----------|
| Application | `logs/application-YYYY-MM-DD.log` | Date-based (daily auto-rotate by filename) |
| Error | `logs/error-YYYY-MM-DD.log` | Date-based (daily auto-rotate by filename) |

**Strengths of LoggingService:**
- ✅ Sanitizes sensitive keys: `password`, `token`, `authorization`, `secret`, `databaseurl` etc.
- ✅ Redacts JWT patterns (`eyJ...`) from log output
- ✅ Redacts DB connection string passwords
- ✅ Appends async — non-blocking, won't crash app on failure
- ✅ Resolves log directory by traversing up to find `package.json`

**Weaknesses of LoggingService:**
- ⚠️ Local filesystem only — logs are lost on container/process restart
- ⚠️ No maximum file size limit — files grow unboundedly within a day
- ⚠️ No log retention policy — old date files accumulate indefinitely
- ⚠️ No external log aggregation (no Syslog, no ELK, no CloudWatch)
- ⚠️ No structured JSON logging — plain text format is harder to query

---

### 12.7 Dev/Scaffold Scripts Committed to Repo

The following non-production scripts exist in the `back-end/` root:

| File | Purpose | Risk |
|------|---------|------|
| `inject-seed.js` (6.8 KB) | Dev tool to inject seed data | Dev artifact in production repo |
| `scaffold.js` (2.6 KB) | Scaffolding helper | Dev artifact |
| `rename_workflow.js` (1.8 KB) | Workflow rename utility | Dev artifact |
| `update_controllers.py` (3.2 KB) | Python script to bulk-edit controllers | Dev artifact |

These are not security risks but indicate the repo was not cleaned up before handover.

---

### 12.8 Deployment Blockers

The following must be resolved before the application can be deployed to any environment other than a developer's local machine:

| # | Blocker | Files Affected | Action Needed |
|---|---------|---------------|---------------|
| 1 | 28 hardcoded `http://localhost:5500` URLs in frontend | 12+ frontend files | Extract to a config constant or use env-based build |
| 2 | `JWT_SECRET` not in `.env` — falls back to `'fallback_secret'` | `.env`, `auth.service.ts` | Add `JWT_SECRET` to all environments |
| 3 | `NODE_ENV=development` always — HSTS never enabled | `.env` | Set `NODE_ENV=production` in production env |
| 4 | Database credentials in `.env` point to shared dev cloud DB | `.env` | Provision per-environment database |
| 5 | No `FRONTEND_ORIGINS` set — CORS falls back to localhost list | `.env`, `main.ts` | Set production origin in env |
| 6 | `start:prod` runs `node dist/main` — requires prior `npm run build` | `package.json` | Add build step to deployment pipeline |
| 7 | Seed must be run manually after fresh DB — no migration pipeline | `package.json` | Document or automate seed in deploy script |

---

### 12.9 Configuration Consistency Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| `.env` file | ⚠️ Incomplete | Only 2 of 6 vars set; `JWT_SECRET` missing |
| ConfigService usage | ❌ None | Raw `process.env` used everywhere despite `ConfigModule` being registered |
| Hardcoded secrets | ❌ 4 critical | `fallback_secret`, `default_hash`, `PlatformAdmin123!`, hardcoded companyId |
| Hardcoded URLs | ❌ 28 occurrences | `http://localhost:5500` spread across 12+ frontend files |
| Logging | ✅ Well-designed | Good sanitization; local filesystem only |
| NODE_ENV | ⚠️ Always `development` | HSTS disabled; dev mode in all environments |
| Deployment readiness | ❌ Not ready | Multiple blockers before any non-local deployment |

---

## 13. External Services / APIs

---

### 13.1 Summary

> ⚠️ **This system has exactly one real external service dependency: its PostgreSQL database.** Every other integration that a production SaaS product in this domain would need (email, payments, file storage, real-time push) is either absent or exists only as a data model stub with no actual backend implementation.

---

### 13.2 Real External Dependencies

| Service | Provider | Purpose | Integration Status |
|---------|----------|---------|-------------------|
| **PostgreSQL Database** | Neon (cloud-hosted, `ap-southeast-1`) | All persistent data storage | ✅ Fully integrated via Prisma |
| **Google Fonts** | Google CDN | Frontend typography (Inter font) | ✅ Frontend CDN link only |
| **Font Awesome 6** | Font Awesome CDN | Frontend icons | ✅ Frontend CDN link only |

---

### 13.3 Internal-Only "Services" (No External Integration)

The following features exist in the codebase as DB models or UI but have **no real external service backing them**:

#### Email / Notifications

| What Exists | What's Missing |
|------------|----------------|
| `Notification` DB model and `NotificationsService` (CRUD to DB) | No email delivery: no `nodemailer`, no SendGrid, no SES, no SMTP config |
| Frontend bell dropdown reads from `/notifications` API | No push: no WebSockets, no Server-Sent Events, no FCM |
| `Helpers.pushNotification()` POSTs to `/notifications` endpoint | Only writes to DB; recipient has no way to know in real time |
| Forgot password UI shows success message | No actual email is sent; the handler has no `fetch()` call at all |
| Account activation implied by registration flow | No welcome email, no verification link |

**Confirmed absence:**
```
Search for 'nodemailer', 'sendgrid', 'smtp', 'mailer', '@nestjs/mailer' in back-end: 0 results
Search for 'socket.io', 'ws', 'sse', 'EventSource' in back-end: 0 results
```

#### Payment / Billing

| What Exists | What's Missing |
|------------|----------------|
| `Plan` model with `monthlyPrice`, `annualPrice`, `priceMonthly`, `priceYearly` | No payment gateway: no Stripe, no Razorpay, no PayPal |
| `Subscription` model with `status`, `billingCycle`, `currentPeriodEnd` | No checkout flow, no webhook handler for payment events |
| Registration flow creates a `Subscription` row in the DB | `currentPeriodEnd` is calculated client-side by adding 30 or 365 days |
| `SubscriptionStatus` enum: `Active`, `PastDue`, `Cancelled` | No process to actually set `PastDue` or `Cancelled` — statuses are manual |

**Confirmed absence:**
```
Search for 'stripe', 'razorpay', 'paypal', 'payment' in back-end: 0 results
```

> 💡 The billing system is a **data model prototype**. It correctly models what a SaaS billing system should look like but has no actual payment processing capability.

#### File / Object Storage

| What Exists | What's Missing |
|------------|----------------|
| `multer` file upload via `POST /evidence/:id/upload` | No cloud storage: no AWS S3, no GCP Cloud Storage, no Cloudinary |
| Files stored to `back-end/uploads/` directory on server disk | On container restart or server move, all uploaded files are lost |
| `fileUrl` stored as `/uploads/filename` relative path | Not a CDN URL; only accessible if backend is the same host as when uploaded |
| `useStaticAssets(uploadsDir, { prefix: '/uploads' })` in `main.ts` | Serves uploaded files directly from the backend process |

**Risk**: Uploaded compliance evidence files are stored to local disk. In any containerized, serverless, or load-balanced deployment, files uploaded to one instance will not be accessible from another.

#### Real-Time Features

| What Exists | What's Missing |
|------------|----------------|
| In-app notification bell (frontend reads from DB poll on page load) | No real-time delivery: no WebSockets (`socket.io`), no SSE |
| `EventEmitter2` (internal NestJS event bus) | Internal only — used for task→compliance observer, not client-facing |

#### External Authentication / SSO

| What Exists | What's Missing |
|------------|----------------|
| Custom email+password login | No OAuth/OIDC: no Google Login, no Microsoft SSO, no SAML |
| `@nestjs/passport`, `passport-jwt` NOT in dependencies | Not planned by current dependencies |

---

### 13.4 Missing Integrations by Priority

For a production SaaS HR/PM/Compliance platform, the following are missing:

| Priority | Missing Integration | Impact |
|----------|-------------------|--------|
| 🔴 Critical | **Email service** (transactional) | Password reset is broken; no account confirmation; no notification delivery |
| 🔴 Critical | **Cloud file storage** (S3/GCS) | All uploaded evidence files are lost on server restart |
| ⚠️ High | **Payment gateway** (Stripe/Razorpay) | Subscriptions are manually created DB records; no real billing |
| ⚠️ High | **Real-time notifications** (WebSockets/SSE) | Users must manually refresh pages to see new notifications |
| ⚠️ Medium | **Background job queue** (Bull/BullMQ) | Scheduled jobs (compliance checks, reminder emails) cannot be reliably run |
| ⚠️ Medium | **Error monitoring** (Sentry/Datadog) | Errors only written to local log files; no alerting |
| ⚠️ Low | **SSO / OAuth** | Enterprise customers typically require SSO |
| ⚠️ Low | **Audit log archival** | Logs only in DB; no external SIEM integration |

---

### 13.5 Dependency Inventory (Third-Party Packages)

All backend runtime dependencies are listed below. None are external service SDKs:

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/common` | ^11 | NestJS framework core |
| `@nestjs/config` | ^4 | Env config (registered but unused) |
| `@nestjs/core` | ^11 | NestJS DI container |
| `@nestjs/event-emitter` | ^12 | Internal event bus (task→compliance) |
| `@nestjs/platform-express` | ^11 | Express HTTP adapter |
| `@nestjs/swagger` | ^11 | OpenAPI/Swagger docs |
| `@prisma/client` | ^6 | Database ORM client |
| `@types/multer` | ^2 | Multer file upload types |
| `bcryptjs` | ^3 | Password hashing |
| `class-transformer` | ^0.5 | DTO transformation |
| `class-validator` | ^0.15 | DTO validation decorators |
| `helmet` | ^8 | Security headers |
| `jsonwebtoken` | ^9 | JWT signing (registration only) |
| `reflect-metadata` | ^0.2 | TypeScript decorator support |
| `rxjs` | ^7 | NestJS reactive streams |

**Notable absences from dependencies:**
- No `multer` in dependencies (only `@types/multer`) — Express bundles multer, so this works but is implicit
- No `nodemailer`, no `stripe`, no `aws-sdk`, no `socket.io`, no `bull`

---

### 13.6 External Services Summary

| Category | Status | Detail |
|----------|--------|--------|
| Database | ✅ Real | Neon PostgreSQL via Prisma |
| Email delivery | ❌ None | No email service integrated |
| File storage | ⚠️ Local disk only | Not production-safe |
| Payment processing | ❌ None | DB model only, no gateway |
| Real-time communication | ❌ None | No WebSockets or SSE |
| Background jobs | ❌ None | No queue system |
| Error monitoring | ❌ None | Local log files only |
| CDN / Media delivery | ❌ None | Files served by NestJS process |
| SSO / OAuth | ❌ None | Custom auth only |

---

## 14. Error Handling

---

### 14.1 Global Error Infrastructure

The system has a well-structured global error handling stack:

```
Request → [Middleware] → [Guard] → [Controller] → [Service]
                                                      ↓ (throws HttpException / Prisma error / Error)
                          ←────────── GlobalExceptionFilter.catch()
                                  ↓ (logs to file via LoggingService)
                                  ↓ (returns standardized JSON error body)
Response ← TransformInterceptor wraps success responses in { success: true, data: ... }
```

---

### 14.2 GlobalExceptionFilter Analysis

**File:** `back-end/src/core/filters/global-exception.filter.ts` (139 lines)

The filter is registered globally via `LoggingModule` and handles 4 exception types:

| Exception Type | HTTP Status | Client Message | Notes |
|---------------|-------------|----------------|-------|
| `HttpException` (any NestJS exception) | From exception | From exception body or message | Stack logged for 5xx only |
| `Prisma.PrismaClientKnownRequestError` P2002 | 409 Conflict | "Unique constraint violation: ..." | Field name extracted from `meta.target` |
| `Prisma.PrismaClientKnownRequestError` P2025 | 404 Not Found | "Requested record was not found" | Cause extracted from `meta.cause` |
| `Prisma.PrismaClientKnownRequestError` P2003 | 400 Bad Request | "Foreign key constraint violation" | |
| `Prisma.PrismaClientKnownRequestError` P2000 | 400 Bad Request | "Input value too long for database field" | |
| `Prisma.PrismaClientKnownRequestError` (other) | 500 | "Internal server error" | Prisma error code logged |
| `Prisma.PrismaClientValidationError` | 400 | "Invalid database query parameters" | Validation errors sanitized |
| Generic `Error` | 500 | "Internal server error" | Message logged, not exposed |
| Unknown (non-Error) | 500 | "Internal server error" | `String(exception)` logged |

**Strengths:**
- ✅ Catches all exception types with `@Catch()` (no type argument = catch-all)
- ✅ Sanitizes internal details: 500s always return `'Internal server error'` to client
- ✅ Logs 4xx and 5xx errors to daily error log
- ✅ Logs stack trace only for 5xx (not for 4xx, reducing log noise)
- ✅ Handles Prisma-specific error codes explicitly
- ✅ Has a dedicated unit test (`global-exception.filter.spec.ts`)

**Weaknesses:**
- ⚠️ `void this.loggingService.logError(...)` uses `void` — fire-and-forget async. If `logError` rejects, it's silently lost.
- ⚠️ Prisma P2001 (record not found when searching), P2014 (relation violation), P2016 (query interpretation error) are not explicitly handled — fall through to generic 500.
- ⚠️ Error log path is returned from `request.originalUrl || request.url || '/'` — if middleware rewrites the URL, the log shows the wrong path.

---

### 14.3 TransformInterceptor — Success Response Format

**File:** `back-end/src/core/interceptors/transform.interceptor.ts`

All successful responses are wrapped:

```json
// Standard success response
{ "success": true, "data": <controller return value> }

// If controller already returns { success, data }, it's passed through without double-wrapping
```

**Response Format Inconsistency:**

The error response format (from `GlobalExceptionFilter`) is structurally different from the success format:

```json
// Error response
{
  "statusCode": 400,
  "timestamp": "2026-09-20T13:00:00.000Z",
  "path": "/tasks",
  "message": "..."
}

// Success response
{
  "success": true,
  "data": { ... }
}
```

> ⚠️ The frontend handles this inconsistency by doing `const data = json.data || json` in many places. Some controllers that return `{ success: true, ... }` directly (e.g. `AuthService.login`) get double-detected and passed through, while others get wrapped. This is fragile.

---

### 14.4 Service-Level Exception Pattern

The pattern used across all services is consistent and correct:

```typescript
// Consistent pattern found in ~15 services:
async findOne(id: string) {
  const record = await this.prisma.model.findFirst({ where: { id } });
  if (!record) throw new NotFoundException(`Entity ${id} not found`);
  return record;
}
```

Exception types used across services:

| Exception | Usage |
|-----------|-------|
| `NotFoundException` (404) | Used in all services for missing records ✔ |
| `BadRequestException` (400) | Used for validation, duplicate email, invalid manager ✔ |
| `ForbiddenException` (403) | Used in Tasks, Subtasks for cross-tenant boundary ✔ |
| `UnauthorizedException` (401) | Used in Auth, TenantMiddleware, Guards ✔ |
| `ConflictException` (409) | Never used — duplicates throw `BadRequestException` instead |
| `InternalServerErrorException` | Never explicitly thrown — caught by GlobalExceptionFilter |

---

### 14.5 Silent Failure Inventory

The following are intentional silent failures — errors that are caught and suppressed:

| Location | Code | What Fails Silently | Risk |
|----------|------|---------------------|------|
| `auth.service.ts` L167–181 | `try { auditLog.create(...) } catch (e) { // Non-blocking audit log catch }` | Login audit log write fails | Login succeeds but audit trail is missing. High risk for compliance. |
| `logging.service.ts` L45–47 | `try { mkdirSync(...) } catch { // Non-blocking fallback }` | Log directory creation fails | All subsequent log writes to that directory will fail silently |
| `evidence.service.ts` L139–142 | `try { attachment.create(...) } catch (e) { console.warn(...) }` | Attachment metadata creation fails | File is uploaded but `Attachment` record is not created; data inconsistency |
| `companies.service.ts` L158 | `console.warn('Warning during compliance rule cloning:', ruleErr)` | Individual compliance rule clone fails | Company registered with partial compliance rule set; no notification |

---

### 14.6 Console Logging Instead of LoggingService

The `LoggingService` sanitizes sensitive data before writing to file. The following raw `console` calls **bypass** this sanitization:

| File | Line | Call | Risk |
|------|------|------|------|
| `evidence.service.ts` | L140 | `console.warn('Could not create Attachment record:', e)` | Error object may contain file path, user data |
| `companies.service.ts` | L158 | `console.warn('Warning during compliance rule cloning:', ruleErr)` | Error may contain Prisma internals |
| `companies.service.ts` | L279 | `console.error(...)` | May log DB-level details |
| `prisma.service.ts` | L18 | `console.warn(...)` | Prisma connection warning bypasses sanitizer |
| `main.ts` | L136–137 | `console.log(...)` | Startup messages only — low risk |

> ⚠️ These `console.*` calls write directly to process stdout/stderr. In a containerized deployment, these appear in raw container logs without the sanitization that `LoggingService` applies, potentially leaking sensitive data.

---

### 14.7 Frontend Error Handling

The frontend uses `try/catch` on every API call but the pattern is inconsistent:

**Pattern A — Good (most pages):**
```javascript
try {
  const data = await Helpers.api.request('/endpoint', 'POST', body);
  // success
} catch (err) {
  showMessage('Operation failed: ' + err.message, 'error');
}
```

**Pattern B — XSS Risk (some pages):**
```javascript
} catch (err) {
  container.innerHTML = `<p class="error">${err.message}</p>`;
}
```

> ⚠️ `innerHTML` with `err.message` is an XSS vector if the error message contains HTML. While server-side error messages are sanitized by `GlobalExceptionFilter`, network errors and locally thrown errors may contain unescaped content from the DOM or URL.

**Unhandled Rejections:**
The frontend has no global `window.onerror` or `window.onunhandledrejection` handler. Unhandled promise rejections are silently lost in non-development browsers.

---

### 14.8 Prisma Service Connection Error Handling

```typescript
// prisma.service.ts
async onModuleInit() {
  try {
    await this.$connect();
  } catch (err) {
    console.warn('PrismaService: Could not connect to DB on init:', err);
    // does NOT rethrow — app starts even if DB is unavailable
  }
}
```

> ⚠️ The application will start successfully even if the database is completely unavailable. All subsequent DB operations will fail with runtime errors, but the startup health check passes. This makes monitoring deployment failures harder.

---

### 14.9 Error Handling Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| Global exception filter | ✅ Solid | Handles all 4 exception categories, logs to file |
| Prisma error mapping | ✅ Good | P2002, P2025, P2003, P2000 explicitly handled |
| HTTP exception types | ✅ Consistent | NotFoundException, BadRequestException, ForbiddenException used correctly |
| Response format | ⚠️ Inconsistent | Error and success formats differ in shape |
| Silent failures | ⚠️ 4 locations | Audit log, attachment, compliance rules all fail silently |
| Console vs LoggingService | ⚠️ Mixed | 4 files use raw console, bypassing sanitization |
| DB connection failure | ⚠️ Silent | App starts even when DB is offline |
| Frontend error handling | ⚠️ Inconsistent | Some pages use innerHTML with error messages (XSS risk) |
| Unhandled rejection handler | ❌ Missing | No global window.onerror or onunhandledrejection |

---

## 15. Testing

---

### 15.1 Test Infrastructure

| Item | Detail |
|------|--------|
| Unit test framework | Jest 30 with `ts-jest` |
| E2E test framework | Jest + `supertest` |
| Unit test location | `back-end/src/**/*.spec.ts` |
| E2E test location | `back-end/test/*.e2e-spec.ts` |
| E2E config | `back-end/test/jest-e2e.json` |
| Test scripts | `npm test` (unit), `npm run test:e2e` (e2e), `npm run test:cov` (coverage) |
| Frontend tests | ❌ None — no testing framework in frontend |

---

### 15.2 Unit Test Inventory

12 unit spec files found in `src/`:

| File | Test Count | Quality |
|------|-----------|----------|
| `app.controller.spec.ts` | 1 | `it('should be defined')` only |
| `core/database/database.service.spec.ts` | 1 | `it('should be defined')` only |
| `core/filters/global-exception.filter.spec.ts` | **5** | ✅ Meaningful — tests P2002, P2025, 500, 400, array messages |
| `core/logging/logging.service.spec.ts` | 1 | `it('should be defined')` only |
| `core/middleware/logger.middleware.spec.ts` | 1 | `it('should be defined')` only |
| `core/middleware/route-request.middleware.spec.ts` | 1 | `it('should be defined')` only |
| `modules/escalations/escalations.service.spec.ts` | 1 | `it('should be defined')` only |
| `modules/process-instance-steps/...controller.spec.ts` | 1 | `it('should be defined')` only |
| `modules/process-instance-steps/...service.spec.ts` | 1 | `it('should be defined')` only |
| `modules/process-instances/...controller.spec.ts` | 1 | `it('should be defined')` only |
| `modules/process-instances/...service.spec.ts` | 1 | `it('should be defined')` only |
| `modules/process-templates/...controller.spec.ts` | 1 | `it('should be defined')` only |
| `modules/process-templates/...service.spec.ts` | 1 | `it('should be defined')` only |
| `modules/subtasks/subtasks.service.spec.ts` | 1 | `it('should be defined')` only |
| `modules/tasks/tasks.controller.spec.ts` | 1 | `it('should be defined')` only |
| `modules/tasks/tasks.service.spec.ts` | 1 | `it('should be defined')` only |
| `modules/users/users.controller.spec.ts` | 1 | `it('should be defined')` only |
| `modules/users/users.service.spec.ts` | 1 | `it('should be defined')` only |

> 🔴 **11 out of 12 unit spec files contain exactly one test: `it('should be defined')`.** This is NestJS CLI boilerplate that was never expanded. These tests verify nothing beyond that the class can be instantiated — they provide zero behavioral coverage.

**The only meaningful unit test file is `global-exception.filter.spec.ts`** (171 lines, 5 real test cases).

#### Anti-Pattern Found: Missing Dependencies in Test Module

Several spec files fail to provide required dependencies:

```typescript
// users.service.spec.ts — UsersService requires PrismaService and AuditLogsService
// but neither is provided in the test module:
const module = await Test.createTestingModule({
  providers: [UsersService],  // ❌ Will throw at runtime: "Nest can't resolve dependencies"
}).compile();
```

These tests will either throw on compile or the `it('should be defined')` will never execute. The test suite reports them as passing only because Jest marks the `describe` block as passing when no test within it explicitly fails.

---

### 15.3 E2E Test Inventory

8 e2e spec files found in `test/`:

| File | Size | Tests | What's Covered |
|------|------|-------|---------------|
| `app.e2e-spec.ts` | 0.7 KB | 1 | App bootstrap health check |
| `cors-security.e2e-spec.ts` | 4.3 KB | ~6 | CORS preflight, origin validation, allowed headers |
| `helmet-security.e2e-spec.ts` | 4.5 KB | ~6 | `X-Content-Type-Options`, CSP, `X-Frame-Options` headers |
| `error-handling.e2e-spec.ts` | 6.4 KB | **5** | 404, 400 DTO validation, 401 login, 403 RBAC, 400 duplicate email |
| `rbac-routing.e2e-spec.ts` | 5.4 KB | **10** | Login persona matrix (8 roles), multi-tenant isolation (2 checks) |
| `router-middleware.e2e-spec.ts` | 4.3 KB | ~5 | Request logging, log file creation, middleware pass-through |
| `system-logging.e2e-spec.ts` | 7.6 KB | ~8 | Log file creation, sensitive data redaction, error log content |
| `jest-e2e.json` | Config | N/A | Configures `ts-jest` for e2e run |

#### E2E Test Quality Assessment

**Strong areas:**
- `error-handling.e2e-spec.ts` — Tests all 4xx error codes end-to-end AND verifies the error is written to the log file ✔
- `rbac-routing.e2e-spec.ts` — Iterates a full 8-persona login matrix, testing each role gets the correct `targetRoute` ✔
- `system-logging.e2e-spec.ts` — Verifies sensitive data redaction in log output (passwords, tokens) ✔
- `cors-security.e2e-spec.ts` — Verifies preflight `OPTIONS` responses and header allowlists ✔

**Critical weakness:**
- E2E tests hit the **real live Neon database** — there is no test database or mocking.
- Tests depend on seeded users (`ceo@acme.com`, `employee@acme.com`, etc.) to exist.
- If the database is reset or credentials change, all login-dependent e2e tests fail.

---

### 15.4 Coverage Gaps — What is NOT Tested

#### High-Risk Untested Paths

| Module | What's Untested | Why It Matters |
|--------|----------------|----------------|
| `AuthService.login()` | No unit test for login flow, role resolution, fallback path | The login is the highest-risk function in the codebase |
| Frontend auth fallback (`auth-flows.js` L127–195) | Entirely untested | Password bypass vulnerability has no regression test |
| `TenantMiddleware` | No unit test | 3 security bypass paths are untested |
| `ComplianceObserverService` | No unit or e2e test | Event-driven compliance observation logic |
| `AuthService.registerCompany()` | No unit test | 300-line transaction with 5 steps |
| `PlanLimitService` | No unit test | Plan limit enforcement logic |
| `EvidenceService.attachFile()` | No test | File upload path with silent attachment failure |
| All 25+ controllers | No unit tests | Controller routes, guards, and decorators untested |
| Soft-delete filtering | No test | `deletedAt IS NULL` filter could be accidentally removed |
| `getState()` in helpers.js | No test | 19-API cache function with known bug |

---

### 15.5 Frontend Testing

```
Search for test files in front-end/: 0 results
No testing framework (Jest, Vitest, Playwright, Cypress) found in front-end/
```

> ❌ **The frontend has zero tests.** No unit tests, no integration tests, no browser automation tests. For a Vanilla JS MPA of this complexity (~30 JS files, ~19 API endpoints, ~8 role-specific pages), this represents a significant risk.

---

### 15.6 Test Environment Issues

| Issue | Detail | Risk |
|-------|--------|------|
| E2E tests hit live DB | No `TEST_DATABASE_URL` separate from `DATABASE_URL` | Test runs mutate production data if run against the wrong environment |
| Seeded data dependency | `rbac-routing.e2e-spec.ts` requires seeded Acme Corp users | Tests fail on fresh DB without seed |
| Broken unit test modules | Several spec files missing required provider injections | Tests may not compile or silently skip |
| No CI pipeline | No `.github/workflows` or equivalent found | Tests are never automatically run |
| Coverage reporting | Configured (`npm run test:cov`) but no minimum threshold set | 0% coverage is technically a passing run |

---

### 15.7 Testing Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| Unit test count | ⚠️ 12 files | 11/12 are single `should be defined` assertions |
| Unit test behavioral coverage | ❌ ~0% | Only GlobalExceptionFilter has real tests |
| E2E test count | ✅ 8 files | Well-written and cover important security paths |
| E2E test isolation | ❌ None | Hit live database; depend on seeded data |
| Frontend tests | ❌ None | Zero test infrastructure |
| Critical path tests | ❌ Missing | Auth login, TenantMiddleware, ComplianceObserver untested |
| CI/CD integration | ❌ None | Tests are not automatically run |
| Coverage threshold | ❌ None configured | 0% coverage is a passing suite |

---

## 16. Deployment & Infrastructure

---

### 16.1 Summary

> ⚠️ **This project has zero deployment infrastructure.** No Dockerfile, no docker-compose, no CI/CD pipeline, no cloud platform config, no reverse proxy config, no process manager config. The application is designed to run locally on a developer's machine using `npm run start:dev`.

---

### 16.2 Infrastructure Inventory

| Item | Status | Detail |
|------|--------|--------|
| Dockerfile | ❌ None | Not found anywhere in repository |
| docker-compose | ❌ None | Not found |
| `.dockerignore` | ❌ None | Not found |
| GitHub Actions | ❌ None | No `.github/workflows/` directory |
| CI/CD pipeline | ❌ None | No CircleCI, GitLab CI, Jenkins, etc. |
| PM2 / process manager | ❌ None | No `pm2.config.js`, `ecosystem.config.js` |
| Nginx / reverse proxy | ❌ None | No `nginx.conf` |
| Cloud platform config | ❌ None | No `fly.toml`, `render.yaml`, `railway.toml`, `vercel.json` |
| Health check endpoint | ❌ None | No `/health`, `/ping`, or `/status` route |
| Load balancer config | ❌ None | N/A |

---

### 16.3 Current Running Architecture (Local Dev)

```
[Browser]
    ↓  http://localhost:5500  (direct requests to NestJS)
VS Code Live Server  ←─ serves front-end/ HTML/JS/CSS
    ↓  http://localhost:64064 (or similar Live Server port)
[NestJS backend]  ←─ npm run start:dev (watches src/, hot-reloads)
    ↓
[Neon PostgreSQL]  ←─ cloud-hosted DB (ap-southeast-1, shared)
    ↓
[uploads/]  ←─ local disk (served by NestJS as static assets)
```

**Key observations:**
- Backend and frontend run from two separate local servers on two different ports
- CORS is configured to allow both `localhost:5500` (backend serves itself?) and `localhost:64064` (Live Server)
- The `allowedOrigins` list in `main.ts` includes `http://localhost:64064` — a hardcoded Live Server port

---

### 16.4 Production Startup Procedure

The intended production startup is:

```bash
# Step 1: Build TypeScript to dist/
npm run build       # nest build → compiles src/ to dist/

# Step 2: Start the compiled server
npm run start:prod  # node dist/main
```

**Issues with this approach:**

| Issue | Detail |
|-------|--------|
| No build → start automation | The two steps are manual; no script chains them |
| `dist/` directory is gitignored | A fresh clone requires a build before `start:prod` works |
| No process restart on crash | No PM2, systemd, or supervisor configured |
| No graceful shutdown | No `SIGTERM` handler; in-progress DB transactions may be interrupted |
| Source maps in production | `sourceMap: true` in tsconfig — source maps are generated and served with dist |

---

### 16.5 Static File Serving Architecture

#### Backend: Uploaded Files
```typescript
// main.ts L68-70
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
```

Uploaded compliance evidence files are served directly by the NestJS process at `/uploads/<filename>`. This means:
- No authentication check on file access — any URL with a valid filename is publicly accessible
- NestJS process memory is used to serve static file content
- Files are stored on local disk (lost on container restart)

#### Frontend: HTML/CSS/JS
```markdown
README.md (line 181):
"Serve the front-end directory using any static web server
(such as VS Code Live Server or npx serve front-end)."
```

There is no configured static hosting solution. The frontend is served ad-hoc by whatever the developer has available.

---

### 16.6 Swagger / API Documentation

```typescript
// main.ts L129-132
fs.writeFileSync(
  path.join(docsFolderPath, 'swagger.json'),
  JSON.stringify(document, null, 2),
);
```

Swagger UI is available at `/api/docs` at runtime. Additionally, the full `swagger.json` is written to `back-end/docs/swagger.json` on every server startup. This means:
- ⚠️ The `docs/swagger.json` file may be committed to the repo, exposing the full API surface publicly
- ✅ Swagger UI is generated from actual decorators — it's accurate to the current code
- ⚠️ Swagger title says `OfficeSync API` — the project name is OptiFlow (stale copy-paste from another project)

---

### 16.7 TypeScript Build Configuration

| Compiler Option | Value | Note |
|----------------|-------|------|
| `target` | `ES2023` | Modern JS target; requires Node 18+ |
| `module` | `nodenext` | ESM-style module resolution |
| `moduleResolution` | `nodenext` | Required for `import` from package exports |
| `outDir` | `./dist` | Compiled output directory |
| `sourceMap` | `true` | Source maps generated — should be disabled in prod |
| `removeComments` | `true` | Comments stripped from output |
| `noImplicitAny` | `false` | ⚠️ TypeScript's primary safety check is disabled |
| `strictNullChecks` | `true` | Null/undefined checking is on |
| `strictBindCallApply` | `false` | Bind/call/apply type checking disabled |
| `incremental` | `true` | Caches build info for faster rebuilds |
| `skipLibCheck` | `true` | Skips type checking of node_modules |

> ⚠️ **`noImplicitAny: false`** is a significant TypeScript safety gap. This allows variables and parameters to implicitly have type `any`, which removes TypeScript's ability to catch many type errors. Combined with the heavy use of `as any` casts seen in Phase 8, the TypeScript setup provides weaker-than-expected safety guarantees.

---

### 16.8 Node.js Runtime Requirements

| Requirement | Value | Enforced? |
|------------|-------|----------|
| Node.js minimum | v18+ (ES2023 target) | ❌ Not enforced (no `engines` in package.json) |
| NPM version | Any | ❌ Not specified |
| OS | Any (Windows/Linux/Mac) | Confirmed - path.join used correctly |
| Port | 5500 (default) | Configurable via `PORT` env var |

---

### 16.9 Deployment Blockers (Summary)

Building on Phase 12's list, the complete set of blockers before the app can be deployed:

| Priority | Blocker | Effort |
|----------|---------|--------|
| 🔴 P1 | 28 hardcoded `localhost:5500` URLs in frontend | High — touch 12+ files |
| 🔴 P1 | No Dockerfile or container strategy | Medium |
| 🔴 P1 | `JWT_SECRET` missing from `.env` | Low |
| 🔴 P1 | `NODE_ENV=development` in all environments | Low |
| 🔴 P1 | No process manager (no restart on crash) | Medium |
| ⚠️ P2 | No health check endpoint for load balancers | Low |
| ⚠️ P2 | File uploads on local disk (lost on restart) | High |
| ⚠️ P2 | No CI/CD pipeline to automate build + test | Medium |
| ⚠️ P2 | Frontend has no hosting plan | Medium |
| ⚠️ P2 | Swagger title wrong (`OfficeSync` not `OptiFlow`) | Trivial |
| ⚠️ P2 | Source maps generated in production build | Low |
| ⚠️ P3 | Uploaded files served without auth check | Medium |
| ⚠️ P3 | No graceful shutdown handler | Low |
| ⚠️ P3 | `noImplicitAny: false` in TypeScript | Low |

---

### 16.10 Deployment Summary

| Aspect | Status | Detail |
|--------|--------|--------|
| Containerization | ❌ None | No Dockerfile or docker-compose |
| CI/CD | ❌ None | No automated pipeline |
| Process management | ❌ None | No PM2 or systemd |
| Health check | ❌ None | No /health endpoint |
| Frontend hosting | ❌ Unplanned | "Use VS Code Live Server" is the only instruction |
| Static file security | ❌ Missing | Uploads publicly accessible without auth |
| Production readiness | ❌ Not ready | Application is in developer-only state |

---

## 17. Current Flaws & Bugs

---

### 17.1 Executive Summary & Defect Overview

A comprehensive code-level audit across the OptiFlow codebase identified **24 distinct flaws and bugs**, ranging from critical security vulnerabilities that permit total authentication bypass to logic errors, state leakage, and client-side DOM XSS vectors.

```
       CRITICAL (P0) ─── 4 Flaws  (Auth bypass, unauthenticated uploads, default user fallback)
           HIGH (P1) ─── 7 Flaws  (Multi-tenant leaks, SLA duplicates, soft delete omissions)
         MEDIUM (P2) ─── 8 Flaws  (Frontend DOM XSS, dead code, port mismatch, preset leakage)
            LOW (P3) ─── 5 Flaws  (TypeScript strictness, branding drift, generated file churn)
```

---

### 17.2 Critical Severity Flaws (P0 — Security & System Integrity)

#### BUG-01: Total Authentication & RBAC Bypass via Client-Supplied Headers
* **Location**: [`back-end/src/core/guards/roles.guard.ts:72`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/guards/roles.guard.ts#L72), [`back-end/src/core/middleware/tenant.middleware.ts:84-88`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/middleware/tenant.middleware.ts#L84-L88)
* **Root Cause**: `RolesGuard` verifies permissions against three surfaces: `user.roleLabel`, `user.role`, and `req.headers['x-user-role']`. Because it evaluates `(headerRole && normalised.includes(normalise(headerRole)))` with an `OR` condition, any HTTP client can bypass RBAC completely simply by passing `x-user-role: Superuser` or `x-user-role: Platform Admin` in the request headers, without providing any JWT token or valid session credentials.
* **Impact**: Total system compromise. Any unauthenticated caller can invoke administrative endpoints (e.g., delete users, reassign roles, alter compliance rules, access all company data).

```typescript
// RolesGuard (back-end/src/core/guards/roles.guard.ts)
const allowed =
  (userRoleLabel && normalised.includes(normalise(userRoleLabel))) ||
  (userRole && normalised.includes(normalise(userRole))) ||
  (headerRole && normalised.includes(normalise(headerRole))); // 🔴 VULNERABILITY: Raw header trusted
```

#### BUG-02: TenantMiddleware Defaults Unauthenticated Callers to First Database User
* **Location**: [`back-end/src/core/middleware/tenant.middleware.ts:118-124`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/middleware/tenant.middleware.ts#L118-L124)
* **Root Cause**: When a request arrives without `x-user-id`, `x-user-email`, or `x-company-id`, `TenantMiddleware` executes a "last resort" fallback query: `this.prisma.user.findFirst(...)`. It automatically binds `req.user` to the first user found in the database (usually the seeded Superuser or CEO of Tenant 1).
* **Impact**: Unauthenticated requests automatically inherit valid user context and company context, completely breaking the multi-tenant isolation and authentication perimeter.

```typescript
// TenantMiddleware (back-end/src/core/middleware/tenant.middleware.ts)
// Last resort: first seeded user in the DB
if (!user) {
  user = await this.prisma.user.findFirst({
    include: {
      roleAssignments: { include: { role: true }, take: 5 },
    },
  });
}
```

#### BUG-03: Unprotected Public Static Serving of Sensitive Compliance Evidence
* **Location**: [`back-end/src/main.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/main.ts), [`back-end/src/app.module.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/app.module.ts)
* **Root Cause**: `ServeStaticModule` is mounted to serve `/uploads` directly from the local disk without passing through authentication guards or tenant verification interceptors.
* **Impact**: All uploaded files (e.g., audit evidence, confidential HR documents, compliance attachments) are publicly accessible via simple direct URL navigation or directory enumeration by any unauthorized party.

#### BUG-04: Platform Admin Header Spoofing Grants Global Cross-Tenant Scope
* **Location**: [`back-end/src/core/middleware/tenant.middleware.ts:66-82`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/middleware/tenant.middleware.ts#L66-L82)
* **Root Cause**: If `req.headers['x-platform-admin-id']` or `req.headers['x-user-role'] === 'platform_admin'` is present, the middleware immediately assigns `req.user` with `companyId: 'all'` and role `Platform Admin` without cryptographic verification of identity.
* **Impact**: Attackers can spoof platform administrator privileges and access cross-company resources, subscription management, and support impersonation tokens.

---

### 17.3 High Severity Flaws (P1 — Multi-Tenancy & Logic Bugs)

#### BUG-05: Missing Tenant Isolation in Query Filters (Cross-Tenant Data Leaks)
* **Location**: Multiple backend service methods, including:
  * [`back-end/src/modules/tasks/tasks.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/tasks/tasks.service.ts)
  * [`back-end/src/modules/users/users.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/users/users.service.ts)
  * [`back-end/src/modules/process-templates/process-templates.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/process-templates/process-templates.service.ts)
* **Root Cause**: Several Prisma queries filter only by primary key (`where: { id }`) rather than compound tenant conditions (`where: { id, companyId }`), relying on client honesty.
* **Impact**: An authenticated user in Tenant A can fetch, modify, or delete resources belonging to Tenant B by guessing or enumerating entity IDs.

#### BUG-06: SLA Escalation Job Lacks Idempotency (Duplicate Escalation Flooding)
* **Location**: [`back-end/src/modules/escalations/escalations.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/escalations/escalations.service.ts)
* **Root Cause**: The recurring SLA checker evaluates overdue tasks on a cron schedule. However, it lacks a status flag check or unique constraint to prevent creating duplicate escalation tickets for the same overdue task if an active escalation already exists.
* **Impact**: Overdue tasks trigger a new escalation and notification flood every cron execution cycle, polluting audit logs and notification streams.

#### BUG-07: Inconsistent Soft Delete Handling in Prisma Queries
* **Location**: [`back-end/src/modules/tasks/tasks.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/tasks/tasks.service.ts), [`back-end/src/modules/projects/projects.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/projects/projects.service.ts)
* **Root Cause**: Models have `deletedAt` fields, but there is no global Prisma soft-delete client extension or middleware. Several individual service query handlers omit `{ deletedAt: null }` from their `where` clauses.
* **Impact**: Soft-deleted tasks, projects, and users continue to appear in dashboard aggregates, reports, and search results.

#### BUG-08: Missing Foreign Key Database Indexes Causing Table Scans
* **Location**: [`back-end/prisma/schema.prisma`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/prisma/schema.prisma)
* **Root Cause**: Foreign key fields on high-volume tables (`AuditLog.performedById`, `AuditLog.companyId`, `Notification.userId`, `Task.projectId`) lack explicit `@@index` annotations in the Prisma schema.
* **Impact**: As data grows, dashboard loading and state synchronization trigger full table scans, resulting in severe database latency and connection pool exhaustion.

#### BUG-09: Unvalidated Process State Machine Transitions
* **Location**: [`back-end/src/modules/process-instances/process-instances.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/process-instances/process-instances.service.ts)
* **Root Cause**: Status transitions (e.g., `Draft` -> `In Progress` -> `Under Review` -> `Completed` -> `Rejected`) do not validate allowed prior states before applying status updates.
* **Impact**: Users can illegally jump states (e.g. from `Draft` directly to `Completed` or from `Rejected` back to `Approved`), bypassing mandatory stage approvals and compliance gates.

#### BUG-10: Insecure JWT Secret Defaults in Configuration
* **Location**: [`back-end/src/modules/auth/auth.module.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/auth/auth.module.ts), [`back-end/src/core/config/configuration.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/config/configuration.ts)
* **Root Cause**: Fallback string literals (e.g., `'secretKey'`, `'optiflow-default-secret'`) are used when `JWT_SECRET` environment variables are undefined.
* **Impact**: Attackers can forge valid JWT tokens offline using well-known default keys if deployed without explicit environment validation.

#### BUG-11: Destructive E2E Tests Targeting Live Production Neon Database
* **Location**: [`back-end/test/rbac-routing.e2e-spec.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/test/rbac-routing.e2e-spec.ts), [`back-end/test/error-handling.e2e-spec.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/test/error-handling.e2e-spec.ts)
* **Root Cause**: The test suite does not spin up an isolated test database (e.g. SQLite, Dockerized Postgres, or test schema). It directly executes against the live Neon cloud database referenced in `.env`.
* **Impact**: Running `npm run test:e2e` mutates, deletes, or corrupts production/staging seed records.

---

### 17.4 Medium Severity Flaws (P2 — Frontend & State Management)

#### BUG-12: Widespread DOM XSS via Unsanitized `innerHTML`
* **Location**: [`front-end/js/pages/pm/tasks.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/pm/tasks.js), [`front-end/js/pages/hr/dashboard.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/hr/dashboard.js), [`front-end/admin/executive/executive_dashboard.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/admin/executive/executive_dashboard.js), [`front-end/js/utils/helpers.js:6`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L6)
* **Root Cause**: User-submitted strings (task titles, project descriptions, escalation notes, comments) are directly interpolated into template literals and assigned to `element.innerHTML` without HTML entity escaping or `DOMPurify` sanitization.
* **Impact**: Stored Cross-Site Scripting (XSS). An attacker can inject malicious JavaScript into task titles that executes in the context of any manager or admin viewing the dashboard.

#### BUG-13: Unreachable Dead Code in Frontend State Caching Layer
* **Location**: [`front-end/js/utils/helpers.js:714-754`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L714-L754)
* **Root Cause**: In `window.Helpers.getState()`, the unified application state object is returned on line 714, leaving lines 744–754 (`sessionStorage.setItem(...)` and cache assignment) completely unreachable.
* **Impact**: Client-side state caching never persists to `sessionStorage` as intended, causing redundant multi-endpoint network requests on every page transition.

```javascript
// front-end/js/utils/helpers.js (Lines 714 & 744)
    return {
      users,
      userRoles,
      ...
    };

    // 🔴 UNREACHABLE CODE:
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(resObj));
    } ...
```

#### BUG-14: Inconsistent Backend Port Configurations Across Frontend Scripts
* **Location**: [`front-end/js/utils/helpers.js:134`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L134), [`front-end/js/pages/auth-flows.js:76`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/auth-flows.js#L76), [`front-end/platform-admin/plans.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/platform-admin/plans.html)
* **Root Cause**: Some scripts configure the API URL as `http://localhost:5500`, others default to `http://localhost:3000`, while the NestJS backend default port in `main.ts` is `5500`.
* **Impact**: If the backend runs on port 3000 (standard NestJS default), frontend pages hardcoded to port 5500 fail with network connection errors.

#### BUG-15: Hardcoded Fallback Credentials and Test Presets in Production JS
* **Location**: [`front-end/js/utils/helpers.js:119-126`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L119-L126), [`front-end/js/pages/auth-flows.js:78`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/auth-flows.js#L78)
* **Root Cause**: `TEST_ACTOR_PRESETS` and fallback header injections (`x-user-role: superuser`, `x-company-id: comp-1`) are hardcoded in client-side production JavaScript assets.
* **Impact**: Sensitive user emails and role configurations are exposed in client bundles; default fallback requests masquerade as `superuser`.

#### BUG-16: Missing Global Notification Clearing on Tenant Logout
* **Location**: [`front-end/js/utils/helpers.js:42-55`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L42-L55)
* **Root Cause**: `logout()` clears `localStorage` and `sessionStorage`, but custom notification stores stored in `localStorage["system_notifications"]` or other keys can persist across different user sessions on shared workstations.
* **Impact**: Subsequent users on the same machine may momentarily see previous user notification data.

#### BUG-17: Brittle Case-Insensitive Role Label String Matching
* **Location**: [`front-end/js/utils/helpers.js:396-426`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L396-L426), [`back-end/src/core/middleware/tenant.middleware.ts:140-170`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/middleware/tenant.middleware.ts#L140-L170)
* **Root Cause**: Roles are resolved using substring and keyword heuristic checks (`l.includes('owner') || l.includes('ceo') || l.includes('superuser')`) instead of immutable role IDs or system role enum constants.
* **Impact**: Custom or newly added roles with ambiguous titles (e.g. "Process Owner" matching both "process" and "owner") resolve to incorrect role privileges unpredictably.

#### BUG-18: Global Exception Filter Leaks Internal Stack Traces
* **Location**: [`back-end/src/core/filters/http-exception.filter.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/filters/http-exception.filter.ts)
* **Root Cause**: Database error details and internal server exception messages are returned in the JSON response body regardless of `NODE_ENV`.
* **Impact**: Internal database schema details, query structures, and stack traces are exposed to clients upon uncaught exceptions.

#### BUG-19: Unhandled Promise Rejections on Network Disconnection
* **Location**: [`front-end/js/utils/helpers.js:208-211`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js#L208-L211)
* **Root Cause**: Unhandled fetch rejections bubble up when the backend is offline, resulting in stuck UI loading spinners without user-friendly offline alerts.
* **Impact**: Degraded UX; users are left with unresponsive interfaces without error explanations.

---

### 17.5 Low Severity Flaws (P3 — Build, Config & Hygiene)

#### BUG-20: TypeScript Strictness Disabled (`noImplicitAny: false`)
* **Location**: [`back-end/tsconfig.json:10`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/tsconfig.json#L10)
* **Root Cause**: `noImplicitAny` is set to `false`, allowing un-typed variables throughout the backend codebase.
* **Impact**: Type errors and undefined object property accesses are masked during build time.

#### BUG-21: Outdated Swagger API Branding ("OfficeSync API")
* **Location**: [`back-end/src/main.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/main.ts), [`back-end/docs/swagger.json`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/docs/swagger.json)
* **Root Cause**: The Swagger document builder retains title `"OfficeSync API"` inherited from an earlier project template.
* **Impact**: Inconsistent branding and confusion across API documentation.

#### BUG-22: `swagger.json` Auto-Generated to Disk on Server Bootstrap
* **Location**: [`back-end/src/main.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/main.ts)
* **Root Cause**: On every application startup, `fs.writeFileSync` dumps `swagger.json` into the `docs/` folder.
* **Impact**: Modifies the local git working tree automatically on startup and risks committing sensitive or changing API definitions unexpectedly.

#### BUG-23: Leftover Python Controller Patching Script Committed to Repo
* **Location**: [`back-end/update_controllers.py`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/update_controllers.py)
* **Root Cause**: A temporary Python automation script used to regex-insert Swagger decorators was left committed in the backend source folder.
* **Impact**: Codebase clutter and maintenance confusion.

#### BUG-24: Frontend Missing Test Suite and Build Pipeline
* **Location**: `front-end/`
* **Root Cause**: The frontend is composed of raw static HTML, CSS, and Vanilla JS files without bundling, minification, linting, or automated test coverage.
* **Impact**: Regressions in client-side logic cannot be caught automatically in CI.

---

### 17.6 Comprehensive Bug & Flaw Inventory

| ID | Title | Component | Severity | Location | Impact |
|---|---|---|---|---|---|
| **BUG-01** | Header-based Auth & RBAC Bypass | Backend Auth | 🔴 P0 | `roles.guard.ts:72` | Total system compromise via spoofed headers |
| **BUG-02** | Default User Fallback in Tenant Middleware | Backend Multi-Tenancy | 🔴 P0 | `tenant.middleware.ts:118` | Unauthenticated requests get DB user context |
| **BUG-03** | Public Static Serving of `/uploads` | Backend Core | 🔴 P0 | `main.ts`, `app.module.ts` | Confidential compliance evidence publicly accessible |
| **BUG-04** | Spoofable Platform Admin Role Header | Backend RBAC | 🔴 P0 | `tenant.middleware.ts:68` | Cross-tenant superuser access via single header |
| **BUG-05** | Missing `companyId` in Entity Queries | Backend Services | 🟠 P1 | `tasks.service.ts`, `users.service.ts` | Cross-tenant data tampering |
| **BUG-06** | Non-Idempotent SLA Escalation Cron | Backend Jobs | 🟠 P1 | `escalations.service.ts` | Duplicate escalation flooding |
| **BUG-07** | Inconsistent Soft-Delete Query Filtering | Backend Services | 🟠 P1 | `tasks.service.ts`, `projects.service.ts` | Soft-deleted records appear in active views |
| **BUG-08** | Missing Foreign Key Database Indexes | Database Schema | 🟠 P1 | `schema.prisma` | Full table scans & database performance degradation |
| **BUG-09** | Unvalidated Workflow State Transitions | Backend Process Engine | 🟠 P1 | `process-instances.service.ts` | Process compliance and review gate bypass |
| **BUG-10** | Hardcoded Fallback JWT Secrets | Backend Config | 🟠 P1 | `auth.module.ts`, `configuration.ts` | Offline token forgery risk |
| **BUG-11** | E2E Tests Mutate Live Neon Cloud Database | Test Infrastructure | 🟠 P1 | `test/*.e2e-spec.ts` | Test runs corrupt live data |
| **BUG-12** | DOM XSS via Unescaped `innerHTML` | Frontend UI | 🟡 P2 | `tasks.js`, `dashboard.js`, `helpers.js` | Stored XSS vulnerability in all dashboards |
| **BUG-13** | Unreachable State Caching Code | Frontend State | 🟡 P2 | `helpers.js:744-754` | State caching broken, excessive API calls |
| **BUG-14** | Hardcoded Port Discrepancies (3000 vs 5500) | Frontend Network | 🟡 P2 | `helpers.js:134`, `auth-flows.js:76` | Connection failures when port changes |
| **BUG-15** | Hardcoded Test Actor Presets in Client JS | Frontend Security | 🟡 P2 | `helpers.js:119-126` | Test credentials & emails exposed in production |
| **BUG-16** | Residual Notification State on Logout | Frontend Auth | 🟡 P2 | `helpers.js:42-55` | Notification leakage on shared workstations |
| **BUG-17** | Heuristic String Matching for Roles | Backend / Frontend | 🟡 P2 | `helpers.js:396`, `tenant.middleware.ts` | Role assignment errors for ambiguous titles |
| **BUG-18** | Internal Stack Trace Leakage in API Filters | Backend Core | 🟡 P2 | `http-exception.filter.ts` | Information disclosure in error responses |
| **BUG-19** | Unhandled Promise Rejections on Disconnect | Frontend UI | 🟡 P2 | `helpers.js:208-211` | Infinite loading spinners on network drops |
| **BUG-20** | `noImplicitAny: false` in Compiler Config | Backend Build | ⚪ P3 | `tsconfig.json:10` | Type errors suppressed during compilation |
| **BUG-21** | Stale Branding ("OfficeSync API") in Swagger | Backend Docs | ⚪ P3 | `main.ts`, `swagger.json` | Documentation branding drift |
| **BUG-22** | File System Write on Server Bootstrap | Backend Core | ⚪ P3 | `main.ts` | `swagger.json` git working tree pollution |
| **BUG-23** | Leftover Python Patch Script | Repository Cleanliness | ⚪ P3 | `update_controllers.py` | Maintenance noise |
| **BUG-24** | Zero Automated Frontend Testing | Frontend QA | ⚪ P3 | `front-end/` | Client-side regressions undetectable in CI |

---

## 18. Missing Functionality

---

### 18.1 Executive Gap Summary

While OptiFlow has implemented core CRUD models and extensive UI dashboard mockups for multi-tenant organizational workflow management, a significant number of **production-critical capabilities** remain unbuilt, stubbed out, or purely simulated in client-side JavaScript.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FUNCTIONALITY READINESS GAP                           │
├───────────────────────┬───────────────────────┬─────────────────────────────────┤
│ Core Domain           │ UI Presentation       │ Backend Engine Status           │
├───────────────────────┼───────────────────────┼─────────────────────────────────┤
│ Password Recovery     │ ✅ Complete Pages     │ ❌ 0% (Client JS Timeout Mock)  │
│ Workflow Engine       │ ✅ Visual Step Cards  │ ⚠️ 30% (Linear Transitions Only)│
│ Compliance Automation │ ✅ Rule & Log UI      │ ⚠️ 20% (Manual Violations Only) │
│ Notifications         │ ✅ Bell Dropdown UI   │ ⚠️ 15% (No Real-Time/Email Push)│
│ Billing & Payments    │ ✅ Plan Selection UI  │ ❌ 0% (No Gateway / Webhooks)   │
│ Document Storage      │ ✅ Upload Modals      │ ⚠️ 25% (Local Disk Only, No S3) │
│ Analytics & Exports   │ ✅ Dashboard Charts   │ ❌ 0% (No CSV/PDF Generators)   │
│ Enterprise Operations │ ⚠️ Partial Admin UI   │ ❌ 0% (No SSO, 2FA, CSV Import) │
└───────────────────────┴───────────────────────┴─────────────────────────────────┘
```

---

### 18.2 Authentication, Identity & Security Gaps

#### 1. Password Reset & Recovery Backend Flow
* **Current State**: `forgot-password.html` and `reset-password.html` present polished UI forms, but `auth-flows.js` handles form submissions with client-side `setTimeout` mocks that redirect after showing fake success messages.
* **Missing Backend Logic**:
  * `POST /auth/forgot-password` endpoint to generate cryptographically secure, time-limited password reset tokens.
  * Token expiration and single-use invalidation table/cache in Prisma / Redis.
  * `POST /auth/reset-password` endpoint to validate tokens and update password hashes.
  * Transactional email delivery service to send reset links.

#### 2. Email Verification & Account Activation
* **Current State**: Newly registered users and company owners are immediately set to active without verifying email ownership.
* **Missing Backend Logic**:
  * Verification token generation upon registration (`/auth/register-company` or `/users`).
  * `GET /auth/verify-email?token=...` endpoint.
  * State gating: Restricting unverified users from executing administrative actions.

#### 3. Refresh Token Rotation & Session Revocation
* **Current State**: The backend issues single JWT tokens or relies on raw request headers. There is no refresh token mechanism.
* **Missing Backend Logic**:
  * Dual-token architecture (`accessToken` short-lived ~15m, `refreshToken` long-lived ~7d stored in httpOnly cookie).
  * `POST /auth/refresh` endpoint with refresh token rotation.
  * `POST /auth/logout` endpoint that blacklists or revokes active refresh tokens.

#### 4. Multi-Factor Authentication (MFA / 2FA) & Enterprise SSO
* **Current State**: No MFA or third-party authentication mechanisms exist.
* **Missing Backend Logic**:
  * TOTP (Time-based One-Time Password) setup, QR code generation, and verification (`speakeasy` / `otplib`).
  * Backup recovery codes generation.
  * SAML 2.0 / OpenID Connect (OIDC) integration for Okta, Azure AD, and Google Workspace SSO.

---

### 18.3 Workflow & Process Automation Engine Gaps

#### 1. Non-Linear & Conditional Process Graph Execution
* **Current State**: The process engine (`process-instances.service.ts`) only supports strictly sequential, linear steps (`step[0] -> step[1] -> step[2]`).
* **Missing Backend Logic**:
  * Conditional branching (e.g. *If expense > $5,000, require VP approval; else route to Finance*).
  * Fork-join / Parallel execution (e.g. *Trigger HR onboarding AND IT asset provisioning simultaneously*).
  * Rejection loops and rework routing (e.g. *Send back to Step 1 on rejection with reviewer feedback*).

#### 2. Multi-Approver & Quorum Approval Policies
* **Current State**: A process step is assigned to a single `assignedToId`.
* **Missing Backend Logic**:
  * Group / Role-based assignments (e.g. *Any Compliance Officer can approve*).
  * Multi-signature / Quorum requirements (e.g. *Requires 2 out of 3 designated managers to approve*).

#### 3. Automated Compliance Violation Detection Engine
* **Current State**: `ComplianceRule` records can be created, and `ComplianceViolation` records can be manually recorded. However, there is no background watcher evaluating operational activity against rules.
* **Missing Backend Logic**:
  * Event-driven compliance evaluator triggered on task updates, process transitions, and overdue SLA events.
  * Automated policy checks (e.g. *Flag violation if a task marked completed lacks required evidence attachment*).
  * Scheduled compliance sweep cron jobs.

#### 4. Dynamic SLA Pausing on Blocker Escalations
* **Current State**: SLA calculation uses fixed `dueDate`. If a task is escalated as blocked, the clock continues running.
* **Missing Backend Logic**:
  * SLA clock pause when an escalation with `blockerType: 'EXTERNAL_DEPENDENCY'` or `status: 'Open'` is active.
  * Automatic adjustment of SLA targets upon escalation resolution.

---

### 18.4 Document Storage, Evidence & File Management Gaps

#### 1. Secure Pre-Signed Download URLs & Access Authorization
* **Current State**: Files are uploaded to local `uploads/` folder and served statically over HTTP without access checks.
* **Missing Backend Logic**:
  * Secured download endpoint (`GET /evidence/:id/download`) that verifies the caller's tenant and role.
  * Pre-signed URL generation for cloud object storage.

#### 2. Cloud Object Storage Integration
* **Current State**: File storage is strictly local filesystem (`multer.diskStorage`), which is ephemeral in containerized cloud environments (e.g., AWS ECS, Google Cloud Run, Fly.io, Heroku).
* **Missing Backend Logic**:
  * Storage abstraction adapter (`StorageService`) supporting Amazon S3, Google Cloud Storage, or Azure Blob Storage.

#### 3. File Deletion & Storage Lifecycle Management
* **Current State**: Deleting an `Evidence` database record does not remove the underlying file on disk.
* **Missing Backend Logic**:
  * File cleanup hook on entity deletion.
  * Storage quota tracking per company based on their subscription plan.

---

### 18.5 Billing, Subscription & Commercial Gaps

#### 1. Payment Gateway Integration & Webhooks
* **Current State**: Plans and Subscriptions exist in Prisma (`Starter`, `Growth`, `Pro Enterprise`), but are manually toggled or seeded.
* **Missing Backend Logic**:
  * Stripe / Razorpay / LemonSqueezy Checkout Session creation (`POST /subscriptions/checkout`).
  * Webhook receiver (`POST /subscriptions/webhook`) to handle `invoice.paid`, `customer.subscription.updated`, and `customer.subscription.deleted`.
  * Dunning management and automatic account suspension on failed renewals.

#### 2. Plan Feature Gating & Usage Metering
* **Current State**: There are no enforcement checks against subscription limits.
* **Missing Backend Logic**:
  * Guards/interceptors checking max users, max active projects, and storage limits before record creation.
  * Platform admin billing overview showing MRR, churn rate, and active subscriber metrics.

#### 3. Invoicing & PDF Receipts
* **Current State**: No billing documents exist.
* **Missing Backend Logic**:
  * Invoice generation and PDF download for tenant owners.

---

### 18.6 Communication & Real-Time Collaboration Gaps

#### 1. Real-Time WebSockets / Server-Sent Events (SSE)
* **Current State**: The frontend relies on manual page reloads or full `getState()` polling intervals.
* **Missing Backend Logic**:
  * NestJS WebSocket Gateway (`@WebSocketGateway()`) or SSE endpoint (`GET /notifications/stream`).
  * Real-time push events for task assignments, approvals, blocker escalations, and mentions.

#### 2. Transactional Email & SMS Dispatch
* **Current State**: Notifications exist only as rows in the `Notification` database table.
* **Missing Backend Logic**:
  * Email transport module (Nodemailer, SendGrid, Resend, or AWS SES).
  * HTML email templates for task assignments, escalations, digest reports, and password resets.

#### 3. Task Comments & Activity Timeline
* **Current State**: Tasks have descriptions and status history in `AuditLog`, but no dedicated commenting system.
* **Missing Backend Logic**:
  * `TaskComment` model and REST endpoints (`POST /tasks/:id/comments`, `GET /tasks/:id/comments`).
  * `@mention` parsing and notification dispatching.

---

### 18.7 System Health, Operations & Enterprise Tooling Gaps

#### 1. Health Checks & Readiness Probes
* **Current State**: No `/health` or `/live` endpoint exists.
* **Missing Backend Logic**:
  * `@nestjs/terminus` health check module verifying database connectivity, storage disk space, and memory thresholds.

#### 2. Data Export & Regulatory Reporting
* **Current State**: Dashboards render UI tables, but data cannot be exported.
* **Missing Backend Logic**:
  * CSV and Excel data exporters for audit logs, compliance violation records, and task completion metrics.
  * Formatted PDF Compliance Audit Report generator for external auditors (e.g. SOC2, ISO 27001).

#### 3. Bulk Data Import (CSV / Excel)
* **Current State**: Users and departments must be created one-by-one via individual form submissions.
* **Missing Backend Logic**:
  * `POST /users/bulk-import` with CSV parsing, validation, and batch database insertion.

---

### 18.8 Missing Functionality Inventory Matrix

| Domain | Feature / Capability | Frontend UI | Backend API | Backend Engine | Priority |
|---|---|---|---|---|---|
| **Auth** | Password Reset & Recovery | ✅ Exists (Mock) | ❌ Missing | ❌ Missing | 🔴 P0 |
| **Auth** | Email Verification | ❌ Missing | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Auth** | Refresh Token Rotation | ❌ Missing | ❌ Missing | ❌ Missing | 🔴 P0 |
| **Auth** | 2FA / MFA (TOTP) | ❌ Missing | ❌ Missing | ❌ Missing | 🟡 P2 |
| **Auth** | Enterprise SSO (SAML/OIDC) | ❌ Missing | ❌ Missing | ❌ Missing | 🟡 P2 |
| **Process** | Conditional Workflow Branching | ⚠️ Visual Only | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Process** | Parallel / Quorum Approvals | ❌ Missing | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Compliance** | Automated Violation Detection Engine | ⚠️ UI Exists | ⚠️ Partial CRUD | ❌ Missing | 🟠 P1 |
| **Compliance** | SLA Clock Pausing on Blockers | ❌ Missing | ❌ Missing | ❌ Missing | 🟡 P2 |
| **Storage** | Secure Pre-Signed Download URLs | ❌ Missing | ❌ Missing | ❌ Missing | 🔴 P0 |
| **Storage** | Cloud S3 / GCS Storage Adapter | ❌ Missing | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Storage** | File Deletion & Disk Cleanup | ❌ Missing | ❌ Missing | ❌ Missing | 🟡 P2 |
| **Billing** | Payment Gateway (Stripe/Razorpay) | ⚠️ UI Plans Only | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Billing** | Plan Quota & Seat Enforcement | ❌ Missing | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Real-Time** | WebSockets / SSE Live Push | ⚠️ Polling Only | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Email** | Transactional Email Service | ❌ Missing | ❌ Missing | ❌ Missing | 🟠 P1 |
| **Collaboration**| Task Comments & @Mentions | ❌ Missing | ❌ Missing | ❌ Missing | 🟡 P2 |
| **Reporting** | PDF / CSV Audit Report Export | ❌ Missing | ❌ Missing | ❌ Missing | 🟡 P2 |
| **Operations** | Bulk User CSV Import | ❌ Missing | ❌ Missing | ❌ Missing | 🟡 P2 |
| **Operations** | `/health` Liveness & Readiness Check | ❌ Missing | ❌ Missing | ❌ Missing | 🟠 P1 |

---

## 19. Technical Risks

---

### 19.1 Technical Risk Assessment Matrix

The technical risks identified in OptiFlow are categorized across **5 critical risk dimensions**, evaluated on a standard **Likelihood vs. Impact** scale (1–5) to establish an overall **Risk Priority Score (1–25)**.

```
       5 │                    [R-01]  [R-02]
       4 │            [R-05]  [R-03]  [R-04]
IMPACT 3 │    [R-08]  [R-06]  [R-07]
       2 │    [R-10]  [R-09]
       1 │
         └──────────────────────────────────
           1      2      3       4       5
                     LIKELIHOOD
```

| Risk ID | Risk Title | Category | Likelihood (1-5) | Impact (1-5) | Score (1-25) | Severity |
|---|---|---|:---:|:---:|:---:|:---:|
| **R-01** | Total Security Breach via Spoofed Auth Headers | Security & Auth | 5 | 5 | **25** | 🔴 Critical |
| **R-02** | Confidential Document Leak via Public `/uploads` | Security & Compliance | 5 | 5 | **25** | 🔴 Critical |
| **R-03** | Cross-Tenant Data Tampering & ID Enumeration | Multi-Tenancy | 4 | 4 | **16** | 🔴 Critical |
| **R-04** | Ephemeral File Loss in Cloud Deployments | Storage & Infrastructure| 5 | 4 | **20** | 🔴 Critical |
| **R-05** | Production Database Corruption via Live E2E Tests | Data Integrity & CI | 3 | 4 | **12** | 🟠 High |
| **R-06** | Severe Database Latency via Missing FK Indexes | Scalability & DB | 3 | 3 | **9** | 🟠 High |
| **R-07** | Connection Pool Exhaustion from 19-Endpoint Polling | Scalability & Network | 4 | 3 | **12** | 🟠 High |
| **R-08** | Stored DOM XSS Exploitation on Dashboards | Frontend Security | 2 | 3 | **6** | 🟡 Medium |
| **R-09** | Process Compliance Bypass via Invalid State Transitions| Business Logic | 3 | 2 | **6** | 🟡 Medium |
| **R-10** | Massive Codebase Regression from Vanilla JS Architecture| Maintainability | 2 | 2 | **4** | 🟡 Medium |

---

### 19.2 Detailed Risk Breakdown by Domain

#### 1. Security, Authorization & Compliance Exposure

##### 🔴 RISK R-01: Header-Based RBAC Spoofing (Score: 25 / 25)
* **Risk Nature**: The system trusts client-supplied `x-user-role`, `x-user-id`, and `x-platform-admin-id` headers without requiring valid cryptographic JWT verification.
* **Failure Scenario**: Any script or malicious user passing `x-user-role: Superuser` can invoke destructive endpoints (e.g. deleting company users, modifying financial plans, wiping audit logs).
* **Business Impact**: Total loss of confidentiality, integrity, and regulatory compliance (immediate disqualification for SOC2, ISO 27001, HIPAA, and GDPR).

##### 🔴 RISK R-02: Public Static File Exposure (Score: 25 / 25)
* **Risk Nature**: Compliance evidence and user attachments uploaded to `uploads/` are served statically over HTTP with zero authorization checks.
* **Failure Scenario**: Attackers can iterate sequential file IDs or scan directory trees to download confidential payroll records, signed contracts, or proprietary audit reports.
* **Business Impact**: Severe legal and financial liability due to unencrypted, unauthenticated leakage of Personally Identifiable Information (PII) and corporate records.

---

#### 2. Multi-Tenancy & Data Integrity Risks

##### 🔴 RISK R-03: Cross-Tenant Data Tampering & Bypassed Scoping (Score: 16 / 25)
* **Risk Nature**: Backend services frequently perform queries using single-key selectors (`where: { id }`) rather than compound scoped selectors (`where: { id, companyId }`).
* **Failure Scenario**: A tenant member in Company A changes task status or reads projects belonging to Company B by simply modifying the numeric/UUID path parameter in the API request.
* **Business Impact**: Tenant isolation breach leading to cross-customer data spillage and contract termination by enterprise clients.

##### 🟠 RISK R-05: Accidental Production Data Destruction via E2E Suite (Score: 12 / 25)
* **Risk Nature**: The test suite targets the live Neon cloud database referenced in the active `.env` file rather than an isolated, disposable test database or mock server.
* **Failure Scenario**: A developer or automated pipeline runs `npm run test:e2e` against the staging/production database, which executes mutation and deletion tests that purge seed users or active company records.
* **Business Impact**: Irreversible data loss and unplanned service downtime.

---

#### 3. Scalability, Performance & Reliability Bottlenecks

##### 🔴 RISK R-04: Ephemeral Storage Data Loss in Cloud Deployments (Score: 20 / 25)
* **Risk Nature**: Files are stored exclusively on local disk filesystem. In containerized environments (Docker, Kubernetes, AWS ECS, Google Cloud Run), container storage is ephemeral and not shared across horizontal replicas.
* **Failure Scenario**: When containers scale horizontally or auto-restart after a deployment, all previously uploaded compliance evidence and task attachments vanish permanently.
* **Business Impact**: Permanent data loss of critical compliance records.

##### 🟠 RISK R-07: Database Connection Pool Exhaustion from 19-Endpoint State Polling (Score: 12 / 25)
* **Risk Nature**: The frontend's `Helpers.getState()` executes 19 parallel API requests (`/users`, `/tasks`, `/projects`, `/audit-logs`, `/notifications`, etc.) on every single page load due to dead caching code.
* **Failure Scenario**: 50 concurrent users browsing the app generate ~1,000 queries every few seconds, rapidly exhausting Neon's serverless connection pool limit and causing `503 Service Unavailable` or `504 Gateway Timeout` errors.
* **Business Impact**: Complete frontend unresponsive state during normal office work hours.

##### 🟠 RISK R-06: Database Slowdown from Missing Indexes (Score: 9 / 25)
* **Risk Nature**: High-volume tables (`AuditLog`, `Task`, `Notification`) lack indexes on `companyId`, `performedById`, and `projectId`.
* **Failure Scenario**: As audit logs surpass 50,000 rows, queries on `/audit-logs` and dashboard analytics require full table scans, driving database CPU to 100%.
* **Business Impact**: Severe dashboard lag and timeouts on all reporting screens.

---

#### 4. Architectural & Maintainability Debt

##### 🟡 RISK R-08: Stored DOM XSS Vulnerabilities in Vanilla JS Dashboards (Score: 6 / 25)
* **Risk Nature**: Dashboards across HR, PM, and Executive portals directly interpolate user-controlled task titles and descriptions into `element.innerHTML` without sanitization.
* **Failure Scenario**: A malicious actor enters a task title containing `<img src=x onerror=stealSession()>` which executes in the browser of any executive or manager reviewing tasks.
* **Business Impact**: Session hijacking and unauthorized client-side actions executed under manager credentials.

##### 🟡 RISK R-10: Fragile Multi-Page Vanilla JS Maintenance Overhead (Score: 4 / 25)
* **Risk Nature**: 30+ separate HTML files share unbundled global scripts via `<script>` tags, relying on `window.Helpers`, `window.ACTIVE_PRESET_KEY`, and manual string replacement.
* **Failure Scenario**: Updating a shared component (like the sidebar, navigation, or role mapping) requires manually updating or debugging 30 individual HTML and JS files, causing regressions to slip into production unnoticed.
* **Business Impact**: Exponentially increasing engineering costs and slow feature velocity.

---

### 19.3 Risk Mitigation Priority Summary

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          IMMEDIATE ACTION PLAN (TOP 4)                           │
├───────────────┬─────────────────────────────────────────────────┬────────────────┤
│ Priority      │ Mitigation Action                               │ Target Risks   │
├───────────────┼─────────────────────────────────────────────────┼────────────────┤
│ 1. P0 Critical│ Remove raw header fallback from RolesGuard &    │ R-01, R-03     │
│               │ enforce strict JWT token validation.            │                │
│ 2. P0 Critical│ Move file storage to S3/Cloud Storage and       │ R-02, R-04     │
│               │ implement authenticated pre-signed URL access.  │                │
│ 3. P1 High    │ Fix getState() caching & consolidate API state  │ R-07, R-06     │
│               │ into a unified /bootstrap or summary endpoint.  │                │
│ 4. P1 High    │ Isolate E2E tests to SQLite/Dockerized Postgres │ R-05           │
│               │ and add missing @@index annotations in Prisma.  │                │
└───────────────┴─────────────────────────────────────────────────┴────────────────┘
```

---

## 20. Recommended Fixes

---

### 20.1 Implementation Roadmap & Priority Tracks

The recommended fixes are structured into **4 sequential, highly actionable engineering tracks** designed to systematically eliminate vulnerabilities, optimize performance, and deliver missing production capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                OPTIFLOW REMEDIATION ROADMAP                                 │
├───────────────────┬─────────────────────────┬───────────────────────────────────────────────┤
│ Track             │ Horizon                 │ Core Objectives                               │
├───────────────────┼─────────────────────────┼───────────────────────────────────────────────┤
│ Track 1 (P0)      │ Immediate (Day 1-3)     │ Fix Auth Bypass, Multi-Tenant Leaks & Uploads │
│ Track 2 (P1)      │ Short-Term (Sprint 1)   │ DB Indexes, State Aggregator & SLA Fixes      │
│ Track 3 (P2)      │ Medium-Term (Sprint 2)  │ Frontend XSS, Password Reset & S3 Storage     │
│ Track 4 (P3)      │ Long-Term (Sprint 3+)   │ Docker/CI/CD, Monitoring, Testing & Framework │
└───────────────────┴─────────────────────────┴───────────────────────────────────────────────┘
```

---

### 20.2 Track 1 (P0 Critical): Security Perimeter & Multi-Tenancy Perimeter

#### Fix 1.1: Eliminate Raw Header Trust in RolesGuard & TenantMiddleware
* **Files**: [`back-end/src/core/guards/roles.guard.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/guards/roles.guard.ts), [`back-end/src/core/middleware/tenant.middleware.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/middleware/tenant.middleware.ts)
* **Action**:
  1. Remove `(headerRole && normalised.includes(normalise(headerRole)))` from `RolesGuard`.
  2. Require all authenticated routes to pass through a cryptographic `JwtAuthGuard` that extracts the user and company context directly from verified JWT payloads.
  3. Remove the fallback in `TenantMiddleware` that automatically defaults unauthenticated callers to the first database user (`this.prisma.user.findFirst(...)`).
  4. Require cryptographic signature verification for platform admin tokens (`x-platform-admin-id`).

```diff
// RolesGuard (back-end/src/core/guards/roles.guard.ts)
- const allowed =
-   (userRoleLabel && normalised.includes(normalise(userRoleLabel))) ||
-   (userRole && normalised.includes(normalise(userRole))) ||
-   (headerRole && normalised.includes(normalise(headerRole)));
+ const userRoles = req.user?.roles || [req.user?.roleLabel, req.user?.role].filter(Boolean);
+ const allowed = userRoles.some(r => normalised.includes(normalise(r)));
```

#### Fix 1.2: Restrict Static Serving of `/uploads` & Implement Protected File Controller
* **Files**: [`back-end/src/app.module.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/app.module.ts), [`back-end/src/modules/evidence/evidence.controller.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/evidence/evidence.controller.ts)
* **Action**:
  1. Unmount `ServeStaticModule` for `/uploads` from `AppModule`.
  2. Implement a protected route `GET /evidence/:id/download` secured with `@UseGuards(JwtAuthGuard, TenantGuard)`.
  3. Verify that the requested evidence item belongs to `req.user.companyId` before streaming the file with `res.sendFile()` or generating a signed URL.

#### Fix 1.3: Enforce Tenant Scoping with Prisma Client Extensions
* **Files**: [`back-end/src/core/prisma/prisma.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/prisma/prisma.service.ts)
* **Action**:
  1. Add a Prisma Client query extension using `$extends` that automatically attaches `{ companyId: currentTenantId }` and `{ deletedAt: null }` to all `findMany`, `findFirst`, `update`, and `delete` operations on tenant-owned models (`Task`, `Project`, `User`, `Evidence`, `AuditLog`).

---

### 20.3 Track 2 (P1 High): Database Performance, State Optimization & SLA Integrity

#### Fix 2.1: Add Missing Foreign Key Indexes & Soft-Delete Annotations
* **Files**: [`back-end/prisma/schema.prisma`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/prisma/schema.prisma)
* **Action**:
  1. Add compound and single indexes on high-frequency filter columns:

```prisma
model AuditLog {
  // ...
  @@index([companyId, createdAt])
  @@index([performedById])
  @@index([entityType, entityId])
}

model Task {
  // ...
  @@index([companyId, status])
  @@index([projectId])
  @@index([assignedToId])
  @@index([dueDate])
}

model Notification {
  // ...
  @@index([userId, isRead])
}
```

#### Fix 2.2: Implement Unified `/bootstrap` State Aggregator Endpoint & Fix Frontend Caching
* **Files**: [`back-end/src/modules/users/users.controller.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/users/users.controller.ts), [`front-end/js/utils/helpers.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js)
* **Action**:
  1. Create a single `GET /bootstrap` endpoint in the backend that fetches all initial user metadata, active projects, tasks, notifications, and permissions in a single SQL transaction.
  2. Fix `helpers.js:714` dead code by storing state in `sessionStorage` *before* returning the result object, preventing 19 separate network requests on every page navigation.

#### Fix 2.3: Ensure Idempotency in SLA Escalation Background Job
* **Files**: [`back-end/src/modules/escalations/escalations.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/escalations/escalations.service.ts)
* **Action**:
  1. Update the SLA escalation query to exclude tasks that already have an active escalation (`status: 'Open'`).
  2. Wrap escalation creation in a Prisma transaction that sets an `isEscalated: true` flag on the task atomically.

#### Fix 2.4: Isolate E2E Test Suite to Dedicated Test Database
* **Files**: [`back-end/test/jest-e2e.json`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/test/jest-e2e.json), [`back-end/test/setup.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/test/setup.ts)
* **Action**:
  1. Configure `npm run test:e2e` to load `.env.test` pointing to a local Dockerized Postgres or disposable SQLite instance.
  2. Run `prisma migrate reset --force` on test setup to guarantee deterministic test execution without corrupting production/staging databases.

---

### 20.4 Track 3 (P2 Medium): Frontend Security, Password Recovery & Storage

#### Fix 3.1: DOM XSS Sanitization Layer
* **Files**: [`front-end/js/utils/helpers.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/utils/helpers.js), [`front-end/js/pages/pm/tasks.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/pm/tasks.js), [`front-end/js/pages/hr/dashboard.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/hr/dashboard.js)
* **Action**:
  1. Introduce a safe HTML rendering helper `window.Helpers.escapeHtml(str)` or include `DOMPurify`.
  2. Replace dangerous `innerHTML = ` with text content bindings or sanitized template helpers across all table rows, task cards, and modal previews.

#### Fix 3.2: Complete Password Reset & Recovery Backend
* **Files**: [`back-end/src/modules/auth/auth.controller.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/auth/auth.controller.ts), [`back-end/src/modules/auth/auth.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/modules/auth/auth.service.ts), [`front-end/js/pages/auth-flows.js`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/js/pages/auth-flows.js)
* **Action**:
  1. Implement `POST /auth/forgot-password` (generates crypto token with 1-hour TTL, saves hash to `PasswordResetToken` table, dispatches email).
  2. Implement `POST /auth/reset-password` (validates token, hashes new password with bcrypt, deletes token).
  3. Wire `forgot-password.html` and `reset-password.html` in `auth-flows.js` to call the real backend endpoints instead of `setTimeout` simulations.

#### Fix 3.3: Cloud Object Storage Adapter (S3 / GCP / Azure)
* **Files**: [`back-end/src/core/storage/storage.service.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/core/storage/storage.service.ts)
* **Action**:
  1. Implement a unified `StorageService` using AWS SDK (`@aws-sdk/client-s3`) or `@google-cloud/storage`.
  2. Upload files directly to S3 with private ACL and generate time-limited pre-signed download URLs.

---

### 20.5 Track 4 (P3 Long-Term): DevOps, CI/CD, Observability & Architecture

#### Fix 4.1: Production Dockerfile & Docker-Compose Setup
* **Files**: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
* **Action**:
  1. Create a multi-stage production Dockerfile for the NestJS backend (Node 20 Alpine, pruned production `node_modules`, dist build).
  2. Create a `docker-compose.yml` defining `postgres`, `redis`, `backend`, and an `nginx` reverse proxy serving frontend static files.

#### Fix 4.2: Health Checks, Metrics & Structured Logging
* **Files**: [`back-end/src/main.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/main.ts), [`back-end/src/app.module.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/app.module.ts)
* **Action**:
  1. Mount `@nestjs/terminus` on `GET /health` with Prisma and memory health indicators.
  2. Replace `console.log` with structured JSON logging (Winston / Pino) and integrate Sentry for uncaught exception tracking.

#### Fix 4.3: Enable TypeScript Strictness & Clean Repository Artifacts
* **Files**: [`back-end/tsconfig.json`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/tsconfig.json), [`back-end/src/main.ts`](file:///d:/Codes/FDFED/2_OptiFlow/back-end/src/main.ts)
* **Action**:
  1. Set `"noImplicitAny": true` and `"strict": true` in `tsconfig.json`.
  2. Delete legacy `update_controllers.py` script.
  3. Update Swagger title to `"OptiFlow API"` and remove disk writes of `swagger.json` in `main.ts`.

---

### 20.6 Implementation Effort & Impact Matrix

| Fix ID | Description | Track | Effort (Days) | Impact | Target Phase Findings |
|---|---|:---:|:---:|:---:|---|
| **FIX-01** | Strict JWT & Remove Header Trust | Track 1 (P0) | 1.5 | 🔴 Critical | BUG-01, BUG-02, BUG-04, R-01 |
| **FIX-02** | Secure Protected `/evidence/download` | Track 1 (P0) | 1.0 | 🔴 Critical | BUG-03, R-02 |
| **FIX-03** | Prisma Compound Tenant Scoping Extension | Track 1 (P0) | 1.5 | 🔴 Critical | BUG-05, R-03 |
| **FIX-04** | Add Database Indexes & Soft-Delete | Track 2 (P1) | 0.5 | 🟠 High | BUG-07, BUG-08, R-06 |
| **FIX-05** | Fix State Caching & `/bootstrap` API | Track 2 (P1) | 2.0 | 🟠 High | BUG-13, BUG-14, R-07 |
| **FIX-06** | Idempotent SLA Escalations Cron | Track 2 (P1) | 1.0 | 🟠 High | BUG-06, R-09 |
| **FIX-07** | Isolate E2E Test Suite Environment | Track 2 (P1) | 1.0 | 🟠 High | BUG-11, R-05 |
| **FIX-08** | DOM XSS Sanitization Layer | Track 3 (P2) | 1.5 | 🟡 Medium | BUG-12, R-08 |
| **FIX-09** | Real Password Reset Backend & UI Hookup | Track 3 (P2) | 2.0 | 🟠 High | Missing Flow 18.2 |
| **FIX-10** | Cloud S3 Object Storage Adapter | Track 3 (P2) | 2.0 | 🔴 Critical | R-04, Missing Storage 18.4 |
| **FIX-11** | Production Docker & Nginx Orchestration | Track 4 (P3) | 2.0 | 🟠 High | Deployment 16.10 |
| **FIX-12** | Health Checks, Terminus & TS Strictness | Track 4 (P3) | 1.0 | 🟡 Medium | BUG-20, BUG-21, BUG-22 |

---

## 21. Final System Map

---

### 21.1 End-to-End System Topology

```mermaid
flowchart TB
    subgraph ClientTier ["Client Tier (Browser & Presentation)"]
        Landing["Public Landing & Auth<br>(index.html, login.html, register.html)"]
        ExecPortal["Executive & Owner Portal<br>(admin/executive/executive_dashboard.html)"]
        PMPortal["Project Management Portal<br>(admin/pm/pm-dashboard.html, tasks.html)"]
        HRPortal["Access Governance & HR<br>(admin/pm/hr-dashboard.html)"]
        CompliancePortal["Compliance Officer Portal<br>(modules/compliance.html, evidence.html)"]
        MemberPortal["Team Member & TL Portal<br>(enduser/member-dashboard.html, tl-dashboard.html)"]
        PlatformPortal["Platform Admin Portal<br>(platform-admin/*.html)"]
        StateStore["Client State Cache & API Client<br>(js/utils/helpers.js, sessionStorage)"]
    end

    subgraph GatewayTier ["Gateway & Security Middleware"]
        CORS["CORS Middleware"]
        Helmet["Helmet Security Headers"]
        TenantMid["TenantMiddleware<br>(Resolves User & Company Scopes)"]
        RolesG["RolesGuard<br>(Enforces @Roles() metadata)"]
        ExceptionF["HttpExceptionFilter<br>(Global Error Normalizer)"]
    end

    subgraph AppTier ["NestJS Core & Domain Modules"]
        AuthMod["AuthModule<br>(/auth/login, /auth/register-company)"]
        CompanyMod["CompaniesModule<br>(/companies, /branches, /teams)"]
        UserMod["UsersModule<br>(/users, /roles, /departments)"]
        TaskMod["TasksModule & Subtasks<br>(/tasks, /subtasks)"]
        ProjMod["ProjectsModule<br>(/projects)"]
        ProcMod["ProcessTemplates & Instances<br>(/process-templates, /process-instances)"]
        CompMod["ComplianceModule<br>(/compliance-rules, /violations, /bindings)"]
        EscMod["EscalationsModule<br>(/escalations, Cron SLA Checker)"]
        EvidMod["EvidenceModule<br>(/evidence, Multer Uploads)"]
        AuditMod["AuditLogsModule<br>(/audit-logs)"]
        NotifMod["NotificationsModule<br>(/notifications)"]
        PlatMod["PlatformAdminModule<br>(/platform-admin-users, /plans, /subscriptions)"]
    end

    subgraph DataTier ["Data & Persistence Tier"]
        Prisma["Prisma ORM Service"]
        NeonDB[("Neon Serverless PostgreSQL<br>(Multi-Tenant Database)")]
        DiskStorage[("Local Disk Storage<br>(uploads/ - Ephemeral)")]
    end

    %% Client to Gateway
    Landing --> CORS
    ExecPortal --> CORS
    PMPortal --> CORS
    HRPortal --> CORS
    CompliancePortal --> CORS
    MemberPortal --> CORS
    PlatformPortal --> CORS
    StateStore --> CORS

    %% Gateway Pipeline
    CORS --> Helmet --> TenantMid --> RolesG --> ExceptionF

    %% Gateway to Controllers
    ExceptionF --> AuthMod
    ExceptionF --> CompanyMod
    ExceptionF --> UserMod
    ExceptionF --> TaskMod
    ExceptionF --> ProjMod
    ExceptionF --> ProcMod
    ExceptionF --> CompMod
    ExceptionF --> EscMod
    ExceptionF --> EvidMod
    ExceptionF --> AuditMod
    ExceptionF --> NotifMod
    ExceptionF --> PlatMod

    %% Modules to Data
    AuthMod --> Prisma
    CompanyMod --> Prisma
    UserMod --> Prisma
    TaskMod --> Prisma
    ProjMod --> Prisma
    ProcMod --> Prisma
    CompMod --> Prisma
    EscMod --> Prisma
    EvidMod --> Prisma
    EvidMod --> DiskStorage
    AuditMod --> Prisma
    NotifMod --> Prisma
    PlatMod --> Prisma

    Prisma --> NeonDB
```

---

### 21.2 Multi-Tenant Data Domain Model

```mermaid
erDiagram
    PlatformAdminUser ||--o{ PlatformSupportAudit : logs
    Plan ||--o{ Subscription : defines
    Company ||--o{ Subscription : holds
    Company ||--o{ Branch : contains
    Branch ||--o{ Team : contains
    Company ||--o{ User : employs
    User ||--o{ RoleAssignment : assigned
    Role ||--o{ RoleAssignment : grants

    Team ||--o{ Project : owns
    Project ||--o{ Task : contains
    Task ||--o{ Subtask : breaks_into
    Task ||--o{ Escalation : triggers
    Task ||--o{ Evidence : supports

    Company ||--o{ ProcessTemplate : authors
    ProcessTemplate ||--o{ ProcessTemplateStep : sequences
    Company ||--o{ ProcessInstance : executes
    ProcessInstance ||--o{ ProcessInstanceStep : tracks

    Company ||--o{ ComplianceCategory : categorizes
    ComplianceCategory ||--o{ ComplianceRule : groups
    ComplianceRule ||--o{ ComplianceBinding : binds
    ComplianceRule ||--o{ ComplianceViolation : generates
    ComplianceViolation ||--o{ Evidence : resolves_with

    Company ||--o{ AuditLog : audits
    User ||--o{ Notification : receives
```

---

### 21.3 Role-Based Access & Frontend Routing Matrix

| Canonical Role Label | Role Slug | Matching `@Roles()` Attributes | Primary Frontend Dashboard Route | Scoping Level |
|---|---|---|---|---|
| **Platform Admin** | `platform_admin` | `'Platform Admin'`, `'platform_admin'` | [`platform-admin/dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/platform-admin/dashboard.html) | Global (All Companies) |
| **System Admin** | `system_admin` | `'System Admin'`, `'superuser'` | [`admin-console/admin-dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/admin-console/admin-dashboard.html) | Company Wide |
| **Company Owner / CEO** | `company_owner` | `'Company Owner'`, `'Owner'`, `'CEO'` | [`admin/executive/executive_dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/admin/executive/executive_dashboard.html) | Company Wide |
| **Branch Manager** | `branch_manager` | `'Branch Manager'`, `'Executive'` | [`admin/executive/executive_dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/admin/executive/executive_dashboard.html) | Branch Scoped |
| **Access Governance / HR**| `hr_manager` | `'Access Governance'`, `'HR Manager'` | [`admin/pm/hr-dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/admin/pm/hr-dashboard.html) | Company Wide |
| **Project Manager** | `project_manager` | `'Project Manager'`, `'PM'` | [`admin/pm/pm-dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/admin/pm/pm-dashboard.html) | Team / Project Scoped |
| **Process Admin** | `process_admin` | `'Process Admin'`, `'Process Owner'` | [`superuser/dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/superuser/dashboard.html) | Company Wide |
| **Compliance Officer** | `compliance_officer` | `'Compliance Officer'`, `'Compliance'` | [`modules/compliance.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/modules/compliance.html) | Company Wide |
| **Team Leader** | `team_leader` | `'Team Leader'`, `'TL'` | [`enduser/tl-dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/enduser/tl-dashboard.html) | Team Scoped |
| **Team Member** | `team_member` | `'Team Member'`, `'Employee'` | [`enduser/member-dashboard.html`](file:///d:/Codes/FDFED/2_OptiFlow/front-end/enduser/member-dashboard.html) | User Assigned Tasks |

---

### 21.4 Master API Route Directory

#### 1. Authentication & Tenant Onboarding
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticates credentials, returns user profile & target route |
| `POST` | `/auth/register-company` | Public | Self-serve registration creating Company, Owner user, and Subscription |
| `GET` | `/auth/public-plans` | Public | Public pricing tiers for registration cards |

#### 2. Organizational Hierarchy
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/companies` | Platform Admin | Lists all tenant companies in the platform |
| `POST` | `/companies/register` | Public | Legacy company registration endpoint |
| `GET` | `/branches` | Owner, HR, PM, TL | Lists branches for the authenticated company |
| `POST` | `/branches` | Owner, System Admin | Creates a new branch |
| `GET` | `/teams` | Authenticated Users | Lists teams belonging to company branches |
| `POST` | `/teams` | Owner, PM, HR | Creates a new department/team |
| `GET` | `/users` | Authenticated Users | Lists all company employees |
| `POST` | `/users` | Owner, HR Manager | Creates a new user account |
| `GET` | `/roles` | Authenticated Users | Lists predefined and custom company roles |
| `GET` | `/users/roles/mapping` | Authenticated Users | Returns all active User-Role assignments |

#### 3. Task Execution & Project Delivery
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/projects` | Authenticated Users | Lists projects with completion percentages |
| `POST` | `/projects` | Owner, PM | Creates a new project workspace |
| `GET` | `/tasks` | Authenticated Users | Lists tasks with priority, status, and assignees |
| `POST` | `/tasks` | Owner, PM, TL | Creates a new task |
| `PATCH` | `/tasks/:id` | Assigned User, PM, TL | Updates task status, hours, or description |
| `DELETE` | `/tasks/:id` | Owner, PM | Deletes/soft-deletes a task |
| `GET` | `/subtasks` | Authenticated Users | Lists all subtasks |
| `POST` | `/subtasks` | Authenticated Users | Creates a subtask item |
| `PATCH` | `/subtasks/:id` | Assigned User, TL | Updates subtask completion status |

#### 4. SLA Escalations & Blockers
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/escalations` | Authenticated Users | Lists active blockers and SLA escalations |
| `POST` | `/escalations` | Team Member, TL, PM | Raises a blocker escalation against a task |
| `PATCH` | `/escalations/:id/resolve` | PM, Owner, Manager | Resolves an active escalation blocker |

#### 5. Process & Workflow Orchestration
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/process-templates` | Authenticated Users | Lists reusable workflow templates and stage definitions |
| `POST` | `/process-templates` | Process Admin, Owner | Creates a new multi-stage process definition |
| `GET` | `/process-instances` | Authenticated Users | Lists active running workflow instances |
| `POST` | `/process-instances` | Authenticated Users | Instantiates a new workflow from a template |
| `GET` | `/process-instance-steps`| Authenticated Users | Lists step approval statuses for workflow instances |
| `PATCH` | `/process-instance-steps/:id` | Assigned Approver, Admin | Advances or approves a workflow stage |

#### 6. Compliance, Violations & Evidence
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/compliance-categories` | Authenticated Users | Lists compliance classification frameworks (SOX, ISO) |
| `GET` | `/compliance-rules` | Authenticated Users | Lists company compliance rules and policies |
| `POST` | `/compliance-rules` | Compliance Officer, Owner | Defines a new compliance rule |
| `GET` | `/compliance-bindings` | Authenticated Users | Lists rule bindings to templates and branches |
| `GET` | `/compliance-violations`| Authenticated Users | Lists detected compliance breaches |
| `POST` | `/evidence` | Authenticated Users | Uploads verification document attachment (Multer) |
| `GET` | `/evidence` | Authenticated Users | Lists submitted evidence records |

#### 7. Audit, Notifications & Platform Administration
| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/audit-logs` | Owner, Compliance, Admin | Immutable system audit trails |
| `GET` | `/notifications` | Authenticated Users | Lists user-specific notifications |
| `POST` | `/notifications` | Authenticated Users | Dispatches an in-app notification |
| `PATCH` | `/notifications/:id/read` | Notification Recipient | Marks notification as read |
| `GET` | `/platform-admin-users`| Platform Admin | Manages platform super-administrators |
| `GET` | `/plans` | Platform Admin | Manages commercial subscription plans |
| `GET` | `/subscriptions` | Platform Admin | Manages tenant company subscription status |

---

### 21.5 Core State Machine Lifecycles

```mermaid
stateDiagram-v2
    [*] --> Draft: Task Created

    state "Task Lifecycle" as TaskMachine {
        Draft --> Pending: Submitted for Work
        Pending --> In_Progress: Picked up by Assignee
        In_Progress --> Blocked: Blocker / Escalation Raised
        Blocked --> In_Progress: Escalation Resolved
        In_Progress --> Under_Review: Work Finished
        Under_Review --> Completed: Approved by TL/PM
        Under_Review --> In_Progress: Changes Requested
        Completed --> [*]
    }

    state "Process Instance Lifecycle" as ProcessMachine {
        [*] --> Initialized: Instance Triggered
        Initialized --> Step_1_Active: Step Assigned
        Step_1_Active --> Step_2_Active: Step 1 Approved
        Step_2_Active --> Final_Approval: Steps Completed
        Final_Approval --> Workflow_Completed: Final Sign-off
        Workflow_Completed --> [*]
    }
```

---

## 22. Open Questions & Architectural Decision Log

---

### 22.1 Critical Architectural Decisions

| # | Question / Decision Area | Options Evaluated | Recommended Decision | Rationale & Trade-Offs |
|---|---|---|---|---|
| **D-01** | **Authentication & Session Mechanism** | 1. Raw request headers (`x-user-role`, `x-user-id`)<br>2. Short-lived JWT (`accessToken`) + httpOnly `refreshToken`<br>3. Server-side session store (Redis) | **Option 2 (JWT + httpOnly Refresh Token)** | Eliminates critical spoofing vulnerabilities (BUG-01) while remaining stateless across horizontal backend replicas. |
| **D-02** | **Multi-Tenancy Isolation Layer** | 1. Manual controller `where: { companyId }`<br>2. Prisma Client Extension (`$extends`)<br>3. Postgres Row-Level Security (RLS) | **Option 2 (Prisma Extension)** | Transparently guarantees tenant isolation across all Prisma queries without requiring database migrations or manual controller repetition. |
| **D-03** | **Cloud Document & Evidence Storage** | 1. Local filesystem (`uploads/`)<br>2. AWS S3 / GCP Storage + Pre-signed URLs<br>3. Direct DB Blob Storage | **Option 2 (S3 + Pre-signed URLs)** | Solves ephemeral container data loss in production, prevents server bandwidth bottlenecks, and secures files with time-limited signed links. |
| **D-04** | **Frontend Modernization Strategy** | 1. Keep raw Vanilla HTML/JS<br>2. Bundle Vanilla JS with Vite + TS<br>3. Migrate to Single-Page App (React / Next.js / Vue) | **Option 2 immediately, Option 3 long-term** | Bundling with Vite immediately enables linting, tree-shaking, and TypeScript strictness without rewriting 30+ HTML pages. |
| **D-05** | **Real-Time Notification Delivery** | 1. Client HTTP Polling (`getState`)<br>2. Server-Sent Events (SSE)<br>3. WebSockets (Socket.io) | **Option 2 (Server-Sent Events) for alerts; Option 3 for bidirectional collaboration** | SSE is lightweight, HTTP/2 multiplexed, and ideal for one-way notifications without WebSocket connection state complexity. |

---

### 22.2 Product Scope & Business Questions

- [ ] **Milestone Deadlines & Scope Definition**: What is the target timeline and what features are considered in-scope for the MVP / initial production release (e.g. is billing integration required immediately, or can subscription tiers remain seeded)?
- [ ] **Transactional Email Provider**: Which email service provider is preferred for production password resets and escalation alerts (SendGrid, AWS SES, Resend, or Postmark)?
- [ ] **Payment Gateway Integration**: Which payment gateway should be wired to the `/subscriptions` endpoints (Stripe Billing, Razorpay, or LemonSqueezy)?
- [ ] **Dedicated Admin Portal Structure**: Should the platform admin portal remain separate (`platform-admin/*.html`) or be consolidated with the company superuser console (`admin-console/`)?
- [ ] **Process Builder Execution Depth**: Is non-linear DAG workflow execution (conditional branching and parallel approvals) required for the upcoming release, or is linear stage progression sufficient for current use cases?

---

### 22.3 Branding & Repository Cleanliness Resolution

- [x] **Brand Identity Unified**: The application is officially designated as **OptiFlow** (all references to "OfficeSync" in Swagger titles and HTML footers are scheduled for removal in Track 4).
- [x] **Automation Artifacts Identified**: The temporary script `update_controllers.py` and auto-generated `swagger.json` writes on server bootstrap are flagged for cleanup.

---

### 22.4 22-Phase Audit Sign-Off Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                OPTIFLOW COMPLETE AUDIT SIGN-OFF                                 │
├───────┬─────────────────────────────────┬──────────┬────────────────────────────────────────────┤
│ Phase │ Title                           │ Status   │ Key Artifacts & Findings                   │
├───────┼─────────────────────────────────┼──────────┼────────────────────────────────────────────┤
│ 1-5   │ System Architecture & Overview  │ ✅ 100%  │ Multi-tenant NestJS + Vanilla JS topology  │
│ 6-7   │ Core Features & Data Flows      │ ✅ 100%  │ 7 core domains & 4 complete event flows    │
│ 8-10  │ Backend, Frontend & Database    │ ✅ 100%  │ 12 modules, 30+ pages, 19 Prisma models    │
│ 11-13 │ Auth, Config & Integrations     │ ✅ 100%  │ Multi-surface RBAC, Neon DB, Local Multer  │
│ 14-16 │ Errors, Testing & Deployment    │ ✅ 100%  │ Global filter, 20 test specs, Dev env only │
│ 17    │ Current Flaws & Bugs            │ ✅ 100%  │ 24 flaws categorized (4 P0, 7 P1, 8 P2)    │
│ 18    │ Missing Functionality           │ ✅ 100%  │ Gap matrix (Password reset, S3, Engine)    │
│ 19    │ Technical Risks                 │ ✅ 100%  │ 10 scored technical risks (R-01 to R-10)   │
│ 20    │ Recommended Fixes               │ ✅ 100%  │ 4-track remediation roadmap with diffs     │
│ 21    │ Final System Map                │ ✅ 100%  │ Topology, ERD, 60+ API routes, State flows │
│ 22    │ Open Questions & Decisions      │ ✅ 100%  │ Decision log, product questions & sign-off │
└───────┴─────────────────────────────────┴──────────┴────────────────────────────────────────────┘
```

> **Audit Status**: **100% Complete (22 / 22 Phases Audited)**  
> **Master Artifact**: [`PROJECT_UNDERSTANDING.md`](file:///C:/Users/Blitzgreik/.gemini/antigravity-ide/brain/5c42ba42-549d-4596-80b6-456d819e0739/PROJECT_UNDERSTANDING.md)  
> **Ready for Implementation**: All technical risks, flaws, and missing functionalities have concrete, actionable remediation specifications.
