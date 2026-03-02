/**
 * UI Pipeline Response Normalization Test
 * 
 * Tests the normalizeUIPipelineResponse function to ensure it handles
 * all response formats correctly, including the exact tuple shape from zsa-react.
 */

import { normalizeUIPipelineResponse, type UIPipelineResponse } from './ui-pipeline-response';

// Simple test utilities
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
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(
      `${message || 'Assertion failed'}: expected ${expectedStr}, got ${actualStr}`
    );
  }
}

function assertType<T>(value: unknown, guard: (v: unknown) => v is T): asserts value is T {
  if (!guard(value)) {
    throw new Error(`Type assertion failed: ${JSON.stringify(value)}`);
  }
}

// Test cases
test('normalizeUIPipelineResponse: already valid UIPipelineResponse (success)', () => {
  const valid: UIPipelineResponse = {
    ok: true,
    type: 'UI_HTML',
    stage: 'STATIC',
    html: '<html>test</html>',
    meta: {
      componentCount: 5,
      imageCount: 3,
      hasScript: false,
      hasExternalCdn: false,
    },
  };

  const result = normalizeUIPipelineResponse(valid);
  assertEqual(result, valid);
  assertEqual(result.ok, true);
  assertEqual(result.type, 'UI_HTML');
});

test('normalizeUIPipelineResponse: already valid UIPipelineResponse (error)', () => {
  const valid: UIPipelineResponse = {
    ok: false,
    type: 'RATE_LIMIT',
    message: 'Too many requests',
    cooldownSeconds: 10,
    retryable: true,
  };

  const result = normalizeUIPipelineResponse(valid);
  assertEqual(result, valid);
  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
});

test('normalizeUIPipelineResponse: zsa-react tuple [data, null] (success case)', () => {
  const data: UIPipelineResponse = {
    ok: true,
    type: 'UI_HTML',
    stage: 'BEAUTIFY',
    html: '<html>beautified</html>',
    meta: {
      componentCount: 8,
      imageCount: 4,
      hasScript: false,
      hasExternalCdn: false,
    },
  };

  const tuple: [UIPipelineResponse, null] = [data, null];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, true);
  assertEqual(result.type, 'UI_HTML');
  if (result.ok) {
    assertEqual(result.html, data.html);
    assertEqual(result.stage, data.stage);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [null, Error] (error case)', () => {
  const error = new Error('Network error');
  const tuple: [null, Error] = [null, error];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'NETWORK');
  if (!result.ok) {
    assertEqual(result.message, 'Network error');
    assertEqual(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [undefined, Error] (error case)', () => {
  const error = new Error('Rate limit exceeded');
  (error as any).cooldownSeconds = 15;
  const tuple: [undefined, Error] = [undefined, error];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'RATE_LIMIT');
  if (!result.ok) {
    assertEqual(result.message, 'Rate limit exceeded');
    assertEqual(result.cooldownSeconds, 15);
    assertEqual(result.retryable, true);
  }
});

test('normalizeUIPipelineResponse: zsa-react tuple [data, Error] (error takes precedence)', () => {
  const data: UIPipelineResponse = {
    ok: true,
    type: 'UI_HTML',
    stage: 'STATIC',
    html: '<html>test</html>',
    meta: {
      componentCount: 1,
      imageCount: 0,
      hasScript: false,
      hasExternalCdn: false,
    },
  };
  const error = new Error('Provider error');
  const tuple: [UIPipelineResponse, Error] = [data, error];
  const result = normalizeUIPipelineResponse(tuple);

  // Error should take precedence
  assertEqual(result.ok, false);
  assertEqual(result.type, 'PROVIDER');
  if (!result.ok) {
    assertEqual(result.message, 'Provider error');
  }
});

test('normalizeUIPipelineResponse: wrapped format {result: UIPipelineResponse}', () => {
  const inner: UIPipelineResponse = {
    ok: true,
    type: 'UI_HTML',
    stage: 'INTERACT',
    html: '<html>interactive</html>',
    meta: {
      componentCount: 10,
      imageCount: 5,
      hasScript: true,
      hasExternalCdn: false,
    },
  };

  const wrapped = { result: inner, otherField: 'ignored' };
  const result = normalizeUIPipelineResponse(wrapped);

  assertEqual(result.ok, true);
  assertEqual(result.type, 'UI_HTML');
  if (result.ok) {
    assertEqual(result.html, inner.html);
    assertEqual(result.stage, inner.stage);
  }
});

test('normalizeUIPipelineResponse: nested wrapped format', () => {
  const inner: UIPipelineResponse = {
    ok: false,
    type: 'VALIDATION',
    message: 'Invalid HTML structure',
    retryable: false,
  };

  const wrapped = { result: { result: inner } };
  const result = normalizeUIPipelineResponse(wrapped);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'VALIDATION');
  if (!result.ok) {
    assertEqual(result.message, 'Invalid HTML structure');
    assertEqual(result.retryable, false);
  }
});

test('normalizeUIPipelineResponse: invalid format (fallback to PARSE error)', () => {
  const invalid = 'not an object';
  const result = normalizeUIPipelineResponse(invalid);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'PARSE');
  if (!result.ok) {
    assertEqual(result.message, 'Invalid response format from server');
    assertEqual(result.retryable, false);
  }
});

test('normalizeUIPipelineResponse: empty array (fallback)', () => {
  const result = normalizeUIPipelineResponse([]);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'PARSE');
});

test('normalizeUIPipelineResponse: array with single element (fallback)', () => {
  const result = normalizeUIPipelineResponse([{ some: 'data' }]);

  assertEqual(result.ok, false);
  assertEqual(result.type, 'PARSE');
});

test('normalizeUIPipelineResponse: array [data, null] where data is not UIPipelineResponse (recursive normalization)', () => {
  const data = {
    ok: true,
    type: 'UI_HTML',
    stage: 'STATIC',
    html: '<html>test</html>',
    meta: {
      componentCount: 1,
      imageCount: 0,
      hasScript: false,
      hasExternalCdn: false,
    },
  };
  const tuple: [typeof data, null] = [data, null];
  const result = normalizeUIPipelineResponse(tuple);

  assertEqual(result.ok, true);
  assertEqual(result.type, 'UI_HTML');
  if (result.ok) {
    assertEqual(result.html, data.html);
  }
});

// Run all tests
console.log('\n🧪 Running normalizeUIPipelineResponse tests...\n');

try {
  // All test cases above
  console.log('✅ All tests passed!\n');
} catch (error) {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}

