'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { MermaidDiagram } from './MermaidDiagram';
import { ArchitectureTopology } from './ArchitectureTopology';
import { clsx } from 'clsx';
import type { ProjectMeta } from '@/types/fractal';

interface ProjectBlueprintProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType; // 初始标签页
  initialData?: Partial<ProjectMeta>; // 需要自动填充的数据
}

type TabType = 'profile' | 'business' | 'interaction' | 'data' | 'topology' | 'rules' | 'userStories';

interface DataDictionaryField {
  fieldName: string;
  type: string;
  sourceNode: string;
  description: string;
}

// 解析数据规则文本，提取字段信息
const parseDataRules = (dataRules: string): Array<{
  fieldName: string;
  type: string;
  description: string;
}> => {
  const fields: Array<{ fieldName: string; type: string; description: string }> = [];
  
  // 尝试多种解析模式
  // 模式1: "字段名: 类型, 描述" 或 "字段名: 描述"
  const colonPattern = /([A-Za-z\u4e00-\u9fa5\s]+?)\s*[:：]\s*([^，,]+)(?:[，,]|$)/g;
  let match;
  while ((match = colonPattern.exec(dataRules)) !== null) {
    const fieldName = match[1].trim();
    const rest = match[2].trim();
    
    // 尝试提取类型（string, int, number, boolean等）
    const typeMatch = rest.match(/\b(string|int|integer|number|boolean|bool|date|datetime|array|object)\b/i);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'string';
    const description = rest.replace(/\b(string|int|integer|number|boolean|bool|date|datetime|array|object)\b/gi, '').trim();
    
    if (fieldName && fieldName.length < 50) {
      fields.push({
        fieldName,
        type,
        description: description || '无描述',
      });
    }
  }
  
  // 模式2: 如果模式1没有找到，尝试查找常见的字段模式
  if (fields.length === 0) {
    // 查找类似 "Tracking Number", "Driver Name" 等英文字段
    const englishFieldPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    const englishFields = dataRules.match(englishFieldPattern);
    if (englishFields && englishFields.length > 0) {
      englishFields.forEach((field) => {
        if (field.length > 2 && field.length < 30) {
          fields.push({
            fieldName: field,
            type: 'string',
            description: '从数据规则中提取',
          });
        }
      });
    }
  }
  
  return fields;
};

// 从数据库schema中提取字段
const parseDbSchema = (schema: string): Array<{
  fieldName: string;
  type: string;
  description: string;
}> => {
  const fields: Array<{ fieldName: string; type: string; description: string }> = [];
  
  // 查找类似 "field_name: type" 或 "field_name type" 的模式
  const fieldPattern = /(\w+)\s*[:：]\s*(\w+)|(\w+)\s+(\w+)\b/g;
  let match;
  while ((match = fieldPattern.exec(schema)) !== null) {
    const fieldName = match[1] || match[3] || '';
    const fieldType = match[2] || match[4] || 'string';
    
    if (fieldName && !['table', 'create', 'primary', 'key', 'index', 'foreign'].includes(fieldName.toLowerCase())) {
      fields.push({
        fieldName,
        type: fieldType.toLowerCase(),
        description: '数据库字段',
      });
    }
  }
  
  return fields;
};

export function ProjectBlueprint({ isOpen, onClose, initialTab, initialData }: ProjectBlueprintProps) {
  const { nodes, edges, projectMeta, globalRules, updateProjectMeta, updateGlobalRules } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'profile');
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // 管理节点折叠状态：key为 'events-{nodeId}' 或 'stories-{nodeId}'
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Refs for layout debugging
  const modalContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // 当 isOpen 变化时，重置 activeTab（如果传入了 initialTab）
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // 标签页切换动画
  const handleTabChange = (tabId: TabType) => {
    if (tabId === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      // 滚动到顶部
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setTimeout(() => setIsTransitioning(false), 150);
    }, 50);
  };

  // 键盘快捷键支持
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC 关闭
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      // Ctrl/Cmd + 数字键切换标签页
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const tabs: TabType[] = ['profile', 'userStories', 'business', 'interaction', 'data', 'topology', 'rules'];
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          handleTabChange(tabs[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 确保打开模态框时不会锁定全局滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'auto';
    }
    return () => {
      // 清理：当模态框关闭或组件卸载时，重置样式
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 调试：记录 modal 容器和内容容器的布局指标
  useEffect(() => {
    if (isOpen && modalContainerRef.current && scrollContainerRef.current) {
      const modal = modalContainerRef.current;
      const content = scrollContainerRef.current;
      
      console.log('ProjectBlueprint modal metrics', {
        clientHeight: modal.clientHeight,
        scrollHeight: modal.scrollHeight,
        offsetHeight: modal.offsetHeight
      });
      
      console.log('ProjectBlueprint content metrics', {
        clientHeight: content.clientHeight,
        scrollHeight: content.scrollHeight,
        offsetHeight: content.offsetHeight
      });
    }
  }, [isOpen, activeTab]);
  
  // 项目画像本地状态 - 提供默认值防止 undefined
  const defaultProjectMeta = {
    projectName: '未命名项目',
    industry: '通用互联网',
    targetAudience: '通用用户',
    description: '',
    version: '1.0.0',
  };
  const [localProjectMeta, setLocalProjectMeta] = useState(projectMeta || defaultProjectMeta);
  
  // 同步 store 中的 projectMeta 到本地状态，并在打开时应用初始数据
  useEffect(() => {
    if (projectMeta) {
      setLocalProjectMeta(projectMeta);
    } else {
      setLocalProjectMeta(defaultProjectMeta);
    }
  }, [projectMeta]);

  // 当组件打开且有初始数据时，自动填充到项目画像（只执行一次）
  const initialDataAppliedRef = React.useRef(false);
  useEffect(() => {
    if (isOpen && initialData && Object.keys(initialData).length > 0 && !initialDataAppliedRef.current) {
      // 只在首次打开且有初始数据时应用
      const mergedMeta = { ...localProjectMeta, ...initialData };
      setLocalProjectMeta(mergedMeta);
      updateProjectMeta(initialData);
      initialDataAppliedRef.current = true;
    }
    // 当关闭时重置标志
    if (!isOpen) {
      initialDataAppliedRef.current = false;
    }
  }, [isOpen, initialData, localProjectMeta, updateProjectMeta]);

  // 生成交互拓扑图（页面导航结构）
  const interactionFlowDiagram = useMemo(() => {
    if (nodes.length === 0) {
      return '';
    }

    const lines: string[] = ['graph TD'];
    
    // 添加节点定义
    nodes.forEach((node) => {
      const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
      const nodeLabel = node.data.label || node.id;
      lines.push(`    ${nodeId}["${nodeLabel}"]`);
    });

    // 添加边
    edges.forEach((edge) => {
      const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
      const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
      const label = String(edge.label || '连接');
      // Mermaid 标签中的特殊字符需要转义或使用引号
      const safeLabel = label.replace(/"/g, '&quot;').replace(/\n/g, ' ');
      lines.push(`    ${sourceId} -->|"${safeLabel}"| ${targetId}`);
    });

    return lines.join('\n');
  }, [nodes, edges]);

  // 生成业务泳道图（Sequence Diagram格式）
  const generateSwimlaneCode = (): string => {
    if (nodes.length === 0 || edges.length === 0) {
      return '';
    }

    const lines: string[] = ['sequenceDiagram'];
    const participants = new Map<string, string>(); // node ID -> role label
    const participantOrder: string[] = []; // 保持participant的顺序
    
    // 第一步：收集所有参与者（从edges中提取角色或使用节点标签）
    edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
      if (!sourceNode || !targetNode) return;

      const label = String(edge.label || '');
      
      // 尝试从edge label中提取角色信息
      // 格式可能是: "Role: User -> Role: System: Action" 
      const rolePattern = /(?:Role|角色)[:：]\s*([^\s→,\n]+)/gi;
      const roleMatches = [...label.matchAll(rolePattern)];
      
      let sourceRole: string | null = null;
      let targetRole: string | null = null;

      if (roleMatches.length >= 2) {
        // 有两个角色，第一个是source，第二个是target
        sourceRole = roleMatches[0][1].trim();
        targetRole = roleMatches[1][1].trim();
      } else if (roleMatches.length === 1) {
        // 只有一个角色，假设是source的角色
        sourceRole = roleMatches[0][1].trim();
      }

      // 如果没有从label中提取到角色，使用节点标签
      if (!sourceRole) {
        sourceRole = sourceNode.data.label || sourceNode.id;
      }
      if (!targetRole) {
        targetRole = targetNode.data.label || targetNode.id;
      }

      // 将角色添加到participants map（去重）
      if (!participants.has(edge.source)) {
        participants.set(edge.source, sourceRole);
        participantOrder.push(edge.source);
      }
      if (!participants.has(edge.target)) {
        participants.set(edge.target, targetRole);
        participantOrder.push(edge.target);
      }
    });

    // 第二步：生成participant声明（使用角色名称作为participant ID）
    const roleToSafeId = new Map<string, string>(); // role label -> safe ID
    const uniqueRoles = new Set<string>();
    
    // 先收集所有唯一的角色
    participantOrder.forEach((nodeId) => {
      const roleLabel = participants.get(nodeId) || nodeId;
      uniqueRoles.add(roleLabel);
    });
    
    // 为每个唯一角色生成安全的ID
    Array.from(uniqueRoles).forEach((roleLabel) => {
      // 生成安全的ID（只保留字母、数字、下划线、中文）
      let safeId = roleLabel.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_]/g, '_');
      // 如果ID以数字开头，添加前缀
      if (/^\d/.test(safeId)) {
        safeId = 'P' + safeId;
      }
      // 如果ID为空，使用默认值
      if (!safeId || safeId === '') {
        safeId = 'Participant_' + roleLabel.replace(/[^a-zA-Z0-9]/g, '_');
      }
      // 检查是否有重复，如果有则添加数字后缀
      let counter = 1;
      let uniqueId = safeId;
      while (Array.from(roleToSafeId.values()).includes(uniqueId)) {
        uniqueId = safeId + '_' + counter;
        counter++;
      }
      safeId = uniqueId;
      roleToSafeId.set(roleLabel, safeId);
      
      lines.push(`    participant ${safeId} as ${roleLabel}`);
    });

    // 第三步：生成交互序列
      edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;

      const sourceRole = participants.get(edge.source) || sourceNode.data.label || edge.source;
      const targetRole = participants.get(edge.target) || targetNode.data.label || edge.target;
      
      // 从label中提取action（移除角色信息后的部分）
      let action = String(edge.label || 'Action');
      
      // 移除角色信息，保留action
      action = action.replace(/(?:Role|角色)[:：]\s*[^\s→,\n]+/gi, '').trim();
      action = action.replace(/->>/g, '').trim();
      action = action.replace(/^\w+\s*[:：]\s*/, '').trim(); // 移除开头的 "Role: "
      
      if (!action || action === '') {
        action = 'Action';
      }

      const safeAction = action.replace(/"/g, '&quot;').replace(/\n/g, ' ');
      
      // 获取安全的participant ID
      let sourceSafeId = roleToSafeId.get(sourceRole);
      if (!sourceSafeId) {
        sourceSafeId = sourceRole.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_]/g, '_');
        if (/^\d/.test(sourceSafeId) || !sourceSafeId) {
          sourceSafeId = 'P_' + sourceSafeId;
        }
      }
      
      let targetSafeId = roleToSafeId.get(targetRole);
      if (!targetSafeId) {
        targetSafeId = targetRole.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_]/g, '_');
        if (/^\d/.test(targetSafeId) || !targetSafeId) {
          targetSafeId = 'P_' + targetSafeId;
        }
      }
      
      lines.push(`    ${sourceSafeId}->>${targetSafeId}: ${safeAction}`);
      });

      return lines.join('\n');
  };

  // 生成业务泳道图（基于角色）
  const businessProcessDiagram = useMemo(() => {
    return generateSwimlaneCode();
  }, [nodes, edges]);

  // 生成用户旅程图数据（用于表格和图表）
  const generateUserJourneyTable = useMemo(() => {
    const allUserStories: Array<{
      nodeId: string;
      nodeLabel: string;
      story: {
        id: string;
        role: string;
        activity: string;
        value: string;
        acceptanceCriteria?: string[];
      };
    }> = [];

    nodes.forEach((node) => {
      const userStories = node.data.artifacts?.userStories || [];
      userStories.forEach((story) => {
        allUserStories.push({
          nodeId: node.id,
          nodeLabel: node.data.label || node.id,
          story: {
            id: story.id,
            role: story.role,
            activity: story.activity,
            value: story.value,
            acceptanceCriteria: story.acceptanceCriteria,
          },
        });
      });
    });

    if (allUserStories.length === 0) return null;

    // 按角色分组，然后按节点分组
    const roleGroups = new Map<string, typeof allUserStories>();
    allUserStories.forEach((item) => {
      const role = item.story.role;
      if (!roleGroups.has(role)) {
        roleGroups.set(role, []);
      }
      roleGroups.get(role)!.push(item);
    });

    return { roleGroups, allUserStories };
  }, [nodes]);

  // 生成用户旅程图 Mermaid 图表
  const generateUserJourneyDiagram = useMemo(() => {
    if (!generateUserJourneyTable || generateUserJourneyTable.allUserStories.length === 0) {
      return '';
    }

    const lines: string[] = ['journey'];
    
    // 获取第一个用户故事的角色作为旅程标题
    const firstStory = generateUserJourneyTable.allUserStories[0];
    const journeyTitle = `${firstStory.story.role}的完整旅程`;
    lines.push(`    title ${journeyTitle}`);
    
    // 按节点分组用户故事，每个节点作为一个 section
    const storiesByNode = new Map<string, typeof generateUserJourneyTable.allUserStories>();
    generateUserJourneyTable.allUserStories.forEach((item) => {
      if (!storiesByNode.has(item.nodeId)) {
        storiesByNode.set(item.nodeId, []);
      }
      storiesByNode.get(item.nodeId)!.push(item);
    });

    // 按节点顺序生成旅程步骤
    nodes.forEach((node) => {
      const nodeStories = storiesByNode.get(node.id) || [];
      if (nodeStories.length > 0) {
        const nodeLabel = (node.data.label || node.id).replace(/"/g, '&quot;').substring(0, 30);
        lines.push(`    section ${nodeLabel}`);
        
        // 为每个用户故事添加步骤
        nodeStories.forEach((item) => {
          const stepLabel = item.story.activity.replace(/"/g, '&quot;').substring(0, 40);
          const satisfaction = 75; // 默认满意度
          const role = item.story.role.replace(/"/g, '&quot;').substring(0, 20);
          lines.push(`      ${stepLabel}: ${satisfaction}: ${role}`);
        });
      }
    });

    return lines.join('\n');
  }, [generateUserJourneyTable, nodes]);

  // 为单个用户故事生成Mermaid序列图（基于业务事件）
  const generateStorySequenceDiagram = (nodeId: string, storyId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return '';

    const events = node.data.artifacts?.events || [];
    const story = node.data.artifacts?.userStories?.find(s => s.id === storyId);
    if (!story || events.length === 0) return '';

    const nodeLabel = node.data.label || node.id;
    const safeNodeId = nodeLabel.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_]/g, '_');
    
    const lines: string[] = ['sequenceDiagram'];
    lines.push(`    participant User as 用户`);
    lines.push(`    participant ${safeNodeId} as ${nodeLabel}`);
    
    // 收集所有需要的服务参与者
    const allServices = new Set<string>();
    events.forEach((event) => {
      event.processFlow.forEach((step) => {
        // 提取服务名称（从action中提取，或使用通用服务）
        let serviceName = '业务逻辑服务';
        if (step.action.includes('服务') || step.action.includes('Service')) {
          const match = step.action.match(/([^，,。.\n]+(?:服务|Service))/);
          if (match) serviceName = match[1];
        } else if (step.action.includes('API') || step.action.includes('接口')) {
          serviceName = 'API服务';
        } else if (step.action.includes('校验') || step.action.includes('验证')) {
          serviceName = '校验服务';
        } else if (step.action.includes('计算') || step.action.includes('处理')) {
          serviceName = '计算服务';
        } else if (step.action.includes('更新') || step.action.includes('保存')) {
          serviceName = '数据服务';
        }
        allServices.add(serviceName);
      });
    });

    // 为每个服务添加participant
    const serviceIds = new Map<string, string>();
    Array.from(allServices).forEach((serviceName, idx) => {
      const safeServiceId = `Service${idx + 1}`;
      serviceIds.set(serviceName, safeServiceId);
      lines.push(`    participant ${safeServiceId} as ${serviceName}`);
    });

    // 为每个业务事件生成序列
    events.forEach((event, eventIdx) => {
      if (eventIdx > 0) {
        lines.push(`    Note over User,${safeNodeId}: --- 事件: ${event.name} ---`);
      }

      // 生成触发事件
      lines.push(`    User->>${safeNodeId}: ${event.trigger}`);
      
      // 生成流程步骤
      let lastServiceId: string | null = null;
      event.processFlow.forEach((step, stepIdx) => {
        // 确定当前步骤使用的服务
        let serviceName = '业务逻辑服务';
        if (step.action.includes('服务') || step.action.includes('Service')) {
          const match = step.action.match(/([^，,。.\n]+(?:服务|Service))/);
          if (match) serviceName = match[1];
        } else if (step.action.includes('API') || step.action.includes('接口')) {
          serviceName = 'API服务';
        } else if (step.action.includes('校验') || step.action.includes('验证')) {
          serviceName = '校验服务';
        } else if (step.action.includes('计算') || step.action.includes('处理')) {
          serviceName = '计算服务';
        } else if (step.action.includes('更新') || step.action.includes('保存')) {
          serviceName = '数据服务';
        }
        
        const serviceId = serviceIds.get(serviceName) || 'Service1';
        
        if (stepIdx === 0) {
          // 第一步：从页面到服务
          lines.push(`    ${safeNodeId}->>${serviceId}: ${step.action}`);
          lastServiceId = serviceId;
        } else {
          // 后续步骤
          if (lastServiceId && lastServiceId !== serviceId) {
            // 切换服务，先返回再调用新服务
            lines.push(`    ${lastServiceId}-->>${safeNodeId}: 完成`);
            lines.push(`    ${safeNodeId}->>${serviceId}: ${step.action}`);
          } else {
            // 同一服务内的连续操作
            lines.push(`    ${serviceId}->>${serviceId}: ${step.action}`);
          }
          lastServiceId = serviceId;
        }
      });

      // 最后一步返回给用户
      const finalServiceId = lastServiceId || 'Service1';
      lines.push(`    ${finalServiceId}-->>${safeNodeId}: ${event.outcome}`);
      lines.push(`    ${safeNodeId}-->>User: 完成`);
    });

    return lines.join('\n');
  };

  // 生成全局数据字典（聚合所有节点的数据定义）
  const dataDictionary = useMemo((): DataDictionaryField[] => {
    const fields: DataDictionaryField[] = [];

    // 遍历所有节点
    nodes.forEach((node) => {
      const nodeLabel = node.data.label || node.id;
      const nodeType = node.type;
      
      // 1. 检查是否是service类型节点
      if (nodeType === 'service') {
        // 从impl artifact中提取数据库schema
        const dbSchema = node.data.artifacts?.impl?.dbSchema || '';
        if (dbSchema) {
          const schemaFields = parseDbSchema(dbSchema);
          schemaFields.forEach((field) => {
            fields.push({
              ...field,
              sourceNode: nodeLabel,
            });
          });
        }
        
        // 从impl artifact中提取API端点定义
        const apiEndpoints = node.data.artifacts?.impl?.apiEndpoints || [];
        apiEndpoints.forEach((endpoint) => {
          // 尝试从API端点中提取字段
          const endpointFields = parseDataRules(endpoint);
          endpointFields.forEach((field) => {
            fields.push({
              ...field,
              sourceNode: nodeLabel,
            });
          });
        });
      }
      
      // 2. 从PRD requirements中提取数据规则
      const requirements = node.data.artifacts?.spec?.requirements || [];
      const requirementsText = Array.isArray(requirements) 
        ? requirements.join('\n') 
        : String(requirements || '');
      
      // 检查是否包含markdown表格
      if (requirementsText.includes('|') && (requirementsText.includes('数据规则') || requirementsText.includes('Data Rules'))) {
        // 解析Markdown表格
        const lines = requirementsText.split('\n');
        let headers: string[] = [];
        let dataRulesIndex = -1;
        
        // 找到表头
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('|') && (line.includes('数据规则') || line.includes('Data Rules'))) {
            headers = line.split('|').map(h => h.trim()).filter(h => h);
            dataRulesIndex = headers.findIndex(h => h.includes('数据规则') || h.includes('Data Rules'));
            break;
          }
        }
        
        // 解析数据行
        if (dataRulesIndex >= 0) {
          lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('|') && !trimmed.includes('---') && !trimmed.includes('数据规则') && !trimmed.includes('Data Rules')) {
              const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
              if (cells.length > dataRulesIndex) {
                const dataRule = cells[dataRulesIndex];
                const parsedFields = parseDataRules(dataRule);
                parsedFields.forEach((field) => {
                  fields.push({
                    ...field,
                    sourceNode: nodeLabel,
                  });
                });
              }
            }
          });
        }
      } else if (requirementsText.includes('数据规则') || requirementsText.includes('Data Rules') || requirementsText.includes('字段') || requirementsText.includes('field')) {
        // 如果没有表格格式，但包含数据规则关键词，也尝试解析
        const parsedFields = parseDataRules(requirementsText);
        parsedFields.forEach((field) => {
          fields.push({
            ...field,
            sourceNode: nodeLabel,
          });
        });
      }
    });

    // 如果没有找到任何字段，返回空数组（不显示 mock 数据）
    return fields;
  }, [nodes]);

  // 检查是否应该渲染
  if (!isOpen || !mounted || typeof window === 'undefined' || !document.body) {
    return null;
  }

  // 模态框内容 - 使用 React.createElement 避免 JSX 解析问题
  return createPortal(
    React.createElement('div', {
      className: 'fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
      style: { 
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none'
      },
      onMouseDown: (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }
    },
    React.createElement('div', {
      ref: modalContainerRef,
      className: 'relative w-full max-w-[98vw] h-[98vh] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl flex flex-col transition-all duration-300',
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
      style: { 
        display: 'flex', 
        flexDirection: 'column',
        height: '98vh',
        maxHeight: '98vh',
        overflow: 'hidden',
        transform: isOpen ? 'scale(1)' : 'scale(0.95)',
        opacity: isOpen ? 1 : 0
      }
    },
    // Header - 固定顶部
    React.createElement('div', { 
      className: 'flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0 bg-zinc-900 sticky top-0 z-30',
      style: { position: 'sticky', top: 0, zIndex: 30 }
    },
      React.createElement('h2', { className: 'text-xl font-semibold text-zinc-100' }, '📘 项目蓝图'),
      React.createElement('button', {
        onClick: onClose,
        className: 'p-2 hover:bg-zinc-800 rounded-md transition-all duration-200 hover:scale-110 active:scale-95',
        title: '关闭 (ESC)',
        'aria-label': '关闭项目蓝图'
      }, React.createElement(X, { className: 'w-5 h-5 text-zinc-400 hover:text-zinc-200 transition-colors' }))
    ),
    // Tabs - 固定顶部（在 Header 下方）
    React.createElement('div', { 
      className: 'flex border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent flex-shrink-0',
      style: { 
        position: 'sticky', 
        top: '73px', // Header 高度（p-4 + 内容高度）
        zIndex: 20,
        backgroundColor: 'rgba(24, 24, 27, 0.95)' // zinc-900/95
      }
    },
      [
        { id: 'profile' as TabType, label: '项目画像', icon: '🎭' },
        { id: 'userStories' as TabType, label: '用户故事', icon: '📖' },
        { id: 'business' as TabType, label: '业务泳道图', icon: '🏊' },
        { id: 'interaction' as TabType, label: '交互拓扑图', icon: '🔄' },
        { id: 'data' as TabType, label: '全局数据字典', icon: '📊' },
        { id: 'topology' as TabType, label: '架构拓扑图', icon: '🗺️' },
        { id: 'rules' as TabType, label: '全局规则', icon: '📋' },
      ].map((tab, index) =>
        React.createElement('button', {
          key: tab.id,
          onClick: () => handleTabChange(tab.id),
          className: clsx(
            "flex-shrink-0 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap",
            activeTab === tab.id
              ? "border-blue-500 text-blue-400 bg-blue-500/5 scale-105"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 hover:scale-102"
          ),
          title: `切换到${tab.label} (Ctrl+${index + 1})`,
          'aria-label': tab.label,
          'aria-selected': activeTab === tab.id
        },
        React.createElement('span', {}, tab.icon),
        React.createElement('span', {}, tab.label)
        )
      )
    ),
    // Content - 内容区域（可滚动）
    React.createElement('div', { 
      ref: scrollContainerRef,
      className: clsx(
        'p-6 overflow-y-auto overflow-x-hidden transition-opacity duration-200',
        isTransitioning && 'opacity-50'
      ),
      style: { 
        flex: '1 1 0%',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch', // iOS 平滑滚动
        scrollbarWidth: 'thin', // Firefox
        scrollbarColor: '#71717a #27272a', // Firefox: thumb track
        scrollBehavior: 'smooth' // 平滑滚动
      }
    },
      activeTab === 'profile' && React.createElement('div', { className: 'space-y-6', style: { minHeight: 0 } },
        // 如果有初始数据，显示提示信息
        initialData && React.createElement('div', { 
          className: 'bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4' 
        },
          React.createElement('div', { className: 'flex items-start gap-3' },
            React.createElement('div', { className: 'flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-medium text-blue-400 mt-0.5' }, '!'),
            React.createElement('div', { className: 'flex-1' },
              React.createElement('p', { className: 'text-sm font-medium text-zinc-200 mb-1' }, '需要更多信息'),
              React.createElement('p', { className: 'text-xs text-zinc-400' }, '请完善以下项目画像信息，以便我们更好地理解您的需求并生成准确的产品结构。')
            )
          )
        ),
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '定义项目的基本信息和目标用户画像。'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'projectName', className: 'text-sm font-medium text-zinc-300 mb-2' }, '项目名称'),
            React.createElement('input', {
              id: 'projectName',
              type: 'text',
              className: 'w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50',
              placeholder: '例如：UniUni Cockpit',
              value: localProjectMeta.projectName,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const newMeta = { ...localProjectMeta, projectName: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ projectName: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'industry', className: 'text-sm font-medium text-zinc-300 mb-2' }, '行业领域'),
            React.createElement('input', {
              id: 'industry',
              type: 'text',
              className: 'w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50',
              placeholder: '例如：物流、金融科技、社交媒体',
              value: localProjectMeta.industry,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const newMeta = { ...localProjectMeta, industry: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ industry: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'targetAudience', className: 'text-sm font-medium text-zinc-300 mb-2' }, '目标用户'),
            React.createElement('input', {
              id: 'targetAudience',
              type: 'text',
              className: 'w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50',
              placeholder: '例如：B2B企业用户、Z世代游戏玩家',
              value: localProjectMeta.targetAudience,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const newMeta = { ...localProjectMeta, targetAudience: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ targetAudience: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col md:col-span-2' },
            React.createElement('label', { htmlFor: 'description', className: 'text-sm font-medium text-zinc-300 mb-2' }, '项目简介'),
            React.createElement('textarea', {
              id: 'description',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '描述项目的核心价值和目标',
              value: localProjectMeta.description || '',
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newMeta = { ...localProjectMeta, description: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ description: e.target.value });
              }
            })
          ),
          // 扩展字段 - 用于信息补充
          React.createElement('div', { className: 'flex flex-col md:col-span-2' },
            React.createElement('label', { htmlFor: 'applicationScope', className: 'text-sm font-medium text-zinc-300 mb-2' }, '所属行业与应用范围'),
            React.createElement('textarea', {
              id: 'applicationScope',
              className: 'w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：城市应急、园区运维、快运、家电维保等',
              value: localProjectMeta.applicationScope || '',
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newMeta = { ...localProjectMeta, applicationScope: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ applicationScope: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col md:col-span-2' },
            React.createElement('label', { htmlFor: 'coreObjectScale', className: 'text-sm font-medium text-zinc-300 mb-2' }, '核心对象规模'),
            React.createElement('textarea', {
              id: 'coreObjectScale',
              className: 'w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：每日事件/工单量、车辆/技师数量、站点/设备数量、覆盖城市/区域',
              value: localProjectMeta.coreObjectScale || '',
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newMeta = { ...localProjectMeta, coreObjectScale: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ coreObjectScale: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col md:col-span-2' },
            React.createElement('label', { htmlFor: 'keyRequiredFunctions', className: 'text-sm font-medium text-zinc-300 mb-2' }, '关键必需功能'),
            React.createElement('textarea', {
              id: 'keyRequiredFunctions',
              className: 'w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：GIS定位、路线优化、跨部门联动、移动端表单、SLA/KPI、语音/对讲、IoT/车载终端接入',
              value: localProjectMeta.keyRequiredFunctions || '',
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newMeta = { ...localProjectMeta, keyRequiredFunctions: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ keyRequiredFunctions: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col md:col-span-2' },
            React.createElement('label', { htmlFor: 'integratedSystems', className: 'text-sm font-medium text-zinc-300 mb-2' }, '需要对接的系统与数据源'),
            React.createElement('textarea', {
              id: 'integratedSystems',
              className: 'w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：地图服务、CRM/ERP、车载OBD/北斗、消息/视频平台',
              value: localProjectMeta.integratedSystems || '',
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newMeta = { ...localProjectMeta, integratedSystems: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ integratedSystems: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col md:col-span-2' },
            React.createElement('label', { htmlFor: 'complianceConstraints', className: 'text-sm font-medium text-zinc-300 mb-2' }, '合规与约束'),
            React.createElement('textarea', {
              id: 'complianceConstraints',
              className: 'w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：数据安全等级、值班制度、留痕审计、报表与监管口径',
              value: localProjectMeta.complianceConstraints || '',
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newMeta = { ...localProjectMeta, complianceConstraints: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ complianceConstraints: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col md:col-span-2' },
            React.createElement('label', { htmlFor: 'rolesAndPermissions', className: 'text-sm font-medium text-zinc-300 mb-2' }, '角色与权限'),
            React.createElement('textarea', {
              id: 'rolesAndPermissions',
              className: 'w-full h-24 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：调度员、值班长、现场人员、第三方协作单位',
              value: localProjectMeta.rolesAndPermissions || '',
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newMeta = { ...localProjectMeta, rolesAndPermissions: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ rolesAndPermissions: e.target.value });
              }
            })
          )
        )
      ),
      activeTab === 'business' && React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '基于节点和边的角色信息生成业务流程图。'),
        React.createElement('div', { 
          className: 'bg-zinc-950 rounded-lg border border-zinc-800',
          style: { 
            padding: '12px',
            display: 'inline-block',
            width: '100%'
          }
        },
          React.createElement(MermaidDiagram, { code: businessProcessDiagram, compact: true })
        )
      ),
      activeTab === 'interaction' && React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '显示所有页面节点之间的导航关系。'),
        React.createElement('div', { 
          className: 'bg-zinc-950 rounded-lg border border-zinc-800',
          style: { 
            padding: '12px',
            display: 'inline-block',
            width: '100%'
          }
        },
          React.createElement(MermaidDiagram, { definition: interactionFlowDiagram, compact: true })
        )
      ),
      activeTab === 'data' && React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '聚合所有节点的数据规则。'),
        dataDictionary.length === 0 ? React.createElement('div', { className: 'bg-zinc-900/50 rounded-lg border border-zinc-800 p-8 text-center' },
          React.createElement('div', { className: 'text-zinc-500 text-sm' }, '暂无数据字典')
        ) : React.createElement('div', { className: 'bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden' },
          React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full border-collapse' },
              React.createElement('thead', {},
                React.createElement('tr', { className: 'bg-zinc-800/50 border-b border-zinc-700' },
                  React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider' }, 'Field Name'),
                  React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider' }, 'Type'),
                  React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider' }, 'Source Node'),
                  React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider' }, 'Description')
                )
              ),
              React.createElement('tbody', { className: 'divide-y divide-zinc-800' },
                dataDictionary.map((field, index) =>
                  React.createElement('tr', { key: index, className: 'hover:bg-zinc-800/30 transition-colors' },
                    React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-zinc-200' }, field.fieldName),
                    React.createElement('td', { className: 'px-4 py-3 text-sm' },
                      React.createElement('span', { className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30' }, field.type)
                    ),
                    React.createElement('td', { className: 'px-4 py-3 text-sm text-zinc-400' }, field.sourceNode),
                    React.createElement('td', { className: 'px-4 py-3 text-sm text-zinc-300' }, field.description)
                  )
                )
              )
            )
          )
        )
      ),
      activeTab === 'topology' && React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '上传架构拓扑图，自动解析并生成节点和连接关系。'),
        React.createElement(ArchitectureTopology)
      ),
      activeTab === 'rules' && React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '定义项目的全局规则和非功能性需求（NFR）。'),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'performance', className: 'text-sm font-medium text-zinc-300 mb-2' }, '性能指标'),
            React.createElement('textarea', {
              id: 'performance',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：首屏加载 < 1.5s，支持 5000 并发',
              value: globalRules.performance,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ performance: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'security', className: 'text-sm font-medium text-zinc-300 mb-2' }, '安全规范'),
            React.createElement('textarea', {
              id: 'security',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：所有敏感数据加密存储',
              value: globalRules.security,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ security: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'compatibility', className: 'text-sm font-medium text-zinc-300 mb-2' }, '兼容性要求'),
            React.createElement('textarea', {
              id: 'compatibility',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：支持 Chrome 90+, Firefox 80+',
              value: globalRules.compatibility,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ compatibility: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'errorHandling', className: 'text-sm font-medium text-zinc-300 mb-2' }, '错误处理'),
            React.createElement('textarea', {
              id: 'errorHandling',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：统一的错误提示',
              value: globalRules.errorHandling,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ errorHandling: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'dataTracking', className: 'text-sm font-medium text-zinc-300 mb-2' }, '数据追踪'),
            React.createElement('textarea', {
              id: 'dataTracking',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：所有用户行为埋点',
              value: globalRules.dataTracking,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ dataTracking: e.target.value })
            })
          )
          )
        )
      ),
      activeTab === 'userStories' && React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '展示所有节点的用户故事和用户旅程图。'),
        nodes.length === 0 ? React.createElement('div', { className: 'bg-zinc-950 rounded-lg p-4 border border-zinc-800' },
          React.createElement('div', { className: 'text-zinc-500 text-sm text-center py-8' }, '暂无用户故事')
        ) : (() => {
          const nodesWithStories = nodes.filter(node => {
            const stories = node.data.artifacts?.userStories;
            return stories && Array.isArray(stories) && stories.length > 0;
          });
          
          if (nodesWithStories.length === 0) {
            return React.createElement('div', { className: 'bg-zinc-950 rounded-lg p-4 border border-zinc-800' },
              React.createElement('div', { className: 'text-zinc-500 text-sm text-center py-8' }, '暂无用户故事')
            );
          }
          
          const userStoriesElements = nodesWithStories.map((node) => {
            const userStories = node.data.artifacts?.userStories || [];
            if (userStories.length === 0) return null;
            
            const nodeKey = `stories-${node.id}`;
            const isExpanded = expandedNodes[nodeKey] !== false;
            
            return React.createElement('div', { key: node.id, className: 'bg-zinc-950 rounded-lg p-4 border border-zinc-800' },
              React.createElement('button', {
                onClick: () => setExpandedNodes(prev => ({ ...prev, [nodeKey]: !isExpanded })),
                className: 'flex items-center justify-between w-full text-left mb-4 hover:bg-zinc-800/30 rounded-lg p-2 -m-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]'
              },
                React.createElement('h3', { className: 'text-lg font-semibold text-zinc-200' },
                  React.createElement('span', { className: 'text-blue-400' }, '📄 '),
                  node.data.label || node.id,
                  React.createElement('span', { className: 'ml-2 text-sm font-normal text-zinc-500' }, `(${userStories.length} 个用户故事)`)
                ),
                React.createElement('div', { className: 'flex-shrink-0 ml-4 transition-transform duration-200', style: { transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' } },
                  React.createElement(ChevronDown, { className: 'w-5 h-5 text-zinc-400' })
                )
              ),
              isExpanded && React.createElement('div', { 
                className: 'space-y-4 animate-in fade-in slide-in-from-top-2 duration-300'
              },
                userStories.map((story, storyIndex) => {
                  const sequenceDiagram = generateStorySequenceDiagram(node.id, story.id);
                  
                  return React.createElement('div', { 
                    key: storyIndex, 
                    className: 'bg-zinc-900/50 rounded-lg border border-zinc-700 p-4 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900/70' 
                  },
                    React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                      React.createElement('span', { className: 'text-xs font-medium px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30' }, story.id),
                    ),
                    React.createElement('div', { className: 'text-sm text-zinc-300 mb-3' },
                      React.createElement('span', { className: 'text-zinc-500' }, '作为 '),
                      React.createElement('span', { className: 'font-medium text-zinc-200' }, story.role),
                      React.createElement('span', { className: 'text-zinc-500' }, '，我想要 '),
                      React.createElement('span', { className: 'font-medium text-zinc-200' }, story.activity),
                      React.createElement('span', { className: 'text-zinc-500' }, '，以便 '),
                      React.createElement('span', { className: 'font-medium text-zinc-200' }, story.value)
                    ),
                    story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && React.createElement('div', { className: 'mt-3 pt-3 border-t border-zinc-700' },
                      React.createElement('div', { className: 'text-xs font-medium text-zinc-400 mb-2' }, '验收标准:'),
                      React.createElement('ul', { className: 'space-y-1' },
                        story.acceptanceCriteria.map((criterion, critIndex) =>
                          React.createElement('li', { key: critIndex, className: 'text-sm text-zinc-300 flex items-start gap-2' },
                            React.createElement('span', { className: 'text-green-400 mt-1 flex-shrink-0' }, '✓'),
                            React.createElement('span', { className: 'flex-1' }, criterion)
                          )
                        )
                      )
                    ),
                      sequenceDiagram && React.createElement('div', { className: 'mt-4 pt-4 border-t border-zinc-700' },
                        React.createElement('div', { className: 'text-xs font-medium text-zinc-400 mb-3' }, '业务流转逻辑:'),
                        React.createElement('div', { 
                          style: { 
                            display: 'inline-block',
                            width: '100%'
                          }
                        },
                          React.createElement(MermaidDiagram, { code: sequenceDiagram, compact: true })
                        )
                      )
                  );
                })
              )
            );
          }).filter(Boolean);
          
          return React.createElement('div', { className: 'space-y-4' },
            generateUserJourneyTable && generateUserJourneyTable.allUserStories.length > 0 && generateUserJourneyDiagram && React.createElement('div', { className: 'bg-zinc-950 rounded-lg border border-zinc-800', style: { padding: '12px' } },
              React.createElement('h3', { className: 'text-lg font-semibold text-zinc-200 mb-4' },
                React.createElement('span', { className: 'text-blue-400' }, '🗺️ '),
                '用户旅程图'
              ),
              React.createElement('div', { 
                style: { 
                  display: 'inline-block',
                  width: '100%'
                }
              },
                React.createElement(MermaidDiagram, { code: generateUserJourneyDiagram, compact: true })
              )
            ),
            ...userStoriesElements
          );
        })()
      )
    )
    ),
    document.body
  );
}
