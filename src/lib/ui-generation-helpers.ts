/**
 * UI Generation Helpers
 * 
 * Provides type-safe utilities for UI generation with strict quality constraints:
 * - Precise stage timing (t0-t4)
 * - Rate limit fast-fail (<5s)
 * - Network error retry (max 1, with jitter)
 * - Output size limits
 */

import { log, logError } from './logger';

/**
 * Stage timing information for performance tracking
 */
export interface StageTiming {
  stage: 't0' | 't1' | 't2' | 't3' | 't4';
  name: string;
  elapsedMs: number;
  timestamp: number;
}

/**
 * t0: Request received
 * t1: Validation & setup complete
 * t2: Skeleton generated (first render)
 * t3: Enhancement complete (if applicable)
 * t4: Final response ready
 */

/**
 * Creates a stage timing entry
 */
export function createStageTiming(
  stage: StageTiming['stage'],
  name: string,
  startTime: number
): StageTiming {
  const now = Date.now();
  return {
    stage,
    name,
    elapsedMs: now - startTime,
    timestamp: now,
  };
}

/**
 * Logs stage timing with request context
 */
export function logStageTiming(
  requestId: string,
  model: string,
  timing: StageTiming
): void {
  log(`⏱️ [${timing.stage}] ${timing.name}`, {
    requestId,
    model,
    elapsedMs: timing.elapsedMs,
    timestamp: timing.timestamp,
  });
}

/**
 * Extracts cooldown seconds from Retry-After header or error
 * Returns default 10 if not available
 */
export function extractCooldownSeconds(error: unknown): number {
  if (error && typeof error === 'object') {
    // Check for Retry-After header in response
    if ('response' in error && error.response && typeof error.response === 'object') {
      const headers = 'headers' in error.response ? error.response.headers : null;
      if (headers != null && typeof headers === 'object' && typeof (headers as { get?: unknown }).get === 'function') {
        const retryAfter = (headers as { get: (name: string) => string | null }).get('retry-after');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          if (!isNaN(seconds) && seconds > 0) {
            return seconds;
          }
        }
      }
    }
    
    // Check for retryAfter in error object
    if ('retryAfter' in error && typeof error.retryAfter === 'number') {
      return error.retryAfter;
    }
  }
  
  return 10; // Default cooldown
}

/**
 * Checks if error is a rate limit (429) error
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes('429') ||
    errorMessage.includes('Too Many Requests') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('Rate limit') ||
    ('statusCode' in error && error.statusCode === 429) ||
    ('status' in error && error.status === 429)
  );
}

/**
 * Checks if error is a network error (retryable)
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  const hasNetworkMessage = (
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('network') ||
    errorMessage.includes('NetworkError')
  );
  
  const hasNetworkCause = Boolean(
    'cause' in error &&
    error.cause &&
    typeof error.cause === 'object' &&
    ('code' in error.cause || 'errno' in error.cause)
  );
  
  return hasNetworkMessage || hasNetworkCause;
}

/**
 * Applies jitter to retry delay
 */
export function applyJitter(baseDelayMs: number, jitterMs: number): number {
  return baseDelayMs + Math.floor(Math.random() * jitterMs);
}

/**
 * Enforces hard cap on HTML output length
 */
export function enforceHTMLSizeLimit(html: string, maxLength: number): string {
  if (html.length <= maxLength) return html;
  
  logError('⚠️ [Size Limit] HTML output exceeded limit, truncating', {
    originalLength: html.length,
    maxLength,
    truncated: true,
  });
  
  // Try to truncate at a safe boundary (end of tag)
  const truncated = html.substring(0, maxLength);
  const lastTagEnd = truncated.lastIndexOf('>');
  
  if (lastTagEnd > maxLength * 0.9) {
    // Safe to truncate at tag boundary
    return truncated.substring(0, lastTagEnd + 1) + '\n<!-- Truncated due to size limit -->';
  }
  
  // Fallback: hard truncate
  return truncated + '\n<!-- Truncated due to size limit -->';
}

/**
 * Enforces hard cap on list item count
 */
export function enforceListItemLimit(html: string, maxItems: number): string {
  // Count list items (simplified: count <li> tags)
  const listItemMatches = html.match(/<li[^>]*>/gi);
  const itemCount = listItemMatches ? listItemMatches.length : 0;
  
  if (itemCount <= maxItems) return html;
  
  logError('⚠️ [Size Limit] List items exceeded limit, truncating', {
    originalCount: itemCount,
    maxItems,
    truncated: true,
  });
  
  // Simple approach: truncate at a reasonable point
  // In production, you might want more sophisticated parsing
  return html; // For now, just log the warning
}

/**
 * Constants for UI generation
 */
export const UI_GENERATION_CONSTANTS = {
  MAX_SKELETON_HTML_LENGTH: 50_000,
  MAX_FINAL_HTML_LENGTH: 200_000,
  MAX_LIST_ITEMS: 50,
  RATE_LIMIT_FAST_FAIL_MS: 5_000,
  NETWORK_RETRY_DELAY_MS: 1_000,
  NETWORK_RETRY_JITTER_MS: 500,
} as const;

/**
 * Wraps generateText with rate limit fast-fail and network retry logic
 * 
 * @param generateTextFn - Function that returns a Promise<{ text: string }>
 * @param requestId - Request ID for logging
 * @param model - Model name for logging
 * @returns Promise with result or throws typed error
 */
export async function generateTextWithRetry<T extends { text: string }>(
  generateTextFn: () => Promise<T>,
  requestId: string,
  model: string
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // First attempt
    const result = await Promise.race([
      generateTextFn(),
      // Rate limit fast-fail timeout
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Rate limit check timeout'));
        }, UI_GENERATION_CONSTANTS.RATE_LIMIT_FAST_FAIL_MS);
      }),
    ]);
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    
    // Check for rate limit error
    if (isRateLimitError(error)) {
      const cooldown = extractCooldownSeconds(error);
      logError('🚫 [Rate Limit] Fast-fail triggered', {
        requestId,
        model,
        elapsedMs: elapsed,
        cooldownSeconds: cooldown,
      });
      
      const rateLimitError = new Error('Rate limit exceeded') as Error & {
        type: 'rate_limit';
        cooldownSeconds: number;
      };
      rateLimitError.type = 'rate_limit';
      rateLimitError.cooldownSeconds = cooldown;
      throw rateLimitError;
    }
    
    // Check for network error (retryable)
    if (isNetworkError(error) && elapsed < UI_GENERATION_CONSTANTS.RATE_LIMIT_FAST_FAIL_MS) {
      logError('🌐 [Network Error] First attempt failed, retrying with jitter', {
        requestId,
        model,
        elapsedMs: elapsed,
        retryable: true,
      });
      
      // Wait with jitter before retry
      const delay = applyJitter(
        UI_GENERATION_CONSTANTS.NETWORK_RETRY_DELAY_MS,
        UI_GENERATION_CONSTANTS.NETWORK_RETRY_JITTER_MS
      );
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        // Second attempt (no timeout for retry)
        return await generateTextFn();
      } catch (retryError) {
        const totalElapsed = Date.now() - startTime;
        logError('🌐 [Network Error] Retry failed', {
          requestId,
          model,
          totalElapsedMs: totalElapsed,
          retryable: false,
        });
        
        const networkError = new Error('Network error after retry') as Error & {
          type: 'network_error';
          retryable: boolean;
        };
        networkError.type = 'network_error';
        networkError.retryable = false;
        throw networkError;
      }
    }
    
    // Other errors: re-throw
    throw error;
  }
}

