# OptiFlow Automated Compliance Engine
**Implementation Specification & Blueprint**

This document outlines the architecture for building the Automated Rules Engine (Pillar 1). This engine will dynamically intercept task transitions, evaluate compliance rules, and automatically block actions or generate violations.

## 1. Schema Expansion: Defining "Conditions"
Currently, our `ComplianceRule` is just a text description. To evaluate it programmatically, the engine needs machine-readable conditions.

**Schema Update (Prisma):**
```prisma
model ComplianceRule {
  // ... existing fields ...
  
  // The machine-readable evaluation criteria
  criteria  Json?    
  
  // E.g., "BLOCK_TRANSITION", "ALLOW_WITH_WARNING"
  actionOnFail String @default("BLOCK_TRANSITION") 
}
```

**Example Criteria Payload:**
```json
{
  "trigger": { "field": "status", "transitionTo": "COMPLETED" },
  "requirement": {
    "type": "EVIDENCE_REQUIRED",
    "evidenceCategory": "Security Audit"
  }
}
```

---

## 2. The Evaluator Service (`src/services/compliance.service.js`)
We will create a pure Node.js service that acts as the "brain". It takes a Task, the proposed update, and evaluates all rules bound to that project.

```javascript
import { prisma } from '../config/prisma.js';

/**
 * Intercepts a task update and evaluates all relevant compliance rules.
 * @returns { { allowed: boolean, violations: Array } }
 */
export async function evaluateTaskTransition(taskId, projectId, proposedChanges) {
  // 1. Fetch all rules bound to this project (via ComplianceBinding)
  const bindings = await prisma.complianceBinding.findMany({
    where: { scopeId: projectId },
    include: { rule: true }
  });

  const activeViolations = [];

  for (const binding of bindings) {
    const rule = binding.rule;
    if (!rule.isActive) continue;

    // 2. Evaluate criteria (Pseudocode)
    if (rule.criteria.trigger.transitionTo === proposedChanges.status) {
      
      const hasEvidence = await checkEvidenceForTask(taskId, rule.criteria.requirement);
      
      if (!hasEvidence) {
        activeViolations.push(rule);
      }
    }
  }

  return {
    allowed: activeViolations.length === 0,
    failedRules: activeViolations
  };
}
```

---

## 3. The Controller Hook (The Interceptor)
We will inject this service directly into our core workflow controllers (like `tasks.controller.js`).

**Location:** `updateTask` endpoint inside `tasks.controller.js`

```javascript
import { evaluateTaskTransition } from '../services/compliance.service.js';

export async function updateTask(req, res, next) {
  const { id } = req.params;
  const updateData = req.body;

  // ... (existing validation) ...

  // 🔴 THE INTERCEPTOR: Evaluate Compliance Before Saving
  if (updateData.status) {
    const evaluation = await evaluateTaskTransition(id, existingTask.projectId, updateData);

    if (!evaluation.allowed) {
      // 1. Auto-generate Violations in the Database
      for (const rule of evaluation.failedRules) {
        await prisma.complianceViolation.create({
          data: {
            companyId: req.user.companyId,
            ruleId: rule.id,
            entityType: 'Task',
            entityId: id,
            status: 'Open',
            severity: rule.severity
          }
        });
      }

      // 2. Block the transition and return 403 Forbidden to the Frontend
      return res.status(403).json({
        success: false,
        error: "COMPLIANCE_BLOCK",
        message: "This transition is blocked by active compliance rules.",
        violations: evaluation.failedRules
      });
    }
  }

  // 🟢 IF ALLOWED: Proceed with normal Prisma update...
  const updatedTask = await prisma.task.update({ ... });
}
```

---

## 4. The User Workflow (Resolution)
1. User drags Task to "Done" in the frontend.
2. Backend intercepts, evaluates `evaluateTaskTransition`, and generates a `ComplianceViolation`.
3. Backend returns a `403` with a specific error code.
4. Frontend catches the `403` and pops up a modal: *"You cannot complete this task until you upload Security Audit Evidence."*
5. User uploads Evidence. Compliance Officer approves it.
6. The Evidence approval auto-resolves the violation.
7. User drags Task to "Done" again. This time, `evaluateTaskTransition` passes. Task completes.
