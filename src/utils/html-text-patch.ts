/**
 * HTML Text Patch Utility
 * 
 * Provides deterministic HTML source rewriting for text editing.
 * 
 * Core principle: Rewrite HTML string source, not live DOM.
 */

/**
 * Apply a text patch to HTML source
 * 
 * @param html - Original HTML source string
 * @param selector - CSS selector to target element
 * @param newText - New text content to replace
 * @returns Updated HTML string or error
 */
export function applyTextPatch(
  html: string,
  selector: string,
  newText: string
): { ok: true; html: string } | { ok: false; error: string } {
  try {
    // Parse HTML into DOM (use DOMParser in browser environment)
    if (typeof window === 'undefined' || !window.DOMParser) {
      return { ok: false, error: 'DOMParser not available' };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find element by selector
    const element = doc.querySelector(selector);
    if (!element) {
      return { ok: false, error: `Selector not found: ${selector}` };
    }

    // Check if element has nested elements (not allowed for MVP)
    // Only allow text-only editing for MVP
    const hasNestedElements = element.children.length > 0;
    if (hasNestedElements) {
      return {
        ok: false,
        error: `Element has nested elements. Text-only editing not supported for elements with children.`,
      };
    }

    // Replace textContent (preserves structure, replaces all text nodes)
    element.textContent = newText;

    // Serialize back to HTML string
    // Preserve head, style, script blocks
    let updatedHtml = '';
    
    // Preserve DOCTYPE if present
    if (html.trim().startsWith('<!DOCTYPE')) {
      updatedHtml += '<!DOCTYPE html>\n';
    }

    // Preserve <html> tag if present
    const hasHtmlTag = html.includes('<html');
    const hasHeadTag = html.includes('<head');
    const hasBodyTag = html.includes('<body');

    if (hasHtmlTag) {
      updatedHtml += '<html';
      const htmlMatch = html.match(/<html([^>]*)>/i);
      if (htmlMatch) {
        updatedHtml += htmlMatch[1];
      }
      updatedHtml += '>\n';

      if (hasHeadTag && doc.head) {
        updatedHtml += '<head>\n';
        // Preserve all head content (meta, title, style, script)
        doc.head.childNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            updatedHtml += el.outerHTML + '\n';
          } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            updatedHtml += node.textContent + '\n';
          }
        });
        updatedHtml += '</head>\n';
      }

      if (hasBodyTag && doc.body) {
        updatedHtml += '<body';
        const bodyMatch = html.match(/<body([^>]*)>/i);
        if (bodyMatch) {
          updatedHtml += bodyMatch[1];
        }
        updatedHtml += '>\n';
        updatedHtml += doc.body.innerHTML;
        updatedHtml += '\n</body>\n';
      } else if (doc.body) {
        // Body tag not in original, but we have content
        updatedHtml += '<body>\n';
        updatedHtml += doc.body.innerHTML;
        updatedHtml += '\n</body>\n';
      }

      updatedHtml += '</html>';
    } else {
      // Fragment mode: just return body innerHTML
      // Also preserve any <style> or <script> tags in the fragment
      const styleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);

      for (const match of styleMatches) {
        updatedHtml += match[0] + '\n';
      }

      if (doc.body) {
        updatedHtml += doc.body.innerHTML;
      }

      for (const match of scriptMatches) {
        updatedHtml += match[0] + '\n';
      }
    }

    return { ok: true, html: updatedHtml.trim() };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: `Failed to apply text patch: ${errorMessage}` };
  }
}

/**
 * Self-check: test applyTextPatch with a sample HTML
 */
export function selfCheckEditMvp(): { pass: boolean; reason: string } {
  if (typeof window === 'undefined') {
    return { pass: false, reason: 'Window not available (SSR environment)' };
  }

  const testHtml = '<div><p id="test">Hello World</p></div>';
  const result = applyTextPatch(testHtml, '#test', 'Hello Edited');

  if (!result.ok) {
    return { pass: false, reason: `Text patch failed: ${result.error}` };
  }

  if (!result.html.includes('Hello Edited')) {
    return { pass: false, reason: 'Updated HTML does not contain new text' };
  }

  if (result.html.includes('Hello World')) {
    return { pass: false, reason: 'Updated HTML still contains old text' };
  }

  return { pass: true, reason: 'All checks passed' };
}


