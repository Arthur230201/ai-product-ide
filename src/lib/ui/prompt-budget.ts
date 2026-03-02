/**
 * Prompt Budget
 * 强制预算裁剪，避免15万token爆炸
 */

/**
 * 裁剪文本到指定最大长度，超出部分截断并在尾部追加标记
 * @param input 输入文本
 * @param maxChars 最大字符数（默认12000，约3000 tokens）
 * @returns 裁剪后的文本
 */
export function clampText(input: string, maxChars: number = 12000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  if (input.length <= maxChars) {
    return input;
  }
  
  // 尝试在单词边界截断
  const truncated = input.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastSpace, lastNewline, maxChars - 100);
  
  return truncated.substring(0, cutPoint) + '\n...<clamped>';
}

/**
 * 安全转换为字符串，非string类型返回fallback
 * @param x 输入值
 * @param fallback 默认值（默认空字符串）
 * @returns 字符串
 */
export function safeString(x: unknown, fallback: string = ''): string {
  if (typeof x === 'string') {
    return x;
  }
  if (x === null || x === undefined) {
    return fallback;
  }
  // 尝试转换为字符串
  try {
    return String(x);
  } catch {
    return fallback;
  }
}

/**
 * 确保值为字符串类型，否则抛出错误
 * 用于server action输出，确保类型安全
 * @param x 输入值
 * @param name 变量名（用于错误信息）
 * @returns 字符串
 * @throws 如果x不是string类型
 */
export function ensureStringOrThrow(x: unknown, name: string): string {
  if (typeof x === 'string') {
    return x;
  }
  
  const type = x === null ? 'null' : x === undefined ? 'undefined' : typeof x;
  throw new Error(
    `[PromptBudget] ${name} must be string, got ${type}. ` +
    `Value: ${JSON.stringify(x).substring(0, 100)}`
  );
}

/**
 * 估算token数（粗略：1 token ≈ 4 字符）
 */
export function estimateTokens(text: string): number {
  return Math.ceil((text || '').length / 4);
}

/**
 * Prompt 片段（用于预算控制）
 */
export interface PromptPart {
  id: string;
  content: string;
  priority: number; // 优先级：1=必须保留, 2=重要, 3=可选, 4=可丢弃
  description?: string;
}

/**
 * 构建带预算控制的 prompt
 * @param parts Prompt 片段数组（按优先级排序）
 * @param maxTokens 最大 token 数
 * @returns 构建后的 prompt 和丢弃的片段信息
 */
export function buildWithBudget(
  parts: PromptPart[],
  maxTokens: number
): {
  prompt: string;
  droppedParts: string[];
  tokenEstimate: number;
} {
  const droppedParts: string[] = [];
  let currentPrompt = '';
  let currentTokens = 0;
  
  // 按优先级排序：priority 越小越重要
  const sortedParts = [...parts].sort((a, b) => a.priority - b.priority);
  
  for (const part of sortedParts) {
    const partTokens = estimateTokens(part.content);
    const newTotalTokens = currentTokens + partTokens;
    
    // Priority 1 必须保留，即使超预算
    if (part.priority === 1) {
      currentPrompt += (currentPrompt ? '\n\n' : '') + part.content;
      currentTokens = newTotalTokens;
      continue;
    }
    
    // 其他优先级：如果超预算则丢弃
    if (newTotalTokens > maxTokens) {
      droppedParts.push(`${part.id} (priority ${part.priority}${part.description ? `: ${part.description}` : ''})`);
      continue;
    }
    
    currentPrompt += (currentPrompt ? '\n\n' : '') + part.content;
    currentTokens = newTotalTokens;
  }
  
  return {
    prompt: currentPrompt,
    droppedParts,
    tokenEstimate: currentTokens,
  };
}

/**
 * 记录 prompt 统计信息（用于日志和监控）
 */
export interface PromptStats {
  chars: number;
  tokenEstimate: number;
  partsCount: number;
  droppedPartsCount: number;
  droppedParts?: string[];
}

/**
 * 分析并记录 prompt 统计
 */
export function analyzePrompt(
  prompt: string,
  droppedParts: string[] = []
): PromptStats {
  return {
    chars: prompt.length,
    tokenEstimate: estimateTokens(prompt),
    partsCount: 0, // 需要调用方传入
    droppedPartsCount: droppedParts.length,
    droppedParts: droppedParts.length > 0 ? droppedParts : undefined,
  };
}

