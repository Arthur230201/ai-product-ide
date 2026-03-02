/**
 * Edit Text Capture Injector
 * 
 * Injects into iframe to capture text element clicks in edit mode.
 * Sends TEXT_NODE_CLICKED messages to host via postMessage.
 */

/**
 * Generate a stable selector for an element
 */
function generateSelector(element: Element): string {
  // First choice: existing id
  if (element.id) {
    return `#${element.id}`;
  }

  // Generate selector path using tag + nth-of-type
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== current.ownerDocument?.body) {
    const tagName = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    
    if (!parent) break;

    // Count siblings of the same type
    const siblings = Array.from(parent.children).filter(
      (child) => child.tagName === current!.tagName
    );
    const index = siblings.indexOf(current);

    if (siblings.length === 1) {
      path.unshift(tagName);
    } else {
      path.unshift(`${tagName}:nth-of-type(${index + 1})`);
    }

    current = parent;
  }

  const selector = path.join(' > ');
  
  // Try to attach data-uid for stability (if allowed)
  // For MVP, we'll just return the selector path
  return selector;
}

/**
 * Find the nearest editable text element from a click target
 */
function findEditableTextElement(target: Element, doc: Document): Element | null {
  let current: Element | null = target;

  // Whitelist of safe text-editable tags
  const textEditableTags = ['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'BUTTON', 'A'];

  while (current && current !== doc.body) {
    // Check if element is in script/style (ignore)
    if (current.closest('script, style')) {
      return null;
    }

    // Check if element has data-editable="text"
    if (current.hasAttribute('data-editable') && current.getAttribute('data-editable') === 'text') {
      // Check if it has nested elements (not allowed for MVP)
      if (current.children.length === 0) {
        return current;
      }
    }

    // Check if element is in whitelist and has no nested elements
    const tagName = current.tagName;
    if (textEditableTags.includes(tagName)) {
      // For DIV, only allow if it contains a single text node and no nested elements
      if (tagName === 'DIV') {
        // Check if it only contains text nodes (no element children)
        const hasElementChildren = Array.from(current.children).length > 0;
        if (!hasElementChildren && current.textContent?.trim()) {
          return current;
        }
      } else {
        // For other whitelisted tags, allow if no nested elements (MVP: text-only)
        if (current.children.length === 0) {
          return current;
        }
      }
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Inject text capture script into iframe
 */
export function injectTextCaptureScript(iframe: HTMLIFrameElement, expectedOrigin: string): () => void {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    console.warn('[EditTextCapture] iframe document not available');
    return () => {};
  }

  const clickHandler = (e: MouseEvent) => {
    const target = e.target as Element;
    if (!target) return;

    const editableElement = findEditableTextElement(target, iframeDoc);
    if (!editableElement) {
      // Not an editable text element, ignore
      return;
    }

    // Get element text
    const text = editableElement.textContent || '';

    // Get bounding rect (relative to iframe viewport)
    const rect = editableElement.getBoundingClientRect();

    // Generate selector
    const selector = generateSelector(editableElement);

    // Send message to host
    const message = {
      type: 'TEXT_NODE_CLICKED',
      selector,
      text,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
    };

    // Send to parent window (host)
    iframe.contentWindow?.parent.postMessage(message, expectedOrigin);
  };

  // Attach click handler to document (capture phase)
  iframeDoc.addEventListener('click', clickHandler, true);

  // Return cleanup function
  return () => {
    iframeDoc.removeEventListener('click', clickHandler, true);
  };
}

/**
 * Handle APPLY_TEXT_PATCH message from host
 * 
 * This is called by the host to apply a text patch directly to the iframe DOM
 * (for immediate visual feedback before HTML source rewrite and reload)
 */
export function handleApplyTextPatch(
  iframe: HTMLIFrameElement,
  selector: string,
  newText: string
): { ok: boolean; error?: string } {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    return { ok: false, error: 'iframe document not available' };
  }

  try {
    const element = iframeDoc.querySelector(selector);
    if (!element) {
      return { ok: false, error: `Selector not found: ${selector}` };
    }

    // Check if element has nested elements (not allowed for MVP)
    if (element.children.length > 0) {
      return { ok: false, error: 'Element has nested elements (not supported for MVP)' };
    }

    // Apply text patch (temporary, will be replaced by HTML reload)
    element.textContent = newText;

    return { ok: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: errorMessage };
  }
}

