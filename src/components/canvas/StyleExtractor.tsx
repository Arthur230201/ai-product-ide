'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Palette, Check, Loader2, X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import type { UIThemeConfig } from '@/types/theme';
import { NAMED_STYLES, STYLE_PREVIEW } from '@/types/theme';
import { toast } from 'sonner';
import { log, logError } from '@/lib/logger';

interface StyleExtractorProps {
  onClose?: () => void;
}

export function StyleExtractor({ onClose }: StyleExtractorProps) {
  const { currentTheme, setTheme, stylePreset, setStylePreset, aiConfig } = useCanvasStore();
  const [previewTheme, setPreviewTheme] = useState<UIThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    setIsLoading(true);
    log('📤 [StyleExtractor] 开始处理图片文件:', {
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

      log('📸 [StyleExtractor] 图片转换为 base64 完成，开始调用 API');

      // 调用提取 API
      const response = await fetch('/api/extract-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageBase64: base64,
          aiConfig: aiConfig, // 传递 AI 模型配置
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '风格提取失败');
      }

      const data = await response.json();
      log('✅ [StyleExtractor] 风格提取成功:', data.theme);
      
      setPreviewTheme(data.theme);
      toast.success('风格提取成功！');
    } catch (error) {
      logError('❌ [StyleExtractor] 风格提取失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '风格提取失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [aiConfig]);

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

  // 应用风格（从图片提取 → 设为 custom）
  const handleApplyTheme = useCallback(() => {
    if (!previewTheme) return;
    
    setTheme(previewTheme);
    setStylePreset('custom');
    toast.success('风格已应用！后续生成的UI将使用此风格');
    log('🎨 [StyleExtractor] 风格已应用到全局状态');
    
    if (onClose) {
      onClose();
    }
  }, [previewTheme, setTheme, setStylePreset, onClose]);

  // 选择内置风格（苹果 / Material / Fluent / 极简中性）
  const handleSelectNamedStyle = useCallback(
    (theme: UIThemeConfig, presetId: (typeof NAMED_STYLES)[number]['id']) => {
      setTheme(theme);
      setStylePreset(presetId);
      toast.success(`已切换为「${NAMED_STYLES.find((s) => s.id === presetId)?.label ?? presetId}」`);
      if (onClose) onClose();
    },
    [setTheme, setStylePreset, onClose]
  );

  // 获取颜色类名对应的实际颜色（用于预览）
  const getColorPreview = (colorClass: string): string => {
    // 简单的颜色映射（实际应该使用 Tailwind 的颜色值）
    const colorMap: Record<string, string> = {
      'blue-500': '#3b82f6',
      'purple-500': '#a855f7',
      'slate-900': '#0f172a',
      'slate-800': '#1e293b',
      'slate-50': '#f8fafc',
      'slate-400': '#94a3b8',
      'slate-700': '#334155',
      'white': '#ffffff',
    };
    
    return colorMap[colorClass] || '#000000';
  };

  return (
    <div
      className="w-full h-full bg-zinc-900 text-zinc-100 flex flex-col"
      data-no-ai-trigger
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold">UI 风格选择</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 选择内置风格（多内容预览：卡片、标题、标签、按钮） */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">选择风格</h3>
          <div className="grid grid-cols-2 gap-3">
            {NAMED_STYLES.filter((s) => s.id !== 'custom').map((style) => {
              const { id, label, theme: styleTheme } = style;
              const p = STYLE_PREVIEW[id];
              const isSelected = stylePreset === id;
              const accent = p.secondary ?? p.primary;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectNamedStyle(styleTheme, id)}
                  className={`
                    rounded-xl text-left transition-all border-2 overflow-hidden
                    ${isSelected ? 'border-purple-500 bg-zinc-800/80' : 'border-transparent bg-zinc-800 hover:bg-zinc-700'}
                  `}
                >
                  {/* 风格预览：整块模拟该风格的迷你卡片（glass 用 background 支持渐变） */}
                  <div
                    className="p-2 min-h-[100px] flex flex-col gap-1.5"
                    style={p.bg.startsWith('linear') ? { background: p.bg } : { backgroundColor: p.bg }}
                  >
                    <div
                      className="flex-1 rounded p-2 flex flex-col gap-1"
                      style={{
                        backgroundColor: p.cardBg,
                        borderRadius: p.cardRadius,
                        boxShadow: p.shadow,
                      }}
                    >
                      <div
                        className="text-[10px] font-semibold leading-tight truncate"
                        style={{ color: p.text }}
                      >
                        卡片标题
                      </div>
                      <div
                        className="text-[9px] leading-tight truncate"
                        style={{ color: p.textSecondary }}
                      >
                        辅助说明文字
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: accent + '22',
                            color: p.isDark || id === 'glass' ? '#fff' : accent,
                            borderRadius: p.radius,
                          }}
                        >
                          标签
                        </span>
                        <span
                          className="text-[8px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: p.primary + '22',
                            color: p.isDark || id === 'glass' ? '#fff' : p.primary,
                            borderRadius: p.radius,
                          }}
                        >
                          芯片
                        </span>
                      </div>
                      <div
                        className="mt-1 text-[9px] font-medium text-white text-center py-1 rounded w-full max-w-[64px]"
                        style={{
                          backgroundColor: p.primary,
                          borderRadius: p.radius,
                        }}
                      >
                        确定
                      </div>
                    </div>
                  </div>
                  <div className="px-2.5 py-2 border-t border-zinc-700/50 space-y-1">
                    <span className="text-sm font-medium text-zinc-200">{label}</span>
                    {'example' in style && style.example && (
                      <p className="text-[10px] text-zinc-500 leading-tight">示例：{style.example}</p>
                    )}
                    {'bestFor' in style && Array.isArray(style.bestFor) && style.bestFor.length > 0 && (
                      <p className="text-[10px] text-zinc-500 leading-tight">适用：{style.bestFor.join('、')}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 从图片提取 */}
        <h3 className="text-sm font-medium text-zinc-400 mb-3">从图片提取风格</h3>
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-zinc-700 hover:border-zinc-600'
            }
            ${isLoading ? 'opacity-50 pointer-events-none' : ''}
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
          
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
              <p className="text-zinc-400">正在分析 UI DNA...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Upload className="w-12 h-12 text-zinc-500" />
              <div>
                <p className="text-zinc-300 font-medium mb-1">
                  上传 UI 截图提取风格
                </p>
                <p className="text-zinc-500 text-sm">
                  拖拽图片到此处，或点击下方按钮选择文件
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
              >
                选择图片
              </button>
            </div>
          )}
        </div>

        {/* 预览区域 */}
        {previewTheme && (
          <div className="mt-6 space-y-6">
            <div className="bg-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                提取的风格预览
              </h3>

              {/* 风格描述 */}
              <div className="mb-4">
                <p className="text-sm text-zinc-400 mb-1">风格描述</p>
                <p className="text-zinc-200 font-medium">{previewTheme.vibe}</p>
              </div>

              {/* 颜色预览 */}
              <div className="mb-4">
                <p className="text-sm text-zinc-400 mb-2">颜色</p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-zinc-700"
                      style={{ backgroundColor: getColorPreview(previewTheme.colors.primary) }}
                      title={`主色: ${previewTheme.colors.primary}`}
                    />
                    <span className="text-xs text-zinc-400">主色</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-zinc-700"
                      style={{ backgroundColor: getColorPreview(previewTheme.colors.secondary) }}
                      title={`次色: ${previewTheme.colors.secondary}`}
                    />
                    <span className="text-xs text-zinc-400">次色</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-zinc-700"
                      style={{ backgroundColor: getColorPreview(previewTheme.colors.background.dark) }}
                      title={`背景: ${previewTheme.colors.background.dark}`}
                    />
                    <span className="text-xs text-zinc-400">背景</span>
                  </div>
                </div>
              </div>

              {/* 示例按钮预览 */}
              <div className="mb-4">
                <p className="text-sm text-zinc-400 mb-2">按钮样式预览</p>
                <button
                  className={`
                    px-4 py-2 font-medium transition-all
                    bg-${previewTheme.colors.primary}
                    ${previewTheme.shape.borderRadius.md}
                    ${previewTheme.shadows.buttonShadow}
                    text-white
                  `}
                  style={{
                    // 使用内联样式确保颜色正确显示
                    backgroundColor: getColorPreview(previewTheme.colors.primary),
                  }}
                >
                  示例按钮
                </button>
              </div>

              {/* 详细信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-400 mb-1">圆角</p>
                  <p className="text-zinc-200">{previewTheme.shape.borderRadius.md}</p>
                </div>
                <div>
                  <p className="text-zinc-400 mb-1">密度</p>
                  <p className="text-zinc-200 capitalize">{previewTheme.typography.density}</p>
                </div>
              </div>
            </div>

            {/* 应用按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleApplyTheme}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                应用此风格
              </button>
              <button
                onClick={() => setPreviewTheme(null)}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
              >
                清除预览
              </button>
            </div>
          </div>
        )}

        {/* 当前风格信息 */}
        {!previewTheme && (
          <div className="mt-6 bg-zinc-800 rounded-lg p-4">
            <p className="text-sm text-zinc-400 mb-2">当前应用的风格</p>
            <p className="text-zinc-200 font-medium">{currentTheme.vibe}</p>
            <p className="text-xs text-zinc-500 mt-1">
              主色: {currentTheme.colors.primary} | 圆角: {currentTheme.shape.borderRadius.md}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

