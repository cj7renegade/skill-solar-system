# TASKS — HelixSkill — Core lessons (step 7)

Step 7 of `reports/scope/07-checkpoint.md` §2: introductory lessons for every required skill. JC
asked for it on 2026-11-05 ("Let's queue up step 7"). **Tasks 1–2 done; waiting at Checkpoint A.**

The queue has **two parts**, one edition each, and each part ends with its own Checkpoint B and pull
request. JC reads about twenty lessons at a time rather than forty-four at once, and the working map
gains the first batch before the second is written. Everything is built in `C:\sss-scratch\lessons\`
first. The working map is replaced only after JC's go, and the version it replaces is kept in
`Maps/Backups/`.

The previous queue (foundation splits) is preserved in Git: merged in PR #23, its final queue file at
`2efb2cc`.

## What is already known (measured 2026-11-05, before drafting)

- **Working map:** `Maps/Robotics-Atlas.json`, SHA-256 `7c418655…375892a`. 1,955 skills, 306
  lessons, 308 answers in the file. JC's answer record: `23471d5c…`, 311 entries.
- **The old estimate was too high.** `07-checkpoint.md` expected 240–320 lessons. It counted skills
  that later decisions put outside "done": the extension pathways (Q3) and the optional splits (D4).
  Measured with the scope's own rule (every robotics skill, minus the extension pathways, plus
  everything they need through prerequisites), the core is **351 skills; 306 have a lesson and 45 do not**:

  | Group | Skills | What they are | Lesson can be checked against |
  | --- | ---: | --- | --- |
  | **A. On the I05 path, master-only** | 23 | 17 `sss-rob-*` frame and planar-arm steps, `p-charge`, `p-electricfield`, `p-potentialelectric`, `m-log`, `m-trigidentity`, `m-transdiff` | **nothing yet**: no specification entry, no planning id |
  | **B. Core but off the I05 path, V3** | 21 | e.g. `C06`–`C09`, `N09`, `P07`, `A11`, `e-imu`, `e-adc`, `e-calibration`, `m-laplace`, the integral-calculus thread, `m-random`, `m-regression` | V3's reviewed specification |
  | `r-singular` | 1 | the one overview kept as orientation | — (Q6: orientation, outside coverage counts) |

- **Not in step 7:** the 35 optional splits (D4); the 11 pending extension-pathway entries (step 9);
  44 other pending V3 entries that no robotics skill needs (context, Q1 (a)); the roadmap note.
- **Group A needs groundwork the importer does not have.** The importer finds a lesson's skill by
  planning id and checks it against a specification entry. Group A skills have neither, and the
  importer's preservation gate forbids adding a planning id to an existing skill. Part 1 therefore
  drafts a specification entry for each (for JC's approval) and teaches the importer to match an
  approved master-skill entry by the skill's own id.
- **None of the 45 has an answer** in the file. Lessons never write one.
- Lessons from Edition 08 on state `requires_physical_evidence` (decision 14), as Edition 07 did.

## The plan in one paragraph

**Part 1 (Edition 08):** record the starting state; draft a lesson specification for each Group A
skill and the open scope questions, for JC to approve (**Checkpoint A**); teach the importer
master-skill lessons; write and import Edition 08's 23 lessons; JC reads them and opens the map
(**Checkpoint B1**); make it the working map and merge. **Part 2 (Edition 09):** write and import
the 21 Group B lessons against V3's specification; JC reads them and opens the map
(**Checkpoint B2**); make it the working map and merge. After Part 2, every core skill has a lesson.

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md` (§3.5, §4–§7), `docs/SCOPE.md` (§2, §5) and the Edition 07 package
  (`authoring/completions/edition-07/`) first. Edition 07 is the model for both editions.
- Part 1 works on branch `lessons-core`; Part 2 on `lessons-core-2`, each from an up-to-date `main`.
  Never commit to `main`. Never force-push. Commit after each task. At the end of each part, when
  every test passes and JC has said go, open a pull request and merge it, then update local `main`.
- **Backup first:** before each part's first write (Tasks 3 and 9), JC runs `Backup-User-Data.cmd` (app
  closed). If the app is closed, Claude Code may run the backup script itself. Record the folder name.
- **`Maps/Robotics-Atlas.json` is read-only except in Tasks 7 and 11.** Check its SHA-256 and the
  answer record's at the start and end of every task. The old master and the V3 export stay untouched.
- **Answers are never inferred or written.** Lessons set `proficiency_write: false`.
- **No existing lesson changes**, and no skill, connection, position or answer changes: a lesson import
  adds lesson fields only.
- Every number in a worked example or an answer is recomputed by the edition's lab, and the package
  checker confirms it appears in the text, as in Edition 07.
- Every app launch uses the e2e harness's isolated profile, never JC's real profile. A copy of the
  answer record keeps its original file name.
- Change only what each task names. Keep every existing test passing; change an existing test only
  where a task changes the behaviour it checks, and say so.
- If a STOP condition triggers, mark the task `[BLOCKED]`, write what was found, commit, and stop.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

# Part 1 — Edition 08: the I05 path

## [ ] Task 1 — Starting state
**Do:** In `reports/lessons/00-starting-state.md`, record:
- SHA-256, counts and metadata of the working map and the answer record;
- the three groups above, measured again, with each skill's level, prerequisites and answer;
- for each Group A skill, the text it already has (`details`, `proficiencyReference`, `scopeNote`);
- the backup folder name, or that it is not yet taken.

**STOP if:** the groups differ from the counts above, or a Group A or B skill has an answer.
**Check:** the working map and answer record unchanged.
**Result:** `reports/lessons/00-starting-state.md`.
- The working map is the splits map (`7c418655…`). The answer record is unchanged.
- The groups match (23 / 21 / 1) and none has an answer, so there is no STOP.
- The 17 `sss-rob-*` skills already have "I can…" statements and scope notes.
- Every prerequisite outside Group A has a lesson.
- Backup: not yet taken for this queue (app closed). It comes before Task 3.

## [ ] Task 2 — Lesson specifications for Group A (draft for JC)
**Do:** Write `scope/lessons/master-specifications.json` and a readable
`reports/lessons/01-specifications.md`. For each of the 23 Group A skills, an entry in the reviewed
specification's format:
- `requires`: the skill's prerequisites in the map, so a lesson cannot drift from the map;
- `demonstration`, `assessment_contract` and `scope_contract`, built from the skill's existing
  `proficiencyReference` and `scopeNote` where it has them (the 17 `sss-rob-*` skills), and drafted
  for the six physics and mathematics skills;
- `runtime_identity.proposed_id`: the skill's own id, with no planning id added.

Also list the open questions, each with a recommendation:
- **E1 — What step 7 covers:** Groups A and B (44 lessons); not the splits, the extension pathways,
  the off-path V3 entries or `r-singular`.
- **E2 — Batches:** Part 1 = Group A (Edition 08), Part 2 = Group B (Edition 09).
- **E3 — Authoring:** Claude Code writes both editions, as for Edition 07.
- **E4 — Hardware evidence:** decided per lesson from its demonstration, as in Edition 07.

**STOP (Checkpoint A):** JC approves or changes the specifications and E1–E4. Nothing is built until then.
**Result:** `scope/lessons/master-specifications.json` (generated by
`authoring/lessons/draft-specifications.mjs`) and `reports/lessons/01-specifications.md`.
- **23 entries.** Name and prerequisites come from the map; the assessment wording is V3's own for each
  mode; only the demonstrations are drafted. 20 are written calculation and 3 (the physics skills)
  calculation and explanation. All feed I02, I04 and I05.
- **One question added, E5:** eight Group A skills are the fine steps under Edition 07's `K05`–`K07`.
  The recommendation is to keep each lesson to its own step, with different numbers.

**Checkpoint A passed on 2026-11-05:** JC accepted E1–E5 as recommended. Recorded in
`master-specifications.json` (`status: APPROVED`, each entry's review marked approved).

## [ ] Task 3 — Teach the importer master-skill lessons
**Do:** Extend `authoring/robotics-v3/lessons.mjs` and `apply-lessons.mjs`:
- read the approved `scope/lessons/master-specifications.json` alongside V3's specification;
- find a lesson's skill by planning id as now, or, for an approved master-skill entry, by the
  skill's own id;
- reconcile it with the same checks (name, `requires`, contract fingerprint, `proficiency_write`),
  and accept that a master skill has no planning id;
- count master-skill lessons separately from V3 entries in the summary and the gates; the expected
  counts become per edition;
- the I05 closure gate counts master-only skills too, so after Edition 08 the I05 path is complete.

**Check:**
- unit tests for the new matching and its refusals (a lesson for an unapproved master skill, a drifted
  `requires`, a planning id where none should be);
- every existing target still behaves exactly as before: the V3 export, the completions map and the
  current working map (dry runs pass at their current counts).

**Result:**
- **Backup first:** `%OneDrive%\HelixSkill Backups\2026-11-05_204456` (every file verified; the app
  was closed, so Claude Code ran the script).
- **`lessons.mjs`:** an approved master-skill entry (`runtime_identity.master_skill`) is matched by the
  skill's own id, and every other check is unchanged. A master entry that meets a skill with a planning
  id is refused. The skill gains the lesson fields and a content status, keeps its own text in
  `atlasDetails` and `atlasPlacementNote`, and gets no planning id. The summary counts
  `masterSkillLessons` separately.
- **`apply-lessons.mjs`:** Edition 08 and `scope/lessons/master-specifications.json` are optional
  inputs. When both are present and approved, on a merged atlas holding `P11`:
  - Edition 08 applies;
  - the expected counts become 306 V3 lessons plus 23 master-skill lessons;
  - the I05 chain counts master-only skills as entries (expected 328, all with a card);
  - the baseline is Edition 08's own.
- **Unchanged:** every existing target's dry run passes as before (V3 export 298, completions map 306,
  working map 306, all touching nothing).
- `tests/lessons.test.mjs`: 7 tests covering the matching and its refusals. All unit tests: 260 pass,
  0 fail, 6 skipped.

## [ ] Task 4 — Write Edition 08
**Do:** Write `authoring/lessons/edition-08/` in Edition 07's layout:
- the lesson source, built lessons, readable lessons, workbook, study sequence and ledger;
- `check_package.py` and a standard-library lab that recomputes every number;
- `INTEGRATION.md`, and the full package assembled in `packages/core-lessons-learning-edition-08/`
  with its `baseline/`.

23 introductory lessons, one per Group A skill, each with 27 fields and its evidence statement.
**Check:** `check_package.py` passes; the lab results are recorded.

## [ ] Task 5 — Import Edition 08
**Do:** Import into a scratch copy of the working map. Expected:
- 23 gained, 306 unchanged, 0 conflicts, 329 lessons;
- the I05 path complete, master-only skills included (328/328).

**Check:** every importer gate passes; re-applying changes nothing; no existing card changes.

## [ ] Task 6 — Measure and report Part 1
**Do:**
- Run all unit and end-to-end tests, plus a new e2e check: the 23 cards render, name their edition,
  show the hardware line exactly where stated, and answers match the record.
- Write `reports/lessons/02-edition08-results.md`.
- Update `docs/PLATFORM.md` §9.

**STOP (Checkpoint B1):** JC reads the 23 lessons, opens the finished map from scratch and says go or no-go.

## [ ] Task 7 — Make it the working map, then merge Part 1
**Do (only after JC's go):** back up `Maps/Robotics-Atlas.json` to `Maps/Backups/` with the date,
replace it, keep the importer's default dry run passing, open the pull request, merge it, update
local `main`.
**Check:** the backup matches Task 1; the old maps and the answer record are unchanged.

---

# Part 2 — Edition 09: the rest of the core

## [ ] Task 8 — Starting state for Part 2
**Do:** On branch `lessons-core-2`, re-measure Group B against the new working map: the 21 entries,
their specification records and contract fingerprints, and their prerequisites' lessons. Write
`Edition09-Targets.json`.
**STOP if:** a Group B prerequisite outside the 21 has no lesson.

## [ ] Task 9 — Write Edition 09
**Do:** The same package layout and checks as Edition 08, for the 21 Group B entries, against V3's
reviewed specification. Backup first.
**Check:** `check_package.py` passes; the lab results are recorded.

## [ ] Task 10 — Import, measure and report Part 2
**Do:**
- Import into a scratch copy of the working map. Expected: 21 gained, 329 unchanged, 0 conflicts,
  350 lessons; every core skill but `r-singular` has a lesson.
- Run every test, plus an e2e check of the 21 cards.
- Write `reports/lessons/03-edition09-results.md`, including the final core coverage.
- Update `docs/PLATFORM.md` and `docs/SCOPE.md`.

**STOP (Checkpoint B2):** JC reads the 21 lessons, opens the finished map and says go or no-go.

## [ ] Task 11 — Make it the working map, then merge Part 2
**Do (only after JC's go):** as Task 7.

---

## Not in this queue
- Lessons for the 35 optional splits, the 11 extension-pathway entries (step 9), and the 44 V3
  entries no robotics skill needs.
- The mathematics audit (step 8).
- The 44 evidence cards in `evidence-overrides.json` waiting for JC's review.
- Moving the project out of OneDrive (JC to decide).
