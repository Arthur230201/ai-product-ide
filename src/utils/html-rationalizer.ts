/**
 * HTML Rationalizer
 * 
 * Mandatory step BEFORE HTML_ENHANCE that:
 * - Fixes structural issues (layout hierarchy, missing containers)
 * - Ensures all interactions are logically complete
 * - Normalizes states (active, selected, hidden)
 * - Removes inline event handlers and defers behavior to the injector
 */

/**
 * Rationalize HTML structure and logic
 * This step runs BEFORE visual enhancement (HTML_ENHANCE)
 */
export function rationalizeHTML(html: string): string {
  if (!html || html.trim().length === 0) {
    return html;
  }

  let rationalized = html;

  // Step 1: Remove all inline event handlers
  // Replace onclick, onchange, etc. with data attributes
  rationalized = rationalized.replace(/\sonclick=["']([^"']*)["']/gi, (match, handler) => {
    // Convert to data-action if it's a simple action
    if (handler.includes('submit') || handler.includes('保存') || handler.includes('提交')) {
      return ' data-action="submit"';
    }
    if (handler.includes('modal') || handler.includes('弹窗')) {
      return ' data-action="open-modal"';
    }
    // Default: remove the handler (behavior will be injected)
    return '';
  });

  rationalized = rationalized.replace(/\sonchange=["']([^"']*)["']/gi, '');
  rationalized = rationalized.replace(/\soninput=["']([^"']*)["']/gi, '');
  rationalized = rationalized.replace(/\sonsubmit=["']([^"']*)["']/gi, '');
  rationalized = rationalized.replace(/\sonfocus=["']([^"']*)["']/gi, '');
  rationalized = rationalized.replace(/\sonblur=["']([^"']*)["']/gi, '');
  rationalized = rationalized.replace(/\sonmouseenter=["']([^"']*)["']/gi, '');
  rationalized = rationalized.replace(/\sonmouseleave=["']([^"']*)["']/gi, '');

  // Step 2: Fix structural issues
  // Ensure proper container hierarchy for common patterns
  
  // Fix: Ensure tabs have proper structure
  rationalized = rationalized.replace(
    /<div[^>]*class="[^"]*tab[^"]*"[^>]*>([^<]*)<\/div>/gi,
    (match, content) => {
      // If tab doesn't have data-tab or aria-controls, add it
      if (!match.includes('data-tab') && !match.includes('aria-controls')) {
        const tabId = content.trim().toLowerCase().replace(/\s+/g, '-');
        return match.replace(/(<div[^>]*class="[^"]*tab[^"]*")/i, `$1 data-tab="${tabId}" aria-controls="${tabId}-panel"`);
      }
      return match;
    }
  );

  // Fix: Ensure tab panels have proper IDs
  rationalized = rationalized.replace(
    /<div[^>]*class="[^"]*tab-panel[^"]*"[^>]*>/gi,
    (match) => {
      if (!match.includes('id=') && !match.includes('data-tab=')) {
        // Try to extract tab ID from previous context or generate one
        return match.replace(/(<div[^>]*class="[^"]*tab-panel[^"]*")/i, '$1 id="tab-panel-default"');
      }
      return match;
    }
  );

  // Fix: Ensure filters have data-filter attribute
  rationalized = rationalized.replace(
    /<div[^>]*class="[^"]*filter[^"]*"[^>]*>([^<]*)<\/div>/gi,
    (match, content) => {
      if (!match.includes('data-filter')) {
        const filterValue = content.trim().toLowerCase().replace(/\s+/g, '-');
        return match.replace(/(<div[^>]*class="[^"]*filter[^"]*")/i, `$1 data-filter="${filterValue}"`);
      }
      return match;
    }
  );

  // Fix: Ensure list items have data-item attribute for filtering
  rationalized = rationalized.replace(
    /<div[^>]*class="[^"]*item[^"]*"[^>]*>/gi,
    (match) => {
      if (!match.includes('data-item') && !match.includes('data-status')) {
        return match.replace(/(<div[^>]*class="[^"]*item[^"]*")/i, '$1 data-item="true"');
      }
      return match;
    }
  );

  // Step 3: Normalize states
  // Ensure active/selected states use consistent classes
  rationalized = rationalized.replace(
    /\sclass="([^"]*)\s(?:active|selected|current)[^"]*"/gi,
    (match, baseClasses) => {
      // Normalize to 'active' class
      if (!baseClasses.includes('active')) {
        return ` class="${baseClasses} active"`;
      }
      return match;
    }
  );

  // Ensure hidden elements use consistent 'hidden' class
  rationalized = rationalized.replace(
    /\sstyle="[^"]*display:\s*none[^"]*"/gi,
    (match) => {
      // Add 'hidden' class if not present
      const elementMatch = match.match(/<(\w+)[^>]*style="[^"]*display:\s*none[^"]*"/i);
      if (elementMatch) {
        const tag = elementMatch[1];
        const fullMatch = match;
        if (!fullMatch.includes('class="') && !fullMatch.includes("class='")) {
          return fullMatch.replace(`<${tag}`, `<${tag} class="hidden"`);
        } else if (!fullMatch.includes('hidden')) {
          return fullMatch.replace(/\sclass="([^"]*)"/i, ' class="$1 hidden"');
        }
      }
      return match;
    }
  );

  // Step 4: Ensure interactions are logically complete
  // Add missing data attributes for buttons
  rationalized = rationalized.replace(
    /<button([^>]*)>([^<]*)<\/button>/gi,
    (match, attrs, content) => {
      if (!attrs.includes('data-action') && !attrs.includes('type=')) {
        const buttonText = content.trim().toLowerCase();
        let action = '';
        if (buttonText.includes('提交') || buttonText.includes('保存') || buttonText.includes('submit')) {
          action = 'data-action="submit"';
        } else if (buttonText.includes('打开') || buttonText.includes('open')) {
          action = 'data-action="open-modal"';
        } else if (buttonText.includes('关闭') || buttonText.includes('close')) {
          action = 'data-action="close-modal"';
        }
        if (action) {
          return match.replace('<button', `<button ${action}`);
        }
      }
      return match;
    }
  );

  // Step 5: Fix layout hierarchy issues
  // Ensure proper flex/grid containers
  // This is a basic check - more complex structural fixes would require DOM parsing
  
  // Ensure buttons in forms have proper structure
  rationalized = rationalized.replace(
    /<form([^>]*)>([\s\S]*?)<\/form>/gi,
    (match, formAttrs, formContent) => {
      // If form doesn't have proper container structure, wrap buttons
      if (formContent.includes('<button') && !formContent.includes('class="[^"]*flex')) {
        // This is a simple heuristic - more complex fixes would need DOM parsing
        return match; // Keep as-is for now, more complex fixes require DOM parsing
      }
      return match;
    }
  );

  return rationalized;
}

/**
 * Check if content is HTML (vs React/TSX)
 */
export function isHTMLContent(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  const trimmed = content.trim();
  
  // Check for HTML patterns
  const htmlPatterns = [
    /^<!DOCTYPE/i,
    /^<html/i,
    /<body/i,
    /class=["']/,
    /<div[^>]*class=/i,
  ];
  
  // Check for React patterns
  const reactPatterns = [
    /^import\s+.*from/i,
    /^export\s+(default\s+)?(const|function)/i,
    /const\s+\w+\s*=\s*\(\)\s*=>/i,
    /function\s+\w+\s*\(/i,
    /className=/i,
    /useState|useEffect/i,
  ];
  
  // If it has React patterns, it's not HTML
  if (reactPatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }
  
  // If it has HTML patterns, it's likely HTML
  if (htmlPatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }
  
  // Default: if it starts with < and doesn't look like JSX with imports/exports, assume HTML
  if (trimmed.startsWith('<') && !trimmed.includes('import') && !trimmed.includes('export')) {
    return true;
  }
  
  return false;
}



