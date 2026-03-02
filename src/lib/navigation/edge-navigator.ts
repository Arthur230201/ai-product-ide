/**
 * Edge Navigator - 边导航逻辑（演示模式）
 * 根据 runtimeContext（role/permissions）和 edge.nav 条件选择正确的边
 */

import type { EdgeNavMeta, EdgeData } from '@/types/fractal';
import type { Edge } from 'reactflow';

export interface RuntimeContext {
  role?: string;
  permissions?: string[];
}

/**
 * 安全表达式解析器（最小实现，只支持 role == "xx" 和 has("perm")）
 */
function evaluateExpression(expr: string, context: RuntimeContext): boolean {
  // 移除空白
  const cleanExpr = expr.trim();
  
  // 模式1: role == "xx"
  const roleMatch = cleanExpr.match(/role\s*==\s*["']([^"']+)["']/);
  if (roleMatch) {
    const expectedRole = roleMatch[1];
    return context.role === expectedRole;
  }
  
  // 模式2: has("perm")
  const hasMatch = cleanExpr.match(/has\(["']([^"']+)["']\)/);
  if (hasMatch) {
    const requiredPerm = hasMatch[1];
    return context.permissions?.includes(requiredPerm) || false;
  }
  
  // 不支持其他表达式，返回 false（安全默认）
  return false;
}

/**
 * 检查边是否满足条件
 */
function checkEdgeCondition(edgeNav: EdgeNavMeta, context: RuntimeContext): boolean {
  const { conditionType, condition } = edgeNav;
  
  switch (conditionType) {
    case 'none':
      return true; // 无条件，总是通过
      
    case 'role':
      if (!condition.roles || condition.roles.length === 0) {
        return true; // 未指定角色，默认通过
      }
      return context.role ? condition.roles.includes(context.role) : false;
      
    case 'permission':
      if (!condition.permissions || condition.permissions.length === 0) {
        return true; // 未指定权限，默认通过
      }
      if (!context.permissions || context.permissions.length === 0) {
        return false; // 需要权限但没有提供
      }
      // 检查是否包含所有必需权限
      return condition.permissions.every(perm => context.permissions!.includes(perm));
      
    case 'expression':
      if (!condition.expr) {
        return true; // 未指定表达式，默认通过
      }
      return evaluateExpression(condition.expr, context);
      
    default:
      return true; // 未知类型，默认通过
  }
}

/**
 * 从多个 outgoing edges 中选择一个（根据条件过滤和优先级排序）
 */
export function selectNavigationEdge(
  edges: Edge[],
  context?: RuntimeContext
): Edge | null {
  if (edges.length === 0) {
    return null;
  }
  
  if (edges.length === 1) {
    return edges[0];
  }
  
  // 如果有 runtimeContext，按条件过滤
  let candidateEdges = edges;
  
  if (context) {
    const matchingEdges = edges.filter(edge => {
      const edgeData = edge.data as EdgeData | undefined;
      const nav = edgeData?.nav;
      
      if (!nav) {
        // 没有 nav 元数据，使用默认值（无条件）
        return true;
      }
      
      return checkEdgeCondition(nav, context);
    });
    
    // 如果有匹配的边，使用匹配的；否则使用所有边（fallback）
    candidateEdges = matchingEdges.length > 0 ? matchingEdges : edges;
  }
  
  // 按 priority 降序排序（数字越大优先级越高）
  candidateEdges.sort((a, b) => {
    const navA = (a.data as EdgeData | undefined)?.nav;
    const navB = (b.data as EdgeData | undefined)?.nav;
    const priorityA = navA?.priority ?? 0;
    const priorityB = navB?.priority ?? 0;
    return priorityB - priorityA; // 降序
  });
  
  // 返回优先级最高的边
  return candidateEdges[0];
}

/**
 * 获取所有匹配的边（用于调试或显示选项）
 */
export function getMatchingEdges(
  edges: Edge[],
  context?: RuntimeContext
): Edge[] {
  if (!context) {
    return edges;
  }
  
  return edges.filter(edge => {
    const edgeData = edge.data as EdgeData | undefined;
    const nav = edgeData?.nav;
    
    if (!nav) {
      return true; // 没有 nav，默认匹配
    }
    
    return checkEdgeCondition(nav, context);
  });
}


