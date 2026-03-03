/**
 * 领域提示词模块注册与检测
 */

import type { DomainModule } from './types';
import { managementSystem } from './management-system';
import { ecommerce } from './ecommerce';

const domains: DomainModule[] = [
  managementSystem,
  ecommerce,
];

/**
 * 根据用户输入检测匹配的领域（第一个匹配的）
 */
export function detectDomain(userInput: string): DomainModule | undefined {
  const trimmed = (userInput || '').trim();
  if (!trimmed) return undefined;
  for (const d of domains) {
    if (Array.isArray(d.keywords)) {
      if (d.keywords.some((k) => trimmed.toLowerCase().includes(String(k).toLowerCase())))
        return d;
    } else {
      if (d.keywords.test(trimmed)) return d;
    }
  }
  return undefined;
}

/**
 * 获取指定领域模块（用于按 id 注入 UI 系统片段）
 */
export function getDomainById(domainId: string): DomainModule | undefined {
  return domains.find((d) => d.id === domainId);
}

/**
 * 获取生成 UI 时可选追加的系统提示词片段
 */
export function getDomainUISystemSuffix(domainId: string): string {
  const mod = getDomainById(domainId);
  return mod?.forUISystemPrompt ?? '';
}

export type { DomainModule, DomainId } from './types';
export { managementSystem, ecommerce };
