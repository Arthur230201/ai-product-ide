'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Network, Loader2, X, Check } from 'lucide-react';
import { useServerAction } from 'zsa-react';
import { parseTopology } from '@/app/actions/parse-topology';
import { useCanvasStore } from '@/store/canvas-store';
import { toast } from 'sonner';
import { log, logError } from '@/lib/logger';
import type { FractalNode } from '@/types/fractal';
import { Edge, MarkerType } from 'reactflow';

interface TopologyUploaderProps {
  onClose?: () => void;
}

export function TopologyUploader({ onClose }: TopologyUploaderProps) {
  const { addNodes, addEdges, layoutNodes } = useCanvasStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseResult, setParseResult] = useState<{
    nodes: Array<{ id: string; label: string; type: 'page' | 'service'; position: { x: number; y: number } }>;
    edges: Array<{ source: string; target: string; label?: string }>;
  } | null>(null);

  const { execute, isPending } = useServerAction(parseTopology);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    setIsProcessing(true);
    log('📤 [TopologyUploader] 开始处理拓扑图文件:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    try {
      // 转换为 base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      log('📸 [TopologyUploader] 图片转换为 base64 完成，开始解析拓扑图');

      // 调用解析 API
      const result = await execute({
        imageBase64: base64,
      });

      if (result && result[0]) {
        log('✅ [TopologyUploader] 拓扑图解析成功:', result[0]);
        setParseResult(result[0]);
        toast.success(`成功识别 ${result[0].nodes.length} 个节点和 ${result[0].edges.length} 条连接`);
      } else {
        throw new Error('解析结果为空');
      }
    } catch (error) {
      logError('❌ [TopologyUploader] 拓扑图解析失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '拓扑图解析失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [execute]);

  // 处理文件输入
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 应用拓扑图到画布
  const handleApplyTopology = useCallback(() => {
    if (!parseResult) return;

    try {
      // 转换节点格式
      const nodes: FractalNode[] = parseResult.nodes.map((node, index) => {
        // 将相对位置转换为实际坐标（基于画布中心）
        const baseX = 400;
        const baseY = 300;
        const scaleX = 3; // 缩放因子
        const scaleY = 3;

        return {
          id: node.id,
          type: node.type || 'page',
          position: {
            x: baseX + (node.position.x * scaleX),
            y: baseY + (node.position.y * scaleY),
          },
          selected: false,
          data: {
            label: node.label,
            artifacts: {
              view: {
                code: `function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">${node.label}</h1>
      <p className="text-gray-600">这是从拓扑图导入的节点</p>
    </div>
  );
}`,
              },
              spec: {
                title: node.label,
                requirements: ['从拓扑图导入'],
              },
              impl: {
                apiEndpoints: [],
                dbSchema: '-- 暂无数据库需求',
              },
              test: {
                cases: ['待添加测试用例'],
              },
            },
            syncState: {
              isSynced: true,
              lastSource: 'view',
            },
            source: {
              type: 'ai',
            },
          },
        } as FractalNode;
      });

      // 转换边格式
      const edges: Edge[] = parseResult.edges.map((edge, index) => {
        return {
          id: `e-${edge.source}-${edge.target}-${index}`,
          source: edge.source,
          target: edge.target,
          type: 'smart',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          label: edge.label || '连接',
          labelStyle: {
            fill: '#64748B',
            fontWeight: 500,
          },
        } as Edge;
      });

      // 添加到画布
      addNodes(nodes);
      addEdges(edges);

      // 应用布局
      setTimeout(() => {
        layoutNodes();
      }, 100);

      toast.success(`已添加 ${nodes.length} 个节点和 ${edges.length} 条连接`);
      log('✅ [TopologyUploader] 拓扑图已应用到画布');

      if (onClose) {
        onClose();
      }
    } catch (error) {
      logError('❌ [TopologyUploader] 应用拓扑图失败:', error);
      toast.error('应用拓扑图失败，请重试');
    }
  }, [parseResult, addNodes, addEdges, layoutNodes, onClose]);

  return (
    <div className="w-full h-full bg-zinc-900 text-zinc-100 flex flex-col">
      {/* Header - 只在独立模态框时显示 */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">上传拓扑图</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 上传区域 */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-cyan-500 bg-cyan-500/10' 
              : 'border-zinc-700 hover:border-zinc-600'
            }
            ${isProcessing || isPending ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          {isProcessing || isPending ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              <p className="text-zinc-400">正在解析拓扑图...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-12 h-12 text-zinc-500" />
              <div>
                <p className="text-zinc-300 font-medium mb-1">
                  上传拓扑图图片
                </p>
                <p className="text-zinc-500 text-sm">
                  支持系统架构图、流程图、网络拓扑图等
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors"
              >
                选择图片
              </button>
            </div>
          )}
        </div>

        {/* 解析结果预览 */}
        {parseResult && (
          <div className="mt-6 space-y-4">
            <div className="bg-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                解析结果预览
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">节点数量</p>
                  <p className="text-2xl font-bold text-zinc-200">{parseResult.nodes.length}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">连接数量</p>
                  <p className="text-2xl font-bold text-zinc-200">{parseResult.edges.length}</p>
                </div>
              </div>

              {/* 节点列表预览 */}
              <div className="mb-4">
                <p className="text-sm text-zinc-400 mb-2">节点列表</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {parseResult.nodes.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 p-2 bg-zinc-900 rounded text-sm"
                    >
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        node.type === 'page' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {node.type === 'page' ? '页面' : '服务'}
                      </span>
                      <span className="text-zinc-300">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 应用按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleApplyTopology}
                className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                应用到画布
              </button>
              <button
                onClick={() => setParseResult(null)}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                重新上传
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

