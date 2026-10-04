import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      roleAssignments: {
        include: { role: true }
      }
    }
  });

  users.forEach(u => {
    const roles = u.roleAssignments.map(ra => ra.role?.label || 'unknown').join(', ');
    console.log(`Email: ${u.email} | Name: ${u.fullName} | Roles: ${roles}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
