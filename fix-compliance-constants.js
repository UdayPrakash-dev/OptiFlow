const fs = require('fs');
const constants = `
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'text/csv', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const ALLOWED_VIOLATION_STATUSES = ['Open', 'Under_Review', 'Resolved', 'Ignored'];
const ALLOWED_EVIDENCE_STATUSES = ['Pending', 'Under_Review', 'Approved', 'Rejected'];
`;

['rules', 'violations', 'evidence'].forEach(mod => {
    let file = "back-end-new/src/controllers/compliance-" + mod + ".controller.js";
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace("import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';", "import { createAuditLog, AUDIT_ACTIONS } from '../utils/audit.js';\n" + constants);
    fs.writeFileSync(file, content);
});

