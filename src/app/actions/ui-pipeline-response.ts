/**
 * Unified UI Pipeline Response Type
 * 
 * NON-NEGOTIABLE CONTRACT: Frontend MUST only consume this stable response type
 * Do not leak AIResult to UI.
 */

export type UIPipelineStage = 'STATIC' | 'BEAUTIFY' | 'INTERACT';

export interface HTMLMeta {
  componentCount: number;
  imageCount: number;
  hasScript: boolean;
  hasExternalCdn: boolean;
}

export type UIPipelineResponse =
  | {
      ok: true;
      type: 'UI_HTML';
      stage: UIPipelineStage;
      html: string;
      meta: HTMLMeta;
      warnings?: string[];
    }
  | {
      ok: false;
      type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION';
      message: string;
      cooldownSeconds?: number;
      retryable: boolean;
    };

/**
 * Map AIResult to UIPipelineResponse (error case only)
 */
export function mapAIResultToUIPipelineResponse<T extends { ok: false; type: string; message: string; cooldownSeconds?: number }>(
  aiResult: T,
  stage: UIPipelineStage
): UIPipelineResponse {
  // Map AI error types to UIPipeline error types
  let pipelineType: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
  let retryable = true;

  if ('type' in aiResult) {
    switch (aiResult.type) {
      case 'RATE_LIMIT':
        pipelineType = 'RATE_LIMIT';
        retryable = true;
        break;
      case 'NETWORK':
        pipelineType = 'NETWORK';
        retryable = true;
        break;
      case 'PROVIDER':
        pipelineType = 'PROVIDER';
        retryable = false;
        break;
      case 'PARSE':
        pipelineType = 'PARSE';
        retryable = false;
        break;
      default:
        pipelineType = 'PROVIDER';
        retryable = false;
    }
  }

  return {
    ok: false,
    type: pipelineType,
    message: aiResult.message || 'Unknown error',
    cooldownSeconds: aiResult.cooldownSeconds,
    retryable,
  };
}

/**
 * Normalize UI Pipeline Response
 * 
 * Handles various response formats from zsa-react:
 * - UIPipelineResponse (direct)
 * - [data, error] tuple (zsa-react execute return)
 * - {result: UIPipelineResponse, ...} (wrapped)
 * 
 * Always returns a valid UIPipelineResponse.
 */
export function normalizeUIPipelineResponse(raw: any): UIPipelineResponse {
  // Case 1: Already a valid UIPipelineResponse
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    // Check if it's already in the correct format
    if ('ok' in raw && (raw.type === 'UI_HTML' || raw.type === 'RATE_LIMIT' || raw.type === 'NETWORK' || raw.type === 'PROVIDER' || raw.type === 'PARSE' || raw.type === 'VALIDATION')) {
      return raw as UIPipelineResponse;
    }
    
    // Case 3: Wrapped format {result: ..., ...}
    if ('result' in raw && raw.result) {
      return normalizeUIPipelineResponse(raw.result);
    }
  }
  
  // Case 2: [data, error] tuple from zsa-react execute
  if (Array.isArray(raw) && raw.length === 2) {
    const [data, error] = raw;
    
    // If there's an error in the tuple, convert to error response
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Try to extract cooldown from error if available
      const cooldownSeconds = (error as any)?.cooldownSeconds;
      
      // Determine error type from error message or structure
      let type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE' | 'VALIDATION' = 'PROVIDER';
      if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit')) {
        type = 'RATE_LIMIT';
      } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
        type = 'NETWORK';
      }
      
      return {
        ok: false,
        type,
        message: errorMessage,
        cooldownSeconds,
        retryable: type === 'RATE_LIMIT' || type === 'NETWORK',
      };
    }
    
    // No error, normalize the data
    if (data) {
      return normalizeUIPipelineResponse(data);
    }
  }
  
  // Fallback: Invalid response format
  return {
    ok: false,
    type: 'PARSE',
    message: 'Invalid response format from server',
    retryable: false,
  };
}

