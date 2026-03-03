/**
 * 管理后台/管理系统 领域模块
 * 仅作 fallback 图等可选参考；不再用于规定页数或注入强约束（页数/结构由 LLM 推断）。
 */

import type { DomainModule } from './types';

export const managementSystem: DomainModule = {
  id: 'management-system',
  keywords: /管理系统|后台|管理后台|pc端|桌面端|admin|Admin|dashboard|仪表盘|权限|角色管理/i,
  scopeRuleCreate: '', // 不再规定页数，交给 LLM 推断
  typicalPages: [
    { id: 'dashboard', label: '首页', description: '仪表盘：概览数据、快捷入口、最近动态' },
    { id: 'user-mgmt', label: '用户管理', description: '用户列表、搜索筛选、新增/编辑/禁用' },
    { id: 'role-perm', label: '角色与权限', description: '角色列表、权限树、分配用户' },
    { id: 'data-report', label: '数据报表', description: '统计图表、导出、时间范围筛选' },
    { id: 'system-settings', label: '系统设置', description: '基础配置、参数、通知设置' },
    { id: 'audit-log', label: '操作日志', description: '操作记录、时间、操作人、详情' },
  ],
  forUISystemPrompt: '', // 不再按领域注入布局强约束，观感由统一设计系统+组件库保证
};
