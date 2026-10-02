const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/seed.ts', 'utf8');

// The project creations omit createdById.
// We will simply inject it into the data block.
content = content.replace(/name: "Beta Mobile App \(Project Phoenix\)",/g, 'name: "Beta Mobile App (Project Phoenix)", createdById: betaCeo.id,');
content = content.replace(/name: "Acme Cloud Infrastructure \(Project Atlas\)",/g, 'name: "Acme Cloud Infrastructure (Project Atlas)", createdById: userAlice.id,');
content = content.replace(/name: "Q3 Marketing Campaign",/g, 'name: "Q3 Marketing Campaign", createdById: userAlice.id,');
content = content.replace(/name: "Mobile App V2",/g, 'name: "Mobile App V2", createdById: userAlice.id,');
content = content.replace(/name: "SOC2 Compliance Audit",/g, 'name: "SOC2 Compliance Audit", createdById: userAlice.id,');
content = content.replace(/name: "CRM Migration",/g, 'name: "CRM Migration", createdById: userAlice.id,');

fs.writeFileSync('back-end-new/prisma/seed.ts', content);
