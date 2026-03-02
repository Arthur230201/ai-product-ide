/**
 * 带时间戳的日志工具
 * 自动为所有日志输出添加时间戳，方便调试和追踪
 */

const getTimestamp = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const formatMessage = (message: string): string => {
  return `[${getTimestamp()}] ${message}`;
};

/**
 * 带时间戳的 console.log
 */
export const log = (...args: any[]) => {
  if (args.length === 0) return;
  
  // 如果第一个参数是字符串，添加时间戳
  if (typeof args[0] === 'string') {
    console.log(formatMessage(args[0]), ...args.slice(1));
  } else {
    // 否则在开头添加时间戳
    console.log(`[${getTimestamp()}]`, ...args);
  }
};

/**
 * 从错误堆栈中提取第一行（第一个堆栈帧）
 */
const getFirstLineOfStack = (stack: string | undefined): string | undefined => {
  if (!stack) return undefined;
  const lines = stack.split('\n');
  // 第一行通常是错误消息（如 "Error: ..."），第二行是第一个堆栈帧
  // 返回第一个有意义的堆栈帧（跳过空行）
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (line && line.length > 0) {
      return line;
    }
  }
  return undefined;
};

/**
 * 格式化错误对象，提取关键信息
 */
const formatError = (error: Error): {
  message: string;
  name: string;
  code?: string | number;
  firstLineOfStack?: string;
  fullStack?: string;
} => {
  const result: ReturnType<typeof formatError> = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
  };

  // 提取 code（可能是字符串或数字）
  if ('code' in error && error.code !== undefined) {
    result.code = error.code as string | number;
  }

  // 提取堆栈信息
  if (error.stack) {
    result.firstLineOfStack = getFirstLineOfStack(error.stack);
    
    // 只有在 DEBUG_STACK=1 时才包含完整堆栈
    // 兼容浏览器和 Node.js 环境
    const debugStack = typeof process !== 'undefined' && process.env?.DEBUG_STACK === '1';
    if (debugStack) {
      result.fullStack = error.stack;
    }
  }

  return result;
};

/**
 * 带时间戳的 console.error
 * 
 * 默认行为（DEBUG_STACK 未设置或不为 '1'）：
 * - 对于 Error 对象：只打印 message / name / code / firstLineOfStack
 * - 对于其他类型：保持原样打印
 * 
 * 详细模式（DEBUG_STACK=1）：
 * - 对于 Error 对象：打印完整信息包括 fullStack
 */
export const logError = (...args: any[]) => {
  if (args.length === 0) return;
  
  const timestamp = formatMessage('');
  const timestampPrefix = timestamp.replace(/\]$/, ''); // 移除末尾的 ]
  
  // 如果第一个参数是字符串，直接添加时间戳
  if (typeof args[0] === 'string') {
    console.error(formatMessage(args[0]), ...args.slice(1));
    return;
  }
  
  // 如果第一个参数是 Error 对象，格式化输出
  if (args[0] instanceof Error) {
    const error = args[0];
    const formatted = formatError(error);
    
    // 构建错误信息对象
    const errorInfo: Record<string, any> = {
      message: formatted.message,
      name: formatted.name,
    };
    
    if (formatted.code !== undefined) {
      errorInfo.code = formatted.code;
    }
    
    if (formatted.firstLineOfStack) {
      errorInfo.stack = formatted.firstLineOfStack;
    }
    
    // 如果有完整堆栈（DEBUG_STACK=1），也包含它
    if (formatted.fullStack) {
      errorInfo.fullStack = formatted.fullStack;
    }
    
    // 如果有额外的参数，也包含它们
    if (args.length > 1) {
      errorInfo.context = args.slice(1);
    }
    
    console.error(`${timestampPrefix} ❌`, errorInfo);
    return;
  }
  
  // 其他情况：保持原样，只添加时间戳
  console.error(`[${getTimestamp()}]`, ...args);
};

/**
 * 带时间戳的 console.warn
 */
export const logWarn = (...args: any[]) => {
  if (args.length === 0) return;
  
  if (typeof args[0] === 'string') {
    console.warn(formatMessage(args[0]), ...args.slice(1));
  } else {
    console.warn(`[${getTimestamp()}]`, ...args);
  }
};

/**
 * 带时间戳的 console.info
 */
export const logInfo = (...args: any[]) => {
  if (args.length === 0) return;
  
  if (typeof args[0] === 'string') {
    console.info(formatMessage(args[0]), ...args.slice(1));
  } else {
    console.info(`[${getTimestamp()}]`, ...args);
  }
};

