# TASKS — Skill Solar System — The Robotics V3 merge

Step 4 of `reports/scope/07-checkpoint.md` §2, following the decision brief §D
(`reports/scope/05-decisions.md`). JC asked for it on 2026-10-05 ("Yes lets do step 4"). **Draft:
waiting for JC's approval before any task runs.**

This is the first queue that produces a new real map. It never edits the two existing maps: the
merged atlas is a **new file**, and the old master and the V3 export stay exactly as they are, so
going back is just opening the old file.

The previous queue (capacity safety) is preserved in Git: merged in PR #20, its final queue file at
`97e0fbd`.

## What is already known (measured 2026-10-05, before drafting)

| | Master atlas | Robotics V3 export |
| --- | --- | --- |
| File | `Maps/Skill-Solar-System.json` | `Maps/Robotics-v3/Robotics-v3-Lessons.json` |
| Skills / connections | 1,769 / 5,142 | 381 / 894 |
| Answer family | none declared; falls back to `sss-robotics-foundations-2026-09` | `robotics-foundations-integration-v3-review` |
| Answers in the file | 309 | **0** |
| Shared answer record | `sss-robotics-foundations-2026-09-2eb611994d87.json` | **none exists** |

- **The `m-logic` conflict is already resolved:** `Maps/Checkpoint-2026-09-13/Integration-Summary.md`
  records that both now hold `No`. V3 has no answers at all, so the "answered differently" list is
  expected to be empty. Task 1 checks this rather than assuming it.
- **Size:** the two files together are about 8 MB, far inside the new 150 MB cap. Lessons stay on the
  V3 skills only for now (step 7 adds the rest).

## The plan in one paragraph

Build the merged atlas from the **master** (its ids, its family, its 309 answers carry over
untouched), add V3's 177 new entries under their `rob3:` ids, attach V3's lessons to all 381 V3
entries (204 of them land on the existing master skill with the same id), merge the connections,
apply decisions 6, 7, 10, 11 and 12, recalculate levels, and point the lesson importer at the
merged map. JC reviews the crosswalk before anything is built (**Checkpoint A**) and the finished
map before it becomes the working map (**Checkpoint B**).

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md` (§4–§7), `reports/scope/05-decisions.md` (§D and decisions 6, 7, 10–13)
  and `docs/SCOPE.md` first.
- Work on branch `v3-merge`, created from an up-to-date `main`. Never commit to `main`. Never
  force-push. Commit after each task. When every task is done, every test passes and JC has passed
  Checkpoint B, open a pull request and merge it, then update local `main`.
- **Backup first:** JC runs `Backup-User-Data.cmd` (app closed) before Task 1. Record the backup
  folder name in Task 1's result.
- **The two existing maps are read-only.** Check their SHA-256 at the start and end of every task;
  they must not change. The merged map is written to `C:\sss-scratch\merge\` until Checkpoint B,
  and only then copied into `Maps/` as a new file.
- **Answers are never inferred, copied between families, or given an automatic winner.** The only
  answers in the merged map are the master's own, carried by unchanged ids. JC's shared answer
  record is read (Task 1, to check for conflicts) but never written by this queue.
- Every app launch uses the e2e harness's isolated profile, never JC's real profile.
- Change only what each task names. Keep every existing test passing; change an existing test only
  where a task changes the behaviour it checks, and say so.
- If a STOP condition triggers, mark the task `[BLOCKED]`, write what was found, commit, and stop.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

## [x] Task 1 — Starting state and answer check (2026-10-10)
**Do:**
- Record SHA-256, counts and metadata for both maps and the backup folder name in
  `reports/merge/00-starting-state.md`.
- Confirm `Maps/Skill-Solar-System.json` is the master JC works in (compare it with
  `Maps/Checkpoint-2026-09-13/Skill-Solar-System-Current-Master.json` and the skills present in
  the shared answer record).
- **Answer check:** list every skill whose answer differs between any two of: the master file, the
  master's shared record, the V3 file, and a V3 shared record if one exists. Expected: none.
- For the 204 shared ids, list every difference in name, description or prerequisites between the
  master and V3 (`m-order` is one known name difference).
**STOP if:** the master file is not the current one, or any answer differs. List it for JC, who
decides each one.
**Check:** both maps' SHA-256 unchanged.
**Result:** `reports/merge/00-starting-state.md`. The master is current (byte-identical to the
2026-09-13 checkpoint). **One answer differs:** `c-variables` is Yes in the file and Clear in the
shared record. This STOP is carried to Checkpoint A as item A1, because only the build (Task 3) depends
on it. **Backup not yet taken:** the app was open on JC's real profile, and Claude Code did not close
it. Tasks 1–2 are read-only. The backup is required before Task 3. Both maps' SHA-256 and the answer
record are unchanged.

## [x] Task 2 — The crosswalk (draft for JC) (2026-10-10)
**Do:** Write `scope/merge/crosswalk.json` and a readable `reports/merge/01-crosswalk.md`:
- **The 177 new V3 entries** (129 robotics, 48 foundation): for each, the closest master skill if
  any, and a proposal: *new skill* (default), *same ability as master skill X* (then V3's lesson
  goes onto X and the `rob3:` entry is not added), or *decomposes master skill X*. Start from the 35
  word-overlap suggestions, but judge by meaning; about a third are coincidences.
- **The 27 broad `r-*` overviews** (decision 6): for each, *retire* (replace with *related* links to
  the V3 outcomes it summarizes) or *keep as orientation*, with the outcomes it covers. A retired
  overview that holds an answer is **kept**, not retired, and flagged for JC.
- **The 204 shared ids:** which version of name, description and prerequisites wins where Task 1
  found a difference. Recommended: V3's prerequisites (reviewed and chain-checked), the master's
  name unless V3's is clearer, and say which.
- **Decision 11:** each of the three calculus *supports* links (into `C03`, `N10`), with a proposal
  to make it a prerequisite or leave it.
**STOP (Checkpoint A):** JC reviews the crosswalk and answers each open item. Nothing is built
until then.
**Result:** `scope/merge/crosswalk.json` and `reports/merge/01-crosswalk.md` (regenerate with
`authoring/merge/draft-crosswalk.mjs`). There are eight items, A1–A8, each with a recommendation: 2
same-ability merges, 175 new skills, 26 overviews retired and `r-singular` kept, `m-order` takes
V3's version, and decision 11's links stay *supports*. A structure-only simulated merge has 1,918
skills, 5,718 connections, no loop and a longest chain of 27. **Waiting for JC at Checkpoint A, and
for the backup.**

## [ ] Task 3 — The merge tool
**Do:** Write `authoring/merge/merge.mjs` (logic only, no file access) and
`authoring/merge/build-merged.mjs` (the command, dry run by default), following the applier's
style (PLATFORM.md §6.2). The tool:
- starts from the master: every master node, edge, field and answer kept, in order;
- applies the crosswalk exactly as JC approved it;
- adds the new `rob3:` nodes and every V3 connection, translated to master ids where the crosswalk
  says so; drops exact duplicate connections;
- carries V3's `lesson`, `lessonCard`, `details`, `contentStatus`, `lessonStatus` and
  `nodeKind`/`feedsMilestones` onto the merged node; never `proficiency80`;
- applies decision 7 (`X06` becomes `nodeKind: outcome`), decision 10 (`K05`–`K07` become
  prerequisites of `K08`, `K10`, `K11`), decision 11 as approved, and decision 12 (`B-D08`
  `subdomain` aligned to S7's);
- declares `atlasFamily: sss-robotics-foundations-2026-09` and a new
  `datasetKey: robotics-atlas-merged`;
- refuses to write unless its gates pass: no master answer changed or lost; no master node or
  edge lost except crosswalk-approved retirements; no prerequisite loop; every V3 milestone chain
  I01–I05 still closed; running it twice gives identical bytes.
**Check:** unit tests for each rule and gate (`tests/merge.test.mjs`), including a small synthetic
pair of maps. Write the dry-run summary to `C:\sss-scratch\merge\`.

## [ ] Task 4 — Levels and layout
**Do:** Recalculate levels on the merged map with the existing level and vortex code, and record
how many skills moved and the new highest level. Keep any pinned positions.
**Check:** the app opens the merged map in the isolated profile; frame rate and click time
measured against `reports/capacity/06-safety-results.md`.

## [ ] Task 5 — Re-base the lesson importer
**Do:** Make `apply-lessons.mjs` able to target the merged map (a `--target` option; the V3 export
stays the default until the merge PR lands, then the merged map). Its gates are re-based on the
merged map: re-applying editions 01–06 must change **nothing** (all 298 lessons already there).
`evidence-overrides.json` keeps working by planning id.
**Check:** dry run against the merged map reports 0 changes; existing importer tests pass.

## [ ] Task 6 — Measure and report
**Do:** Run all unit and end-to-end tests, plus a new e2e check that opens the merged map and
confirms: answers shown match the shared record; a V3 lesson card renders on a shared-id skill and
on a `rob3:` skill; the draft warning is absent. Write `reports/merge/02-results.md`: counts before
and after, file size, what was retired, decisions applied, levels moved, and the review-session
note (old sessions for either map will not resume on the merged map; a new review starts fresh).
Update `docs/PLATFORM.md` and `docs/SCOPE.md` coverage (the 9 "after the merge" branches).
**STOP (Checkpoint B):** JC opens the merged map (a copy in scratch, through the app's normal Open)
and says go or no-go.

## [ ] Task 7 — Make it the working map, then merge
**Do (only after JC's go):**
- Copy the merged map to `Maps/Robotics-Atlas.json`. Do not delete or overwrite the old master or
  the V3 export; move them to `Maps/Archived maps/` only if JC asks.
- Make the merged map the importer's default target.
- Open the pull request, merge it, and update local `main`.
**Check:** both old maps' SHA-256 match Task 1; JC's shared answer record is unchanged.

---

## Not in this queue
- Step 5 onward (robotics completions, splits, lessons for every required skill).
- The 44 evidence cards in `evidence-overrides.json` waiting for JC's review.
- Moving the project out of OneDrive (07-checkpoint says "best before step 4"; JC to decide).
- The `m-ftc` / `m-substitution` same-ability merges (decision 13: a later content pass).
