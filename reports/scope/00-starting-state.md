# Scope 00 — Starting state and the Instruction Guide (Task 0)

Measured 2026-10-05.

## Repository

| | |
| --- | --- |
| `origin/main` = local `main` | `7dd9a01` (Merge pull request #17: app icon, Your maps dropdown, guided tour, right-click deselect) |
| Working tree before starting | `M Tasks/TASKS.md` (this queue) and `?? Skill-Solar-System-Instruction-Guide-v0.4.docx`; nothing else |
| Branch | `scope-foundation`, created from `main` at `7dd9a01` |
| `npm run build` | passed |
| `npm test` | **213 tests, 207 pass, 6 skipped** (the usual `SSS_ATLAS` six), **0 fail** |

## The two real maps (read-only)

| Map | Skills | Connections | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `Maps/Skill-Solar-System.json` (master) | 1,769 | 5,142 | 5,397,564 | `8e170740169f857458109f50a46b1d7feabb98e4add850350261fce8c22dba51` |
| `Maps/Robotics-v3/Robotics-v3-Lessons.json` | 381 | 894 | 2,762,626 | `687f0916ad0ba8b6332cdc5d1084960b134818d448eae97bdd212fe8d6cefc11` |

**The master has changed since the capacity queue** measured it on 2026-09-27 (`04821f06c33a…` then).
Its size and its skill and connection counts are identical, which is consistent with JC opening and
saving it in the app. This queue does not look into what changed: that may include answers, and
reading answers is out of bounds. Every later task in this queue checks that both maps still match
the hashes above.

## The Instruction Guide

| | |
| --- | --- |
| File | `Skill-Solar-System-Instruction-Guide-v0.4.docx` (project root, where JC put it) |
| Version and date | "Version 0.4 · Windows desktop edition · October 4, 2026" |
| Size, SHA-256 | 42,952 bytes, `2d23cf7fccaa03f333f4f8364bae527094fd9f82d1ac9e319ec8fb5d788b3ce3` |
| Action | Committed **unchanged**, so other users have it. JC maintains it |

### Statements the code or a report shows to be inaccurate or out of date (report only)

| # | Where in the guide | Says | What the code or a measurement shows |
| --- | --- | --- | --- |
| 1 | "Back up with the script" (end) | "The Robotics V3 map is about 2.7 MB, close to the browser-storage limit." | The browser-storage ceiling was **measured at 52.3 million characters** for one value (`reports/capacity/04-raised-limits.md`, on branch `capacity-stress-test`). A 2.7 MB map is about 5% of it, not close. PLATFORM.md §5.3 makes the same older claim |
| 2 | Same paragraph | "If a draft cannot be stored, the app tells you to save to a file" | True after an edit, but **not when a map is opened**: the warning is written and then immediately replaced by "Opened …" (`src/app.js`, `replace()`). It matters only for maps far larger than JC's |
| 3 | Quick controls; "Find a procedure" | No mention of the **? Tour** button, the **Your maps** dropdown, **right-click to deselect**, or **Create-Desktop-Shortcut** | All four were merged in PR #17 (2026-10-05), after the guide's date. Not wrong, just not yet covered |
| 4 | Quick controls, "Clear selection and fit" | "Press Escape while not typing in a field." | Still correct. Right-click now also clears the selection, **without** fitting the map |

Everything else checked against the code (the 10 MB / 5,000 / 20,000 limits, 50 Undo steps, atlas
families and dataset keys, card sections, backup script behaviour, the archived-maps warning) is
accurate.

## Outcome

No STOP condition. Task 0 complete.
