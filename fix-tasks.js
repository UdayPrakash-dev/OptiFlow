const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/seed.ts', 'utf8');

content = content.replace(/assignedToId: betaMember.id,/g, 'assignedToId: betaMember.id, createdById: betaCeo.id,');
content = content.replace(/assignedToId: userDavid.id,/g, 'assignedToId: userDavid.id, createdById: userAlice.id,');
content = content.replace(/assignedToId: userKiran.id,/g, 'assignedToId: userKiran.id, createdById: userAlice.id,');

fs.writeFileSync('back-end-new/prisma/seed.ts', content);
