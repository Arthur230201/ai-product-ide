/**
 * Editor Injector Script Builder
 * 
 * Pure frontend JS for enabling direct text/attribute editing in iframe.
 * - Preview mode: Disable selection and editing
 * - Edit mode: Hover highlight, click select, double-click edit
 */

export interface EditorInjectorOptions {
  mode: 'preview' | 'edit';
}

/**
 * Build editor injector script string
 * 
 * @param options Editor options
 * @returns JavaScript code as string to be injected into iframe
 */
export function buildEditorInjector(options: EditorInjectorOptions): string {
  const { mode } = options;

  return `
(function() {
  'use strict';
  
  const MODE = '${mode}';
  let selectedElement = null;
  let editingElement = null;
  let originalText = null;
  
  // ==================== PostMessage Helper ====================
  function postToHost(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, ...payload }, window.location.origin);
    }
  }
  
  // ==================== Generate Stable Selector ====================
  function getStableSelector(element) {
    // Priority 1: data-id
    const dataId = element.getAttribute('data-id');
    if (dataId) {
      return '[data-id="' + dataId.replace(/"/g, '\\\\"') + '"]';
    }
    
    // Priority 2: id
    if (element.id) {
      return '#' + element.id.replace(/[^a-zA-Z0-9_-]/g, '\\\\$&');
    }
    
    // Priority 3: Shortest nth-of-type path
    const path = [];
    let current = element;
    
    while (current && current !== document.body && current !== document.documentElement) {
      const tagName = current.tagName.toLowerCase();
      const parent = current.parentElement;
      
      if (!parent) break;
      
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === current.tagName
      );
      const index = siblings.indexOf(current);
      
      if (siblings.length === 1) {
        path.unshift(tagName);
      } else {
        path.unshift(tagName + ':nth-of-type(' + (index + 1) + ')');
      }
      
      current = parent;
    }
    
    return path.join(' > ');
  }
  
  // ==================== Check if Element is Editable ====================
  function isEditableTextElement(element) {
    // Ignore script, style, and non-editable elements
    if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
      return false;
    }
    
    // Ignore elements inside protected regions
    let current = element;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-ui-critical') && 
          current.getAttribute('data-ui-critical') === 'true') {
        return false;
      }
      current = current.parentElement;
    }
    
    // Editable tags: button, a, span, div, p, h1-h6, label, etc.
    const editableTags = ['BUTTON', 'A', 'SPAN', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'TD', 'TH', 'LI'];
    if (!editableTags.includes(element.tagName)) {
      return false;
    }
    
    // Must not have complex child elements (only text or simple inline elements)
    const hasComplexChildren = Array.from(element.children).some(child => {
      const childTag = child.tagName;
      return !['SPAN', 'STRONG', 'EM', 'B', 'I', 'U', 'CODE', 'SMALL'].includes(childTag);
    });
    
    return !hasComplexChildren;
  }
  
  // ==================== Highlight Element ====================
  function highlightElement(element) {
    // Remove previous highlight
    const prevHighlighted = document.querySelector('.editor-highlight');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('editor-highlight');
      prevHighlighted.style.outline = '';
      prevHighlighted.style.outlineOffset = '';
    }
    
    // Add highlight to current element
    element.classList.add('editor-highlight');
    element.style.outline = '2px solid #3b82f6';
    element.style.outlineOffset = '2px';
    selectedElement = element;
  }
  
  // ==================== Enter Edit Mode ====================
  function enterEditMode(element) {
    if (editingElement) {
      exitEditMode();
    }
    
    editingElement = element;
    originalText = element.textContent || '';
    
    // Make element contenteditable
    element.contentEditable = 'true';
    element.style.cursor = 'text';
    element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    
    // Focus and select all text
    element.focus();
    
    if (window.getSelection && document.createRange) {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
  
  // ==================== Exit Edit Mode ====================
  function exitEditMode() {
    if (!editingElement) return;
    
    const element = editingElement;
    const newText = element.textContent || '';
    
    // Restore original state
    element.contentEditable = 'false';
    element.style.cursor = '';
    element.style.backgroundColor = '';
    
    // Submit patch if content changed
    if (newText !== originalText) {
      const selector = getStableSelector(element);
      postToHost('PATCH', {
        patch: {
          op: 'SET_TEXT',
          selector: selector,
          value: newText
        }
      });
    }
    
    editingElement = null;
    originalText = null;
  }
  
  // ==================== Event Handlers ====================
  
  function handleClick(event) {
    if (MODE !== 'edit') return;
    if (editingElement) return;
    
    const target = event.target;
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    
    // Highlight element
    highlightElement(target);
  }
  
  function handleDoubleClick(event) {
    if (MODE !== 'edit') return;
    
    const target = event.target;
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    
    // Check if editable
    if (isEditableTextElement(target)) {
      event.preventDefault();
      event.stopPropagation();
      enterEditMode(target);
    }
  }
  
  function handleHover(event) {
    if (MODE !== 'edit') return;
    if (editingElement) return;
    
    const target = event.target;
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    
    // Add hover outline (visual only)
    target.style.outline = '1px dashed #94a3b8';
    target.style.outlineOffset = '1px';
  }
  
  function handleHoverOut(event) {
    if (MODE !== 'edit') return;
    if (editingElement) return;
    
    const target = event.target;
    if (!target) return;
    
    // Remove hover outline if not selected
    if (!target.classList.contains('editor-highlight')) {
      target.style.outline = '';
      target.style.outlineOffset = '';
    }
  }
  
  function handleBlur(event) {
    if (editingElement && event.target === editingElement) {
      exitEditMode();
    }
  }
  
  function handleKeyDown(event) {
    if (!editingElement) return;
    
    // Escape: cancel edit
    if (event.key === 'Escape') {
      event.preventDefault();
      editingElement.textContent = originalText;
      exitEditMode();
    }
    
    // Enter: submit (for single-line elements)
    if (event.key === 'Enter' && !event.shiftKey) {
      const tagName = editingElement.tagName.toLowerCase();
      if (tagName !== 'textarea' && tagName !== 'p' && tagName !== 'div') {
        event.preventDefault();
        editingElement.blur();
      }
    }
  }
  
  // ==================== Initialize ====================
  function initialize() {
    // Add global styles
    const style = document.createElement('style');
    style.textContent = \`
      .editor-highlight {
        position: relative;
      }
      [contenteditable="true"] {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
        background-color: rgba(59, 130, 246, 0.1) !important;
      }
    \`;
    document.head.appendChild(style);
    
    if (MODE === 'preview') {
      // Disable selection and editing in preview mode
      document.addEventListener('selectstart', function(e) {
        e.preventDefault();
      }, false);
      
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
      }, false);
    } else {
      // Edit mode: attach event listeners
      document.addEventListener('click', handleClick, true);
      document.addEventListener('dblclick', handleDoubleClick, true);
      document.addEventListener('mouseover', handleHover, true);
      document.addEventListener('mouseout', handleHoverOut, true);
      document.addEventListener('blur', handleBlur, true);
      document.addEventListener('keydown', handleKeyDown, true);
    }
    
    // Notify host that injector is ready
    postToHost('READY', {});
  }
  
  // ==================== Listen for Mode Changes ====================
  window.addEventListener('message', function(event) {
    if (event.source !== window.parent) return;
    
    const message = event.data;
    if (message && message.type === 'SET_MODE') {
      // Reinitialize with new mode
      const newMode = message.mode;
      if (newMode === 'preview') {
        // Remove edit listeners
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('dblclick', handleDoubleClick, true);
        document.removeEventListener('mouseover', handleHover, true);
        document.removeEventListener('mouseout', handleHoverOut, true);
        document.removeEventListener('blur', handleBlur, true);
        document.removeEventListener('keydown', handleKeyDown, true);
        
        // Exit edit mode if active
        if (editingElement) {
          exitEditMode();
        }
        if (selectedElement) {
          selectedElement.classList.remove('editor-highlight');
          selectedElement.style.outline = '';
          selectedElement = null;
        }
      } else {
        // Add edit listeners
        document.addEventListener('click', handleClick, true);
        document.addEventListener('dblclick', handleDoubleClick, true);
        document.addEventListener('mouseover', handleHover, true);
        document.addEventListener('mouseout', handleHoverOut, true);
        document.addEventListener('blur', handleBlur, true);
        document.addEventListener('keydown', handleKeyDown, true);
      }
    }
  });
  
  // ==================== Initialize on DOM Ready ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
`.trim();
}


