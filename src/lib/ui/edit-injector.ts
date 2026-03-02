/**
 * Edit Mode Injector Script
 * 
 * Pure frontend JS for edit mode:
 * - Click element to highlight
 * - Double-click to enter contenteditable
 * - Blur to submit patch
 */

export function buildEditInjectorScript(): string {
  return `
(function() {
  'use strict';
  
  let editingElement = null;
  let originalContent = null;
  
  // ==================== PostMessage Helper ====================
  function postToHost(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, ...payload }, window.location.origin);
    }
  }
  
  // ==================== Generate Stable Selector ====================
  function generateSelector(element) {
    if (element.id) {
      return '#' + element.id.replace(/[^a-zA-Z0-9_-]/g, '\\\\$&');
    }
    
    const dataUid = element.getAttribute('data-uid');
    if (dataUid) {
      return '[data-uid="' + dataUid.replace(/"/g, '\\\\"') + '"]';
    }
    
    // Generate path using tag + nth-of-type
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
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
  
  // ==================== Highlight Element ====================
  function highlightElement(element) {
    // Remove previous highlight
    const prevHighlighted = document.querySelector('.edit-highlight');
    if (prevHighlighted) {
      prevHighlighted.classList.remove('edit-highlight');
      prevHighlighted.style.outline = '';
      prevHighlighted.style.outlineOffset = '';
    }
    
    // Add highlight to current element
    element.classList.add('edit-highlight');
    element.style.outline = '2px solid #3b82f6';
    element.style.outlineOffset = '2px';
  }
  
  // ==================== Enter Edit Mode ====================
  function enterEditMode(element) {
    if (editingElement) {
      // Exit previous edit
      exitEditMode();
    }
    
    editingElement = element;
    originalContent = element.textContent || '';
    
    // Make element contenteditable
    element.contentEditable = 'true';
    element.style.cursor = 'text';
    element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    
    // Focus and select all text
    element.focus();
    
    // Select all text if it's a text node or simple element
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
    const newContent = element.textContent || '';
    
    // Restore original state
    element.contentEditable = 'false';
    element.style.cursor = '';
    element.style.backgroundColor = '';
    
    // Submit patch if content changed
    if (newContent !== originalContent) {
      const selector = generateSelector(element);
      postToHost('EDIT_PATCH', {
        patch: {
          type: 'TEXT_REPLACE',
          selector: selector,
          text: newContent
        }
      });
    }
    
    editingElement = null;
    originalContent = null;
  }
  
  // ==================== Click Handler ====================
  function handleClick(event) {
    // Ignore if already editing
    if (editingElement) return;
    
    const target = event.target;
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    
    // Ignore script, style, and non-editable elements
    if (target.tagName === 'SCRIPT' || target.tagName === 'STYLE') {
      return;
    }
    
    // Ignore elements inside protected regions
    let current = target;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-ui-critical') && 
          current.getAttribute('data-ui-critical') === 'true') {
        return;
      }
      current = current.parentElement;
    }
    
    // Highlight element
    highlightElement(target);
  }
  
  // ==================== Double-Click Handler ====================
  function handleDoubleClick(event) {
    const target = event.target;
    if (!target || target === document.body || target === document.documentElement) {
      return;
    }
    
    // Ignore script, style, and non-editable elements
    if (target.tagName === 'SCRIPT' || target.tagName === 'STYLE') {
      return;
    }
    
    // Ignore elements inside protected regions
    let current = target;
    while (current && current !== document.body) {
      if (current.hasAttribute('data-ui-critical') && 
          current.getAttribute('data-ui-critical') === 'true') {
        return;
      }
      current = current.parentElement;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    // Enter edit mode
    enterEditMode(target);
  }
  
  // ==================== Blur Handler ====================
  function handleBlur(event) {
    if (editingElement && event.target === editingElement) {
      exitEditMode();
    }
  }
  
  // ==================== Key Handler ====================
  function handleKeyDown(event) {
    if (!editingElement) return;
    
    // Escape: cancel edit
    if (event.key === 'Escape') {
      event.preventDefault();
      editingElement.textContent = originalContent;
      exitEditMode();
    }
    
    // Enter: submit (for single-line elements, prevent default)
    if (event.key === 'Enter' && !event.shiftKey) {
      const tagName = editingElement.tagName.toLowerCase();
      if (tagName !== 'textarea' && tagName !== 'p' && tagName !== 'div') {
        event.preventDefault();
        editingElement.blur(); // This will trigger blur handler
      }
    }
  }
  
  // ==================== Initialize ====================
  function initialize() {
    // Add global styles for highlight
    const style = document.createElement('style');
    style.textContent = \`
      .edit-highlight {
        position: relative;
      }
      [contenteditable="true"] {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
        background-color: rgba(59, 130, 246, 0.1) !important;
      }
    \`;
    document.head.appendChild(style);
    
    // Attach event listeners
    document.addEventListener('click', handleClick, true);
    document.addEventListener('dblclick', handleDoubleClick, true);
    document.addEventListener('blur', handleBlur, true);
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Notify host that edit injector is ready
    postToHost('EDIT_INJECTOR_READY', {});
  }
  
  // ==================== Initialize on DOM Ready ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
`.trim();
}


