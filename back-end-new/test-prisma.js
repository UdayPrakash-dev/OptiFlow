import { prisma } from './src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function test() {
  try {
    const passwordHash = await bcrypt.hash('SecurePassword123!', 10);
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          legalName: 'Test Company',
          status: 'Active',
        },
      });

      // 2. Create User
      const user = await tx.user.create({
        data: {
          companyId: company.id,
          fullName: 'John Doe',
          email: 'john' + Date.now() + '@testcompany.com',
          passwordHash,
        },
      });

      // 3. Create Subscription
      let effectivePlanId = null;
      const defaultPlan = await tx.plan.findFirst({ select: { id: true } });
      if (defaultPlan) {
        effectivePlanId = defaultPlan.id;
      }

      if (effectivePlanId) {
        await tx.subscription.create({
          data: {
            companyId: company.id,
            planId: effectivePlanId,
            billingCycle: 'Monthly',
            status: 'Active',
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 4. Ensure platform role templates exist
      let platformTemplates = await tx.roleTemplate.findMany({
        where: { origin: 'platform_predefined' },
      });

      if (platformTemplates.length === 0) {
        const sysTemplate = await tx.roleTemplate.create({
          data: { origin: 'platform_predefined', label: 'System Admin' },
        });
        platformTemplates = [sysTemplate];
      }

      // 5. Clone roles for company
      let sysAdminRole = null;
      for (const t of platformTemplates) {
        const role = await tx.role.create({
          data: {
            companyId: company.id,
            roleTemplateId: t.id,
            label: t.label,
            name: t.slug || t.label.toLowerCase().replace(/ /g, '_'),
            isSystem: true,
          },
        });
        if (t.label === 'System Admin') {
          sysAdminRole = role;
        }
      }

      // 6. Assign System Admin role to user
      if (sysAdminRole) {
        await tx.roleAssignment.create({
          data: {
            userId: user.id,
            roleId: sysAdminRole.id,
            scopeType: 'Company',
            scopeId: company.id,
            grantedById: user.id,
          },
        });
      }

      return { user, company, sysAdminRole };
    });
    console.log("Success");
  } catch (err) {
    console.error(err);
  }
}
test();
