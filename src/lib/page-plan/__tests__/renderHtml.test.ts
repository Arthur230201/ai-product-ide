/**
 * renderHtml 单测：无任意值 []、含 data-data-query-ref、view-state-container。
 */
import { renderHtml } from '../render/renderHtml';
import { buildFallbackPlan } from '../buildFallbackPlan';

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

console.log('\n📦 renderHtml tests\n');
try {
  test('output contains no Tailwind arbitrary value brackets', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const html = renderHtml(plan);
    assert(!html.includes('min-h-[') && !html.includes('w-['), 'should not contain [] arbitrary values');
  });

  test('list with dataQueries emits data-data-query-ref and data-view-state-container', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const html = renderHtml(plan, {
      dataQueries: [{ id: 'Q-001', description: '任务列表' }],
    });
    assert(html.includes('data-data-query-ref="n1::Q-001"'));
    assert(html.includes('data-view-state-container'));
    assert(html.includes('data-state-block="content"'));
    assert(html.includes('data-state-block="loading"'));
  });

  test('output is full HTML with doctype and body', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const html = renderHtml(plan);
    assert(html.startsWith('<!DOCTYPE html>'));
    assert(html.includes('<body'));
    assert(html.includes('</body>'));
  });

  test('data-query-runtime script when dataQueries provided', () => {
    const plan = buildFallbackPlan({
      pageId: 'n1',
      pageType: 'View',
      title: '列表',
      templateId: 'list',
      dataQueryIds: ['Q-001'],
      eventIds: [],
    });
    const html = renderHtml(plan, {
      dataQueries: [{ id: 'Q-001', description: '查询' }],
    });
    assert(html.includes('id="data-query-runtime"'));
    assert(html.includes('byRef'));
  });

  console.log('\n✅ renderHtml tests passed\n');
} catch (e) {
  console.error(e);
  process.exit(1);
}
