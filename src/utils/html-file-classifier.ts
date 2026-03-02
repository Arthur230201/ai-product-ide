/**
 * HTML文件分类器
 * 基于乔布斯式设计哲学：简单、直观、用户无需思考
 * 
 * 核心原则：
 * 1. 上下文优先 - 用户当前在做什么，比文件内容更重要
 * 2. 用户意图优先 - 用户的提示词是用户意图的最直接表达
 * 3. 内容分析辅助 - 文件内容特征作为辅助判断
 * 4. 智能推断 - 综合多个信号，给出最合理的判断
 */

export type HTMLFilePurpose = 'ui-mockup' | 'project-info' | 'uncertain';

export interface HTMLFileClassificationContext {
  /** 用户提示词 */
  userPrompt: string;
  /** 是否在编辑模式（选中了节点） */
  isEditMode: boolean;
  /** HTML文件内容（可选，用于深度分析） */
  htmlContent?: string;
  /** 文件名（可选，用于辅助判断） */
  fileName?: string;
}

/**
 * UI示意文件的特征关键词（高置信度）
 */
const UI_MOCKUP_KEYWORDS = {
  // 用户意图关键词（最重要）
  intent: [
    'ui', '界面', '页面', '设计', 'mockup', 'prototype',
    '生成ui', '生成界面', '生成页面', '基于这个', '参考这个',
    '改成', '修改', '优化', '美化', '改进',
    '交互', '组件', '样式', '布局',
  ],
  // 文件内容特征（高置信度）
  content: [
    'button', 'input', 'form', 'onclick', 'onchange', 'onclick',
    'flex', 'grid', 'tailwind', 'class=', 'className',
    'hover:', 'active:', 'focus:', 'transition',
    'nav', 'header', 'footer', 'sidebar', 'menu',
    'card', 'modal', 'dialog', 'dropdown',
  ],
  // 文件名特征
  filename: [
    'ui', 'design', 'page', 'mockup', 'prototype',
    'component', 'layout', 'screen',
  ],
};

/**
 * 项目信息文件的特征关键词（高置信度）
 */
const PROJECT_INFO_KEYWORDS = {
  // 用户意图关键词（最重要）
  intent: [
    '流程', '业务', '需求', '文档', '说明',
    'process', 'flow', 'requirement', 'spec',
    '分析', '解析', '理解', '了解',
    '架构', '系统', '模块',
  ],
  // 文件内容特征（高置信度）
  content: [
    'mermaid', 'flowchart', 'diagram', 'graph',
    'sequence', 'classDiagram', 'stateDiagram',
    '业务', '流程', '步骤', '节点',
    'table', 'thead', 'tbody', 'th', 'td',
  ],
  // 文件名特征
  filename: [
    'flow', 'process', 'diagram', 'requirement',
    'spec', 'doc', 'prd', 'architecture',
  ],
};

/**
 * 计算关键词匹配分数
 */
function calculateKeywordScore(
  text: string,
  keywords: string[],
  weights: { exact?: number; partial?: number } = { exact: 2, partial: 1 }
): number {
  const lowerText = text.toLowerCase();
  let score = 0;

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // 精确匹配（更高权重）
    if (lowerText === lowerKeyword || 
        lowerText.includes(` ${lowerKeyword} `) ||
        lowerText.startsWith(`${lowerKeyword} `) ||
        lowerText.endsWith(` ${lowerKeyword}`)) {
      score += weights.exact || 2;
    }
    // 部分匹配（较低权重）
    else if (lowerText.includes(lowerKeyword)) {
      score += weights.partial || 1;
    }
  }

  return score;
}

/**
 * 分析HTML内容特征
 */
function analyzeHTMLContent(htmlContent: string): {
  uiScore: number;
  infoScore: number;
} {
  const uiScore = calculateKeywordScore(htmlContent, UI_MOCKUP_KEYWORDS.content, {
    exact: 3, // HTML内容中的精确匹配权重更高
    partial: 2,
  });
  
  const infoScore = calculateKeywordScore(htmlContent, PROJECT_INFO_KEYWORDS.content, {
    exact: 3,
    partial: 2,
  });

  return { uiScore, infoScore };
}

/**
 * 分类HTML文件用途
 * 
 * 判断逻辑（按优先级）：
 * 1. 上下文信号（最高优先级）
 *    - 编辑模式 + HTML文件 → 默认UI示意（用户正在编辑节点，上传HTML更可能是UI参考）
 *    - 创建模式 + HTML文件 → 默认项目信息（用户正在创建项目，上传HTML更可能是需求/流程文档）
 * 
 * 2. 用户意图（用户提示词）
 *    - 包含UI相关关键词 → UI示意
 *    - 包含项目信息相关关键词 → 项目信息
 * 
 * 3. 文件内容分析（如果有）
 *    - 包含大量交互元素（button, input, form等）→ UI示意
 *    - 包含流程图元素（mermaid, flowchart等）→ 项目信息
 * 
 * 4. 文件名分析（辅助判断）
 *    - 文件名包含UI相关词 → UI示意
 *    - 文件名包含流程相关词 → 项目信息
 * 
 * @returns 'ui-mockup' | 'project-info' | 'uncertain'
 */
export function classifyHTMLFile(context: HTMLFileClassificationContext): HTMLFilePurpose {
  const { userPrompt, isEditMode, htmlContent, fileName } = context;
  
  // 计算各维度分数
  const scores = {
    ui: 0,
    info: 0,
  };

  // ========== 1. 上下文信号（最高优先级，权重：10） ==========
  if (isEditMode) {
    // 编辑模式：用户正在编辑节点，上传HTML更可能是UI参考
    scores.ui += 10;
  } else {
    // 创建模式：用户正在创建项目，上传HTML更可能是需求/流程文档
    scores.info += 10;
  }

  // ========== 2. 用户意图分析（权重：5） ==========
  const promptLower = userPrompt.toLowerCase().trim();
  
  const uiIntentScore = calculateKeywordScore(promptLower, UI_MOCKUP_KEYWORDS.intent, {
    exact: 3,
    partial: 2,
  });
  scores.ui += uiIntentScore * 5;

  const infoIntentScore = calculateKeywordScore(promptLower, PROJECT_INFO_KEYWORDS.intent, {
    exact: 3,
    partial: 2,
  });
  scores.info += infoIntentScore * 5;

  // ========== 3. 文件内容分析（权重：3，如果有内容） ==========
  if (htmlContent) {
    const { uiScore, infoScore } = analyzeHTMLContent(htmlContent);
    scores.ui += uiScore * 3;
    scores.info += infoScore * 3;
  }

  // ========== 4. 文件名分析（权重：2，辅助判断） ==========
  if (fileName) {
    const fileNameLower = fileName.toLowerCase();
    const uiFileNameScore = calculateKeywordScore(fileNameLower, UI_MOCKUP_KEYWORDS.filename);
    scores.ui += uiFileNameScore * 2;

    const infoFileNameScore = calculateKeywordScore(fileNameLower, PROJECT_INFO_KEYWORDS.filename);
    scores.info += infoFileNameScore * 2;
  }

  // ========== 判断结果 ==========
  const scoreDiff = scores.ui - scores.info;
  const threshold = 5; // 分数差异阈值

  if (scoreDiff > threshold) {
    return 'ui-mockup';
  } else if (scoreDiff < -threshold) {
    return 'project-info';
  } else {
    // 分数接近，无法确定
    // 默认策略：编辑模式 → UI示意，创建模式 → 项目信息
    return isEditMode ? 'ui-mockup' : 'project-info';
  }
}

/**
 * 获取分类结果的友好描述
 */
export function getClassificationDescription(purpose: HTMLFilePurpose): string {
  switch (purpose) {
    case 'ui-mockup':
      return 'UI界面示意文件';
    case 'project-info':
      return '项目信息文件（如流程图、需求文档）';
    case 'uncertain':
      return '无法确定用途';
    default:
      return '未知';
  }
}



