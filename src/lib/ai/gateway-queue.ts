/**
 * Central Gateway Queue + Deduplication
 * 
 * Features:
 * - In-flight deduplication (same key returns same promise)
 * - Provider-level concurrency limit (default: 1)
 * - FIFO queue (when busy, wait)
 * - Metrics: queuedMs, dedupHit
 */

import { log } from '@/lib/logger';

export type GatewayTaskKey = string;

export interface GatewayMetrics {
  queuedMs: number;
  dedupHit: boolean;
  waitStartMs?: number;
}

/**
 * Gateway Queue Error (包装错误，携带 metrics)
 * 失败时也能精确知道 queuedMs（到底是排队慢还是 provider 慢）
 */
export type GatewayQueueError = {
  __gatewayQueueError: true;
  error: unknown;
  metrics: GatewayMetrics;
};

export function isGatewayQueueError(x: unknown): x is GatewayQueueError {
  return (
    !!x &&
    typeof x === 'object' &&
    (x as any).__gatewayQueueError === true &&
    'metrics' in (x as any)
  );
}

type InFlightValue<T> = Promise<{ result: T; queuedMs: number }>;

interface QueuedTask<T> {
  key: GatewayTaskKey;
  provider: string;
  fn: (qm: { queuedMs: number; dedupHit: boolean }) => Promise<T>;
  resolve: (value: { result: T; queuedMs: number }) => void;
  reject: (error: unknown) => void;
  waitStartMs: number;
}

// In-flight promises map (for deduplication)
// ✅ 存"统一结构"的 promise，而不是 Promise<unknown>
const inFlightMap = new Map<GatewayTaskKey, InFlightValue<unknown>>();

// Provider concurrency tracking
const providerConcurrency = new Map<string, number>();
const providerQueues = new Map<string, QueuedTask<unknown>[]>();

// Default concurrency per provider
const DEFAULT_CONCURRENCY = 1;

/**
 * Run a task through the gateway queue with deduplication
 * 
 * @param provider Provider name (e.g., 'openai')
 * @param key Unique task key (must include: model + actionName + stableHash(prompt+attachments+mode))
 * @param fn Task function to execute (receives queueMetrics as parameter)
 * @returns Promise with result and metrics
 */
export async function runQueued<T>(
  provider: string,
  key: GatewayTaskKey,
  fn: (qm: { queuedMs: number; dedupHit: boolean }) => Promise<T>
): Promise<{ result: T; metrics: GatewayMetrics }> {
  const waitStartMs = Date.now();

  // ✅ Dedup: existingPromise resolve 出来的是 {result, queuedMs}
  const existingPromise = inFlightMap.get(key) as InFlightValue<T> | undefined;
  if (existingPromise) {
    log('🔄 [Gateway Queue] Deduplication hit', {
      provider,
      key: key.substring(0, 50) + '...',
    });

    const { result } = await existingPromise;
    // ✅ 计算实际等待时间（dedup 的 caller 也可能等了几百 ms / 几秒）
    const queuedMs = Date.now() - waitStartMs;
    return {
      result,
      metrics: { queuedMs, dedupHit: true, waitStartMs },
    };
  }

  const taskPromise = executeQueued(provider, key, fn, waitStartMs) as InFlightValue<T>;
  inFlightMap.set(key, taskPromise as InFlightValue<unknown>);

  try {
    const { result, queuedMs } = await taskPromise;
    return {
      result,
      metrics: {
        queuedMs,
        dedupHit: false,
        waitStartMs,
      },
    };
  } finally {
    // Remove from in-flight map when done
    inFlightMap.delete(key);
  }
}

/**
 * Execute task through provider queue
 */
async function executeQueued<T>(
  provider: string,
  key: GatewayTaskKey,
  fn: (qm: { queuedMs: number; dedupHit: boolean }) => Promise<T>,
  waitStartMs: number
): Promise<{ result: T; queuedMs: number }> {
  const concurrency = DEFAULT_CONCURRENCY;
  const current = providerConcurrency.get(provider) || 0;

  // If under concurrency limit, execute immediately
  if (current < concurrency) {
    providerConcurrency.set(provider, current + 1);
    const queuedMs = Date.now() - waitStartMs;
    
    try {
      const result = await fn({ queuedMs, dedupHit: false });
      return { result, queuedMs };
    } catch (error) {
      throw {
        __gatewayQueueError: true,
        error,
        metrics: { queuedMs, dedupHit: false, waitStartMs },
      } satisfies GatewayQueueError;
    } finally {
      const newCurrent = (providerConcurrency.get(provider) || 1) - 1;
      providerConcurrency.set(provider, newCurrent);
      
      // Process next task in queue
      processQueue(provider);
    }
  }

  // Otherwise, queue the task
  return new Promise<{ result: T; queuedMs: number }>((resolve, reject) => {
    const queue = providerQueues.get(provider) || [];
    const taskWaitStartMs = waitStartMs;
    const task: QueuedTask<T> = {
      key,
      provider,
      fn,
      resolve: (value: { result: T; queuedMs: number }) => {
        resolve(value);
      },
      reject,
      waitStartMs: taskWaitStartMs,
    };
    queue.push(task as QueuedTask<unknown>);
    providerQueues.set(provider, queue);
    
    log('⏳ [Gateway Queue] Task queued', {
      provider,
      key: key.substring(0, 50) + '...',
      queueLength: queue.length,
    });
  });
}

/**
 * Process next task in provider queue
 */
function processQueue(provider: string): void {
  const queue = providerQueues.get(provider) || [];
  if (queue.length === 0) return;

  const concurrency = DEFAULT_CONCURRENCY;
  const current = providerConcurrency.get(provider) || 0;
  if (current >= concurrency) return;

  const task = queue.shift();
  if (!task) return;

  providerQueues.set(provider, queue);
  providerConcurrency.set(provider, current + 1);

  // ✅ 只算一次 queuedMs
  const queuedMs = Date.now() - task.waitStartMs;
  
  log('▶️ [Gateway Queue] Processing queued task', {
    provider,
    key: task.key.substring(0, 50) + '...',
    queuedMs,
  });

  Promise.resolve(task.fn({ queuedMs, dedupHit: false }))
    .then((result) => task.resolve({ result, queuedMs }))
    .catch((error) =>
      task.reject({
        __gatewayQueueError: true,
        error,
        metrics: { queuedMs, dedupHit: false, waitStartMs: task.waitStartMs },
      } satisfies GatewayQueueError)
    )
    .finally(() => {
      const newCurrent = (providerConcurrency.get(provider) || 1) - 1;
      providerConcurrency.set(provider, newCurrent);
      processQueue(provider);
    });
}

/**
 * Generate stable hash for task key
 */
export function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

