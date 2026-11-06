# TASKS Ã¢â‚¬â€ HelixSkill Ã¢â‚¬â€ Robotics completions (Edition 07)

Step 5 of `reports/scope/07-checkpoint.md` Ã‚Â§2 (package 3 of `reports/scope/06-wave-plan.md`). JC
asked for it on 2026-11-05 ("Let's queue up step 5"). **Tasks 1–7 done; waiting at Checkpoint B.**

This queue is the first to change the working map, `Maps/Robotics-Atlas.json`. Everything is built
in `C:\sss-scratch\completions\` first. The working map is replaced only after JC's go at
Checkpoint B, and the version it replaces is kept in `Maps/Backups/`.

The previous queue (the Robotics V3 merge) is preserved in Git: merged in PR #21, its final queue
file at `546ae7b`.

## What is already known (measured 2026-11-05, before drafting)

- **Working map:** `Maps/Robotics-Atlas.json`, SHA-256 `f307121cÃ¢â‚¬Â¦db047c`. 1,918 skills, 5,708
  connections, 298 lessons, 308 answers in the file.
- **Six required skills have no lesson.** Decision 10 made `K05`Ã¢â‚¬â€œ`K07` prerequisites of `K08`, so
  they and three foundations under them now sit in the I05 chain without a card:

  | Skill | Name | Why it is now required |
  | --- | --- | --- |
  | `rob3:K05` | Solve planar two-link forward kinematics | `K05 Ã¢â€ â€™ K08 Ã¢â€ â€™ I02 Ã¢â€ â€™ I04 Ã¢â€ â€™ I05` |
  | `rob3:K06` | Solve and verify planar inverse kinematics | `K06 Ã¢â€ â€™ K08 Ã¢â€ â€™ Ã¢â‚¬Â¦` |
  | `rob3:K07` | Calculate and test a planar Jacobian | `K07 Ã¢â€ â€™ K08 Ã¢â€ â€™ Ã¢â‚¬Â¦` |
  | `m-invtrig` | Inverse trigonometry and quadrants | `m-invtrig Ã¢â€ â€™ K06 Ã¢â€ â€™ Ã¢â‚¬Â¦` |
  | `m-inverse` | Inverse functions | `m-inverse Ã¢â€ â€™ m-invtrig Ã¢â€ â€™ K06 Ã¢â€ â€™ Ã¢â‚¬Â¦` |
  | `p-work` | Work by a constant force | `p-work Ã¢â€ â€™ p-potentialelectric Ã¢â€ â€™ e-voltage Ã¢â€ â€™ B-E05 Ã¢â€ â€™ Ã¢â‚¬Â¦ Ã¢â€ â€™ I05` (through the same-ability merge) |

- **Two skills are still missing** (branch map, `reports/scope/04-branch-map.md`):
  - R6: *Detect an inconsistent measurement innovation* (a split of `rob3:P09` / `rob3:P08`).
  - R12: *Distinguish coupling misalignment from backlash* (new, next to `rob3:A09` / `rob3:D08`).
  - Next free planning ids: `P11` and `A12`.
- **`feedsMilestones` is out of date.** The merge recalculated levels but not this list, so the six
  skills above show no milestone. PLATFORM.md Ã‚Â§4.4 says the list must agree with the edges.
- **The lesson importer cannot add skills.** It refuses to write if any connection changes, and it
  matches lessons against the reviewed specification, which has no `P11` or `A12`. So the two new
  skills go in by a separate structure step first, and their lessons come after.
- **Adding skills changes the review key** (it includes the skill count), so a review in progress
  on the merged map will not resume. Answers are not affected.
- **Lesson records from Edition 07 on carry `requires_physical_evidence` and `evidence_kind`**
  (decision 14). The importer and card already read them.

## The plan in one paragraph

Record the starting state. Draft the two new skills and fix `feedsMilestones`; JC approves the
drafts (**Checkpoint A**). Add the two skills with a gated structure tool. Extract the eight lesson
targets (6 + 2). Author Edition 07, eight introductory lessons, in the existing package format. Import
it with the existing importer. JC reads the lessons and opens the finished map (**Checkpoint B**).
Only then does it replace the working map.

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md` (Ã‚Â§4Ã¢â‚¬â€œÃ‚Â§7), `reports/scope/05-decisions.md` (decisions 10 and 14) and
  `docs/SCOPE.md` (R6, R12) first.
- Work on branch `robotics-completions`, created from an up-to-date `main`. Never commit to `main`.
  Never force-push. Commit after each task. When every task is done, every test passes and JC has
  passed Checkpoint B, open a pull request and merge it, then update local `main`.
- **Backup first:** JC runs `Backup-User-Data.cmd` (app closed) before Task 3. Record the folder name.
- **`Maps/Robotics-Atlas.json` is read-only until Task 8.** Check its SHA-256 and the shared answer
  record's at the start and end of every task. The old master and V3 export stay untouched throughout.
- **Answers are never inferred or written.** The new skills start unmarked. A lesson never marks
  proficiency (`proficiency_write: false`).
- **No existing lesson changes.** The 298 lesson payloads must stay byte for byte the same.
- Every app launch uses the e2e harness's isolated profile, never JC's real profile.
- Change only what each task names. Keep every existing test passing; change an existing test only
  where a task changes the behaviour it checks, and say so.
- If a STOP condition triggers, mark the task `[BLOCKED]`, write what was found, commit, and stop.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

## [ ] Task 1 Ã¢â‚¬â€ Starting state
**Do:** In `reports/completions/00-starting-state.md`, record:
- SHA-256, counts and metadata of `Maps/Robotics-Atlas.json` and the shared answer record;
- confirm the working map matches the one Task 7 of the merge copied (`f307121cÃ¢â‚¬Â¦`);
- the I05 chain's skills without a lesson (expected: the six above), and whether JC has an answer
  on any of them in the shared record;
- every node whose `feedsMilestones` disagrees with its prerequisite edges;
- the backup folder name, or that it is not yet taken.
**STOP if:** the working map differs from the merged build, or the lessonless list is not the six.
**Check:** the working map and answer record unchanged.
**Result:** `reports/completions/00-starting-state.md`. The working map is the Task 7 copy
(`f307121câ€¦`). The answer record has one new entry, JC's own (`rob3:B-C01` Yes at 19:08), so it is
now `23471d5câ€¦` with 311 entries, and a fresh backup is needed before Task 3. **STOP: 29 required
skills have no lesson, not 6.** The other 23 are master-only skills the merge pulled into the I05
chain. They have no planning id and no specification entry. Carried to Checkpoint A as item C1,
because nothing before Task 3 depends on it. `feedsMilestones` disagrees with the edges on 9
skills. Every map and the answer record are unchanged.

## [ ] Task 2 Ã¢â‚¬â€ Draft the two new skills (draft for JC)
**Do:** Write `scope/completions/new-skills.json` and a readable `reports/completions/01-new-skills.md`.
For each of `P11` and `A12`:
- name, description, subdomain, `nodeKind: outcome`;
- prerequisites (proposed: `P11` Ã¢â€ Â `P08`, `P09`; `A12` Ã¢â€ Â `A09`, `D08`), and what it feeds;
- whether it is **required** (a prerequisite of something in the I05 chain) or **optional**,
  with a recommendation;
- the demonstration and assessment contract, in the reviewed specification's format, so its lesson
  can be checked like every other;
- a check that it is a distinct, separately markable ability and not a restatement of its sources.

Also list the `feedsMilestones` corrections from Task 1, and propose who authors Edition 07: Claude
Code in this repository (recommended), or an outside author working from the targets file as for
Editions 01Ã¢â‚¬â€œ06.
**STOP (Checkpoint A):** JC approves or changes each skill and the authoring choice. Nothing is
built until then.
**Result:** `scope/completions/new-skills.json` and `reports/completions/01-new-skills.md`. Five
items, each with a recommendation:
- **C1:** keep step 5 at 8 lessons; the 23 master skills go to step 7.
- **C2:** `P11` is required, between `P08` and `P09`.
- **C3:** `A12` is optional, after `A09` and `D08`, supporting `V05`.
- **C4:** recalculate `feedsMilestones`.
- **C5:** Claude Code writes Edition 07.

**Checkpoint A passed on 2026-11-05:** JC accepted every recommendation ("C1 a, C2 yes, C3
optional, C4 yes, C5 Claude Code"). Recorded in `new-skills.json` (`status: APPROVED`). The
lessons are 8: `K05`, `K06`, `K07`, `m-invtrig`, `m-inverse`, `p-work`, `P11` and `A12`.

## [ ] Task 3 Ã¢â‚¬â€ The structure tool
**Do:** Write `authoring/completions/add-skills.mjs` (logic only, no file access) and
`authoring/completions/build-completions.mjs` (the command, dry run by default), in the style of
`authoring/merge/`. The tool:
- starts from the working map, keeping every node, edge, field, answer and lesson in order;
- adds `rob3:P11` and `rob3:A12` and their connections, exactly as JC approved them;
- adds their entries to a specification extension, so the importer can check their lessons;
- recalculates `feedsMilestones` from the edges, and levels with the app's own level and spiral code;
- refuses to write unless: no answer changed or lost; no node or edge lost; no lesson payload
  changed; no prerequisite loop; every I01Ã¢â‚¬â€œI05 chain still closed except for the eight lessonless
  skills; running it twice gives identical bytes.
**Check:** unit tests for each rule and gate (`tests/completions.test.mjs`). Write the result to
`C:\sss-scratch\completions\`. Record how many skills changed level.
**Result:** `authoring/completions/add-skills.mjs` and `build-completions.mjs`.
- **Backup first:** `%OneDrive%\HelixSkill Backups\2026-11-05_192031` (213 files, 109.0 MB, every
  file verified). The app was closed, so Claude Code ran the backup script.
- **The build PASSED every gate.** It has 1,920 skills and 5,714 connections (4,327 prerequisite,
  177 supports, 1,210 related). The 308 answers and 298 lessons are unchanged, and a rebuild gives
  identical bytes. The result is `C:\sss-scratch\completions\Robotics-Atlas-structure.json`
  (SHA-256 `0c0619e9…62ddd1e`).
- **New skills:** `rob3:P11` at level 61, feeding I03–I05; `rob3:A12` at level 58, optional.
  Both are worded and laid out like the existing pending V3 entries, which a test checks.
- **feedsMilestones:** the 9 corrections from Task 1 are applied.
- **Levels:** 1,914 existing skills kept their level, 4 moved up (by at most 3), and 22 positions
  changed. The highest level is still 82.
- **Specification extension:** the importer reads the approved records from `new-skills.json`.
- `tests/completions.test.mjs`: 8 tests, all passing. The working map and the answer record are
  unchanged.

## [ ] Task 4 Ã¢â‚¬â€ Extract the Edition 07 targets
**Do:** Write `authoring/robotics-v3/Edition07-Targets.json` in the format of `Edition06-Targets.json`:
the eight skills, their records verbatim from the Task 3 map, their direct prerequisites, and their
contract fingerprints. Read-only.
**Check:** every prerequisite outside the eight already has a lesson.
**Result:** `authoring/robotics-v3/Edition07-Targets.json` (from `authoring/completions/extract-targets.mjs`,
source `0c0619e9…`). It holds the 8 targets, each with its map record, the specification record it is
checked against, its contract fingerprint and its direct prerequisites. **Check:** every V3
prerequisite outside the eight has a lesson. Four master-only prerequisites have none
(`sss-rob-planar-fk`, `sss-rob-tool-offset` of `K05`; `sss-rob-ik-verification` of `K06`;
`sss-rob-planar-singularity` of `K07`). They are among the 23 JC left for step 7 (C1), so this is
expected.

## [ ] Task 5 Ã¢â‚¬â€ Author Edition 07
**Do (as JC chose at Checkpoint A):** Write
`packages/robotics-completions-learning-edition-07/` in the Edition 06 layout (PLATFORM.md Ã‚Â§6.1):
the lessons JSON, the readable lessons, a workbook, `Study-Sequence.csv`, `Content-Status-Ledger.csv`,
`check_package.py`, a synthetic lab with recorded results, `baseline/` and `INTEGRATION.md`.
- One introductory lesson per target, with all 25 fields and the matching contract fingerprint.
- Every lesson states `requires_physical_evidence` and `evidence_kind`; the checker fails if either
  is missing or disagrees with `practice_mode` (decision 14).
- Worked examples and practice answers are checked by the lab, not just written. For `K05`Ã¢â‚¬â€œ`K07`
  the lab computes the planar pose, both inverse solutions, and the Jacobian against a finite
  difference.
**Check:** `check_package.py` passes; the lab results are recorded.
**Result:** written by Claude Code (C5). The authored text and package sources are tracked in
`authoring/completions/edition-07/`. `authoring/completions/build-edition07.mjs` copies every
specification-decided field from the targets, writes the lessons, and assembles the full package in
`packages/robotics-completions-learning-edition-07/` with its `baseline/`, which is not tracked because
the map is 7.8 MB.
- **8 lessons:** each has 27 fields, Edition 06's 25 plus decision 14's two. **All 8 say no
  real-hardware evidence is needed**, because each full demonstration works from stated values or
  generated data. `A12` is the closest call; its card lists measuring a real joint as remaining work.
- **The lab** (`completions_lab.py`, standard-library Python) recomputes every worked example and
  answer. It found one bug before the lessons were finished: at the edge of reach, rounding produced
  two nearly identical solutions. That is fixed and tested.
- **`check_package.py`: 87 checks passed** under Python 3.13.13. They cover fingerprints, counts,
  field order, evidence fields against the practice wording, contracts, the I05 chain (305 entries;
  the missing ones are exactly the 7 required targets) and every number, recomputed and found in the
  lesson text.
- **For JC to read at Checkpoint B:** `authoring/completions/edition-07/Robotics-Completions-Learning-Edition-07.md`.

## [ ] Task 6 Ã¢â‚¬â€ Import Edition 07
**Do:** Register Edition 07 with `apply-lessons.mjs` and import it into the Task 3 map in scratch.
Expected: 8 gained, 298 unchanged, 0 conflicts; 306 lessons; I05 chain fully covered.
**Check:** every importer gate passes; re-applying changes nothing; importer tests pass.
**Result:** `apply-lessons.mjs` now takes Edition 07, but only on a merged atlas that holds `P11`.
There it checks `P11` and `A12` against their approved records, and follows the map's edges for the
I05 chain. The V3 export and the current working map behave exactly as before: their dry runs still
pass at 298/82.
- **Import into `C:\sss-scratch\completions\Robotics-Atlas.json` passed:**
  - 8 gained, 298 unchanged, 0 skipped, 0 conflicts;
  - 306 authored, 76 pending, 1 roadmap;
  - I05 chain 305/305 with a card (23 master-only skills counted separately, as approved);
  - node order, edges, layout and answers identical; a review session survives;
  - a re-run touches nothing. SHA-256 `ba823b0d…4719f8c`.
- **One change beyond the queue, to keep a promise:** the first dry run would also have written the
  evidence-overrides table onto the 298 existing cards. That is the table still waiting for JC's
  review of 44 cards, which the merge deliberately left off the cards. The importer now applies it
  only with `--with-evidence-overrides`, and refuses to write if an existing card summary changes
  without it. This run: 8 statements from the lessons, 0 from the table, 0 existing cards changed.
- `src/lesson.js` names the edition on its cards ("robotics completions, edition 07").
- Unit tests: 246 pass, 0 fail, 6 skipped (the long-standing skips). That includes 2 new import
  tests in `tests/completions.test.mjs`.

## [ ] Task 7 Ã¢â‚¬â€ Measure and report
**Do:** Run all unit and end-to-end tests, plus a new e2e check that opens the finished map and
confirms the eight new cards render, the hardware line shows exactly where
`requires_physical_evidence` is true, the new skills start unmarked, and answers match the shared
record. Write `reports/completions/02-results.md`: counts before and after, levels moved, the
review-session note, and where to read the lessons. Update `docs/PLATFORM.md` Ã‚Â§9 and `docs/SCOPE.md`
(R6, R12 coverage).
**STOP (Checkpoint B):** JC reads the eight lessons, opens the finished map from scratch with the
app's normal Open, and says go or no-go.
**Result:** `reports/completions/02-results.md`.
- **Unit tests:** 246 pass, 0 fail, 6 skipped.
- **New e2e** `tests/completions-e2e.mjs`: 27 checks pass. Every answer matches JC's record (311
  entries, `rob3:B-C01` included), the new skills are unmarked, all 8 cards render without a hardware
  line, and an older flagged card still shows one.
- **Full e2e suite** with all three maps supplied: 775 checks pass, 0 fail.
- **One existing test changed:** in `tests/merged-atlas-e2e.mjs`, a V3 entry may now show an answer
  that JC's record holds. JC's real `B-C01` answer had made the old wording fail.
- **Docs:** `docs/PLATFORM.md` (§6.2, §9.1a, new §9.1b, §9.2), and `docs/SCOPE.md` with
  `scope/branches.json` (R6 and R12 covered, R2 and R3 lessons complete, totals, change log).
- **Review-session note:** a review saved on the working map will not resume on the finished map.
- The working map, both old maps and JC's answer record are unchanged.

**Waiting for JC at Checkpoint B.**

## [ ] Task 8 Ã¢â‚¬â€ Make it the working map, then merge
**Do (only after JC's go):**
- Copy the current `Maps/Robotics-Atlas.json` to `Maps/Backups/` with the date in its name, then
  replace it with the finished map.
- Open the pull request, merge it, and update local `main`.
**Check:** the backup copy matches Task 1's SHA-256; the old master, the V3 export and the shared
answer record are unchanged.

---

## Not in this queue
- Step 6 onward (foundation splits, lessons for every required skill, maths audit, extensions).
- The 44 evidence cards in `evidence-overrides.json` waiting for JC's review.
- Moving the project out of OneDrive (JC to decide).
- The other 76 V3 entries without a lesson that are not in the I05 chain, plus the roadmap note (step 7).
