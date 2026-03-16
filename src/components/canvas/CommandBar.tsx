'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, X, Send, Loader2, FileText, Image as ImageIcon, Video, Bot, User, MessageCircle } from 'lucide-react';
import { useServerAction } from 'zsa-react';
import { generateGraph } from '@/app/actions/generate-graph';
import { updateNodeArtifacts, generateUIFromImage, generateUIFromText, generateAnalysisFromCode, type UIGenerationResponse } from '@/app/actions/node-operations';
import { useCanvasStore, type ConversationMessage } from '@/store/canvas-store';
import { toast } from 'sonner';
import { log, logError, logWarn } from '@/lib/logger';
import { classifyHTMLFile, getClassificationDescription, type HTMLFileClassificationContext } from '@/utils/html-file-classifier';
import { parseHTML, generateStructuredInfoText, generateIconMappingInstructions } from '@/utils/html-parser';

type AttachmentType = 'media' | 'text' | null;

interface FileAttachment {
  name: string;
  type: AttachmentType;
  content: string;
  preview?: string;
  mimeType?: string; // For PDF and other binary files
  rawTextContent?: string; // 原始文本内容（用于HTML文件分类分析）
}

/**
 * 从节点在「建项目/生成画布」时已保存的 spec 与 userStories 拼出页面描述，供「生成UI」使用。
 * 用户仅说「生成UI」时用此描述；用户有输入时用用户输入（作为对描述的调整）。
 */
function getNodePageDescription(node: { data: { label?: string; artifacts?: { spec?: { title?: string; requirements?: string[] }; userStories?: Array<{ role: string; activity: string; value: string; acceptanceCriteria?: string[] }> } } }): string {
  const spec = node?.data?.artifacts?.spec;
  const userStories = node?.data?.artifacts?.userStories;
  const title = spec?.title || node?.data?.label || '';

  const parts: string[] = [];
  if (title) parts.push(`页面：${title}`);
  if (spec?.requirements?.length) {
    parts.push(spec.requirements.join('。'));
  }
  if (userStories?.length) {
    userStories.forEach((us) => {
      parts.push(`作为${us.role}，${us.activity}，以便${us.value}`);
      if (us.acceptanceCriteria?.length) {
        parts.push(`验收标准：${us.acceptanceCriteria.join('；')}`);
      }
    });
  }

  return parts.length ? parts.join('。') : '';
}

/** 仅当节点没有任何描述时的兜底 prompt */
function getDefaultUIPrompt(nodeLabel: string): string {
  return `请为「${nodeLabel}」页面生成完整、可用的 React 组件，界面内容与页面名称匹配，包含现代化 UI 与完整交互。`;
}

/** 从用户描述推断项目画像（行业、目标用户），用于建图成功后自动填充 */
function inferProjectMetaFromPrompt(prompt: string): { industry?: string; targetAudience?: string } {
  const t = prompt.toLowerCase().trim();
  if (!t) return {};
  const out: { industry?: string; targetAudience?: string } = {};
  if (/音乐|歌曲|播放|歌单|听歌|音乐app/i.test(t)) {
    out.industry = '音乐/娱乐';
    out.targetAudience = '音乐爱好者';
  } else if (/游戏|电竞|手游/i.test(t)) {
    out.industry = '游戏';
    out.targetAudience = '玩家';
  } else if (/电商|购物|商品|订单|商城/i.test(t)) {
    out.industry = '电商';
    out.targetAudience = '消费者';
  } else if (/医疗|健康|问诊|挂号/i.test(t)) {
    out.industry = '医疗健康';
    out.targetAudience = '患者/健康管理用户';
  } else if (/教育|学习|课程|培训/i.test(t)) {
    out.industry = '教育';
    out.targetAudience = '学习者';
  } else if (/金融|理财|支付|银行/i.test(t)) {
    out.industry = '金融';
    out.targetAudience = '个人/企业用户';
  } else if (/物流|配送|快递/i.test(t)) {
    out.industry = '物流';
    out.targetAudience = '企业/个人';
  } else if (/社交|社区|论坛|聊天/i.test(t)) {
    out.industry = '社交';
    out.targetAudience = '终端用户';
  } else if (/管理|后台|b端|企业/i.test(t)) {
    out.industry = '企业服务';
    out.targetAudience = '企业用户';
  } else {
    out.industry = '通用互联网';
    out.targetAudience = '通用用户';
  }
  return out;
}

type ViewportPreset = 'mobile' | 'desktop';

export function CommandBar(props: {
  viewportSubmitRef?: React.MutableRefObject<ViewportPreset | null>;
  /** 嵌入右侧常驻对话面板底部时为 true：仅展示建图输入、紧凑布局、不展示编辑模式 UI */
  embedInPanel?: boolean;
}) {
  const { viewportSubmitRef, embedInPanel = false } = props;
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  // 超时覆盖标志：当超时发生时，强制重置所有 loading 状态
  const [isTimeoutOverride, setIsTimeoutOverride] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingTimersRef = useRef<NodeJS.Timeout[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    nodes,
    selectedNodeId,
    selectNode,
    openNodeDetail,
    addNodes,
    addEdges,
    loadProject,
    updateNodeData,
    layoutNodes,
    currentTheme,
    stylePreset,
    aiConfig,
    openBlueprint,
    updateProjectMeta,
    appendConversationMessage,
    setPendingClarificationContext,
    setConversationPanelOpen,
    pendingClarificationContext,
    pendingClarificationReply,
    setPendingClarificationReply,
    updateLastAssistantMessage,
    setAiCreatePending,
    setViewportPreset,
    viewportLocked,
    lockViewport,
    pendingCreatePrompt,
    setPendingCreatePrompt,
    pendingCreateMedia,
    setPendingCreateMedia,
  } = useCanvasStore();
  /** 最近一次建图请求的入参，用于澄清时再次调用 */
  const lastCreateInputRef = useRef<{
    prompt: string;
    attachmentContent?: string;
    attachmentType?: string;
    mimeType?: string;
    mediaBase64?: string;
    mediaType?: 'image' | 'video';
  } | null>(null);
  
  // 获取当前选中的节点
  const selectedNode = selectedNodeId 
    ? nodes.find(node => node.id === selectedNodeId) 
    : null;
  
  // 判断是否为编辑模式（画布上选中节点时为 true；嵌入面板内不按编辑模式算，仅用于部分 UI）
  const isEditMode = embedInPanel ? false : selectedNode !== null;
  // 是否为「为当前节点生成/更新 UI」上下文（含嵌入面板：在节点详情/生成页内也按 UI 生成展示）
  const isUIGenerationContext = selectedNode !== null && (isEditMode || embedInPanel);

  // 输入框聚焦状态 - 必须在所有其他 hooks 之前定义
  const [isFocused, setIsFocused] = useState(false);

  /** UI 生成统一使用 quality 模型，不再暴露档位选项 */
  const uiGenerationTier = 'quality' as const;

  // 自动调整textarea高度的函数
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      // 重置高度以获取正确的scrollHeight
      textarea.style.height = 'auto';
      // 设置新高度，但不超过最大高度
      // min-h-[72px] 对应约3行文字的高度（24px * 3行），max-h-60 = 240px
      const minHeight = 72; // 最小高度：3行文字
      const maxHeight = 240; // max-h-60 = 240px
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight));
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // 创建模式的 action（必须在所有使用它的函数之前定义）
  const { execute: executeCreate, isPending: isCreating } = useServerAction(generateGraph, {
    onSuccess: (result) => {
      log('📥 [CommandBar] executeCreate 原始返回:', {
        result,
        resultType: typeof result,
        isArray: Array.isArray(result),
        hasData: !!(result as any)?.data,
        keys: result && typeof result === 'object' ? Object.keys(result as any) : [],
        // 尝试序列化查看完整结构（限制长度避免日志过大）
        resultString: JSON.stringify(result).substring(0, 500),
        // 直接检查 result.data 的内容
        dataExists: !!(result as any)?.data,
        dataType: typeof (result as any)?.data,
        dataKeys: (result as any)?.data && typeof (result as any).data === 'object' ? Object.keys((result as any).data) : [],
        dataTypeField: (result as any)?.data?.type,
        dataNodesExists: !!(result as any)?.data?.nodes,
        dataNodesType: typeof (result as any)?.data?.nodes,
        dataNodesIsArray: Array.isArray((result as any)?.data?.nodes),
        dataNodesLength: Array.isArray((result as any)?.data?.nodes) ? (result as any).data.nodes.length : 'N/A',
        dataEdgesExists: !!(result as any)?.data?.edges,
        dataEdgesType: typeof (result as any)?.data?.edges,
        dataEdgesIsArray: Array.isArray((result as any)?.data?.edges),
        dataEdgesLength: Array.isArray((result as any)?.data?.edges) ? (result as any).data.edges.length : 'N/A',
        // 完整的数据结构（限制长度）
        fullDataString: (result as any)?.data ? JSON.stringify((result as any).data).substring(0, 1000) : 'N/A',
      });

      // 处理 zsa-react 的返回格式
      // zsa-react 的 useServerAction 返回格式：result 直接是 handler 的返回值
      // 所以 result 应该是 { data: { type: 'clarification_needed' | 'graph_generated', ... } }
      let resultData: { data?: any } | null = null;

      if (Array.isArray(result)) {
        // 数组格式：[data, error]
        log('📦 [CommandBar] 检测到数组格式返回');
        resultData = result[0] || null;
      } else if (result && typeof result === 'object') {
        // 对象格式：直接是返回值
        log('📦 [CommandBar] 检测到对象格式返回');
        resultData = result as any;
      } else {
        logError('❌ [CommandBar] 未知的返回格式:', {
          result,
          resultType: typeof result,
        });
        return;
      }

      // 若服务端返回澄清请求：展示在对话窗口，等待用户选择/输入后再次请求
      const responseData = resultData?.data ?? resultData;
      const isClarification = (resultData as any)?.type === 'clarification_needed' || responseData?.type === 'clarification_needed';
      const clarificationData = (resultData as any)?.data ?? responseData?.data;
      if (isClarification && clarificationData?.message) {
        const ctx = lastCreateInputRef.current;
        if (ctx) {
          setPendingClarificationContext({
            initialPrompt: ctx.prompt,
            attachmentContent: ctx.attachmentContent,
            attachmentType: ctx.attachmentType,
            mimeType: ctx.mimeType,
            mediaBase64: ctx.mediaBase64,
            mediaType: ctx.mediaType,
          });
        }
        updateLastAssistantMessage(clarificationData.message, 'done', {
          message: clarificationData.message,
          question: clarificationData.question ?? '',
          options: clarificationData.options ?? [],
          viewportQuestion: clarificationData.viewportQuestion,
          viewportOptions: clarificationData.viewportOptions,
        });
        setConversationPanelOpen(true); // 自动展开对话面板，便于用户看到追问与选项
        clearLoadingTimers();
        setIsProcessingVideo(false);
        setIsTimeoutOverride(false);
        setProgress(0);
        setLoadingStep('');
        toast.info('请补充说明', { description: '在右侧对话面板选择或输入后发送', duration: 4000 });
        return;
      }

      log('🔍 [CommandBar] 检查返回数据，按图结构处理', {
        hasData: !!responseData,
        dataType: responseData?.type,
        resultDataKeys: resultData ? Object.keys(resultData) : [],
      });

      // 详细记录 resultData 的结构
      log('🔍 [CommandBar] resultData 详细结构:', {
        hasResultData: !!resultData,
        resultDataKeys: resultData ? Object.keys(resultData) : [],
        hasData: !!(resultData as any)?.data,
        dataKeys: (resultData as any)?.data ? Object.keys((resultData as any).data) : [],
        dataNodesType: typeof (resultData as any)?.data?.nodes,
        dataNodesIsArray: Array.isArray((resultData as any)?.data?.nodes),
        dataNodesLength: Array.isArray((resultData as any)?.data?.nodes) ? (resultData as any).data.nodes.length : 'N/A',
        dataNodesValue: (resultData as any)?.data?.nodes ? JSON.stringify((resultData as any).data.nodes).substring(0, 200) : 'N/A',
        dataEdgesType: typeof (resultData as any)?.data?.edges,
        dataEdgesIsArray: Array.isArray((resultData as any)?.data?.edges),
        dataEdgesLength: Array.isArray((resultData as any)?.data?.edges) ? (resultData as any).data.edges.length : 'N/A',
        // 尝试直接访问 nodes 和 edges（不在 data 下）
        hasDirectNodes: !!(resultData as any)?.nodes,
        directNodesType: typeof (resultData as any)?.nodes,
        directNodesIsArray: Array.isArray((resultData as any)?.nodes),
        hasDirectEdges: !!(resultData as any)?.edges,
        directEdgesType: typeof (resultData as any)?.edges,
        directEdgesIsArray: Array.isArray((resultData as any)?.edges),
        // 完整结构预览（限制长度）
        fullStructure: JSON.stringify(resultData).substring(0, 1000),
      });

      // 提取 nodes 和 edges
      // 尝试多种可能的路径
      let nodes: any[] | undefined;
      let edges: any[] | undefined;

      // 优先尝试 resultData.data.nodes 和 resultData.data.edges
      // 同时也尝试直接从 result.data 访问（以防 zsa-react 改变了结构）
      let data: any = null;
      if ((resultData as any)?.data) {
        data = (resultData as any).data;
      } else if ((result as any)?.data) {
        // 如果 resultData.data 不存在，直接使用 result.data
        data = (result as any).data;
        log('⚠️ [CommandBar] resultData.data 不存在，使用 result.data');
      }
      
      if (data) {
        const dataKeys = Object.keys(data);
        log('🔍 [CommandBar] 检查 data 对象:', {
          dataType: typeof data,
          dataKeys: dataKeys,
          dataKeysCount: dataKeys.length,
          // 显示第一个键的详细信息（因为只有一个键）
          firstKey: dataKeys[0],
          firstKeyValue: dataKeys[0] ? data[dataKeys[0]] : 'N/A',
          firstKeyValueType: dataKeys[0] ? typeof data[dataKeys[0]] : 'N/A',
          firstKeyValueIsArray: dataKeys[0] ? Array.isArray(data[dataKeys[0]]) : false,
          firstKeyValueKeys: dataKeys[0] && typeof data[dataKeys[0]] === 'object' && data[dataKeys[0]] !== null 
            ? Object.keys(data[dataKeys[0]]) 
            : 'N/A',
          // 检查第一个键的值中是否包含 nodes 和 edges
          firstKeyHasNodes: dataKeys[0] && typeof data[dataKeys[0]] === 'object' && data[dataKeys[0]] !== null
            ? 'nodes' in data[dataKeys[0]]
            : false,
          firstKeyHasEdges: dataKeys[0] && typeof data[dataKeys[0]] === 'object' && data[dataKeys[0]] !== null
            ? 'edges' in data[dataKeys[0]]
            : false,
          hasNodes: 'nodes' in data,
          hasEdges: 'edges' in data,
          nodesValue: data.nodes,
          nodesType: typeof data.nodes,
          nodesIsArray: Array.isArray(data.nodes),
          edgesValue: data.edges,
          edgesType: typeof data.edges,
          edgesIsArray: Array.isArray(data.edges),
          // 完整 data 对象的结构（限制长度）
          fullDataString: JSON.stringify(data).substring(0, 1000),
        });
        
        // 如果 data 中只有一个键，且这个键的值是对象，尝试从中提取 nodes/edges（不再处理 clarification_needed，避免无法继续）
        if (dataKeys.length === 1 && typeof data[dataKeys[0]] === 'object' && data[dataKeys[0]] !== null) {
          const firstKeyValue = data[dataKeys[0]];
          log('🔍 [CommandBar] 检测到 data 只有一个键，检查其内容:', {
            key: dataKeys[0],
            valueKeys: Object.keys(firstKeyValue),
            hasNodes: 'nodes' in firstKeyValue,
            hasEdges: 'edges' in firstKeyValue,
          });
          
          // 如果这个对象中有 nodes 和 edges，使用它们
          if (Array.isArray(firstKeyValue.nodes) && !nodes) {
            nodes = firstKeyValue.nodes;
            log('✅ [CommandBar] 从 data 的第一个键的值中提取到节点:', { count: nodes?.length || 0 });
          }
          if (Array.isArray(firstKeyValue.edges) && !edges) {
            edges = firstKeyValue.edges;
            log('✅ [CommandBar] 从 data 的第一个键的值中提取到边:', { count: edges?.length || 0 });
          }
        }
        
        if (!nodes && Array.isArray(data.nodes)) {
          nodes = data.nodes;
          log('✅ [CommandBar] 从 resultData.data.nodes 提取到节点:', { count: nodes?.length || 0 });
        } else if (!nodes) {
          const nodesStringified = data.nodes !== undefined ? JSON.stringify(data.nodes).substring(0, 200) : 'undefined';
          logWarn('⚠️ [CommandBar] resultData.data.nodes 不是数组:', {
            type: typeof data.nodes,
            value: data.nodes,
            isUndefined: data.nodes === undefined,
            isNull: data.nodes === null,
            stringified: nodesStringified,
          });
        }
        
        if (!edges && Array.isArray(data.edges)) {
          edges = data.edges;
          log('✅ [CommandBar] 从 resultData.data.edges 提取到边:', { count: edges?.length || 0 });
        } else if (!edges) {
          const edgesStringified = data.edges !== undefined ? JSON.stringify(data.edges).substring(0, 200) : 'undefined';
          logWarn('⚠️ [CommandBar] resultData.data.edges 不是数组:', {
            type: typeof data.edges,
            value: data.edges,
            isUndefined: data.edges === undefined,
            isNull: data.edges === null,
            stringified: edgesStringified,
          });
        }
      } else {
        logWarn('⚠️ [CommandBar] resultData.data 和 result.data 都不存在:', {
        hasResultData: !!resultData,
        resultDataKeys: resultData ? Object.keys(resultData) : [],
          hasResult: !!(result as any),
          resultKeys: (result as any) && typeof (result as any) === 'object' ? Object.keys(result as any) : [],
          // 尝试直接访问 result 的所有可能路径
          directNodes: (result as any)?.nodes,
          directEdges: (result as any)?.edges,
          directDataNodes: (result as any)?.data?.nodes,
          directDataEdges: (result as any)?.data?.edges,
        });
      }
      
      // 如果 data 路径失败，尝试直接访问 nodes 和 edges
      if (!nodes && (resultData as any)?.nodes) {
        if (Array.isArray((resultData as any).nodes)) {
          nodes = (resultData as any).nodes;
          log('✅ [CommandBar] 从 resultData.nodes 提取到节点:', { count: nodes?.length || 0 });
        }
      }
      
      if (!edges && (resultData as any)?.edges) {
        if (Array.isArray((resultData as any).edges)) {
          edges = (resultData as any).edges;
          log('✅ [CommandBar] 从 resultData.edges 提取到边:', { count: edges?.length || 0 });
        }
      }

      log('📦 [CommandBar] 最终解析结果:', {
        hasNodes: !!nodes,
        nodesIsArray: Array.isArray(nodes),
        nodesLength: nodes?.length,
        nodesPreview: nodes && Array.isArray(nodes) && nodes.length > 0 ? nodes.slice(0, 2).map(n => ({ id: n.id, label: n.data?.label, type: n.type })) : 'N/A',
        hasEdges: !!edges,
        edgesIsArray: Array.isArray(edges),
        edgesLength: edges?.length,
        edgesPreview: edges && Array.isArray(edges) && edges.length > 0 ? edges.slice(0, 2).map(e => ({ id: e.id, source: e.source, target: e.target })) : 'N/A',
      });

      // 建图成功：用返回的 nodes/edges 替换整个画布，避免与初始 mock「首页」叠加导致双首页
      const nodesBeforeAdd = useCanvasStore.getState().nodes.length;
      const hasValidGraph = nodes && Array.isArray(nodes) && nodes.length > 0;
      log('📊 [CommandBar] 建图结果:', {
        nodesCount: nodesBeforeAdd,
        willReplaceGraph: hasValidGraph,
        newNodesCount: nodes?.length ?? 0,
        newEdgesCount: edges?.length ?? 0,
      });

      if (hasValidGraph) {
        try {
          loadProject({ nodes, edges: Array.isArray(edges) ? edges : [] });
          const nodesAfterLoad = useCanvasStore.getState().nodes.length;
          log('✅ [CommandBar] 已用建图结果替换画布:', { count: nodesAfterLoad });
        } catch (error) {
          logError('❌ [CommandBar] loadProject 失败，回退为 addNodes:', error);
          addNodes(nodes);
          if (edges && Array.isArray(edges)) addEdges(edges);
        }
      } else {
        logWarn('⚠️ [CommandBar] generateGraph 返回的 nodes 无效:', {
          nodes,
          isArray: Array.isArray(nodes),
          length: nodes?.length,
        });
      }

      // 仅当未使用 loadProject 时补充边（loadProject 已包含 edges）
      if (!hasValidGraph && edges && Array.isArray(edges)) {
        try {
          addEdges(edges);
          log('✅ [CommandBar] 成功添加边:', { count: edges.length });
        } catch (error) {
          logError('❌ [CommandBar] 添加边时发生错误:', error);
        }
      } else if (!hasValidGraph && (!edges || !Array.isArray(edges))) {
        logWarn('⚠️ [CommandBar] generateGraph 返回的 edges 无效:', {
          edges,
          isArray: Array.isArray(edges),
        });
      }
      
      // 如果 nodes 和 edges 都无效，或返回结果无图
      // 或者输入确实不够明确，打开项目画像页面让用户补充信息
      if ((!nodes || !Array.isArray(nodes) || nodes.length === 0) && 
          (!edges || !Array.isArray(edges) || edges.length === 0)) {
        log('⚠️ [CommandBar] 无法生成有效的图结构，可能是输入不够明确，打开项目画像页面');
        updateLastAssistantMessage('输入信息不够明确，请在项目画像页面补充详细信息。', 'done');
        openBlueprint('profile', {
          description: prompt.trim(),
        });
        setIsProcessingVideo(false);
        setIsTimeoutOverride(false);
        clearLoadingTimers();
        setProgress(0);
        setLoadingStep('');
        toast.info('输入信息不够明确', {
          description: '请在项目画像页面补充详细信息',
          duration: 4000,
        });
        return;
      }

        // 替换/添加节点后自动应用布局
      if (hasValidGraph) {
        setTimeout(() => {
          layoutNodes();
          log('📊 [CommandBar] 布局已应用，节点数:', useCanvasStore.getState().nodes.length);
        }, 100);
      }
      
      const finalNodesCount = useCanvasStore.getState().nodes.length;
      const success = hasValidGraph && finalNodesCount > 0;
      if (success) {
        log('🔄 [CommandBar] 画布已更新，重置状态');
        updateLastAssistantMessage(`已根据描述生成画布并添加 ${finalNodesCount} 个节点。`, 'done');
        // 首页触发生成时：用用户描述自动填充项目名称与画像
        const nameFromPrompt = lastPendingCreatePromptRef.current?.trim();
        if (nameFromPrompt) {
          const projectName = nameFromPrompt.length > 40 ? nameFromPrompt.slice(0, 40) + '…' : nameFromPrompt;
          const inferred = inferProjectMetaFromPrompt(nameFromPrompt);
          updateProjectMeta({ projectName, ...inferred });
          lastPendingCreatePromptRef.current = null;
        }
        // 移除自动生成UI的逻辑，用户需要手动在节点详情面板中生成UI

        setPrompt('');
        setAttachment(null);
      setAttachments([]);
        setAttachments([]);
        setIsProcessingVideo(false);
        setIsTimeoutOverride(false); // 重置超时覆盖标志
        clearLoadingTimers();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // 重置 textarea 高度
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else {
        logError('❌ [CommandBar] 节点添加失败，不重置状态，保留用户输入以便重试');
        updateLastAssistantMessage('节点添加失败，请重试。', 'error');
        // 不清空 prompt 和 attachment，让用户可以重试
        setIsProcessingVideo(false);
        setIsTimeoutOverride(false);
        clearLoadingTimers();
      }
    },
    onError: (error) => {
      logError('Failed to generate graph:', error);
      logError('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // 处理网络错误（Failed to fetch）
      let errorMessage = error instanceof Error 
        ? error.message 
        : '生成图表失败，请稍后重试';
      
      // 检测 Failed to fetch 错误
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        errorMessage = '网络连接失败。请检查：1. 服务器是否正常运行 (npm run dev) 2. 网络连接是否正常 3. 防火墙设置';
        logError('❌ [CommandBar] ========== 网络错误诊断 ==========');
        logError('❌ [CommandBar] 网络连接失败，可能的原因：');
        logError('❌ [CommandBar] 1. 开发服务器未运行 - 请在终端运行: npm run dev');
        logError('❌ [CommandBar] 2. 服务器端口被占用 - 请检查端口 3000 是否可用');
        logError('❌ [CommandBar] 3. 网络连接问题 - 请检查网络状态');
        logError('❌ [CommandBar] 4. 防火墙阻止连接 - 请检查防火墙设置');
        logError('❌ [CommandBar] ====================================');
      }
      
      // 提供简洁友好的错误信息
      if (error instanceof Error) {
        if (error.message.includes('API_KEY') || error.message.includes('api key')) {
          errorMessage = 'API 密钥未配置，请检查环境变量';
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          errorMessage = '请求超时，请检查网络连接';
        } else if (error.message.includes('quota') || error.message.includes('QUOTA') || error.message.includes('429')) {
          errorMessage = 'API 配额已用完，请稍后重试';
        } else if (error.message.includes('invalid') || error.message.includes('INVALID') || error.message.includes('400')) {
          errorMessage = '请求参数无效，请检查文件格式';
        } else if (error.message.includes('500') || error.message.includes('Internal')) {
          errorMessage = '服务器错误，请稍后重试';
        } else if (error.message.includes('Body exceeded') || error.message.includes('size limit')) {
          errorMessage = '文件过大，请上传小于 20MB 的文件';
        } else {
          errorMessage = `生成失败：${error.message}`;
        }
      }
      
      toast.error('操作失败', {
        description: errorMessage,
        duration: 5000,
      });
      updateLastAssistantMessage(errorMessage, 'error');
      setIsProcessingVideo(false);
      setIsTimeoutOverride(false); // 重置超时覆盖标志
      clearLoadingTimers();
    },
  });

  // 澄清回复：用户在选择/输入后由对话窗口设置 pendingClarificationReply，此处带上下文再次请求建图（加锁防双请求）
  const clarificationSubmitInFlightRef = useRef(false);
  useEffect(() => {
    if (clarificationSubmitInFlightRef.current) return;
    let reply: string | null = null;
    let ctx: typeof pendingClarificationContext = null;
    try {
      const getState = useCanvasStore?.getState;
      if (typeof getState !== 'function') return;
      const state = getState();
      if (!state) return;
      reply = state.pendingClarificationReply ?? null;
      ctx = state.pendingClarificationContext ?? null;
    } catch (e) {
      logWarn('澄清回复 effect 中 getState 不可用（可能为 SSR 或 store 未挂载）', e);
      return;
    }
    if (!reply || !ctx) return;
    clarificationSubmitInFlightRef.current = true;
    setPendingClarificationReply(null);
    setPendingClarificationContext(null);
    setAiCreatePending(true);
    // 从澄清回复中解析视口并锁定为全局设置，之后不再显示切换按钮
    if (/视口[：:]\s*桌面/.test(reply)) lockViewport('desktop');
    else if (/视口[：:]\s*移动/.test(reply)) lockViewport('mobile');
    const enrichedPrompt = `${ctx.initialPrompt}\n\n用户澄清: ${reply}`;
    executeCreate({
      prompt: enrichedPrompt,
      mediaBase64: ctx.mediaBase64,
      mediaType: ctx.mediaType,
      attachmentContent: ctx.attachmentContent,
      attachmentType: ctx.attachmentType as 'media' | 'text' | undefined,
      mimeType: ctx.mimeType,
      aiConfig,
    })
      .catch((err) => {
        logError('澄清后再次建图失败', err);
        updateLastAssistantMessage(err instanceof Error ? err.message : '请求失败，请重试。', 'error');
      })
      .finally(() => {
        clarificationSubmitInFlightRef.current = false;
        setAiCreatePending(false);
      });
  }, [pendingClarificationReply, pendingClarificationContext, aiConfig, executeCreate, setPendingClarificationReply, setPendingClarificationContext, updateLastAssistantMessage, setAiCreatePending, lockViewport]);

  // 首页触发生成时用于在 onSuccess 里自动设置项目名称
  const lastPendingCreatePromptRef = useRef<string | null>(null);

  // 首页/Stitch 入口触发生成：pendingCreatePrompt 被设置后执行建图并清空（仅用 hook 取值，避免 getState 在 store 未就绪时为 null）
  const pendingCreateInFlightRef = useRef(false);
  useEffect(() => {
    const promptText = (pendingCreatePrompt ?? '').trim();
    const media = pendingCreateMedia;
    const hasContent = promptText || media;
    if (!hasContent || pendingCreateInFlightRef.current) return;
    pendingCreateInFlightRef.current = true;
    lastPendingCreatePromptRef.current = promptText || null;
    setPendingCreatePrompt(null);
    setPendingCreateMedia(null);
    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText || (media ? '（上传的文件）' : ''),
      status: 'done',
    };
    const astMsg: ConversationMessage = {
      id: `ast-${Date.now()}`,
      role: 'assistant',
      content: '正在生成画布…',
      status: 'sending',
    };
    appendConversationMessage(userMsg);
    appendConversationMessage(astMsg);
    setAiCreatePending(true);
    setConversationPanelOpen(true);
    executeCreate({
      prompt: promptText || '根据上传的文件生成产品图',
      mediaBase64: media?.mediaBase64,
      mediaType: media?.mediaType,
      aiConfig,
    })
      .catch((err) => {
        logError('首页触发生成失败', err);
        lastPendingCreatePromptRef.current = null;
        updateLastAssistantMessage(err instanceof Error ? err.message : '请求失败，请重试。', 'error');
      })
      .finally(() => {
        pendingCreateInFlightRef.current = false;
        setAiCreatePending(false);
      });
  }, [pendingCreatePrompt, setPendingCreatePrompt, pendingCreateMedia, setPendingCreateMedia, aiConfig, appendConversationMessage, setAiCreatePending, setConversationPanelOpen, updateLastAssistantMessage, executeCreate]);

  // Model Relay actions（必须在所有使用它的函数之前定义）
  const { execute: executeUI, isPending: isGeneratingUI } = useServerAction(generateUIFromImage, {
    onError: (error) => {
      logError('❌ [CommandBar] executeUI onError:', error);
      logError('❌ [CommandBar] executeUI 错误详情:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      
      // 检查是否是超时错误（超时错误已经在 catch 块中处理，不应该触发 onError）
      let errorMessage = error instanceof Error ? error.message : String(error);
      
      // 检测 Failed to fetch 错误
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        errorMessage = '网络连接失败。请检查：1. 服务器是否正常运行 2. 网络连接是否正常 3. 防火墙设置';
        logError('❌ [CommandBar] 网络错误检测:', {
          errorType: 'NetworkError',
          errorMessage: errorMessage,
          suggestion: '请确保开发服务器正在运行 (npm run dev)',
        });
      }
      
      if (errorMessage.includes('请求超时') || errorMessage.includes('timeout')) {
        // 超时错误已经在 catch 块中处理，这里只记录日志，不重置 isTimeoutOverride
        logWarn('⚠️ [CommandBar] 检测到超时错误，但已在 catch 块中处理，跳过 onError 重置');
        return;
      }
      
      // 显示错误提示给用户
      toast.error('❌ UI代码生成失败', {
        description: errorMessage,
        duration: 8000,
      });
      
      // 重置状态（非超时错误）
      setIsProcessingVideo(false);
      setIsTimeoutOverride(false); // 重置超时覆盖标志
      clearLoadingTimers();
    },
    onSuccess: () => {
      // 成功时重置超时覆盖标志
      setIsTimeoutOverride(false);
    },
  });
  const { execute: executeAnalysis, isPending: isGeneratingPRD } = useServerAction(generateAnalysisFromCode);
  const { execute: executeUIText, isPending: isGeneratingUIText } = useServerAction(generateUIFromText, {
    onError: (error) => {
      logError('❌ [CommandBar] executeUIText onError 回调被触发:', error);
      
      // 处理网络错误（Failed to fetch）
      let errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 检测 Failed to fetch 错误
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        errorMessage = '网络连接失败。请检查：1. 服务器是否正常运行 2. 网络连接是否正常 3. 防火墙设置';
        logError('❌ [CommandBar] 网络错误检测:', {
          errorType: 'NetworkError',
          errorMessage: errorMessage,
          suggestion: '请确保开发服务器正在运行 (npm run dev)',
        });
      }
      
      toast.error('UI代码生成失败', {
        description: errorMessage,
        duration: 8000,
      });
      // 重置状态
      setIsProcessingVideo(false);
      setIsTimeoutOverride(false);
      clearLoadingTimers();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    onSuccess: (result) => {
      log('✅ [CommandBar] executeUIText onSuccess 回调被触发:', {
        resultType: typeof result,
        isArray: Array.isArray(result),
        hasCode: !!(result as any)?.code,
      });
    },
  });

  // 编辑模式的 action（必须在所有使用它的函数之前定义）
  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(updateNodeArtifacts, {
    onSuccess: (result) => {
      // zsa-react 的 useServerAction 返回格式：result 直接是 handler 的返回值
      const artifacts = result?.data || result;
      if (selectedNodeId && artifacts) {
        
        // 处理 requirements 字段：如果是字符串，转换为数组（按换行符分割）
        const processedArtifacts = { ...artifacts };
        if (processedArtifacts.spec?.requirements) {
          if (typeof processedArtifacts.spec.requirements === 'string') {
            // 字符串：按换行符分割，过滤空行
            processedArtifacts.spec.requirements = processedArtifacts.spec.requirements
              .split('\n')
              .filter((line: string) => line.trim() !== '');
          }
          // 如果已经是数组，保持不变
        }
        
        // 如果上传了图片但没有 previewUrl，使用附件的 base64 作为预览
        if (attachment?.type === 'media' && attachment.preview && !processedArtifacts.view?.previewUrl) {
          processedArtifacts.view = {
            ...processedArtifacts.view,
            previewUrl: attachment.preview,
          };
        }
        
        // 更新节点的 artifacts（部分更新）
        updateNodeData(selectedNodeId, {
          artifacts: processedArtifacts,
        });
      } else {
        logWarn('Update node success but no data:', { selectedNodeId, result });
      }
      // 重置状态
      setPrompt('');
      setAttachment(null);
      setAttachments([]);
      setIsProcessingVideo(false);
      setIsTimeoutOverride(false); // 重置超时覆盖标志
      clearLoadingTimers();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // 重置 textarea 高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
    onError: (error) => {
      // 详细序列化错误信息
      const errorInfo = {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        toString: error?.toString?.(),
        raw: error,
      };
      
      logError('❌ [CommandBar] Failed to update node:', errorInfo);
      logError('❌ [CommandBar] Error details:', JSON.stringify(errorInfo, null, 2));
      logError('❌ [CommandBar] Raw error:', error);
      
      // Error handled
      
      let errorMessage = error instanceof Error 
        ? error.message 
        : '更新节点失败，请稍后重试';
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        if (error.message.includes('API_KEY') || error.message.includes('api key')) {
          errorMessage = '❌ API 密钥未配置\n\n请检查环境变量 OPENAI_API_KEY 是否正确设置\n\n诊断：打开浏览器控制台查看详细错误信息';
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          errorMessage = '⏱️ 请求超时\n\n请检查网络连接，或稍后重试\n\n提示：可以尝试简化输入内容或减少附件大小';
        } else if (error.message.includes('quota') || error.message.includes('QUOTA') || error.message.includes('429')) {
          errorMessage = '📊 API 配额已用完\n\n请检查 API 配额，或稍后重试';
        } else if (error.message.includes('invalid') || error.message.includes('INVALID') || error.message.includes('400')) {
          errorMessage = `⚠️ 请求参数无效\n\n${error.message}\n\n请检查：\n1. 上传的文件格式是否正确\n2. 文件大小是否超过限制\n3. 数据格式是否符合要求`;
        } else if (error.message.includes('500') || error.message.includes('Internal')) {
          errorMessage = '🔧 服务器内部错误\n\n请稍后重试，或联系技术支持\n\n提示：查看浏览器控制台和服务器日志获取详细信息';
        } else if (error.message.includes('Body exceeded') || error.message.includes('size limit')) {
          errorMessage = '📦 文件大小超过限制\n\n请尝试上传较小的文件（建议 < 20MB）';
        } else if (error.message.includes('model') || error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = `🤖 模型不可用\n\n${error.message}\n\n可能原因：\n1. 模型名称不正确\n2. 代理不支持该模型\n3. 需要使用 Gemini 模型（gemini-3-pro-preview）\n\n请检查环境变量和模型配置`;
        } else {
          errorMessage = `❌ 更新节点失败\n\n${error.message}\n\n诊断步骤：\n1. 打开浏览器控制台（F12）查看详细错误\n2. 检查 API 密钥是否正确配置\n3. 检查网络连接是否正常\n4. 检查文件大小和格式\n5. 查看服务器日志获取更多信息`;
        }
      }
      
      // 使用简洁的错误提示
      toast.error('更新失败', {
        description: errorMessage.split('\n')[0],
        duration: 5000,
      });
      
      setIsProcessingVideo(false);
      setIsTimeoutOverride(false); // 重置超时覆盖标志
      clearLoadingTimers();
    },
  });

  // 当prompt改变时自动调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt, adjustTextareaHeight]);

  // 处理键盘事件：Enter 提交，Shift+Enter 换行，ESC 清除焦点
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      const hasContent = Boolean(prompt.trim() || attachments.length > 0);
      const isLoading = isCreating || isUpdating || isProcessingVideo || isGeneratingUI || isGeneratingUIText;
      if (hasContent && !isLoading) {
        // 触发表单提交
        const form = e.currentTarget.closest('form');
        if (form) {
          form.requestSubmit();
        }
      } else if (!hasContent) {
        toast.error('请输入内容或上传文件', {
          duration: 3000,
        });
      }
    } else if (e.key === 'Escape' && !e.shiftKey) {
      // ESC键：清除焦点，但不阻止事件传播（允许其他组件处理）
      e.currentTarget.blur();
    }
    // Shift+Enter 允许默认行为（插入换行）
  }, [prompt, attachments.length, isCreating, isUpdating, isProcessingVideo, isGeneratingUI, isGeneratingUIText]);

  // 清理加载定时器
  const clearLoadingTimers = () => {
    if (loadingTimersRef.current && Array.isArray(loadingTimersRef.current)) {
    loadingTimersRef.current.forEach(timer => clearTimeout(timer));
    }
    loadingTimersRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoadingStep('');
    setProgress(0);
  };

  // 强制重置所有加载状态（用于超时或手动取消）
  const forceResetLoading = () => {
    setIsProcessingVideo(false);
    setIsTimeoutOverride(true); // 设置超时覆盖标志，强制重置所有 loading 状态
    clearLoadingTimers();
    // 重置提示和附件（让用户可以重新开始）
    setPrompt('');
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // 注意：isCreating 和 isUpdating 是由 useServerAction 管理的，无法直接重置
    // 但我们可以通过 isTimeoutOverride 标志来覆盖这些状态，强制重置 UI
    // 服务器端的请求会继续执行，但用户界面会重置，允许用户重新操作
  };

  // 启动加载步骤动画
  const startLoadingSteps = () => {
    clearLoadingTimers();
    setProgress(0);
    
    // 确保 loadingTimersRef.current 是数组（防止 undefined 错误）
    if (!Array.isArray(loadingTimersRef.current)) {
      loadingTimersRef.current = [];
    }
    
    // 设置超时：600秒后自动重置（防止卡死）
    timeoutRef.current = setTimeout(() => {
      logWarn('操作超时，自动重置加载状态');
      forceResetLoading();
              toast.error('操作超时', {
                description: '请求已超过 10 分钟，已自动重置',
                duration: 5000,
              });
    }, 600000);
    
    // 重置超时覆盖标志（新请求开始时）
    setIsTimeoutOverride(false);
    
    // 立即设置第一步
    setLoadingStep('👀 正在观察需求...');
    setProgress(10);
    
    // 2秒后：深度推理
    const timer1 = setTimeout(() => {
      setLoadingStep('🧠 GPT-5.0 正在深度推理...');
      setProgress(30);
    }, 2000);
    loadingTimersRef.current.push(timer1);
    
    // 5秒后：构建组件
    const timer2 = setTimeout(() => {
      setLoadingStep('🔨 正在构建 React 组件...');
      setProgress(60);
    }, 5000);
    loadingTimersRef.current.push(timer2);
    
    // 8秒后：打磨细节
    const timer3 = setTimeout(() => {
      setLoadingStep('💅 正在打磨 UI 细节...');
      setProgress(85);
    }, 8000);
    loadingTimersRef.current.push(timer3);
    
    // 进度条缓慢增长到 90%
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 0.5;
      });
    }, 200);
    
    // 保存 interval 以便清理
    const intervalId = progressInterval as unknown as NodeJS.Timeout;
    loadingTimersRef.current.push(intervalId);
  };
  

  // 处理单个文件的辅助函数
  const processSingleFile = async (file: File): Promise<FileAttachment | null> => {
    return new Promise((resolve, reject) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isPDF = file.type === 'application/pdf';
      const isWord = file.type === 'application/msword' || 
                     file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     /\.(doc|docx)$/i.test(file.name);
      const isPPT = file.type === 'application/vnd.ms-powerpoint' ||
                     file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                     /\.(ppt|pptx)$/i.test(file.name);
      const isText = file.type.startsWith('text/') || 
                     /\.(md|txt|json|csv|js|ts|tsx|jsx|css|html|xml|yaml|yml)$/i.test(file.name);
      
      // 策略 1: Word 文档
      if (isWord) {
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
          reject(new Error(`Word 文件 "${file.name}" 大小超过 20MB`));
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          resolve({
            name: file.name,
            type: 'text',
            content: base64String,
            mimeType: file.type || (file.name.endsWith('.docx') 
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/msword'),
          });
        };
        reader.onerror = () => reject(new Error(`读取 Word 文件 "${file.name}" 失败`));
        reader.readAsDataURL(file);
        return;
      }
      
      // 策略 1.5: PPT 文档
      if (isPPT) {
        const maxSize = 20 * 1024 * 1024;
          if (file.size > maxSize) {
          reject(new Error(`PPT 文件 "${file.name}" 大小超过 20MB`));
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          resolve({
            name: file.name,
            type: 'text',
            content: base64String,
            mimeType: file.type || (file.name.endsWith('.pptx') 
              ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
              : 'application/vnd.ms-powerpoint'),
          });
        };
        reader.onerror = () => reject(new Error(`读取 PPT 文件 "${file.name}" 失败`));
        reader.readAsDataURL(file);
        return;
      }
      
      // 策略 2: 文本文件
      if (isText) {
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
          reject(new Error(`Word 文件 "${file.name}" 大小超过 20MB`));
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          resolve({
            name: file.name,
            type: 'text',
            content: base64String,
            mimeType: file.type || (file.name.endsWith('.docx') 
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/msword'),
          });
        };
        reader.onerror = () => reject(new Error(`读取 Word 文件 "${file.name}" 失败`));
        reader.readAsDataURL(file);
        return;
      }
      
      // 策略 2: 文本文件
        if (isText) {
            const reader = new FileReader();
            reader.onload = (event) => {
          const textContent = event.target?.result as string;
          if (!textContent || textContent.trim().length === 0) {
            reject(new Error(`文件 "${file.name}" 内容为空`));
                return;
              }
          
          // 检查是否为HTML文件
          const isHTML = file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm');
          
          resolve({
            name: file.name,
            type: 'text',
            content: textContent,
            // 对于HTML文件，保存原始文本内容用于分类分析
            rawTextContent: isHTML ? textContent : undefined,
          });
        };
        reader.onerror = () => reject(new Error(`读取文本文件 "${file.name}" 失败`));
        reader.readAsText(file, 'UTF-8');
        return;
        }

      // 策略 3: 二进制文件（PDF、图片、视频）
        const maxSize = isVideo ? 50 * 1024 * 1024 : (isPDF ? 20 * 1024 * 1024 : 10 * 1024 * 1024);
        if (file.size > maxSize) {
          const sizeLimit = isVideo ? '50MB' : (isPDF ? '20MB' : '10MB');
        reject(new Error(`文件 "${file.name}" 大小超过 ${sizeLimit}`));
        return;
        }

        // 处理视频（需要验证时长）
        if (isVideo) {
          const video = document.createElement('video');
          video.preload = 'metadata';
            video.onloadedmetadata = () => {
              window.URL.revokeObjectURL(video.src);
              const duration = video.duration;
              if (duration > 30) {
            reject(new Error(`视频 "${file.name}" 时长超过 30 秒`));
                return;
              }
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64String = event.target?.result as string;
            resolve({
              name: file.name,
              type: 'media',
              content: base64String,
              mimeType: file.type,
            });
          };
          reader.onerror = () => reject(new Error(`读取视频 "${file.name}" 失败`));
          reader.readAsDataURL(file);
        };
        video.onerror = () => reject(new Error(`读取视频元数据 "${file.name}" 失败`));
            video.src = URL.createObjectURL(file);
        return;
      }

      // 处理图片或 PDF
      if (isImage) {
        convertFileToLosslessBase64(file)
          .then((base64String) => {
            resolve({
          name: file.name,
          type: 'media',
              content: base64String,
              preview: base64String,
              mimeType: file.type,
            });
          })
          .catch((error) => reject(new Error(`读取图片 "${file.name}" 失败: ${error.message}`)));
      } else {
        // PDF
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          resolve({
            name: file.name,
            type: 'media',
            content: base64String,
            mimeType: file.type,
          });
        };
        reader.onerror = () => reject(new Error(`读取 PDF "${file.name}" 失败`));
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // 验证所有文件类型
    for (const file of fileArray) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isPDF = file.type === 'application/pdf';
      const isWord = file.type === 'application/msword' || 
                     file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     /\.(doc|docx)$/i.test(file.name);
      const isPPT = file.type === 'application/vnd.ms-powerpoint' ||
                     file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                     /\.(ppt|pptx)$/i.test(file.name);
      const isText = file.type.startsWith('text/') || 
                     /\.(md|txt|json|csv|js|ts|tsx|jsx|css|html|xml|yaml|yml)$/i.test(file.name);
      
      if (!isImage && !isVideo && !isPDF && !isWord && !isPPT && !isText) {
        toast.error('不支持的文件类型', {
          description: `文件 "${file.name}" 不支持。请选择支持的文件类型：图片、视频、PDF、Word、PPT、文档或代码文件`,
          duration: 5000,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    // 处理所有文件
    setIsProcessingVideo(true);
    const processedAttachments: FileAttachment[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const attachment = await processSingleFile(file);
        if (attachment) {
          processedAttachments.push(attachment);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : `处理文件 "${file.name}" 失败`;
        errors.push(errorMsg);
        logError(`处理文件失败: ${file.name}`, error);
      }
    }

    setIsProcessingVideo(false);

    // 显示处理结果
    if (processedAttachments.length > 0) {
      setAttachments(prev => [...prev, ...processedAttachments]);
      // 为了向后兼容，将第一个文件设置为 attachment
      if (processedAttachments.length > 0) {
        setAttachment(processedAttachments[0]);
      }
      
      if (processedAttachments.length === fileArray.length) {
        toast.success(`成功上传 ${processedAttachments.length} 个文件`, {
          description: (Array.isArray(processedAttachments) ? processedAttachments : []).map(a => a.name).join('、'),
          duration: 4000,
        });
      } else {
        toast.warning(`部分文件上传成功`, {
          description: `成功: ${processedAttachments.length}/${fileArray.length}，失败: ${errors.length}`,
          duration: 5000,
        });
      }
    }

    if (errors.length > 0) {
      errors.forEach(error => {
        toast.error(error, { duration: 3000 });
      });
    }

    // 清空文件输入，允许重复选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * 无损转 Base64
   * 适用于：UI 截图、线框图、架构图
   * 使用 FileReader 直接读取文件的原始二进制流，不经过任何压缩算法
   */
  const convertFileToLosslessBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 1. 强制检查：如果是 UI 图，尽量只允许 PNG
      // JPEG 即使是 100% 质量，对于红/蓝色的锐利边缘也有损失
      if (file.type.startsWith('image/') && !file.type.includes('png') && !file.type.includes('gif') && !file.type.includes('webp')) {
        logWarn('⚠️ [CommandBar] 检测到非PNG图片格式，建议使用PNG格式以获得最佳UI还原效果:', {
          fileName: file.name,
          fileType: file.type,
        });
      }
      
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // 这里的 result 就是原汁原味的 Base64，不丢任何 1px 细节
        resolve(result);
      };
      
      reader.onerror = (error) => reject(error);
      
      // 直接读取，不做任何 canvas 处理
      reader.readAsDataURL(file);
    });
  };

  const processBinaryFile = async (file: File, fileCategory: 'image' | 'video' | 'pdf') => {
    // 对于图片，使用无损读取（不压缩，保持原始质量）
    if (fileCategory === 'image') {
      try {
        // 无损读取：直接使用 FileReader，不经过任何 canvas 压缩
        const losslessBase64 = await convertFileToLosslessBase64(file);
        setAttachment({
          name: file.name,
          type: 'media',
          content: losslessBase64,
          preview: losslessBase64,
          mimeType: file.type,
        });
        setIsProcessingVideo(false);
      } catch (error) {
        logError('图片读取失败:', error);
        toast.error('读取图片失败', {
          description: '请重试',
          duration: 3000,
          });
          setIsProcessingVideo(false);
      }
      return;
    }
    
    // 非图片文件使用原始方式处理
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setAttachment({
        name: file.name,
        type: 'media',
        content: base64String,
        preview: undefined,
        mimeType: file.type,
      });
      setIsProcessingVideo(false);
    };
    reader.onerror = () => {
      const errorMsg = fileCategory === 'video' ? '读取视频失败，请重试' 
                     : fileCategory === 'pdf' ? '读取 PDF 失败，请重试'
                     : '读取图片失败，请重试';
      alert(errorMsg);
      setIsProcessingVideo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = (index?: number) => {
    if (index !== undefined) {
      // 删除指定索引的附件
      setAttachments(prev => {
        const newAttachments = prev.filter((_, i) => i !== index);
        // 如果删除的是第一个附件，更新 attachment
        if (index === 0 && newAttachments.length > 0) {
          setAttachment(newAttachments[0]);
        } else if (newAttachments.length === 0) {
          setAttachment(null);
        }
        return newAttachments;
      });
    } else {
      // 删除所有附件
      setAttachment(null);
      setAttachments([]);
    }
    setIsProcessingVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    if (!items) return;

    // 遍历剪贴板项目，查找文件
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // 检查是否为文件类型（图片、PDF、Word等）
      if (item.kind === 'file') {
        e.preventDefault(); // 防止粘贴二进制数据作为文本
        
        const blob = item.getAsFile();
        if (!blob) continue;

        // 创建File对象，使用原始文件名或生成默认名称
        const fileName = blob.name || `粘贴的文件_${Date.now()}`;
        const file = new File([blob], fileName, { type: blob.type || item.type });
        
        // 检查文件类型
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isPDF = file.type === 'application/pdf';
        const isWord = file.type === 'application/msword' || 
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                       /\.(doc|docx)$/i.test(file.name);
        const isPPT = file.type === 'application/vnd.ms-powerpoint' ||
                      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                      /\.(ppt|pptx)$/i.test(file.name);
        const isText = file.type.startsWith('text/') || 
                       /\.(md|txt|json|csv|js|ts|tsx|jsx|css|html|xml|yaml|yml)$/i.test(file.name);
        
        // 验证文件类型
        if (!isImage && !isVideo && !isPDF && !isWord && !isPPT && !isText) {
          toast.warning('不支持的文件类型', {
            description: `文件类型 "${file.type || '未知'}" 不支持粘贴。请使用文件选择按钮上传。`,
            duration: 4000,
          });
          continue;
        }

        // 验证文件大小
        const maxSize = isVideo ? 50 * 1024 * 1024 : (isPDF || isWord || isPPT ? 20 * 1024 * 1024 : 10 * 1024 * 1024);
        if (blob.size > maxSize) {
          const sizeLimit = isVideo ? '50MB' : (isPDF || isWord || isPPT ? '20MB' : '10MB');
          toast.error('文件大小超限', {
            description: `文件大小不能超过 ${sizeLimit}`,
            duration: 4000,
          });
          continue;
        }

        // 使用 processSingleFile 处理文件（统一处理逻辑）
        try {
          setIsProcessingVideo(true);
          const attachment = await processSingleFile(file);
          if (attachment) {
            setAttachments(prev => [...prev, attachment]);
            // 为了向后兼容，将第一个文件设置为 attachment
            setAttachment(attachment);
            toast.success('文件粘贴成功', {
              description: attachment.name,
              duration: 3000,
            });
          }
        } catch (error) {
          logError('粘贴文件处理失败:', error);
          const errorMsg = error instanceof Error ? error.message : '处理文件失败';
          toast.error('粘贴文件失败', {
            description: errorMsg,
            duration: 4000,
          });
        } finally {
          setIsProcessingVideo(false);
        }
        
        // 只处理第一个文件
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const isLoading = isCreating || isUpdating || isProcessingVideo || isGeneratingUI || isGeneratingUIText;
    if (isLoading) {
      toast.info('正在处理中，请稍候...');
      return;
    }

    const hasContent = prompt.trim() || attachments.length > 0;
    if (!hasContent) {
      toast.error('请输入内容或上传文件', {
        description: '请填写产品描述或上传参考文件',
        duration: 3000,
      });
      return;
    }

    // 对话区：追加用户消息与助手「进行中」占位（本地 + store，供对话窗口展示）
    const userContent = prompt.trim() || '(无文字)';
    const attachmentSummary = attachments.length > 0 ? `附：${attachments.length} 个文件` : undefined;
    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userContent,
      attachmentSummary,
    };
    const astMsg: ConversationMessage = {
      id: `ast-${Date.now()}`,
      role: 'assistant',
      content: isUIGenerationContext ? '正在生成或更新 UI…' : '正在生成画布…',
      status: 'sending',
    };
    appendConversationMessage(userMsg);
    appendConversationMessage(astMsg);

    // 启动加载步骤动画
    startLoadingSteps();

    const userPromptLowerForIntent = prompt.trim().toLowerCase();
    const isRequestingUIGlobal =
      userPromptLowerForIntent.includes('生成ui') || userPromptLowerForIntent.includes('生成 ui') ||
      userPromptLowerForIntent.includes('生成本页面') || userPromptLowerForIntent.includes('生成页面') ||
      userPromptLowerForIntent.includes('生成界面') || userPromptLowerForIntent.includes('生成一个') ||
      userPromptLowerForIntent.includes('管理系统') || userPromptLowerForIntent.includes('pc端') ||
      userPromptLowerForIntent.includes('桌面端') || userPromptLowerForIntent.includes('后台');

    // 有画布节点、用户要求生成UI、但未选中节点 → 选中首个节点并提示再次发送，避免误走建图导致「输入信息不够明确」
    // 若用户已在画布选中节点（含在节点详情/生成页里输入「生成UI」），不提示「再次发送」，直接走下方 UI 生成分支
    const hasNoAttachment = !attachment && attachments.length === 0;
    const canGenerateUIForSelectedNode = selectedNode !== null; // 含 embedInPanel 场景：面板内输入时仍按当前选中节点生成
    if (!canGenerateUIForSelectedNode && nodes.length > 0 && isRequestingUIGlobal && hasNoAttachment) {
      selectNode(nodes[0].id);
      openNodeDetail(nodes[0].id);
      updateLastAssistantMessage(`已选中「${nodes[0].data?.label ?? '首页'}」，请再次点击发送以生成该页面的 UI。`, 'done');
      toast.info('已选中首个节点', {
        description: '请再次点击发送以生成该页面的 UI',
        duration: 4000,
      });
      setProgress(0);
      setLoadingStep('');
      clearLoadingTimers();
      return;
    }

    if ((isEditMode || embedInPanel) && selectedNode) {
      // 检查是否有图片附件，如果有则使用 Model Relay 流程（generateUIFromImage）
      // 优先用 attachment，若无图片则从 attachments 中取第一个图片，确保「上传图片生成UI」一定走通
      const isPdf = (a: FileAttachment | null) => a?.mimeType === 'application/pdf';
      const isVideoType = (a: FileAttachment | null) => a?.mimeType?.startsWith('video/');
      const isImageAttachment = (a: FileAttachment | null) =>
        a &&
        !isPdf(a) &&
        (a.mimeType?.startsWith('image/') || (a.type === 'media' && a.preview && !isVideoType(a)));
      const firstImage =
        isImageAttachment(attachment) ? attachment : attachments.find((a) => isImageAttachment(a)) ?? null;
      const isImage = !!firstImage;
      const imageForUI = firstImage?.content ? firstImage : null;

      if (isImage && imageForUI?.content) {
        // ========== 意图区分：按图复刻 vs 按图中信息生成 ==========
        // 仅当用户明确说明「按图片中的内容生成UI」「复刻」「设计稿」等时，才按设计稿复刻；否则默认视为「信息在图片中」，按信息生成 UI。
        const promptLower = (prompt.trim() || '').toLowerCase();
        const isReplicateDesignIntent =
          /按图片中的内容生成\s*ui|按图片(中的内容)?生成\s*ui|按图(片)?生成\s*ui|复刻|设计稿|照着做|按图做|根据(图片|设计稿)生成/i.test(promptLower) ||
          /按.*图.*生成\s*ui|根据.*图.*生成/i.test(promptLower);
        log('🔍 [CommandBar] 上传图片时的意图:', {
          isReplicateDesignIntent,
          promptPreview: prompt.trim().slice(0, 80),
        });

        // ========== Model Relay 流程：UI 优先，PRD 由用户手动生成 ==========
        const targetNodeId = selectedNode.id;
        const targetNodeLabel = selectedNode.data.label || selectedNode.id;
        let accumulatedCode: string = '';
        let fullCode: string = '';

        try {
          setLoadingStep(isReplicateDesignIntent ? '🎨 正在按设计稿生成 UI...' : '🎨 正在根据图片中的信息生成 UI...');
          setProgress(10);
          toast.info(
            isReplicateDesignIntent ? '正在按设计稿复刻 UI，请稍候…' : '正在识别图片中的信息并生成 UI…',
            { duration: 4000 }
          );
          accumulatedCode = '';
          fullCode = '';

          const optimizedPrompt = (() => {
            if (isReplicateDesignIntent) {
              return prompt.trim() || `Analyze the uploaded image and generate production-ready React + Tailwind CSS code.

**Step 1: Classify the Image**
- Is this a high-fidelity design mockup? -> Use "Pixel-Perfect Clone" strategy.
- Is this a wireframe/sketch? -> Use "Professional Interpretation" strategy.

**Step 2: Apply Universal Rules**
- Every text element MUST have an explicit \`text-*\` color class (e.g., \`text-gray-900\`, \`text-slate-600\`).
- Headings: Use dark colors (\`text-gray-900\` / \`text-slate-800\`).
- Body text: Use medium-dark colors (\`text-gray-600\` / \`text-slate-500\`).
- NEVER use light gray text (\`text-gray-300\` or lighter) on white backgrounds.
- Look for indicator bars (colored side strips) and implement them with \`absolute\` positioning.

**Step 3: Generate Code**
- Use React Hooks (useState, useEffect) for interactivity.
- Use Tailwind CSS for all styling (NO inline styles).
- Import icons from \`lucide-react\`.
- Ignore phone system status bar elements.
- Ensure all buttons, inputs, and tabs are interactive.

Generate the complete .tsx code now.`;
            }
            // 默认：图片中是需求/描述信息，先识别再按信息生成 UI，不复刻版式
            return prompt.trim() || `请识别图片中的文字与需求信息（可能是需求文档截图、列表、说明等），根据识别到的信息生成一页符合需求的 React + Tailwind CSS 页面。

要求：
- 不要复刻图片的版式、布局或视觉样式；按「需求内容」实现功能与信息结构即可。
- 使用 React Hooks、Tailwind CSS、lucide-react 图标。
- 输出完整 .tsx 代码。`;
          })();
          
          // 确保图片数据格式正确（移除 data: URL 前缀，只保留 base64 数据）
          let imageBase64Data = imageForUI.content || '';
          if (imageBase64Data.includes('data:')) {
            const parts = imageBase64Data.split(',');
            if (parts.length > 1) {
              imageBase64Data = parts[1];
            }
          }
          

          // zsa-react 的 execute 返回 [data, err] 元组，需解构后使用 data
          let uiResult: UIGenerationResponse | null = null;
          const executeStartTime = Date.now();
          
          // 添加请求超时检测（10分钟）
          const requestTimeout = 600000; // 600秒 (10分钟)
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`请求超时：超过 ${requestTimeout / 1000} 秒未收到服务器响应。请检查：1. 服务器是否正常运行 2. 终端是否有日志输出 3. 网络连接是否正常`));
            }, requestTimeout);
          });
          
          try {
            if (typeof executeUI !== 'function') {
              throw new Error(`executeUI 不是一个函数: ${typeof executeUI}`);
            }
            
            const uiResultRaw = await Promise.race([
              executeUI({
                prompt: optimizedPrompt,
                imageBase64: imageBase64Data,
                themeConfig: currentTheme ?? undefined,
                tier: uiGenerationTier,
                aiConfig: aiConfig,
              }),
              timeoutPromise,
            ]);
            
            const executeDuration = Date.now() - executeStartTime;
            log(`✅ [CommandBar] executeUI 完成，耗时: ${executeDuration}ms`);
            
            const [data, err] = Array.isArray(uiResultRaw) ? uiResultRaw : [uiResultRaw, null];
            if (err) {
              logError('❌ [CommandBar] executeUI 返回错误', { err });
              toast.error('生成失败', {
                description: err instanceof Error ? err.message : '未知错误',
                duration: 5000,
              });
              forceResetLoading();
              return;
            }
            uiResult = data as UIGenerationResponse;
            
            // Handle typed response
            if (uiResult && typeof uiResult === 'object' && 'type' in uiResult) {
              const response = uiResult;
              
              if (response.type === 'rate_limit') {
                toast.error('请求过多', {
                  description: `请在 ${response.cooldownSeconds} 秒后重试`,
                  duration: 5000,
                });
                forceResetLoading();
                return;
              }
              
              if (response.type === 'network_error') {
                toast.error('网络不稳定', {
                  description: response.message,
                  duration: 5000,
                });
                forceResetLoading();
                return;
              }
              
              if (response.type === 'validation_error' || response.type === 'api_error') {
                toast.error('生成失败', {
                  description: response.message,
                  duration: 5000,
                });
                forceResetLoading();
                return;
              }
              
              // For skeleton or success, extract code
              if (response.type === 'skeleton' || response.type === 'success') {
                accumulatedCode = response.code;
                fullCode = response.code;
                log('✅ [CommandBar] UI代码生成成功 (skeleton/success)', {
                  type: response.type,
                  codeLength: response.code.length,
                  requestId: response.requestId,
                  stages: response.stages,
                });
                // Continue with normal flow below
              } else {
                // Unknown response type (runtime fallback)
                const r = response as { type?: string };
                logError('❌ [CommandBar] 未知的响应类型', { type: r.type });
                forceResetLoading();
                return;
              }
            }
          } catch (executeError: any) {
            const executeDuration = Date.now() - executeStartTime;
            logError(`❌ [CommandBar] executeUI 执行失败，耗时: ${executeDuration}ms`);
            logError('❌ [CommandBar] executeUI 错误详情:', {
              error: executeError,
              errorType: typeof executeError,
              errorMessage: executeError?.message || executeError?.error || String(executeError),
              errorStack: executeError instanceof Error ? executeError.stack : undefined,
            });
            
            // 检查是否是超时错误或网络错误
            let errorMessage = executeError?.message || executeError?.error || String(executeError);
            
            // 检测 Failed to fetch 错误
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
              errorMessage = '网络连接失败。请检查：1. 服务器是否正常运行 (npm run dev) 2. 网络连接是否正常 3. 防火墙设置';
              logError('❌ [CommandBar] ========== 网络错误诊断 ==========');
              logError('❌ [CommandBar] 网络连接失败，可能的原因：');
              logError('❌ [CommandBar] 1. 开发服务器未运行 - 请在终端运行: npm run dev');
              logError('❌ [CommandBar] 2. 服务器端口被占用 - 请检查端口 3000 是否可用');
              logError('❌ [CommandBar] 3. 网络连接问题 - 请检查网络状态');
              logError('❌ [CommandBar] 4. 防火墙阻止连接 - 请检查防火墙设置');
              logError('❌ [CommandBar] ====================================');
              
              toast.error('网络连接失败', {
                description: '无法连接到服务器。请确保开发服务器正在运行 (npm run dev)',
                duration: 8000,
              });
              
              forceResetLoading();
              return;
            }
            
            if (errorMessage.includes('请求超时') || errorMessage.includes('timeout')) {
              logError('❌ [CommandBar] ========== 诊断信息 ==========');
              logError('❌ [CommandBar] 请求超时，可能的原因：');
              logError('❌ [CommandBar] 1. 服务器端没有收到请求 - 请检查终端是否有日志输出');
              logError('❌ [CommandBar] 2. 服务器端处理时间过长 - 请检查终端日志，看是否卡在某个步骤');
              logError('❌ [CommandBar] 3. 网络连接问题 - 请检查网络状态');
              logError('❌ [CommandBar] 4. API 调用失败 - 请检查 OPENAI_API_KEY 是否正确配置');
              logError('❌ [CommandBar] ====================================');
              
              toast.error('请求超时', {
                description: '服务器响应超时，请检查网络连接',
                duration: 5000,
              });
              
              // 重置加载状态，允许用户重新操作
              forceResetLoading();
              // 超时后直接返回，不抛出错误，避免触发 onError 回调覆盖 isTimeoutOverride
              return;
            }
            
            throw new Error(`UI 代码生成失败: ${errorMessage}`);
          }

          log('📥 [CommandBar] executeUI 原始返回:', {
            result: uiResult,
            resultType: typeof uiResult,
            isArray: Array.isArray(uiResult),
            arrayLength: Array.isArray(uiResult) ? uiResult.length : undefined,
            timestamp: new Date().toISOString(),
          });

          // 处理 zsa-react 的返回格式（已在上方解构为 [data, err]，此处 uiResult 为 data）
          let resultData: UIGenerationResponse | { code?: string } | null = null;
          let resultError: unknown = null;

          if (Array.isArray(uiResult)) {
            // 兼容：若仍收到数组则再解构一次
            log('📦 [CommandBar] 检测到数组格式返回，解析中...');
            resultData = uiResult[0] || null;
            resultError = uiResult[1] || null;
            log('📦 [CommandBar] 数组解析结果:', {
              hasData: !!resultData,
              hasError: !!resultError,
              dataType: typeof resultData,
              errorType: typeof resultError,
            });
          } else if (uiResult && typeof uiResult === 'object') {
            // 对象格式：已解构后的 data（UIGenerationResponse）
            log('📦 [CommandBar] 检测到对象格式返回');
            resultData = uiResult;
          } else {
            logError('❌ [CommandBar] 未知的返回格式:', {
              result: uiResult,
              resultType: typeof uiResult,
            });
            throw new Error('UI 代码生成失败：服务器返回了未知的格式');
          }

          // 检查是否有错误
          if (resultError) {
            logError('❌ [CommandBar] 返回中包含错误:', resultError);
            const errObj = resultError as { message?: string; error?: string };
            const errorMessage = resultError instanceof Error
              ? resultError.message
              : (errObj?.message || errObj?.error || String(resultError));
            throw new Error(`UI 代码生成失败: ${errorMessage}`);
          }

          const codeFromResult = resultData && 'code' in resultData ? (resultData as { code?: string }).code : undefined;
          log('📥 [CommandBar] executeUI 解析后的结果:', {
            hasData: !!resultData,
            hasCode: !!codeFromResult,
            codeLength: codeFromResult?.length || 0,
            codePreview: codeFromResult?.substring(0, 100),
            dataKeys: resultData ? Object.keys(resultData) : [],
          });

          // 如果没有数据或没有 code，抛出错误
          if (!resultData || !codeFromResult) {
            logError('❌ [CommandBar] UI generation failed: no code in result', {
              originalResult: uiResult,
              parsedData: resultData,
              dataKeys: resultData ? Object.keys(resultData) : [],
            });
            throw new Error('UI 代码生成失败：服务器没有返回有效的代码');
          }

          // 提取代码
          const code = codeFromResult;
          
          // 检查代码是否有效（不是占位符）
          const placeholderCode = 'function App() { return <div>待生成</div>; }';
          if (!code || code.trim() === '' || code === placeholderCode || code.includes('待生成')) {
            logError('❌ [CommandBar] UI generation failed: no valid code returned', {
              result: uiResult,
              resultData,
              hasCode: !!code,
              codePreview: code?.substring(0, 100),
              isPlaceholder: code === placeholderCode,
            });
            throw new Error('UI 代码生成失败：服务器返回了占位符代码。请检查 server action 实现，确保 generateUIFromImage 已正确实现 AI 生成逻辑');
          }

          fullCode = code;
          accumulatedCode = fullCode;

          // 立即更新 UI 代码到节点（用户可以看到 UI 立即出现）
          // 使用保存的目标节点ID，确保即使切换节点也能更新到正确的节点
          log('💾 [CommandBar] 立即保存UI代码到store:', {
            nodeId: targetNodeId,
            nodeLabel: targetNodeLabel,
            codeLength: accumulatedCode.length,
            codePreview: accumulatedCode.substring(0, 100),
            hasPreviewUrl: !!imageForUI?.preview,
          });
          
          // 从store获取最新的节点数据，确保使用最新的artifacts
          const latestNode = useCanvasStore.getState().nodes.find(n => n.id === targetNodeId);
          if (!latestNode) {
            logError('❌ [CommandBar] 找不到目标节点:', { targetNodeId });
            toast.error('节点不存在', {
              description: '目标节点已不存在，无法保存UI代码',
              duration: 3000,
            });
            return;
          }
          
          updateNodeData(targetNodeId, {
            artifacts: {
              ...latestNode.data.artifacts,
              view: {
                code: accumulatedCode,
                previewUrl: imageForUI?.preview,
              },
            },
          });
          
          // 验证保存是否成功
          setTimeout(() => {
            const savedNode = useCanvasStore.getState().nodes.find(n => n.id === targetNodeId);
            if (savedNode) {
              log('✅ [CommandBar] UI代码保存验证:', {
                nodeId: targetNodeId,
                savedCodeLength: savedNode.data.artifacts?.view?.code?.length || 0,
                savedCodePreview: savedNode.data.artifacts?.view?.code?.substring(0, 100) || 'N/A',
                isMatch: savedNode.data.artifacts?.view?.code === accumulatedCode,
              });
            } else {
              logError('❌ [CommandBar] UI代码保存验证失败：找不到节点:', { targetNodeId });
            }
          }, 100);

          setLoadingStep('✅ UI 代码已生成');
          setProgress(100);
          updateLastAssistantMessage(`已为「${targetNodeLabel}」更新 UI 代码。`, 'done');

          // UI生成成功，提示用户可以手动生成PRD
          toast.success('UI 代码已生成', {
            description: '您可以在节点详情面板中手动生成 PRD 文档',
            duration: 3000,
          });

          // 清除超时保护（UI 已成功生成）
          // 清除UI生成专用的超时定时器
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            log('✅ [CommandBar] UI生成成功（从图片），已清除超时定时器');
          }
          clearLoadingTimers();
          
          // 重置状态
          setPrompt('');
          setAttachment(null);
          setAttachments([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        } catch (error) {
          // 改进错误消息提取
          let errorMessage = '';
          let errorStack: string | undefined;
          try {
            if (error instanceof Error) {
              errorMessage = error.message;
              errorStack = error.stack;
            } else if (error && typeof error === 'object') {
              errorMessage = (error as any).message || (error as any).error || (error as any).msg || JSON.stringify(error);
              errorStack = (error as any).stack;
            } else {
              errorMessage = String(error);
            }
          } catch (e) {
            errorMessage = '未知错误（无法序列化错误对象）';
          }
          logError('❌ [CommandBar] ========== Model Relay Flow Failed ==========');
          // 安全地访问 fullCode（可能在错误发生时还未赋值）
          const codeInfo = {
            hasCode: fullCode ? fullCode.length > 0 : false,
            codeLength: fullCode ? fullCode.length : 0,
          };
          
          logError('❌ [CommandBar] Model Relay error:', {
            message: errorMessage,
            stack: errorStack,
            errorType: error?.constructor?.name || typeof error,
            fullError: error,
            selectedNode: selectedNode?.id,
            ...codeInfo,
            timestamp: new Date().toISOString(),
          });
          logError('❌ [CommandBar] Error context:', {
            hasAttachment: !!attachment,
            attachmentType: attachment?.type,
            promptLength: prompt?.length || 0,
            nodeExists: !!selectedNode,
            nodeId: selectedNode?.id,
          });
          
          // 检查是否至少 UI 代码已生成
          const currentCode = selectedNode?.data?.artifacts?.view?.code;
          // 清除UI生成专用的超时定时器
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            log('❌ [CommandBar] UI生成失败（从图片），已清除超时定时器');
          }
          
          updateLastAssistantMessage(errorMessage, 'error');
          if (currentCode && currentCode.length > 0 && currentCode !== '// PLACEHOLDER') {
            toast.warning('UI 生成失败', {
              description: errorMessage,
              duration: 5000,
            });
            // 重置状态，让用户可以继续使用
            setIsTimeoutOverride(false); // 重置超时覆盖标志
            setPrompt('');
            setAttachment(null);
            setAttachments([]);
            clearLoadingTimers();
            return; // 不抛出错误，让用户可以使用已生成的 UI
          } else {
            toast.error('生成失败', {
              description: errorMessage,
              duration: 5000,
            });
            setIsTimeoutOverride(false); // 重置超时覆盖标志
            clearLoadingTimers();
            throw error; // UI 生成失败，抛出错误
          }
        }
      }

      // ========== 检测HTML文件并使用分类器判断用途 ==========
      // 查找HTML文件（文本类型，文件名以.html或.htm结尾）
      const htmlAttachments = attachments.filter(att => {
        const fileName = att.name.toLowerCase();
        return att.type === 'text' && (fileName.endsWith('.html') || fileName.endsWith('.htm'));
      });

      // 如果存在HTML文件，使用分类器判断用途
      if (htmlAttachments.length > 0) {
        const htmlAttachment = htmlAttachments[0]; // 处理第一个HTML文件
        const htmlContent = htmlAttachment.rawTextContent || htmlAttachment.content;
        
        log('🔍 [CommandBar] 检测到HTML文件，开始分类:', {
          fileName: htmlAttachment.name,
          hasRawTextContent: !!htmlAttachment.rawTextContent,
          contentLength: htmlContent?.length || 0,
        });

        const classificationContext: HTMLFileClassificationContext = {
          userPrompt: prompt.trim(),
          isEditMode: isEditMode,
          htmlContent: htmlContent,
          fileName: htmlAttachment.name,
        };

        const htmlPurpose = classifyHTMLFile(classificationContext);
        const purposeDescription = getClassificationDescription(htmlPurpose);
        
        log('✅ [CommandBar] HTML文件分类结果:', {
          fileName: htmlAttachment.name,
          purpose: htmlPurpose,
          description: purposeDescription,
        });

        // 根据分类结果处理
        if (htmlPurpose === 'ui-mockup') {
          // UI示意文件：使用 generateUIFromText，将HTML内容作为参考
          log('🎨 [CommandBar] HTML文件识别为UI示意，使用 generateUIFromText');
          setLoadingStep('🎨 正在基于HTML生成UI代码...');
          setProgress(10);
          
          // 清除之前的超时定时器
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          
          // 设置超时时间（600秒，10分钟）
          const uiGenerationTimeout = 600000;
          timeoutRef.current = setTimeout(() => {
            logWarn('⚠️ [CommandBar] UI生成超时，自动重置加载状态');
            forceResetLoading();
            toast.error('⏱️ UI生成超时', {
              description: 'UI生成已超过 10 分钟，已自动重置。如果问题持续，请检查网络连接或稍后重试。',
              duration: 8000,
            });
          }, uiGenerationTimeout);
          
          try {
            // 分析用户意图：判断是"复刻"还是"改进"
            const userPromptLower = prompt.trim().toLowerCase();
            const isExactClone = userPromptLower.includes('复刻') || 
                                 userPromptLower.includes('还原') ||
                                 userPromptLower.includes('复制') ||
                                 userPromptLower.includes('一模一样') ||
                                 userPromptLower.includes('精确') ||
                                 userPromptLower.includes('完全按照') ||
                                 userPromptLower.includes('保持原样');
            
            const isImprovement = userPromptLower.includes('改进') || 
                                  userPromptLower.includes('优化') ||
                                  userPromptLower.includes('美化') ||
                                  userPromptLower.includes('升级') ||
                                  userPromptLower.includes('现代化') ||
                                  userPromptLower.includes('优化设计');
            
            // 默认策略：如果用户没有明确要求，对于完整HTML文件倾向于复刻，对于线框图倾向于改进
            const isWireframe = htmlContent.includes('手绘') || 
                               htmlContent.includes('wireframe') ||
                               htmlContent.includes('sketch') ||
                               htmlContent.length < 5000; // 很短的HTML可能是简单线框图
            
            const shouldExactClone = isExactClone || (!isImprovement && !isWireframe);
            
            log('🔍 [CommandBar] HTML文件处理意图分析:', {
              userPrompt: prompt.trim(),
              isExactClone,
              isImprovement,
              isWireframe,
              shouldExactClone,
              htmlContentLength: htmlContent.length,
            });
            
            // 增加HTML内容长度限制到100000字符，确保完整传递（支持大型HTML文件）
            const htmlContentForPrompt = htmlContent.substring(0, 100000);
            const isTruncated = htmlContent.length > 100000;
            
            // 解析HTML提取关键信息（用于精确复刻）
            const parsedInfo = parseHTML(htmlContent);
            const structuredInfo = generateStructuredInfoText(parsedInfo);
            const iconMapping = generateIconMappingInstructions(parsedInfo);
            
            log('📊 [CommandBar] HTML解析结果:', {
              backgroundColors: parsedInfo.backgroundColors?.all?.length || 0,
              textColors: parsedInfo.textColors?.all?.length || 0,
              materialIcons: parsedInfo.icons?.materialIcons?.length || 0,
              customClasses: parsedInfo.customClasses?.length || 0,
              hasDarkMode: parsedInfo.hasDarkMode || false,
              textContent: {
                buttons: parsedInfo.textContent?.buttons?.length || 0,
                labels: parsedInfo.textContent?.labels?.length || 0,
                menuItems: parsedInfo.textContent?.menuItems?.length || 0,
                cardTitles: parsedInfo.textContent?.cardTitles?.length || 0,
                cardContent: parsedInfo.textContent?.cardContent?.length || 0,
                allTextLength: parsedInfo.textContent?.allText?.length || 0,
              },
              domStructureLength: parsedInfo.domStructure?.length || 0,
            });
            
            // 根据用户意图构建不同的提示词
            let htmlReferencePrompt: string;
            
            if (shouldExactClone) {
              // 精确复刻模式 - 使用解析出的结构化信息
              htmlReferencePrompt = `**任务：精确复刻HTML文件为React组件（100%一致）**

用户上传了一个HTML文件，要求精确复刻其UI设计，包括所有颜色、布局、样式、字体、图标等细节。

文件名：${htmlAttachment.name}

HTML完整内容：
\`\`\`html
${htmlContentForPrompt}${isTruncated ? '\n\n...(内容已截断，但请基于已有内容尽可能精确复刻)' : ''}
\`\`\`

${prompt.trim() ? `用户额外要求：${prompt.trim()}` : ''}

**=== HTML解析结果（必须严格遵守） ===**

${structuredInfo}

${iconMapping}

**=== 核心要求（必须严格遵守 - 精确复刻模式） ===**

1. **精确复刻原则（最高优先级）**：
   - **必须100%忠实还原HTML文件的所有视觉元素**，包括：
     - **DOM结构**：**必须严格按照**上述解析结果中的DOM结构树生成React组件，不能改变容器层次、嵌套关系和元素顺序
     - **背景色**：**必须使用**上述解析结果中的背景色，不能改变或替换
     - **文本颜色**：**必须使用**上述解析结果中的文本颜色，确保文本在背景上清晰可见
     - **字体大小**：**必须使用**上述解析结果中的字体大小类名
     - **布局结构**：精确匹配HTML的DOM结构、容器层次、Flex/Grid布局
     - **间距**：精确匹配 padding、margin、gap 值（使用解析结果中的间距类名）
     - **圆角和阴影**：精确匹配 rounded 和 shadow 类名（使用解析结果中的样式类名）
     - **边框和定位**：精确匹配 border 和 position 类名（使用解析结果中的样式类名）
     - **图标**：**必须使用**上述图标映射关系，不能自行选择其他图标
     - **尺寸**：精确匹配 width、height 类名（使用解析结果中的尺寸类名）

2. **颜色处理（严格）**：
   - **必须使用**解析结果中提取的颜色值，不能改变或替换
   - 如果HTML使用了自定义Tailwind颜色（如 \`bg-background-light\`），**必须使用相同的颜色值**（如 \`bg-[#F3F4F6]\`）
   - 如果HTML中有颜色定义，必须使用相同的颜色值
   - **文本颜色与背景色匹配**：确保所有文本在背景上清晰可见（浅色背景用深色文本，深色背景用浅色文本）

3. **图标处理（严格）**：
   - **如果HTML中使用的是 Material Icons**（如 \`<span class="material-icons-round">icon_name</span>\`）：**必须保留为 Material Icons 格式**，使用 \`<span className="material-icons-round">icon_name</span>\`，**不要替换为 Lucide 图标**
   - **如果HTML中使用的是其他图标**：使用上述图标映射关系转换为 Lucide 图标
   - 确保图标的视觉样式（大小、颜色、位置）与HTML完全一致
   - **HTML 转 React 时**：将 \`class\` 改为 \`className\`，但**保持 Material Icons 格式不变**

4. **布局结构精确还原（关键）**：
   - **必须严格按照**上述解析结果中的DOM结构树生成React组件
   - 精确匹配所有容器的类名和样式（使用解析结果中的所有类名）
   - 精确匹配上述解析结果中的布局信息（Flex/Grid/间距）
   - **不能简化或合并**容器结构，必须保持与HTML完全一致的嵌套层次
   - **不能改变**元素的顺序和位置关系

5. **自定义CSS样式**：
   - 如果HTML中有自定义CSS类（如上述解析结果中的自定义类），**必须在代码中实现相同的样式**
   - 可以使用内联样式或style标签（如果Tailwind无法实现）
   - 必须包含所有自定义样式，不能省略

6. **深色模式支持**：
   ${parsedInfo.hasDarkMode ? '- HTML支持深色模式，生成的代码也必须支持深色模式\n   - 使用 \`dark:\` 前缀实现深色模式样式\n   - 默认显示模式必须与HTML一致（通常是浅色模式）' : '- HTML不支持深色模式，生成的代码也不需要支持深色模式'}

7. **技术实现要求**：
   - 使用React + Tailwind CSS
   - 使用React Hooks管理状态（useState, useEffect等）
   - 所有交互元素必须可交互
   - 代码必须可以直接运行

8. **代码格式要求**：
   - 只返回完整的 .tsx 代码
   - 不要包含markdown标记（\`\`\`tsx等）
   - 不要包含注释或说明文字

**=== 重要提醒（必须遵守） ===**
- **不要"改进"或"优化"设计**，必须精确复刻
- **不要改变颜色方案**（即使是浅灰色背景也要保持）
- **不要简化布局结构**，必须保持与HTML完全一致的嵌套层次
- **不要合并或拆分容器**，必须保持与HTML完全一致的元素结构
- **必须包含所有自定义样式**
- **必须使用解析结果中的颜色、字体、图标、样式信息**，不能自行选择
- **必须严格按照DOM结构树生成代码**，不能改变元素顺序和层次关系

**=== 复刻检查清单（生成代码前必须验证） ===**
- [ ] DOM结构是否与HTML完全一致（容器层次、嵌套关系、元素顺序）
- [ ] 背景色是否使用了解析结果中的颜色值
- [ ] 文本颜色是否使用了解析结果中的颜色值，且确保在背景上清晰可见
- [ ] 字体大小是否使用了解析结果中的类名
- [ ] 布局（Flex/Grid）是否使用了解析结果中的类名
- [ ] 间距（padding/margin/gap）是否使用了解析结果中的类名
- [ ] 圆角、阴影、边框是否使用了解析结果中的类名
- [ ] 图标是否使用了映射关系中的Lucide图标
- [ ] 自定义CSS类是否都已实现
- [ ] 所有视觉元素（颜色、大小、位置、间距）是否与HTML完全一致

请基于上述HTML内容和解析结果，生成一个100%精确复刻的React组件代码。`;
            } else {
              // 改进/优化模式（或线框图模式）
              htmlReferencePrompt = `**任务：基于HTML文件生成优化的React组件**

用户上传了一个HTML文件${isWireframe ? '（线框图）' : ''}，要求基于此生成或改进React组件代码。

文件名：${htmlAttachment.name}

HTML内容：
\`\`\`html
${htmlContentForPrompt}${isTruncated ? '\n\n...(内容已截断)' : ''}
\`\`\`

${prompt.trim() ? `用户要求：${prompt.trim()}` : '请基于这个HTML文件生成现代化的React组件代码。'}

**核心要求：**

1. **理解HTML结构**：
   - 分析HTML文件的布局结构和功能模块
   - 理解页面的核心功能和用户场景
   - ${isWireframe ? '如果这是线框图，需要在保持基本布局的前提下，完善视觉设计和交互细节' : '如果HTML是完整的设计，可以在保持核心布局的基础上进行优化'}

2. **设计改进（如果适用）**：
   - ${isImprovement ? '根据用户要求进行设计改进和优化' : '保持HTML的核心布局和功能结构'}
   - 使用现代化的UI设计模式
   - 优化颜色方案、间距、圆角等视觉元素
   - 确保响应式设计和移动端友好

3. **技术实现要求**：
   - 使用React + Tailwind CSS
   - 使用React Hooks管理状态（useState, useEffect等）
   - **图标处理规则**：
     - **如果HTML使用 Material Icons**（如 \`material-icons-round\`）：**必须保留为 Material Icons 格式**，使用 \`<span className="material-icons-round">icon_name</span>\`，**不要替换为 Lucide 图标**
     - **如果HTML使用其他图标**：使用 Lucide React 图标库，选择最接近的图标
     - **HTML 转 React 时**：将 \`class\` 改为 \`className\`，但**保持 Material Icons 格式不变**
   - 所有交互元素必须可交互
   - 添加hover和active状态的视觉反馈

4. **背景色和文本颜色（重要）**：
   - **默认使用白色背景**（\`bg-white\`），除非用户明确要求其他颜色
   - **所有文本元素必须明确设置Tailwind的text-*颜色类名**
   - 在白色背景上，文本颜色必须足够深（至少 \`text-gray-600\` 或更深）

5. **代码格式要求**：
   - 只返回完整的 .tsx 代码
   - 不要包含markdown标记
   - 不要包含注释或说明文字
   - **所有文本内容必须使用中文**

请基于上述HTML内容，生成一个${isImprovement ? '优化改进后的' : '现代化的'}React组件代码。`;
            }

            // 🚨 保存目标节点ID和标签（防止用户在生成过程中切换节点）
            const targetNodeId = selectedNode.id;
            const targetNodeLabel = selectedNode.data.label || selectedNode.id;
            
            // 🚨 添加调用前日志和状态检查
            log('🚀 [CommandBar] 准备调用 executeUIText...');
            log('📋 [CommandBar] executeUIText 调用参数:', {
              promptLength: htmlReferencePrompt.length,
              promptPreview: htmlReferencePrompt.substring(0, 200),
              nodeLabel: targetNodeLabel,
              targetNodeId: targetNodeId,
              hasProjectMeta: !!useCanvasStore.getState().projectMeta,
              hasThemeConfig: !!currentTheme,
              hasAIConfig: !!aiConfig,
              timestamp: new Date().toISOString(),
            });
            
            setLoadingStep('🤖 正在调用AI生成UI代码...');
            setProgress(20);
            toast.info('正在生成完整页面（质量优先），请稍候…', { duration: 4000 });
            
            // 🚨 添加超时检测
            const callStartTime = Date.now();
            let uiResult: any;
            
            try {
              log('⏱️ [CommandBar] executeUIText 调用开始，时间戳:', callStartTime);
              log('🔍 [CommandBar] executeUIText 函数检查:', {
                isFunction: typeof executeUIText === 'function',
                isUndefined: typeof executeUIText === 'undefined',
                isNull: executeUIText === null,
              });
              
              const state = useCanvasStore.getState();
              const viewportPresetForCall = (state.viewportLocked ?? viewportSubmitRef?.current ?? state.viewportPreset ?? 'mobile') as ViewportPreset;
              log('📐 [CommandBar] 当前视口(HTML参考路径):', viewportPresetForCall);
              const viewportLabelForCall = viewportPresetForCall === 'desktop' ? '桌面' : '移动';
              toast.info(`正在按【${viewportLabelForCall}】视口生成…`, { duration: 3000, id: 'viewport-send' });
              // CRITICAL: 在调用前输出日志，确认客户端代码正在执行
              console.log('📤 [CommandBar] 准备调用 executeUIText，参数:', {
                promptLength: htmlReferencePrompt.length,
                nodeLabel: targetNodeLabel,
                viewportPreset: viewportPresetForCall,
                hasProjectMeta: !!useCanvasStore.getState().projectMeta,
                hasThemeConfig: !!currentTheme,
                hasAiConfig: !!aiConfig,
              });
              
              if (typeof executeUIText !== 'function') {
                throw new Error(`executeUIText 不是一个函数: ${typeof executeUIText}`);
              }
              
              const existingCodeForHtml =
                selectedNode?.data?.artifacts?.view?.code?.trim() &&
                selectedNode.data.artifacts.view.code.trim().length >= 200 &&
                selectedNode.data.artifacts.view.code.trim() !== '// PLACEHOLDER'
                  ? selectedNode.data.artifacts.view.code
                  : undefined;
              uiResult = await executeUIText({
                prompt: htmlReferencePrompt,
                nodeLabel: targetNodeLabel,
                projectMeta: useCanvasStore.getState().projectMeta,
                themeConfig: currentTheme ?? undefined,
                stylePreset: stylePreset ?? undefined,
                viewportPreset: viewportPresetForCall,
                tier: uiGenerationTier,
                aiConfig: aiConfig,
                existingCode: existingCodeForHtml,
              });
              
              const callDuration = Date.now() - callStartTime;
              log('✅ [CommandBar] executeUIText 调用完成，耗时:', callDuration, 'ms');
              
            } catch (executeError: any) {
              const callDuration = Date.now() - callStartTime;
              logError('❌ [CommandBar] executeUIText 调用失败，耗时:', callDuration, 'ms');
              logError('❌ [CommandBar] executeUIText 错误详情:', executeError);
              
              // 检查是否是网络错误（Failed to fetch）
              let errorMessage = executeError?.message || executeError?.error || String(executeError);
              
              if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
                errorMessage = '网络连接失败。请检查：1. 服务器是否正常运行 (npm run dev) 2. 网络连接是否正常 3. 防火墙设置';
                logError('❌ [CommandBar] ========== 网络错误诊断 ==========');
                logError('❌ [CommandBar] 网络连接失败，可能的原因：');
                logError('❌ [CommandBar] 1. 开发服务器未运行 - 请在终端运行: npm run dev');
                logError('❌ [CommandBar] 2. 服务器端口被占用 - 请检查端口 3000 是否可用');
                logError('❌ [CommandBar] 3. 网络连接问题 - 请检查网络状态');
                logError('❌ [CommandBar] 4. 防火墙阻止连接 - 请检查防火墙设置');
                logError('❌ [CommandBar] ====================================');
                
                toast.error('网络连接失败', {
                  description: '无法连接到服务器。请确保开发服务器正在运行 (npm run dev)',
                  duration: 8000,
                });
                
                // 重置状态
                setIsProcessingVideo(false);
                setIsTimeoutOverride(false);
                clearLoadingTimers();
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                return;
              }
              
              // 重新抛出错误，让外层 catch 处理
              throw executeError;
            }
            
            // 处理返回结果：zsa execute 返回 [data, err]，解构后取 data
            log('📥 [CommandBar] executeUIText 原始返回:', {
              result: uiResult,
              resultType: typeof uiResult,
              isArray: Array.isArray(uiResult),
            });
            
            const [htmlData, htmlErr] = Array.isArray(uiResult) ? uiResult : [uiResult, null];
            if (htmlErr) {
              toast.error('生成失败', {
                description: htmlErr instanceof Error ? htmlErr.message : '未知错误',
                duration: 5000,
              });
              setIsProcessingVideo(false);
              setIsTimeoutOverride(false);
              clearLoadingTimers();
              return;
            }
            
            let uiCode = '';
            if (htmlData && typeof htmlData === 'object' && 'code' in htmlData) {
              uiCode = (htmlData as { code?: string }).code || '';
            }
            
            if (uiCode && uiCode.length > 50) {
              const vUsed = (htmlData as { viewportUsed?: 'mobile' | 'tablet' | 'desktop' })?.viewportUsed;
              const viewportPreset = vUsed === 'mobile' ? 'mobile' : 'desktop';
              // 更新节点的 view.code 与 viewportPreset（导出 PRD 时用于 PC/移动端排版）
              updateNodeData(targetNodeId, {
                artifacts: {
                  view: {
                    code: uiCode,
                    viewportPreset,
                  },
                },
              });
              
              setLoadingStep('✅ UI代码生成完成');
              setProgress(100);
              const vLabel = vUsed === 'desktop' ? '桌面' : vUsed === 'mobile' ? '移动' : '';
              toast.success('UI代码生成成功', {
                description: `已基于HTML文件为"${targetNodeLabel}"生成UI代码${vLabel ? `（服务端已按${vLabel}视口）` : ''}`,
                duration: 3000,
              });
              
              // 清除超时定时器
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              
              // 重置状态
              setPrompt('');
              setAttachment(null);
              setAttachments([]);
              setIsProcessingVideo(false);
              setIsTimeoutOverride(false);
              clearLoadingTimers();
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
              }
              return; // 成功生成UI，直接返回
            } else {
              logWarn('⚠️ [CommandBar] UI代码生成失败或为空');
              toast.warning('UI代码生成失败', {
                description: '生成的代码为空，请重试',
                duration: 3000,
              });
              // 清除超时定时器
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              setIsProcessingVideo(false);
              setIsTimeoutOverride(false);
              clearLoadingTimers();
              return;
            }
          } catch (error: any) {
            logError('❌ [CommandBar] UI代码生成失败:', error);
            
            // 处理网络错误（Failed to fetch）
            let errorMessage = error instanceof Error ? error.message : '未知错误';
            
            // 检测 Failed to fetch 错误
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
              errorMessage = '网络连接失败。请检查：1. 服务器是否正常运行 (npm run dev) 2. 网络连接是否正常 3. 防火墙设置';
              logError('❌ [CommandBar] ========== 网络错误诊断 ==========');
              logError('❌ [CommandBar] 网络连接失败，可能的原因：');
              logError('❌ [CommandBar] 1. 开发服务器未运行 - 请在终端运行: npm run dev');
              logError('❌ [CommandBar] 2. 服务器端口被占用 - 请检查端口 3000 是否可用');
              logError('❌ [CommandBar] 3. 网络连接问题 - 请检查网络状态');
              logError('❌ [CommandBar] 4. 防火墙阻止连接 - 请检查防火墙设置');
              logError('❌ [CommandBar] ====================================');
            }
            
            toast.error('UI代码生成失败', {
              description: errorMessage,
              duration: 8000,
            });
            // 清除超时定时器
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setIsProcessingVideo(false);
            setIsTimeoutOverride(false);
            clearLoadingTimers();
            return;
          }
        } else {
          // project-info 或 uncertain：走 updateNodeArtifacts 流程
          log('📄 [CommandBar] HTML文件识别为项目信息，使用 updateNodeArtifacts 流程');
          // 继续执行后面的 updateNodeArtifacts 逻辑
        }
      }

      // ========== 检查用户意图：是否要求生成UI ==========
      // 如果用户提示词中包含"生成UI"、"生成本页面"、"管理系统"、"PC端"等关键词，且没有图片，则使用 generateUIFromText
      const userPromptLower = prompt.trim().toLowerCase();
      const isRequestingUI = userPromptLower.includes('生成ui') ||
                            userPromptLower.includes('生成 ui') ||
                            userPromptLower.includes('生成本页面') ||
                            userPromptLower.includes('生成页面') ||
                            userPromptLower.includes('生成此页面') ||
                            userPromptLower.includes('生成这个页面') ||
                            userPromptLower.includes('生成界面') ||
                            userPromptLower.includes('为我生成') ||
                            userPromptLower.includes('生成页面ui') ||
                            userPromptLower.includes('生成页面 ui') ||
                            userPromptLower.includes('生成一个') ||
                            userPromptLower.includes('管理系统') ||
                            userPromptLower.includes('pc端') ||
                            userPromptLower.includes('桌面端') ||
                            userPromptLower.includes('后台') ||
                            userPromptLower.includes('后台管理');
      
      // 详细记录检测结果
      log('🔍 [CommandBar] UI生成意图检测:', {
        userPrompt: prompt.trim(),
        userPromptLower,
        isRequestingUI,
        hasImage: isImage,
        hasAttachment: !!attachment,
        willUseGenerateUIFromText: isRequestingUI && !isImage && !attachment,
        matchedKeywords: [
          userPromptLower.includes('生成ui') ? '生成ui' : null,
          userPromptLower.includes('生成 ui') ? '生成 ui' : null,
          userPromptLower.includes('生成本页面') ? '生成本页面' : null,
          userPromptLower.includes('生成页面') ? '生成页面' : null,
          userPromptLower.includes('生成此页面') ? '生成此页面' : null,
          userPromptLower.includes('生成这个页面') ? '生成这个页面' : null,
          userPromptLower.includes('生成界面') ? '生成界面' : null,
          userPromptLower.includes('为我生成') ? '为我生成' : null,
          userPromptLower.includes('生成一个') ? '生成一个' : null,
          userPromptLower.includes('管理系统') ? '管理系统' : null,
          userPromptLower.includes('pc端') ? 'pc端' : null,
          userPromptLower.includes('桌面端') ? '桌面端' : null,
          userPromptLower.includes('后台') ? '后台' : null,
        ].filter(Boolean),
      });
      
      // 在编辑模式下，如果没有附件，默认使用 generateUIFromText 来优化或更新UI
      // 这样可以确保用户输入的任何文本都能得到响应
      if ((isRequestingUI || (!attachment && !isImage)) && !isImage && !attachment) {
        // 用户明确要求生成UI，且没有图片，使用 generateUIFromText
        log('🎨 [CommandBar] 检测到用户要求生成UI，使用 generateUIFromText');
        setLoadingStep('🎨 正在生成UI代码...');
        setProgress(10);
        
        // 注意：不要在这里重置状态，保持按钮禁用状态直到生成完成
        // 状态重置将在生成成功或失败后执行
        // 清除之前的超时定时器，避免在UI生成过程中被重置
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          log('🔄 [CommandBar] 已清除之前的超时定时器，避免在UI生成过程中被重置');
        }
        
        // 为UI生成设置更长的超时时间（600秒，10分钟）
        const uiGenerationTimeout = 600000; // 600秒
        timeoutRef.current = setTimeout(() => {
          logWarn('⚠️ [CommandBar] UI生成超时，自动重置加载状态');
          forceResetLoading();
          toast.error('⏱️ UI生成超时', {
            description: 'UI生成已超过 10 分钟，已自动重置。如果问题持续，请检查网络连接或稍后重试。',
            duration: 8000,
          });
        }, uiGenerationTimeout);
        
        try {
          // 🚨 保存目标节点ID和标签（防止用户在生成过程中切换节点）
          const targetNodeId = selectedNode.id;
          const targetNodeLabel = selectedNode.data.label || selectedNode.id;
          const rawUserPrompt = prompt.trim();
          const pageDescription = getNodePageDescription(selectedNode);
          log('🚀 [CommandBar] 准备调用 executeUIText (文本模式)...');
          log('📋 [CommandBar] executeUIText 调用参数 (文本模式):', {
            nodeLabel: targetNodeLabel,
            promptLength: rawUserPrompt.length,
            pageDescriptionLength: pageDescription?.length ?? 0,
            hasUserPrompt: !!rawUserPrompt,
            targetNodeId,
            hasProjectMeta: !!useCanvasStore.getState().projectMeta,
            hasAIConfig: !!aiConfig,
            timestamp: new Date().toISOString(),
          });
          
          const existingCodeForText =
            selectedNode?.data?.artifacts?.view?.code?.trim() &&
            selectedNode.data.artifacts.view.code.trim().length >= 200 &&
            selectedNode.data.artifacts.view.code.trim() !== '// PLACEHOLDER'
              ? selectedNode.data.artifacts.view.code
              : undefined;
          setLoadingStep(existingCodeForText ? '✏️ 正在现有 UI 基础上修改…' : '🤖 正在调用AI生成UI代码...');
          setProgress(20);
          toast.info(existingCodeForText ? '正在现有页面上按你的要求修改…' : '正在生成完整页面（质量优先），请稍候…', { duration: 4000 });
          
          const callStartTime = Date.now();
          log('⏱️ [CommandBar] executeUIText 调用开始 (文本模式)，时间戳:', callStartTime);
          
          // 验证 executeUIText 函数是否存在
          if (typeof executeUIText !== 'function') {
            throw new Error(`executeUIText 不是一个函数: ${typeof executeUIText}。请检查 useServerAction 是否正确初始化。`);
          }
          
          console.log('✅ [CommandBar] executeUIText 函数验证通过 (文本模式)，开始调用...');

          const state = useCanvasStore.getState();
          const viewportPresetForCall = (state.viewportLocked ?? viewportSubmitRef?.current ?? state.viewportPreset ?? 'mobile') as ViewportPreset;
          log('📐 [CommandBar] 当前视口(文本模式):', viewportPresetForCall);
          const viewportLabel = viewportPresetForCall === 'desktop' ? '桌面' : '移动';
          toast.info(`正在按【${viewportLabel}】视口生成…`, { duration: 3000, id: 'viewport-send' });

          const uiResultRaw = await executeUIText({
            prompt: rawUserPrompt,
            nodeLabel: targetNodeLabel,
            pageDescription: pageDescription || undefined,
            projectMeta: useCanvasStore.getState().projectMeta,
            themeConfig: currentTheme ?? undefined,
            stylePreset: stylePreset ?? undefined,
            viewportPreset: viewportPresetForCall,
            tier: uiGenerationTier,
            aiConfig: aiConfig,
            existingCode: existingCodeForText,
          });
          
          const callDuration = Date.now() - callStartTime;
          log('✅ [CommandBar] executeUIText 调用完成 (文本模式)，耗时:', callDuration, 'ms');
          
          // zsa-react execute() 返回 [data, err] 元组，需解构后使用 data
          const [uiResult, uiErr] = Array.isArray(uiResultRaw) ? uiResultRaw : [uiResultRaw, null];
          if (uiErr) {
            logError('❌ [CommandBar] executeUIText 返回错误', { uiErr });
            toast.error('生成失败', {
              description: uiErr instanceof Error ? uiErr.message : '未知错误',
              duration: 5000,
            });
            forceResetLoading();
            return;
          }
          
          // Handle discriminated union response
          if (!uiResult || typeof uiResult !== 'object' || !('type' in uiResult)) {
            logError('❌ [CommandBar] 返回格式错误：不是有效的响应对象', { uiResult });
            toast.error('返回格式错误', {
              description: '服务器返回了无效的响应格式',
              duration: 5000,
            });
            forceResetLoading();
            return;
          }
          
          const response = uiResult as UIGenerationResponse;
          
          // Handle all response types using discriminated union
          switch (response.type) {
            case 'rate_limit': {
              toast.error('请求过多', {
                description: `请在 ${response.cooldownSeconds} 秒后重试`,
                duration: Math.max(response.cooldownSeconds * 1000, 5000),
              });
              forceResetLoading();
              return;
            }
            
            case 'network_error': {
              toast.error('网络不稳定', {
                description: response.message,
                duration: 5000,
              });
              forceResetLoading();
              return;
            }
            
            case 'validation_error':
            case 'api_error': {
              toast.error('生成失败', {
                description: response.message,
                duration: 5000,
              });
              forceResetLoading();
              return;
            }
            
            case 'timeout': {
              toast.error('请求超时', {
                description: response.message,
                duration: 5000,
              });
              forceResetLoading();
              return;
            }
            
            case 'skeleton':
            case 'success': {
              // Only extract code for success cases
              const uiCode = response.code;
              
              log('✅ [CommandBar] UI代码生成成功 (skeleton/success)', {
                type: response.type,
                codeLength: uiCode.length,
                requestId: response.requestId,
                stages: response.stages,
              });
              
              log('🔍 [CommandBar] 提取的UI代码:', {
                codeLength: uiCode.length,
                codePreview: uiCode.substring(0, 200),
                isValid: uiCode && uiCode.length > 50,
              });
              
              if (uiCode && uiCode.length > 50) {
                const vUsed = 'viewportUsed' in response ? (response as { viewportUsed?: 'mobile' | 'tablet' | 'desktop' }).viewportUsed : undefined;
                const viewportPreset = vUsed === 'mobile' ? 'mobile' : 'desktop';
                log('💾 [CommandBar] 准备更新节点:', {
                  nodeId: targetNodeId,
                  nodeLabel: targetNodeLabel,
                  codeLength: uiCode.length,
                  codePreview: uiCode.substring(0, 100),
                });
            
            updateNodeData(targetNodeId, {
              artifacts: {
                view: {
                  code: uiCode,
                  viewportPreset,
                },
              },
            });
            
            // 验证更新是否成功
            setTimeout(() => {
              const updatedNode = useCanvasStore.getState().nodes.find(n => n.id === targetNodeId);
              if (updatedNode) {
                const savedCode = updatedNode.data.artifacts?.view?.code || '';
                log('✅ [CommandBar] 节点更新验证:', {
                  nodeId: targetNodeId,
                  savedCodeLength: savedCode.length,
                  savedCodePreview: savedCode.substring(0, 100),
                  isMatch: savedCode === uiCode,
                  codeMatches: savedCode.substring(0, 50) === uiCode.substring(0, 50),
                });
                
                if (savedCode.length === 0 || savedCode === '// PLACEHOLDER') {
                  logError('❌ [CommandBar] 节点更新失败！代码未保存:', {
                    nodeId: targetNodeId,
                    savedCode,
                  });
                  toast.error('UI代码更新失败', {
                    description: '代码已生成但未能保存到节点，请刷新页面重试',
                    duration: 5000,
                  });
                } else {
                  log('✅ [CommandBar] UI代码已成功保存到节点');
                }
              } else {
                logError('❌ [CommandBar] 节点更新验证失败：找不到节点:', {
                  nodeId: targetNodeId,
                });
              }
            }, 100);
            
            log('✅ [CommandBar] UI代码生成成功');
            setLoadingStep('✅ UI代码生成完成');
            setProgress(100);
            updateLastAssistantMessage(`已为「${selectedNode.data.label}」生成 UI 代码。`, 'done');
            const vLabel = vUsed === 'desktop' ? '桌面' : vUsed === 'mobile' ? '移动' : '';
            toast.success('UI代码生成成功', {
              description: `已为"${selectedNode.data.label}"生成UI代码${vLabel ? `（服务端已按${vLabel}视口）` : ''}`,
              duration: 3000,
            });
            
            // 生成成功后重置状态
            // 清除UI生成专用的超时定时器
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
              log('✅ [CommandBar] UI生成成功，已清除超时定时器');
            }
            
            setPrompt('');
            setAttachment(null);
            setAttachments([]);
            setIsProcessingVideo(false);
            setIsTimeoutOverride(false);
            clearLoadingTimers();
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
            }
                return; // 成功生成UI，直接返回
              } else {
                logWarn('⚠️ [CommandBar] UI代码生成失败或为空');
                updateLastAssistantMessage('生成的代码为空，请重试。', 'error');
                toast.warning('UI代码生成失败', {
                  description: '生成的代码为空，请重试',
                  duration: 3000,
                });
                // 生成失败后重置状态，允许用户重试
                // 清除UI生成专用的超时定时器
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                  log('❌ [CommandBar] UI生成失败，已清除超时定时器');
                }
                setIsProcessingVideo(false);
                setIsTimeoutOverride(false);
                clearLoadingTimers();
                // 不清空 prompt，让用户可以重试
                return; // 生成失败，但不继续执行 updateNodeArtifacts
              }
            }
            
            default: {
              const r = response as { type?: string };
              logError('❌ [CommandBar] 未知的响应类型', { type: r.type });
              toast.error('未知返回类型', {
                description: `服务器返回了未知的响应类型: ${r.type ?? 'unknown'}`,
                duration: 5000,
              });
              forceResetLoading();
              return;
            }
          }
        } catch (error) {
          logError('❌ [CommandBar] UI代码生成失败:', error);
          const msg = error instanceof Error ? error.message : String(error);
          const isNetworkError = msg.includes('Failed to fetch') || msg.includes('fetch');
          const displayMsg = isNetworkError
            ? '网络连接失败。请确保服务器正在运行 (npm run dev) 并检查网络与防火墙'
            : msg || '未知错误';
          updateLastAssistantMessage(displayMsg, 'error');
          toast.error('UI代码生成失败', {
            description: displayMsg,
            duration: isNetworkError ? 8000 : 5000,
          });
          // 生成失败后重置状态，允许用户重试
          // 清除UI生成专用的超时定时器
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            log('❌ [CommandBar] UI生成异常，已清除超时定时器');
          }
          setIsProcessingVideo(false);
          setIsTimeoutOverride(false);
          clearLoadingTimers();
          // 不清空 prompt，让用户可以重试
          return; // 生成失败，但不继续执行 updateNodeArtifacts
        }
      }
      
      // ========== 传统流程：使用 updateNodeArtifacts ==========
      // 注意：如果走到这里，说明：
      // 1. 用户没有明确要求生成UI，或者
      // 2. 有附件（文本文件或PDF），需要更新需求文档等其他内容
      log('⚠️ [CommandBar] 使用传统流程（updateNodeArtifacts）:', {
        hasAttachment: !!attachment,
        attachmentType: attachment?.type,
        attachmentMimeType: attachment?.mimeType,
        isRequestingUI,
        userPrompt: prompt.trim(),
        note: '如果没有附件且用户要求生成UI，应该使用 generateUIFromText',
      });
      
      // 编辑模式：更新节点
      const attachmentsForAPI: Array<{ type: 'image' | 'text'; content: string; name?: string; mimeType?: string }> = [];
      
      // 处理所有附件
      for (const att of attachments) {
        if (att.type === 'media' && (att.preview || att.mimeType === 'application/pdf')) {
          // 图片或 PDF（PDF 也作为 image 类型传递，因为 updateNodeArtifacts 只支持 image 和 text）
          attachmentsForAPI.push({
            type: 'image' as const,
            content: att.content,
            name: att.name,
            mimeType: att.mimeType,
          });
        } else if (att.type === 'text') {
          // 文本文件（包括 Word 文档）
          attachmentsForAPI.push({
            type: 'text' as const,
            content: att.content,
            name: att.name,
            mimeType: att.mimeType,
          });
        }
        // 注意：视频在编辑模式下暂不支持，因为 updateNodeArtifacts 只支持 image 和 text
      }

      // 确保 currentArtifacts 结构完整，提供默认值以避免 schema 验证错误
      // 处理 requirements 可能是字符串或数组的情况
      const rawRequirements: unknown = selectedNode.data.artifacts?.spec?.requirements;
      let requirements: string[] = [];
      if (Array.isArray(rawRequirements)) {
        requirements = rawRequirements.filter((item): item is string => typeof item === 'string');
      } else if (typeof rawRequirements === 'string') {
        const trimmed = rawRequirements.trim();
        if (trimmed) {
          requirements = trimmed.split('\n').filter((line: string) => line.trim() !== '');
        }
      }

      const currentArtifacts = {
        view: {
          code: selectedNode.data.artifacts?.view?.code || '// PLACEHOLDER',
          previewUrl: selectedNode.data.artifacts?.view?.previewUrl,
        },
        spec: {
          title: selectedNode.data.artifacts?.spec?.title || selectedNode.data.label || '未命名节点',
          requirements: requirements,
        },
        impl: {
          apiEndpoints: selectedNode.data.artifacts?.impl?.apiEndpoints || [],
          dbSchema: selectedNode.data.artifacts?.impl?.dbSchema || '-- PLACEHOLDER',
        },
        test: {
          cases: selectedNode.data.artifacts?.test?.cases || [],
        },
      };

      log('📋 [CommandBar] Prepared currentArtifacts:', {
        hasView: !!currentArtifacts.view.code,
        hasSpec: !!currentArtifacts.spec.title,
        specRequirementsType: Array.isArray(currentArtifacts.spec.requirements) ? 'array' : typeof currentArtifacts.spec.requirements,
        specRequirementsLength: Array.isArray(currentArtifacts.spec.requirements) ? currentArtifacts.spec.requirements.length : 'N/A',
        hasPreviewUrl: !!currentArtifacts.view?.previewUrl,
        previewUrlType: currentArtifacts.view?.previewUrl ? typeof currentArtifacts.view.previewUrl : 'undefined',
        previewUrlPrefix: currentArtifacts.view?.previewUrl?.substring(0, 30) || 'N/A',
      });

      log('📤 [CommandBar] Calling executeUpdate with:', {
        nodeId: selectedNode.id,
        nodeTitle: selectedNode.data.label,
        userPrompt: prompt.trim() || '',
          attachmentsCount: attachmentsForAPI.length,
        attachments: (Array.isArray(attachmentsForAPI) ? attachmentsForAPI : []).map(att => ({ type: att.type, name: att.name, hasContent: !!att.content })),
      });

      try {
        await executeUpdate({
          nodeId: selectedNode.id,
          nodeTitle: selectedNode.data.label,
          currentArtifacts,
          userPrompt: prompt.trim() || '',
          attachments: attachmentsForAPI,
        });
        log('✅ [CommandBar] executeUpdate completed');
      } catch (error) {
        logError('❌ [CommandBar] executeUpdate error:', error);
        throw error;
      }
    } else {
      // 创建模式：生成新图
      // 处理多个附件：合并文本/PDF 文件，选择第一个图片/视频
      let mediaBase64: string | undefined;
      let mediaType: 'image' | 'video' | undefined;
      let attachmentContent: string | undefined;
      let attachmentType: 'media' | 'text' | undefined;
      let mimeType: string | undefined;
      
      // 收集所有文本和 PDF 文件内容
      const textAttachments: string[] = [];
      const attachmentNames: string[] = [];
      
      // 查找第一个图片或视频
      let firstImageOrVideo: FileAttachment | null = null;
      
      for (const att of attachments) {
        const isPDF = att.mimeType === 'application/pdf';
        const isVideo = att.mimeType?.startsWith('video/');
        const isImage = att.mimeType?.startsWith('image/') || (att.type === 'media' && att.preview && !isPDF && !isVideo);
        const isWord = att.mimeType?.includes('word') || att.mimeType?.includes('msword');
        
        if (att.type === 'text' || isPDF || isWord) {
          // 文本文件、PDF 或 Word 文档
          textAttachments.push(`\n\n【文件：${att.name}】\n${att.content.substring(0, 50000)}`); // 限制每个文件最多 50000 字符
          attachmentNames.push(att.name);
          if (!attachmentType) {
            attachmentType = att.type === 'text' ? 'text' : 'media';
            mimeType = att.mimeType;
          }
        } else if ((isImage || isVideo) && !firstImageOrVideo) {
          // 第一个图片或视频
          firstImageOrVideo = att;
        }
      }
      
      // 合并所有文本/PDF/Word 内容
      if (textAttachments.length > 0) {
        attachmentContent = `用户上传了 ${textAttachments.length} 个文档文件：${attachmentNames.join('、')}${textAttachments.join('')}`;
        if (!attachmentType) {
        attachmentType = 'text';
        }
      }
      
      // 处理第一个图片或视频
      if (firstImageOrVideo) {
        const isPDF = firstImageOrVideo.mimeType === 'application/pdf';
        const isVideo = firstImageOrVideo.mimeType?.startsWith('video/');
        const isImage = firstImageOrVideo.mimeType?.startsWith('image/') || 
                       (firstImageOrVideo.type === 'media' && firstImageOrVideo.preview && !isPDF && !isVideo);
        
        if (isVideo) {
          mediaBase64 = firstImageOrVideo.content;
          mediaType = 'video';
          mimeType = firstImageOrVideo.mimeType;
        } else if (isImage) {
          mediaBase64 = firstImageOrVideo.content;
          mediaType = 'image';
          mimeType = firstImageOrVideo.mimeType;
        }
      }
      
      // 如果有多个图片/视频，在提示词中添加说明
      const imageVideoCount = attachments.filter(att => {
        const isPDF = att.mimeType === 'application/pdf';
        const isVideo = att.mimeType?.startsWith('video/');
        const isImage = att.mimeType?.startsWith('image/') || (att.type === 'media' && att.preview && !isPDF && !isVideo);
        return isImage || isVideo;
      }).length;
      
      if (imageVideoCount > 1 && attachmentContent) {
        attachmentContent += `\n\n注意：用户还上传了 ${imageVideoCount} 个图片/视频文件，当前仅处理第一个。`;
      }

      log('🆕 [CommandBar] Create mode: Generating new graph', {
        promptLength: prompt.trim().length,
        hasMediaBase64: !!mediaBase64,
        mediaType,
        hasAttachmentContent: !!attachmentContent,
        attachmentType,
        mimeType: mimeType,
        attachmentsCount: attachments.length,
        currentNodesCount: nodes.length,
        selectedNodeId,
        isEditMode,
      });

      log('📤 [CommandBar] Calling executeCreate with:', {
        prompt: prompt.trim() || '',
        hasMediaBase64: !!mediaBase64,
        mediaType,
        hasAttachmentContent: !!attachmentContent,
        attachmentType,
        mimeType: mimeType,
        attachmentsCount: attachments.length,
        currentNodesCount: nodes.length,
      });

      lastCreateInputRef.current = {
        prompt: prompt.trim() || '',
        attachmentContent,
        attachmentType,
        mimeType: mimeType,
        mediaBase64,
        mediaType,
      };
      try {
        setAiCreatePending(true);
        await executeCreate({
          prompt: prompt.trim() || '',
          mediaBase64,
          mediaType,
          attachmentContent,
          attachmentType,
          mimeType: mimeType,
          aiConfig: aiConfig, // 传递 AI 模型配置
        });
        log('✅ [CommandBar] executeCreate completed');
      } catch (error) {
        logError('❌ [CommandBar] executeCreate error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        const isNetworkError = msg.includes('Failed to fetch') || msg.includes('fetch');
        const description = isNetworkError
          ? '请检查：1. 服务器是否正常运行 (npm run dev) 2. 网络连接 3. 防火墙设置'
          : msg;
        toast.error('生成图表失败', { description, duration: 8000 });
        setIsProcessingVideo(false);
        setIsTimeoutOverride(false);
        clearLoadingTimers();
        setProgress(0);
        setLoadingStep('');
      } finally {
        setAiCreatePending(false);
      }
    }
  };

  // 按钮启用逻辑：prompt 不为空 OR attachments 不为空
  const hasContent = Boolean(prompt.trim() || attachments.length > 0);
  // 如果超时覆盖标志为 true，强制重置 loading 状态
  const isLoading = isTimeoutOverride 
    ? false 
    : (isCreating || isUpdating || isProcessingVideo || isGeneratingUI || isGeneratingPRD || isGeneratingUIText);
  
  // 调试信息
  useEffect(() => {
    log('🔍 [CommandBar] State check:', {
      prompt: prompt,
      promptTrimmed: prompt.trim(),
      hasPrompt: !!prompt.trim(),
      hasAttachment: !!attachment,
      hasContent,
      isLoading,
      isCreating,
      isUpdating,
      isProcessingVideo,
      isGeneratingUIText,
      buttonDisabled: !hasContent || isLoading,
    });
  }, [prompt, attachments, attachment, hasContent, isLoading, isCreating, isUpdating, isProcessingVideo, isGeneratingUIText]);

  // 处理取消选择节点
  const handleClearSelection = () => {
    selectNode(null);
  };


  // 按钮文本（根据模式）
  const isPDF = attachment?.mimeType === 'application/pdf';
  const isVideo = attachment?.mimeType?.startsWith('video/');
  const isImage = attachment?.mimeType?.startsWith('image/') || (attachment?.type === 'media' && attachment.preview && !isPDF && !isVideo);
  
  const buttonText = isUIGenerationContext
    ? (attachment?.type === 'text'
      ? '📄 从文档更新'
      : attachment?.type === 'media' && isPDF
      ? '📄 用 PDF 更新'
      : attachment?.type === 'media' && isVideo
      ? '🎥 用视频更新'
      : attachment?.type === 'media' && isImage
      ? '👀 用图片更新'
      : '✨ 优化')
    : (attachment?.type === 'text'
      ? '📄 从文档构建'
      : attachment?.type === 'media' && isPDF
      ? '📄 分析 PDF'
      : attachment?.type === 'media' && isVideo
      ? '🎥 分析视频'
      : attachment?.type === 'media' && isImage
      ? '👀 扫描构建'
      : '生成');

  const waitingClarification = Boolean(pendingClarificationContext && !isEditMode);

  return (
    <div
      data-command-bar
      className={
        embedInPanel
          ? 'w-full pointer-events-auto flex flex-col border-t border-zinc-800'
          : 'w-full pointer-events-auto flex flex-col max-h-[50vh]'
      }
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* 等待澄清时：明确引导在面板内选择或输入 */}
      {waitingClarification && (
        <div
          className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/15 border-b border-cyan-500/30 text-cyan-200 text-xs"
          role="status"
          aria-live="polite"
        >
          <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
          <span>AI 在等你补充说明，请在上方选择或输入后发送</span>
        </div>
      )}

      {/* 附件预览（如果有） */}
      {attachments.length > 0 && (
        <div className={embedInPanel ? 'mb-1.5 flex flex-wrap items-center gap-2 px-2' : 'mb-2 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto'}>
          {attachments.map((att, index) => {
            // 判断文件类型并返回对应的图标颜色
            const getFileIcon = () => {
              const fileName = att.name?.toLowerCase() || '';
              const mimeType = att.mimeType?.toLowerCase() || '';
              
              // PPT文件 - 橙色
              if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || 
                  mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
                return <FileText className="w-4 h-4 text-orange-400" />;
              }
              
              // PDF文件 - 红色
              if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
                return <FileText className="w-4 h-4 text-red-400" />;
              }
              
              // Word文件 - 蓝色
              if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
                  mimeType.includes('word') || mimeType.includes('msword')) {
                return <FileText className="w-4 h-4 text-blue-400" />;
              }
              
              // 图片文件 - 绿色
              if (att.type === 'media' && att.preview && mimeType.startsWith('image/')) {
                return <ImageIcon className="w-4 h-4 text-green-400" />;
              }
              
              // 视频文件 - 紫色
              if (att.type === 'media' && !att.preview && mimeType.startsWith('video/')) {
                return <Video className="w-4 h-4 text-purple-400" />;
              }
              
              // 文本文件（txt, md等）- 白色
              if (att.type === 'text' && (
                fileName.endsWith('.txt') || fileName.endsWith('.md') || 
                fileName.endsWith('.json') || fileName.endsWith('.csv') ||
                fileName.endsWith('.js') || fileName.endsWith('.ts') ||
                fileName.endsWith('.jsx') || fileName.endsWith('.tsx') ||
                fileName.endsWith('.css') || fileName.endsWith('.html') ||
                fileName.endsWith('.xml') || fileName.endsWith('.yaml') ||
                fileName.endsWith('.yml') || mimeType.startsWith('text/')
              )) {
                return <FileText className="w-4 h-4 text-white" />;
              }
              
              // 默认 - 灰色
              return <FileText className="w-4 h-4 text-zinc-400" />;
            };
            
            return (
            <div key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300">
                {getFileIcon()}
                <span className="max-w-[200px] truncate" title={att.name}>{att.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                    handleRemoveAttachment(index);
                }}
                className="ml-2 p-1 hover:bg-zinc-700 rounded transition-colors"
                  aria-label={`移除附件 ${att.name}`}
              >
                <X className="w-3 h-3 text-zinc-400 hover:text-zinc-200" />
              </button>
            </div>
            );
          })}
          {attachments.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemoveAttachment();
              }}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              aria-label="清除所有附件"
            >
              清除全部
            </button>
          )}
        </div>
      )}

      {/* 编辑模式提示：当前编辑的节点（嵌入面板时不显示） */}
      {!embedInPanel && isEditMode && selectedNode && (
        <div className="mb-2 flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400">
            <span>编辑中：{selectedNode.data.label}</span>
          </div>
        </div>
      )}

      {/* 主输入栏 - 极简设计 */}
      <div className="w-full">
        {/* 进度条 - 统一视觉语言 */}
        {isLoading && (
          <div className={embedInPanel ? 'mb-2 w-full px-2' : 'mb-3 w-full max-w-2xl mx-auto'}>
            <div className="h-1 bg-zinc-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {loadingStep && (
              <div className="mt-2 text-center text-xs text-zinc-400">
                {loadingStep}
              </div>
            )}
          </div>
        )}

        {/* 主表单容器 - 统一视觉语言 */}
        <div className={embedInPanel ? 'w-full px-2 pb-2' : 'w-full max-w-2xl mx-auto'}>
          <form
            onSubmit={handleSubmit}
            className={`relative flex items-center gap-2 bg-zinc-900/95 backdrop-blur-xl border rounded-xl transition-all ${
              embedInPanel ? 'px-3 py-2.5 border-zinc-800' : 'px-6 py-4 shadow-2xl'
            } ${
              isFocused 
                ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : isDragging
                ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-cyan-500/10'
                : 'border-zinc-800'
            }`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // 只有当离开整个表单区域时才取消拖拽状态
              if (e.currentTarget === e.target) {
                setIsDragging(false);
              }
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                const fileArray = Array.from(files);
                
                // 验证所有文件类型
                for (const file of fileArray) {
                  const isImage = file.type.startsWith('image/');
                  const isVideo = file.type.startsWith('video/');
                  const isPDF = file.type === 'application/pdf';
                  const isWord = file.type === 'application/msword' || 
                                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                 /\.(doc|docx)$/i.test(file.name);
                  const isPPT = file.type === 'application/vnd.ms-powerpoint' ||
                                 file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
                                 /\.(ppt|pptx)$/i.test(file.name);
                  const isText = file.type.startsWith('text/') || 
                                 /\.(md|txt|json|csv|js|ts|tsx|jsx|css|html|xml|yaml|yml)$/i.test(file.name);
                  
                  if (!isImage && !isVideo && !isPDF && !isWord && !isPPT && !isText) {
                    toast.error('不支持的文件类型', {
                      description: `文件 "${file.name}" 不支持。请选择支持的文件类型：图片、视频、PDF、Word、PPT、文档或代码文件`,
                      duration: 5000,
                    });
                    return;
                  }
                }

                // 处理所有文件
                setIsProcessingVideo(true);
                const processedAttachments: FileAttachment[] = [];
                const errors: string[] = [];

                for (let i = 0; i < fileArray.length; i++) {
                  const file = fileArray[i];
                  try {
                    const attachment = await processSingleFile(file);
                    if (attachment) {
                      processedAttachments.push(attachment);
                    }
                  } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : `处理文件 "${file.name}" 失败`;
                    errors.push(errorMsg);
                    logError(`处理文件失败: ${file.name}`, error);
                  }
                }

                setIsProcessingVideo(false);

                // 显示处理结果
                if (processedAttachments.length > 0) {
                  setAttachments(prev => [...prev, ...processedAttachments]);
                  if (processedAttachments.length > 0) {
                    setAttachment(processedAttachments[0]);
                  }
                  
                  if (processedAttachments.length === fileArray.length) {
                    toast.success(`成功上传 ${processedAttachments.length} 个文件`, {
                      description: (Array.isArray(processedAttachments) ? processedAttachments : []).map(a => a.name).join('、'),
                      duration: 4000,
                    });
                  } else {
                    toast.warning(`部分文件上传成功`, {
                      description: `成功: ${processedAttachments.length}/${fileArray.length}，失败: ${errors.length}`,
                      duration: 5000,
                    });
                  }
                }

                if (errors.length > 0) {
                  errors.forEach(error => {
                    toast.error(error, { duration: 3000 });
                  });
                }
              }
            }}
          >
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.json,.csv,.tsx,.ts,.js,.jsx,.css,.html,.xml,.yaml,.yml"
              onChange={handleFileSelect}
              className="hidden"
              multiple
              aria-label="文件上传输入"
            />

            {/* 附件按钮 - 统一视觉语言 */}
            <button
              type="button"
              onClick={handleAttachClick}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={isLoading}
              className={`text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 self-center ${
                embedInPanel ? 'p-2' : 'p-2.5'
              }`}
              style={{ pointerEvents: 'auto' }}
              title="上传文件"
              aria-label="上传文件"
            >
              <Paperclip className={embedInPanel ? 'w-4 h-4' : 'w-5 h-5'} />
            </button>

            {/* 输入框 */}
            <textarea
              data-testid="command-input"
              ref={textareaRef}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                requestAnimationFrame(() => {
                  adjustTextareaHeight();
                });
              }}
              onPaste={(e) => {
                handlePaste(e);
                requestAnimationFrame(() => {
                  adjustTextareaHeight();
                });
              }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                e.stopPropagation();
                setIsFocused(true);
              }}
              onBlur={(e) => {
                setIsFocused(false);
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder={
                waitingClarification
                  ? (embedInPanel ? '请在上方选择或输入后发送' : '请在右侧对话窗口选择或输入后发送')
                  : isUIGenerationContext && selectedNode
                  ? `编辑 ${selectedNode.data.label}...`
                  : embedInPanel
                  ? '描述产品想法，或拖拽文件到这里'
                  : '描述你的想法，或拖拽文件到这里'
              }
              className={`flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none resize-none overflow-y-auto leading-relaxed ${
                embedInPanel ? 'text-sm py-2 min-h-[44px] max-h-[120px]' : 'text-base py-2.5 min-h-[60px] max-h-[200px]'
              }`}
              style={{ pointerEvents: 'auto' }}
              disabled={isLoading || waitingClarification}
              rows={1}
            />

            {/* 发送按钮 - 统一视觉语言 */}
            <button
              type="submit"
              data-testid="command-send"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={!hasContent || isLoading || waitingClarification}
              title={
                waitingClarification
                  ? (embedInPanel ? "请先在上方选择或输入后发送" : "请先在右侧对话窗口选择或输入后发送")
                  : !hasContent
                  ? "请输入内容或上传文件"
                  : isLoading
                  ? "正在处理中..."
                  : isUIGenerationContext
                  ? "更新当前节点"
                  : "生成新的节点和连接"
              }
              className={`
                rounded-lg transition-all flex items-center justify-center flex-shrink-0 self-center
                ${embedInPanel ? 'p-2' : 'p-3'}
                ${
                  hasContent && !isLoading && !waitingClarification
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-white cursor-pointer shadow-lg hover:shadow-xl active:scale-95'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }
              `}
              style={{ pointerEvents: 'auto' }}
            >
              {isLoading ? (
                <Loader2 className={embedInPanel ? 'w-4 h-4 animate-spin' : 'w-5 h-5 animate-spin'} />
              ) : (
                <Send className={embedInPanel ? 'w-4 h-4' : 'w-5 h-5'} />
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
