/**
 * JSON 提取工具测试
 */

import { extractFirstJsonObject, safeParseZodJson } from './json-extract';
import { z } from 'zod';

// 简单测试工具（如果没有测试框架）
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}:`, error);
    throw error;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertNull(actual: unknown, message?: string) {
  if (actual !== null) {
    throw new Error(`${message || 'Assertion failed'}: expected null, got ${JSON.stringify(actual)}`);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// 测试用例
function runTests() {
  console.log('\n📦 extractFirstJsonObject Tests');
  test('纯 JSON：{"a":1}', () => {
    const result = extractFirstJsonObject('{"a":1}');
    assertEqual(result, '{"a":1}');
  });

  test('拼接 JSON：{"a":1}{"b":2}', () => {
    const result = extractFirstJsonObject('{"a":1}{"b":2}');
    assertEqual(result, '{"a":1}');
  });

  test('带噪声：xxx {"a":1} yyy {"b":2}', () => {
    const result = extractFirstJsonObject('xxx {"a":1} yyy {"b":2}');
    assertEqual(result, '{"a":1}');
  });

  test('空字符串返回 null', () => {
    const result = extractFirstJsonObject('');
    assertNull(result);
  });

  test('无 JSON 对象返回 null', () => {
    const result = extractFirstJsonObject('just text');
    assertNull(result);
  });

  test('嵌套对象', () => {
    const result = extractFirstJsonObject('{"a": {"b": 2}}');
    assertEqual(result, '{"a": {"b": 2}}');
  });

  test('包含字符串中的花括号', () => {
    const result = extractFirstJsonObject('{"a": "text with { brace" }');
    assertEqual(result, '{"a": "text with { brace" }');
  });

  console.log('\n📦 safeParseZodJson Tests');
  const TestSchema = z.object({
    a: z.number(),
    b: z.string().optional(),
  });

  test('纯 JSON 解析成功', () => {
    const result = safeParseZodJson('{"a":1}', TestSchema);
    assert(result.ok === true);
    if (result.ok) {
      assertEqual(result.data, { a: 1 });
    }
  });

  test('拼接 JSON 只取第一个', () => {
    const result = safeParseZodJson('{"a":1}{"b":2}', TestSchema);
    assert(result.ok === true);
    if (result.ok) {
      assertEqual(result.data, { a: 1 });
    }
  });

  test('带噪声 JSON 解析成功', () => {
    const result = safeParseZodJson('xxx {"a":1, "b":"test"} yyy', TestSchema);
    assert(result.ok === true);
    if (result.ok) {
      assertEqual(result.data, { a: 1, b: 'test' });
    }
  });

  test('无效 JSON 返回错误', () => {
    const result = safeParseZodJson('not json', TestSchema);
    assert(result.ok === false);
    if (!result.ok) {
      assert(result.error.includes('No valid JSON object'));
    }
  });

  test('Zod 验证失败返回错误', () => {
    const result = safeParseZodJson('{"a":"not a number"}', TestSchema);
    assert(result.ok === false);
    if (!result.ok) {
      assert(result.error.includes('Zod validation error'));
    }
  });
}

