/**
 * Deterministic Fallback Graph Builder
 * 
 * Rule-based graph generation when AI fails or rate-limited.
 * Always returns valid schema with non-empty nodes.
 */

import type { FractalNode } from '@/types/fractal';
import type { Edge } from 'reactflow';

export interface FallbackGraphResult {
  global: {
    userJourneys: Array<{
      id: string;
      name: string;
      actor: string;
      narrative: string;
      steps: string[];
    }>;
    businessEvents: Array<{
      id: string;
      name: string;
      trigger: string;
      outcome: string;
    }>;
  };
  nodes: FractalNode[];
  edges: Edge[];
  warnings: string[];
}

/**
 * Build fallback graph based on prompt keywords
 */
export function buildFallbackGraph(prompt: string): FallbackGraphResult {
  const warnings: string[] = [];
  const promptLower = prompt.toLowerCase();

  // Detect domain keywords
  const isEcommerce = /购物|电商|商品|订单|购物车|结算|支付/.test(promptLower);
  const isTask = /任务|待办|工作流|审批|流程/.test(promptLower);
  const isContent = /内容|文章|博客|新闻|发布/.test(promptLower);

  if (isEcommerce) {
    return buildEcommerceFallback(warnings);
  } else if (isTask) {
    return buildTaskFallback(warnings);
  } else if (isContent) {
    return buildContentFallback(warnings);
  } else {
    return buildGenericFallback(warnings);
  }
}

/**
 * E-commerce fallback: 5 pages (list/detail/cart/checkout/orders)
 */
function buildEcommerceFallback(warnings: string[]): FallbackGraphResult {
  warnings.push('使用电商模板生成降级图结构');

  const nodes: FractalNode[] = [
    createNode('product_list', '商品列表', 'View', 100, 200),
    createNode('product_detail', '商品详情', 'View', 500, 200),
    createNode('cart', '购物车', 'Action', 300, 400),
    createNode('checkout', '结算页', 'Action', 500, 400),
    createNode('orders', '订单列表', 'View', 300, 600),
  ];

  const edges: Edge[] = [
    createEdge('product_list', 'product_detail', '查看详情'),
    createEdge('product_detail', 'cart', '加入购物车'),
    createEdge('cart', 'checkout', '去结算'),
    createEdge('checkout', 'orders', '完成订单'),
    createEdge('orders', 'product_list', '继续购物'),
  ];

  return {
    global: {
      userJourneys: [
        {
          id: 'JOURNEY_01',
          name: '完成购物流程',
          actor: '用户',
          narrative: '作为用户，我想要浏览商品、加入购物车、完成结算，以便购买所需商品',
          steps: ['浏览商品', '查看详情', '加入购物车', '结算', '查看订单'],
        },
      ],
      businessEvents: [
        {
          id: 'EVENT_01',
          name: 'OrderConfirmed',
          trigger: '支付成功',
          outcome: '订单创建，库存扣减',
        },
      ],
    },
    nodes,
    edges,
    warnings,
  };
}

/**
 * Task management fallback: 3 pages (list/create/detail)
 */
function buildTaskFallback(warnings: string[]): FallbackGraphResult {
  warnings.push('使用任务管理模板生成降级图结构');

  const nodes: FractalNode[] = [
    createNode('task_list', '任务列表', 'View', 100, 200),
    createNode('task_create', '创建任务', 'Action', 500, 200),
    createNode('task_detail', '任务详情', 'View', 300, 400),
  ];

  const edges: Edge[] = [
    createEdge('task_list', 'task_create', '创建任务'),
    createEdge('task_list', 'task_detail', '查看详情'),
    createEdge('task_create', 'task_list', '返回列表'),
    createEdge('task_detail', 'task_list', '返回列表'),
  ];

  return {
    global: {
      userJourneys: [
        {
          id: 'JOURNEY_01',
          name: '完成任务管理',
          actor: '用户',
          narrative: '作为用户，我想要创建任务、查看任务列表和详情，以便管理我的工作',
          steps: ['创建任务', '查看列表', '查看详情'],
        },
      ],
      businessEvents: [
        {
          id: 'EVENT_01',
          name: 'TaskCreated',
          trigger: '提交创建表单',
          outcome: '任务创建，通知相关人员',
        },
      ],
    },
    nodes,
    edges,
    warnings,
  };
}

/**
 * Content management fallback: 3 pages (list/create/detail)
 */
function buildContentFallback(warnings: string[]): FallbackGraphResult {
  warnings.push('使用内容管理模板生成降级图结构');

  const nodes: FractalNode[] = [
    createNode('content_list', '内容列表', 'View', 100, 200),
    createNode('content_create', '创建内容', 'Action', 500, 200),
    createNode('content_detail', '内容详情', 'View', 300, 400),
  ];

  const edges: Edge[] = [
    createEdge('content_list', 'content_create', '创建内容'),
    createEdge('content_list', 'content_detail', '查看详情'),
    createEdge('content_create', 'content_list', '返回列表'),
    createEdge('content_detail', 'content_list', '返回列表'),
  ];

  return {
    global: {
      userJourneys: [
        {
          id: 'JOURNEY_01',
          name: '完成内容发布',
          actor: '编辑',
          narrative: '作为编辑，我想要创建内容、查看内容列表和详情，以便发布和管理内容',
          steps: ['创建内容', '查看列表', '查看详情'],
        },
      ],
      businessEvents: [
        {
          id: 'EVENT_01',
          name: 'ContentPublished',
          trigger: '发布内容',
          outcome: '内容发布，通知订阅者',
        },
      ],
    },
    nodes,
    edges,
    warnings,
  };
}

/**
 * Generic fallback: 3 pages (home/detail/settings)
 */
function buildGenericFallback(warnings: string[]): FallbackGraphResult {
  warnings.push('使用通用模板生成降级图结构');

  const nodes: FractalNode[] = [
    createNode('home', '首页', 'View', 100, 200),
    createNode('detail', '详情页', 'View', 500, 200),
    createNode('settings', '设置页', 'Action', 300, 400),
  ];

  const edges: Edge[] = [
    createEdge('home', 'detail', '查看详情'),
    createEdge('home', 'settings', '打开设置'),
    createEdge('detail', 'home', '返回首页'),
    createEdge('settings', 'home', '返回首页'),
  ];

  return {
    global: {
      userJourneys: [
        {
          id: 'JOURNEY_01',
          name: '完成基础操作',
          actor: '用户',
          narrative: '作为用户，我想要浏览首页、查看详情和配置设置，以便使用系统',
          steps: ['浏览首页', '查看详情', '配置设置'],
        },
      ],
      businessEvents: [
        {
          id: 'EVENT_01',
          name: 'SettingsUpdated',
          trigger: '保存设置',
          outcome: '设置更新，应用配置',
        },
      ],
    },
    nodes,
    edges,
    warnings,
  };
}

/**
 * Create a FractalNode
 */
function createNode(
  id: string,
  label: string,
  pageType: 'Action' | 'View',
  x: number,
  y: number
): FractalNode {
  return {
    id,
    type: 'page',
    position: { x, y },
    data: {
      label,
      artifacts: {
        view: {
          code: `function App() {
  return (
    <div className="p-8 bg-white">
      <h1 className="text-3xl font-bold text-gray-900">${label}</h1>
      <p className="mt-4 text-gray-600">这是 ${label} 页面</p>
    </div>
  );
}`,
        },
        spec: {
          title: label,
          requirements: [`页面描述：${label}页面`],
        },
        impl: {
          apiEndpoints: [],
          dbSchema: '-- 将在后续阶段生成',
        },
        test: {
          cases: [],
        },
        userStories: [
          {
            id: `US-${id}-001`,
            role: '用户',
            activity: pageType === 'Action' ? `在${label}执行操作` : `查看${label}`,
            value: `完成${label}相关功能`,
            acceptanceCriteria: [`${label}页面正常显示`, `功能可用`],
          },
        ],
        businessContext: {
          domain: '通用业务',
          role: '用户',
          goal: pageType === 'Action' ? '执行操作' : '查看信息',
        },
        ...(pageType === 'Action' ? {
          events: [
            {
              id: `EVT-${id}-001`,
              name: `${label}操作`,
              trigger: '用户操作',
              type: 'UserAction' as const,
              processFlow: [
                {
                  step: 1,
                  action: '处理操作',
                  desc: `执行${label}相关操作`,
                },
              ],
              outcome: `完成${label}操作`,
            },
          ],
        } : {
          dataQueries: [
            {
              id: `Q-${id}-001`,
              description: `查询${label}数据`,
              sorting: '按创建时间降序',
              filtering: '显示有效数据',
              dataSource: '从数据库查询',
            },
          ],
        }),
      },
      syncState: {
        isSynced: false,
        lastSource: 'spec',
      },
      source: {
        type: 'ai',
      },
    },
  };
}

/**
 * Create an Edge
 */
function createEdge(source: string, target: string, label: string): Edge {
  return {
    id: `edge-${source}-${target}`,
    source,
    target,
    label,
    type: 'default',
    markerEnd: {
      type: 'arrowclosed' as const,
    },
  } as Edge;
}

