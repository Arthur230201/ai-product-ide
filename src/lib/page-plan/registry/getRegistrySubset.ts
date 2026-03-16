/**
 * 按 templateId + pageType 从 registry/components/*.json 选取组件子集，供 synthesize prompt 注入（RAG 按需）。
 * 单一真源：组件定义来自 JSON，扩展时只需加文件、无需改 snippet 常量。
 */

import type { TemplateId } from '../selectTemplate';
import ButtonDef from './components/Button.json';
import TableDef from './components/Table.json';
import InputDef from './components/Input.json';
import CardDef from './components/Card.json';
import TextareaDef from './components/Textarea.json';
import AlertDef from './components/Alert.json';
import SelectDef from './components/Select.json';
import CheckboxDef from './components/Checkbox.json';
import RadioDef from './components/Radio.json';
import TabsDef from './components/Tabs.json';
import DialogDef from './components/Dialog.json';
import ToastDef from './components/Toast.json';
import PaginationDef from './components/Pagination.json';
import SkeletonDef from './components/Skeleton.json';
import EmptyStateDef from './components/EmptyState.json';

type ComponentDef = { name: string; props?: Record<string, string[]>; do?: string[]; dont?: string[] };
const ALL_COMPONENTS: Record<string, ComponentDef> = {
  Button: ButtonDef as ComponentDef,
  Table: TableDef as ComponentDef,
  Input: InputDef as ComponentDef,
  Card: CardDef as ComponentDef,
  Textarea: TextareaDef as ComponentDef,
  Alert: AlertDef as ComponentDef,
  Select: SelectDef as ComponentDef,
  Checkbox: CheckboxDef as ComponentDef,
  Radio: RadioDef as ComponentDef,
  Tabs: TabsDef as ComponentDef,
  Dialog: DialogDef as ComponentDef,
  Toast: ToastDef as ComponentDef,
  Pagination: PaginationDef as ComponentDef,
  Skeleton: SkeletonDef as ComponentDef,
  EmptyState: EmptyStateDef as ComponentDef,
};

/** 模板 → 允许的组件名（规则选子集，无向量检索） */
const TEMPLATE_COMPONENTS: Record<TemplateId, string[]> = {
  list: ['Input', 'Select', 'Checkbox', 'Radio', 'Button', 'Table', 'Pagination', 'Skeleton', 'EmptyState', 'Alert', 'Dialog', 'Tabs', 'Card'],
  list_detail_split: ['Input', 'Select', 'Checkbox', 'Radio', 'Button', 'Table', 'Pagination', 'Skeleton', 'EmptyState', 'Alert', 'Dialog', 'Tabs', 'Card'],
  search_results: ['Input', 'Select', 'Checkbox', 'Radio', 'Button', 'Table', 'Pagination', 'Skeleton', 'EmptyState', 'Alert', 'Dialog', 'Tabs', 'Card'],
  dashboard: ['Card', 'Button', 'Table', 'Skeleton', 'Alert', 'EmptyState', 'Tabs', 'Dialog'],
  detail: ['Button', 'Card', 'Alert', 'Skeleton', 'EmptyState', 'Tabs'],
  form: ['Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Button', 'Card', 'Alert', 'Dialog', 'Skeleton'],
  settings: ['Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Button', 'Card', 'Alert', 'Dialog', 'Skeleton'],
  wizard: ['Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Button', 'Card', 'Alert', 'Dialog', 'Skeleton', 'Tabs'],
  review_approve: ['Input', 'Textarea', 'Select', 'Checkbox', 'Radio', 'Button', 'Card', 'Alert', 'Dialog', 'Skeleton'],
};

const GLOBAL_DONTS = ['no className', 'no style', 'no rawHtml', 'no #hex', 'no px inline'];

export interface RegistrySubsetResult {
  allowedComponents: { name: string; allowedPropKeys: string[]; propEnums: Record<string, string[]> }[];
  globalDonts: string[];
}

export function getRegistrySubset(options: { templateId: TemplateId; pageType?: 'View' | 'Action' }): RegistrySubsetResult {
  const { templateId } = options;
  const names = TEMPLATE_COMPONENTS[templateId] ?? TEMPLATE_COMPONENTS.list;
  const allowedComponents = names
    .filter((name) => ALL_COMPONENTS[name])
    .map((name) => {
      const def = ALL_COMPONENTS[name];
      const allowedPropKeys = def.props ? Object.keys(def.props) : [];
      const propEnums: Record<string, string[]> = def.props ?? {};
      return { name, allowedPropKeys, propEnums };
    });
  return { allowedComponents, globalDonts: GLOBAL_DONTS };
}
