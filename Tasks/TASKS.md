# TASKS — Skill Solar System / Robotics V3 — Cleanup and Edition 06 commit

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md` first. It is the reference for how this repo works.
- Work top to bottom, one task at a time. Start at the first unchecked box.
- Work on branch `edition-06-integration`. Never commit to `main`. Never merge. Never force-push.
- When a task is done: check its box, fill in its **Result** line, commit, and move on.
- If a STOP condition triggers, do NOT continue. Write what you found under **Result**,
  mark the task `[BLOCKED]`, commit, and end the session.
- Never mark any skill proficient. Lesson availability is not mastery.
- Never modify node identities, edges, positions, levels, pins, or user proficiency data.
- Never edit anything under `packages/`. Never hand-edit `Maps/Robotics-v3/Robotics-v3-Lessons.json`.
- Never delete files. Housekeeping tasks report and recommend only.
- Dataset key must remain `robotics-curriculum-v3`.
- Personal maps, answer records and review sessions must never be committed.

## Expected state (gates)
| State | Authored | Pending | Roadmap | Total | Export SHA-256 starts |
|---|---:|---:|---:|---:|---|
| Last commit `7c95db6` | 292 | 88 | 1 | 381 | `ad9ba478` |
| Export on disk now (Edition 06 applied, uncommitted) | 298 | 82 | 1 | 381 | `687f0916` |

---

## [x] Task 0 — Confirm the working tree matches PLATFORM.md §9.4 (read-only)
**Do:**
- Record `git status`, the current branch, and `HEAD`. Confirm `HEAD` is `7c95db6`.
- List every modified and untracked file. Compare against PLATFORM.md §9.4:
  modified `authoring/robotics-v3/apply-lessons.mjs`, `src/lesson.js`,
  `tests/robotics-v3-lessons.test.mjs`; untracked `authoring/robotics-v3/build-edition06-package.mjs`,
  `tests/robotics-v3-edition06-e2e.mjs`; plus `docs/PLATFORM.md` if uncommitted.
- Count the live export: authored / pending / roadmap / total. Record its SHA-256 and dataset key.
- Confirm `packages/repeatable-work-system-learning-edition-06/` exists and list its files.
- If not already on it, create the branch with `git switch -c edition-06-integration`
  (this carries the uncommitted work over without changing it).
- Write findings to `reports/00-current-state.md`.
**STOP if:** `HEAD` is not `7c95db6`; there are uncommitted changes not listed above (list them);
counts are not 298 / 82 / 1 / 381; or the Edition 06 package is missing.
**Result:** Done. First pass stopped on two deviations: HEAD was `1dab1dd` (adds only
`docs/PLATFORM.md` over `7c95db6`), and there was an unlisted `Edition06-Integration-Summary.md`.
JC accepted `1dab1dd` as the baseline and included the summary in the Edition 06 work. The export
measures 298 / 82 / 1 / 381, SHA-256 `687f0916ad0b…fc11`, and the dataset key is
`robotics-curriculum-v3`. The package is present (16 files). `tooling/robotics-v3-preview` is not
merged into main: 34 commits ahead, 0 behind. Branch `edition-06-integration` was created. See
`reports/00-current-state.md`.

## [x] Task 1 — Back up everything before verifying
**Do:**
- Add `/backups/` to `.gitignore` and commit that change alone.
- Copy to `backups/pre-edition06-commit-<timestamp>/`:
  - all of `Maps/` (includes the live export and personal maps)
  - `%APPDATA%/skill-solar-system/proficiency/`
  - `%APPDATA%/skill-solar-system/Local Storage/`
- Record file counts, sizes and SHA-256 of the export and each proficiency file
  in `reports/01-backup.md`. Do not copy answer contents into the report.
**STOP if:** any copy fails or checksums of the copies do not match the originals.
**Result:** Done. `/backups/` was ignored in `e3fbffb`. The backup is at
`backups/pre-edition06-commit-20260926-163529/`: 169 files, 90.9 MB (Maps 158, proficiency 1,
Local Storage 10). Every file was hash-verified with 0 mismatches. Export `687f0916…fc11`, proficiency
`4cda601b…e6d0`. See `reports/01-backup.md`.

## [ ] Task 2 — Verify the Edition 06 import
**Do:**
- Run the package's own checks in a throwaway Python environment (PLATFORM.md §11.3 step 2).
- Dry-run `node authoring/robotics-v3/apply-lessons.mjs` and record: `result`,
  `thisRun.existingPayloadsChanged`, the four non-payload signatures, and counts.
- Run `node authoring/robotics-v3/apply-lessons.mjs --write` once and confirm it changes nothing
  (export SHA-256 identical to Task 0). This is the idempotency check.
- Confirm all 292 prior lesson payloads are unchanged versus the backup export.
- Confirm the six new entries are exactly `Q06`, `B-D08`, `E11`, `V06`, `V07`, `I05`, and that the
  I05 prerequisite closure (298 entries) has no entry missing an introductory lesson.
- Confirm edges, positions, levels, pins and `proficiency80` are identical to the backup export.
- `npm run build`, then `npm test`, then
  `SSS_V3_MAP=Maps/Robotics-v3/Robotics-v3-Lessons.json node tests/robotics-v3-e2e.mjs`, then
  `SSS_V3_MAP=Maps/Robotics-v3/Robotics-v3-Lessons.json node tests/robotics-v3-edition06-e2e.mjs`.
- If Electron can run: open cards Q06, B-D08, E11, V06, V07, I05, one prior card, one pending card and
  the roadmap card (X10), and confirm text, status lines and the hardware-evidence line display.
  If it cannot run, say so plainly.
- Write `reports/02-edition06-verification.md` with evidence for every check.
**STOP if:** any check fails, any prior payload changed, preservation signatures differ,
the rerun changes the export, or a test fails. If a test fails once, rerun it up to three
times and report every run (the repo has a known intermittent failure possibly caused by OneDrive).
**Result:**

## [ ] Task 3 — Bring the tracked records up to date
**Do:**
- Update `authoring/robotics-v3/Integration-Summary.md` to cover Editions 01–06, with the new
  counts, export SHA-256, and a link to `reports/02-edition06-verification.md`.
- Add a short note at the top of `authoring/robotics-v3/I05-Audit.md`: it describes the state at
  export `ad9ba478…`, before Edition 06; its findings about what was missing are now resolved.
  Do not change the audit's body. Do not edit `Edition06-Targets.json`.
- Update `docs/PLATFORM.md` §9 so "current state" describes the committed Edition 06 state,
  and remove the "uncommitted work" warning in §9.4 and item 7 of "Things I could not determine".
**Result:**

## [ ] Task 4 — Commit Edition 06
**Do:**
- Commit in focused commits, each with a message saying what and why:
  1. Importer, card logic and tests: `apply-lessons.mjs`, `build-edition06-package.mjs`,
     `src/lesson.js`, both test files.
  2. Records and docs: Integration-Summary, I05-Audit note, PLATFORM.md, `reports/`.
- Confirm nothing under `Maps/`, `packages/`, `backups/`, or any answer/session data is staged.
- Run `npm test` once more after committing.
- If a Git remote exists, push the branch only (`git push -u origin edition-06-integration`).
  Do not open, merge or approve a pull request. JC reviews and merges.
**STOP if:** any personal data would be committed, or tests fail after commit.
**Result:**

## [ ] Task 5 — Housekeeping report (read-only, no deletions)
**Do:** For each item, record its size, whether anything in `package.json`, `tests/`, `src/`,
`authoring/` or `scripts/` references it, and a recommendation (keep / archive / delete):
- `.e2e-baseline/` and `.e2e-c1/`
- `tests/console-smoke.mjs` (needs `playwright`, not a dependency)
- `src/knowledge.js` (only matches the 18 starter subjects)
- the old `Tasks/TASKS.md` contents, if different from this file
- older generated files in `Maps/Robotics-v3/` (`Preview-Notes.md`, `Content-Completion-Ledger.csv`)
- the older map copies in `Maps/` (e.g. `Skill-Solar-System-Math-Academy-Marked.json`,
  the `*-with-prerequisites.json` extracts). A comparison in chat found every extract fully
  contained in the current master; confirm that locally.
- Report whether the repository is inside a OneDrive folder and how large the synced tree is.
Write `reports/05-housekeeping.md`. Commit the report only.
**Result:**

---

## NOT QUEUED — needs JC's decision first
- Acting on the housekeeping recommendations (moving, archiving or deleting anything).
- Moving the repository out of OneDrive.
- The five structural questions in PLATFORM.md §10.3 (X06, `s-*` track, thermal, K05–K07, calculus).
- Merging Robotics V3 into the master atlas, and the `m-logic` answer conflict.
- The 8,000-skill scale stress test and platform re-architecture.
- The coverage-inventory pass in `CLAUDE-HANDOFF.md`.
