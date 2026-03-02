# Self Check Report (Actionable)

Generated: 2026-02-05T14:15:00.621Z

## Build/Lint/Typecheck
- Build: **pass** (/Users/qingflow/Documents/自研项目/ai-product-ide/docs/self-check/raw/build.log)
- Lint: **pass** (/Users/qingflow/Documents/自研项目/ai-product-ide/docs/self-check/raw/lint.log)
- TSC: **pass** (/Users/qingflow/Documents/自研项目/ai-product-ide/docs/self-check/raw/tsc.log)

## Immediate Red Flags
- package-lock.json present: **YES (risk)**
- If generation time jumped (200s→700s), typical causes:
  1) **rate limit backoff + cooldown** stacked with retries
  2) **RATIONALIZE / multi-pass UI pipeline** enabled by default
  3) prompt/context inflated (htmlContext/codeContext/attachmentContent too large)
  4) JSON parse/repair loops

## Next Steps (do these in order)
1) Open **LLM_CALLMAP**: find UI generation entry (node-operations.ts) and count how many LLM calls per click.
2) Open **ERRORS**: confirm if 429/cooldown is causing "等待很久但只点一次".
3) Open **HOTSPOTS**: locate where prompt gets huge (often full HTML/DOM dump + "rationality scoring" + multi-agent chain).
4) Fix uiCode.substring crash: validate response shape; never assume string.

> This report is evidence-based. Do not "patch" until call counts + prompts are measured.

