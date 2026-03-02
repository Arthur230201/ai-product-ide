/**
 * HTML Validation and Metadata Extraction
 * 
 * Validates HTML structure and extracts metadata for UI pipeline stages
 */

export interface HTMLMeta {
  componentCount: number;
  imageCount: number;
  hasScript: boolean;
  hasExternalCdn: boolean;
}

export interface HTMLValidationResult {
  valid: boolean;
  errors: string[];
  meta: HTMLMeta;
}

/**
 * Extract metadata from HTML
 */
export function extractHTMLMeta(html: string): HTMLMeta {
  // Count components via data-component-id
  const componentMatches = html.match(/data-component-id\s*=\s*["'][^"']+["']/gi) || [];
  const componentCount = componentMatches.length;

  // Count images
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const imageCount = imgMatches.length;

  // Check for script tags
  const hasScript = /<script[^>]*>[\s\S]*?<\/script>/i.test(html);

  // Check for external CDNs (common patterns)
  const cdnPatterns = [
    /https?:\/\/(cdn\.|cdnjs\.|unpkg\.|jsdelivr\.|fonts\.googleapis\.)/i,
    /src\s*=\s*["']https?:\/\//i, // External script/link src
  ];
  const hasExternalCdn = cdnPatterns.some(pattern => pattern.test(html));

  return {
    componentCount,
    imageCount,
    hasScript,
    hasExternalCdn,
  };
}

/**
 * Validate HTML structure for UI pipeline stages
 */
export function validateHTML(
  html: string,
  stage: 'STATIC' | 'BEAUTIFY' | 'INTERACT'
): HTMLValidationResult {
  const errors: string[] = [];
  const meta = extractHTMLMeta(html);

  // Check for doctype
  if (!/<!doctype\s+html/i.test(html) && !html.includes('<!DOCTYPE html')) {
    errors.push('Missing <!DOCTYPE html>');
  }

  // Check for html tag
  if (!/<html[\s>]/i.test(html)) {
    errors.push('Missing <html> tag');
  }

  // Check for head tag
  if (!/<head[\s>]/i.test(html)) {
    errors.push('Missing <head> tag');
  }

  // Check for body tag
  if (!/<body[\s>]/i.test(html)) {
    errors.push('Missing <body> tag');
  }

  // Stage-specific validations
  if (stage === 'STATIC' || stage === 'BEAUTIFY') {
    if (meta.hasScript) {
      errors.push(`Stage ${stage} must not contain <script> tags`);
    }
  }

  if (stage === 'STATIC') {
    if (meta.hasExternalCdn) {
      errors.push('Stage STATIC must not contain external CDN links');
    }
  }

  // Check for stage marker
  const stageMarker = getStageMarker(stage);
  if (!html.includes(stageMarker)) {
    errors.push(`Missing stage marker: ${stageMarker}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    meta,
  };
}

/**
 * Get expected stage marker for a stage
 */
export function getStageMarker(stage: 'STATIC' | 'BEAUTIFY' | 'INTERACT'): string {
  switch (stage) {
    case 'STATIC':
      return '<!-- UI_PIPELINE:STAGE=STATIC;FORMAT=HTML_SINGLE_FILE;NO_SCRIPT=TRUE -->';
    case 'BEAUTIFY':
      return '<!-- UI_PIPELINE:STAGE=BEAUTIFY;FORMAT=HTML_SINGLE_FILE;NO_SCRIPT=TRUE -->';
    case 'INTERACT':
      return '<!-- UI_PIPELINE:STAGE=INTERACT;FORMAT=HTML_SINGLE_FILE;SCRIPT=TRUE;DATA_ACTION=TRUE;EVENT_DELEGATION=TRUE -->';
  }
}

/**
 * Clean HTML (remove markdown code blocks, ensure stage marker)
 */
export function cleanHTML(html: string, stage: 'STATIC' | 'BEAUTIFY' | 'INTERACT'): string {
  let cleaned = html.trim();

  // Remove markdown code blocks
  cleaned = cleaned
    .replace(/^```(?:html|tsx|jsx|ts|js)?\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .trim();

  // Ensure stage marker is at the end (remove old markers first)
  const stageMarker = getStageMarker(stage);
  cleaned = cleaned.replace(/<!-- UI_PIPELINE:.*?-->\s*/g, '');
  cleaned = `${cleaned}\n${stageMarker}`;

  return cleaned;
}

