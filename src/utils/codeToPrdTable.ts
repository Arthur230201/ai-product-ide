/**
 * Role: Product Manager (Client-Facing & Business-Oriented).
 * Task: Analyze React/Tailwind/JSX code and generate Business Requirement Specification (BRS) Table.
 * Goal: Translate technical code into user manual style document for non-technical stakeholders.
 */

interface PrdTableRow {
  id: string;
  zone: string;
  element: string;
  function: string;
  display: string;
}

/**
 * 从文件名或组件名提取功能ID前缀
 */
function extractPrefix(fileName: string, componentName?: string): string {
  // 优先使用组件名
  if (componentName) {
    const match = componentName.match(/^[A-Z][a-z]+/);
    if (match) {
      return match[0].split('').filter(c => c === c.toUpperCase()).join('').substring(0, 3).toUpperCase();
    }
  }

  // 从文件名提取
  const nameWithoutExt = fileName.replace(/\.(tsx|ts|jsx|js)$/, '');
  const words = nameWithoutExt.split(/[-_]/).filter(w => w.length > 0);
  
  if (words.length > 0) {
    // 取每个单词的首字母
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 3);
  }

  // 默认：取前3个大写字母
  const upperCase = nameWithoutExt.split('').filter(c => c === c.toUpperCase()).join('');
  return upperCase.substring(0, 3) || 'GEN';
}

/**
 * 识别UI区域
 */
function identifyZone(element: string, context: string): string {
  const lowerElement = element.toLowerCase();
  const lowerContext = context.toLowerCase();

  // 顶部导航
  if (lowerElement.includes('header') || lowerElement.includes('nav') || 
      lowerContext.includes('top') || lowerContext.includes('顶部')) {
    return '顶部导航栏';
  }

  // 侧边栏
  if (lowerElement.includes('aside') || lowerElement.includes('sidebar') || 
      lowerContext.includes('side') || lowerContext.includes('侧边')) {
    return '侧边菜单区';
  }

  // 底部
  if (lowerElement.includes('footer') || lowerContext.includes('bottom') || 
      lowerContext.includes('底部')) {
    return '底部操作栏';
  }

  // 弹窗
  if (lowerElement.includes('dialog') || lowerElement.includes('modal') || 
      lowerElement.includes('overlay') || lowerContext.includes('弹窗')) {
    return '弹窗/浮层';
  }

  // 列表/卡片容器
  if (lowerContext.includes('map') || lowerContext.includes('list') || 
      lowerContext.includes('card') || lowerContext.includes('item')) {
    return '内容列表区';
  }

  // 默认：核心工作台
  return '核心工作台';
}

/**
 * 翻译组件名为业务术语
 */
function translateElementName(componentType: string, props: Record<string, any>, text?: string): string {
  const lowerType = componentType.toLowerCase();
  const lowerText = (text || '').toLowerCase();

  // 按钮
  if (lowerType.includes('button') || props.onClick || props.onPress) {
    if (lowerText.includes('提交') || lowerText.includes('保存')) return '提交按钮';
    if (lowerText.includes('取消') || lowerText.includes('关闭')) return '取消按钮';
    if (lowerText.includes('删除')) return '删除按钮';
    if (lowerText.includes('编辑') || lowerText.includes('修改')) return '编辑按钮';
    if (lowerText.includes('查看') || lowerText.includes('详情')) return '查看按钮';
    if (lowerText.includes('催办')) return '催办按钮';
    if (lowerText.includes('筛选') || lowerText.includes('过滤')) return '筛选按钮';
    return `${text || '操作'}按钮`;
  }

  // 输入框
  if (lowerType.includes('input') || componentType === 'input') {
    if (props.type === 'search' || lowerText.includes('搜索')) return '搜索框';
    if (props.type === 'password') return '密码输入框';
    if (props.type === 'email') return '邮箱输入框';
    if (props.type === 'number') return '数字输入框';
    if (props.type === 'date' || props.type === 'datetime-local') return '日期选择器';
    return `${props.placeholder || text || '文本'}输入框`;
  }

  // 下拉选择
  if (lowerType.includes('select') || componentType === 'select') {
    return `${text || '选项'}下拉框`;
  }

  // 标签/徽章
  if (lowerType.includes('badge') || lowerType.includes('tag') || lowerType.includes('label')) {
    if (lowerText.includes('状态')) return '状态标签';
    if (lowerText.includes('来源') || lowerText.includes('分类')) return '来源标签';
    return '标识标签';
  }

  // 图片/头像
  if (lowerType.includes('img') || lowerType.includes('image') || lowerType.includes('avatar')) {
    if (props.alt?.includes('头像') || lowerText.includes('avatar')) return '用户头像';
    return '图片';
  }

  // 图标
  if (lowerType.includes('icon') || componentType.match(/^[A-Z][a-z]+Icon$/)) {
    const iconName = componentType.replace('Icon', '').toLowerCase();
    const iconMap: Record<string, string> = {
      search: '搜索图标',
      user: '用户图标',
      calendar: '日期图标',
      chevron: '下拉箭头图标',
      close: '关闭图标',
      edit: '编辑图标',
      delete: '删除图标',
      save: '保存图标',
    };
    return iconMap[iconName] || '图标';
  }

  // 文本显示
  if (lowerType.includes('text') || lowerType.includes('span') || lowerType.includes('p') || 
      componentType === 'span' || componentType === 'p') {
    if (lowerText.includes('标题') || lowerText.includes('title')) return '标题文字';
    if (lowerText.includes('描述') || lowerText.includes('desc')) return '描述信息';
    if (lowerText.includes('状态')) return '状态信息';
    if (lowerText.includes('日期') || lowerText.includes('date')) return '日期信息';
    if (lowerText.includes('姓名') || lowerText.includes('name')) return '姓名信息';
    return `${text || '文本'}信息`;
  }

  // 标题
  if (lowerType.includes('heading') || componentType.match(/^h[1-6]$/)) {
    return '标题';
  }

  return text || componentType || '元素';
}

/**
 * 生成功能说明
 */
function generateFunctionDescription(
  componentType: string,
  props: Record<string, any>,
  text?: string,
  context?: string
): string {
  const lowerType = componentType.toLowerCase();
  const lowerText = (text || '').toLowerCase();

  // 交互元素
  if (props.onClick || props.onPress || props.onChange || props.onSelect || 
      lowerType.includes('button') || lowerType.includes('input') || lowerType.includes('select')) {
    
    if (props.onClick || props.onPress) {
      if (lowerText.includes('提交') || lowerText.includes('保存')) {
        return '用户点击后，系统保存当前表单数据并返回成功提示。';
      }
      if (lowerText.includes('取消') || lowerText.includes('关闭')) {
        return '用户点击后，关闭当前弹窗或返回上一页面。';
      }
      if (lowerText.includes('删除')) {
        return '用户点击后，系统删除当前选中项并刷新列表。';
      }
      if (lowerText.includes('编辑') || lowerText.includes('修改')) {
        return '用户点击后，进入编辑模式，允许修改当前信息。';
      }
      if (lowerText.includes('查看') || lowerText.includes('详情')) {
        return '用户点击后，跳转至详情页面查看完整信息。';
      }
      if (lowerText.includes('催办')) {
        return '用户点击后，系统向负责人发送催办通知，提醒加快处理进度。';
      }
      return `用户点击后，${text || '执行相应操作'}。`;
    }

    if (props.onChange || props.onInput) {
      if (lowerType.includes('search') || lowerText.includes('搜索')) {
        return '用户输入关键词后，系统实时过滤列表，仅显示匹配的结果项。';
      }
      if (lowerType.includes('select')) {
        return '用户选择选项后，系统按选定规则重新排列或筛选内容。';
      }
      return `用户输入或选择后，系统${text || '更新显示内容'}。`;
    }
  }

  // 只读元素
  if (lowerText.includes('状态') || props.status || context?.includes('status')) {
    return '用于标识当前项的流转状态，帮助用户了解处理进度。';
  }

  if (lowerText.includes('标题') || lowerType.includes('heading') || componentType.match(/^h[1-6]$/)) {
    return `用于展示${text || '内容'}的核心主题，帮助用户快速识别。`;
  }

  if (lowerText.includes('日期') || lowerType.includes('calendar') || props.type === 'date') {
    return '用于展示时间信息，帮助用户了解创建或更新时间。';
  }

  if (lowerText.includes('头像') || lowerType.includes('avatar')) {
    return '用于标识负责人或创建者，增强信息的可信度和可追溯性。';
  }

  if (lowerText.includes('标签') || lowerType.includes('tag') || lowerType.includes('badge')) {
    return '用于标识分类或来源渠道，帮助用户快速筛选和归类。';
  }

  if (lowerText.includes('图标') || lowerType.includes('icon')) {
    return '用于增强视觉识别度，配合文字信息提升用户体验。';
  }

  // 默认描述
  if (text) {
    return `用于展示${text}相关信息。`;
  }

  return `用于展示${componentType}相关的内容信息。`;
}

/**
 * 翻译 Tailwind 类名为展示规范
 */
function translateDisplaySpecs(className: string, componentType: string, props: Record<string, any>): string {
  const specs: string[] = [];

  // 颜色检测
  if (className.includes('bg-blue-') || className.includes('text-blue-')) {
    specs.push('🔵 品牌色/主色（蓝色）');
  }
  if (className.includes('bg-red-') || className.includes('text-red-')) {
    specs.push('🔴 警示/高危（红色）');
  }
  if (className.includes('bg-green-') || className.includes('text-green-')) {
    specs.push('🟢 成功/正常（绿色）');
  }
  if (className.includes('bg-orange-') || className.includes('text-orange-') || 
      className.includes('bg-yellow-') || className.includes('text-yellow-')) {
    specs.push('🟠 警告/待处理（橙色/黄色）');
  }
  if (className.includes('bg-purple-') || className.includes('text-purple-')) {
    specs.push('🟣 特色功能（紫色）');
  }
  if (className.includes('text-gray-') || className.includes('bg-gray-')) {
    specs.push('⚪ 次要信息（灰色）');
  }

  // 形状
  if (className.includes('rounded-full')) {
    specs.push('💊 胶囊样式');
  } else if (className.includes('rounded')) {
    specs.push('圆角矩形');
  }

  // 字体
  if (className.includes('font-bold')) {
    specs.push('粗体高亮');
  }
  if (className.includes('text-xs')) {
    specs.push('辅助小字');
  }
  if (className.includes('text-sm')) {
    specs.push('小号文字');
  }

  // 图标
  if (componentType.includes('Icon') || componentType.match(/^[A-Z][a-z]+Icon$/)) {
    const iconName = componentType.replace('Icon', '').toLowerCase();
    const iconEmoji: Record<string, string> = {
      search: '🔍',
      user: '👤',
      calendar: '📅',
      chevron: '⬇️',
      close: '❌',
      edit: '✏️',
      delete: '🗑️',
    };
    const emoji = iconEmoji[iconName] || '📌';
    specs.push(`${emoji} ${translateElementName(componentType, props)}`);
  }

  // 占位符
  if (props.placeholder) {
    specs.push(`占位符："${props.placeholder}"`);
  }

  // 默认值
  if (props.defaultValue) {
    specs.push(`默认值："${props.defaultValue}"`);
  }

  // 条件显示
  if (props.showActionButton === false || props.conditional) {
    specs.push('仅在需要时显示');
  }

  return specs.length > 0 ? specs.join(' + ') : '标准样式';
}

/**
 * 解析 React 代码并生成 PRD 表格
 */
export function generatePrdTableFromCode(
  code: string,
  fileName: string = 'Component.tsx',
  componentName?: string
): string {
  const rows: PrdTableRow[] = [];
  const prefix = extractPrefix(fileName, componentName);

  // 简单的代码解析（基于正则，实际项目中可以使用 AST）
  // 提取 JSX 元素
  const jsxPattern = /<(\w+)([^>]*)>([^<]*?)<\/\1>|<(\w+)([^>]*)\/>/g;
  let match;
  let index = 1;

  // 提取组件定义
  const componentMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/);
  const detectedComponentName = componentMatch ? componentMatch[1] : componentName;

  // 提取 props 接口
  const propsInterfaceMatch = code.match(/interface\s+(\w+Props)[^{]*\{([^}]+)\}/);
  const propsFields: string[] = [];
  if (propsInterfaceMatch) {
    const propsContent = propsInterfaceMatch[2];
    const propMatches = propsContent.matchAll(/(\w+)(\??):\s*([^;]+)/g);
    for (const propMatch of propMatches) {
      propsFields.push(propMatch[1]);
    }
  }

  // 解析主要 UI 元素
  const lines = code.split('\n');
  let currentZone = '核心工作台';
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 检测区域变化
    if (line.includes('Header') || line.includes('header') || line.includes('顶部')) {
      currentZone = '顶部导航栏';
    } else if (line.includes('Footer') || line.includes('footer') || line.includes('底部')) {
      currentZone = '底部操作栏';
    } else if (line.includes('Sidebar') || line.includes('aside') || line.includes('侧边')) {
      currentZone = '侧边菜单区';
    } else if (line.includes('Modal') || line.includes('Dialog') || line.includes('弹窗')) {
      currentZone = '弹窗/浮层';
    } else if (line.includes('.map(') || line.includes('List') || line.includes('Card')) {
      currentZone = '内容列表区';
    }

    // 提取关键元素
    const buttonMatch = line.match(/<button[^>]*>([^<]*)<\/button>|<Button[^>]*>([^<]*)<\/Button>/i);
    if (buttonMatch) {
      const text = buttonMatch[1] || buttonMatch[2] || '';
      const classNameMatch = line.match(/className="([^"]+)"/);
      const onClickMatch = line.match(/onClick={([^}]+)}/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Button', { onClick: onClickMatch ? true : false }, text),
        function: generateFunctionDescription('Button', { onClick: onClickMatch ? true : false }, text),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Button', {}),
      });
      index++;
    }

    const inputMatch = line.match(/<input[^>]*\/?>|<Input[^>]*\/?>/i);
    if (inputMatch) {
      const placeholderMatch = line.match(/placeholder="([^"]+)"/);
      const typeMatch = line.match(/type="([^"]+)"/);
      const classNameMatch = line.match(/className="([^"]+)"/);
      const onChangeMatch = line.match(/onChange={([^}]+)}/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Input', { 
          type: typeMatch?.[1] || 'text',
          placeholder: placeholderMatch?.[1],
          onChange: onChangeMatch ? true : false,
        }, placeholderMatch?.[1]),
        function: generateFunctionDescription('Input', { 
          onChange: onChangeMatch ? true : false,
          type: typeMatch?.[1],
        }, placeholderMatch?.[1]),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Input', {
          placeholder: placeholderMatch?.[1],
        }),
      });
      index++;
    }

    const selectMatch = line.match(/<select[^>]*>|<Select[^>]*>/i);
    if (selectMatch) {
      const classNameMatch = line.match(/className="([^"]+)"/);
      const onChangeMatch = line.match(/onChange={([^}]+)}/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Select', { onChange: onChangeMatch ? true : false }),
        function: generateFunctionDescription('Select', { onChange: onChangeMatch ? true : false }),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Select', {}),
      });
      index++;
    }

    // 提取图标
    const iconMatch = line.match(/<(\w+Icon)[^>]*\/?>|<(\w+)\s+className="[^"]*icon[^"]*"/i);
    if (iconMatch) {
      const iconName = iconMatch[1] || iconMatch[2];
      const classNameMatch = line.match(/className="([^"]+)"/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName(iconName, {}),
        function: generateFunctionDescription(iconName, {}),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', iconName, {}),
      });
      index++;
    }

    // 提取标签/徽章
    const badgeMatch = line.match(/<span[^>]*className="[^"]*(badge|tag|label)[^"]*">([^<]+)<\/span>/i);
    if (badgeMatch) {
      const text = badgeMatch[2];
      const classNameMatch = line.match(/className="([^"]+)"/);
      
      rows.push({
        id: `${prefix}${String(index).padStart(3, '0')}`,
        zone: currentZone,
        element: translateElementName('Badge', {}, text),
        function: generateFunctionDescription('Badge', {}, text),
        display: translateDisplaySpecs(classNameMatch?.[1] || '', 'Badge', {}),
      });
      index++;
    }
  }

  // 生成 Markdown 表格
  const tableRows = rows.map(row => 
    `| ${row.id} | ${row.zone} | ${row.element} | ${row.function} | ${row.display} |`
  ).join('\n');

  return `| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |\n| :--- | :--- | :--- | :--- | :--- |\n${tableRows}`;
}

/**
 * 从文件路径读取代码并生成 PRD 表格
 */
export async function generatePrdTableFromFile(filePath: string): Promise<string> {
  // 在浏览器环境中，这需要用户上传文件
  // 在 Node.js 环境中，可以使用 fs 读取
  throw new Error('File reading not implemented. Use generatePrdTableFromCode instead.');
}

/**
 * PRD 配置选项接口
 */
export interface PrdOptions {
  userRole?: string;
  coreValue?: string;
  businessValue?: string;
  prerequisites?: string[];
  pageTitle?: string;
}

/**
 * 从代码注释中提取 PRD 配置
 * 支持格式：
 * @prd
 * @userRole 项目经理
 * @coreValue 提供指令创建、分配、跟踪的完整工作流管理功能
 * @businessValue 确保任务按时完成，提升团队协作效率
 * @prerequisites 用户已登录,具备项目查看权限
 */
export function extractPrdOptionsFromComments(code: string): Partial<PrdOptions> {
  const options: Partial<PrdOptions> = {};
  
  // 提取 @userRole
  const userRoleMatch = code.match(/@userRole\s+([^\n*]+)/);
  if (userRoleMatch) {
    options.userRole = userRoleMatch[1].trim();
  }
  
  // 提取 @coreValue
  const coreValueMatch = code.match(/@coreValue\s+([^\n*]+)/);
  if (coreValueMatch) {
    options.coreValue = coreValueMatch[1].trim();
  }
  
  // 提取 @businessValue
  const businessValueMatch = code.match(/@businessValue\s+([^\n*]+)/);
  if (businessValueMatch) {
    options.businessValue = businessValueMatch[1].trim();
  }
  
  // 提取 @prerequisites（支持逗号分隔的多个条件）
  const prerequisitesMatch = code.match(/@prerequisites\s+([^\n*]+)/);
  if (prerequisitesMatch) {
    options.prerequisites = prerequisitesMatch[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }
  
  // 提取 @pageTitle
  const pageTitleMatch = code.match(/@pageTitle\s+([^\n*]+)/);
  if (pageTitleMatch) {
    options.pageTitle = pageTitleMatch[1].trim();
  }
  
  return options;
}

/**
 * 从代码推断 PRD 配置（AI 推断的默认值）
 */
function inferPrdOptionsFromCode(code: string, pageTitle?: string): PrdOptions {
  const lowerCode = code.toLowerCase();
  
  // 推断核心价值
  let coreValue = '提供用户界面交互功能';
  if (lowerCode.includes('instruction') || lowerCode.includes('指令')) {
    coreValue = '提供指令管理和流转功能，帮助用户高效处理工作任务';
  } else if (lowerCode.includes('search') || lowerCode.includes('搜索')) {
    coreValue = '提供搜索和筛选功能，帮助用户快速定位目标内容';
  } else if (lowerCode.includes('list') || lowerCode.includes('列表')) {
    coreValue = '提供列表展示和浏览功能，帮助用户查看和管理数据项';
  } else if (lowerCode.includes('form') || lowerCode.includes('表单')) {
    coreValue = '提供数据录入和提交功能，帮助用户完成信息收集';
  }

  // 推断用户角色
  let userRole = '用户';
  if (lowerCode.includes('admin') || lowerCode.includes('管理')) {
    userRole = '管理员';
  } else if (lowerCode.includes('manager') || lowerCode.includes('经理')) {
    userRole = '经理';
  } else if (lowerCode.includes('employee') || lowerCode.includes('员工')) {
    userRole = '员工';
  }

  // 推断业务价值
  let businessValue = '提升工作效率';
  if (lowerCode.includes('instruction') || lowerCode.includes('指令')) {
    businessValue = '提升任务处理效率和协作透明度';
  } else if (lowerCode.includes('search')) {
    businessValue = '快速定位所需信息，减少查找时间';
  }

  // 推断前置条件
  const prerequisites: string[] = [];
  if (lowerCode.includes('login') || lowerCode.includes('auth') || lowerCode.includes('登录')) {
    prerequisites.push('用户已登录系统');
  }
  if (lowerCode.includes('permission') || lowerCode.includes('权限')) {
    prerequisites.push('用户具备相应的访问权限');
  }
  if (lowerCode.includes('role') || lowerCode.includes('角色')) {
    prerequisites.push('用户角色已分配');
  }
  if (prerequisites.length === 0) {
    prerequisites.push('用户已进入系统');
  }

  return {
    userRole,
    coreValue,
    businessValue,
    prerequisites,
    pageTitle
  };
}

/**
 * 生成页面综述
 */
function generatePageOverview(code: string, options?: PrdOptions): string {
  const lowerCode = code.toLowerCase();
  
  // 使用传入的配置，如果没有则推断
  const userRole = options?.userRole || '用户';
  const coreValue = options?.coreValue || '提供用户界面交互功能';
  const businessValue = options?.businessValue || '提升工作效率';
  const prerequisites = options?.prerequisites || ['用户已进入系统'];

  // 推断用户动作（这个通常可以从代码推断）
  let userAction = '使用该功能';
  if (lowerCode.includes('search') || lowerCode.includes('搜索')) {
    userAction = '搜索和筛选指令';
  } else if (lowerCode.includes('view') || lowerCode.includes('查看')) {
    userAction = '查看和管理指令列表';
  } else if (lowerCode.includes('create') || lowerCode.includes('创建')) {
    userAction = '创建新的指令';
  }

  return `### 1. 📝 页面综述 (Page Overview)

- **核心价值**: ${coreValue}。
- **用户故事 (User Story)**: "As a ${userRole}, I want to ${userAction}, so that ${businessValue}。"
- **前置条件**: ${prerequisites.join('、')}。`;
}

/**
 * 生成核心业务流程
 */
function generateBusinessFlows(code: string): string {
  const lowerCode = code.toLowerCase();
  const flows: string[] = [];

  // 搜索和筛选流程
  if (lowerCode.includes('search') && lowerCode.includes('sort')) {
    flows.push(`**搜索与排序组合流程**：
1. 用户在搜索框输入关键词，系统实时过滤列表（防抖处理，避免频繁请求）。
2. 用户选择排序方式（最新/最旧/按状态），系统重新排列已过滤的结果。
3. 搜索和排序条件可同时生效，搜索结果按选定规则排序。`);
  } else if (lowerCode.includes('search')) {
    flows.push(`**搜索流程**：
1. 用户在搜索框输入关键词。
2. 系统实时过滤列表，仅显示匹配的指令项。
3. 清空搜索框时，恢复显示全部列表。`);
  } else if (lowerCode.includes('sort')) {
    flows.push(`**排序流程**：
1. 用户从下拉框选择排序方式（最新/最旧/按状态）。
2. 系统按选定规则重新排列指令列表。
3. 排序状态保持，直到用户再次更改。`);
  }

  // 催办流程
  if (lowerCode.includes('催办') || lowerCode.includes('onactionclick')) {
    flows.push(`**催办流程**：
1. 用户点击指令卡片上的"催办"按钮。
2. 系统向指令负责人发送催办通知（站内消息或邮件）。
3. 系统记录催办操作日志，便于后续追踪。`);
  }

  // 列表浏览流程
  if (lowerCode.includes('map') || lowerCode.includes('list')) {
    flows.push(`**列表浏览流程**：
1. 页面加载时，系统从数据源获取指令列表。
2. 用户滚动浏览列表，查看各个指令卡片。
3. 每个卡片展示指令的核心信息（标题、状态、负责人、日期等）。
4. 用户可通过点击卡片或相关按钮进行进一步操作。`);
  }

  if (flows.length === 0) {
    flows.push('**基础交互流程**：用户与界面元素交互，系统响应并更新显示内容。');
  }

  return `### 3. 🔄 核心业务流程 (Core Business Flows)

${flows.join('\n\n')}`;
}

/**
 * 生成异常与边界情况
 */
function generateExceptions(code: string): string {
  const lowerCode = code.toLowerCase();
  const exceptions: string[] = [];

  // 空状态
  if (lowerCode.includes('map') || lowerCode.includes('list') || lowerCode.includes('length === 0')) {
    exceptions.push(`**空状态 (Empty State)**：
- 当列表为空时，显示友好的空状态提示（如"暂无指令"或空状态插图）。
- 空状态应引导用户进行首次操作（如"创建第一个指令"）。`);
  }

  // 加载状态
  if (lowerCode.includes('loading') || lowerCode.includes('isloading') || lowerCode.includes('skeleton')) {
    exceptions.push(`**加载状态 (Loading State)**：
- 数据加载时显示骨架屏（Skeleton Screen）或加载动画。
- 骨架屏应模拟实际内容布局，提供良好的视觉连续性。`);
  } else {
    exceptions.push(`**加载状态 (Loading State)**：
- 数据加载时显示加载指示器（Spinner），避免页面空白。
- 加载时间超过3秒时，显示加载进度提示。`);
  }

  // 网络错误
  exceptions.push(`**网络错误 (Network Error)**：
- 网络请求失败时，显示错误提示（Toast 消息）。
- 提供"重试"按钮，允许用户重新发起请求。
- 错误信息应用户友好，避免显示技术错误码。`);

  // 数据溢出
  if (lowerCode.includes('truncate') || lowerCode.includes('ellipsis') || lowerCode.includes('overflow')) {
    exceptions.push(`**文本溢出 (Text Overflow)**：
- 标题或长文本超出容器时，使用省略号（...）截断。
- 悬停时显示完整内容的 Tooltip 提示。`);
  } else {
    exceptions.push(`**文本溢出 (Text Overflow)**：
- 长文本应合理截断，避免破坏布局。
- 关键信息（如标题）应完整显示或提供展开功能。`);
  }

  // 条件显示
  if (lowerCode.includes('showactionbutton') || lowerCode.includes('conditional')) {
    exceptions.push(`**条件显示 (Conditional Rendering)**：
- 某些元素仅在满足条件时显示（如"催办"按钮仅在需要时出现）。
- 条件不满足时，元素不占用布局空间，保持界面整洁。`);
  }

  return `### 4. ⚠️ 异常与边界 (Exceptions & Edge Cases)

${exceptions.join('\n\n')}`;
}

/**
 * 生成数据埋点与性能要求
 */
function generateAnalytics(code: string): string {
  const lowerCode = code.toLowerCase();
  const tracking: string[] = [];
  const performance: string[] = [];

  // 埋点事件
  if (lowerCode.includes('search') || lowerCode.includes('onchange')) {
    tracking.push('- **搜索行为追踪**：记录用户搜索关键词、搜索频率、搜索结果点击率。');
  }
  if (lowerCode.includes('sort') || lowerCode.includes('onselect')) {
    tracking.push('- **排序行为追踪**：记录用户选择的排序方式，分析用户偏好。');
  }
  if (lowerCode.includes('onclick') || lowerCode.includes('button')) {
    tracking.push('- **按钮点击追踪**：记录所有按钮的点击事件（如"催办"按钮点击率）。');
  }
  if (lowerCode.includes('card') || lowerCode.includes('item')) {
    tracking.push('- **列表交互追踪**：记录卡片点击率、列表滚动深度、停留时长。');
  }

  if (tracking.length === 0) {
    tracking.push('- **基础交互追踪**：记录页面访问量、用户停留时间、关键操作点击率。');
  }

  // 性能要求
  if (lowerCode.includes('map') || lowerCode.includes('list')) {
    performance.push('- **列表渲染性能**：首次加载时间 < 1.5秒，支持虚拟滚动（如列表项超过50条）。');
  }
  if (lowerCode.includes('search') && lowerCode.includes('onchange')) {
    performance.push('- **搜索响应性能**：搜索输入防抖延迟 300ms，过滤结果实时更新，响应时间 < 100ms。');
  }
  performance.push('- **页面加载性能**：首屏渲染时间 < 2秒，支持懒加载优化。');
  performance.push('- **数据分页规则**：列表数据采用分页加载，每页显示 20 条，支持无限滚动或分页器。');

  return `### 5. 📊 数据埋点与性能 (Analytics & NFR)

**追踪事件 (Tracking)**：
${tracking.join('\n')}

**性能要求 (Performance)**：
${performance.join('\n')}`;
}

/**
 * 生成完整的页面级 PRD 文档
 * 
 * 优先级：函数参数 > 代码注释 > AI推断
 * 
 * @param code - React 组件代码字符串
 * @param fileName - 文件名（用于提取功能ID前缀）
 * @param componentName - 组件名（可选，优先使用）
 * @param userOptions - 用户提供的配置（优先级最高）
 * @returns 完整的页面级 PRD 文档（Markdown 格式）
 */
export function generatePageLevelPrd(
  code: string,
  fileName: string = 'Component.tsx',
  componentName?: string,
  userOptions?: PrdOptions
): string {
  // 提取组件名
  const componentMatch = code.match(/export\s+(?:default\s+)?function\s+(\w+)/);
  const detectedComponentName = componentMatch ? componentMatch[1] : componentName;

  // 1. AI 推断（默认值）
  const aiInferred = inferPrdOptionsFromCode(code, userOptions?.pageTitle);
  
  // 2. 从代码注释提取
  const commentOptions = extractPrdOptionsFromComments(code);
  
  // 3. 合并：AI推断 < 代码注释 < 用户参数（优先级递增）
  const finalOptions: PrdOptions = {
    ...aiInferred,
    ...commentOptions,
    ...userOptions
  };

  // 生成各个部分
  const pageOverview = generatePageOverview(code, finalOptions);
  const elementSpec = generatePrdTableFromCode(code, fileName, detectedComponentName);
  const businessFlows = generateBusinessFlows(code);
  const exceptions = generateExceptions(code);
  const analytics = generateAnalytics(code);

  // 组合完整文档
  return `**Role**: Professional Product Manager (PM).  
**Task**: Based on the current UI component code/image, generate a comprehensive **Page-Level PRD**.

---

${pageOverview}

---

### 2. 🧩 界面元素清单 (Element Specification)

${elementSpec}

---

${businessFlows}

---

${exceptions}

---

${analytics}

---

**Constraint**: Use professional product language. Avoid pure technical jargon (like specific API endpoints or SQL). Focus on Business Logic.`;
}

/**
 * 从代码推断 PRD 配置（用于 UI 显示 AI 推断的默认值）
 */
export function inferPrdOptions(code: string, pageTitle?: string): PrdOptions {
  return inferPrdOptionsFromCode(code, pageTitle);
}

