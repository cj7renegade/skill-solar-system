# TASKS — Skill Solar System — Post-merge housekeeping and user-data backup

The previous queue (Edition 06 verify and commit) is finished. Its completed version, with every
Result line, is preserved in Git history at commit `26e9c86`.

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md` and `reports/05-housekeeping.md` first.
- Work top to bottom, one task at a time. Start at the first unchecked box.
- Work on branch `housekeeping-2026-09`, created from an up-to-date `main`. Never commit to `main`.
  Never merge. Never force-push. Never open or approve a pull request.
- When a task is done: check its box, fill in its **Result** line, commit, and move on.
- If a STOP condition triggers, do NOT continue. Write what you found under **Result**,
  mark the task `[BLOCKED]`, commit, and end the session.
- Never mark any skill proficient. Never modify node identities, edges, positions, levels, pins,
  or user proficiency data. Never open an old map copy in the app.
- Delete or move ONLY the items this file names. Anything else you think should go: report it.
- Personal maps, answer records and review sessions must never be committed.
- Environment: Windows, project at `C:\Users\hilli\OneDrive\Desktop\Skill Solar System`.
  Commands in PLATFORM.md are bash syntax; translate them for your shell without changing what they do.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

## [x] Task 0 — Confirm the merge landed (read-only, except updating local main)
**Do:**
- `git fetch origin`. Confirm `origin/main` contains commit `26e9c86`
  (`git merge-base --is-ancestor 26e9c86 origin/main`).
- Record `git status`. The only allowed uncommitted change is `Tasks/TASKS.md` (this file).
- Switch to `main` and update it with `git pull --ff-only` (this only moves local `main` forward
  to match GitHub; it cannot rewrite anything).
- Confirm the live export `Maps/Robotics-v3/Robotics-v3-Lessons.json` still has SHA-256
  `687f0916ad0ba8b6332cdc5d1084960b134818d448eae97bdd212fe8d6cefc11` and counts 298 / 82 / 1 / 381.
- List remaining local and remote branches. Report them; do not delete any.
- Create branch `housekeeping-2026-09` from `main`.
- Write `reports/06-post-merge-state.md`.
**STOP if:** `origin/main` does not contain `26e9c86`; `git pull --ff-only` refuses; there are
uncommitted changes other than this file; or the export hash or counts differ.
**Result:** Done after one stop.
- `origin/main` = `1c96ba5` (PR #15) and contains `26e9c86`.
- First pass stopped on an unstaged deletion of `tests/console-smoke.mjs`. JC did it by hand; it is
  treated as Task 2's removal done early and will be committed with `git rm` in Task 2.
- `git switch main` refused because of the TASKS.md edit, so local `main` was fast-forwarded with
  `git fetch origin main:main` (`e2632c0` → `1c96ba5`), and `housekeeping-2026-09` was pointed at it
  with `git reset --soft main`. No files changed.
- Export `687f0916…fc11`, 298/82/1/381.
- 18 local branches, 17 on GitHub; none deleted.
See `reports/06-post-merge-state.md`.

## [x] Task 1 — Fresh backup before removing anything
**Do:**
- Confirm no Electron / Skill Solar System process is running. If one is, STOP and ask JC to close it.
- Copy `Maps/`, `%APPDATA%\skill-solar-system\proficiency\` and
  `%APPDATA%\skill-solar-system\Local Storage\` to `backups/pre-housekeeping-<timestamp>/`,
  the same way as the previous queue's Task 1, and verify every SHA-256.
- Record counts, sizes and the two key checksums in `reports/07-backup.md`.
**STOP if:** any copy or checksum fails.
**Result:** Done. No app process was running. The backup is at
`backups/pre-housekeeping-20260926-174130/`: 171 files, 96.3 MB (Maps 160, proficiency 1, Local
Storage 10), every file hash-verified with 0 mismatches. Export `687f0916…fc11`, proficiency
`4cda601b…e6d0`, both unchanged. `Maps/` grew from 158 to 160 files since the last backup
(examined in Task 3). See `reports/07-backup.md`.

## [x] Task 2 — Remove the dead items JC approved
**Do:**
- Delete `.e2e-baseline/` and `.e2e-c1/`. First re-confirm nothing in `package.json`, `tests/`,
  `src/`, `authoring/` or `scripts/` references them. If they are tracked by Git, use `git rm`.
- Remove `tests/console-smoke.mjs` with `git rm` (Git history keeps it).
- Run `npm run build` and `npm test`. Results must match the last known state:
  207 tests, 201 pass, 6 skip, 0 fail.
**STOP if:** any reference is found, or any test result differs.
**Result:** Done. All three items had already been handled by JC by hand, so nothing was deleted
this session.
- `.e2e-baseline/` and `.e2e-c1/`: already gone, and no copy exists anywhere in the project or the
  top levels of OneDrive, so they were deleted, not moved. Git never tracked them, but every source
  file in them is in Git history (`reports/05-housekeeping.md` §1). `.git/info/exclude` still
  lists both (local-only, harmless, left alone).
- `tests/console-smoke.mjs`: already deleted on disk; the deletion was committed here with `git rm`.
- References: none in `package.json`, `tests/`, `src/`, `authoring/` or `scripts/`.
- `npm run build` passed; `npm test` gave 207 tests / 201 pass / 6 skip / 0 fail, matching the last
  known state.

## [x] Task 3 — Archive the superseded maps (move, never open)
**Do:**
- Create `Archive/2026-09-26-superseded-maps/` (it is already ignored by Git through `/Archive/`).
- Move, without opening them in the app, exactly these files into it:
  - `Maps/Robotics-v3/Preview-Notes.md`
  - `Maps/Robotics-v3/Content-Completion-Ledger.csv`
  - the 13 `Maps/*-with-prerequisites.json` files listed in `reports/05-housekeeping.md` §6
  - `Maps/Skill-Solar-System-Math-Academy-Marked.json`
- Add a `README.md` inside that folder, in plain language: why these were archived, that 12 of them
  hold stale proficiency answers, and that **opening any of them in the app can copy stale answers
  into the shared record, so they must not be opened.**
- Verify each moved file's SHA-256 is unchanged, and that `Maps/Skill-Solar-System.json` and the
  whole `Maps/Robotics-v3/` export set (other than the two moved files) are untouched.
- Do not touch the `Maps/` subfolders (`Archived maps`, `Backups`, `Checkpoint-2026-09-13`,
  `description-rewrite`, `Notes`, `Old-root-copies`).
- Run `npm test` again, then
  `SSS_ATLAS=Maps/Skill-Solar-System.json npm test` to confirm the six real-atlas tests still pass
  without the batch sub-maps present. If any test needs a moved file, STOP and report which.
- Write `reports/08-archive.md` listing every moved file with size and checksum.
**Result:** Done, with JC's decision.
- JC had already moved the 13 extracts and Math-Academy-Marked by hand into `Maps/Archived maps/`.
  All 14 hashes match the backup, and there are also two byte-identical `- Copy` duplicates.
- That subfolder is one the queue says not to touch, so JC chose to leave all 16 there, and nothing
  in it was changed.
- `Archive/2026-09-26-superseded-maps/` was created. `Preview-Notes.md` and
  `Content-Completion-Ledger.csv` were moved into it with their hashes unchanged, and a README
  warns never to open the old copies and says where they are.
- The other 158 `Maps/` files are byte-identical, including the master and the Robotics-v3 set.
- `npm test` 207/201/6/0; with `SSS_ATLAS`, 207/207/0/0, so no test needs a moved file.
- Nothing else changed in `Archive/`. The only other `Maps/` change is `Integration-Summary.json`,
  from the previous queue.
See `reports/08-archive.md`.

## [x] Task 4 — One-click user-data backup
**Goal:** JC's answers in `%APPDATA%\skill-solar-system\` are backed up nowhere except the copies in
`backups/`. Make backing them up (and `Maps/`) a double-click.
**Do:**
- Add `scripts/backup-user-data.ps1` and a double-click helper `Backup-User-Data.cmd` in the
  project root, matching the style of the existing `.cmd` helpers (CRLF line endings, per
  `.gitattributes`). The script must:
  - refuse to run, with a clear message, if the Skill Solar System app is open;
  - copy `Maps\` and `%APPDATA%\skill-solar-system\` into
    `%OneDrive%\Skill Solar System Backups\<yyyy-MM-dd_HHmmss>\` (outside the project folder);
  - verify every copied file by SHA-256 and print a plain summary (files, size, pass/fail);
  - keep the 10 most recent backup folders and delete older ones, only inside that backups folder;
  - never read, print or change answer contents; never write anywhere else.
- Run it once and report the result, the destination path and its size.
- Add a short "Back up your data" recipe to PLATFORM.md §11.5 pointing at the new helper.
- Commit the script and helper. They contain no personal data.
**STOP if:** `%OneDrive%` is not set, or verification fails.
**Result:** Done.
- Added `scripts/backup-user-data.ps1` (plain ASCII, runs on Windows PowerShell 5.1) and
  `Backup-User-Data.cmd` (CRLF, same style as the other helpers).
- Refusal tested: with the app open in an isolated test profile, the script printed "BACKUP NOT
  MADE: the Skill Solar System app is open…", exited 1, and made no folder.
- The real app was then found open (started 6:58 PM via `npm start`, not by this session). JC
  closed it; the proficiency record was unchanged (`4cda601b…`).
- Real run through the helper: 209 files, 90.9 MB, "Verification: PASSED", 1 backup kept, at
  `C:\Users\hilli\OneDrive\Skill Solar System Backups\2026-09-27_142456` (95,365,083 bytes).
- Independent recheck: Maps 158/158 and app data 51/51 files byte-identical.
- PLATFORM.md §11.5 now has the "Back up your data" recipe.

## [ ] Task 5 — Bring PLATFORM.md up to date
**Do:** Fix every statement this session or the previous one made false, including at least:
- §8.1 and §11.2 test totals (now 207 tests, 201 pass, 6 skip) and the
  `robotics-v3-lessons.test.mjs` count (now 18);
- "Things I could not determine" item 6 (`Tasks/TASKS.md` is now tracked and is the work queue),
  plus items 1 and 4 (the `.e2e-*` folders and `console-smoke.mjs` are removed);
- §2.6 and §10.2 mentions of the removed items;
- §2.5, noting the superseded maps now live in `Archive/2026-09-26-superseded-maps/`.
Change nothing else in PLATFORM.md.
**Result:**

## [ ] Task 6 — Push and summarize
**Do:**
- Confirm nothing under `Maps/`, `packages/`, `backups/`, `Archive/` or any answer/session data is
  staged in any commit on this branch.
- Push the branch: `git push -u origin housekeeping-2026-09`. Do not open a pull request.
- End with the plain-language summary: tasks finished or stopped and why, branch and commit IDs,
  the backup destination, and every report file written.
**Result:**

---

## NOT QUEUED — needs JC's decision first
- Moving the repository out of OneDrive (planned before the 8,000-skill work begins).
- The five structural questions in PLATFORM.md §10.3 (X06, `s-*` track, thermal, K05–K07, calculus).
- Adding a `requires_physical_evidence` field to future edition packages.
- The 8,000-skill scale stress test and platform re-architecture.
- Merging Robotics V3 into the master atlas, and the `m-logic` answer conflict.
- The coverage-inventory pass in `CLAUDE-HANDOFF.md`.
