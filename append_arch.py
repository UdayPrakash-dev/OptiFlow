import os

section_a = """
## SECTION A: Work Distribution

### 1. Ownership Table

| Member | Actor(s) | Backend Areas Used | Pages & Routes | Folders They May Edit | Estimated Load |
|---|---|---|---|---|---|
| **M1** | Compliance Officer + CEO (Company Owner) | `compliance-rules`, `compliance-categories`, `compliance-bindings`, `compliance-violations`, `evidence`, `audit-logs`, `executive/metrics`, `executive/branches` | **CEO:** Dashboard (`/executive/dashboard`), Projects (`/executive/projects`), Audit Logs (`/executive/audit-logs`) <br><br> **Compliance:** Dashboard (`/compliance/dashboard`), Rules (`/compliance/rules`), Categories (`/compliance/categories`), Bindings (`/compliance/bindings`), Violations (`/compliance/violations`), Evidence (`/compliance/evidence`), Audit Logs (`/compliance/audit-logs`) | `features/executive/`, `features/compliance/`, `app/routes/executive.jsx`, `app/routes/compliance.jsx` | High (Data heavy) |
| **M2** | HR / Access Governance | `users`, `roles`, `role-assignments`, `branches`, `teams` | **HR:** Dashboard (`/hr/dashboard`), Users (`/hr/users`), User Detail (`/hr/users/:id`), Roles (`/hr/roles`), Role Assignments (`/hr/role-assignments`), Branches (`/hr/branches`), Teams (`/hr/teams`) | `features/hr/`, `app/routes/hr.jsx` | Medium |
| **M3** | Process Admin + Shared Foundation | `process-templates`, `process-instances`, `process-instance-steps`, `auth`, `notifications` | **Process Admin:** Dashboard (`/process-admin/dashboard`), Templates (`/process-admin/templates`), Template Detail (`/process-admin/templates/:id`), Instances (`/process-admin/instances`), Instance Detail (`/process-admin/instances/:id`) <br><br> **Shared:** Login (`/login`), Register (`/register`), Notifications (`/notifications`), Profile (`/profile`), Platform Login (`/platform/login`), 404/Unauthorized | `features/process-admin/`, `features/common/`, `app/routes/process-admin.jsx`, `app/routes/common.jsx`, `shared/`, `layouts/`, `services/api/client.js`, `app/paths/`, `app/router/`, `context/` | High (Core framework + Feature) |
| **M4** | Project Manager + Team Leader + Team Member | `projects`, `tasks`, `subtasks`, `escalations`, `evidence` | **PM:** Dashboard (`/pm/dashboard`), Projects (`/pm/projects`), Project Detail (`/pm/projects/:id`), Tasks (`/pm/tasks`), Task Detail (`/pm/tasks/:id`), Escalations (`/pm/escalations`) <br><br> **TL:** Dashboard (`/team-lead/dashboard`), Tasks (`/team-lead/tasks`), Task Detail (`/team-lead/tasks/:id`), Reviews (`/team-lead/reviews`), Escalations (`/team-lead/escalations`) <br><br> **Member:** Dashboard (`/member/dashboard`), Tasks (`/member/tasks`), Task Detail (`/member/tasks/:id`), Evidence (`/member/evidence`), Escalations (`/member/escalations`) | `features/work/pm/`, `features/work/team-lead/`, `features/work/member/`, `features/work/shared/`, `app/routes/pm.jsx`, `app/routes/team-lead.jsx`, `app/routes/member.jsx` | Heaviest (Three roles) |
| **M5** | Platform Admin | `platform/auth`, `platform/metrics`, `companies`, `plans`, `subscriptions`, `platform-admin-users`, `platform/support-access` | **Platform:** Dashboard (`/platform/dashboard`), Companies (`/platform/companies`), Plans (`/platform/plans`), Subscriptions (`/platform/subscriptions`), Admin Users (`/platform/admin-users`), Support Access (`/platform/support-access`) | `features/platform/`, `app/routes/platform.jsx` | Medium |

### 2. Shared vs. Owned Rules
- **Owned:** Feature folders (e.g., `features/work/pm`), individual route arrays (e.g., `app/routes/pm.jsx`), and dedicated API wrappers (e.g., `services/api/projects.js`). The designated member edits these directly without requiring a cross-team PR.
- **Shared:** Core infrastructure files (`shared/components/*`, `layouts/`, `services/api/client.js`, `app/paths/index.js`, `app/router/index.jsx`, `context/AuthContext.jsx`). **Any modification to these files must be submitted via PR and reviewed/approved by M3.**

### 3. Cross-Member Dependencies
- **M4 and M1 API Overlap:** Both M4 (Team Member uploading evidence) and M1 (Compliance approving evidence) hit the `/evidence` backend. To prevent duplication, they must agree on a single `services/api/evidence.js` file (owned by M1, utilized by both).
- **UI Components:** Everyone depends on M3's shared foundation (`Table`, `Modal`, `FormField`, `AuthContext`). M3 must prioritize building these generic atomic components early so M1, M2, M4, and M5 can consume them instead of building redundant local UI.

### 4. Phased Execution Plan

- **Phase 0: Foundation Scaffold** 
  - *Exit Criteria:* React structure is pushed to main, `paths.js` and routing arrays exist, empty stubs load correctly, `client.js` is merged by M3.
- **Phase 1: Read-Only Dashboards & Lists**
  - *Exit Criteria:* Each member builds their list pages (e.g. `/hr/users`) fetching real API data and rendering it in basic tables.
- **Phase 2: Mutations (Create/Edit/Delete)**
  - *Exit Criteria:* Forms are wired up to POST/PATCH endpoints. Users can be created, tasks assigned, evidence uploaded, and state correctly reloads.
- **Phase 3: Cross-Role Integration Testing**
  - *Exit Criteria:* End-to-end flows (e.g. PM creates task -> Member completes -> Compliance approves) are tested manually across roles in sequence.
- **Phase 4: Polish and Demo**
  - *Exit Criteria:* Loading spinners, empty states, error boundaries, styling cleanup, and recording of the final demo video.

### 5. Git Workflow
- **Branch Naming:** Create a branch per member or feature using the format `feature/<actor>/description` (e.g., `feature/pm/create-task-form`).
- **PR Size:** Keep PRs small and targeted. Do not batch 10 pages into one PR.
- **Reviewers:** Peer-review within the team. Shared structural changes MUST be reviewed by M3.
- **Environment:** **Never commit the `.env` file.** Keep `.env.example` updated if new vars are needed.

## SECTION B: Definition of Done: What Is Needed At The End

### 1. Per-Actor Implementation Checklist
- [ ] Every page mapped in the route file is fully implemented (no stubs).
- [ ] Every API call utilizes `services/api` wrapper functions (no raw `fetch` calls inside components).
- [ ] Loading spinners (`<Loader />`), error boundaries, and empty states (`<EmptyState />`) are appropriately handled using shared components.
- [ ] Create, Edit, and Delete forms work strictly in alignment with backend capabilities.
- [ ] The `ProtectedRoute` role guard actively blocks unauthorized actor access.
- [ ] Sidebar navigation links match the actual routes defined in `paths.js`.

### 2. Whole-App System Checklist
- [ ] Login redirects each distinct role strictly to their designated dashboard.
- [ ] Logout fully clears `sessionStorage` and forces navigation back to `/login`.
- [ ] Encountering a `401 Unauthorized` API response gracefully redirects to `/login`.
- [ ] Platform Admin uses the separate login portal and maintains isolated layout wrappers.
- [ ] Running `npm run build` passes with exactly zero errors or warnings.
- [ ] No red console errors fire during standard E2E flows.
- [ ] No hardcoded string URLs exist (all routes imported from `PATHS`).
- [ ] `.env.example` remains up to date.

### 3. Cross-Role E2E Scenarios (Seeded Data)
*Use the seeded test accounts. All passwords are `password123`.*
- [ ] **Scenario A (Task -> Evidence Workflow):** 
  - PM (`pm@acme.com`) creates a task and assigns it to Team Leader (`tl@acme.com`). 
  - TL splits it into subtasks for Team Member (`employee@acme.com`). 
  - Member completes the task and uploads evidence. 
  - Compliance Officer (`compliance@acme.com`) reviews and approves the evidence.
- [ ] **Scenario B (HR Governance):** 
  - HR Manager (`hr@acme.com`) creates a new user and grants them a specific role assignment.
- [ ] **Scenario C (Process Pipeline):** 
  - Process Admin (`admin@acme.com`) builds a new template with 3 distinct steps. 
  - An instance is initiated, step 1 is approved, and step 2 is rejected (verifying the loopback mechanism to step 1).
- [ ] **Scenario D (Executive Oversight):** 
  - CEO (`ceo@acme.com`) views the executive dashboard metrics.
  - Verifies the audit log successfully tracked the actions performed in Scenarios A, B, and C.
- [ ] **Scenario E (Platform Governance):** 
  - Platform Admin (`admin@platform.com`) logs into the isolated `/platform/login` portal.
  - Views the active SaaS companies, available pricing plans, and high-level platform metrics.

### 4. Backend Readiness Checklist
- [ ] Express backend (`back-end-new`) is running cleanly on port 5500.
- [ ] PostgreSQL database is fully populated via `npm run seed`.
- [ ] Backend CORS configuration explicitly permits requests from `http://localhost:5173`.

### 5. Submission Checklist
- [ ] Root `README.md` is updated describing the full scope.
- [ ] `ARCHITECTURE.md` is present and accurate.
- [ ] Final demo video recorded showcasing all E2E scenarios.
- [ ] Relevant screenshots taken.
- [ ] All other deliverables explicitly requested by the repository's root instructions are fulfilled.

### 6. Sign-Off Matrix

| Checklist Group | Responsible Member | Final Reviewer |
|---|---|---|
| Executive & Compliance (M1) Pages | M1 | M2 |
| HR (M2) Pages | M2 | M4 |
| Process Admin & Shared UI (M3) | M3 | M1 |
| PM, TL, Member (M4) Pages | M4 | M5 |
| Platform Admin (M5) Pages | M5 | M3 |
| E2E Testing Scenarios | Team | Team |
| Final Build & Submission | M3 | M1 |

### Known Gaps
- The `src/config/nav/` directory remains unpopulated (`executive.nav.js`, `pm.nav.js`, etc., do not exist yet). Sidebars currently rely on hardcoded mock strings in Layout components.
- The `AuthContext.jsx` currently mocks user login on initialization instead of pinging `GET /auth/me` to hydrate state properly.
"""

with open("react_frontend/ARCHITECTURE.md", "a") as f:
    f.write(section_a)
