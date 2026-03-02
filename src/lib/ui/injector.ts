/**
 * UI Injector Script Builder
 * 
 * Pure frontend JS injector that drives interactions via data-* attributes.
 * - No access to host sensitive objects
 * - All interactions through data-* protocol
 * - AI only generates data-* annotations, not complex business JS
 */

export interface InjectorState {
  [key: string]: unknown;
}

/**
 * Build injector script string
 * 
 * @param initialState Initial state for the injector
 * @returns JavaScript code as string to be injected into iframe
 */
export function buildInjectorScript(initialState: InjectorState = {}): string {
  return `
(function() {
  'use strict';
  
  // ==================== State Management ====================
  const state = ${JSON.stringify(initialState)};
  
  // ==================== PostMessage Helper ====================
  function postToHost(type, payload) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, ...payload }, window.location.origin);
    }
  }
  
  // ==================== Tab Switching (data-action="tab") ====================
  function handleTabClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const tabValue = button.getAttribute('data-tab-value');
    const tabGroup = button.getAttribute('data-tab-group') || 'default';
    
    if (!tabValue) return;
    
    // Update active class on all buttons in the same group
    const allButtons = document.querySelectorAll(\`[data-action="tab"][data-tab-group="\${tabGroup}"]\`);
    allButtons.forEach(btn => {
      btn.classList.remove('active', 'bg-blue-500', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    // Set clicked button as active
    button.classList.add('active', 'bg-blue-500', 'text-white');
    button.classList.remove('bg-gray-200', 'text-gray-700');
    
    // Filter list items by data-item-status
    const statusFilter = button.getAttribute('data-filter-status');
    if (statusFilter) {
      const listItems = document.querySelectorAll('[data-item-status]');
      listItems.forEach(item => {
        const itemStatus = item.getAttribute('data-item-status');
        if (statusFilter === 'all' || itemStatus === statusFilter) {
          item.style.display = '';
          item.classList.remove('hidden');
        } else {
          item.style.display = 'none';
          item.classList.add('hidden');
        }
      });
    }
    
    // Update state
    state[\`tab_\${tabGroup}\`] = tabValue;
  }
  
  // ==================== Filter (data-action="filter") ====================
  function handleFilterClick(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const filterKey = button.getAttribute('data-filter-key');
    const filterValue = button.getAttribute('data-filter-value');
    
    if (!filterKey || !filterValue) return;
    
    // Update active class
    const filterGroup = button.getAttribute('data-filter-group') || 'default';
    const allButtons = document.querySelectorAll(\`[data-action="filter"][data-filter-group="\${filterGroup}"]\`);
    allButtons.forEach(btn => {
      btn.classList.remove('active', 'bg-blue-500', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    button.classList.add('active', 'bg-blue-500', 'text-white');
    button.classList.remove('bg-gray-200', 'text-gray-700');
    
    // Apply filter to list items
    const listItems = document.querySelectorAll('[data-item-status]');
    listItems.forEach(item => {
      const itemStatus = item.getAttribute('data-item-status');
      if (filterValue === 'all' || itemStatus === filterValue) {
        item.style.display = '';
        item.classList.remove('hidden');
      } else {
        item.style.display = 'none';
        item.classList.add('hidden');
      }
    });
    
    // Update state
    state[\`filter_\${filterKey}\`] = filterValue;
  }
  
  // ==================== Navigation (data-nav) ====================
  function handleNavClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const navTarget = element.getAttribute('data-nav');
    
    if (!navTarget) return;
    
    // Post navigation message to host
    postToHost('NAV', { to: navTarget });
  }
  
  // ==================== Initialize Event Listeners ====================
  function initializeListeners() {
    // Tab switching
    const tabButtons = document.querySelectorAll('[data-action="tab"]');
    tabButtons.forEach(button => {
      button.addEventListener('click', handleTabClick);
    });
    
    // Filter buttons
    const filterButtons = document.querySelectorAll('[data-action="filter"]');
    filterButtons.forEach(button => {
      button.addEventListener('click', handleFilterClick);
    });
    
    // Navigation links
    const navElements = document.querySelectorAll('[data-nav]');
    navElements.forEach(element => {
      element.addEventListener('click', handleNavClick);
    });
  }
  
  // ==================== Listen for State Updates from Host ====================
  window.addEventListener('message', function(event) {
    // Only accept messages from parent window
    if (event.source !== window.parent) return;
    
    const message = event.data;
    if (message && message.type === 'STATE') {
      // Update local state
      if (message.payload) {
        Object.assign(state, message.payload);
        
        // Apply state changes to UI
        // Update active tabs
        Object.keys(message.payload).forEach(key => {
          if (key.startsWith('tab_')) {
            const tabGroup = key.replace('tab_', '');
            const tabValue = message.payload[key];
            const button = document.querySelector(\`[data-action="tab"][data-tab-group="\${tabGroup}"][data-tab-value="\${tabValue}"]\`);
            if (button) {
              const allButtons = document.querySelectorAll(\`[data-action="tab"][data-tab-group="\${tabGroup}"]\`);
              allButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
              });
              button.classList.add('active', 'bg-blue-500', 'text-white');
              button.classList.remove('bg-gray-200', 'text-gray-700');
            }
          }
          
          if (key.startsWith('filter_')) {
            const filterKey = key.replace('filter_', '');
            const filterValue = message.payload[key];
            const button = document.querySelector(\`[data-action="filter"][data-filter-key="\${filterKey}"][data-filter-value="\${filterValue}"]\`);
            if (button) {
              const filterGroup = button.getAttribute('data-filter-group') || 'default';
              const allButtons = document.querySelectorAll(\`[data-action="filter"][data-filter-group="\${filterGroup}"]\`);
              allButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
              });
              button.classList.add('active', 'bg-blue-500', 'text-white');
              button.classList.remove('bg-gray-200', 'text-gray-700');
            }
            
            // Apply filter to list items
            const listItems = document.querySelectorAll('[data-item-status]');
            listItems.forEach(item => {
              const itemStatus = item.getAttribute('data-item-status');
              if (filterValue === 'all' || itemStatus === filterValue) {
                item.style.display = '';
                item.classList.remove('hidden');
              } else {
                item.style.display = 'none';
                item.classList.add('hidden');
              }
            });
          }
        });
      }
    }
  });
  
  // ==================== Initialize on DOM Ready ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeListeners);
  } else {
    initializeListeners();
  }
  
  // Also initialize after a short delay to catch dynamically added elements
  setTimeout(initializeListeners, 100);
  
  // Notify host that injector is ready
  postToHost('INJECTOR_READY', {});
})();
`.trim();
}


