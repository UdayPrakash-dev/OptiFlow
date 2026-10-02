const fs = require('fs');
let content = fs.readFileSync('back-end-new/prisma/seed.ts', 'utf8');

content = content.replace(/assignedToId: userDavid.id,\s*createdById: userAlice.id,/g, function(match, offset, str) {
  // check if it's inside instStep
  let prevChars = str.substring(Math.max(0, offset - 150), offset);
  if (prevChars.includes('instStep = await prisma.processInstanceStep.create')) {
      return 'assignedToId: userDavid.id,';
  }
  return match;
});

fs.writeFileSync('back-end-new/prisma/seed.ts', content);
