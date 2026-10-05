# Automated Compliance Engine: End-to-End Architecture

This document explains the technical architecture of the automated compliance module in OptiFlow, detailing how the database (Prisma), the backend Node.js APIs, the custom Compliance Engine, and the React frontend work together.

---

## 1. The Prisma Database Layer
At the core of the compliance module are 5 Prisma models located in `back-end-new/prisma/schema.prisma`. Prisma acts as our ORM (Object-Relational Mapper), allowing us to interact with our PostgreSQL database using JavaScript objects instead of raw SQL strings.

### The Models & Their Relationships
* **`ComplianceCategory`**: A simple grouping mechanism (e.g., "Data Privacy", "Security").
* **`ComplianceRule`**: The definition of a specific policy. It holds metadata like `name`, `description`, `severity`, and `isActive`. 
  * *Relation:* It belongs to a `Company` and a `ComplianceCategory`.
* **`ComplianceBinding`**: This bridges the gap between a generic rule and a specific entity. It tells the system *where* a rule applies using a polymorphic approach (`scopeType` and `scopeId`).
  * *Relation:* A `ComplianceRule` can have multiple `ComplianceBinding`s (e.g., Rule A applies to Team X and Branch Y).
* **`ComplianceViolation`**: The actual "flag" generated when a rule is broken. It links back to the rule that was broken, and the entity that broke it (`entityType` and `entityId`).
  * *Relation:* Contains status states (`Open`, `Resolved`) and tracks who resolved it.
* **`ComplianceEvidence`**: Files or notes attached to a violation by a user to prove the issue was fixed.
  * *Relation:* Belongs to a `ComplianceViolation`.

---

## 2. The Backend Node.js Layer

The backend is built on Express.js and divided into Routes, Controllers, and the Engine.

### A. Routes (`src/routes/compliance-*.routes.js`)
These files map HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`) to specific URLs (e.g., `/api/compliance-rules`). 
* **Role:** They act as the "entry gates." They use middleware like `authenticate` (to verify the JWT token) and `requireRoles` (to ensure only Compliance Officers or Company Owners can access them) before passing the request to a Controller.

### B. Controllers (`src/controllers/compliance-*.controller.js`)
Controllers handle the business logic for standard CRUD (Create, Read, Update, Delete) operations.
* **Role:** When the React frontend sends a JSON payload to create a new rule, the `createComplianceRule` function inside the controller validates the data, uses `prisma.complianceRule.create()` to insert it into the database, and returns a 201 Created response.

### C. The Engine (`src/engine/compliance.engine.js`)
This is the "Brain" of the automated system. Standard controllers wait for a user to click something. The **Engine** proactively scans the database.
* **How it works:** 
  1. The engine fetches all `ComplianceRule`s where `isActive` is `true`.
  2. Because rules are dynamically created by users (meaning we don't have hardcoded SQL strings in the database), the engine uses **keyword pattern matching** on the rule's `name` to determine which *Evaluator Function* to use.
  3. If a rule's name contains "overdue", it routes it to the `checkOverdueTasks` evaluator.
  4. The evaluator function uses `prisma.task.findMany()` to query for tasks where `dueDate < new Date()` and `status != 'Completed'`.
  5. For every violating task found, it uses `prisma.complianceViolation.findFirst()` to see if an `Open` flag already exists. If not, it uses `prisma.complianceViolation.create()` to generate a new flag.

---

## 3. End-to-End Technical Flow (How it all connects)

Here is the exact lifecycle of an automated compliance check:

1. **Rule Creation (Frontend -> Backend):** 
   A Compliance Officer uses the React UI to create a rule named "Block Overdue Tasks". The React app (`apiClient`) sends a `POST` request to `/api/compliance-rules`. The Controller saves this in the Prisma DB.
2. **Binding Creation:** 
   The Officer binds this rule to "Project Alpha". A `ComplianceBinding` record is created linking the Rule ID to the Project ID.
3. **Engine Trigger:** 
   The engine is triggered (either manually via the `/api/compliance-rules/run-engine` endpoint, or via an automated Node-Cron job running at midnight).
4. **Evaluation:** 
   The `compliance.engine.js` script reads the rule, sees the word "overdue", and executes the JavaScript evaluator function.
5. **Database Scanning (Prisma):** 
   The evaluator queries PostgreSQL (via Prisma) for any tasks inside "Project Alpha" that are past their due date. It finds Task #105.
6. **Violation Generation:** 
   The engine creates a `ComplianceViolation` row in the database, attaching it to Task #105 and marking it `Open` with `High` severity.
7. **Dashboard Update (Backend -> Frontend):** 
   When the Compliance Officer refreshes the React Compliance Dashboard, the React component fetches from `/api/compliance-violations`. The backend queries Prisma, returns the JSON array of violations, and the React UI renders a red alert card showing that Task #105 broke the rules.
8. **Resolution:** 
   The Officer fixes the task, uploads a screenshot, and clicks "Resolve". React sends a `PATCH` request to update the violation status to `Resolved` and creates a `ComplianceEvidence` record in the database.

---

## 4. Scalability & Future Automation Plan (V2)

### The Current MVP Approach (Hybrid Engine)
Currently, the engine relies on hardcoded evaluator functions mapped to specific rule names (e.g., "Overdue Tasks"). 
- **System Templates:** The frontend provides a dropdown of pre-defined rules that the backend engine is programmed to understand and automate.
- **Custom Policies:** Users can create custom text-based rules (e.g., "Must wear blue shirts"). These are ignored by the automated engine and require manual auditing and violation flagging by human officers.

### The V2 Architecture (Fully Generic Engine)
To allow users to create completely custom automated rules without developer intervention, the architecture will evolve to a generic AST (Abstract Syntax Tree) or JSON Logic system:
1. **Schema Update:** `ComplianceRule` will receive a `logic` field (e.g., `JSONB`) storing the exact query structure (e.g., `{"entity": "Project", "field": "budget", "operator": ">", "value": 5000}`).
2. **Visual Query Builder:** The React frontend will feature a drag-and-drop rule builder to construct this JSON safely.
3. **Dynamic Query Compilation:** The Node.js engine will parse the JSON `logic` field and dynamically construct Prisma `where` clauses (`prisma[entity].findMany(buildWhere(logic))`), making the engine infinitely scalable to any data model.
