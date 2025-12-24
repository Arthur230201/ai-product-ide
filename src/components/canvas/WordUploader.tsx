'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { log } from '@/lib/logger';

interface WordUploaderProps {
  onFileUploaded?: (content: string, fileName: string) => void;
  onClose?: () => void;
}

export function WordUploader({ onFileUploaded, onClose }: WordUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; content: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理 Word 文件解析
  const parseWordFile = useCallback(async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // 优先使用 mammoth 解析
          try {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
            return;
          } catch (mammothError) {
            log('[WordUploader] mammoth 解析失败，尝试使用 jszip:', mammothError);
          }
          
          // 降级方案：使用 jszip 解析 .docx 文件
          try {
            const JSZip = (await import('jszip')).default;
            const docx = await JSZip.loadAsync(arrayBuffer);
            const documentXml = await docx.file('word/document.xml')?.async('string');
            
            if (documentXml) {
              // 简单的 XML 文本提取（移除标签）
              const text = documentXml
                .replace(/<w:t[^>]*>/g, '') // 移除文本标签开始
                .replace(/<\/w:t>/g, ' ') // 将文本标签结束替换为空格
                .replace(/<[^>]+>/g, '') // 移除所有其他 XML 标签
                .replace(/\s+/g, ' ') // 合并多个空格
                .trim();
              resolve(text || '（无法解析文件内容）');
              return;
            } else {
              reject(new Error('无法读取 Word 文档内容'));
            }
          } catch (zipError) {
            log('[WordUploader] jszip 解析失败:', zipError);
            reject(new Error('无法解析 Word 文件，请确保文件格式正确'));
          }
        } catch (error) {
          log('[WordUploader] 文件解析失败:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    // 验证文件类型（主要基于文件扩展名）
    const fileName = file.name.toLowerCase().trim();
    
    // 支持的 Word 文件扩展名
    const validExtensions = ['.doc', '.docx'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    // 验证 MIME 类型（可选，因为某些系统可能不提供正确的 MIME 类型）
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc (旧格式)
      'application/x-tika-msoffice', // 某些系统识别的类型
    ];
    
    // 如果文件类型为空或不在有效列表中，但扩展名有效，仍然允许
    const isValidMimeType = !file.type || validMimeTypes.includes(file.type);
    
    // 只要扩展名有效就允许（MIME 类型作为额外验证）
    if (!hasValidExtension) {
      toast.error(`请上传 Word 文件（支持格式：.doc、.docx），当前文件：${file.name}${file.type ? `，类型：${file.type}` : ''}`);
      return;
    }
    
    // 如果 MIME 类型不匹配但扩展名有效，给出警告但继续处理
    if (!isValidMimeType && file.type) {
      log('[WordUploader] MIME 类型不匹配，但扩展名有效，继续处理:', {
        fileName: file.name,
        fileType: file.type,
        extension: fileName.substring(fileName.lastIndexOf('.'))
      });
    }

    // 验证文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('文件大小不能超过 10MB');
      return;
    }

    log('[WordUploader] 开始处理 Word 文件:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // 使用局部状态跟踪处理中，避免多个文件处理时的状态冲突
    setIsProcessing(true);

    try {
      const content = await parseWordFile(file);
      
      log('[WordUploader] Word 文件解析完成:', file.name);
      
      const fileData = {
        name: file.name,
        content,
      };
      
      // 添加到已上传文件列表
      setUploadedFiles(prev => {
        // 检查是否已存在同名文件，如果存在则替换
        const existingIndex = prev.findIndex(f => f.name === file.name);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = fileData;
          return updated;
        }
        return [...prev, fileData];
      });
      
      // 调用回调函数
      if (onFileUploaded) {
        onFileUploaded(content, file.name);
      }
      
      toast.success(`Word 文件 "${file.name}" 上传成功`);
    } catch (error) {
      log('[WordUploader] Word 文件处理失败:', error);
      const errorMessage = error instanceof Error ? error.message : '文件处理失败，请重试';
      toast.error(`文件 "${file.name}" 处理失败: ${errorMessage}`);
    } finally {
      // 延迟重置处理状态，给其他文件处理留出时间
      setTimeout(() => {
        setIsProcessing(false);
      }, 100);
    }
  }, [parseWordFile, onFileUploaded]);

  // 处理文件输入（支持多选）
  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    log('[WordUploader] 文件选择事件:', { 
      fileCount: files?.length || 0,
      files: files ? Array.from(files).map(f => ({ name: f.name, type: f.type, size: f.size })) : []
    });
    
    if (files && files.length > 0) {
      log(`[WordUploader] 开始处理 ${files.length} 个文件`);
      // 顺序处理所有选中的文件（避免并发冲突）
      const fileArray = Array.from(files);
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        log(`[WordUploader] 处理文件 ${i + 1}/${fileArray.length}: ${file.name}`);
        await handleFileSelect(file);
      }
      // 清空 input，允许重复选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      log('[WordUploader] 没有选择任何文件');
    }
  }, [handleFileSelect]);

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 阻止浏览器默认的拖放行为（如下载文件）
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖放区域时才取消高亮
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // 阻止浏览器默认的下载行为
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // 顺序处理所有拖放的文件（避免并发冲突）
      const fileArray = Array.from(files);
      for (const file of fileArray) {
        await handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);

  // 重置上传（清除所有文件）
  const handleReset = useCallback(() => {
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 删除单个文件
  const handleRemoveFile = useCallback((fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  }, []);

  // 调试：确保组件正确渲染
  useEffect(() => {
    log('[WordUploader] 组件已挂载');
    return () => {
      log('[WordUploader] 组件已卸载');
    };
  }, []);

  return (
    <div className="space-y-4" data-word-uploader>
      {/* 说明文字 */}
      <div className="text-sm text-zinc-400 mb-4">
        上传 Word 文档（支持多选，.docx 或 .doc），系统将解析文档内容。
      </div>

      {/* 上传区域 */}
      {uploadedFiles.length === 0 && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-zinc-700 hover:border-zinc-600'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isProcessing && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".doc,.docx"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
            multiple={true}
            aria-label="选择 Word 文件（支持多选）"
          />
          
          <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-zinc-500" />
            )}
            <div>
              <p className="text-zinc-300 font-medium mb-1">
                {isProcessing ? '正在处理文件...' : '上传 Word 文档'}
              </p>
              <p className="text-zinc-500 text-sm">
                支持多选，.doc、.docx 格式，每个文件最大 10MB
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                点击或拖拽文件到此处
              </p>
            </div>
            {!isProcessing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                选择文件
              </button>
            )}
          </div>
        </div>
      )}

      {/* 文件展示 */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          {/* 操作栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-300">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">
                已上传 {uploadedFiles.length} 个文件
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                清空全部
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors text-sm"
                >
                  <X className="w-4 h-4" />
                  关闭
                </button>
              )}
            </div>
          </div>

          {/* 文件列表 */}
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden"
              >
                {/* 文件头部 */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(file.name)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                    title="删除此文件"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* 内容预览 */}
                <div className="p-4 max-h-64 overflow-auto">
                  <div className="text-zinc-300 text-sm whitespace-pre-wrap">
                    {file.content || '（无内容）'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

