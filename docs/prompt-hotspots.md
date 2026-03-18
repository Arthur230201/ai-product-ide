# Prompt Hotspots 分析

生成时间: 2026-03-18T10:13:41.692Z

共找到 121 个潜在超长 prompt 拼接点。

## Top 10 超长 Prompt 拼接点

1. **components/canvas/CommandBar.tsx:2580**
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

2. **app/actions/node-operations.ts:923**
   - 估算 Token 数: 1018
   - 内容长度: 4072 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 是
   - 预览: `const systemPrompt = \`# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projec...`

3. **app/actions/node-operations.ts:923**
   - 估算 Token 数: 1017
   - 内容长度: 4066 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 是
   - 预览: `systemPrompt = \`# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta....`

4. **app/actions/node-operations.ts:923**
   - 估算 Token 数: 1015
   - 内容长度: 4060 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 是
   - 预览: `Prompt = \`# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta.projec...`

5. **app/actions/ui-pipeline-new.ts:587**
   - 估算 Token 数: 698
   - 内容长度: 2789 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `const systemPrompt = \`You are a senior frontend engineer.

TASK:
Add lightweight, reliable interactions to the provided HTML to turn it into a clicka...`

6. **app/actions/ui-pipeline-new.ts:587**
   - 估算 Token 数: 696
   - 内容长度: 2783 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `systemPrompt = \`You are a senior frontend engineer.

TASK:
Add lightweight, reliable interactions to the provided HTML to turn it into a clickable pr...`

7. **app/actions/ui-pipeline-new.ts:587**
   - 估算 Token 数: 695
   - 内容长度: 2777 字符
   - 包含字符串拼接: 是
   - 包含模板字符串: 否
   - 预览: `Prompt = \`You are a senior frontend engineer.

TASK:
Add lightweight, reliable interactions to the provided HTML to turn it into a clickable prototyp...`

8. **app/actions/generate-graph.ts:251**
   - 估算 Token 数: 565
   - 内容长度: 2259 字符
   - 包含字符串拼接: 否
   - 包含模板字符串: 是
   - 预览: `const userPrompt = \`# Role
AI Product Consultant & Requirement Analyst.

# Task
Analyze the user input (including any uploaded files) to determine if...`

9. **app/actions/generate-graph.ts:251**
   - 估算 Token 数: 564
   - 内容长度: 2253 字符
   - 包含字符串拼接: 否
   - 包含模板字符串: 是
   - 预览: `userPrompt = \`# Role
AI Product Consultant & Requirement Analyst.

# Task
Analyze the user input (including any uploaded files) to determine if it co...`

10. **app/actions/generate-graph.ts:251**
   - 估算 Token 数: 563
   - 内容长度: 2249 字符
   - 包含字符串拼接: 否
   - 包含模板字符串: 是
   - 预览: `Prompt = \`# Role
AI Product Consultant & Requirement Analyst.

# Task
Analyze the user input (including any uploaded files) to determine if it contai...`


## 所有 Prompt Hotspots

1. **components/canvas/CommandBar.tsx:2580** - 1105 tokens
2. **app/actions/node-operations.ts:923** - 1018 tokens
3. **app/actions/node-operations.ts:923** - 1017 tokens
4. **app/actions/node-operations.ts:923** - 1015 tokens
5. **app/actions/ui-pipeline-new.ts:587** - 698 tokens
6. **app/actions/ui-pipeline-new.ts:587** - 696 tokens
7. **app/actions/ui-pipeline-new.ts:587** - 695 tokens
8. **app/actions/generate-graph.ts:251** - 565 tokens
9. **app/actions/generate-graph.ts:251** - 564 tokens
10. **app/actions/generate-graph.ts:251** - 563 tokens
11. **app/actions/node-operations.ts:1033** - 545 tokens
12. **app/actions/node-operations.ts:1033** - 542 tokens
13. **app/actions/node-operations.ts:1033** - 541 tokens
14. **app/actions/node-operations.ts:1709** - 379 tokens
15. **app/actions/node-operations.ts:1709** - 377 tokens
16. **app/actions/node-operations.ts:1709** - 376 tokens
17. **app/actions/node-operations.ts:1768** - 374 tokens
18. **app/actions/node-operations.ts:1768** - 372 tokens
19. **app/actions/node-operations.ts:1768** - 371 tokens
20. **lib/page-plan/buildFallbackPlan.ts:38** - 367 tokens
21. **components/canvas/CommandBar.tsx:2676** - 361 tokens
22. **app/actions/node-operations.ts:1241** - 356 tokens
23. **app/actions/ui-pipeline-new.ts:431** - 331 tokens
24. **app/actions/ui-pipeline-new.ts:431** - 329 tokens
25. **lib/page-plan/buildFallbackPlan.ts:291** - 318 tokens
26. **lib/page-plan/buildFallbackPlan.ts:217** - 312 tokens
27. **lib/page-plan/buildFallbackPlan.ts:262** - 311 tokens
28. **utils/jit-visual-pipeline.ts:127** - 296 tokens
29. **lib/page-plan/buildFallbackPlan.ts:245** - 290 tokens
30. **app/actions/node-operations.ts:286** - 287 tokens
31. **lib/page-plan/buildFallbackPlan.ts:193** - 287 tokens
32. **app/actions/node-operations.ts:286** - 286 tokens
33. **app/actions/node-operations.ts:286** - 284 tokens
34. **lib/page-plan/buildFallbackPlan.ts:172** - 283 tokens
35. **lib/page-plan/buildFallbackPlan.ts:148** - 261 tokens
36. **lib/page-plan/buildFallbackPlan.ts:104** - 260 tokens
37. **app/actions/generate-graph.ts:401** - 243 tokens
38. **app/api/generate-prd/route.ts:65** - 242 tokens
39. **app/api/generate-prd/route.ts:65** - 241 tokens
40. **app/api/generate-prd/route.ts:65** - 239 tokens
41. **app/actions/generate-graph.ts:401** - 238 tokens
42. **components/canvas/CommandBar.tsx:696** - 226 tokens
43. **components/canvas/CommandBar.tsx:696** - 222 tokens
44. **lib/prompts/graph-architecture-prompt.ts:6** - 221 tokens
45. **lib/ui/ui-compiler.ts:58** - 214 tokens
46. **lib/ui/ui-compiler.ts:126** - 212 tokens
47. **lib/ui/ui-compiler.ts:58** - 211 tokens
48. **lib/ui/ui-compiler.ts:126** - 209 tokens
49. **lib/ui/ui-compiler.ts:201** - 195 tokens
50. **lib/ui/ui-compiler.ts:201** - 192 tokens
51. **components/canvas/CommandBar.tsx:551** - 162 tokens
52. **components/canvas/CommandBar.tsx:551** - 157 tokens
53. **app/actions/node-operations.ts:558** - 141 tokens
54. **app/actions/node-operations.ts:164** - 122 tokens
55. **lib/ai/llm-mock.ts:24** - 102 tokens
56. **lib/prompts/intent-processor.ts:54** - 102 tokens
57. **lib/prompts/intent-processor.ts:54** - 101 tokens
58. **lib/ai/llm-mock.ts:161** - 96 tokens
59. **app/actions/node-operations.ts:394** - 95 tokens
60. **app/actions/node-operations.ts:394** - 93 tokens
61. **app/actions/node-operations.ts:394** - 92 tokens
62. **lib/page-plan/schema/pagePlan.zod.ts:166** - 84 tokens
63. **app/api/generate-prd/route.ts:107** - 83 tokens
64. **app/api/generate-prd/route.ts:107** - 82 tokens
65. **app/api/generate-prd/route.ts:107** - 81 tokens
66. **app/actions/ui-pipeline-new.ts:287** - 79 tokens
67. **components/canvas/CommandBar.tsx:3060** - 79 tokens
68. **components/canvas/CommandBar.tsx:3060** - 77 tokens
69. **components/canvas/CommandBar.tsx:3060** - 76 tokens
70. **app/actions/ui-pipeline-new.ts:644** - 74 tokens
71. **app/actions/ui-pipeline-new.ts:484** - 71 tokens
72. **app/api/page-plan/synthesize/route.ts:87** - 67 tokens
73. **app/actions/ui-pipeline-new.ts:274** - 66 tokens
74. **app/api/page-plan/synthesize/route.ts:87** - 66 tokens
75. **app/actions/ui-pipeline-new.ts:274** - 64 tokens
76. **app/actions/ui-pipeline-new.ts:274** - 63 tokens
77. **app/actions/node-operations.ts:413** - 62 tokens
78. **app/actions/node-operations.ts:225** - 61 tokens
79. **app/actions/node-operations.ts:225** - 60 tokens
80. **app/actions/node-operations.ts:413** - 60 tokens
81. **app/actions/node-operations.ts:225** - 59 tokens
82. **app/actions/node-operations.ts:413** - 59 tokens
83. **app/actions/node-operations.ts:296** - 59 tokens
84. **app/actions/node-operations.ts:296** - 57 tokens
85. **app/actions/node-operations.ts:296** - 56 tokens
86. **lib/prompts/intent-processor.ts:58** - 56 tokens
87. **lib/prompts/intent-processor.ts:58** - 55 tokens
88. **types/fractal.ts:12** - 51 tokens
89. **lib/prompts/intent-processor.ts:49** - 50 tokens
90. **lib/prompts/intent-processor.ts:49** - 49 tokens
91. **app/actions/node-operations.ts:1311** - 48 tokens
92. **app/actions/node-operations.ts:1311** - 47 tokens
93. **lib/prompts/intent-processor.ts:61** - 43 tokens
94. **app/actions/node-operations.ts:238** - 42 tokens
95. **app/actions/node-operations.ts:569** - 42 tokens
96. **lib/prompts/intent-processor.ts:61** - 42 tokens
97. **app/actions/node-operations.ts:542** - 41 tokens
98. **app/actions/node-operations.ts:1814** - 40 tokens
99. **app/actions/node-operations.ts:542** - 39 tokens
100. **app/actions/node-operations.ts:307** - 39 tokens
101. **app/actions/node-operations.ts:542** - 38 tokens
102. **app/actions/node-operations.ts:432** - 37 tokens
103. **app/api/page-plan/synthesize/route.ts:104** - 36 tokens
104. **app/actions/ui-pipeline-new.ts:478** - 35 tokens
105. **app/actions/ui-pipeline-new.ts:638** - 35 tokens
106. **app/api/page-plan/synthesize/route.ts:104** - 35 tokens
107. **app/actions/ui-pipeline-new.ts:478** - 34 tokens
108. **app/actions/ui-pipeline-new.ts:638** - 34 tokens
109. **app/actions/node-operations.ts:174** - 33 tokens
110. **app/actions/ui-pipeline-new.ts:478** - 33 tokens
111. **app/actions/ui-pipeline-new.ts:638** - 33 tokens
112. **app/actions/generate-tailwind-config.ts:127** - 31 tokens
113. **app/api/generate-static-ui/route.ts:40** - 18 tokens
114. **lib/page-plan/__tests__/validatePlan.test.ts:57** - 16 tokens
115. **app/api/generate-static-ui/route.ts:40** - 15 tokens
116. **lib/prompts/domains/management-system.ts:20** - 14 tokens
117. **lib/prompts/domains/ecommerce.ts:19** - 13 tokens
118. **app/actions/generate-tailwind-config.ts:111** - 12 tokens
119. **lib/prompts/domains/ecommerce.ts:19** - 12 tokens
120. **lib/prompts/domains/management-system.ts:20** - 12 tokens
121. **app/actions/generate-tailwind-config.ts:111** - 11 tokens
