/**
 * 电商/订单 领域模块
 */

import type { DomainModule } from './types';

export const ecommerce: DomainModule = {
  id: 'ecommerce',
  keywords: /电商|订单|商品|购物车|支付|店铺|商品管理|订单管理/i,
  scopeRuleCreate: '', // 不再规定页数，交给 LLM 推断
  typicalPages: [
    { id: 'home', label: '首页', description: '轮播、分类、推荐商品、活动入口' },
    { id: 'product-list', label: '商品列表', description: '筛选、排序、商品卡片、分页' },
    { id: 'product-detail', label: '商品详情', description: '主图、规格、价格、加购、立即购买' },
    { id: 'cart', label: '购物车', description: '商品列表、数量、总价、去结算' },
    { id: 'order-list', label: '订单列表', description: '状态筛选、订单卡片、查看详情' },
    { id: 'order-detail', label: '订单详情', description: '订单信息、物流、支付状态、操作' },
  ],
  forUISystemPrompt: '', // 不再按领域注入强约束，观感由统一设计系统+组件库保证
};
