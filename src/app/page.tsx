import HomePageClient from './HomePageClient';

/** 画布为强交互页；避免 Node 22+ 在 SSG 预渲染 `/` 时触发 localStorage/undici 告警 */
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomePageClient />;
}
