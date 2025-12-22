import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI-Native IDE',
  description: 'Fractal infinite-canvas based IDE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="bg-zinc-950 text-zinc-50" suppressHydrationWarning>
      <body className="m-0 p-0 overflow-hidden bg-zinc-950 text-zinc-50 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

