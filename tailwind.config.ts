import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 确保动态生成的 Tailwind 类也能被应用
  // 注意：任意值类（如 w-[375px]）无法通过 safelist 匹配，但它们会在运行时应用
  safelist: [
    // 常用的任意值类（显式列出）
    'w-[375px]', 'h-[812px]',
    // 使用更广泛的模式匹配
    {
      pattern: /^(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|space-x|space-y)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    {
      pattern: /^(text|leading|tracking)-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
    },
    {
      pattern: /^(font)-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/,
    },
    {
      pattern: /^(w|h|max-w|max-h|min-w|min-h)-(full|screen|auto|fit|min|max|1\/2|1\/3|2\/3|1\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|5\/6|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    {
      pattern: /^(bg|text|border|ring|divide|outline|from|via|to|placeholder)-(transparent|current|black|white|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    {
      pattern: /^(bg|text|border|ring|divide)-(white|black|transparent|current)/,
    },
    {
      pattern: /^(rounded|rounded-t|rounded-r|rounded-b|rounded-l|rounded-tl|rounded-tr|rounded-bl|rounded-br)-(none|sm|md|lg|xl|2xl|3xl|full)/,
    },
    {
      pattern: /^(flex|grid|block|inline-block|inline|inline-flex|table|inline-table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row-group|table-row|flow-root|contents|list-item|hidden)/,
    },
    {
      pattern: /^(items|justify|content|self|place)-(start|end|center|between|around|evenly|stretch|baseline|auto|normal)/,
    },
    {
      pattern: /^(flex)-(row|row-reverse|col|col-reverse|wrap|wrap-reverse|nowrap)/,
    },
    {
      pattern: /^(gap|gap-x|gap-y)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    {
      pattern: /^(border|divide)-(0|2|4|8|t|r|b|l)/,
    },
    {
      pattern: /^(shadow|ring)-(none|sm|md|lg|xl|2xl|inner)/,
    },
    {
      pattern: /^(overflow|overflow-x|overflow-y)-(auto|hidden|clip|visible|scroll)/,
    },
    {
      pattern: /^(opacity|z)-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100|auto)/,
    },
    {
      pattern: /^(transform|scale|rotate|translate|skew)-(none|gpu|0|50|75|90|95|100|105|110|125|150)/,
    },
    {
      pattern: /^(cursor|select|pointer-events|resize|appearance|outline|outline-offset)-(none|auto|default|pointer|wait|text|move|help|not-allowed|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out|grab|grabbing|text|all|auto|0|1|2|4|8)/,
    },
    {
      pattern: /^(transition|duration|ease|delay)-(none|all|colors|opacity|shadow|transform|75|100|150|200|300|500|700|1000|linear|in|out|in-out|0|75|100|150|200|300|500|700|1000)/,
    },
    {
      pattern: /^(grid-cols|grid-rows|col-span|row-span|col-start|col-end|row-start|row-end)-(1|2|3|4|5|6|7|8|9|10|11|12|none|auto|span-1|span-2|span-3|span-4|span-5|span-6|span-7|span-8|span-9|span-10|span-11|span-12|span-full)/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;

