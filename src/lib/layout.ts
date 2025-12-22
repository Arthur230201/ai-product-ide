import dagre from 'dagre';
import type { Edge } from 'reactflow';
import type { FractalNode } from '@/types/fractal';

/**
 * 使用 dagre 自动布局节点
 * dagre 是一个专门用于有向图层次布局的库
 * @param nodes 节点数组
 * @param edges 边数组
 * @param direction 布局方向，'LR' 表示从左到右（适合用户流程）
 * @returns 更新了位置的节点数组
 */
export function getLayoutedElements(
  nodes: FractalNode[],
  edges: Edge[],
  direction: 'LR' | 'TB' | 'RL' | 'BT' = 'LR'
): FractalNode[] {
  if (nodes.length === 0) {
    return nodes;
  }

  // 节点尺寸（我们的自定义节点是卡片，宽度约 300px，高度约 200px）
  const nodeWidth = 300;
  const nodeHeight = 200;

  // 如果没有边，使用简单的水平布局
  if (edges.length === 0) {
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: 100 + index * 320, // 更紧凑的水平间距
        y: 200,
      },
    }));
  }

  // 创建 dagre 图
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 30, // 节点之间的水平间距（更紧凑）
    ranksep: 80, // 层级之间的垂直间距（更紧凑）
    align: 'UL', // 对齐方式：上左对齐
  });

  // 将节点添加到 dagre 图
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // 将边添加到 dagre 图（只添加有效的边）
  const nodeIds = new Set(nodes.map((n) => n.id));
  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  // 计算布局
  dagre.layout(dagreGraph);

  // 更新节点位置
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });
}
