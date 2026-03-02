/**
 * JSON 提取与安全解析工具
 * 解决 AI 返回拼接 JSON 或带噪声 JSON 的解析问题
 */

import { z } from 'zod';

/**
 * 从文本中提取第一个完整的 JSON 对象
 * 规则：从第一个 '{' 开始，做括号计数，找到完整 JSON 对象结束位置
 * 忽略前后噪声；只取第一个完整对象
 */
export function extractFirstJsonObject(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf('{');
  
  if (firstBrace === -1) {
    return null;
  }

  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  let startPos = firstBrace;

  for (let i = firstBrace; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        // 找到完整对象
        return trimmed.substring(startPos, i + 1);
      }
    }
  }

  // 未找到完整对象
  return null;
}

/**
 * 安全解析 JSON 并验证 Zod Schema
 * 内部：extractFirstJsonObject -> JSON.parse -> schema.safeParse
 * 失败时返回 ok:false，不抛异常
 */
export function safeParseZodJson<T>(
  text: string,
  schema: z.ZodSchema<T>
): { ok: true; data: T } | { ok: false; error: string; raw?: string } {
  try {
    // 步骤1: 提取第一个 JSON 对象
    const jsonStr = extractFirstJsonObject(text);
    
    if (!jsonStr) {
      return {
        ok: false,
        error: 'No valid JSON object found in text',
        raw: text.length > 200 ? text.substring(0, 200) + '...' : text,
      };
    }

    // 步骤2: 解析 JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      return {
        ok: false,
        error: `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        raw: jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr,
      };
    }

    // 步骤3: Zod 验证
    const result = schema.safeParse(parsed);
    
    if (result.success) {
      return { ok: true, data: result.data };
    } else {
      return {
        ok: false,
        error: `Zod validation error: ${result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')}`,
        raw: jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr,
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      raw: text.length > 200 ? text.substring(0, 200) + '...' : text,
    };
  }
}

