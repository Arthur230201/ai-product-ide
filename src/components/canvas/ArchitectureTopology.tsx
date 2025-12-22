'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { log } from '@/lib/logger';

export function ArchitectureTopology() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    log('📤 [ArchitectureTopology] 开始处理拓扑图文件:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    try {
      // 转换为 base64 用于预览
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      log('📸 [ArchitectureTopology] 图片加载完成');
      setImageUrl(base64);
      toast.success('拓扑图上传成功');
    } catch (error) {
      log('❌ [ArchitectureTopology] 图片加载失败:', error);
      toast.error('图片加载失败，请重试');
    }
  }, []);

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

  return (
    <div className="space-y-4">
      {/* 说明文字 */}
      <div className="text-sm text-zinc-400 mb-4">
        上传系统架构图、流程图或网络拓扑图，系统将直接展示您上传的图片。
      </div>

      {/* 上传区域 */}
      {!imageUrl && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-cyan-500 bg-cyan-500/10' 
              : 'border-zinc-700 hover:border-zinc-600'
            }
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
        </div>
      )}

      {/* 图片展示 */}
      {imageUrl && (
        <div className="space-y-4">
          {/* 操作栏 */}
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setImageUrl(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              重新上传
            </button>
          </div>

          {/* 图片预览 */}
          <div className="bg-zinc-950 rounded-lg p-4 border border-zinc-800 overflow-auto">
            <img
              src={imageUrl}
              alt="架构拓扑图"
              className="max-w-full h-auto rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
