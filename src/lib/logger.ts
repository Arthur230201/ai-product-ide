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
 * 带时间戳的 console.error
 */
export const logError = (...args: any[]) => {
  if (args.length === 0) return;
  
  if (typeof args[0] === 'string') {
    console.error(formatMessage(args[0]), ...args.slice(1));
  } else {
    console.error(`[${getTimestamp()}]`, ...args);
  }
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

