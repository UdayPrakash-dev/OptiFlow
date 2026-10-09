import { prisma } from './src/config/prisma.js';

async function test() {
  const logs = await prisma.auditLog.findMany({ take: 5 });
  console.log("Raw logs:", logs.map(l => ({ type: l.entityType, id: l.entityId })));

  const projectIds = new Set();
  const userIds = new Set();
  for (const log of logs) {
    if (log.entityType === "User") userIds.add(log.entityId);
  }

  const users = await prisma.user.findMany({ where: { id: { in: Array.from(userIds) } }, select: { id: true, fullName: true, email: true } });
  console.log("Found Users:", users);
  
  const userMap = new Map(users.map(u => [u.id, u.fullName || u.email]));
  console.log("User Map size:", userMap.size);

  const hydrated = logs.map(log => {
    let entityName = `${log.entityType} #${log.entityId.substring(0,8)}`;
    if (log.entityType === 'User' && userMap.has(log.entityId)) entityName = userMap.get(log.entityId);
    return entityName;
  });

  console.log("Hydrated names:", hydrated);
}

test().catch(console.error).finally(() => prisma.$disconnect());
