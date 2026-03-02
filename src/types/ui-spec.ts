/**
 * UI Specification Types
 * 
 * Structured specification for UI generation and verification.
 */

export type UIRegion = 'header' | 'toolbar' | 'content' | 'bottomBar';

export type InteractionTrigger = 'CLICK' | 'INPUT' | 'SELECT';

export type InteractionAction = 'NAV' | 'FILTER' | 'STATE';

export interface UIComponent {
  id: string;
  type: string;
  props?: Record<string, string>;
}

export interface UIInteraction {
  when: InteractionTrigger;
  selectorHint: string;
  action: InteractionAction;
  payload: string;
}

export interface UISpec {
  pageId: string;
  title: string;
  regions: UIRegion[];
  components: UIComponent[];
  dataSchema: Record<string, string>; // field -> type
  interactions: UIInteraction[];
}


