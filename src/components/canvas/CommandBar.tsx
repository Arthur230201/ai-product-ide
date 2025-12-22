'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, X, Send, Loader2, FileText, Image as ImageIcon, Video, Target } from 'lucide-react';
import { useServerAction } from 'zsa-react';
import { generateGraph } from '@/app/actions/generate-graph';
import { updateNodeArtifacts, generateUIFromImage, generateAnalysisFromCode } from '@/app/actions/node-operations';
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
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  // 超时覆盖标志：当超时发生时，强制重置所有 loading 状态
  const [isTimeoutOverride, setIsTimeoutOverride] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingTimersRef = useRef<NodeJS.Timeout[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { nodes, selectedNodeId, selectNode, addNodes, addEdges, updateNodeData, layoutNodes, currentTheme, aiConfig } = useCanvasStore();
  
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
      if (result.data) {
        addNodes(result.data.nodes);
        addEdges(result.data.edges);
        // 添加节点后自动应用布局，避免节点重叠
        setTimeout(() => {
          layoutNodes();
        }, 100); // 延迟执行，确保节点已添加到状态中
      }
      // 重置状态
      setPrompt('');
      setAttachment(null);
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
      const hasContent = Boolean(prompt.trim() || attachment);
      const isLoading = isCreating || isUpdating || isProcessingVideo;
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
    loadingTimersRef.current.forEach(timer => clearTimeout(timer));
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
  

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPDF = file.type === 'application/pdf';
    // 文本文件：基于扩展名和 MIME 类型判断
    const isText = file.type.startsWith('text/') || 
                   /\.(md|txt|json|csv|js|ts|tsx|jsx|css|html|xml|yaml|yml)$/i.test(file.name);
    
    // 允许的文件类型：图片、视频、PDF、文本文件
    if (!isImage && !isVideo && !isPDF && !isText) {
      toast.error('不支持的文件类型', {
        description: '请选择支持的文件类型：图片、视频、PDF、文档或代码文件（支持 .pdf, .md, .txt, .json, .csv, .js, .ts, .tsx 等）',
        duration: 5000,
      });
      return;
    }

    // ========== 混合读取策略 ==========
    
    // 策略 1: 文本文件 - 使用 readAsText()
    if (isText) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        if (!textContent || textContent.trim().length === 0) {
          toast.error('文件内容为空', {
            description: '请选择有效的文档文件',
            duration: 3000,
          });
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }
        setAttachment({
          name: file.name,
          type: 'text',
          content: textContent,
        });
      };
      reader.onerror = () => {
        alert('读取文本文件失败，请重试');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }

    // 策略 2: 二进制文件（PDF、图片、视频）- 使用 readAsDataURL()
    // 验证文件大小
    const maxSize = isVideo ? 50 * 1024 * 1024 : (isPDF ? 20 * 1024 * 1024 : 10 * 1024 * 1024);
    if (file.size > maxSize) {
      const sizeLimit = isVideo ? '50MB' : (isPDF ? '20MB' : '10MB');
      toast.error('文件大小超限', {
        description: `文件大小不能超过 ${sizeLimit}`,
        duration: 4000,
      });
      return;
    }

    // 处理视频（需要验证时长）
    if (isVideo) {
      setIsProcessingVideo(true);
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const duration = video.duration;
          if (duration > 30) {
            alert('视频时长不能超过 30 秒（关键流程）');
            setIsProcessingVideo(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            return;
          }
          processBinaryFile(file, 'video');
        };
        video.onerror = () => {
          setIsProcessingVideo(false);
          toast.error('读取视频元数据失败', {
            description: '请重试',
            duration: 3000,
          });
        };
        video.src = URL.createObjectURL(file);
      } catch (error) {
        setIsProcessingVideo(false);
        toast.error('处理视频失败', {
          description: '请重试',
          duration: 3000,
        });
      }
    } else {
      // 处理图片或 PDF
      processBinaryFile(file, isPDF ? 'pdf' : 'image');
    }
  };

  // 图片压缩函数：在保持质量的同时减少文件大小
  const compressImage = async (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 计算新尺寸（保持宽高比）
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }
          
          // 创建 canvas 进行压缩
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('无法创建画布上下文'));
            return;
          }
          
          // 使用高质量缩放
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // 转换为 base64（JPEG 格式，质量可调）
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  };

  const processBinaryFile = async (file: File, fileCategory: 'image' | 'video' | 'pdf') => {
    // 对于图片，先进行压缩
    if (fileCategory === 'image') {
      try {
        // 压缩图片：最大尺寸 1920x1920，质量 85%（在速度和文件大小间平衡）
        const compressedBase64 = await compressImage(file, 1920, 1920, 0.85);
        setAttachment({
          name: file.name,
          type: 'media',
          content: compressedBase64,
          preview: compressedBase64,
          mimeType: file.type,
        });
        setIsProcessingVideo(false);
      } catch (error) {
        logError('图片压缩失败，使用原图:', error);
        // 压缩失败时回退到原始方式
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          setAttachment({
            name: file.name,
            type: 'media',
            content: base64String,
            preview: base64String,
            mimeType: file.type,
          });
          setIsProcessingVideo(false);
        };
        reader.onerror = () => {
          alert('读取图片失败，请重试');
          setIsProcessingVideo(false);
        };
        reader.readAsDataURL(file);
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

  const handleRemoveAttachment = () => {
    setAttachment(null);
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

    // 遍历剪贴板项目
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // 检查是否为图片（粘贴功能主要支持图片）
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault(); // 防止粘贴二进制数据作为文本
        
        const blob = item.getAsFile();
        if (!blob) return;

        // 验证文件大小（图片最大 10MB）
        const maxSize = 10 * 1024 * 1024;
        if (blob.size > maxSize) {
          toast.error('图片大小超限', {
            description: '图片大小不能超过 10MB',
            duration: 4000,
          });
          return;
        }

        // 对于粘贴的图片，也进行压缩处理
        const file = new File([blob], `粘贴的图片_${Date.now()}.png`, { type: blob.type || 'image/png' });
        try {
          const compressedBase64 = await compressImage(file, 1920, 1920, 0.85);
          setAttachment({
            name: `粘贴的图片_${Date.now()}.png`,
            type: 'media',
            content: compressedBase64,
            preview: compressedBase64,
            mimeType: blob.type || 'image/png',
          });
        } catch (error) {
          logError('粘贴图片压缩失败，使用原图:', error);
          // 压缩失败时回退到原始方式
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64String = event.target?.result as string;
            setAttachment({
              name: `粘贴的图片_${Date.now()}.png`,
              type: 'media',
              content: base64String,
              preview: base64String,
              mimeType: blob.type || 'image/png',
            });
          };
          reader.onerror = () => {
            toast.error('读取图片失败', {
              description: '请重试',
              duration: 3000,
            });
          };
          reader.readAsDataURL(blob);
        }
        
        // 只处理第一个图片
        break;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isLoading = isCreating || isUpdating || isProcessingVideo;
    if (isLoading) {
      toast.info('正在处理中，请稍候...');
      return;
    }

    const hasContent = prompt.trim() || attachment;
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

      if (isImage && attachment.content) {
        // ========== Model Relay 流程：UI 优先，然后自动生成 PRD ==========
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

          // 优化后的提示词：强调精确复刻而非修正
          const optimizedPrompt = prompt.trim() || `请精确复刻这张UI截图，生成完全可交互的React+Tailwind组件。

**核心要求：精确还原，不要过度修正**

1. **精确还原所有UI元素**：
   - 顶部导航栏（返回按钮、标题、操作按钮）
   - 搜索栏和筛选器（包括占位符文本、图标）
   - 分类标签栏（完整还原所有标签，精确还原激活状态的视觉样式）
   - 列表项的所有细节：
     * 任务类型标签
     * 任务标题（包括特殊字符如书名号）
     * 状态标签（已完成、进行中等）及其精确颜色
     * 负责人信息和发布时间
     * 平台/渠道列表及其状态图标（✓、时钟等）
     * 操作按钮（如"催办"按钮）

2. **视觉精确匹配**：
   - 精确匹配所有颜色（背景色、文本色、按钮色、状态标签颜色等）
   - 精确匹配字体大小和粗细层次
   - 精确匹配间距和对齐方式
   - 精确匹配圆角、阴影、边框等视觉效果

3. **布局结构**：
   - 完整还原页面的整体布局结构
   - 精确还原每个元素的相对位置和尺寸
   - 如果是移动端UI，使用移动端优先的布局

4. **交互功能**：
   - 所有按钮必须可点击，添加hover和active状态
   - 搜索框必须可输入，使用useState管理搜索关键词
   - 筛选器必须可切换，使用useState管理排序状态
   - 分类标签必须可切换，使用useState管理当前激活标签，精确还原激活状态的视觉样式
   - 列表项如果有展开功能，必须实现展开/收起

5. **数据展示**：
   - 使用示例数据完整还原图片中显示的所有内容
   - 确保数据格式和展示方式与图片完全一致

6. **技术要求**：
   - 使用React Hooks（useState、useEffect）管理所有状态
   - 使用Tailwind CSS实现所有样式，禁止内联样式
   - 使用Lucide React图标库还原所有图标
   - 代码必须可直接运行，包含完整的交互逻辑`;
          
          // 确保图片数据格式正确（移除 data: URL 前缀，只保留 base64 数据）
          let imageBase64Data = attachment.content;
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
            hasDataPrefix: attachment.content.includes('data:'),
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

          // 实时更新 UI 代码到节点（用户可以看到 UI 立即出现）
          updateNodeData(selectedNode.id, {
            artifacts: {
              ...selectedNode.data.artifacts,
              view: {
                code: accumulatedCode,
                previewUrl: attachment.preview,
              },
            },
          });

          setLoadingStep('✅ UI 代码已生成');
          setProgress(100);

          // 立即返回成功，不等待 PRD 生成
          toast.success('UI 代码已生成', {
            description: '正在后台生成 PRD 文档...',
            duration: 3000,
          });

          // 清除超时保护（UI 已成功生成）
          clearLoadingTimers();
          
          // 重置状态
          setPrompt('');
          setAttachment(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }

          // PRD 在后台异步生成，不阻塞用户交互
          (async () => {
            try {
              setLoadingStep('📝 正在后台生成 PRD 文档...');
              
              // 获取现有的需求文档，以便在原有基础上增加新内容
              const existingRequirements = selectedNode?.data?.artifacts?.spec?.requirements;
              let existingRequirementsArray: string[] = [];
              if (existingRequirements) {
                if (Array.isArray(existingRequirements)) {
                  existingRequirementsArray = existingRequirements;
                } else if (typeof existingRequirements === 'string') {
                  const reqStr: string = existingRequirements;
                  existingRequirementsArray = reqStr.split('\n').filter((l: string) => l.trim());
                }
              }
              
              // 获取页面标题用于生成功能ID前缀
              const pageTitle = selectedNode?.data?.artifacts?.spec?.title || selectedNode?.data?.label || undefined;
              
              const analysisResult = await executeAnalysis({
                codeContext: fullCode,
                pageTitle: pageTitle,
                existingRequirements: existingRequirementsArray.length > 0 ? existingRequirementsArray : undefined,
                aiConfig: aiConfig, // 传递 AI 模型配置
              });

              // 处理 zsa-react 的返回格式（可能是数组或对象）
              let analysisData: { markdown?: string } | null = null;
              if (Array.isArray(analysisResult)) {
                analysisData = analysisResult[0] || null;
              } else if (analysisResult && typeof analysisResult === 'object') {
                analysisData = analysisResult.data || analysisResult;
              }

              if (analysisData?.markdown) {
                const prdMarkdown = analysisData.markdown;
                const requirementsArray = prdMarkdown
                  .split('\n')
                  .filter((line: string) => line.trim() !== '');

                // 更新 PRD 到节点（不影响已生成的 UI）
                updateNodeData(selectedNode.id, {
                  artifacts: {
                    ...selectedNode.data.artifacts,
                    spec: {
                      title: selectedNode.data.artifacts?.spec?.title || selectedNode.data.label || '未命名节点',
                      requirements: requirementsArray,
                    },
                  },
                });

                toast.success('PRD 文档已生成', {
                  description: '需求文档已在后台完成',
                  duration: 3000,
                });
              } else {
                // PRD 生成失败不影响 UI，只显示警告
                toast.warning('PRD 文档生成失败', {
                  description: '您可以稍后手动生成 PRD',
                  duration: 5000,
                });
              }
            } catch (error) {
              // 静默处理错误，不打扰用户
              logWarn('PRD 后台生成失败（不影响使用）:', error);
              toast.info('PRD 生成延迟', {
                description: '您可以稍后手动生成 PRD',
                duration: 3000,
              });
            } finally {
              setLoadingStep('');
            }
          })();

          return; // 立即返回，不等待 PRD
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
          if (currentCode && currentCode.length > 0 && currentCode !== '// PLACEHOLDER') {
            toast.warning('UI 已生成，但 PRD 生成失败', {
              description: errorMessage,
              duration: 5000,
            });
            // 即使 PRD 失败，也重置状态，让用户可以继续使用 UI
            setIsTimeoutOverride(false); // 重置超时覆盖标志
            setPrompt('');
            setAttachment(null);
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

      // ========== 传统流程：使用 updateNodeArtifacts ==========
      // 注意：如果走到这里，说明图片检测失败，可能的原因：
      // 1. attachment.mimeType 不是 'image/' 开头
      // 2. attachment.type 不是 'media'
      // 3. attachment.preview 不存在
      // 4. attachment.content 不存在
      log('⚠️ [CommandBar] 图片检测失败，使用传统流程（updateNodeArtifacts）:', {
        hasAttachment: !!attachment,
        attachmentType: attachment?.type,
        attachmentMimeType: attachment?.mimeType,
        hasPreview: !!attachment?.preview,
        hasContent: !!attachment?.content,
        note: '如果这是图片，应该使用 Model Relay 流程生成 UI，而不是生成需求文档',
      });
      
      // 编辑模式：更新节点
      const attachments: Array<{ type: 'image' | 'text'; content: string; name?: string; mimeType?: string }> = [];
      
      if (attachment) {
        if (attachment.type === 'media' && (attachment.preview || attachment.mimeType === 'application/pdf')) {
          // 图片或 PDF（PDF 也作为 image 类型传递，因为 updateNodeArtifacts 只支持 image 和 text）
          attachments.push({
            type: 'image' as const,
            content: attachment.content,
            name: attachment.name,
            mimeType: attachment.mimeType,
          });
        } else if (attachment.type === 'text') {
          // 文本文件
          attachments.push({
            type: 'text' as const,
            content: attachment.content,
            name: attachment.name,
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
        attachmentsCount: attachments.length,
        attachments: attachments.map(att => ({ type: att.type, name: att.name, hasContent: !!att.content })),
      });

      try {
        await executeUpdate({
          nodeId: selectedNode.id,
          nodeTitle: selectedNode.data.label,
          currentArtifacts,
          userPrompt: prompt.trim() || '',
          attachments,
        });
        log('✅ [CommandBar] executeUpdate completed');
      } catch (error) {
        logError('❌ [CommandBar] executeUpdate error:', error);
        throw error;
      }
    } else {
      // 创建模式：生成新图
      const isPDF = attachment?.mimeType === 'application/pdf';
      const isVideo = attachment?.mimeType?.startsWith('video/');
      const isImage = attachment?.mimeType?.startsWith('image/') || (attachment?.type === 'media' && attachment.preview && !isPDF && !isVideo);
      
      // 根据文件类型决定使用 mediaBase64 还是 attachmentContent
      // PDF 和文本文件使用 attachmentContent，图片和视频使用 mediaBase64
      let mediaBase64: string | undefined;
      let mediaType: 'image' | 'video' | undefined;
      let attachmentContent: string | undefined;
      let attachmentType: 'media' | 'text' | undefined;
      
      if (attachment?.type === 'text') {
        // 文本文件
        attachmentContent = attachment.content;
        attachmentType = 'text';
      } else if (attachment?.type === 'media') {
        if (isPDF) {
          // PDF 使用 attachmentContent（重要：PDF 不应该使用 mediaBase64）
          attachmentContent = attachment.content;
          attachmentType = 'media';
          // 不设置 mediaBase64 和 mediaType
        } else if (isVideo) {
          // 视频使用 mediaBase64
          mediaBase64 = attachment.content;
          mediaType = 'video';
        } else if (isImage) {
          // 图片使用 mediaBase64
          mediaBase64 = attachment.content;
          mediaType = 'image';
        } else {
          // 默认作为图片处理（如果有 preview）或视频（如果没有 preview）
          mediaBase64 = attachment.content;
          mediaType = attachment.preview ? 'image' : 'video';
        }
      }

      log('🆕 [CommandBar] Create mode: Generating new graph', {
        promptLength: prompt.trim().length,
        hasMediaBase64: !!mediaBase64,
        mediaType,
        hasAttachmentContent: !!attachmentContent,
        attachmentType,
        mimeType: attachment?.mimeType,
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
        mimeType: attachment?.mimeType,
        currentNodesCount: nodes.length,
      });

      try {
        await executeCreate({
          prompt: prompt.trim() || '',
          mediaBase64,
          mediaType,
          attachmentContent,
          attachmentType,
          mimeType: attachment?.mimeType,
        });
        log('✅ [CommandBar] executeCreate completed');
      } catch (error) {
        logError('❌ [CommandBar] executeCreate error:', error);
        throw error;
      }
    }
  };

  // 按钮启用逻辑：prompt 不为空 OR attachment 不为空
  const hasContent = Boolean(prompt.trim() || attachment);
  // 如果超时覆盖标志为 true，强制重置 loading 状态
  const isLoading = isTimeoutOverride 
    ? false 
    : (isCreating || isUpdating || isProcessingVideo || isGeneratingUI || isGeneratingPRD);
  
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
      buttonDisabled: !hasContent || isLoading,
    });
  }, [prompt, attachment, hasContent, isLoading, isCreating, isUpdating, isProcessingVideo]);

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
      {attachment && (
        <div className="mb-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300">
            {attachment.mimeType === 'application/pdf' && <FileText className="w-4 h-4 text-red-400" />}
            {attachment.type === 'text' && <FileText className="w-4 h-4 text-blue-400" />}
            {attachment.type === 'media' && !attachment.preview && <Video className="w-4 h-4 text-purple-400" />}
            {attachment.type === 'media' && attachment.preview && attachment.mimeType !== 'application/pdf' && <ImageIcon className="w-4 h-4 text-green-400" />}
            <span className="max-w-[200px] truncate">{attachment.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemoveAttachment();
              }}
              className="ml-2 p-1 hover:bg-zinc-700 rounded transition-colors"
              aria-label="移除附件"
            >
              <X className="w-3 h-3 text-zinc-400 hover:text-zinc-200" />
            </button>
          </div>
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
                : 'border-zinc-800/50 shadow-lg'
            }`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.md,.txt,.json,.csv,.tsx,.ts,.js,.jsx,.css,.html,.xml,.yaml,.yml"
              onChange={handleFileSelect}
              className="hidden"
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
