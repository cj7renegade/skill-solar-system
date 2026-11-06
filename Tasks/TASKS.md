# TASKS — HelixSkill — Foundation splits (step 6)

Step 6 of `reports/scope/07-checkpoint.md` §2 (packages 4–7 of `reports/scope/06-wave-plan.md`). JC
asked for it on 2026-11-05 ("Let's queue up step 6"). **Not started.**

This queue adds new skills to the working map, `Maps/Robotics-Atlas.json`, and writes **no
lessons**. Lessons for the new skills belong to step 7 ("plus one per new skill"). Everything is
built in `C:\sss-scratch\splits\` first. The working map is replaced only after JC's go at
Checkpoint B, and the version it replaces is kept in `Maps/Backups/`.

The previous queue (robotics completions) is preserved in Git: merged in PR #22, its final queue
file at `a63ad2c`.

## What is already known (measured 2026-11-05, before drafting)

- **Working map:** `Maps/Robotics-Atlas.json`, SHA-256 `ba823b0d…4719f8c`. 1,920 skills, 5,714
  connections, 306 lessons, 308 answers in the file. JC's answer record: `23471d5c…`, 311 entries.
- **36 candidates** in the four foundation domains (`scope/branches.json`: 33 *split a broad skill*,
  3 *proposed new skill*):

  | Domain | Branches | Candidates |
  | --- | --- | ---: |
  | Physics | P2, P3, P5, P6, P7 | 8 (7 split, 1 new) |
  | Electronics | E1, E2, E3, E4, E5, E8 | 12 (10 split, 2 new) |
  | Mechanics | S1–S7 | 10 (all split) |
  | Computing | C1, C2, C3, C6 | 6 (all split) |

  The mathematics branches (M1–M3) hold only planning tasks, which belong to step 8. The P7
  planning task (camera-model prerequisites) and the deferred P7 item stay out.
- **None of the skills being split has an answer**, in the file or in JC's record. So no answer can
  be moved, copied or lost. A split never removes or renames the broad skill; it adds a narrower one
  beside it.
- **Eight of them already have a V3 lesson** (`c-functions`, `c-testing`, `c-floats`,
  `e-decoupling`, `rob3:B-E08`, `rob3:E10`, `rob3:D10`, `rob3:D03`). Those lessons are not changed.
- **The same eight are the only ones in the I05 chain.** A new skill that becomes a
  prerequisite of something in the chain becomes **required**. Required skills without a lesson grow
  step 7's list, so each draft says whether it is required.
- **These are master-style skills, not V3 entries.** They have no planning id, so the lesson
  importer will not touch them. Their records follow the earlier content batches (for example
  `sss-dc-test-point-choice`).
- **Estimate:** 36 skills, one per candidate. The scope estimate allowed up to 108; a candidate gets
  more than one skill only where the draft shows it hides abilities a learner would mark differently.

## The plan in one paragraph

Record the starting state. Draft every new skill with its id, name, description, details, place in
the map and whether it is required; JC approves the drafts (**Checkpoint A**). Add them with a gated
structure tool built on the completions tool. Measure the result in the app and update the scope
records. JC opens the finished map (**Checkpoint B**). Only then does it replace the working map.

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md` (§4–§7), `docs/SCOPE.md` (§2.3 granularity rule, §7 branch boundaries)
  and `reports/scope/04-branch-map.md` (the candidates) first.
- Work on branch `foundation-splits`, created from an up-to-date `main`. Never commit to `main`.
  Never force-push. Commit after each task. When every task is done, every test passes and JC has
  passed Checkpoint B, open a pull request and merge it, then update local `main`.
- **Backup first:** JC runs `Backup-User-Data.cmd` (app closed) before Task 3. If the app is closed,
  Claude Code may run the backup script itself. Record the folder name.
- **`Maps/Robotics-Atlas.json` is read-only until Task 5.** Check its SHA-256 and the answer record's
  at the start and end of every task. The old master and the V3 export stay untouched.
- **Answers are never inferred or written.** Every new skill starts unmarked, even where the broad
  skill it comes from is marked by then.
- **No existing skill, connection or lesson changes**, except the connections JC approves for the
  new skills. Levels and positions may move.
- Every app launch uses the e2e harness's isolated profile, never JC's real profile.
- Change only what each task names. Keep every existing test passing; change an existing test only
  where a task changes the behaviour it checks, and say so.
- If a STOP condition triggers, mark the task `[BLOCKED]`, write what was found, commit, and stop.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

## [ ] Task 1 — Starting state
**Do:** In `reports/splits/00-starting-state.md`, record:
- SHA-256, counts and metadata of the working map and the answer record;
- confirm the working map is the completions map (`ba823b0d…`);
- for each of the 36 candidates: its source skills exist, and their answer, lesson, level and
  whether they are in the I05 chain;
- the backup folder name, or that it is not yet taken.

**STOP if:** a source skill is missing, or now has an answer.
**Check:** the working map and answer record unchanged.

## [ ] Task 2 — Draft the new skills (draft for JC)
**Do:** Write `scope/splits/new-skills.json` and a readable `reports/splits/01-new-skills.md`,
grouped by domain. For each candidate:
- **id, name, description, details** in the style of the earlier batches; domain and subdomain
  from the source skill;
- **the granularity test:** why a learner could mark it differently from the broad skill and its
  neighbours. If it fails, propose *no new skill* and say why;
- **connections:** prerequisites and what it feeds, each with a rationale. Default: the new skill
  requires its broad source skill and feeds nothing required. Any edge into the I05 chain is flagged;
- **required or optional**, with a recommendation;
- **more than one skill** only where the candidate hides several abilities, with the reason.

Also propose an **id policy** for the new skills (recommended: the batches' `sss-<area>-<slug>`
form), and list any existing skill a draft might duplicate.
**STOP (Checkpoint A):** JC approves or changes each skill. Nothing is built until then.

## [ ] Task 3 — The structure tool
**Do:** Write `authoring/splits/add-splits.mjs` (logic only) and `build-splits.mjs` (the command,
dry run by default), reusing the completions tool's gates and layout (`authoring/completions/`)
rather than copying them. The tool:
- starts from the working map, keeping every node, edge, field, answer and lesson in order;
- appends the approved skills, unmarked, as master-style records, with their approved connections;
- recalculates levels and positions with the app's own code;
- refuses to write unless: no answer changed or lost; no node, edge or lesson lost or changed; only
  the approved edges added; no prerequisite loop; every I01–I05 chain still holds everything it held;
  the required/optional status of each new skill matches its approval; running it twice gives
  identical bytes.

**Check:** unit tests for each rule and gate (`tests/splits.test.mjs`). Write the result to
`C:\sss-scratch\splits\`. Record how many skills changed level.

## [ ] Task 4 — Measure and report
**Do:**
- Run all unit and end-to-end tests, plus a new e2e check (`tests/splits-e2e.mjs`). It opens the
  finished map and confirms every skill and connection arrives, answers match the shared record, the
  new skills start unmarked and show their details, and there are no page errors.
- Measure open, frame rate, arrange and save as in the merge's Task 4.
- Update `scope/branches.json` and `docs/SCOPE.md` (each branch's status and counts, totals, change
  log), and `docs/PLATFORM.md` §9.
- Write `reports/splits/02-results.md`: counts before and after, the new skills by domain, levels
  moved, how many are required (and so added to step 7), and the review-session note.

**STOP (Checkpoint B):** JC opens the finished map from scratch with the app's normal Open and
says go or no-go.

## [ ] Task 5 — Make it the working map, then merge
**Do (only after JC's go):**
- Copy the current `Maps/Robotics-Atlas.json` to `Maps/Backups/` with the date in its name, then
  replace it with the finished map.
- Keep the importer's default dry run passing on the new working map (306 lessons, nothing to change).
- Open the pull request, merge it, and update local `main`.

**Check:** the backup copy matches Task 1's SHA-256; the old master, the V3 export and the shared
answer record are unchanged.

---

## Not in this queue
- Lessons for the new skills, and the 23 master-only skills in the I05 chain (step 7).
- The mathematics audit and the "decomposes" relationship (step 8).
- The P7 camera-model prerequisite audit and the deferred modern-physics item.
- The 44 evidence cards in `evidence-overrides.json` waiting for JC's review.
- Moving the project out of OneDrive (JC to decide).
