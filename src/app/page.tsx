'use client';

import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas';
import { ProjectToolbar } from '@/components/canvas/ProjectToolbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StoreHydration } from '@/components/canvas/StoreHydration';

export default function Home() {
  return (
    <main className="fixed inset-0 w-full h-full bg-zinc-950 text-zinc-50 overflow-hidden" suppressHydrationWarning>
      <ErrorBoundary>
        <StoreHydration />
        <ProjectToolbar />
        <InfiniteCanvas />
      </ErrorBoundary>
    </main>
  );
}