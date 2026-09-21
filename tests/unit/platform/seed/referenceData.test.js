import { describe, it, expect } from 'vitest';
import { PLANS, PERMISSIONS, ROLE_TEMPLATES, BASELINE_COMPLIANCE_RULES } from '../../../../prisma/seed/referenceData.js';

describe('Deterministic Reference Data Catalogue', () => {
  it('defines valid standard subscription plans with required limits', () => {
    expect(PLANS.length).toBeGreaterThanOrEqual(3);

    const planNames = PLANS.map((p) => p.name);
    expect(planNames).toContain('Starter');
    expect(planNames).toContain('Professional');
    expect(planNames).toContain('Enterprise');

    PLANS.forEach((plan) => {
      expect(typeof plan.name).toBe('string');
      expect(typeof plan.auditLogRetentionDays).toBe('number');
      expect(typeof plan.allowsIntegrations).toBe('boolean');
    });
  });

  it('contains a valid, non-overlapping permissions catalogue', () => {
    expect(PERMISSIONS.length).toBeGreaterThan(20);

    const slugs = new Set();
    PERMISSIONS.forEach((perm) => {
      expect(perm.slug).toBeTruthy();
      expect(perm.module).toBeTruthy();
      expect(perm.description).toBeTruthy();
      expect(slugs.has(perm.slug)).toBe(false); // No duplicates
      slugs.add(perm.slug);
    });
  });

  it('ensures every role template references only declared permissions in the catalogue', () => {
    const validPermissionSlugs = new Set(PERMISSIONS.map((p) => p.slug));

    expect(ROLE_TEMPLATES.length).toBeGreaterThanOrEqual(6);

    ROLE_TEMPLATES.forEach((template) => {
      expect(template.slug).toBeTruthy();
      expect(template.label).toBeTruthy();
      expect(Array.isArray(template.permissions)).toBe(true);

      // Verify no phantom/unregistered permissions
      template.permissions.forEach((slug) => {
        expect(validPermissionSlugs.has(slug)).toBe(true);
      });
    });
  });

  it('contains valid baseline compliance rules with explicit triggers and conditions', () => {
    expect(BASELINE_COMPLIANCE_RULES.length).toBeGreaterThanOrEqual(2);

    BASELINE_COMPLIANCE_RULES.forEach((rule) => {
      expect(rule.name).toBeTruthy();
      expect(rule.description).toBeTruthy();
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(rule.severity);
      expect(rule.triggerEvent).toBeTruthy();
      expect(rule.conditionType).toBeTruthy();
    });
  });
});
