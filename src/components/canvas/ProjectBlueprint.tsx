'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { MermaidDiagram } from './MermaidDiagram';
import { ArchitectureTopology } from './ArchitectureTopology';
import { clsx } from 'clsx';

interface ProjectBlueprintProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'business' | 'interaction' | 'data' | 'topology' | 'rules';

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

export function ProjectBlueprint({ isOpen, onClose }: ProjectBlueprintProps) {
  const { nodes, edges, projectMeta, globalRules, updateProjectMeta, updateGlobalRules } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // 项目画像本地状态 - 提供默认值防止 undefined
  const defaultProjectMeta = {
    projectName: '未命名项目',
    industry: 'General Internet',
    targetAudience: 'General Users',
    description: '',
    version: '1.0.0',
  };
  const [localProjectMeta, setLocalProjectMeta] = useState(projectMeta || defaultProjectMeta);
  
  // 同步 store 中的 projectMeta 到本地状态
  useEffect(() => {
    if (projectMeta) {
      setLocalProjectMeta(projectMeta);
    } else {
      setLocalProjectMeta(defaultProjectMeta);
    }
  }, [projectMeta]);

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
      className: 'fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm',
      onClick: onClose
    },
    React.createElement('div', {
      className: 'relative w-full max-w-6xl h-[90vh] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col',
      onClick: (e: React.MouseEvent) => e.stopPropagation()
    },
    // Header
    React.createElement('div', { className: 'flex items-center justify-between p-4 border-b border-zinc-800' },
      React.createElement('h2', { className: 'text-xl font-semibold text-zinc-100' }, '📘 项目蓝图'),
      React.createElement('button', {
        onClick: onClose,
        className: 'p-2 hover:bg-zinc-800 rounded-md transition-colors',
        title: '关闭'
      }, React.createElement(X, { className: 'w-5 h-5 text-zinc-400' }))
    ),
    // Tabs
    React.createElement('div', { className: 'flex border-b border-zinc-800 bg-zinc-900/30 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent' },
      [
        { id: 'profile' as TabType, label: '项目画像', icon: '🎭' },
        { id: 'business' as TabType, label: '业务泳道图', icon: '🏊' },
        { id: 'interaction' as TabType, label: '交互拓扑图', icon: '🔄' },
        { id: 'data' as TabType, label: '全局数据字典', icon: '📊' },
        { id: 'topology' as TabType, label: '架构拓扑图', icon: '🗺️' },
        { id: 'rules' as TabType, label: '全局规则', icon: '📋' },
      ].map((tab) =>
        React.createElement('button', {
          key: tab.id,
          onClick: () => setActiveTab(tab.id),
          className: clsx(
            "flex-shrink-0 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap",
            activeTab === tab.id
              ? "border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          )
        },
        React.createElement('span', {}, tab.icon),
        React.createElement('span', {}, tab.label)
        )
      )
    ),
    // Content
    React.createElement('div', { className: 'flex-1 overflow-y-auto p-6' },
      activeTab === 'profile' && React.createElement('div', { className: 'space-y-6' },
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
              placeholder: '例如：Logistics, Fintech, Social Media',
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
              placeholder: '例如：B2B Enterprise, Gen Z Gamers',
              value: localProjectMeta.targetAudience,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const newMeta = { ...localProjectMeta, targetAudience: e.target.value };
                setLocalProjectMeta(newMeta);
                updateProjectMeta({ targetAudience: e.target.value });
              }
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
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
          )
        )
      ),
      activeTab === 'business' && React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '基于节点和边的角色信息生成业务流程图。'),
        React.createElement('div', { className: 'bg-zinc-950 rounded-lg p-4 border border-zinc-800' },
          React.createElement(MermaidDiagram, { code: businessProcessDiagram })
        )
      ),
      activeTab === 'interaction' && React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'text-sm text-zinc-400 mb-4' }, '显示所有页面节点之间的导航关系。'),
        React.createElement('div', { className: 'bg-zinc-950 rounded-lg p-4 border border-zinc-800' },
          React.createElement(MermaidDiagram, { definition: interactionFlowDiagram })
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
            React.createElement('label', { htmlFor: 'performance', className: 'text-sm font-medium text-zinc-300 mb-2' }, '性能指标 (Performance)'),
            React.createElement('textarea', {
              id: 'performance',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：首屏加载 < 1.5s，支持 5000 并发',
              value: globalRules.performance,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ performance: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'security', className: 'text-sm font-medium text-zinc-300 mb-2' }, '安全规范 (Security)'),
            React.createElement('textarea', {
              id: 'security',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：所有敏感数据加密存储',
              value: globalRules.security,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ security: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'compatibility', className: 'text-sm font-medium text-zinc-300 mb-2' }, '兼容性要求 (Compatibility)'),
            React.createElement('textarea', {
              id: 'compatibility',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：支持 Chrome 90+, Firefox 80+',
              value: globalRules.compatibility,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ compatibility: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'errorHandling', className: 'text-sm font-medium text-zinc-300 mb-2' }, '错误处理 (Error Handling)'),
            React.createElement('textarea', {
              id: 'errorHandling',
              className: 'w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y',
              placeholder: '例如：统一的错误提示',
              value: globalRules.errorHandling,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateGlobalRules({ errorHandling: e.target.value })
            })
          ),
          React.createElement('div', { className: 'flex flex-col' },
            React.createElement('label', { htmlFor: 'dataTracking', className: 'text-sm font-medium text-zinc-300 mb-2' }, '数据追踪 (Analytics)'),
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
      )
    )
    ),
    document.body
  );
}
