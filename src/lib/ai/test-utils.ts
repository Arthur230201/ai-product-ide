/**
 * 简单测试工具（如果没有测试框架）
 */

export function describe(name: string, fn: () => void) {
  console.log(`\n📦 ${name}`);
  try {
    fn();
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
    throw error;
  }
}

export function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.error(`  ❌ ${name}:`, error);
    throw error;
  }
}

export function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}


