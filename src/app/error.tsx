'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-md w-full p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-semibold">出现错误</h2>
        </div>
        <p className="text-zinc-300 mb-4">
          {error.message || '应用程序遇到了意外错误'}
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-500 mb-4">错误 ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      </div>
    </div>
  );
}

