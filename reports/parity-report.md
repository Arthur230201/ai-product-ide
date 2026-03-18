# Parity Report (Golden30)

- engineVersion: uupm-ts-engine-data@0.0.2
- cases: 120
- styleHitRate: 100.0%
- antiOkRate: 95.8%
- patternOkRate: 96.7%
- colorsOkRate: 100.0%
- typographyOkRate: 100.0%
- effectsOkRate: 100.0%
- patternDiversity: 45.8%
- paletteDiversity: 41.7%
- typographyDiversity: 35.0%
- effectsDiversity: 35.0%
- longtailSpecialHitRate: 100.0% (cases=80)
- avgTotal: 99.5 / 100

## Worst 8 cases (by total score)

- **gen:零售:admin:v1**: total=90, style=gen-零售-admin (expect gen-零售-admin); notes=pattern 未命中推断形态（trace）
- **gen:零售:admin:v2**: total=90, style=gen-零售-admin (expect gen-零售-admin); notes=pattern 未命中推断形态（trace）
- **gen:保险:admin:v1**: total=90, style=gen-保险-admin (expect gen-保险-admin); notes=pattern 未命中推断形态（trace）
- **gen:文旅:admin:v1**: total=90, style=gen-文旅-admin (expect gen-文旅-admin); notes=pattern 未命中推断形态（trace）
- **fintech trust**: total=92.8, style=gen-fintech-approval (expect gen-fintech-approval); notes=antiPatterns 行业强相关不足（need>=2, got=1）；a11yRules 条数不足（len=2）
- **fintech approval flow**: total=92.8, style=gen-fintech-approval (expect gen-fintech-approval); notes=antiPatterns 行业强相关不足（need>=2, got=1）；a11yRules 条数不足（len=2）
- **fintech dashboard**: total=95, style=gen-fintech-approval (expect gen-fintech-approval); notes=a11yRules 条数不足（len=2）
- **saas dashboard**: total=97.8, style=saas-dashboard-neutral (expect saas-dashboard-neutral); notes=antiPatterns 行业强相关不足（need>=2, got=0）；antiPatterns 行业关键字命中弱（hits=0）

## Files
- JSON: reports/parity-report.json
- Markdown: reports/parity-report.md
