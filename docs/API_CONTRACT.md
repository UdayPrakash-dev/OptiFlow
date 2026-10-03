# OptiFlow API Contract

All endpoints follow camelCase naming conventions for request/response fields and return standard envelopes:
* **Success Envelope:** `{ "success": true, "data": ... }`
* **Error Envelope:** `{ "success": false, "statusCode": ..., "message": "...", "timestamp": "..." }`

---

## 1. Health & Meta

### `GET /health`
* **Auth:** Public
* **Purpose:** System liveness and database connectivity ping.
* **Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "uptime": 12.34,
    "timestamp": "2026-10-02T12:00:00.000Z"
  }
}
```

### `GET /api`
* **Auth:** Public
* **Purpose:** Central API status check.

---

## 2. Authentication & Tenant Onboarding

### `POST /auth/login` (and `/api/auth/login`)
* **Auth:** Public (Rate limited: 10 req / 15 min)
* **Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
* **Response (200):** `{ "success": true, "data": { "token": "jwt...", "user": { "id": "...", "email": "...", "fullName": "...", "role": "company_owner" } } }`

### `POST /auth/register-company` (and `/api/auth/register-company`)
* **Auth:** Public
* **Body:**
```json
{
  "companyName": "Acme Corp",
  "ownerFullName": "Jane Doe",
  "email": "jane@acme.com",
  "password": "SecurePassword123!",
  "planId": "optional-plan-uuid"
}
```
* **Response (201):** `{ "success": true, "message": "Company registered successfully", "data": { "company": { ... }, "user": { ... }, "token": "..." } }`

### `GET /auth/me` (and `/api/auth/me`)
* **Auth:** Tenant Bearer JWT
* **Response (200):** `{ "success": true, "data": { "id": "...", "email": "...", "fullName": "...", "companyId": "...", "role": "..." } }`

### `GET /public/plans` (and `/api/public/plans`)
* **Auth:** Public
* **Purpose:** Retrieve active pricing plans for registration.

---

## 3. Users, Roles, Branches & Teams

### `GET /users` & `GET /api/users`
* **Auth:** Tenant Bearer JWT (Company Owner, System Admin, HR Manager, Branch Manager)
* **Query:** `?branchId=...`

### `POST /users` & `POST /api/users`
* **Auth:** Tenant Bearer JWT (Company Owner, System Admin, HR Manager)
* **Body:** `{ "email": "new@acme.com", "password": "...", "fullName": "New User", "jobTitle": "Engineer", "role": "team_member", "branchId": "..." }`

### `GET /users/:id` / `PATCH /users/:id` / `DELETE /users/:id`
* **Auth:** Tenant Bearer JWT

### `GET /org/branches` / `POST /org/branches` / `GET /org/teams` / `POST /org/teams`
* **Auth:** Tenant Bearer JWT (scoped strictly to caller's companyId)

---

## 4. Projects

### `GET /projects` & `GET /api/projects`
* **Auth:** Tenant Bearer JWT
* **Query:** `?branchId=...`
* **Response (200):** Array of company-scoped projects.

### `GET /projects/:id`
* **Auth:** Tenant Bearer JWT (enforces tenant isolation)

### `POST /projects`
* **Auth:** Tenant Bearer JWT (Company Owner, System Admin, Project Manager, Branch Manager)
* **Body:** `{ "name": "Project Alpha", "teamId": "...", "startDate": "...", "targetDate": "..." }`

### `PATCH /projects/:id` / `DELETE /projects/:id`
* **Auth:** Tenant Bearer JWT

---

## 5. Tasks, Subtasks & Escalations

### `GET /tasks` & `GET /api/tasks`
* **Auth:** Tenant Bearer JWT (Regular members scoped to assigned tasks, managers scoped to branch/company).

### `POST /tasks`
* **Auth:** Tenant Bearer JWT (Company Owner, System Admin, PM, Branch Manager, Team Lead)
* **Body:** `{ "title": "Build API", "projectId": "...", "priority": "High", "assignedToId": "..." }`

### `PATCH /tasks/:id` / `DELETE /tasks/:id`
* **Auth:** Tenant Bearer JWT

### Subtasks: `GET /subtasks`, `POST /subtasks`, `PATCH /subtasks/:id`, `DELETE /subtasks/:id`
* **Auth:** Tenant Bearer JWT

### Escalations: `GET /escalations`, `POST /escalations`, `PATCH /escalations/:id`, `DELETE /escalations/:id`
* **Auth:** Tenant Bearer JWT (Any member can report blocker; managers can update/resolve).

---

## 6. Notifications, Compliance & Evidence

### Notifications:
* `GET /notifications` (lists user's notifications or company notifications for managers)
* `POST /notifications` (create notification)
* `PATCH /notifications/:id/read` (mark notification as read)
* `POST /notifications/read-all` (mark all user notifications as read)

### Compliance Rules:
* `GET /compliance-rules`, `GET /compliance-rules/:id`
* `POST /compliance-rules`, `PATCH /compliance-rules/:id`, `DELETE /compliance-rules/:id`

### Compliance Violations:
* `GET /compliance-violations`, `GET /compliance-violations/:id`
* `POST /compliance-violations`, `PATCH /compliance-violations/:id`, `DELETE /compliance-violations/:id`

### Compliance Evidence & File Handling:
* `GET /evidence`, `GET /evidence/:id`
* `POST /evidence` (submit evidence with taskId / violationId)
* `POST /evidence/:id/upload` (real multipart upload via Multer, creates Attachment record, sets fileUrl)
* `GET /evidence/:id/file` (safe authenticated file stream with tenant isolation)
* `PATCH /evidence/:id` (approving evidence auto-resolves linked compliance violation)
* `DELETE /evidence/:id`

---

## 7. Process Engine (Templates, Instances, Steps & Transitions)

### Process Templates:
* `GET /process-templates` & `GET /processes/templates` (lists company process templates with steps)
* `GET /process-templates/:id` & `GET /processes/templates/:id`
* `POST /process-templates` & `POST /processes/templates` (creates template with nested ordered steps in transaction)
* `PATCH /process-templates/:id` & `PATCH /processes/templates/:id`
* `DELETE /process-templates/:id` & `DELETE /processes/templates/:id`
* `GET /processes/templates/:id/steps` & `POST /processes/templates/:id/steps`

### Process Instances:
* `GET /process-instances` & `GET /processes/instances` (filter by templateId, projectId)
* `GET /process-instances/:id` & `GET /processes/instances/:id`
* `POST /process-instances` & `POST /processes/instances` (instantiates process from template, initializes instance steps to Pending and first step to Active)
* `PATCH /process-instances/:id` & `PATCH /processes/instances/:id` (status updates: Cancelled, Completed, Active)
* `DELETE /process-instances/:id` & `DELETE /processes/instances/:id`

### Step Actions & State Machine Transitions:
* `GET /process-instance-steps` & `GET /process-instance-steps/:id`
* `POST /process-instance-steps`
* `PATCH /process-instance-steps/:id/action` & `PATCH /processes/steps/:id/action`
  * **Approved:** Advances instance `currentStepId` to next ordered step. If final step, completes instance (`status: 'Completed'`, `completedAt: now()`).
  * **Rejected:** If `onRejectGotoStepId` is defined, resets target step to `Pending` and updates `currentStepId` back to target step. If no loopback, marks instance as `Rejected`.
  * **Role Restriction:** Only assigned user or manager/admin/owner can action assigned step.

---

## 8. Platform Administration (Platform Admin Only)

### `POST /platform/auth/login` (and `/api/platform/auth/login`)
* **Auth:** Public
* **Body:** `{ "email": "admin@optiflow.com", "password": "..." }`
* **Response (200):** Returns Platform Admin JWT with `role: 'platform_admin'`.

### `GET /platform/auth/me`
* **Auth:** Platform Admin JWT

### `GET /platform/metrics`
* **Auth:** Platform Admin JWT
* **Returns:** Total companies, active subscriptions grouped by plan, active support access, total admins.

### `GET /platform/companies` / `GET /platform/companies/:id` / `PATCH /platform/companies/:id`
* **Auth:** Platform Admin JWT

### `GET /platform/plans` / `POST /platform/plans` / `PATCH /platform/plans/:id`
* **Auth:** Platform Admin JWT

### `GET /platform/subscriptions` / `POST /platform/subscriptions`
* **Auth:** Platform Admin JWT

### `GET /platform/admin-users` / `POST /platform/admin-users` / `PATCH /platform/admin-users/:id` / `DELETE /platform/admin-users/:id`
* **Auth:** Platform Admin JWT (prevents deactivating last active administrator).
