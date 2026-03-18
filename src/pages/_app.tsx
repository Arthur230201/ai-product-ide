/**
 * 最小 Pages Router _app，与 _document 一起满足 Next 构建对 pages 的检查。
 * 项目实际使用 App Router，入口为 src/app。
 */
import type { AppProps } from 'next/app';

export default function CustomApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
