'use client';

import { useState, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { FolderOpen, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 项目恢复工具组件
 * 用于检查和恢复丢失的项目数据
 */
export function ProjectRecovery() {
  const { loadProject } = useCanvasStore();
  const [localStorageData, setLocalStorageData] = useState<string | null>(null);
  const [recoveredData, setRecoveredData] = useState<any>(null);

  // 检查 localStorage 中的数据
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('fractal-canvas-storage');
      setLocalStorageData(stored);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecoveredData(parsed);
      }
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
  }, []);

  const handleRecoverFromLocalStorage = () => {
    if (!recoveredData?.state) {
      toast.error('未找到可恢复的数据');
      return;
    }

    try {
      const { nodes, edges } = recoveredData.state;
      if (nodes && edges) {
        loadProject({ nodes, edges });
        toast.success(`已恢复 ${nodes.length} 个节点和 ${edges.length} 条边`);
      } else {
        toast.error('数据格式不正确');
      }
    } catch (error) {
      toast.error('恢复失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleExportLocalStorage = () => {
    if (!localStorageData) {
      toast.error('没有可导出的数据');
      return;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `recovered-project-${timestamp}.json`;
      
      const blob = new Blob([localStorageData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('已导出到下载文件夹');
    } catch (error) {
      toast.error('导出失败');
    }
  };

  const handleLoadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // 支持两种格式：直接的项目数据或 localStorage 格式
        let nodes, edges;
        if (data.nodes && data.edges) {
          // 直接的项目格式
          nodes = data.nodes;
          edges = data.edges;
        } else if (data.state?.nodes && data.state?.edges) {
          // localStorage 格式
          nodes = data.state.nodes;
          edges = data.state.edges;
        } else {
          toast.error('文件格式不正确');
          return;
        }

        loadProject({ nodes, edges });
        toast.success(`已加载 ${nodes.length} 个节点和 ${edges.length} 条边`);
      } catch (error) {
        toast.error('文件解析失败: ' + (error instanceof Error ? error.message : String(error)));
      }
    };
    reader.readAsText(file);
  };

  if (!localStorageData && !recoveredData) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg p-4 shadow-xl max-w-md">
        <h3 className="text-zinc-200 font-semibold mb-2">项目恢复</h3>
        <p className="text-zinc-400 text-sm mb-4">未在浏览器中找到保存的项目数据</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-zinc-300 text-sm cursor-pointer hover:text-white">
            <FolderOpen className="w-4 h-4" />
            <span>从文件恢复</span>
            <input
              type="file"
              accept=".json"
              onChange={handleLoadFromFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg p-4 shadow-xl max-w-md">
      <h3 className="text-zinc-200 font-semibold mb-2">项目恢复工具</h3>
      
      {recoveredData?.state && (
        <div className="mb-4 p-3 bg-zinc-800/50 rounded border border-zinc-700">
          <p className="text-zinc-300 text-sm mb-1">
            找到保存的数据：
          </p>
          <p className="text-zinc-400 text-xs">
            节点: {recoveredData.state.nodes?.length || 0} 个
          </p>
          <p className="text-zinc-400 text-xs">
            边: {recoveredData.state.edges?.length || 0} 条
          </p>
        </div>
      )}

      <div className="space-y-2">
        {recoveredData?.state && (
          <button
            onClick={handleRecoverFromLocalStorage}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            从浏览器恢复
          </button>
        )}
        
        {localStorageData && (
          <button
            onClick={handleExportLocalStorage}
            className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            导出为文件备份
          </button>
        )}

        <label className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-md text-sm cursor-pointer transition-colors">
          <FolderOpen className="w-4 h-4" />
          <span>从文件恢复</span>
          <input
            type="file"
            accept=".json"
            onChange={handleLoadFromFile}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
