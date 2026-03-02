/**
 * Universal HTML Renderer
 * 
 * HTML-First Architecture: Renders original HTML as-is in a secure sandbox
 * - Uses HtmlSandboxRenderer (Shadow DOM) for isolation
 * - Preserves all original behavior (Tailwind, styles, scroll, positioning)
 * - No React conversion or wrapping
 * 
 * JIT Pipeline Layer 2: Color Preservation
 * - Extracts all custom colors from HTML
 * - Injects CSS variables for color preservation
 * - Replaces colors with CSS variable references (if needed)
 */

import React, { useMemo } from 'react';
import { HtmlSandboxRenderer } from './HtmlSandboxRenderer';
import { extractCustomColors } from '@/utils/color-extractor';

interface UniversalHtmlRendererProps {
  rawHtml: string;
  className?: string;
}

export const UniversalHtmlRenderer: React.FC<UniversalHtmlRendererProps> = ({
  rawHtml,
  className = '',
}) => {
  // Extract custom colors for CSS variable injection (if needed)
  // Note: In HTML-first architecture, we preserve original HTML as-is
  // CSS variables are injected into the Shadow DOM, not the host
  const { processedHtml, cssVariables } = useMemo(() => {
    if (!rawHtml || rawHtml.trim().length === 0) {
      return { processedHtml: rawHtml, cssVariables: '' };
    }

    // Extract all custom colors from HTML for reference
    const extractedColors = extractCustomColors(rawHtml);
    
    // In HTML-first architecture, we preserve the original HTML
    // Colors are handled by Tailwind JIT in the Shadow DOM
    // CSS variables are injected into the Shadow DOM document, not the host

    return {
      processedHtml: rawHtml, // Preserve original HTML as-is
      cssVariables: extractedColors.cssVariables, // For Shadow DOM injection
    };
  }, [rawHtml]);

  if (!rawHtml || rawHtml.trim().length === 0) {
    return (
      <div className={className} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
        暂无 HTML 内容
      </div>
    );
  }

  // HTML-First Architecture: Render HTML as-is in Shadow DOM sandbox
  // Outer container: only layout properties, no visual modifiers
  return (
    <div 
      className={className} 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        // CRITICAL: Only layout properties, no visual modifiers
        // This ensures all gradients, shadows, and backgrounds render at full intensity
        opacity: undefined,
        filter: undefined,
        backdropFilter: undefined,
        transform: undefined,
        backgroundColor: undefined,
        background: undefined,
      } as React.CSSProperties}
    >
      {/* Render HTML in Shadow DOM sandbox - preserves all original behavior */}
      <HtmlSandboxRenderer
        rawHtml={processedHtml}
        className="w-full h-full"
      />
    </div>
  );
};

