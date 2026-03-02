/**
 * Safe Preview Utilities
 * 
 * 统一安全预览工具，消灭 substring 崩溃风险
 */

/**
 * 安全预览任意值，用于日志输出
 * @param x 输入值
 * @param max 最大字符数（默认 200）
 * @returns 预览字符串
 */
export function preview(x: unknown, max: number = 200): string {
  if (x === null) return 'null';
  if (x === undefined) return 'undefined';
  
  if (typeof x === 'string') {
    if (x.length <= max) return x;
    return x.substring(0, max) + '...';
  }
  
  if (typeof x === 'number' || typeof x === 'boolean') {
    return String(x);
  }
  
  // 对象类型：尝试 JSON.stringify
  if (typeof x === 'object') {
    try {
      const json = JSON.stringify(x);
      if (json.length <= max) return json;
      return json.substring(0, max) + '...';
    } catch {
      return '[Object]';
    }
  }
  
  return String(x);
}

/**
 * 确保值为字符串类型，否则抛出错误
 * 用于需要强保证的地方（如业务逻辑中的 substring 调用）
 * @param x 输入值
 * @param name 变量名（用于错误信息）
 * @returns 字符串
 * @throws 如果 x 不是 string 类型
 */
export function ensureString(x: unknown, name: string): string {
  if (typeof x === 'string') {
    return x;
  }
  
  const type = x === null ? 'null' : x === undefined ? 'undefined' : typeof x;
  throw new Error(
    `[SafePreview] ${name} must be string, got ${type}. ` +
    `Value: ${preview(x, 100)}`
  );
}


