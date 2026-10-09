# OptiFlow Compliance Architecture & Roadmap

## 1. Current Architecture Overview
Currently, OptiFlow's Compliance module consists of:
- **ComplianceCategory**: Logical grouping of rules (e.g., "Data Privacy", "Access Control").
- **ComplianceRule**: The actual control requirement. Supports both `Automated` (SQL/API based) and `Manual` evaluation.
- **ComplianceViolation**: Record of a rule failure. Can be manually resolved ("Manual Override") or resolved through evidence submission.
- **EvidenceSubmission**: Files/text uploaded by users to prove a manual control is met. Compliance officers review and Accept/Reject.

## 2. What We Should Consider (Next Steps)
To make OptiFlow enterprise-ready for SOC2, ISO 27001, and HIPAA compliance, we need to implement the following core features:

### A. Control Framework Mapping
- **Concept**: Internal rules should map to standardized frameworks.
- **Implementation**: Add an array of `frameworkControls` (e.g., `["SOC2:CC6.1", "ISO27001:A.9.2.1"]`) to `ComplianceRule`. This allows generating framework-specific readiness reports.

### B. Automated Evidence Collection Workflows
- **Concept**: Manual controls (e.g., "Quarterly Access Review") require periodic evidence.
- **Implementation**: A cron job/scheduler that reads rule frequency (e.g., `QUARTERLY`) and automatically generates `EvidenceRequest` tasks assigned to specific Team Leads or System Admins.

### C. Remediation Task Generation
- **Concept**: A violation shouldn't just sit in a dashboard; it needs to be fixed.
- **Implementation**: When a `ComplianceViolation` is triggered, OptiFlow should auto-create a `Task` (assigned to the system owner) with a due date based on the rule's severity SLA.

### D. Immutability & Audit Trail (Critical)
- **Concept**: Auditors require proof that compliance records haven't been tampered with by DB admins.
- **Implementation**: 
  - Every time a violation is Manually Overridden or Evidence is Approved, append a record to a tamper-evident `AuditLog` table.
  - Track *who* did it, *when*, and their *justification/resolutionRemarks*.

### E. Risk & Severity Scoring
- **Concept**: Not all violations are equal.
- **Implementation**: Introduce `severity` (Critical, High, Medium, Low) and `impact` scores to `ComplianceRule`. The Dashboard should prioritize violations by severity SLA (e.g., Critical must be resolved in 24h).

## 3. How to Build This From Our Current Architecture
*Tomorrows Implementation Plan*

**Step 1: Database Schema Expansion (schema.prisma)**
We will extend the Prisma schema to support scheduling and tasks:
```prisma
model ComplianceRule {
  // Existing fields...
  severity       String?   // HIGH, MED, LOW
  frameworks     String[]  // ['SOC2', 'GDPR']
  reviewSchedule String?   // 'MONTHLY', 'QUARTERLY'
}
```

**Step 2: Remediation Integration**
In the backend rule engine (`backend/src/services/AutomatedRuleEngine.js`), when creating a `ComplianceViolation`, we will simultaneously inject a task via the `TaskController` so the PM or Team Lead immediately sees it in their inbox.

**Step 3: Audit Log Middleware**
We will implement an Express middleware `auditLogger` specifically for the `/compliance-violations` and `/evidence` endpoints. Any `PATCH` or `POST` will automatically insert a read-only log in the `AuditLog` table.

**Step 4: Continuous Monitoring (Cron Job)**
Setup `node-cron` in the backend that runs `AutomatedRuleEngine.runAllRules()` every night at midnight to provide real-time dashboard metrics the next morning.
