/**
 * Wrap body content in single-file HTML with Tailwind CDN.
 * HtmlSandboxRenderer will inject CDN again if fragment only — full doc avoids double wrap.
 * Optional runtimeFragment: e.g. JSON script for data-query-runtime (no inline JS execution required).
 */
export function wrapFullHtml(
  bodyContent: string,
  title = 'PagePlan Preview',
  runtimeFragment = ''
): string {
  const runtime = runtimeFragment ? `\n${runtimeFragment}\n` : '';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="m-0 p-0 antialiased">
${bodyContent}${runtime}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
