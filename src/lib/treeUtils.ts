import type { Node, Edge } from 'reactflow';
import type { FractalNode } from '@/types/fractal';

/**
 * 树节点类型 - 扩展 Node 类型，添加 children 数组
 */
export interface TreeNode extends FractalNode {
  children: TreeNode[];
}

/**
 * 将扁平的节点和边转换为树结构
 * @param nodes 所有节点
 * @param edges 所有边
 * @returns 根节点数组（树结构）
 */
export function buildTree(
  nodes: FractalNode[],
  edges: Edge[]
): TreeNode[] {
  if (nodes.length === 0) {
    return [];
  }

  // 1. 创建节点映射表，方便快速查找
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      ...node,
      children: [],
    });
  });

  // 2. 构建父子关系映射（edge.source 是父节点，edge.target 是子节点）
  const parentMap = new Map<string, string>(); // childId -> parentId
  const childrenMap = new Map<string, string[]>(); // parentId -> childIds[]

  edges.forEach((edge) => {
    const sourceId = edge.source;
    const targetId = edge.target;

    // 确保源节点和目标节点都存在
    if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
      // 记录父子关系
      parentMap.set(targetId, sourceId);

      // 记录子节点列表
      if (!childrenMap.has(sourceId)) {
        childrenMap.set(sourceId, []);
      }
      childrenMap.get(sourceId)!.push(targetId);
    }
  });

  // 3. 识别根节点（没有父节点的节点，或者父节点不在当前节点列表中）
  const rootNodes: TreeNode[] = [];
  const processedNodes = new Set<string>();

  // 辅助函数：递归构建子树
  const buildSubtree = (nodeId: string): TreeNode | null => {
    if (processedNodes.has(nodeId)) {
      // 避免循环引用
      return null;
    }

    const node = nodeMap.get(nodeId);
    if (!node) {
      return null;
    }

    processedNodes.add(nodeId);

    // 获取所有子节点
    const childIds = childrenMap.get(nodeId) || [];
    const children: TreeNode[] = [];

    childIds.forEach((childId) => {
      const childNode = buildSubtree(childId);
      if (childNode) {
        children.push(childNode);
      }
    });

    return {
      ...node,
      children,
    };
  };

  // 4. 找到所有根节点并构建树
  nodes.forEach((node) => {
    // 如果节点没有父节点（不在 parentMap 中），或者父节点不在当前节点列表中，则是根节点
    const parentId = parentMap.get(node.id);
    if (!parentId || !nodeMap.has(parentId)) {
      const rootNode = buildSubtree(node.id);
      if (rootNode) {
        rootNodes.push(rootNode);
      }
    }
  });

  // 5. 如果所有节点都有父节点（可能是循环引用），或者没有找到根节点，返回所有节点作为根节点
  if (rootNodes.length === 0 && nodes.length > 0) {
    // 处理孤立节点（没有边的节点）或循环引用的情况
    const processedIds = new Set<string>();
    nodes.forEach((node) => {
      // 如果节点不在 parentMap 中（没有父节点），或者是孤立节点
      if (!parentMap.has(node.id) && !processedIds.has(node.id)) {
        rootNodes.push({
          ...node,
          children: [],
        });
        processedIds.add(node.id);
      }
    });
    
    // 如果还是没有根节点（所有节点都有父节点，可能是循环引用），返回所有节点
    if (rootNodes.length === 0) {
      nodes.forEach((node) => {
        if (!processedIds.has(node.id)) {
          rootNodes.push({
            ...node,
            children: [],
          });
          processedIds.add(node.id);
        }
      });
    }
  }

  return rootNodes;
}











