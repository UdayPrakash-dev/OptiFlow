# OptiFlow — Node.js + Express Rebuild: Architecture & Implementation Plan

> **Evidence legend** — every non-obvious statement in this document is tagged:
> **CONFIRMED** (directly supported by `PROJECT_UNDERSTANDING.md`) · **INFERRED** (reasonable deduction from the audit, stated as such) · **UNKNOWN** (no evidence either way) · **REQUIRES CLARIFICATION** (a decision that blocks or materially changes design and must come from you).
>
> Architectural recommendations are my judgement, not evidence. They are marked **DECISION** and are always paired with the alternative that was rejected.

---

# 1. Old System Understanding

## 1.1 What OptiFlow is

**CONFIRMED** — A multi-tenant SaaS for office/organizational workflow management: standardised task execution, configurable process templates, automated compliance checks, evidence collection, and an audit trail. Three layers of actor: a platform operator, a tenant company, and employees inside that company. Earlier project name was *OfficeSync*; the rename is incomplete in code.

**CONFIRMED** — Shape: a monorepo with a NestJS 11 monolith (34 domain modules, TypeScript, Prisma 6, PostgreSQL on Neon), a static vanilla-JS/HTML5 multi-page frontend with no build step, and local-disk file storage. No Docker, CI/CD, cache, queue, or cloud object storage exists anywhere in the repo.

## 1.2 Feature inventory and true completeness

| Feature Backend Frontend Real state                             |                                                                                                                                               |
| ---------------------------------------------------------------- | -- | -- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Login / company self-registration                                | ✅  | ✅  | **Complete but unsound** — login returns no token; identity travels in custom headers thereafter                                             |
| Projects                                                         | ✅  | ✅  | Complete CRUD, tenant-scoped, branch-manager scope enforced                                                                                  |
| Tasks                                                            | ✅  | ✅  | Complete CRUD + soft delete + status lifecycle + delegation rules                                                                            |
| Subtasks                                                         | ✅  | ✅  | Complete CRUD                                                                                                                                |
| Escalations                                                      | ✅  | ⚠️ | Backend CRUD complete; SLA cron exists but is non-idempotent; UI only inside task detail                                                     |
| Evidence + upload                                                | ✅  | ✅  | Works, but local disk, publicly served, no download authorization                                                                            |
| Compliance engine                                                | ⚠️ | ✅  | CRUD complete; "automation" is **one hardcoded rule name** (`Mandatory Code Review`) in one event listener                                   |
| Process engine                                                   | ⚠️ | ⚠️ | CRUD only. Strictly linear steps, **no transition validation**, no branching, no quorum, no rejection loopback despite a schema field for it |
| HR / users / roles                                               | ✅  | ✅  | Complete, but role update destroys all existing role assignments                                                                             |
| Executive analytics                                              | ✅  | ✅  | Endpoints exist; controller queries Prisma directly with no service layer                                                                    |
| Platform admin (companies, plans, subscriptions, support access) | ✅  | ✅  | CRUD complete; **login has no password check at all**                                                                                        |
| Audit logs                                                       | ✅  | ✅  | Written, but fire-and-forget and with a hardcoded fallback `companyId`                                                                       |
| Notifications                                                    | ⚠️ | ✅  | DB rows only — no push, no email, no delivery                                                                                                |
| Password reset / forgot password                                 | ❌  | ✅  | **Placeholder** — polished UI, `setTimeout` fake success, zero backend                                                                       |
| Billing / payments                                               | ❌  | ✅  | **Placeholder** — `Plan`/`Subscription` tables and pricing UI, no gateway, no webhooks, no dunning                                           |
| Email, real-time, exports, bulk import, SSO/MFA, health checks   | ❌  | —  | Absent                                                                                                                                       |

**INFERRED** — The system is a well-modelled data layer with a thin, partially simulated behaviour layer. The schema is the strongest asset; the runtime behaviour, especially security, is the weakest.

## 1.3 Architecture as built

- **Frontend** — MPA, \~30 standalone HTML pages, shared globals (`window.Helpers`, `window.Auth`) loaded by `<script>` tag. Session in `sessionStorage.currentUser`. Page guards are client-side only, with a superuser/company_owner "god mode" bypass. API base URL hardcoded to `http://localhost:5500` in **at least 28 places**, many bypassing the shared API client entirely.
- **Backend** — NestJS monolith. Pipeline: `LoggerMiddleware` → `TenantMiddleware` → `RolesGuard` → controller → service → `PrismaService`. Global `ValidationPipe`, `TransformInterceptor` (wraps success as `{success,data}`), `GlobalExceptionFilter` (different error shape — a known frontend pain point).
- **Database** — 27–32 Prisma models, 13 enums, shared-database/shared-schema multi-tenancy keyed on `companyId`. **One** `_init` migration; subsequent changes made with `prisma db push`, so there is no rollback path and no schema history.
- **Auth** — Hybrid and incoherent: bcrypt is used correctly, a JWT is minted **only** on company registration and **never validated anywhere**, and all real identity is carried in `x-user-id` / `x-user-role` / `x-company-id` / `x-platform-admin-id` headers.
- **Multi-tenancy** — Partially real: `TenantMiddleware` resolves `companyId` from the DB rather than the header, and `tenant-scope.util.ts` builds scoped `WHERE` clauses. But several services query `where: { id }` alone, and the middleware has fallbacks that defeat the whole model.
- **Events** — `EventEmitter2` registered globally; exactly one event (`task.completed`) and one listener exist.
- **Files** — Multer disk storage in `back-end/uploads/`, served statically at `/uploads/*` with no auth.
- **Logging** — Custom file logger with good secret redaction; local disk only, no rotation limits, no aggregation; four call sites bypass it with raw `console.*`.
- **Deployment** — None. `npm run start:dev` on a developer machine, pointed at a shared cloud database.

## 1.4 Module map (34 modules)

Platform: `plans`, `subscriptions`, `companies`, `platform`, `platform-admin-users`, `platform-support-access`.
Identity: `auth`, `permissions`, `roles`, `role-templates`, `role-assignments`.
Organisation: `branches`, `teams`, `users`.
Work: `projects`, `tasks`, `subtasks`, `escalations`.
Process: `process-templates`, `process-instances`, `process-instance-steps`.
Compliance: `compliance-categories`, `compliance-rules`, `compliance-bindings`, `compliance-violations`, `evidence`.
Cross-cutting: `comments`, `attachments`, `audit-logs`, `notifications`.
Role-shaped read APIs: `metrics`, `executive`, `process`, `governance`.

**INFERRED** — The last group (`executive`, `governance`, `process`, `metrics`) are **not domains**. They are per-persona read models that were promoted to modules because Nest makes a module the unit of everything. They are a presentation concern and should not survive as domain boundaries. Similarly, `compliance-*` is split into four sibling modules that share one lifecycle and should be one bounded context.

## 1.5 Key data flows (as they actually run)

**Login** → `POST /auth/login` → bcrypt compare → role resolved by an 8-step `if/else` substring chain → hardcoded label→route map → audit row with hardcoded IP `127.0.0.1` → returns user JSON, **no token** → frontend writes `sessionStorage` and redirects.

**Every subsequent request** → frontend attaches `x-user-id`, `x-user-role`, `x-company-id` and a fake `Authorization: Bearer <uuid>` → `TenantMiddleware` DB-resolves the user → `RolesGuard` compares `@Roles()` against three surfaces, two of which are the raw client headers.

**Task completion** → `PATCH /tasks/:id {status:'Completed'}` → guard → service updates → audit `create()` called **without** **`await`** → `emit('task.completed')` → observer counts evidence for the task; if zero **and** a binding exists whose rule is literally named `Mandatory Code Review`, it creates a violation.

**Evidence** → multipart to disk → `Attachment` row created inside a `try/catch` that swallows failures → evidence row updated with a `/uploads/...` path → approval sets violation `Resolved` **only if** `evidence.violationId` happens to be set.

**Company registration** → one Prisma transaction creating Company → owner User → Subscription → clone all platform `RoleTemplate`s into company `Role`s → assign System Admin → clone platform compliance rules. Then a JWT is signed with `JWT_SECRET || 'fallback_secret'` and promptly ignored by everyone.

## 1.6 Defects that must shape the new design

**Security (P0/P1, all CONFIRMED)**

1. `RolesGuard` ORs the raw `x-user-role` header into its allow check → sending `x-user-role: Superuser` grants admin access with no credentials at all. Total compromise.
2. `TenantMiddleware` last-resort fallback binds an unauthenticated request to `prisma.user.findFirst()` — the first user in the database.
3. `x-platform-admin-id` or `x-user-role: platform_admin` bypasses the middleware entirely and yields `companyId: 'all'`.
4. `/uploads/*` is served statically with no authorization — all compliance evidence is public to anyone with a URL.
5. Frontend login falls back, on *any* error from `/auth/login`, to fetching `/users` and matching on email with **no password check**.
6. Platform-admin login never checks a password at all.
7. `JWT_SECRET` absent from `.env`; code falls back to the literal `'fallback_secret'`.
8. `users.service` stores the literal string `'default_hash'` when no password is supplied — the account can never authenticate, and the value looks like a credential.
9. Cross-tenant tampering: several services use `where: { id }` without `companyId`.
10. Stored DOM XSS throughout the frontend via unescaped `innerHTML`.
11. `TEST_ACTOR_PRESETS` (real seed emails + roles) shipped in production client JS.

**Correctness / data integrity (CONFIRMED)**

12. `AuditLogsService` falls back to a hardcoded company UUID; `AuditLog.companyId` has **no FK**, so the bogus value inserts cleanly and corrupts the trail.
13. Audit writes are fire-and-forget (`no await`) → unhandled rejections, silently missing audit records.
14. Soft-delete filtering is applied ad hoc; deleted rows resurface in aggregates. Soft-deleting a Task does not cascade to Subtasks.
15. Process instance status transitions are unvalidated — `Draft → Completed` is reachable, bypassing approval gates.
16. SLA escalation cron is non-idempotent → duplicate escalations every cycle.
17. The compliance observer counts *any* evidence on the task, not evidence satisfying the specific binding.
18. Role resolution is substring matching (`includes('owner')`) in three separate places with three different strategies; any new role silently degrades to `team_member`.

**Operational (CONFIRMED)**

19. E2E tests run against the live Neon database using seeded users.
20. `getState()` fires 19 concurrent requests per page load, and its cache-write code is unreachable dead code after an early `return`.
21. No health endpoint, no container, no CI, no process manager, no graceful shutdown, no migrations pipeline.
22. `noImplicitAny: false` and `strictBindCallApply: false`.
23. Unit tests are 11/12 `it('should be defined')` scaffolds, several with unresolvable providers.

## 1.7 Reusability classification

| Asset Classification Note                                                                                                                             |                                                     |                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Domain model / entity vocabulary (Company, Branch, Team, Project, Task, Subtask, Escalation, Process\*, Compliance\*, Evidence, AuditLog)             | **Conceptually reusable**                           | The vocabulary is sound and domain-expert-derived. Re-derive the schema; don't copy it.                                        |
| Prisma schema file                                                                                                                                    | **Reusable with modification**                      | Good bones (UUID PKs, enums, compound uniques). Needs real FKs, index work, enum for `Project.status`, rethought polymorphism. |
| Status enums / state vocabularies                                                                                                                     | **Reusable as-is**                                  | `TaskStatus`, `EvidenceStatus`, `ViolationStatus`, `Severity`, `ScopeType` are well chosen.                                    |
| Role catalogue and scope model (Company/Branch/Team/Project)                                                                                          | **Conceptually reusable**                           | Keep the *concept* of scoped role assignments; discard the string-matching implementation entirely.                            |
| Company-registration transaction (clone role templates + rules)                                                                                       | **Conceptually reusable**                           | Right idea, wrong mechanics (no template versioning, no back-fill).                                                            |
| `LoggingService` redaction rules                                                                                                                      | **Reusable with modification**                      | Port the redaction key list to a structured logger; discard file-based transport.                                              |
| `GlobalExceptionFilter` error taxonomy (Prisma P2002/P2025/P2003/P2000 mapping)                                                                       | **Reusable with modification**                      | Good mapping table; reimplement as Express error middleware.                                                                   |
| E2E security tests (CORS, Helmet, error-shape, RBAC matrix)                                                                                           | **Conceptually reusable**                           | The *test intents* are valuable. Rewrite against an isolated DB.                                                               |
| Swagger/OpenAPI surface                                                                                                                               | **Reusable with modification**                      | Use the route directory as a requirements checklist, not as the new API spec.                                                  |
| `TenantMiddleware`, `RolesGuard`, header auth                                                                                                         | **Discard**                                         | Architecturally unsound; they are the source of four P0s.                                                                      |
| Frontend `Helpers`/`Auth`/`getState()`                                                                                                                | **Should be rewritten**                             | Broken cache, triple role translation, hardcoded URLs, XSS, test presets.                                                      |
| `database.service.ts` (63 KB)                                                                                                                         | **Should be rewritten**                             | A god-object query bag.                                                                                                        |
| `executive` / `governance` / `process` / `metrics` modules                                                                                            | **Should be rewritten** as read models, not modules | Persona-shaped, not domain-shaped.                                                                                             |
| `TEST_ACTOR_PRESETS`, `scaffold.js`, `rename_workflow.js`, `update_controllers.py`, `inject-seed.js`, committed `swagger.json`, `docs/` write-on-boot | **Discard**                                         | Dev artefacts and repo pollution.                                                                                              |
| Local `uploads/` + static serving                                                                                                                     | **Discard**                                         | Replaced by object storage with authorised access.                                                                             |

---

# 2. Actual Requirements / Capability Model

This section separates *what the old system happens to do* from *what the new system needs to do*. Everything here is derived from the audit or flagged as needing your input. Nothing is invented.

## 2.1 Users and roles

The audit gives ten role labels. Two observations before the table:

- **INFERRED** — `Superuser`, `System Admin`, and `Company Owner` are three names for substantially the same authority in the old system (`protectPage()` grants `superuser` and `company_owner` identical god-mode; `AuthService` maps `System Admin` and `superuser` to the same route). This is name drift, not three distinct actors.
- **DECISION** — Model roles as **named bundles of permissions**, not as behavioural branches in code. Roles become data; code asks "does the actor hold permission X at scope Y", never "is the actor a PM".

| Actor Scope Can create Can modify Can approve Can read Must NOT access  |                                                                     |                                                        |                                                                              |                                               |                                                                 |                                                                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Platform Admin**                                                      | Platform (all tenants)                                              | Companies, plans, subscriptions, other platform admins | Plan/subscription/company status                                             | Support-access grants                         | Tenant metadata, aggregate platform metrics, platform audit log | **Tenant business data** (tasks, evidence, HR records) except under a time-boxed, audited support grant                                            |
| **Company Owner / System Admin**                                        | Whole company                                                       | Branches, teams, users, roles, everything below        | Any company-owned record                                                     | Company-level approvals; role grants          | Everything in the company                                       | Any other company; platform tables                                                                                                                 |
| **Branch Manager / Executive**                                          | One branch (or read-only company-wide — **REQUIRES CLARIFICATION**) | Nothing outside their branch                           | Branch-scoped projects/tasks                                                 | Branch escalations                            | Branch dashboards, reports                                      | Other branches' data; user credentials; platform                                                                                                   |
| **HR / Access Governance**                                              | Company                                                             | Users, teams, role assignments                         | Employee profiles, role assignments, team membership                         | Role-change requests                          | Employee directory, org structure, role audit                   | Task/project business content; compliance evidence; billing                                                                                        |
| **Process Admin**                                                       | Company                                                             | Process templates and steps                            | Templates (versioned)                                                        | Template publication                          | Templates, instance status                                      | Financial data; HR records; user credentials                                                                                                       |
| **Project Manager**                                                     | Their projects/teams                                                | Projects, tasks, escalations                           | Tasks in their scope; reassignment to Team Leaders only (**CONFIRMED** rule) | Task completion, escalation resolution        | Project/task/evidence in scope                                  | Other PMs' projects (**REQUIRES CLARIFICATION**); HR records; company settings                                                                     |
| **Compliance Officer**                                                  | Company                                                             | Compliance categories, rules, bindings, violations     | Rules, violation status                                                      | Evidence approve/reject; violation resolution | All compliance data + audit log company-wide                    | Ability to edit tasks/projects; ability to delete audit records                                                                                    |
| **Team Leader**                                                         | Their team                                                          | Subtasks, tasks within team                            | Subtasks; own team's task status                                             | Subtask submissions                           | Team tasks, team members, evidence for their tasks              | Other teams; HR; compliance rule authoring                                                                                                         |
| **Team Member**                                                         | Self / assigned work                                                | Evidence, escalations, comments on own work            | Status and hours on **assigned** items only                                  | Nothing                                       | Own tasks/subtasks, own notifications, own profile              | Anyone else's tasks; user lists (**REQUIRES CLARIFICATION** — the old `/users` is open to all authenticated users, which enabled the login bypass) |

**REQUIRES CLARIFICATION (R1)** — Are Company Owner, System Admin, and Superuser genuinely one role? I recommend one (`company_admin`) unless you can name a permission that separates them.
**REQUIRES CLARIFICATION (R2)** — Is Executive a separate read-only company-wide analyst, or is it just Branch Manager? The audit maps both to the same dashboard.
**REQUIRES CLARIFICATION (R3)** — Should companies be able to define **custom** roles, or only use the platform-predefined set? The old schema supports custom (`RoleTemplateOrigin.company_custom`) but no UI or flow was found. This materially changes the permission system's complexity.

## 2.2 Core business capabilities

**Confirmed as required** (evidenced by working backend + UI + schema + the audit's feature table):

1. Tenant lifecycle — company self-registration, provisioning of default roles and compliance rules, company status (Active/Suspended/Closed).
2. Identity & access — authentication, scoped role assignment, permission evaluation, tenant isolation.
3. Organisation structure — branches → teams → membership; user directory with manager relationships.
4. Work management — projects → tasks → subtasks, assignment, status lifecycle, due dates, effort tracking, soft delete.
5. Escalations — raise a blocker against a task, route it, resolve it; SLA-driven automatic escalation.
6. Process/workflow engine — versioned templates with ordered steps, instantiation, per-step approval, instance status.
7. Compliance — categories, rules, bindings of rules to scopes, violations, evidence submission and review, auto-detection on defined triggers.
8. Evidence/file management — upload, store, authorise access, link to task or violation, review workflow.
9. Audit logging — immutable, attributable, tenant-scoped record of every significant action.
10. Notifications — in-app, per-user, read/unread.
11. Analytics — company- and branch-level KPIs over tasks, projects, escalations, violations.
12. Platform administration — tenants, plans, subscriptions, plan-limit enforcement, time-boxed support access.

**Required but entirely missing today** (CONFIRMED absent, and each blocks a confirmed capability):

13. Password reset (the UI promises it; the backend doesn't exist).
14. Session lifecycle — token issuance, refresh, revocation on logout/deactivation.
15. Authorised file download (evidence is currently public).
16. Transactional email — needed for #13 and for notification delivery.

**Present as data model only — scope decision needed:**

17. Billing/payments — `Plan`/`Subscription` exist and registration writes them, but no gateway. **REQUIRES CLARIFICATION (R4)**: for this release, is billing (a) out of scope with plans seeded and subscriptions administrative, or (b) a real Stripe/Razorpay integration? The audit lists this as an open product question too.
18. MFA, SSO, bulk import, CSV/PDF export, real-time push, comments/@mentions — **INFERRED out of scope for v1**; all are listed as missing with no partial implementation. Do not build unless you say otherwise.

**REQUIRES CLARIFICATION (R5)** — Is the **frontend** also in scope for this rewrite? The audit's own decision log (D-04) recommends bundling the vanilla JS with Vite now and an SPA later. Everything in §3 assumes the API must serve *some* browser client; whether you rewrite that client changes the phase plan substantially (see §6, Phase 9).

## 2.3 Core workflows

**W1 — Company onboarding** (CONFIRMED)
`register → validate (unique legal name/owner email, plan exists) → single transaction: create Company + owner User + Subscription + instantiate role set from templates + instantiate baseline compliance rules → audit(company.created) → issue session → (new) send verification email`
Rule: the whole thing commits or none of it does. The old version already does this correctly and must be preserved as behaviour.

**W2 — Authentication** (rebuilt)
`credentials → constant-time lookup + bcrypt/argon2 verify → check user active + company Active → mint short-lived access token + rotating refresh token → audit(login, real IP) → return actor profile + effective permissions`
Failure path must be indistinguishable in timing/message between "no such user" and "wrong password", and must **never** have a client-side fallback.

**W3 — Task lifecycle** (CONFIRMED, plus the missing validation)
`create (validate project in actor's scope; PM may assign only to a Team Leader) → assign → status transitions validated against an explicit state machine → on Completed: evaluate compliance bindings for that task's scope → create violation if an applicable binding is unsatisfied → notify assignee/PM → audit every transition inside the same transaction`

**W4 — Evidence and violation resolution** (CONFIRMED, plus the missing authorisation)
`member uploads evidence (type/size/quota validated) → stored in object storage under a tenant-namespaced key → metadata row created in the same transaction → reviewer (Compliance Officer or PM) approves/rejects → on approve, resolve the linked violation, or resolve any open violation for that task+rule → notify submitter → audit`
Fixes required: the old flow silently swallows attachment-row failures and only resolves violations when `violationId` was pre-set.

**W5 — Process execution** (CONFIRMED as partial)
`instantiate from a published template version → step 1 becomes Pending → assigned approver approves/rejects → on approve advance to next step; on reject follow the template's rejection target (loopback) or terminate → instance completes when the last step is approved → audit each step`
Required additions over today: transition validation, and honouring the `onRejectGotoStepId` field that already exists in the schema but is unused.

**W6 — SLA escalation** (CONFIRMED as buggy)
`scheduled sweep → find tasks past due in an active state with no open escalation → create escalation (idempotent: unique constraint on task + open status) → notify → audit`

**W7 — Plan limit enforcement** (CONFIRMED)
`before creating a user/branch/project → read the company's active subscription → compare against plan limits → reject with a specific error when exceeded`

## 2.4 Business rules

**Confirmed rules (evidenced in the old code and to be preserved):**

- B1. Every business record belongs to exactly one company; cross-company access is forbidden.
- B2. A Branch Manager may only act within their assigned branch (`assertBranchManagerScope`).
- B3. A Project Manager may only assign tasks to a Team Leader.
- B4. Task status follows a defined lifecycle; `completedAt` is set on completion.
- B5. Approved evidence resolves its linked violation.
- B6. A completed task with an applicable compliance binding and no satisfying evidence is a violation.
- B7. Subscription limits (`maxUsers`, `maxBranches`) gate creation.
- B8. Users are deactivated, never hard-deleted; tasks/subtasks/comments are soft-deleted.
- B9. Audit entries are append-only.
- B10. Email is unique **within** a company, not globally.

**Rules that must be newly enforced (the old system states them but doesn't enforce them):**

- B11. Identity comes only from a verified token. No header, body field, or client-supplied `companyId` ever establishes identity or tenancy.
- B12. Deactivating a user invalidates their sessions immediately.
- B13. Soft-deleted records are excluded from every read path and every aggregate by default.
- B14. State transitions are validated against an explicit machine; illegal jumps are rejected.
- B15. An audit record is written in the same transaction as the change it describes, or the change does not commit.
- B16. Evidence files are readable only by actors authorised for the owning task/violation, within the owning tenant.
- B17. Platform Admin access to tenant *business* data requires an explicit, time-boxed, audited support grant (the `PlatformSupportAccess` concept, actually enforced).

**Assumptions (INFERRED, please confirm):**

- A1. A user has one primary role per scope. The old code deletes all role assignments on update, implying single-role in practice, while the schema allows many. **REQUIRES CLARIFICATION (R6).**
- A2. Compliance rules cloned to a company at registration are thereafter independently editable, and platform rule changes do not back-propagate.
- A3. Process templates are versioned (`@@unique[companyId,name,version]`) and a running instance stays pinned to the version it started on.

## 2.5 Non-functional requirements

| Area Requirement Justification  |                                                                                                                                                                                                                                                                             |                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Security**                    | Token-based auth with rotation and revocation; argon2id or bcrypt(≥12); no secrets with fallback defaults; startup fails if a required secret is missing; every query tenant-scoped; authorised file access; output encoding on the client; rate limiting on auth endpoints | Directly answers the four P0s and BUG-05/08/10 |
| **Data isolation**              | Tenant scoping enforced in a single place that cannot be forgotten, plus explicit compound `where` clauses in services. Cross-tenant access must be a test failure, not a code review question                                                                              | BUG-05 / R-03                                  |
| **Reliability**                 | Every multi-write use case is transactional; no fire-and-forget writes for anything auditable; graceful shutdown; DB connection failure must fail readiness, not start silently                                                                                             | BUG-13, §14.8                                  |
| **Performance**                 | A dashboard page must be served by **one** aggregate request, not 19; every FK and every filter column indexed; pagination mandatory on all list endpoints with a hard cap                                                                                                  | R-06, R-07                                     |
| **Scalability**                 | Single process must be horizontally replicable: no in-process session state, no local disk dependency, scheduled work guarded so only one replica runs it                                                                                                                   | R-04                                           |
| **Maintainability**             | TypeScript `strict: true`; one obvious place for each concern; no god objects; \~<400 lines per file as a smell threshold; students must be able to onboard from the folder structure alone                                                                                 | BUG-20, R-10                                   |
| **Observability**               | Structured JSON logs to stdout with request IDs and secret redaction; `/healthz` + `/readyz`; errors surfaced somewhere a human will see them                                                                                                                               | §12.6, §16                                     |
| **Testing**                     | Isolated ephemeral test database; the security perimeter (authn, authz, tenancy) has real tests before feature work continues; CI runs typecheck + lint + test on every push                                                                                                | BUG-11, §15                                    |
| **Deployment**                  | Reproducible container build; migrations applied as a deploy step; per-environment database and secrets; no `db push` in any non-local environment                                                                                                                          | §16                                            |
| **Availability**                | Best-effort single-region. **DECISION**: no HA, no multi-region, no autoscaling targets for v1 — there is no evidence of a load or uptime requirement, and a student team cannot operate it.                                                                                |                                                |

---

# 3. Proposed Node.js + Express Architecture

> Everything below is designed from §2, not from the NestJS layout. Where the new design happens to land near the old one (e.g. "there is a tasks module"), that is because the *domain* says so, not because Nest had a folder with that name.

## 3.1 Architecture style

**DECISION — A modular monolith with a thin four-layer stack inside each module, one deployable process, plain TypeScript with an explicit composition root and no DI framework.**

```
HTTP → router → controller → service (use case) → data access (Prisma) → PostgreSQL
                     ↑            ↑
              validation     domain rules, transactions, events, audit

```

Reasoning against the alternatives:

- **Full clean/hexagonal architecture** — rejected. It would demand ports and adapters for every dependency and a domain layer free of Prisma types. The audit shows a team that could not keep `await` on an audit call; asking them to maintain mapper layers between domain entities and Prisma models will produce either abandoned abstractions or 3× the code for the same behaviour. **Two ports only** are justified because they have genuinely swappable implementations: `StorageService` (local filesystem in dev, S3-compatible in prod) and `Mailer` (console in dev, provider in prod).
- **Microservices / event-driven distribution** — rejected outright. There is no independent scaling need, no team-boundary need, and a student team plus distributed transactions across Tasks/Compliance/Audit is a guaranteed failure. The audit's own evidence — 34 modules that all share one Prisma client and one database — says this is one service.
- **Unstructured Express (routes with inline logic)** — rejected. The compliance and process engines have real invariants that must be reusable from both HTTP handlers and scheduled jobs. Logic in route handlers cannot be called by a cron sweep.
- **Modular monolith** — chosen. Module boundaries are enforced by convention and lint rules (a module may import another module's `index.ts` public surface only), which keeps a future extraction possible without paying for it now.

**DECISION — No DI container (no InversifyJS, no TSyringe).** Dependencies are constructed once in `src/app.ts` and passed as constructor arguments. This is the single biggest simplification versus NestJS: it removes decorators, metadata reflection, module graphs, and the "Nest can't resolve dependencies" class of test failure the audit found. Tests construct a service with fakes directly.

**Stack** — Node 22 LTS, TypeScript 5 with `strict: true`, Express 5, Prisma 6 + PostgreSQL, Zod for validation, argon2id for passwords, jsonwebtoken for access tokens, pino for logging, Vitest + Supertest for tests, Docker for the runtime image.

**On keeping Prisma:** Prisma is not a NestJS pattern — it is an ORM, used here through a plain client. Keeping it preserves the team's existing knowledge and the schema work, which is the codebase's strongest asset. Kysely or Drizzle would give better raw-SQL ergonomics; neither justifies re-learning a data layer mid-rebuild. The Prisma-specific risks (query-builder opacity, migration discipline) are addressed in §3.4 and §4.

## 3.2 Project structure

```
optiflow-api/
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/                 # migrate dev/deploy only — db push is banned
│  └─ seed/
│     ├─ reference.ts             # idempotent: permissions, role templates, baseline rules
│     └─ demo.ts                  # dev-only sample tenants
├─ src/
│  ├─ server.ts                   # process entry: config load, listen, signal handling
│  ├─ app.ts                      # composition root: build deps, mount middleware + routers
│  ├─ config/
│  │  ├─ env.ts                   # Zod-validated env; throws at boot if invalid
│  │  └─ constants.ts
│  ├─ platform/                   # framework-level concerns, no business logic
│  │  ├─ db/prisma.ts             # client + tenant-scoping extension + soft-delete extension
│  │  ├─ context/requestContext.ts# AsyncLocalStorage: requestId, actor, companyId
│  │  ├─ http/
│  │  │  ├─ middleware/           # requestId, logger, helmet, cors, rateLimit, auth, errors
│  │  │  ├─ validate.ts           # Zod → 422 with field errors
│  │  │  ├─ asyncHandler.ts
│  │  │  └─ respond.ts            # one success + one error envelope
│  │  ├─ errors/AppError.ts       # typed error taxonomy → HTTP mapping
│  │  ├─ authz/                   # permission catalogue, scope checks, requirePermission()
│  │  ├─ events/bus.ts            # typed in-process emitter
│  │  ├─ audit/auditWriter.ts     # transaction-aware audit writes
│  │  ├─ storage/                 # StorageService port + s3 / local adapters
│  │  ├─ mail/                    # Mailer port + console / provider adapters
│  │  ├─ jobs/                    # scheduler + advisory-lock runner
│  │  └─ logging/logger.ts        # pino + redaction list ported from the old service
│  ├─ modules/
│  │  ├─ identity/                # auth, sessions, users, roles, permissions, assignments
│  │  ├─ tenancy/                 # companies, branches, teams, subscriptions-as-consumed
│  │  ├─ work/                    # projects, tasks, subtasks, escalations
│  │  ├─ process/                 # templates, versions, instances, steps
│  │  ├─ compliance/              # categories, rules, bindings, violations, evidence
│  │  ├─ files/                   # upload, metadata, authorised download
│  │  ├─ notifications/
│  │  ├─ audit/                   # read API over the append-only log
│  │  ├─ analytics/               # read models: dashboards, metrics, reports
│  │  └─ platform-admin/          # tenants, plans, subscriptions, support access
│  └─ shared/                     # pure helpers: dates, pagination, diffing, ids
└─ tests/
   ├─ integration/                # supertest against an ephemeral DB
   └─ unit/

```

Each module is `module/{routes.ts, controller.ts, service.ts, repo.ts?, schemas.ts, events.ts, index.ts}`.

**Layer responsibilities:**

- **routes** — path, HTTP method, middleware chain (`authenticate`, `requirePermission('task:create')`, `validate(schema)`), and nothing else. Reading a routes file must tell you the endpoint's entire security posture.
- **controller** — translate HTTP to a use-case call and back. No business rules, no Prisma. Thin enough to be boring.
- **service (use case)** — the only place with business rules. Owns the transaction boundary, emits events, writes audit entries, enforces scope. Callable from HTTP, a job, or a test with equal ease.
- **repo** — optional, added only where queries are non-trivial (analytics aggregates, the compliance evaluator, audit search). Simple modules call Prisma from the service; forcing a repository on `createTeam` is ceremony.
- **schemas** — Zod objects for params/query/body, and the inferred TypeScript types the service consumes. One source of truth for shape and type.
- **platform/** — everything that would be a Nest guard/pipe/interceptor/filter becomes ordinary Express middleware or a plain function here.

**Enforced rule:** `modules/a` may import `modules/b/index.ts` only, never `modules/b/service.ts` or `modules/b/repo.ts`. `platform/` may not import `modules/`. Enforce with `eslint-plugin-boundaries` in CI, because a rule that isn't enforced isn't a rule.

## 3.3 Domain / module boundaries

| Module Responsibility Owns (tables) Public interface Depends on Emits Consumes  |                                                                                                                          |                                                                                                               |                                                                           |                                                       |                                                                                                                        |                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **identity**                                                                    | Authenticate; issue/rotate/revoke sessions; users; roles; permissions; scoped assignments; resolve effective permissions | `user`, `refresh_token`, `password_reset_token`, `role`, `permission`, `role_permission`, `role_assignment`   | `authenticate()`, `getActorPermissions()`, `createUser()`, `assignRole()` | tenancy (company validity), plan limits               | `user.created`, `user.deactivated`, `role.assignment.changed`                                                          | `company.created` (provision owner + role set)                           |
| **tenancy**                                                                     | Companies, branches, teams, membership, plan-limit checks as consumed by tenants                                         | `company`, `branch`, `team`, `team_member`                                                                    | `getCompany()`, `assertWithinPlanLimit()`, `resolveScopeTree()`           | platform-admin (plan/subscription read)               | `company.created`, `branch.created`                                                                                    | —                                                                        |
| **work**                                                                        | Projects, tasks, subtasks, escalations; the task state machine; assignment rules                                         | `project`, `task`, `subtask`, `escalation`                                                                    | `createTask()`, `transitionTask()`, `listWorkForActor()`                  | tenancy (scope), identity (assignee validity)         | `task.created`, `task.assigned`, `task.status.changed`, `task.completed`, `task.overdue`, `escalation.opened/resolved` | `process.step.activated` (if a step spawns a task — **UNKNOWN**, see R7) |
| **process**                                                                     | Template authoring + versioning; instance execution; step approvals; transition validation                               | `process_template`, `process_template_version`, `process_step`, `process_instance`, `process_instance_step`   | `instantiate()`, `actOnStep()`                                            | identity (approver resolution), tenancy               | `process.instance.started/completed/rejected`, `process.step.activated/approved/rejected`                              | —                                                                        |
| **compliance**                                                                  | Rules, categories, bindings, violations, evidence review, the rule evaluator                                             | `compliance_category`, `compliance_rule`, `compliance_binding`, `compliance_violation`, `compliance_evidence` | `evaluate(trigger)`, `reviewEvidence()`, `listViolations()`               | files (evidence attachment), work (read task context) | `violation.opened/resolved`, `evidence.submitted/reviewed`                                                             | `task.completed`, `task.overdue`, `process.step.approved`                |
| **files**                                                                       | Upload, validation, storage-key allocation, metadata, authorised download                                                | `file_object`                                                                                                 | `store()`, `getDownloadUrl()`, `attachTo()`                               | StorageService port                                   | `file.stored`, `file.deleted`                                                                                          | —                                                                        |
| **notifications**                                                               | Create, list, mark read, unread counts; channel dispatch                                                                 | `notification`                                                                                                | `notify(recipients, type, payload)`                                       | Mailer port (later)                                   | —                                                                                                                      | every domain event that has a recipient                                  |
| **audit**                                                                       | Append-only trail; search/read API                                                                                       | `audit_log`                                                                                                   | `record()` (transaction-aware), `search()`                                | —                                                     | —                                                                                                                      | written directly by services, not by event listeners                     |
| **analytics**                                                                   | Read models for dashboards, KPIs, reports                                                                                | none (reads others' tables through dedicated query functions)                                                 | `getCompanyDashboard()`, `getBranchDashboard()`                           | read access to work/compliance tables                 | —                                                                                                                      | —                                                                        |
| **platform-admin**                                                              | Tenant administration, plans, subscriptions, support access grants                                                       | `plan`, `subscription`, `platform_admin_user`, `platform_support_grant`                                       | `getActivePlanFor()`, `grantSupportAccess()`                              | —                                                     | `subscription.changed`, `support.granted/revoked`                                                                      | `company.created`                                                        |

**Deliberate departures from the old module map:**

- The four compliance modules merge into one bounded context — they share one lifecycle and are meaningless apart.
- `executive`, `governance`, `metrics`, `process` (the persona modules) collapse into **analytics**, which is a read-model layer, not a domain. Personas select which read model they may call; they do not each get a module.
- `comments` and `attachments` are **not** modules. Attachments become `files` (a real capability with real infrastructure). Comments are dropped from v1 (§2.2 item 18) — the audit finds no implemented commenting feature.
- `role-templates` stops being a module and becomes reference data seeded into `identity`, plus a documented provisioning step.
- `auth` is not separate from `users`: authentication, sessions, and the user record are one identity context. Splitting them is what let the old system evolve a login path that disagreed with the user model.

**REQUIRES CLARIFICATION (R7)** — Do process instances create real tasks in the work module, or are process steps tracked entirely inside the process module? The audit shows no linkage between `ProcessInstanceStep` and `Task`. This decides whether `work` and `process` are coupled at all.

## 3.4 Database architecture

Keep PostgreSQL + Prisma. Re-derive the schema; do not copy it.

**Core decisions:**

1. **`company_id`** **on every tenant-owned table, with a real FK.** No exceptions — the old `AuditLog.companyId` and `Subtask.companyId` string columns without FKs are exactly how a hardcoded UUID ends up polluting the audit trail. Every tenant table also gets `@@unique([id, companyId])`, which allows **composite foreign keys** `(parentId, companyId) → (id, companyId)`. That makes it structurally impossible for a task to reference a project in another tenant, enforced by the database rather than by reviewer attention. This is the single highest-value schema change.
2. **Enum every status.** `Project.status` becomes an enum (it is a free string today). Keep the existing, well-chosen enums.
3. **Replace untyped polymorphism where it carries FKs.** `AuditLog` legitimately stays polymorphic (`resource_type`, `resource_id`) because it is an append-only log that must reference deleted rows. `Attachment`/`Comment`-style polymorphism is replaced by explicit nullable FKs on `file_object` (`task_id`, `evidence_id`, …) with a check constraint that exactly one is set — FK integrity beats generality here.
4. **Soft delete only where the audit shows it is used**: `user` (`deactivated_at`), `project`, `task`, `subtask` (`deleted_at`). Filtering is applied centrally by a Prisma extension, not by each query author. Soft-deleting a task cascades to its subtasks **in the service, inside the transaction** (Postgres cannot cascade a soft delete).
5. **Indexes, derived from the actual query patterns in the audit:**
   - `task(company_id, status, due_date)`, `task(assigned_to_id, status)`, `task(project_id)`, partial index `where deleted_at is null`
   - `subtask(task_id)`, `subtask(assigned_to_id)`
   - `audit_log(company_id, occurred_at desc)`, `audit_log(resource_type, resource_id)`, `audit_log(actor_id)`
   - `notification(user_id, read_at)` — partial on `read_at is null` for the unread badge
   - `compliance_violation(company_id, status)`, `compliance_evidence(violation_id)`, `compliance_binding(company_id, scope_type, scope_id)`
   - `refresh_token(user_id)`, unique on `token_hash`
   - Escalation idempotency: `unique(task_id) where status = 'Open'` — a partial unique index, which is the correct fix for BUG-06 and is enforced by the database rather than by cron logic.
6. **Tenant isolation strategy — defence in depth, three layers:**
   - *Layer 1*: `AsyncLocalStorage` request context carrying `{ requestId, actorId, actorType, companyId, permissions }`, populated by the auth middleware from **verified token claims only**.
   - *Layer 2*: a Prisma client extension that, for every model in the tenant-scoped registry, injects `companyId` into `where` on reads and into `data` on writes, and **throws** if no tenant context is present. A deliberate escape hatch (`prisma.unscoped()`) exists for platform-admin and system paths, is greppable, and is asserted against in tests.
   - *Layer 3*: composite FKs (decision 1) as a database-level backstop.
   - **Postgres Row-Level Security is deliberately deferred**, not rejected: it is the strongest option, but it requires per-request `SET LOCAL app.company_id` on a pooled connection, which is easy to get subtly wrong and hard for a student team to debug. Layers 1–3 close the audited vulnerabilities; RLS is the documented next hardening step if OptiFlow ever handles regulated customer data.
7. **Transaction boundaries** — one transaction per use case, opened in the service. Everything that must be consistent (the mutation, the audit row, the violation, the notification row) happens inside it. Nothing auditable is ever fire-and-forget. Event handlers that only touch the database run inside the transaction; handlers with external side effects run after commit (§3.7).
8. **Migrations** — `prisma migrate dev` locally, `prisma migrate deploy` in CI/CD. `db push` is banned outside a scratch database. The initial migration is generated fresh; the old `_init` is not carried over.
9. **Seeds** — split into `reference.ts` (idempotent, runs in every environment: permission catalogue, role templates, baseline compliance rules) and `demo.ts` (dev only). The old 49 KB mixed seed is a deployment hazard because company provisioning silently depends on it.

## 3.5 API architecture

- **Boundary** — one REST API under `/api/v1`. The version prefix is free to add now and impossible to retrofit politely.
- **Resources** — plural nouns, nesting at most one level: `/projects`, `/projects/:id/tasks`, `/tasks/:id/subtasks`, `/tasks/:id/evidence`, `/compliance/rules`, `/compliance/violations/:id/resolve`, `/process/templates`, `/process/instances/:id/steps/:stepId/approve`. Actions that are not CRUD become explicit sub-resources (`/approve`, `/resolve`, `/transition`) rather than overloaded PATCH bodies.
- **One envelope for everything.** Success `{ "data": ..., "meta": { ... } }`; error `{ "error": { "code": "TASK_INVALID_TRANSITION", "message": "...", "details": [...] }, "requestId": "..." }`. The old system's mismatched success/error shapes forced `json.data || json` all over the client — a small thing that caused real bugs.
- **Authentication** — `Authorization: Bearer <access token>` only. Custom identity headers are not read anywhere; a lint rule and a test assert that `x-user-role`, `x-user-id`, `x-company-id` appear nowhere in the codebase.
- **Authorization** — declarative at the route (`requirePermission('evidence:approve')`), plus a resource-scope check inside the service. Both are required; neither is sufficient.
- **Validation** — Zod at the boundary for params, query, and body; unknown keys stripped; UUIDs validated as UUIDs (the audit found IDs accepted as bare strings); a single 422 shape with per-field errors.
- **Pagination** — mandatory on every collection. `?limit=&offset=` with `limit` capped at 100 and a `meta.total`. Cursor pagination only for `audit_log`, where offset pagination degrades. No unbounded list endpoint exists — the old `/users` returning everyone is what made the login bypass exploitable.
- **Filtering/sorting** — explicit allow-lists per endpoint, mapped to indexed columns.
- **Aggregate endpoint** — `GET /api/v1/bootstrap` returns exactly what a dashboard needs for the current actor in one round trip, replacing the 19-request `getState()`. Per-resource endpoints remain for everything else.
- **Errors** — a typed `AppError` taxonomy (`ValidationError`, `UnauthenticatedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `PlanLimitError`, `InvalidTransitionError`) mapped by one error middleware. Prisma codes P2002/P2025/P2003/P2000 map as the old filter did. 5xx responses contain a `requestId` and nothing else; stack traces never cross the wire (BUG-18).
- **Docs** — OpenAPI generated from the Zod schemas (`zod-to-openapi`) at build time into an artifact, not written to disk on every boot (BUG-22).

## 3.6 Authentication and authorization

**Authentication**

- Passwords: **argon2id** (bcrypt at cost ≥12 is an acceptable fallback if argon2 native builds cause friction). Minimum length 12, checked against a common-password list. The literal `'default_hash'` pattern is impossible by construction: `password_hash` is `NOT NULL` and users created without a password get an invitation token instead of a fake hash.
- **Access token**: JWT, 15 minutes, claims `{ sub, companyId, actorType, roleIds, tokenVersion, jti }`. Signed HS256 with a secret that has **no fallback** — `config/env.ts` refuses to boot without it, in every environment.
- **Refresh token**: opaque 256-bit random value, **not a JWT**, stored only as a SHA-256 hash, 7-day expiry, delivered as `httpOnly; Secure; SameSite=Lax` cookie scoped to `/api/v1/auth`. Rotated on every use; a reused (already-rotated) token revokes the entire family and raises an audit event — this is the standard detection for stolen refresh tokens.
- **Revocation**: `user.tokenVersion` is incremented on logout-all, password change, deactivation, or role change. Access tokens carry the version and are rejected on mismatch, so revocation takes effect within the access-token TTL without a per-request session lookup.
- **Rate limiting**: per-IP and per-account on `/auth/login`, `/auth/forgot-password`, `/auth/refresh`; progressive delay then temporary lockout with an audit entry.
- **Password reset**: single-use, hashed, 30-minute token; the response is identical whether or not the email exists; using a token invalidates all sessions.
- **Platform admins**: a separate table, a separate login route, and tokens with a distinct `aud` claim that tenant middleware rejects. There is no header, role string, or body field that can turn a tenant user into a platform admin.
- **Support access**: a platform admin acting on tenant data must hold an active `platform_support_grant` (approved by the tenant, time-boxed). The resulting token carries `actAs: { companyId, grantId }`, and every audit row records both the impersonator and the effective actor.

**Authorization**

- A flat **permission catalogue** (`task:create`, `task:transition`, `evidence:approve`, `compliance.rule:write`, `user:manage`, `audit:read`, …) is seeded reference data. Roles map to permissions. Users hold **scoped role assignments** (`scope_type ∈ {Company, Branch, Team, Project}`, `scope_id`).
- Per request: the token gives `roleIds`; permissions are resolved from an in-process cache of the role→permission map, invalidated on role change (a map of a few hundred entries; a per-request DB join is the alternative and is the fallback if cache invalidation proves annoying).
- `requirePermission(p)` middleware answers *may this actor ever do this?*. The service then answers *may they do it to this record?* via `assertScope(actor, resource)`, which walks company → branch → team → project → assignee. Both checks are mandatory.
- **No role-name string matching anywhere.** Roles are referenced by stable IDs/slugs from the seeded catalogue. The old triple-translation bug class (`includes('owner')`) cannot recur because no code branches on a role label.
- Route-level default is **deny**: a router-level guard rejects any route that did not declare a permission, so forgetting `@Roles()` — which made `GET /projects/:id` public in the old system — becomes a startup error rather than a silent hole.

**How each audited P0 dies:**

| Old vulnerability Structural fix                 |                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| RolesGuard trusts `x-user-role`                  | Identity derives from a verified JWT only; a test asserts the header names appear nowhere in the source   |
| TenantMiddleware falls back to the first DB user | No fallback exists; a missing/invalid token is 401, full stop                                             |
| `x-platform-admin-id` bypass                     | Platform admins are a separate identity with a separate token audience                                    |
| Public `/uploads/*`                              | No static file serving; downloads go through an authorising endpoint that issues a short-lived signed URL |
| Frontend password-bypass fallback                | No unauthenticated endpoint returns user records; `/users` requires `user:read` and is paginated          |
| Platform login with no password                  | One authentication implementation, used by both login routes                                              |
| `JWT_SECRET \|\| 'fallback_secret'`              | `env.ts` validates required secrets at boot and exits non-zero if absent                                  |
| `where: { id }` cross-tenant access              | Prisma tenant extension + composite FKs + integration tests that attempt cross-tenant reads               |

## 3.7 Events and background work

**DECISION — A typed in-process event bus, plus** **`node-cron`** **scheduled jobs guarded by a Postgres advisory lock. No Redis, no BullMQ, no Kafka for v1.**

- **Why no queue infrastructure**: the audit found exactly one event and one listener in the entire system. The genuine async needs are (a) SLA sweeps, (b) notification fan-out, (c) email sending once it exists. None requires durable distributed queuing at the scale evidenced; all of it is minutes-latency-tolerant. Adding Redis adds a service to deploy, secure, monitor, and pay for, and a whole new failure mode, in exchange for nothing measurable today.
- **In-transaction handlers** — listeners that only write to the database (create a violation, write a notification row) run inside the originating transaction and receive the transaction client. If they fail, the business operation fails. This is the correct semantics for compliance and is the opposite of today's fire-and-forget.
- **After-commit handlers** — anything touching the outside world (email, S3 cleanup) runs after commit. For v1 these are wrapped so a failure is logged and surfaced, never swallowed silently.
- **When to add a transactional outbox**: the moment external delivery (email/webhooks) becomes required, add an `outbox` table written inside the transaction and drained by a poller. Until then it is machinery with no consumer. This trigger condition is written down so the decision isn't relitigated ad hoc.
- **Scheduled jobs** — `sla-sweep` (every 15 min), `session-cleanup` (daily), `support-grant-expiry` (hourly), `notification-retention` (weekly). Each acquires `pg_try_advisory_lock` before running, so running two API replicas cannot double-execute. Every job is idempotent, logs start/finish/affected counts, and is independently invocable from a CLI for testing.
- **Idempotency** is enforced by the database where possible — the partial unique index on open escalations (§3.4) means a duplicated sweep is a caught conflict, not a flood of duplicate tickets.

## 3.8 File and evidence storage

- **Storage**: S3-compatible object storage (AWS S3, Cloudflare R2, or Backblaze B2 — R2 is cheapest for a student project and has no egress fee). Local development uses a filesystem adapter behind the same `StorageService` port so nobody needs cloud credentials to run the app.
- **Keys**: `companies/{companyId}/{resourceType}/{fileId}` — tenant-prefixed so a bucket policy or a misdirected listing cannot span tenants. Original filenames are stored as metadata only, never used as keys.
- **Upload flow (v1)** — the client POSTs multipart to `POST /api/v1/tasks/:id/evidence`. The API streams to the object store while validating: extension and sniffed MIME type against an allow-list, size cap (recommend 25 MB), and the company's remaining storage quota from its plan. Only on success does the transaction create the `file_object` and `compliance_evidence` rows. A file with no metadata row, or metadata with no file, is not a reachable state.
- **Download flow** — `GET /api/v1/files/:id/download` authenticates, authorises against the owning task/violation and tenant, writes an audit entry, and then **302s to a 60-second presigned GET URL**. Files are never served from the application process and never have a guessable public URL.
- **Deletion** — deleting the owning record marks the file object deleted in the same transaction; an after-commit handler removes the object. A weekly reconciliation job reports orphans in either direction.
- **Why proxy uploads rather than presigned PUT**: presigned direct-to-bucket uploads save bandwidth but require bucket CORS, a two-phase confirm step, and orphan cleanup for abandoned uploads. Evidence files are small and low-volume; proxying keeps server-side content validation and removes an entire class of half-uploaded state. Revisit if upload volume ever justifies it.

## 3.9 Notifications

- `notification(id, company_id, user_id, type, title, body, resource_type, resource_id, created_at, read_at)`. Rows are created **inside** the transaction of the event that caused them, so a notification never claims something that didn't commit.
- API: `GET /notifications?unread=true` (paginated), `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`. No client-callable "send notification" endpoint — the old `POST /notifications` let any user fabricate a notification for anyone.
- **Delivery for v1 is in-app polling** of the unread count every 60 seconds. **SSE and WebSockets are both rejected for now**: they add connection-state management and a sticky-session constraint for a product whose notifications are "your task was reassigned", not a chat. A single cheap endpoint behind a `NotificationChannel` interface means SSE can be added later without touching any producer.
- **Email** is a second channel implementation behind the same interface, activated when a provider is chosen (R8) — required anyway for password reset.
- Retention: notifications older than 90 days are pruned by a scheduled job.

## 3.10 Audit logging

- `audit_log(id, company_id FK, actor_id, actor_type, impersonator_id, action, resource_type, resource_id, before jsonb, after jsonb, ip, user_agent, request_id, occurred_at)`.
- **Append-only**: no UPDATE or DELETE path exists in code; the application's database role is granted `INSERT, SELECT` on this table only. Even a compromised service cannot rewrite history.
- **Written inside the transaction** by `auditWriter.record(tx, …)`. No `companyId` fallback ever — if tenant context is missing the write throws, which is the correct behaviour and the exact opposite of the hardcoded UUID that corrupted the old trail. System actions use `actor_type = 'system'` with an explicit, real `company_id`.
- `before`/`after` store only the changed fields, produced by a shared diff helper, with a redaction list (password hashes, tokens, secrets) applied — reusing the old logging service's redaction keys, which were genuinely well done.
- **What is audited**: authentication events (success, failure, lockout, logout, token reuse), all permission and role changes, all tenant-scope CRUD, every state transition, evidence submission and review, violation lifecycle, file download, plan/subscription changes, and every platform-admin action against tenant data.
- Read API is permission-gated (`audit:read`) and tenant-scoped; platform admins read only the platform audit stream unless a support grant is active.

## 3.11 Observability

- **Logging** — pino, JSON, to stdout (the platform collects it). Every line carries `requestId`, `actorId`, `companyId`, route, status, duration. The old file-based logger is dropped — logs on a container filesystem are lost on restart — but its redaction key list is ported verbatim. No raw `console.*` anywhere; a lint rule enforces it.
- **Request correlation** — a `requestId` (inbound `X-Request-Id` or generated) lives in `AsyncLocalStorage`, appears in every log line, and is returned to the client in the error envelope, so a user-reported failure maps to log lines in one search.
- **Errors** — Sentry (free tier) or equivalent, because "errors appear in a log file nobody reads" is the current state. Optional but strongly recommended; the integration is ten lines behind the error middleware.
- **Health** — `GET /healthz` (process liveness, no dependencies) and `GET /readyz` (DB `SELECT 1`, storage reachability). The app must **not** start serving traffic while the database is unreachable; the old behaviour of booting regardless is how a broken deploy looks healthy.
- **Metrics** — **deferred**. No Prometheus, no Grafana for v1. Structured logs plus platform-provided CPU/memory graphs answer every question a project of this size will actually ask. Distributed tracing is rejected outright: one service, no distribution.

## 3.12 Deployment and infrastructure

| Concern Choice Reasoning  |                                                                                                                                          |                                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| API hosting               | One Docker image (multi-stage, non-root, `NODE_ENV=production`, no source maps) on Fly.io / Render / Railway                             | A container is the minimum that makes the app reproducible and restartable; the old "run `npm run start:dev` on a laptop" is not deployable |
| Frontend hosting          | Static hosting with a CDN (Cloudflare Pages / Netlify), API base URL injected at build time                                              | Kills the 28 hardcoded `localhost:5500` occurrences as a class                                                                              |
| Database                  | Managed PostgreSQL (Neon is already in use), **separate instances for dev, CI, staging, prod**                                           | The audit's biggest operational hazard is one shared database serving dev, tests, and demos                                                 |
| Migrations                | `prisma migrate deploy` as an explicit release step, before the new version accepts traffic                                              | No `db push`, ever                                                                                                                          |
| Object storage            | S3-compatible bucket, private, per-environment                                                                                           | Evidence must survive restarts                                                                                                              |
| Cache / queue             | **None**                                                                                                                                 | No evidenced need; see §3.7                                                                                                                 |
| Reverse proxy / TLS       | Provided by the platform                                                                                                                 | No nginx to operate                                                                                                                         |
| CI/CD                     | GitHub Actions: typecheck → lint → unit → integration (against an ephemeral Postgres service container) → build image → deploy on `main` | Tests currently never run automatically and, when run, hit the live database                                                                |
| Secrets                   | Platform secret store; `.env` only for local; `config/env.ts` validates and fails fast                                                   | `JWT_SECRET` must be impossible to omit                                                                                                     |
| Process management        | Container restart policy; `SIGTERM` handler draining in-flight requests and disconnecting Prisma                                         | No PM2, no systemd to babysit                                                                                                               |
| Backups                   | Provider point-in-time recovery; a documented, *actually tested* restore procedure                                                       | An untested backup is a hope                                                                                                                |

---

# 4. Critical Architecture Review

Each major decision is attacked below. Four decisions did not survive and are revised in §4.9.

## 4.1 Modular monolith with no DI container

**Why?** One deployable unit matching one team and one database; explicit wiring so a student can trace any dependency by reading `app.ts`.
**Alternative?** A DI container (keeps constructor injection without hand-wiring); Nest again (the team knows it).
**Trade-off?** `app.ts` grows to a few hundred lines of construction. In exchange, every dependency is visible, tests need no framework, and the "Nest can't resolve dependencies" test failures in the audit cannot happen.
**Risk?** As modules multiply, wiring becomes tedious and someone constructs a service ad hoc inside a handler, quietly creating a second Prisma client.
**Mitigation?** One `buildContainer()` function returning a typed object; a lint rule banning `new PrismaClient()` outside `platform/db`.
**Complexity?** Lower than the alternatives.
**Scale?** Fine to far beyond any plausible OptiFlow load.
**Team?** This is the decision most favourable to a student team.
**Failure mode?** A wiring mistake fails at boot, not at 3 a.m.
**Security?** Neutral. **Verdict: keep.**

## 4.2 AsyncLocalStorage + Prisma extension for tenant scoping

**Why?** Makes forgetting `companyId` impossible rather than unlikely — the root cause of BUG-05 and risk R-03.
**Alternative?** Pass `companyId` explicitly to every service and repo function (fully visible, zero magic); Postgres RLS (strongest).
**Trade-off?** Buys a guarantee, costs transparency: a query's real `WHERE` clause is no longer entirely visible at the call site.
**Risk?** Real and specific — (a) raw SQL (`$queryRaw`) bypasses the extension entirely; (b) a background job with no request context either throws or, worse, someone "fixes" it by disabling the extension; (c) debugging an unexpectedly empty result is confusing for a newcomer.
**Mitigation?** The extension **throws** rather than silently skipping when context is absent. `$queryRaw` is banned by lint except in an allow-listed analytics file where the tenant predicate is reviewed. Jobs enter an explicit `runAsSystem(companyId, fn)` scope. A permanent integration test suite attempts cross-tenant reads on every tenant model.
**Complexity?** Moderate, concentrated in one file.
**Team?** Acceptable if documented with a one-page "how tenancy works" note that new contributors read first.
**Failure mode?** Missing context throws — loud and safe.
**Security?** Strongly positive. **Verdict: keep, with belt-and-braces** — services still pass `companyId` explicitly on writes, so correctness does not rest on the extension alone.

## 4.3 Access JWT + rotating opaque refresh token

**Why?** Removes header-trust; enables revocation; keeps request handling stateless.
**Alternative?** Server-side sessions in Postgres (simplest revocation model, one DB read per request); the audit's own D-01 recommends the JWT pair.
**Trade-off?** A revoked user can act for up to 15 minutes unless `tokenVersion` is checked; checking it costs a cached lookup.
**Risk?** Refresh-token handling is where auth rewrites usually go wrong — rotation races (two tabs refreshing at once) can log a legitimate user out.
**Mitigation?** A short grace window on the just-rotated token, and a family-revocation audit event rather than a silent logout. Cover with tests.
**Complexity?** The most complex piece in the build, and the one worth the complexity.
**Team?** Achievable, but it must be built **once, early, and tested**, not touched again during feature work.
**Failure mode?** A signing-secret rotation logs everyone out — acceptable and recoverable.
**Security?** The core of the rebuild. **Verdict: keep.** Honest note: a Postgres-backed session table would be simpler and, at this scale, barely slower. If the team struggles with the refresh flow in Phase 1, switching to server-side sessions is an acceptable retreat that keeps every security property except statelessness.

## 4.4 Permission catalogue with scoped role assignments

**Why?** Kills role-name string matching permanently and makes custom roles possible without code changes.
**Alternative?** A fixed role enum with a hardcoded permission matrix — far simpler.
**Trade-off?** Data-driven permissions cost a seeding story, a cache, and an invalidation path; a hardcoded matrix costs a deploy per permission change.
**Risk?** **This is the decision most likely to be over-built.** If custom roles are never actually needed (R3), the whole permission-grant machinery is ceremony around ten fixed roles.
**Verdict: revise — see §4.9 (R-2).**

## 4.5 In-process events, cron with advisory locks, no Redis

**Why?** No evidence of a need; every added service is a service the team must operate.
**Alternative?** BullMQ + Redis (durable retries, visibility); no async at all (do everything inline).
**Trade-off?** Zero infrastructure cost versus losing at-least-once delivery for after-commit handlers if the process dies at the wrong moment.
**Risk?** A notification or email is lost on a crash. For "your task was reassigned", that is tolerable; for a password-reset email, it is not.
**Mitigation?** Password reset is synchronous and returns an error the user can retry; only best-effort notifications use after-commit handlers.
**Failure mode?** A missed cron cycle. The next sweep is idempotent and catches up.
**Team?** Strongly favourable.
**Security?** Advisory locks prevent double-execution; a job must still run under an explicit tenant scope. **Verdict: keep**, with the documented trigger for adding an outbox (§3.7).

## 4.6 Object storage with proxied upload and presigned download

**Why?** Ephemeral container disks lose evidence (R-04) and static serving exposes it (R-02).
**Alternative?** Keep local disk with a mounted volume (cheapest, blocks horizontal scaling); presigned direct upload (least server bandwidth).
**Trade-off?** Proxying costs API bandwidth and memory-pressure risk on large files; it buys server-side validation and no orphan state.
**Risk?** Streaming uploads through Express is easy to implement badly (buffering whole files in memory); a misconfigured public bucket reintroduces R-02 wholesale.
**Mitigation?** Stream, never buffer; enforce the size cap before reading the body; assert bucket-is-private in a startup check and in CI.
**Failure mode?** Storage down → uploads fail cleanly, reads of existing metadata still work.
**Security?** Large improvement. **Verdict: keep.**

## 4.7 Analytics as read models rather than persona modules

**Why?** `executive`, `governance`, `metrics` are not domains; they are audiences.
**Alternative?** Keep per-persona modules (matches the old structure and the frontend's shape).
**Trade-off?** One analytics module needs careful internal organisation or it becomes the new 63 KB `database.service.ts`.
**Risk?** Real — this is exactly how that god-object was born.
**Mitigation?** One file per dashboard query, each returning a typed shape, each independently testable; a hard rule that analytics is read-only and never mutates.
**Verdict: keep, with the file-per-query discipline made explicit.**

## 4.8 Single `/bootstrap` endpoint

**Why?** Replaces 19 requests per page load (R-07) with one.
**Alternative?** Fix caching client-side and keep granular endpoints; GraphQL (rejected — a whole runtime and a new failure surface to avoid writing one handler).
**Trade-off?** One expensive endpoint that must stay tightly scoped, or it becomes "fetch the entire tenant" and reintroduces the original problem in a single request.
**Risk?** Scope creep into a god-endpoint.
**Mitigation?** `/bootstrap` returns *counts, summaries, and the current actor's own work* — never full collections. Every list stays paginated at its own endpoint. A response-size budget (e.g. 100 KB) is asserted in a test.
**Verdict: keep, with the payload contract written down before it is built.**

## 4.9 Revisions

**R-1 — Drop the mandatory repository layer.** (Revising §3.2.) Originally every module had `repo.ts`. For `createTeam`, a repository is a pass-through that adds a file and hides the query. **Revised**: services call Prisma directly; a `repo.ts` appears only where queries are genuinely complex (analytics, the compliance evaluator, audit search). Trade-off accepted: mocking the database in unit tests gets harder, which is fine — the important tests here are integration tests against a real Postgres, and those are more truthful anyway.

**R-2 — Ship a fixed role→permission matrix in code for v1; keep the data model open.** (Revising §3.6 and §4.4.) Permission *checks* stay as designed (`requirePermission('task:create')`) because that is what kills role-name matching. But until R3 confirms that companies need custom roles, the matrix lives in one seeded, version-controlled file rather than behind an editing UI with grant/revoke flows and cache invalidation. The `role`/`permission`/`role_permission` tables are still created and seeded from that file, so enabling custom roles later is a feature, not a migration. This removes an entire subsystem from v1 at zero future cost.

**R-3 — No transactional outbox in v1.** (Revising §3.7, making the trigger concrete.) Notification rows are written inside the business transaction; only email dispatch is after-commit, and email does not exist until Phase 5. The outbox table is introduced **in the same phase as email**, not before. Building a durable message pipeline with one in-process consumer is infrastructure cosplay.

**R-4 — Frontend: bundle before rewriting.** (Answering the frontend half of §1 and pre-empting R5.) A full SPA rewrite doubles the project and is not required by any backend decision. **Revised recommendation**: introduce Vite + TypeScript over the existing pages first, which immediately gives an env-injected API base URL (killing 28 hardcoded URLs), a single auth/API client, type checking, and a place to add output escaping for the XSS class. An SPA migration, if wanted, then happens page by page against a stable API. This is also the audit's own D-04 recommendation, reached independently.

**Explicitly reconsidered and left as designed:** the JWT pair (§4.3, with a named fallback), the Prisma tenant extension (§4.2, with hard failure semantics), no Redis (§4.5), no RLS in v1 (§3.4, documented as the next hardening step).

---

# 5. Old → New Mapping

## 5.1 Component decisions

| Old component Decision Reason                                                                                            |                                              |                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma + PostgreSQL                                                                                                      | **KEEP**                                     | Not a Nest pattern; typed, known to the team, and the schema is the best asset in the repo                                            |
| Domain vocabulary and entity set                                                                                         | **KEEP**                                     | Domain-expert derived and internally coherent                                                                                         |
| Status enums (`TaskStatus`, `EvidenceStatus`, `ViolationStatus`, `Severity`, `ScopeType`)                                | **KEEP**                                     | Well chosen; reuse verbatim                                                                                                           |
| bcrypt password hashing                                                                                                  | **KEEP** (upgrade to argon2id if painless)   | Correctly implemented already                                                                                                         |
| Helmet + CORS allow-list                                                                                                 | **KEEP**                                     | Correct; move origins to validated env config                                                                                         |
| Prisma error-code → HTTP mapping                                                                                         | **KEEP** (reimplement as Express middleware) | The taxonomy is right; the Nest filter class is not                                                                                   |
| Log redaction key list                                                                                                   | **KEEP**                                     | Genuinely good; port into pino                                                                                                        |
| Company-registration transaction                                                                                         | **ADAPT**                                    | Keep the atomic provisioning; add template versioning, email verification, and remove the JWT afterthought                            |
| Prisma schema                                                                                                            | **ADAPT**                                    | Add real FKs, composite `(id, companyId)` uniques, enum `Project.status`, the missing indexes, partial unique for open escalations    |
| Scoped role assignments (`ScopeType`/`scopeId`)                                                                          | **ADAPT**                                    | Keep the model; drive it from a permission catalogue instead of label matching                                                        |
| Plan-limit enforcement                                                                                                   | **ADAPT**                                    | Keep the rule; move from a cross-cutting service into `tenancy`, enforced in the same transaction as creation                         |
| Compliance rules / bindings / violations / evidence                                                                      | **ADAPT**                                    | Merge four modules into one bounded context; replace the hardcoded rule name with a real evaluator                                    |
| Process templates / instances / steps                                                                                    | **ADAPT**                                    | Keep the model; add version pinning, transition validation, and honour the existing `onRejectGotoStepId`                              |
| Task delegation rules (PM assigns only to TL; branch-manager scope)                                                      | **ADAPT**                                    | Correct rules, wrong implementation (mixed slug/label sets) — re-express against permissions and scopes                               |
| Soft-delete pattern                                                                                                      | **ADAPT**                                    | Keep on the four entities that need it; enforce filtering centrally and cascade in-transaction                                        |
| Audit logging                                                                                                            | **REWRITE**                                  | Same intent, incompatible mechanics: transactional writes, real FK, no fallback `companyId`, actor + impersonator, before/after diffs |
| Authentication                                                                                                           | **REWRITE**                                  | Header identity, dead JWT, and the frontend bypass are unsalvageable                                                                  |
| `TenantMiddleware`                                                                                                       | **REWRITE**                                  | Replaced by token-derived context + Prisma extension; the fallback tiers are removed entirely                                         |
| `RolesGuard`                                                                                                             | **REWRITE**                                  | Replaced by `requirePermission` + scope assertion; no header surface exists to trust                                                  |
| Evidence upload/storage                                                                                                  | **REWRITE**                                  | Local disk and public static serving are the design flaw, not a bug in it                                                             |
| Notifications                                                                                                            | **REWRITE**                                  | Keep the table shape; remove the client-callable create endpoint; produce from domain events inside transactions                      |
| Executive analytics                                                                                                      | **REWRITE**                                  | Controller-with-Prisma becomes read-model query functions under `analytics`                                                           |
| Escalations + SLA sweep                                                                                                  | **REWRITE**                                  | Keep the concept; make it idempotent via a partial unique index and a locked job                                                      |
| `database.service.ts` (63 KB)                                                                                            | **REWRITE**                                  | Dissolve into module services and analytics queries                                                                                   |
| Error/response envelope                                                                                                  | **REWRITE**                                  | One consistent shape for success and error; never leak stack traces                                                                   |
| Logging transport                                                                                                        | **REWRITE**                                  | Structured JSON to stdout; keep the redaction rules                                                                                   |
| Test suite                                                                                                               | **REWRITE**                                  | Rewrite against an ephemeral database; keep the security test *intents* from the e2e specs                                            |
| Frontend session + API client (`Helpers`, `Auth`, `getState`)                                                            | **REWRITE**                                  | Broken cache, triple role translation, hardcoded URLs, dev presets                                                                    |
| `executive` / `governance` / `metrics` / `process` persona modules                                                       | **DISCARD** (as modules)                     | Audiences, not domains; their endpoints reappear as analytics read models                                                             |
| `comments`, `attachments` modules                                                                                        | **DISCARD** as-is                            | Attachments become `files`; comments are out of v1 scope (no implementation exists)                                                   |
| `role-templates` as a runtime module                                                                                     | **DISCARD**                                  | Becomes seeded reference data plus a provisioning step                                                                                |
| Header auth (`x-user-id`, `x-user-role`, `x-company-id`, `x-platform-admin-id`)                                          | **DISCARD**                                  | The source of four P0s                                                                                                                |
| `protectPage()` client-side god mode                                                                                     | **DISCARD**                                  | Never a security control; UI hints only, with the server as the sole authority                                                        |
| `TEST_ACTOR_PRESETS` / `ACTIVE_PRESET_KEY`                                                                               | **DISCARD**                                  | Shipped impersonation tooling                                                                                                         |
| Hardcoded fallbacks (`fallback_secret`, `default_hash`, `PlatformAdmin123!`, `b7744408-…`, `acme-ceo-uuid`, `127.0.0.1`) | **DISCARD**                                  | Each is a vulnerability wearing a default value                                                                                       |
| Static `/uploads/*` serving                                                                                              | **DISCARD**                                  | Replaced by authorised download                                                                                                       |
| Swagger write-to-disk on boot, committed `swagger.json`                                                                  | **DISCARD**                                  | Generate as a build artifact                                                                                                          |
| `scaffold.js`, `rename_workflow.js`, `update_controllers.py`, `inject-seed.js`                                           | **DISCARD**                                  | Dev artefacts                                                                                                                         |
| `db push` workflow                                                                                                       | **DISCARD**                                  | Replaced by versioned migrations                                                                                                      |
| `TransformInterceptor` double-wrapping                                                                                   | **DISCARD**                                  | Superseded by one deliberate envelope                                                                                                 |
| Dual `RolesGuard` registration (global + per-controller)                                                                 | **DISCARD**                                  | An artefact of Nest's module model with no analogue here                                                                              |

## 5.2 Capabilities that must be newly built

Password reset (token issue, email, consume, invalidate sessions) · session lifecycle (refresh, rotation, revocation, logout-all) · authorised file download with presigned URLs · a real compliance rule evaluator driven by rule definitions rather than one hardcoded name · process transition validation and rejection loopback · idempotent SLA escalation · transactional audit writes with before/after diffs · plan-limit enforcement at every creation path (the audit found enforcement only for users and branches) · `/bootstrap` aggregate endpoint · pagination on every collection · `/healthz` and `/readyz` · structured logging with request correlation · graceful shutdown · CI with an isolated test database · containerised deployment · environment-injected frontend configuration · transactional email (required by password reset).

## 5.3 Capabilities that should no longer exist

`POST /notifications` callable by end users · unbounded `GET /users` returning every user to any authenticated caller · any endpoint reachable without an explicit declared permission · client-side role god mode · the registration-only JWT · static public file serving · any code path that resolves a user without a verified credential · `swagger.json` written to the working tree at runtime.

## 5.4 Assumptions that must not carry over

1. "The client tells us who it is." Identity comes only from a verified token.
2. "Tenant isolation is a `WHERE` clause a developer remembers." It is an enforced invariant with database-level backstops.
3. "Audit logging is best-effort." It is part of the transaction or the transaction fails.
4. "Roles are strings we can pattern-match." Roles are identifiers; behaviour keys on permissions.
5. "A missing header or missing context is a reason to fall back to a default." It is a 401 or a thrown error.
6. "Local disk is storage." It is a cache at best.
7. "Dev, test, and demo can share a database." Each environment gets its own.
8. "A status field is a string the client sets." Transitions are validated against a state machine.
9. "Configuration can have a safe default." Secrets and origins fail closed at boot.

## 5.5 NestJS patterns that must not be ported to Express

- **Decorator-driven DI and module graphs** → explicit construction in a composition root. Do not reach for a decorator-based container to "feel like Nest".
- **Guards as the sole authorization layer** → route-level permission middleware **plus** in-service scope assertion. The audit shows a decorator-only model failing the moment one route forgot its decorator.
- **Global interceptor response wrapping** → one explicit `respond()` helper; no invisible transformation of controller return values.
- **Exception filters with framework-coupled classes** → a plain error taxonomy plus one error-handling middleware.
- **A module per noun** → modules are bounded contexts. Thirty-four Express folders mirroring thirty-four Nest modules would be the same mistake with different syntax.
- **`@nestjs/config`** **registered but bypassed with raw** **`process.env`** → one validated config object, imported everywhere; `process.env` is read in exactly one file.
- **In-method** **`require()`** → static imports only.
- **Controllers holding a database client** (the `ExecutiveController` pattern) → controllers never touch Prisma.

---

# 6. Implementation Plan

Ten phases, foundation first. The ordering principle: **the security perimeter and the tenancy invariant are built and tested before any feature sits on top of them**, because retrofitting them is exactly how the old system arrived where it is. No phase is "done" until its Definition of Done is literally checked.

---

## Phase 0 — Project foundation

**Goal** — A running, deployable, empty Express API with configuration, logging, error handling, health checks, and CI. It does nothing useful and is production-shaped.

**Components** — repo skeleton (§3.2), `config/env.ts`, pino logger with redaction, request-ID middleware, error taxonomy and error middleware, `respond()` helper, `/healthz`, `/readyz`, Dockerfile, GitHub Actions workflow, Vitest + Supertest harness.

**Dependencies** — None.

**Database changes** — None yet, but the Postgres service container for CI and the local docker-compose Postgres are set up here.

**APIs / interfaces** — `GET /healthz`, `GET /readyz`, `GET /api/v1` (version banner). The success and error envelopes are frozen in this phase and documented.

**Business logic** — None.

**Security considerations** — Helmet with a CSP that does **not** include `unsafe-inline`/`unsafe-eval`; CORS from validated env; `trust proxy` configured so client IPs are real (the old audit log's hardcoded `127.0.0.1`); the process exits non-zero if any required env var is missing; no stack traces in responses.

**Testing** — Boot test; `/healthz` 200; `/readyz` red when the DB is down; error middleware returns the documented envelope with a `requestId` and no stack; CI green on a clean clone.

**Definition of Done** — `docker build && docker run` serves `/healthz` against a local Postgres; CI runs typecheck, lint, and tests on push; deleting `JWT_SECRET` from the environment makes the process refuse to start.

**Risks** — Under-investing here (it feels like no progress) and then never coming back. Everything after this phase assumes it exists.

---

## Phase 1 — Data foundation and tenancy invariant

**Goal** — The schema exists, migrations work, and cross-tenant access is structurally impossible and proven so by tests.

**Components** — `prisma/schema.prisma` (full model set per §3.4), initial migration, `platform/db/prisma.ts` with the tenant-scoping and soft-delete extensions, `platform/context/requestContext.ts`, `runAsSystem()`, idempotent reference seed.

**Dependencies** — Phase 0.

**Database changes** — Everything: platform tables (`plan`, `subscription`, `platform_admin_user`, `platform_support_grant`), tenancy (`company`, `branch`, `team`, `team_member`), identity (`user`, `role`, `permission`, `role_permission`, `role_assignment`, `refresh_token`, `password_reset_token`), work (`project`, `task`, `subtask`, `escalation`), process (`process_template`, `process_template_version`, `process_step`, `process_instance`, `process_instance_step`), compliance (`compliance_category`, `compliance_rule`, `compliance_binding`, `compliance_violation`, `compliance_evidence`), `file_object`, `notification`, `audit_log`. All FKs real; composite `(id, company_id)` uniques on tenant tables; all indexes from §3.4; the partial unique index for open escalations.

**APIs / interfaces** — Internal only: the scoped Prisma client, `withTenant(companyId, fn)`, `runAsSystem(companyId, fn)`.

**Business logic** — Only the invariants: tenant injection, soft-delete filtering, the `audit_log` append-only grant.

**Security considerations** — The extension **throws** without tenant context; `$queryRaw` is lint-banned outside an allow-list; the application database role has no `UPDATE`/`DELETE` on `audit_log`.

**Testing** — For every tenant model: seeded tenants A and B, then assert that a query under A's context cannot read, update, or delete B's row **by id**; assert the extension throws with no context; assert soft-deleted rows are absent from reads and aggregates; assert `migrate deploy` applies cleanly to an empty database.

**Definition of Done** — The cross-tenant test suite passes and runs in CI; `prisma migrate deploy` + reference seed produce a working empty system; no code path can query a tenant table without a company.

**Risks** — Schema churn later is expensive once data exists, so spend the time on the model now. The extension is subtle: write its documentation page in this phase, not later.

---

## Phase 2 — Identity, authentication, authorization

**Goal** — A user can log in, hold a session, and be authorised. Every audited P0 is structurally closed.

**Components** — `modules/identity` (auth service, session service, user service, role/permission resolution), `platform/authz` (permission catalogue, `requirePermission`, `assertScope`, deny-by-default router guard), auth middleware, rate limiting.

**Dependencies** — Phases 0–1.

**Database changes** — Seeded permission catalogue and role→permission matrix (R-2); `user.token_version`; `refresh_token` and `password_reset_token` tables in use.

**APIs** — `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /platform-auth/login`. Password-reset **email delivery is stubbed to the log** in this phase (Phase 5 wires a provider) — the token lifecycle is real, only the transport is not.

**Business logic** — argon2id hashing; constant-time-ish failure paths; access token minting; refresh rotation with reuse detection and family revocation; `tokenVersion` invalidation; permission resolution from scoped role assignments; lockout after repeated failures.

**Security considerations** — This phase *is* the security work. No fallback secrets; no identity header is read anywhere; platform admins use a distinct token audience; `/users` does not exist yet and will be permission-gated and paginated when it does; reset responses do not reveal account existence.

**Testing** — Login success/failure; expired and tampered tokens rejected; refresh rotation happy path; **reused refresh token revokes the family**; deactivating a user invalidates the session within the access-token TTL; rate limiting triggers; a route declaring no permission fails at startup; a grep test asserts `x-user-role`, `x-user-id`, `x-company-id` appear nowhere in `src/`; a tenant user's token cannot reach any platform route.

**Definition of Done** — Every one of the eleven audited auth vulnerabilities has a corresponding passing regression test; a reviewer can read `routes.ts` for any endpoint and state its full authorization posture.

**Risks** — The single highest-complexity phase. If refresh rotation fights the team for more than a few days, fall back to server-side sessions (§4.3) rather than shipping something half-understood.

---

## Phase 3 — Tenancy, organisation, and audit

**Goal** — Companies can be provisioned and structured, and everything that happens is recorded properly.

**Components** — `modules/tenancy` (companies, branches, teams, membership, plan limits), the rest of `modules/identity` (user CRUD, role assignment), `platform/audit`, `modules/audit` read API, the shared before/after diff helper.

**Dependencies** — Phase 2.

**Database changes** — None structural; `audit_log` begins receiving writes.

**APIs** — `POST /auth/register-company`; `GET/PATCH /companies/current`; CRUD for `/branches`, `/teams`, `/teams/:id/members`, `/users`; `POST /users/:id/deactivate`; `POST /users/:id/roles`; `GET /audit-logs` (paginated, filtered, permission-gated).

**Business logic** — The atomic registration transaction (company + owner + subscription + role set + baseline compliance rules) rebuilt from W1; plan-limit checks inside the creating transaction; role assignment that **adds/removes individual assignments** rather than deleting them all; deactivation bumping `tokenVersion`; audit records written in-transaction for every mutation above.

**Security considerations** — Registration is the only unauthenticated write; rate-limit it and validate the plan ID against active plans; an audit write with no company context throws; `/users` is paginated and scoped.

**Testing** — Registration rolls back entirely on any step failure; plan limits reject the N+1th user/branch; role changes are additive/removal-precise; every mutation produces exactly one audit row with correct actor, company, and diff; a failed transaction produces **no** audit row; audit rows cannot be updated or deleted through any code path.

**Definition of Done** — A company can be created and fully structured through the API, every action appears in the audit log with a correct before/after diff, and plan limits hold.

**Risks** — The registration transaction is long; keep it under the statement timeout and test it against a realistic role-template set.

---

## Phase 4 — Work management

**Goal** — The core product loop: projects, tasks, subtasks, assignment, validated transitions, escalations.

**Components** — `modules/work`, the task state machine, the typed event bus, the first domain events.

**Dependencies** — Phase 3.

**Database changes** — None structural; the work tables come into use.

**APIs** — CRUD for `/projects`, `/tasks`, `/tasks/:id/subtasks`, `/escalations`; `POST /tasks/:id/transition`; `GET /tasks?assignee=me&status=…` (paginated, filtered); `POST /escalations/:id/resolve`.

**Business logic** — The explicit transition table (B14); PM-assigns-only-to-TL and branch-manager scope (B2, B3) expressed as scope assertions; soft delete cascading to subtasks inside the transaction; `task.created/assigned/status.changed/completed` and `escalation.opened/resolved` emitted.

**Security considerations** — Every read and write scoped by `companyId` **and** by the actor's branch/team/assignment scope; a team member can modify only items assigned to them; assignee must belong to the same company (the old code never checked this for managers).

**Testing** — Every legal transition succeeds and every illegal one returns a typed 409/422; a branch manager cannot touch another branch; a PM cannot assign to a non-TL; a member cannot modify another member's task; soft-deleted tasks vanish from lists, counts, and dashboards; cross-tenant task access by ID returns 404, not 403 (do not confirm existence).

**Definition of Done** — A task can be created, assigned, worked, escalated, and completed entirely through the API by correctly-permissioned actors, with a complete audit trail, and no illegal transition is reachable.

**Risks** — Scope rules are where authorization bugs hide. Write the scope matrix as a table first, then implement it, then test every cell.

---

## Phase 5 — Files, notifications, email

**Goal** — Evidence can be stored and retrieved safely, and users find out that things happened.

**Components** — `modules/files` with the `StorageService` port (local + S3 adapters), `modules/notifications`, the `Mailer` port with a real provider, the `outbox` table (introduced here per R-3), the password-reset email wired to a real transport.

**Dependencies** — Phase 4 (events to notify about).

**Database changes** — `file_object` in use; `notification` in use; `outbox` table added.

**APIs** — `POST /tasks/:id/evidence` (multipart), `GET /files/:id/download`, `DELETE /files/:id`, `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `POST /notifications/read-all`.

**Business logic** — Streaming upload with MIME sniffing, extension allow-list, size cap, and per-plan storage quota; metadata written in the same transaction; authorised download issuing a 60-second presigned URL and auditing the access; notification rows created in-transaction by event handlers; email dispatched after commit via the outbox.

**Security considerations** — Bucket is private (asserted at startup and in CI); keys are tenant-prefixed; download authorises against the owning resource, not just the tenant; uploads are never written to the application's disk; email content carries no secrets beyond a single-use token.

**Testing** — Upload rejects oversized files, disallowed types, and quota-exceeding files; a user from tenant B gets 404 on tenant A's file ID; a presigned URL expires; deleting a record removes the object; a notification exists after a task reassignment and does not exist if the transaction rolled back; the password-reset email is actually sent and its token works exactly once.

**Definition of Done** — Evidence survives a container restart, is unreachable without authorization, and password reset works end to end against a real mail provider in staging.

**Risks** — Storage misconfiguration silently reintroduces R-02. Make "bucket is not public" an automated check, not a runbook line.

---

## Phase 6 — Compliance engine

**Goal** — Rules, bindings, violations, and evidence review actually enforce something, driven by data rather than one hardcoded rule name.

**Components** — `modules/compliance` (categories, rules, bindings, violations, evidence review, the evaluator), compliance event listeners, the scheduled compliance sweep.

**Dependencies** — Phases 4 and 5.

**Database changes** — None structural; a `rule.trigger` / `rule.condition` representation is finalised here (**REQUIRES CLARIFICATION R9** — see §7).

**APIs** — CRUD for `/compliance/categories`, `/compliance/rules`, `/compliance/bindings`; `GET /compliance/violations`; `POST /compliance/violations/:id/resolve`; `POST /compliance/evidence/:id/approve` and `/reject`.

**Business logic** — Binding resolution up the scope tree (task → project → team → branch → company); evaluation on `task.completed`, `task.overdue`, and `process.step.approved`; violation creation when a binding's requirement is unmet, **matched to the specific rule** rather than to any evidence on the task; approved evidence resolving the matching open violation even when it was not pre-linked (fixing the audited gap); a periodic sweep for time-based rules.

**Security considerations** — Only `compliance:*` permission holders author rules; reviewers cannot approve their own submissions; violation and evidence history is immutable apart from status transitions; all of it tenant-scoped.

**Testing** — A completed task with an applicable binding and no evidence produces exactly one violation; with satisfying evidence, none; evidence for a *different* rule does not satisfy this one (the specific old bug); approving evidence resolves the right violation; the sweep is idempotent across repeated runs; rules from tenant A never evaluate against tenant B's work.

**Definition of Done** — Compliance behaviour is entirely determined by rule and binding data; no rule name appears anywhere in the source.

**Risks** — The rule-condition model can balloon into a general expression language. Keep v1 to a small enumerated set of condition types and extend only on evidence of need.

---

## Phase 7 — Process engine

**Goal** — Templates can be authored and versioned, and instances execute with validated transitions.

**Components** — `modules/process` (templates, versions, steps, instances, instance steps, the transition validator).

**Dependencies** — Phase 6 (a step approval can trigger compliance evaluation).

**Database changes** — Template versioning finalised; instances pin a version.

**APIs** — CRUD for `/process/templates` and `/process/templates/:id/versions`; `POST /process/templates/:id/publish`; `POST /process/instances`; `GET /process/instances/:id`; `POST /process/instances/:id/steps/:stepId/approve` and `/reject`.

**Business logic** — Only published versions may be instantiated; a running instance stays on its version; steps activate in order; approval advances; rejection follows `onRejectGotoStepId` or terminates the instance; instance status transitions are validated; each step action is audited and notified.

**Security considerations** — Only the assigned approver (or a holder of an override permission) may act on a step; an approver cannot approve a step in another tenant or another company's instance; editing a published version is forbidden — publish a new one.

**Testing** — Illegal instance transitions rejected (`Draft → Completed` must fail); rejection loopback returns to the intended step; a mid-flight template edit does not alter running instances; a non-assigned user cannot approve; the full happy path completes and is fully audited.

**Definition of Done** — A multi-step template with a rejection path can be authored, published, instantiated, rejected, reworked, and completed, with every transition validated and recorded.

**Risks** — Scope creep toward branching/parallel/quorum execution (R10). Ship linear-with-loopback first; DAG execution is a separate project.

---

## Phase 8 — Analytics, bootstrap, platform administration

**Goal** — Dashboards are fast and correct; the platform operator can run the business safely.

**Components** — `modules/analytics` (one file per dashboard query), `GET /bootstrap`, `modules/platform-admin` (companies, plans, subscriptions, support grants).

**Dependencies** — Phases 4, 6, 7 (there must be data worth aggregating).

**Database changes** — Any additional covering indexes revealed by `EXPLAIN` on the real aggregate queries; no new tables unless a materialised summary proves necessary — measure first.

**APIs** — `GET /bootstrap`; `GET /analytics/dashboard`, `/analytics/branches/:id`, `/analytics/compliance`, `/analytics/reports`; platform routes `GET /platform/companies`, `/platform/plans`, `/platform/subscriptions`, `POST /platform/support-grants`, `POST /platform/support-grants/:id/revoke`.

**Business logic** — Aggregates that exclude soft-deleted rows and respect the actor's scope; `/bootstrap` returning counts, summaries, and the actor's own work within a fixed size budget; support grants that are time-boxed, tenant-approved, and produce `actAs` tokens; every platform action against tenant data double-audited.

**Security considerations** — Analytics respects branch scope (a branch manager sees only their branch); platform admins cannot read tenant business data without an active grant; expired grants are rejected at token-validation time, not just at issue time.

**Testing** — A dashboard load issues one request; the `/bootstrap` payload stays under budget with a large seeded tenant; aggregates exclude soft-deleted records; a branch manager's numbers differ correctly from the owner's; a platform admin without a grant gets 403 on tenant data; an expired grant stops working immediately; dashboard queries stay under a stated latency budget against a seeded dataset (e.g. 50k tasks, 200k audit rows).

**Definition of Done** — The dashboard renders from one request, the 19-request pattern exists nowhere, and platform access to tenant data is impossible without an audited grant.

**Risks** — Analytics becoming the new god-object. Enforce one file per query in review.

---

## Phase 9 — Frontend integration and hardening

**Goal** — A client that works against the new API without the audited client-side flaws, and a system that is genuinely deployable.

**Components** — Vite + TypeScript over the existing pages (R-4); one API client with env-injected base URL, token storage, and automatic refresh; one escaping/rendering helper replacing raw `innerHTML`; removal of all dev presets; staging and production environments; OpenAPI artifact.

**Dependencies** — Phases 2–8.

**Database changes** — None.

**APIs** — None new; the client consumes what exists.

**Business logic** — Client-side guards are presentation only and are documented as such; the server is the sole authority.

**Security considerations** — Access token in memory, refresh token in the httpOnly cookie (never `localStorage`); output escaping on every interpolation; a CSP without `unsafe-inline`; no fallback login path of any kind; `TEST_ACTOR_PRESETS` and every hardcoded URL deleted.

**Testing** — An automated grep asserts no `localhost:5500`, no `innerHTML =`, and no preset object remains; a smoke path (login → view tasks → complete a task → upload evidence → see the notification) runs against staging; token expiry mid-session refreshes transparently; forced logout after deactivation.

**Definition of Done** — The app runs in staging from a build artifact with no code changes between environments, and the smoke path passes end to end.

**Risks** — This phase is sized entirely by the answer to R5. Bundling the existing pages is roughly a week; an SPA rewrite is its own project and should be planned separately.

---

## Sequencing notes

- Phases 0–3 are **non-negotiable prerequisites**. Nothing in 4–9 is safe on a weak foundation, and this is precisely where the old system went wrong.
- Phases 6 and 7 can run in parallel if two people are available; both depend on 4 and 5 and only touch each other at one event.
- Phase 9 can start against a staging API as soon as Phase 4 lands, provided the envelope contract from Phase 0 holds.
- If time runs short, cut **scope** (process branching, analytics depth, billing), never the perimeter (Phases 1–3) or the tests attached to it.

---

# 7. Open Questions / Decisions Requiring Your Input

Ordered by how much each blocks. The first four change the architecture; the rest change scope or effort.

| # Question Why it matters Default if you don't answer  |                                                                                                                                                                   |                                                                                                                                                                |                                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **R5**                                                 | Is the **frontend** in scope for this rebuild — bundle-and-fix, or full SPA rewrite?                                                                              | Determines whether Phase 9 is one week or its own project, and whether the API needs to support an existing page structure                                     | Bundle-and-fix with Vite (§4.9 R-4)                                                                                    |
| **R4**                                                 | Is **billing** real (Stripe/Razorpay + webhooks + dunning) or administrative (plans seeded, subscriptions managed by hand) for this release?                      | A real gateway adds a payment module, webhook security, idempotency, and reconciliation — easily a whole phase                                                 | Administrative; plans seeded, limits enforced, no gateway                                                              |
| **R3**                                                 | Must companies define **custom roles and permissions**, or is a fixed platform-defined role set enough?                                                           | Decides whether the permission system needs grant/revoke UI, cache invalidation, and per-tenant role authoring (§4.9 R-2)                                      | Fixed seeded matrix; tables kept open for later                                                                        |
| **R7**                                                 | Do process steps **create real tasks** in the work module, or do they live entirely inside the process module?                                                    | Determines whether `work` and `process` are coupled at all, and how a step's assignee relates to a task assignee                                               | Self-contained process steps; no task linkage                                                                          |
| **R1**                                                 | Are **Company Owner**, **System Admin**, and **Superuser** one role or three? Name a permission that separates them                                               | Three near-identical roles were a real source of confusion and god-mode bypasses in the old system                                                             | One role, `company_admin`                                                                                              |
| **R2**                                                 | Is **Executive** distinct from **Branch Manager**, or the same actor?                                                                                             | The audit maps both to the same dashboard with different scopes                                                                                                | Branch Manager (branch-scoped) and Company Owner (company-wide) cover it; no separate Executive role                   |
| **R6**                                                 | Can a user hold **multiple simultaneous role assignments** (e.g. Team Leader of team A *and* Compliance Officer company-wide)?                                    | Changes permission resolution from a lookup to a union across scopes, and changes the HR UI                                                                    | Yes — multiple assignments, permissions unioned per scope. The schema already allows it; only the old code assumed one |
| **R8**                                                 | Which **email provider**? (Resend, SendGrid, AWS SES, Postmark)                                                                                                   | Needed in Phase 5; password reset cannot ship without one                                                                                                      | Resend for a student project — simplest setup, generous free tier                                                      |
| **R9**                                                 | What **rule condition types** must the compliance evaluator support in v1? Evidence-required-on-completion is confirmed; anything else?                           | Prevents the evaluator from drifting into a general expression language                                                                                        | Three condition types: evidence required on completion, approval required before completion, deadline breach           |
| **R10**                                                | Is **non-linear workflow execution** (conditional branching, parallel/fork-join, quorum approvals) required now, or is linear-with-rejection-loopback sufficient? | This is the difference between a state machine and a DAG engine; the audit lists it as missing and flags it as an open product question                        | Linear with rejection loopback                                                                                         |
| **R11**                                                | What is the **expected scale** — number of tenants, users per tenant, tasks per month?                                                                            | Every "no Redis / no cache / no read replica" decision rests on the assumption of a small deployment; a concrete number would let me verify rather than assume | Tens of tenants, hundreds of users, thousands of tasks/month                                                           |
| **R12**                                                | **Data retention and residency** — how long must audit logs and evidence be kept, and does anything have to stay in a particular region?                          | Affects storage choice, retention jobs, and whether RLS moves from "deferred" to "required" (§3.4)                                                             | Audit retained indefinitely, notifications 90 days, no residency constraint                                            |
| **R13**                                                | Is there a **compliance certification target** (SOC 2, ISO 27001) driving this rebuild, or is it an academic/production-quality exercise?                         | A real certification target promotes RLS, MFA, and formal access reviews from "later" to "now"                                                                 | No certification target for v1                                                                                         |
| **R14**                                                | Is the existing **production data** being migrated, or does the new system start empty?                                                                           | Migration would require a translation layer for the reshaped schema and a cut-over plan — currently not in the roadmap at all                                  | Start empty; re-seed reference data and demo tenants                                                                   |

Two smaller confirmations, for completeness:

- **UNKNOWN** — Whether the legacy `.env` (containing live Neon credentials) was ever committed to git history. If it was, those credentials must be rotated before anything else in this plan happens.
- **UNKNOWN** — The contents of `SRS.pdf`, `definitions.yaml`, and `DomainExpertInteraction.md`, which the audit lists at the repo root but does not summarise. They likely contain authoritative requirements that would resolve several questions above; worth sharing if you have them.

---

*Prepared from* *`PROJECT_UNDERSTANDING.md`* *(22-phase audit) as evidence. No code, boilerplate, migrations, or configuration files were produced, per the brief.*
