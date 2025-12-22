'use client';

import Link from 'next/link';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-50">
      <div className="max-w-md w-full p-6 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">404</h1>
        </div>
        <h2 className="text-xl font-semibold mb-2">页面未找到</h2>
        <p className="text-zinc-400 mb-6">
          抱歉，您访问的页面不存在。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
        >
          <Home className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}















