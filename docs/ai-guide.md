# The AI Guide

JC's request of 2026-11-06: *"build the cloud version with Claude, guidance only. Also create an
automatic state of the app where you can still use it offline but the AI is disconnected."*

The Guide is an optional chat panel (header ▸ **✦ Guide**) that answers questions about direction:
what to study next, a plan for the week, how far the learner is from a milestone, and how to use the
app. It answers with links that select a skill or open path mode. It is guidance only: it does not
teach lesson content, and it cannot mark proficiency or change a map.

## How it is built

| Part | File | Role |
| --- | --- | --- |
| Connection | `desktop/guide.cjs` | Main process only. Holds the API key, the connection state, the monthly cap and one Claude request per turn. |
| Bridge | `desktop/preload.cjs`, `desktop/main.cjs` | `window.desktop.guide`: status, retry, key, settings, turn, cancel, and status and text pushes. |
| Tools and loop | `src/guide.js` | System prompt, seven read-only tools over the open map, the per-question app state, the question loop, and the reply format. |
| Panel | `src/guide-panel.js` | Header indicator, panel, settings, conversation and link buttons. |

- **The page stays offline.** Its Content-Security-Policy still has `connect-src 'none'`, and
  every page request is still blocked in `main.cjs`. Only the main process reaches
  `api.anthropic.com`, through the official SDK (`@anthropic-ai/sdk` 1.6.0), which uses Node's own
  connection rather than the page's.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`) with adaptive thinking (the model default), effort
  `medium`, and streaming.
  - Server-side refusal fallback is on: `fallbacks: "default"` with the
    `server-side-fallback-2026-07-01` beta header.
  - The system prompt and tools are cached with top-level `cache_control`.
- **History is append-only.** Assistant turns go back exactly as returned, thinking blocks
  included. The per-question app state is a text block in the new user turn, so the cached prefix
  never changes.
- **The tools are read-only.** They are `get_overview`, `search_skills`, `get_skill`, `path_to`,
  `next_up`, `course_summary` and `recent_answers`.
  - All of them use the shared learner definitions in `src/learner.js`.
  - Inputs are checked against each tool's schema before running.
  - No tool returns lesson text.
  - At most 8 model turns per question.
- **Replies** are parsed into paragraphs, lists, headings, bold, code, and `skill:` and `path:`
  links only. Everything is built with `textContent`. A link to an id that is not on the open map
  stays plain text.
- **The conversation** lives in memory for the session. It is never saved, and **New** clears it.

## The automatic states

The header indicator carries the state in text, and colour only repeats it. HelixSkill works fully
offline in every state.

| State | Header | When | Leaves it |
| --- | --- | --- | --- |
| off | ● Offline | No key, or the Guide turned off | A key is saved, or the Guide is turned on |
| connecting | ◌ Guide connecting… | Checking the key and the connection | Automatically |
| online | ● Guide online | Ready | On any failure below |
| disconnected | ● Offline · Guide disconnected | No network, or Claude unreachable (including timeouts, 5xx and rate limits at check time) | **Automatically**: rechecked every 30 s, when the page reports `online`, before the next question, and on **Try now** |
| key-rejected | ● Offline · Guide key refused | The key was refused (401 or 403) | A new key is saved, or **Try now** |
| paused | ● Offline · Guide paused | This month's estimated spend reached the limit | The limit is raised, or a new month starts |

- **Checks cost nothing.** The connection check is a models lookup, which uses no tokens.
- **A drop mid-question** ends that question with a plain message and keeps the conversation. The
  input waits until the Guide is back.

## Key, privacy and cost

- **The key** is saved with Electron `safeStorage` (Windows DPAPI for the user account) in
  `userData/guide/api-key.bin`. It is never shown again. Alternatively, `ANTHROPIC_API_KEY` in the
  environment works and is never written to disk.
- **What is sent:** the questions, a short app state (date, map title, target and progress, the
  selected skill, path mode, an unfinished review) and the results of the tools the Guide calls.
  Map files and answers stay on the computer.
- **Cost:**
  - Estimated from each reply's usage at Opus 5.5 rates ($4 input / $20 output per million tokens,
    $0.20 cache reads, $5 cache writes).
  - Kept per month in `userData/guide/usage.json`.
  - The default limit is **$10 a month**, adjustable from $1 to $1,000.
  - The Anthropic Console shows the real bill.

## Tests

- `tests/guide.test.mjs` (10): the tools, input checks, the app state, the question loop
  (append-only, tool errors, refusal, failures, runaway loops, truncated input) and the reply
  format.
- `tests/guide-main.test.mjs` (9): every state change with a fake client, including dropping and
  reconnecting by itself, plus the encrypted key, the environment key, the request shape, usage
  and the limit, and message validation.
- `tests/guide-e2e.mjs` (37): the real app with a scripted client (`SSS_GUIDE_FAKE=1` in
  `tests/electron-launcher.cjs`), so no request leaves the computer. It covers saving a key, a
  question with a tool call, link buttons, an automatic disconnect while the map keeps working,
  the automatic reconnect, off and limit, and that no answer changes.

## Decisions for JC

1. **Model and effort:** Opus 5.5 at `medium`. Sonnet 5.5 would cost about half, and Haiku 5.5
   far less. Both are a one-line change (`MODEL` in `desktop/guide.cjs`).
2. **Monthly limit:** $10 by default.
3. **Saved conversations:** none for now. Should the Guide remember past sessions?
