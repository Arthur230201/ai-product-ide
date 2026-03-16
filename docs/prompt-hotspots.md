# Prompt Hotspots 分析

生成时间: 2026-03-10T05:00:02.037Z

共找到 115 个潜在超长 prompt 拼接点。

## Top 10 超长 Prompt 拼接点

1. **components/canvas/CommandBar.tsx:2015**
   - 估算 Token 数: 1105
   - 内容长度: 4419 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 是
   - 预览: `Prompt = \`**任务：精确复刻HTML文件为React组件（100%一致）**

用户上传了一个HTML文件，要求精确复刻其UI设计，包括所有颜色、布局、样式、字体、图标等细节。

文件名：${htmlAttachment.name}

HTML完整内容：
\\`\\`\\`html
${...`

2. **lib/prompts/graph-architecture-prompt.ts:7**
   - 估算 Token 数: 1028
   - 内容长度: 4109 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `PROMPT = \`你是一个「产品信息架构师 + 用户流程设计师 + 业务事件建模师」。你的输出必须严格符合系统可解析的 Schema：仅允许返回图已生成（graph_generated）或 SingleCallResultSchema（clarity + graph）。禁止返回澄清请求（clar...`

3. **app/actions/node-operations.ts:700**
   - 估算 Token 数: 1012
   - 内容长度: 4046 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 是
   - 预览: `const systemPrompt = \`# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projec...`

4. **app/actions/node-operations.ts:700**
   - 估算 Token 数: 1010
   - 内容长度: 4040 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 是
   - 预览: `systemPrompt = \`# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta....`

5. **app/actions/node-operations.ts:700**
   - 估算 Token 数: 1009
   - 内容长度: 4034 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 是
   - 预览: `Prompt = \`# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta.projec...`

6. **app/actions/ui-pipeline-new.ts:513**
   - 估算 Token 数: 698
   - 内容长度: 2789 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `const systemPrompt = \`You are a senior frontend engineer.

TASK:
Add lightweight, reliable interactions to the provided HTML to turn it into a clicka...`

7. **app/actions/ui-pipeline-new.ts:513**
   - 估算 Token 数: 696
   - 内容长度: 2783 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `systemPrompt = \`You are a senior frontend engineer.

TASK:
Add lightweight, reliable interactions to the provided HTML to turn it into a clickable pr...`

8. **app/actions/ui-pipeline-new.ts:513**
   - 估算 Token 数: 695
   - 内容长度: 2777 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `Prompt = \`You are a senior frontend engineer.

TASK:
Add lightweight, reliable interactions to the provided HTML to turn it into a clickable prototyp...`

9. **app/actions/node-operations.ts:809**
   - 估算 Token 数: 545
   - 内容长度: 2180 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `const defaultUserPrompt = \`Analyze the uploaded image and generate production-ready React + Tailwind CSS code.

**Step 1: Classify the Image**
- Is t...`

10. **app/actions/node-operations.ts:809**
   - 估算 Token 数: 542
   - 内容长度: 2167 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `UserPrompt = \`Analyze the uploaded image and generate production-ready React + Tailwind CSS code.

**Step 1: Classify the Image**
- Is this a high-fi...`


## 所有 Prompt Hotspots

1. **components/canvas/CommandBar.tsx:2015** - 1105 tokens
2. **lib/prompts/graph-architecture-prompt.ts:7** - 1028 tokens
3. **app/actions/node-operations.ts:700** - 1012 tokens
4. **app/actions/node-operations.ts:700** - 1010 tokens
5. **app/actions/node-operations.ts:700** - 1009 tokens
6. **app/actions/ui-pipeline-new.ts:513** - 698 tokens
7. **app/actions/ui-pipeline-new.ts:513** - 696 tokens
8. **app/actions/ui-pipeline-new.ts:513** - 695 tokens
9. **app/actions/node-operations.ts:809** - 545 tokens
10. **app/actions/node-operations.ts:809** - 542 tokens
11. **app/actions/node-operations.ts:809** - 541 tokens
12. **app/actions/generate-graph.ts:251** - 538 tokens
13. **app/actions/generate-graph.ts:251** - 536 tokens
14. **app/actions/generate-graph.ts:251** - 535 tokens
15. **app/actions/node-operations.ts:1402** - 379 tokens
16. **app/actions/node-operations.ts:1402** - 377 tokens
17. **app/actions/node-operations.ts:1402** - 376 tokens
18. **app/actions/node-operations.ts:1461** - 374 tokens
19. **app/actions/node-operations.ts:1461** - 372 tokens
20. **app/actions/node-operations.ts:1461** - 371 tokens
21. **lib/page-plan/buildFallbackPlan.ts:38** - 367 tokens
22. **components/canvas/CommandBar.tsx:2111** - 361 tokens
23. **app/actions/node-operations.ts:1017** - 341 tokens
24. **app/actions/ui-pipeline-new.ts:366** - 331 tokens
25. **app/actions/ui-pipeline-new.ts:366** - 329 tokens
26. **lib/page-plan/buildFallbackPlan.ts:291** - 318 tokens
27. **lib/page-plan/buildFallbackPlan.ts:217** - 312 tokens
28. **lib/page-plan/buildFallbackPlan.ts:262** - 311 tokens
29. **utils/jit-visual-pipeline.ts:127** - 296 tokens
30. **lib/page-plan/buildFallbackPlan.ts:245** - 290 tokens
31. **app/actions/node-operations.ts:132** - 287 tokens
32. **lib/page-plan/buildFallbackPlan.ts:193** - 287 tokens
33. **app/actions/node-operations.ts:132** - 286 tokens
34. **app/actions/node-operations.ts:132** - 284 tokens
35. **lib/page-plan/buildFallbackPlan.ts:172** - 283 tokens
36. **lib/page-plan/buildFallbackPlan.ts:148** - 261 tokens
37. **lib/page-plan/buildFallbackPlan.ts:104** - 260 tokens
38. **app/actions/generate-graph.ts:403** - 243 tokens
39. **app/api/generate-prd/route.ts:65** - 242 tokens
40. **app/api/generate-prd/route.ts:65** - 241 tokens
41. **app/api/generate-prd/route.ts:65** - 239 tokens
42. **app/actions/generate-graph.ts:403** - 238 tokens
43. **components/canvas/CommandBar.tsx:589** - 227 tokens
44. **components/canvas/CommandBar.tsx:589** - 223 tokens
45. **lib/ui/ui-compiler.ts:58** - 214 tokens
46. **lib/ui/ui-compiler.ts:126** - 212 tokens
47. **lib/ui/ui-compiler.ts:58** - 211 tokens
48. **lib/ui/ui-compiler.ts:126** - 209 tokens
49. **lib/ui/ui-compiler.ts:201** - 195 tokens
50. **lib/ui/ui-compiler.ts:201** - 192 tokens
51. **lib/ai/llm-mock.ts:24** - 102 tokens
52. **lib/prompts/intent-processor.ts:54** - 102 tokens
53. **lib/prompts/intent-processor.ts:54** - 101 tokens
54. **app/actions/node-operations.ts:240** - 95 tokens
55. **app/actions/node-operations.ts:240** - 93 tokens
56. **app/actions/node-operations.ts:240** - 92 tokens
57. **lib/ai/llm-mock.ts:161** - 88 tokens
58. **lib/page-plan/schema/pagePlan.zod.ts:166** - 84 tokens
59. **app/api/generate-prd/route.ts:107** - 83 tokens
60. **app/api/generate-prd/route.ts:107** - 82 tokens
61. **app/api/generate-prd/route.ts:107** - 81 tokens
62. **app/actions/ui-pipeline-new.ts:222** - 79 tokens
63. **app/actions/ui-pipeline-new.ts:570** - 74 tokens
64. **app/actions/ui-pipeline-new.ts:410** - 71 tokens
65. **app/api/page-plan/synthesize/route.ts:87** - 67 tokens
66. **app/actions/ui-pipeline-new.ts:209** - 66 tokens
67. **app/api/page-plan/synthesize/route.ts:87** - 66 tokens
68. **app/actions/ui-pipeline-new.ts:209** - 64 tokens
69. **app/actions/ui-pipeline-new.ts:209** - 63 tokens
70. **app/actions/node-operations.ts:259** - 62 tokens
71. **app/actions/node-operations.ts:71** - 61 tokens
72. **app/actions/node-operations.ts:71** - 60 tokens
73. **app/actions/node-operations.ts:259** - 60 tokens
74. **app/actions/node-operations.ts:71** - 59 tokens
75. **app/actions/node-operations.ts:259** - 59 tokens
76. **app/actions/node-operations.ts:142** - 59 tokens
77. **app/actions/node-operations.ts:142** - 57 tokens
78. **app/actions/node-operations.ts:142** - 56 tokens
79. **lib/prompts/intent-processor.ts:58** - 56 tokens
80. **lib/prompts/intent-processor.ts:58** - 55 tokens
81. **types/fractal.ts:12** - 51 tokens
82. **lib/prompts/intent-processor.ts:49** - 50 tokens
83. **lib/prompts/intent-processor.ts:49** - 49 tokens
84. **app/actions/node-operations.ts:1084** - 48 tokens
85. **app/actions/node-operations.ts:1084** - 47 tokens
86. **app/actions/generate-graph.ts:570** - 45 tokens
87. **app/actions/generate-graph.ts:570** - 43 tokens
88. **lib/prompts/intent-processor.ts:61** - 43 tokens
89. **app/actions/node-operations.ts:84** - 42 tokens
90. **lib/prompts/intent-processor.ts:61** - 42 tokens
91. **app/actions/node-operations.ts:1507** - 40 tokens
92. **app/actions/node-operations.ts:153** - 39 tokens
93. **app/actions/node-operations.ts:385** - 39 tokens
94. **app/actions/node-operations.ts:400** - 38 tokens
95. **app/actions/node-operations.ts:385** - 37 tokens
96. **app/actions/node-operations.ts:278** - 37 tokens
97. **app/actions/node-operations.ts:385** - 36 tokens
98. **app/api/page-plan/synthesize/route.ts:104** - 36 tokens
99. **app/actions/ui-pipeline-new.ts:404** - 35 tokens
100. **app/actions/ui-pipeline-new.ts:564** - 35 tokens
101. **app/api/page-plan/synthesize/route.ts:104** - 35 tokens
102. **app/actions/ui-pipeline-new.ts:404** - 34 tokens
103. **app/actions/ui-pipeline-new.ts:564** - 34 tokens
104. **app/actions/ui-pipeline-new.ts:404** - 33 tokens
105. **app/actions/ui-pipeline-new.ts:564** - 33 tokens
106. **app/actions/generate-tailwind-config.ts:127** - 31 tokens
107. **app/api/generate-static-ui/route.ts:26** - 18 tokens
108. **lib/page-plan/__tests__/validatePlan.test.ts:57** - 16 tokens
109. **app/api/generate-static-ui/route.ts:26** - 15 tokens
110. **lib/prompts/domains/management-system.ts:20** - 14 tokens
111. **lib/prompts/domains/ecommerce.ts:19** - 13 tokens
112. **app/actions/generate-tailwind-config.ts:111** - 12 tokens
113. **lib/prompts/domains/ecommerce.ts:19** - 12 tokens
114. **lib/prompts/domains/management-system.ts:20** - 12 tokens
115. **app/actions/generate-tailwind-config.ts:111** - 11 tokens
