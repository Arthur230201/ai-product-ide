/** Single source for component registry names (avoids fs in client). */
export const COMPONENT_REGISTRY_NAMES = [
  'Alert',
  'Button',
  'Card',
  'Checkbox',
  'Dialog',
  'EmptyState',
  'Input',
  'Pagination',
  'Radio',
  'Select',
  'Skeleton',
  'Table',
  'Tabs',
  'Textarea',
  'Toast',
] as const;

export type ComponentRegistryName = (typeof COMPONENT_REGISTRY_NAMES)[number];
