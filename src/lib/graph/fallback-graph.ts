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
 * Build fallback graph when AI fails or returns invalid schema.
 * 不按关键词匹配领域，统一使用通用降级图；领域与页面由大模型生成时通过提示词约束。
 */
export function buildFallbackGraph(_prompt: string): FallbackGraphResult {
  const warnings: string[] = [];
  return buildGenericFallback(warnings);
}

/**
 * Management system fallback: 6 个典型管理后台页面，每节点带足量描述供「生成UI」使用
 */
function buildManagementFallback(warnings: string[]): FallbackGraphResult {
  warnings.push('使用管理系统模板生成降级图结构（6 个节点）');

  const nodes: FractalNode[] = [
    createManagementNode('dashboard', '首页', 'View', 100, 200, {
      description: '管理系统首页（仪表盘）：侧栏导航、顶部栏、数据概览卡片（统计数字）、快捷入口、最近动态列表。PC 端宽屏布局。',
      userStory: { role: '管理员', activity: '查看数据概览与快捷入口', value: '掌握系统状态与常用操作' },
    }),
    createManagementNode('user_manage', '用户管理', 'View', 450, 200, {
      description: '用户管理页：用户列表表格、搜索、筛选（状态/角色）、新增用户按钮、编辑/禁用/重置密码等操作列。支持分页。',
      userStory: { role: '管理员', activity: '查看与管理用户列表', value: '维护账号与权限' },
    }),
    createManagementNode('role_permission', '角色与权限', 'View', 800, 200, {
      description: '角色与权限页：角色列表、权限树/勾选、分配权限、新建角色。展示角色与菜单/权限的对应关系。',
      userStory: { role: '管理员', activity: '配置角色与权限', value: '控制功能与数据访问范围' },
    }),
    createManagementNode('data_report', '数据报表', 'View', 100, 450, {
      description: '数据报表页：统计图表（折线/柱状/饼图）、时间筛选、导出按钮、核心指标卡片。用于运营或业务概览。',
      userStory: { role: '管理员', activity: '查看数据报表与趋势', value: '支撑决策与复盘' },
    }),
    createManagementNode('system_settings', '系统设置', 'Action', 450, 450, {
      description: '系统设置页：分组表单（如基础配置、安全策略、通知设置）、保存/重置按钮。用于修改系统级或租户级配置。',
      userStory: { role: '管理员', activity: '修改系统或租户配置', value: '满足个性化与安全需求' },
    }),
    createManagementNode('operation_log', '操作日志', 'View', 800, 450, {
      description: '操作日志页：操作记录表格、操作人/时间/模块/动作/结果、搜索与时间范围筛选、分页。用于审计与排查。',
      userStory: { role: '管理员', activity: '查看操作与登录日志', value: '审计与安全排查' },
    }),
  ];

  const edges: Edge[] = [
    createEdge('dashboard', 'user_manage', '用户管理'),
    createEdge('dashboard', 'role_permission', '角色权限'),
    createEdge('dashboard', 'data_report', '数据报表'),
    createEdge('dashboard', 'system_settings', '系统设置'),
    createEdge('dashboard', 'operation_log', '操作日志'),
    createEdge('user_manage', 'dashboard', '返回首页'),
    createEdge('role_permission', 'dashboard', '返回首页'),
    createEdge('data_report', 'dashboard', '返回首页'),
    createEdge('system_settings', 'dashboard', '返回首页'),
    createEdge('operation_log', 'dashboard', '返回首页'),
  ];

  return {
    global: {
      userJourneys: [
        {
          id: 'JOURNEY_01',
          name: '完成管理操作',
          actor: '管理员',
          narrative: '作为管理员，我想要在首页查看概览、在用户管理/角色权限/数据报表/设置/日志等页面完成对应管理任务，以便高效运营系统',
          steps: ['查看首页', '用户管理', '角色权限', '数据报表', '系统设置', '操作日志'],
        },
      ],
      businessEvents: [
        {
          id: 'EVENT_01',
          name: 'SettingsSaved',
          trigger: '保存设置',
          outcome: '配置更新，应用生效',
        },
      ],
    },
    nodes,
    edges,
    warnings,
  };
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
 * Create a FractalNode for management system (rich description for 生成UI)
 */
function createManagementNode(
  id: string,
  label: string,
  pageType: 'Action' | 'View',
  x: number,
  y: number,
  opts: { description: string; userStory: { role: string; activity: string; value: string } }
): FractalNode {
  const reqs = [`页面描述：${opts.description}`, `作为${opts.userStory.role}，${opts.userStory.activity}，以便${opts.userStory.value}`];
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
      <p className="mt-4 text-gray-600">这是 ${label} 页面，生成 UI 后将替换为完整内容。</p>
    </div>
  );
}`,
        },
        spec: {
          title: label,
          requirements: reqs,
        },
        impl: {
          apiEndpoints: [],
          dbSchema: '-- 将在后续阶段生成',
        },
        test: { cases: [] },
        userStories: [
          {
            id: `US-${id}-001`,
            role: opts.userStory.role,
            activity: opts.userStory.activity,
            value: opts.userStory.value,
            acceptanceCriteria: ['页面布局与描述一致', '使用 Button/Card 等组件', '内容充实非占位'],
          },
        ],
        businessContext: { domain: '管理系统', role: opts.userStory.role, goal: opts.userStory.activity },
        ...(pageType === 'Action' ? {
          events: [
            {
              id: `EVT-${id}-001`,
              name: `${label}操作`,
              trigger: '用户操作',
              type: 'UserAction' as const,
              processFlow: [{ step: 1, action: '提交', desc: '保存配置或数据' }],
              outcome: '操作完成',
            },
          ],
        } : {
          dataQueries: [
            {
              id: `Q-${id}-001`,
              description: `查询${label}相关数据`,
              sorting: '按时间降序',
              dataSource: '后端接口',
            },
          ],
        }),
      },
      syncState: { isSynced: false, lastSource: 'spec' },
      source: { type: 'ai' },
    },
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

