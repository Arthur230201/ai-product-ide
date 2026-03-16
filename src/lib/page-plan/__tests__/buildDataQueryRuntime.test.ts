/**
 * buildDataQueryRuntimePayload 单测：mock 与 embedded rows。
 */
import {
  buildDataQueryRuntimePayload,
  runtimePayloadToScript,
} from '../render/buildDataQueryRuntime';

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

console.log('\n📦 buildDataQueryRuntime tests\n');
try {
  test('mock payload has byRef with nodeId::queryId key', () => {
    const payload = buildDataQueryRuntimePayload({
      nodeId: 'n1',
      dataQueries: [{ id: 'Q-001', description: '任务列表' }],
    });
    assert('n1::Q-001' in payload.byRef);
    const spec = payload.byRef['n1::Q-001'];
    assert(spec.source === 'mock');
    assert(spec.columns.length >= 2);
    assert(spec.rows.length >= 1);
  });

  test('embedded rowsByQueryId override mock', () => {
    const payload = buildDataQueryRuntimePayload({
      nodeId: 'n1',
      dataQueries: [{ id: 'Q-001', description: '任务' }],
      rowsByQueryId: {
        'Q-001': [
          ['行1', '状态1'],
          ['行2', '状态2'],
        ],
      },
    });
    const spec = payload.byRef['n1::Q-001'];
    assert(spec.source === 'embedded');
    assertEqual(spec.rows.length, 2);
    assertEqual(spec.rows[0], ['行1', '状态1']);
  });

  test('runtimePayloadToScript produces valid JSON script', () => {
    const payload = buildDataQueryRuntimePayload({
      nodeId: 'n1',
      dataQueries: [{ id: 'Q-001', description: 'x' }],
    });
    const script = runtimePayloadToScript(payload);
    assert(script.includes('id="data-query-runtime"'));
    assert(script.includes('byRef'));
    const inner = script.replace(/.*<script[^>]*>/, '').replace(/<\/script>.*/, '');
    const parsed = JSON.parse(inner);
    assert(parsed.byRef != null);
  });

  test('empty dataQueries yields empty byRef', () => {
    const payload = buildDataQueryRuntimePayload({
      nodeId: 'n1',
      dataQueries: [],
    });
    assertEqual(Object.keys(payload.byRef).length, 0);
  });

  console.log('\n✅ buildDataQueryRuntime tests passed\n');
} catch (e) {
  console.error(e);
  process.exit(1);
}
