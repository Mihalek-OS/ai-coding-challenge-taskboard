# Summary

## Functionality
- **Done:** Kanban board (To Do / In Progress / Done) with empty states; create, edit, delete, status change (dropdown); KPI cards (Total / In progress / Done) computed from fetched tasks; FastAPI + SQLite backend with validation, 201/404/422 codes and `/docs`; data persists across refresh and backend restart.
- **Not done:** drag & drop, delete confirmation, mobile layout (all optional). The Claude Design system was not available, so the UI uses a Claude-inspired palette (see README). Tested in Chrome only. One lint warning remains (oxlint `react/set-state-in-effect`, `App.tsx:25`, false positive: state is set after an `await`).
- **Acceptance tests (PDF 2.10): 10/10 passed** in headless Chrome against the real frontend and backend with an isolated temp DB. Also: 20 backend pytest tests pass; `tsc -b` and the production build are clean.

## Time and models
About 48 minutes wall-clock (13:09 to 13:57 on 2026-10-09), including approval pauses; ccusage shows active session time of about 23 minutes. Claude Sonnet 5.5 only, for planning, backend, frontend, browser verification, docs and the pre-publication audit. No other models, subagents or Claude Design generations.

## Tokens and cost
Source: `npx ccusage@latest claude session --json`, this project only (`evidence/ccusage-session-ai-coding-test.json`), captured 2026-10-09 12:05 UTC.

| Session | Input | Output | Cache read | Cache creation | Total | Est. cost |
|---|---:|---:|---:|---:|---:|---:|
| Build | 68 | 41,393 | 2,958,159 | 88,951 | 3,088,571 | $1.07 |
| Audit (running at capture) | 20 | 5,217 | 753,195 | 46,876 | 805,308 | $0.32 |
| **Total** | 88 | 46,610 | 3,711,354 | 135,827 | 3,893,879 | **$1.38** |

- **Estimated API cost** is a ccusage estimate at API list prices, not a bill; the audit figure was still growing at capture.
- **Actual additional spending: unverified.** Expected $0 (Claude Team subscription, no API key, no extra usage); ccusage cannot confirm this, so check the plan's billing before submission.

## Strategy and lessons
- Six approval-gated phases (setup, backend, frontend, integration, verification, docs) with data model, endpoints and acceptance criteria defined up front, so little rework.
- Token savers: one model, no Opus; one file per layer, no ORM or UI library; client-side KPIs; small targeted edits; short reports; no `/clear` or `/compact`.
- Scripted verification (pytest plus a Playwright script outside the repo) caught real bugs: stale UI after failed requests, and a lost error message after resync.
- Lessons: cache reads are about 95% of tokens, but cost comes mostly from output and cache writes; heredoc-heavy shell commands failed once on quoting, and the Write tool was cheaper than retrying.
