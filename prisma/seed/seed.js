import { PrismaClient } from '@prisma/client';
import { PLANS, PERMISSIONS, ROLE_TEMPLATES, BASELINE_COMPLIANCE_RULES } from './referenceData.js';

const prisma = new PrismaClient();

/**
 * Idempotent seeder that establishes the baseline reference data for OptiFlow.
 * Safe to execute multiple times across dev, test, staging, and production environments.
 */
export async function seedReferenceData() {
  console.log('🌱 Starting idempotent reference data seeding...');

  // 1. Seed Plans
  console.log('📦 Seeding standard subscription plans...');
  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        maxBranches: plan.maxBranches,
        maxUsers: plan.maxUsers,
        maxActiveProcessTemplates: plan.maxActiveProcessTemplates,
        maxComplianceRules: plan.maxComplianceRules,
        maxStorageMb: plan.maxStorageMb,
        auditLogRetentionDays: plan.auditLogRetentionDays,
        allowsIntegrations: plan.allowsIntegrations
      },
      create: plan
    });
  }
  console.log(`  ✓ ${PLANS.length} Plans upserted.`);

  // 2. Seed Permissions
  console.log('🔐 Seeding permissions catalogue...');
  const permissionMap = new Map();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {
        module: perm.module,
        description: perm.description
      },
      create: perm
    });
    permissionMap.set(record.slug, record.id);
  }
  console.log(`  ✓ ${PERMISSIONS.length} Permissions upserted.`);

  // 3. Seed System Role Templates & RoleTemplatePermissions
  console.log('👥 Seeding system role templates...');
  for (const tmpl of ROLE_TEMPLATES) {
    const roleTemplate = await prisma.roleTemplate.upsert({
      where: { slug: tmpl.slug },
      update: {
        label: tmpl.label,
        description: tmpl.description
      },
      create: {
        slug: tmpl.slug,
        label: tmpl.label,
        description: tmpl.description,
        origin: 'platform_predefined'
      }
    });

    // Clear existing permissions for this template and associate current set
    await prisma.roleTemplatePermission.deleteMany({
      where: { roleTemplateId: roleTemplate.id }
    });

    const templatePermissions = tmpl.permissions
      .map((slug) => permissionMap.get(slug))
      .filter(Boolean)
      .map((permissionId) => ({
        roleTemplateId: roleTemplate.id,
        permissionId
      }));

    if (templatePermissions.length > 0) {
      await prisma.roleTemplatePermission.createMany({
        data: templatePermissions,
        skipDuplicates: true
      });
    }
  }
  console.log(`  ✓ ${ROLE_TEMPLATES.length} Role Templates configured.`);

  // 4. Seed Platform Baseline Compliance Rules
  console.log('🛡️ Seeding baseline platform compliance templates...');
  const defaultCategory = await prisma.complianceCategory.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      name: 'Engineering & Operational Standards',
      description: 'Platform baseline governance and code quality standards'
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Engineering & Operational Standards',
      description: 'Platform baseline governance and code quality standards',
      companyId: null
    }
  });

  for (const rule of BASELINE_COMPLIANCE_RULES) {
    // Find or create rule by name where companyId is null
    const existing = await prisma.complianceRule.findFirst({
      where: { name: rule.name, companyId: null }
    });

    if (existing) {
      await prisma.complianceRule.update({
        where: { id: existing.id },
        data: {
          description: rule.description,
          severity: rule.severity,
          categoryId: defaultCategory.id,
          triggerEvent: rule.triggerEvent,
          conditionType: rule.conditionType,
          conditionConfig: rule.conditionConfig
        }
      });
    } else {
      await prisma.complianceRule.create({
        data: {
          name: rule.name,
          description: rule.description,
          severity: rule.severity,
          categoryId: defaultCategory.id,
          companyId: null,
          triggerEvent: rule.triggerEvent,
          conditionType: rule.conditionType,
          conditionConfig: rule.conditionConfig
        }
      });
    }
  }
  console.log(`  ✓ ${BASELINE_COMPLIANCE_RULES.length} Baseline Compliance Rules configured.`);
  console.log('✅ Seeding completed successfully.');
}

// Execute if run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedReferenceData()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
