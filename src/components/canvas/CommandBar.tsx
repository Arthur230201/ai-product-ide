'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, X, Send, Loader2, FileText, Image as ImageIcon, Video, Target } from 'lucide-react';
import { useServerAction } from 'zsa-react';
import { generateGraph } from '@/app/actions/generate-graph';
import { updateNodeArtifacts, generateUIFromImage, generateUIFromText, generateAnalysisFromCode } from '@/app/actions/node-operations';
import { useCanvasStore } from '@/store/canvas-store';
import { toast } from 'sonner';
import { log, logError, logWarn } from '@/lib/logger';

type MediaType = 'image' | 'video' | null;
type AttachmentType = 'media' | 'text' | null;

interface FileAttachment {
  name: string;
  type: AttachmentType;
  content: string;
  preview?: string;
  mimeType?: string; // For PDF and other binary files
}

export function CommandBar() {
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
  const { nodes, selectedNodeId, selectNode, addNodes, addEdges, updateNodeData, layoutNodes, currentTheme, aiConfig, openBlueprint, updateProjectMeta } = useCanvasStore();
  
  // 获取当前选中的节点
  const selectedNode = selectedNodeId 
    ? nodes.find(node => node.id === selectedNodeId) 
    : null;
  
  // 判断是否为编辑模式
  const isEditMode = selectedNode !== null;

  // 输入框聚焦状态 - 必须在所有其他 hooks 之前定义
  const [isFocused, setIsFocused] = useState(false);

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

      // 检查是否为澄清请求
      // generateGraph 返回格式：{ data: { type: 'clarification_needed', data: {...} } }
      const responseData = resultData?.data;
      log('🔍 [CommandBar] 检查返回数据类型:', {
        hasData: !!responseData,
        dataType: responseData?.type,
        dataKeys: responseData ? Object.keys(responseData) : [],
        fullData: JSON.stringify(responseData).substring(0, 1000),
        isClarification: responseData?.type === 'clarification_needed',
        resultDataKeys: resultData ? Object.keys(resultData) : [],
        resultDataFull: JSON.stringify(resultData).substring(0, 1000),
      });
      
      // 检查是否为澄清请求（优先检查，避免继续处理图结构）
      // 检查多种可能的数据结构
      let isClarification = false;
      let clarificationData: any = null;
      
      // 方式1: 直接检查 responseData.type
      if (responseData && responseData.type === 'clarification_needed') {
        isClarification = true;
        clarificationData = responseData.data;
      }
      // 方式2: 检查 resultData 是否直接包含 clarification_needed
      else if (resultData && (resultData as any).type === 'clarification_needed') {
        isClarification = true;
        clarificationData = (resultData as any).data;
      }
      // 方式3: 检查 resultData.data 是否是一个对象且包含 type 字段
      else if (resultData?.data && typeof resultData.data === 'object' && 'type' in resultData.data && resultData.data.type === 'clarification_needed') {
        isClarification = true;
        clarificationData = resultData.data.data;
      }
      
      if (isClarification) {
        log('💬 [CommandBar] 收到澄清请求，跳转到项目画像页面', {
          clarificationData,
          hasMessage: !!clarificationData?.message,
          hasQuestion: !!clarificationData?.question,
          hasOptions: !!clarificationData?.options,
        });
        setIsProcessingVideo(false);
        clearLoadingTimers();
        
        if (!clarificationData) {
          logError('❌ [CommandBar] 澄清请求数据不完整:', {
            responseData,
            resultData,
            dataKeys: responseData ? Object.keys(responseData) : [],
          });
          // 即使数据不完整，也打开项目画像页面，让用户能够补充信息
          log('⚠️ [CommandBar] 澄清数据不完整，但仍打开项目画像页面以便用户补充信息');
          openBlueprint('profile', {
            description: prompt.trim(),
          });
          setIsProcessingVideo(false);
          setIsTimeoutOverride(false);
          clearLoadingTimers();
          setProgress(0);
          setLoadingStep('');
          toast.warning('需要更多信息', {
            description: '请在项目画像页面中补充详细信息',
            duration: 5000,
          });
          return;
        }
        
        log('📋 [CommandBar] 澄清请求详情:', {
          message: clarificationData.message,
          question: clarificationData.question,
          optionsCount: clarificationData.options?.length || 0,
        });
        
        // 跳转到项目蓝图的项目画像页面，而不是显示对话框
        // 构建初始数据，将澄清信息填充到项目画像中
        const initialData: Partial<import('@/types/fractal').ProjectMeta> = {
          description: prompt.trim(), // 保留原始输入作为项目简介
        };
        
        // 如果检测到领域信息，可以填充到行业字段
        if (clarificationData.message) {
          // 尝试从消息中提取领域信息
          const domainMatch = clarificationData.message.match(/已检测到领域[：:]([^。，,]+)/);
          if (domainMatch) {
            initialData.industry = domainMatch[1].trim();
          }
        }

        // 打开项目蓝图并跳转到项目画像标签（但不阻塞流程）
        // 注意：现在即使输入不够明确，也会继续生成图结构
        // 所以这里只是提示用户可以在项目画像中补充信息，但不阻止继续
        openBlueprint('profile', initialData);
        
        log('✅ [CommandBar] 已打开项目画像页面，提示用户补充信息（但继续生成基础图结构）');
        toast.info('提示：输入信息可以更明确', {
          description: '系统将生成基础结构，您可以在项目画像页面补充详细信息后优化',
          duration: 5000,
        });
        
        // 不再提前返回，继续处理图结构生成
        // return; // 注释掉，让流程继续
      }

      // 如果不是澄清请求，继续处理图结构
      log('📊 [CommandBar] 不是澄清请求，继续处理图结构数据');

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
        
        // 如果 data 中只有一个键，且这个键的值是对象，检查是否是澄清请求
        if (dataKeys.length === 1 && typeof data[dataKeys[0]] === 'object' && data[dataKeys[0]] !== null) {
          const firstKeyValue = data[dataKeys[0]];
          log('🔍 [CommandBar] 检测到 data 只有一个键，检查其内容:', {
            key: dataKeys[0],
            valueType: typeof firstKeyValue,
            valueKeys: Object.keys(firstKeyValue),
            hasType: 'type' in firstKeyValue,
            typeValue: firstKeyValue.type,
            hasNodes: 'nodes' in firstKeyValue,
            hasEdges: 'edges' in firstKeyValue,
          });
          
          // 检查是否是澄清请求（可能在嵌套结构中）
          if (firstKeyValue.type === 'clarification_needed') {
            log('💬 [CommandBar] 在嵌套结构中检测到澄清请求');
            setIsProcessingVideo(false);
            clearLoadingTimers();
            
            const clarificationData = firstKeyValue.data;
            if (!clarificationData) {
              logError('❌ [CommandBar] 澄清请求数据不完整:', {
                data: firstKeyValue,
                dataKeys: Object.keys(firstKeyValue),
              });
              toast.error('澄清请求数据格式错误', {
                description: '请重试',
                duration: 3000,
              });
              return;
            }
            
            const initialData: Partial<import('@/types/fractal').ProjectMeta> = {
              description: prompt.trim(),
            };
            
            if (clarificationData.message) {
              const domainMatch = clarificationData.message.match(/已检测到领域[：:]([^。，,]+)/);
              if (domainMatch) {
                initialData.industry = domainMatch[1].trim();
              }
            }

            openBlueprint('profile', initialData);
            setIsProcessingVideo(false);
            setIsTimeoutOverride(false);
            clearLoadingTimers();
            setProgress(0);
            setLoadingStep('');
            
            log('✅ [CommandBar] 已打开项目蓝图的项目画像页面（从嵌套结构）');
            toast.info('需要更多信息', {
              description: '请在项目画像页面中补充详细信息',
              duration: 5000,
            });
            return;
          }
          
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

      // 记录添加节点前的状态
      const nodesBeforeAdd = useCanvasStore.getState().nodes.length;
      log('📊 [CommandBar] 添加节点前的状态:', {
        nodesCount: nodesBeforeAdd,
        willAddNodes: nodes && Array.isArray(nodes) && nodes.length > 0,
        willAddEdges: edges && Array.isArray(edges),
      });

      // 确保 nodes 是有效数组
      if (nodes && Array.isArray(nodes) && nodes.length > 0) {
        try {
          addNodes(nodes);
          // 验证节点是否成功添加
          const nodesAfterAdd = useCanvasStore.getState().nodes.length;
          log('✅ [CommandBar] 成功添加节点:', { 
            count: nodes.length,
            nodesBefore: nodesBeforeAdd,
            nodesAfter: nodesAfterAdd,
            expectedTotal: nodesBeforeAdd + nodes.length,
            actualTotal: nodesAfterAdd,
            success: nodesAfterAdd === nodesBeforeAdd + nodes.length,
          });
          
          // 如果节点没有成功添加，记录警告
          if (nodesAfterAdd !== nodesBeforeAdd + nodes.length) {
            logError('❌ [CommandBar] 节点添加失败！节点数量不匹配:', {
              expected: nodesBeforeAdd + nodes.length,
              actual: nodesAfterAdd,
              nodesToAdd: nodes.map(n => ({ id: n.id, label: n.data?.label })),
            });
          }
        } catch (error) {
          logError('❌ [CommandBar] 添加节点时发生错误:', error);
        }
      } else {
        logWarn('⚠️ [CommandBar] generateGraph 返回的 nodes 无效:', {
          nodes,
          isArray: Array.isArray(nodes),
          length: nodes?.length,
        });
      }

      // 确保 edges 是有效数组
      if (edges && Array.isArray(edges)) {
        try {
          addEdges(edges);
          log('✅ [CommandBar] 成功添加边:', { count: edges.length });
        } catch (error) {
          logError('❌ [CommandBar] 添加边时发生错误:', error);
        }
      } else {
        logWarn('⚠️ [CommandBar] generateGraph 返回的 edges 无效:', {
          edges,
          isArray: Array.isArray(edges),
        });
      }
      
      // 如果 nodes 和 edges 都无效，可能是澄清请求没有被正确识别
      // 或者输入确实不够明确，打开项目画像页面让用户补充信息
      if ((!nodes || !Array.isArray(nodes) || nodes.length === 0) && 
          (!edges || !Array.isArray(edges) || edges.length === 0)) {
        log('⚠️ [CommandBar] 无法生成有效的图结构，可能是输入不够明确，打开项目画像页面');
        openBlueprint('profile', {
          description: prompt.trim(),
        });
        setIsProcessingVideo(false);
        setIsTimeoutOverride(false);
        clearLoadingTimers();
        setProgress(0);
        setLoadingStep('');
        toast.warning('输入信息不够明确', {
          description: '请在项目画像页面中补充详细信息后重试',
          duration: 5000,
        });
        return;
      }

        // 添加节点后自动应用布局，避免节点重叠
      if (nodes && Array.isArray(nodes) && nodes.length > 0) {
        setTimeout(() => {
          layoutNodes();
          // 再次验证节点是否还在
          const nodesAfterLayout = useCanvasStore.getState().nodes.length;
          log('📊 [CommandBar] 布局后的节点数量:', {
            nodesCount: nodesAfterLayout,
            expected: nodesBeforeAdd + nodes.length,
          });
        }, 100); // 延迟执行，确保节点已添加到状态中
      }
      
      // 重置状态（在节点成功添加后）
      // 注意：只有在节点成功添加后才重置状态
      const finalNodesCount = useCanvasStore.getState().nodes.length;
      if (finalNodesCount > nodesBeforeAdd) {
        log('🔄 [CommandBar] 节点已成功添加，重置状态');
        
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
      
      let errorMessage = error instanceof Error 
        ? error.message 
        : '生成图表失败，请稍后重试';
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        if (error.message.includes('API_KEY') || error.message.includes('api key')) {
          errorMessage = '❌ API 密钥未配置\n\n请检查环境变量 OPENAI_API_KEY 是否正确设置';
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          errorMessage = '⏱️ 请求超时\n\n请检查网络连接，或稍后重试';
        } else if (error.message.includes('quota') || error.message.includes('QUOTA') || error.message.includes('429')) {
          errorMessage = '📊 API 配额已用完\n\n请检查 OpenAI API 配额，或稍后重试';
        } else if (error.message.includes('invalid') || error.message.includes('INVALID') || error.message.includes('400')) {
          errorMessage = `⚠️ 请求参数无效\n\n${error.message}\n\n请检查上传的文件格式是否正确`;
        } else if (error.message.includes('500') || error.message.includes('Internal')) {
          errorMessage = '🔧 服务器内部错误\n\n请稍后重试，或联系技术支持';
        } else if (error.message.includes('Body exceeded') || error.message.includes('size limit')) {
          errorMessage = '📦 文件大小超过限制\n\n请尝试上传较小的文件（建议 < 20MB）';
        } else {
          errorMessage = `❌ 生成失败\n\n${error.message}\n\n如果问题持续，请检查：\n1. API 密钥是否正确配置\n2. 网络连接是否正常\n3. 文件大小是否超过限制\n4. 文件格式是否支持`;
        }
      }
      
      alert(errorMessage);
      setIsProcessingVideo(false);
      setIsTimeoutOverride(false); // 重置超时覆盖标志
      clearLoadingTimers();
    },
  });

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
      const errorMessage = error instanceof Error ? error.message : String(error);
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
  const { execute: executeUIText, isPending: isGeneratingUIText } = useServerAction(generateUIFromText);

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
      
      // 使用 toast 显示错误，而不是 alert（更好的 UX）
      toast.error('更新节点失败', {
        description: errorMessage.split('\n').slice(0, 3).join('\n'),
        duration: 8000,
        action: {
          label: '查看详情',
          onClick: () => {
            logError('完整错误信息:', errorInfo);
            alert(errorMessage);
          },
        },
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
      const isLoading = isCreating || isUpdating || isProcessingVideo || isGeneratingUIText;
      if (hasContent && !isLoading) {
        // 触发表单提交
        const form = e.currentTarget.closest('form');
        if (form) {
          form.requestSubmit();
        }
      } else if (!hasContent) {
        toast.error('请输入内容或上传文件', {
          description: '请填写产品描述或上传参考文件',
          duration: 3000,
        });
      }
    } else if (e.key === 'Escape' && !e.shiftKey) {
      // ESC键：清除焦点，但不阻止事件传播（允许其他组件处理）
      e.currentTarget.blur();
    }
    // Shift+Enter 允许默认行为（插入换行）
  }, [prompt, attachment, isCreating, isUpdating, isProcessingVideo]);

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
    
    // 设置超时：300秒后自动重置（防止卡死）
    timeoutRef.current = setTimeout(() => {
      logWarn('操作超时，自动重置加载状态');
      forceResetLoading();
      toast.error('⏱️ 操作超时', {
        description: '请求已超过 300 秒，已自动重置。如果问题持续，请检查网络连接或稍后重试。',
        duration: 8000,
      });
    }, 300000);
    
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
          resolve({
            name: file.name,
            type: 'text',
            content: textContent,
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
          description: processedAttachments.map(a => a.name).join('、'),
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

    const isLoading = isCreating || isUpdating || isProcessingVideo || isGeneratingUIText;
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

    // 启动加载步骤动画
    startLoadingSteps();

    if (isEditMode && selectedNode) {
      // 检查是否有图片附件，如果有则使用 Model Relay 流程
      // 放宽检测条件：只要 mimeType 是 image/ 开头，或者 type 是 media 且有 preview（且不是 PDF/视频），就认为是图片
      const isPDF = attachment?.mimeType === 'application/pdf';
      const isVideo = attachment?.mimeType?.startsWith('video/');
      const isImage = (attachment?.mimeType?.startsWith('image/') || 
                      (attachment?.type === 'media' && attachment.preview && !isPDF && !isVideo)) &&
               !isPDF;

      // 调试日志：记录图片检测结果
      log('🔍 [CommandBar] 图片检测结果:', {
        hasAttachment: !!attachment,
        attachmentType: attachment?.type,
        attachmentMimeType: attachment?.mimeType,
        hasPreview: !!attachment?.preview,
        isPDF,
        isVideo,
        isImage,
        hasContent: !!attachment?.content,
        willUseModelRelay: isImage && !!attachment?.content,
      });

      if (isImage && attachment?.content) {
        // ========== Model Relay 流程：UI 优先，PRD 由用户手动生成 ==========
        log('🚀 [CommandBar] 开始处理图片生成UI请求');
        log('📋 [CommandBar] 请求参数:', {
          prompt: prompt,
          promptLength: prompt.length,
          hasAttachment: !!attachment,
          attachmentType: attachment?.type,
          attachmentName: attachment?.name,
          attachmentSize: attachment?.content?.length || 0,
          isEditMode: isEditMode,
          selectedNodeId: selectedNodeId,
          timestamp: new Date().toISOString(),
        });
        
        // 在 try 块外部声明变量，以便在 catch 块中访问
        let accumulatedCode: string = '';
        let fullCode: string = '';
        
        try {
          // ========== Step 1: 生成 UI 代码（使用高智能视觉模型）==========
          log('🎨 [CommandBar] Step 1: 开始生成 UI 代码');
          setLoadingStep('🎨 正在生成 UI 代码...');
          setProgress(10);
          
          // 初始化 UI 代码状态（用于实时更新）
          accumulatedCode = '';
          fullCode = '';

          // 新版本提示词：结构化提示词
          const optimizedPrompt = prompt.trim() || `Analyze the uploaded image and generate production-ready React + Tailwind CSS code.

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
          
          // 确保图片数据格式正确（移除 data: URL 前缀，只保留 base64 数据）
          let imageBase64Data = attachment?.content || '';
          if (imageBase64Data.includes('data:')) {
            // 如果包含 data: URL 前缀，提取 base64 部分
            const parts = imageBase64Data.split(',');
            if (parts.length > 1) {
              imageBase64Data = parts[1];
            }
          }
          
          log('📤 [CommandBar] 准备调用 executeUI');
          log('📤 [CommandBar] 调用参数:', {
            promptLength: optimizedPrompt.length,
            imageBase64Length: imageBase64Data.length,
            imageBase64Prefix: imageBase64Data.substring(0, 50),
            hasDataPrefix: attachment?.content?.includes('data:') || false,
            timestamp: new Date().toISOString(),
          });

          // zsa-react 的 execute 函数可能返回 [data, error] 数组格式或直接返回数据
          let uiResult: any;
          const executeStartTime = Date.now();
          
          // 添加请求超时检测（400秒）
          const requestTimeout = 400000; // 400秒
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`请求超时：超过 ${requestTimeout / 1000} 秒未收到服务器响应。请检查：1. 服务器是否正常运行 2. 终端是否有日志输出 3. 网络连接是否正常`));
            }, requestTimeout);
          });
          
          try {
            log('⏳ [CommandBar] 开始执行 executeUI，等待服务器响应...');
            log('⏳ [CommandBar] 请求超时设置:', `${requestTimeout / 1000}秒`);
            log('⏳ [CommandBar] 如果超过此时间未响应，请检查终端日志');
            
            // 使用 Promise.race 来检测超时
            uiResult = await Promise.race([
              executeUI({
                prompt: optimizedPrompt,
                imageBase64: imageBase64Data,
                themeConfig: currentTheme, // 传递当前主题配置
                aiConfig: aiConfig, // 传递 AI 模型配置
              }),
              timeoutPromise,
            ]) as any;
            
            const executeDuration = Date.now() - executeStartTime;
            log(`✅ [CommandBar] executeUI 执行成功，耗时: ${executeDuration}ms`);
          } catch (executeError: any) {
            const executeDuration = Date.now() - executeStartTime;
            logError(`❌ [CommandBar] executeUI 执行失败，耗时: ${executeDuration}ms`);
            logError('❌ [CommandBar] executeUI 错误详情:', {
              error: executeError,
              errorType: typeof executeError,
              errorMessage: executeError?.message || executeError?.error || String(executeError),
              errorStack: executeError instanceof Error ? executeError.stack : undefined,
            });
            
            // 检查是否是超时错误
            const errorMessage = executeError?.message || executeError?.error || String(executeError);
            if (errorMessage.includes('请求超时') || errorMessage.includes('timeout')) {
              logError('❌ [CommandBar] ========== 诊断信息 ==========');
              logError('❌ [CommandBar] 请求超时，可能的原因：');
              logError('❌ [CommandBar] 1. 服务器端没有收到请求 - 请检查终端是否有日志输出');
              logError('❌ [CommandBar] 2. 服务器端处理时间过长 - 请检查终端日志，看是否卡在某个步骤');
              logError('❌ [CommandBar] 3. 网络连接问题 - 请检查网络状态');
              logError('❌ [CommandBar] 4. API 调用失败 - 请检查 OPENAI_API_KEY 是否正确配置');
              logError('❌ [CommandBar] ====================================');
              
              toast.error('⏱️ 请求超时', {
                description: '服务器响应超时。请检查终端日志，确认服务器是否收到请求。',
                duration: 10000,
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

          // 处理 zsa-react 的返回格式（可能是数组 [data, error] 或直接是数据对象）
          let resultData: { code?: string } | null = null;
          let resultError: any = null;

          if (Array.isArray(uiResult)) {
            // 数组格式：[data, error]
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
            // 对象格式：直接是返回值
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
            const errorMessage = resultError instanceof Error 
              ? resultError.message 
              : (resultError?.message || resultError?.error || String(resultError));
            throw new Error(`UI 代码生成失败: ${errorMessage}`);
          }

          log('📥 [CommandBar] executeUI 解析后的结果:', {
            hasData: !!resultData,
            hasCode: !!resultData?.code,
            codeLength: resultData?.code?.length || 0,
            codePreview: resultData?.code?.substring(0, 100),
            dataKeys: resultData ? Object.keys(resultData) : [],
          });

          // 如果没有数据，抛出错误
          if (!resultData || !resultData.code) {
            logError('❌ [CommandBar] UI generation failed: no code in result', {
              originalResult: uiResult,
              parsedData: resultData,
              dataKeys: resultData ? Object.keys(resultData) : [],
            });
            throw new Error('UI 代码生成失败：服务器没有返回有效的代码');
          }

          // 提取代码
          const code = resultData.code;
          
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
          log('💾 [CommandBar] 立即保存UI代码到store:', {
            nodeId: selectedNode.id,
            codeLength: accumulatedCode.length,
            codePreview: accumulatedCode.substring(0, 100),
            hasPreviewUrl: !!attachment?.preview,
          });
          
          updateNodeData(selectedNode.id, {
            artifacts: {
              ...selectedNode.data.artifacts,
              view: {
                code: accumulatedCode,
                previewUrl: attachment?.preview,
              },
            },
          });
          
          // 验证保存是否成功
          setTimeout(() => {
            const savedNode = nodes.find(n => n.id === selectedNode.id);
            if (savedNode) {
              log('✅ [CommandBar] UI代码保存验证:', {
                nodeId: selectedNode.id,
                savedCodeLength: savedNode.data.artifacts?.view?.code?.length || 0,
                savedCodePreview: savedNode.data.artifacts?.view?.code?.substring(0, 100) || 'N/A',
                isMatch: savedNode.data.artifacts?.view?.code === accumulatedCode,
              });
            }
          }, 100);

          setLoadingStep('✅ UI 代码已生成');
          setProgress(100);

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

      // ========== 检查用户意图：是否要求生成UI ==========
      // 如果用户提示词中包含"生成UI"、"生成本页面"等关键词，且没有图片，则使用 generateUIFromText
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
                            userPromptLower.includes('生成页面 ui');
      
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
          const uiResult = await executeUIText({
            prompt: prompt.trim() || `请为"${selectedNode.data.label}"页面生成完整的React组件代码，包含现代化的UI设计和完整的交互功能。`,
            nodeLabel: selectedNode.data.label || selectedNode.id,
            projectMeta: useCanvasStore.getState().projectMeta,
            themeConfig: currentTheme,
            aiConfig: aiConfig,
          });
          
          // 处理返回结果
          log('📥 [CommandBar] executeUIText 原始返回:', {
            result: uiResult,
            resultType: typeof uiResult,
            isArray: Array.isArray(uiResult),
            arrayLength: Array.isArray(uiResult) ? uiResult.length : undefined,
            keys: uiResult && typeof uiResult === 'object' ? Object.keys(uiResult) : [],
          });
          
          let uiCode = '';
          if (Array.isArray(uiResult)) {
            uiCode = uiResult[0]?.code || uiResult[0] || '';
            log('📦 [CommandBar] 检测到数组格式返回，提取code:', {
              hasFirstElement: !!uiResult[0],
              firstElementType: typeof uiResult[0],
              firstElementKeys: uiResult[0] && typeof uiResult[0] === 'object' ? Object.keys(uiResult[0]) : [],
              extractedCode: uiCode.substring(0, 100),
            });
          } else if (uiResult && typeof uiResult === 'object') {
            uiCode = (uiResult as any).code || '';
            log('📦 [CommandBar] 检测到对象格式返回，提取code:', {
              hasCode: !!(uiResult as any).code,
              codeType: typeof (uiResult as any).code,
              codeLength: (uiResult as any).code?.length || 0,
              extractedCode: uiCode.substring(0, 100),
            });
          } else {
            logWarn('⚠️ [CommandBar] 未知的返回格式:', {
              result: uiResult,
              resultType: typeof uiResult,
            });
          }
          
          log('🔍 [CommandBar] 提取的UI代码:', {
            codeLength: uiCode.length,
            codePreview: uiCode.substring(0, 200),
            isValid: uiCode && uiCode.length > 50,
          });
          
          if (uiCode && uiCode.length > 50) {
            // 更新节点的 view.code
            log('💾 [CommandBar] 准备更新节点:', {
              nodeId: selectedNode.id,
              nodeLabel: selectedNode.data.label,
              codeLength: uiCode.length,
              codePreview: uiCode.substring(0, 100),
            });
            
            updateNodeData(selectedNode.id, {
              artifacts: {
                view: {
                  code: uiCode,
                },
              },
            });
            
            // 验证更新是否成功
            setTimeout(() => {
              const updatedNode = useCanvasStore.getState().nodes.find(n => n.id === selectedNode.id);
              if (updatedNode) {
                const savedCode = updatedNode.data.artifacts?.view?.code || '';
                log('✅ [CommandBar] 节点更新验证:', {
                  nodeId: selectedNode.id,
                  savedCodeLength: savedCode.length,
                  savedCodePreview: savedCode.substring(0, 100),
                  isMatch: savedCode === uiCode,
                  codeMatches: savedCode.substring(0, 50) === uiCode.substring(0, 50),
                });
                
                if (savedCode.length === 0 || savedCode === '// PLACEHOLDER') {
                  logError('❌ [CommandBar] 节点更新失败！代码未保存:', {
                    nodeId: selectedNode.id,
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
                  nodeId: selectedNode.id,
                });
              }
            }, 100);
            
            log('✅ [CommandBar] UI代码生成成功');
            setLoadingStep('✅ UI代码生成完成');
            setProgress(100);
            toast.success('UI代码生成成功', {
              description: `已为"${selectedNode.data.label}"生成UI代码`,
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
        } catch (error) {
          logError('❌ [CommandBar] UI代码生成失败:', error);
          toast.error('UI代码生成失败', {
            description: error instanceof Error ? error.message : '未知错误',
            duration: 5000,
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
        attachments: attachmentsForAPI.map(att => ({ type: att.type, name: att.name, hasContent: !!att.content })),
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

      try {
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
        throw error;
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
  }, [prompt, attachments, hasContent, isLoading, isCreating, isUpdating, isProcessingVideo, isGeneratingUIText]);

  // 处理取消选择节点
  const handleClearSelection = () => {
    selectNode(null);
  };


  // 按钮文本（根据模式）
  const isPDF = attachment?.mimeType === 'application/pdf';
  const isVideo = attachment?.mimeType?.startsWith('video/');
  const isImage = attachment?.mimeType?.startsWith('image/') || (attachment?.type === 'media' && attachment.preview && !isPDF && !isVideo);
  
  const buttonText = isEditMode
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

  return (
    <div 
      data-command-bar
      className="w-full pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >

      {/* 附件预览（如果有） */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
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

      {/* 编辑模式提示 */}
      {isEditMode && selectedNode && (
        <div className="mb-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400">
            <span>编辑中：{selectedNode.data.label}</span>
          </div>
        </div>
      )}

      {/* 主输入栏 - 简化设计 */}
      <div className="w-full">
        {/* 进度条 - 科幻风格 */}
        {isLoading && (
          <div className="mb-2 w-full max-w-3xl mx-auto">
            <div className="h-0.5 bg-zinc-900/50 rounded-full overflow-hidden backdrop-blur-sm border border-cyan-500/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 主表单容器 */}
        <div className="w-full max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className={`relative flex items-center gap-3 bg-zinc-950/80 backdrop-blur-xl border rounded-2xl px-4 py-3 transition-all ${
              isFocused 
                ? 'border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.15)] ring-1 ring-purple-500/20' 
                : isDragging
                ? 'border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] ring-2 ring-purple-500/50 bg-purple-500/10'
                : 'border-zinc-800/50 shadow-lg'
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
                      description: processedAttachments.map(a => a.name).join('、'),
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

            {/* 附件按钮 */}
            <button
              type="button"
              onClick={handleAttachClick}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={isLoading}
              className="p-2.5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 self-center"
              style={{ pointerEvents: 'auto' }}
              title="上传文件"
              aria-label="上传文件"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* 输入框 */}
            <textarea
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
                isEditMode && selectedNode
                  ? `编辑 ${selectedNode.data.label}...`
                  : '描述你的产品想法...'
              }
              className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500/60 outline-none text-sm resize-none overflow-y-auto py-2.5 min-h-[72px] max-h-[200px] leading-relaxed"
              style={{ pointerEvents: 'auto' }}
              disabled={isLoading}
              rows={1}
            />

            {/* 发送按钮 */}
            <button
              type="submit"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={!hasContent || isLoading}
              title={
                !hasContent 
                  ? "请输入内容或上传文件" 
                  : isLoading 
                  ? "正在处理中..." 
                  : isEditMode 
                  ? "更新当前节点" 
                  : "生成新的节点和连接"
              }
              className={`
                p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 self-center
                ${
                  hasContent && !isLoading
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-500/30'
                    : 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                }
              `}
              style={{ pointerEvents: 'auto' }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>

        {/* 加载步骤文本 */}
        {isLoading && loadingStep && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{loadingStep}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
