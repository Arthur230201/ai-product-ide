/**
 * 最小 Pages Router _document，仅用于满足 Next.js 构建阶段对 _document 的查找。
 * 项目实际使用 App Router（src/app），路由与文档结构由 app/layout.tsx 控制。
 */
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
  DocumentInitialProps,
} from 'next/document';

export default class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    return Document.getInitialProps(ctx);
  }

  render() {
    return (
      <Html lang="zh-CN">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
