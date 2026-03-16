/**
 * validatePlan 单测：合法/非法 plan、模板规则、bindings。
 */
import { validatePlan } from '../validate/validatePlan';
import { buildFallbackPlan } from '../buildFallbackPlan';
import listTemplateRules from '../registry/templates/list.json';
import type { TemplateRules } from '../validate/validatePlan';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (e) {
    console.error(`  ❌ ${name}:`, e);
    throw e;
  }
}

function assert(condition: boolean, msg?: string) {
  if (!condition) throw new Error(msg ?? 'assert failed');
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${msg ?? 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

const listRules = listTemplateRules as TemplateRules;

console.log('\n📦 validatePlan tests\n');
try {
  test('valid list fallback plan passes', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const out = validatePlan(plan, { templateRules: listRules });
    assert(out.ok === true);
    if (out.ok) assert(out.plan.sections.length >= 2);
  });
  test('wrong templateId fails', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const bad = { ...plan, template: { ...plan.template, templateId: 'form' as const } };
    const out = validatePlan(bad, { templateRules: listRules });
    assert(out.ok === false);
    if (!out.ok) assert(out.errors.some((e) => e.code === 'E_TEMPLATE_RULE_VIOLATION'));
  });
  test('invalid composite ref fails (schema or binding error)', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const bad = {
      ...plan,
      bindings: {
        ...plan.bindings,
        data: [{ id: 'dq_primary', dataQueryRef: 'invalid-ref', usage: 'primary' as const }],
      },
    };
    const out = validatePlan(bad, { templateRules: listRules });
    assert(out.ok === false);
    if (!out.ok) {
      const hasRefError = out.errors.some(
        (e) => e.code === 'E_BINDING_INVALID_COMPOSITE_REF' || e.code === 'E_SCHEMA_INVALID'
      );
      assert(hasRefError, 'expected composite ref or schema error');
    }
  });
  test('View without primary data binding fails', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const bad = { ...plan, bindings: { ...plan.bindings, data: [] } };
    const out = validatePlan(bad, { templateRules: listRules });
    assert(out.ok === false);
    if (!out.ok) assert(out.errors.some((e) => e.code === 'E_BINDING_MISSING_PRIMARY_DATA'));
  });
  console.log('\n✅ validatePlan tests passed\n');
} catch (e) {
  console.error(e);
  process.exit(1);
}
