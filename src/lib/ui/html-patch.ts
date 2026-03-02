/**
 * HTML Patch System
 * 
 * Applies patches to HTML source using DOMParser.
 * Patches are JSON structures that describe DOM modifications.
 */

// New patch format (discriminated union)
export type HtmlPatch =
  | { op: 'SET_TEXT'; selector: string; value: string }
  | { op: 'SET_ATTR'; selector: string; name: string; value: string }
  | { op: 'TOGGLE_CLASS'; selector: string; className: string; enabled: boolean };

// Legacy patch format (for backward compatibility)
export type HTMLPatch =
  | { type: 'TEXT_REPLACE'; selector: string; text: string }
  | { type: 'ATTR_SET'; selector: string; attr: string; value: string }
  | { type: 'ATTR_REMOVE'; selector: string; attr: string }
  | { type: 'CLASS_ADD'; selector: string; className: string }
  | { type: 'CLASS_REMOVE'; selector: string; className: string }
  | { type: 'CLASS_REPLACE'; selector: string; oldClass: string; newClass: string };

/**
 * Apply a single patch to HTML source (new format)
 * 
 * @param html Original HTML string
 * @param patch Single patch to apply
 * @returns Updated HTML string
 */
export function applyPatch(html: string, patch: HtmlPatch): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const element = doc.querySelector(patch.selector);
    if (!element) {
      console.warn(`[applyPatch] Element not found: ${patch.selector}`);
      return html; // Return original on error
    }

    switch (patch.op) {
      case 'SET_TEXT':
        // Only replace text content, preserve child elements
        if (element.childNodes.length === 0 || 
            (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE)) {
          element.textContent = patch.value;
        } else {
          // If element has child elements, only replace direct text nodes
          const textNodes: Node[] = [];
          for (let i = 0; i < element.childNodes.length; i++) {
            const node = element.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
              textNodes.push(node);
            }
          }
          // Remove all text nodes and add new one
          textNodes.forEach(node => {
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          });
          if (element.firstChild) {
            element.insertBefore(doc.createTextNode(patch.value), element.firstChild);
          } else {
            element.appendChild(doc.createTextNode(patch.value));
          }
        }
        break;

      case 'SET_ATTR':
        element.setAttribute(patch.name, patch.value);
        break;

      case 'TOGGLE_CLASS':
        if (patch.enabled) {
          element.classList.add(patch.className);
        } else {
          element.classList.remove(patch.className);
        }
        break;
    }

    // Serialize back to HTML
    return serializeDocument(doc);
  } catch (error) {
    console.error('[applyPatch] Error applying patch:', error);
    return html; // Return original on error
  }
}

/**
 * Apply patches to HTML source (legacy format)
 * 
 * @param html Original HTML string
 * @param patches Array of patches to apply
 * @returns Updated HTML string
 */
export function applyPatches(html: string, patches: HTMLPatch[]): string {
  if (patches.length === 0) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Apply each patch
    for (const patch of patches) {
      try {
        const element = doc.querySelector(patch.selector);
        if (!element) {
          console.warn(`[applyPatches] Element not found: ${patch.selector}`);
          continue;
        }

        switch (patch.type) {
          case 'TEXT_REPLACE':
            // Only replace text content, preserve child elements
            if (element.childNodes.length === 0 || 
                (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE)) {
              element.textContent = patch.text;
            } else {
              // If element has child elements, only replace direct text nodes
              const textNodes: Node[] = [];
              for (let i = 0; i < element.childNodes.length; i++) {
                const node = element.childNodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                  textNodes.push(node);
                }
              }
              // Remove all text nodes and add new one
              textNodes.forEach(node => {
                if (node.parentNode) {
                  node.parentNode.removeChild(node);
                }
              });
              if (element.firstChild) {
                element.insertBefore(doc.createTextNode(patch.text), element.firstChild);
              } else {
                element.appendChild(doc.createTextNode(patch.text));
              }
            }
            break;

          case 'ATTR_SET':
            element.setAttribute(patch.attr, patch.value);
            break;

          case 'ATTR_REMOVE':
            element.removeAttribute(patch.attr);
            break;

          case 'CLASS_ADD':
            element.classList.add(patch.className);
            break;

          case 'CLASS_REMOVE':
            element.classList.remove(patch.className);
            break;

          case 'CLASS_REPLACE':
            element.classList.remove(patch.oldClass);
            element.classList.add(patch.newClass);
            break;
        }
      } catch (error) {
        console.error(`[applyPatches] Error applying patch:`, patch, error);
      }
    }

    // Serialize back to HTML
    return serializeDocument(doc);
  } catch (error) {
    console.error('[applyPatches] Error parsing HTML:', error);
    return html; // Return original on error
  }
}

/**
 * Serialize document to HTML string
 * Preserves DOCTYPE, head (including all style/script tags), and body structure
 */
function serializeDocument(doc: Document): string {
  let html = '';

  // Preserve DOCTYPE
  if (doc.doctype) {
    html += `<!DOCTYPE ${doc.doctype.name}`;
    if (doc.doctype.publicId) {
      html += ` PUBLIC "${doc.doctype.publicId}"`;
    }
    if (doc.doctype.systemId) {
      html += ` "${doc.doctype.systemId}"`;
    }
    html += '>\n';
  }

  // Serialize html element with attributes
  const htmlElement = doc.documentElement;
  if (htmlElement) {
    // Get html tag with attributes
    const htmlAttrs: string[] = [];
    Array.from(htmlElement.attributes).forEach(attr => {
      htmlAttrs.push(`${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`);
    });
    const htmlTagStr = htmlAttrs.length > 0 
      ? `<html ${htmlAttrs.join(' ')}>`
      : '<html>';
    html += htmlTagStr + '\n';

    // Serialize head (preserves all style, script, link tags)
    if (doc.head) {
      html += '<head>\n';
      // Serialize all head children (style, script, link, meta, etc.)
      Array.from(doc.head.children).forEach(child => {
        html += child.outerHTML + '\n';
      });
      html += '</head>\n';
    }

    // Serialize body (preserves all content)
    if (doc.body) {
      html += '<body';
      // Add body attributes if any
      const bodyAttrs: string[] = [];
      Array.from(doc.body.attributes).forEach(attr => {
        bodyAttrs.push(`${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`);
      });
      if (bodyAttrs.length > 0) {
        html += ' ' + bodyAttrs.join(' ');
      }
      html += '>\n';
      
      // Serialize body content (preserves all elements, scripts, styles)
      Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          html += (node as Element).outerHTML + '\n';
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (text.trim()) {
            html += text + '\n';
          }
        }
      });
      
      html += '</body>\n';
    }

    html += '</html>';
  }

  return html.trim();
}

/**
 * Generate a stable CSS selector for an element
 * Prefers ID, then data-uid, then tag + nth-of-type
 */
export function generateSelector(element: Element): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const dataUid = element.getAttribute('data-uid');
  if (dataUid) {
    return `[data-uid="${CSS.escape(dataUid)}"]`;
  }

  // Generate path using tag + nth-of-type
  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== current.ownerDocument?.body) {
    const tagName = current.tagName.toLowerCase();
    const parentElement: Element | null = current.parentElement;

    if (!parentElement) break;

    const siblings = Array.from(parentElement.children).filter(
      (child: Element) => child.tagName === current!.tagName
    );
    const index = siblings.indexOf(current);

    if (siblings.length === 1) {
      path.unshift(tagName);
    } else {
      path.unshift(`${tagName}:nth-of-type(${index + 1})`);
    }

    current = parentElement;
  }

  return path.join(' > ');
}

