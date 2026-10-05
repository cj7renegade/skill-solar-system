# TASKS — Skill Solar System — Skill scope foundation (robotics build-and-verify)

Goal: define the **complete skill scope** the atlas must cover, so the rest of the app can be built
around it. Scope decision (JC, 2026-10-04): **everything a person needs to design, build, program and
verify working robots**, from foundations up. Robotics V3 stays a separate map for now; it is
**merged later**, so this queue only prepares that merge and never performs it.

**This queue plans and measures. It does not add, remove, rename, reconnect or move any skill in any
real map, and it writes no lesson content.** Authoring the gaps becomes later branch-package queues.

The previous queues are preserved in Git: housekeeping at `f14c8c3` (on `main`), capacity at
`c7f5950` (branch `capacity-stress-test`, not merged).

## Rules for Claude Code (read first, every session)
- Read `docs/PLATFORM.md`, `coverage-inventory/COVERAGE-ROADMAP.md` and
  `coverage-inventory/CLAUDE-HANDOFF.md` first.
- Work top to bottom, one task at a time. Start at the first unchecked box.
- Work on branch `scope-foundation`, created from an up-to-date `main`. Never commit to `main`.
  Never merge. Never force-push. Never open or approve a pull request.
- When a task is done: check its box, fill in its **Result** line, commit, and move on.
- If a STOP condition triggers, do NOT continue. Write what you found under **Result**, mark the task
  `[BLOCKED]`, commit, and end the session. If the branch does not exist yet, do not commit anywhere;
  just report.
- **Real maps are read-only.** You may read `Maps/Skill-Solar-System.json` and
  `Maps/Robotics-v3/Robotics-v3-Lessons.json` for ids, names, domains, subdomains, descriptions,
  edges, levels and lesson status. Verify their SHA-256 is unchanged after every task that reads them.
  Never open them in the app. Never read `proficiency80` values, `%APPDATA%\skill-solar-system\`,
  or anything in `Maps/Archived maps/`.
- Never mark any skill proficient. Never change node identities, edges, positions, levels or pins.
- Scope decisions belong to JC. Where the evidence does not settle a boundary, write the options
  and a recommendation, and leave it **open**. Do not decide it in the data.
- Every new file is either documentation (`docs/`, `reports/scope/`) or plain planning data
  (`scope/`). No application code changes in this queue.
- JC is still learning to read code. Explain anything technical in one plain sentence.

---

## [x] Task 0 — Starting state and the Instruction Guide
**Do:**
- `git fetch origin`; confirm local `main` equals `origin/main`; create `scope-foundation` from it.
- Confirm the working tree holds only this file (modified) and
  `Skill-Solar-System-Instruction-Guide-v0.4.docx` (untracked). Anything else: STOP and report.
- Run `npm run build` and `npm test`; record the result.
- Record the SHA-256, skill count and connection count of both real maps.
- Commit the Instruction Guide **unchanged, where JC put it** (project root), so other users have it.
  Record its version and date. List any statement in it that the code or a report shows to be
  inaccurate (report only; JC maintains the guide).
- Write `reports/scope/00-starting-state.md`.
**STOP if:** other uncommitted changes exist; `main` cannot fast-forward; tests fail.
**Result:** Done.
- `scope-foundation` was created from `main` at `7dd9a01` (PR #17 merged). The tree was clean apart
  from this file and the guide.
- Build passed; `npm test` 213 / 207 pass / 6 skip / 0 fail.
- Master: 1,769 skills, 5,142 connections, SHA-256 `8e170740…`. It changed since 27 Sep
  (`04821f06…`) at the same size, consistent with JC saving it; not investigated, because it may be
  answers. V3: 381 / 894, `687f0916…`, unchanged.
- The Instruction Guide v0.4 was committed unchanged. Four notes for JC: the "close to the
  browser-storage limit" claim (the measured ceiling is 52.3 M characters), the silent draft warning
  on open, and two items about the new features not yet in the guide.
See `reports/scope/00-starting-state.md`.

## [x] Task 1 — Reconcile the coverage inventory with today's maps (read-only)
Follow `coverage-inventory/CLAUDE-HANDOFF.md` steps 1–3.
**Do:**
- Compare `coverage-inventory/baseline-node-index.json` (1,686 skills, Sept 14) with today's master:
  added, removed and renamed ids; per-domain and per-subdomain counts then and now; which of the
  four delivered batches are present.
- Check every branch anchor id in `COVERAGE-ROADMAP.md` still exists in the master.
- Measure the overlap between the master and Robotics V3: V3 ids with a `rob3:` prefix whose planning
  id matches a master id (for example `rob3:m-trig` and `m-trig`), same-name matches, and V3 entries
  with no master equivalent. This is preparation for the later merge; merge nothing.
- Write `reports/scope/01-reconciliation.md` and `scope/reconciliation.json` (ids, names, domains
  only: no answers, positions or lesson text).
**Result:** Done; both maps unchanged.
- The inventory's baseline is the archived Math-Academy-Marked copy (1,686 / 4,882). Today's master
  is 1,769 / 5,142: **+83 skills, 0 removed, renamed or moved**.
- The 83 are exactly five batches, all fully present: DC 26, physics 19, statics 11, materials 10,
  and robotics foundations 17. The last is wave 1, delivered after the inventory.
- All 124 roadmap anchor ids exist.
- V3 overlap: 204 of 381 share a master id (all foundations); **all 129 robotics-branch entries have
  no exact counterpart**; 35 word-overlap suggestions are listed for review.
See `reports/scope/01-reconciliation.md`, `scope/reconciliation.json`.

## [x] Task 2 — Write the scope statement
**Do:** Draft `docs/SCOPE.md` in plain language:
- The goal in one paragraph: what a person who completes the atlas can do (design, build, program
  and verify working robots).
- The **inclusion test**: when a skill belongs in scope, for example "it is required, directly or
  through prerequisites, to build or verify a robot capability in the atlas", and how supporting
  skills (maths, physics, electronics, mechanics, computing) qualify.
- The **backbone**: the build-and-verify milestones that define "done", starting from the Robotics V3
  milestones I01–I05 and the X advanced pathways, plus any milestone the roadmap's branches imply
  that V3 lacks (for example fault handling, calibration and identification, machine elements).
- **Explicit exclusions**, and **open boundary questions** for JC with options and a recommendation
  (for example: whether general mathematics not on any robotics path stays in the atlas, and to
  what depth).
- How the scope will be kept: who changes it, and how a change is recorded.
**Result:** Done. `docs/SCOPE.md` (draft):
- The goal: design, build, program, integrate and verify arms, wheeled robots and mobile
  manipulators, from numeracy up.
- A 4-tier inclusion test (core / extension / foundation by prerequisite links / context, open),
  plus the roadmap's granularity rule.
- The backbone: I01–I05 core and X01–X09 extensions, with three roadmap capabilities to check in
  Task 4.
- Proposed exclusions, and six open questions Q1–Q6 with recommendations.
- How it is kept: JC-only changes through PRs, with a change log.

## [x] Task 3 — Measure the master against the scope (read-only)
**Do:**
- For every master skill, classify it by its prerequisite connections: **on a robotics path** (it
  is, directly or through a chain, a prerequisite of a robotics skill), **supporting only** (linked
  by supports or related links only), or **not connected to any robotics skill**. Count by domain and
  subdomain.
- List the master's robotics-domain skills and the V3 milestones they would serve.
- Flag likely duplicates within the master (the roadmap's "duplicate representations across
  imported math collections"): same or near-same names across subdomains. Report candidates only;
  merge nothing.
- Write `reports/scope/03-master-vs-scope.md`.
**Result:** Done; both maps unchanged.
- In scope by prerequisite links: 245 skills (14%) seeded by the 44 master robotics skills, or 324
  (18%) when counting the 204 ids V3 reuses.
- The 1,033-skill general-maths import (58% of the atlas) is on no path; 998 of them hang off `m-*`
  overviews by related links. The 66 granular batch skills are also off-path. Computing reaches
  robotics only through V3.
- The master's 44 robotics skills map to 10 V3 branches (a judgement, not a crosswalk).
- No exact duplicate names; 7 near-duplicates, 2 likely the same ability.
- Evidence for refining Q1: treat a granular decomposition of an in-scope overview as in scope.
See `reports/scope/03-master-vs-scope.md`, `scope/master-tiers.json`.

## [x] Task 4 — The branch map: every branch, its boundary and its status
**Do:** Combine the roadmap's branch tables, the 19 Robotics V3 branches and the measurements from
Tasks 1 and 3 into one list of branches across all six domains. For each branch:
- its scope boundary and exclusions;
- existing skills that cover it (master ids, V3 ids), and their count;
- status: **covered**, **partial** or **missing**, with the evidence;
- each roadmap candidate outcome mapped to: an existing skill, a **proposed new skill** (with a
  one-line observable ability), a split of a broad existing skill, or an explicit deferral, as in
  the roadmap's "definition of a completed branch review";
- a rough size of the remaining work in skills, labelled as an estimate.
Write `scope/branches.json` and add the branch table to `docs/SCOPE.md`. Report totals: covered /
partial / missing branches, and the estimated total skills when the scope is complete.
**Result:** Done; both maps unchanged.
- 46 branches: the roadmap's 43, plus S8 CAD/fabrication, R13 milestones and R14 advanced pathways.
  All 1,769 master skills and 177 V3-only entries were placed.
- Branch status: 7 covered in the master today, 9 covered after the V3 merge, 3 covered by V3 only
  (not in the roadmap), 24 partial, 3 audit needed (maths), 0 missing.
- The 132 roadmap candidates, reviewed by hand: 86 existing (27 only in V3), 34 splits, 4 new,
  7 planning tasks, 1 deferred.
- Estimate: ≈ 540–615 skills in the finished required scope (strict rule); ≈ 1,984–2,060 for the
  whole atlas with context. With lessons on every skill, that is over the 10 MB cap.
See `docs/SCOPE.md` §7, `scope/branches.json`, `reports/scope/04-branch-map.md`.

## [x] Task 5 — Decision brief for JC
**Do:** One document, `reports/scope/05-decisions.md`, with the evidence, options and a
recommendation for each:
- the open boundary questions from Task 2;
- the five structural questions in PLATFORM.md §10.3 (`X06`, the `s-*` track, thermal, `K05`–`K07`,
  the stranded calculus entries), restated as scope decisions;
- `B-D08` filed under Mechanics although it is a thermal calculation;
- the duplicate candidates from Task 3 that need a ruling;
- a specification for a `requires_physical_evidence` field in future edition packages, so the
  hardware warning no longer depends on wording (see PLATFORM.md §3.5). Specification only.
List what the later V3 merge will need, including the `m-logic` answer conflict, **without reading
any answer**.
**Result:** Done. `reports/scope/05-decisions.md` has 14 decisions, each with evidence, options and
a recommendation:
- Q1–Q6, with Q1 refined by the measured "decomposes" pattern.
- The five §10.3 structural questions: X06 → outcome; s-* track optional; thermal → S7; K05–K07 →
  prerequisites; calculus case by case.
- B-D08 (resolved by S7), and duplicate rulings (2 same-ability pairs).
- A `requires_physical_evidence` specification, backfilled through an overrides table so stored
  lessons never change.
- A 9-point merge checklist (crosswalk, id policy, families, `m-logic` with no automatic winner,
  sessions, levels, pipeline, capacity, backups). No answer was read.

## [x] Task 6 — Wave plan and capacity checkpoint
**Do:**
- Turn the branch map into an ordered list of branch packages (the roadmap's six waves, adjusted by
  the measurements), each with its estimated skill count and dependencies.
- Mark the point where the atlas would pass about **3,000 skills**, the practical limit of today's app
  (`reports/capacity/03-current-app.md`, on branch `capacity-stress-test`). Capacity steps 1–4 of
  `reports/capacity/05-proposal.md` must land before that package.
- Write `reports/scope/06-wave-plan.md`.
**Result:** Done.
- 10 ordered packages: decisions → capacity steps 1–4 → **V3 merge (the largest step: +177 skills,
  298 lessons)** → robotics completions → electronics, mechanics, physics and computing splits
  (38–114 skills) → maths audit → extension pathways.
- Roadmap wave 1 is already done; waves 2–5 are covered by V3.
- **The atlas never passes 3,000 skills** (≈ 2,060 at most). The binding limit is the 10 MB file
  cap with lessons: ≈ 7.6 MB after the merge, ≈ 9.1–9.75 MB with lessons on all required skills
  (size model within 3% of the measured V3 file).
- So the capacity checkpoint is before the merge.
See `reports/scope/06-wave-plan.md`.

## [ ] Task 7 — Push and summarize
**Do:**
- Confirm no real map, nothing from `Maps/`, `packages/`, `backups/`, `Archive/`, and no answer or
  session data is in any commit on this branch. Confirm both real maps' SHA-256 are unchanged since
  Task 0.
- Push `scope-foundation`. Do not open a pull request.
- End with a plain-language summary: tasks finished or stopped and why, the scope in two sentences,
  covered / partial / missing branch counts, the estimated finished size, the decisions waiting
  for JC, branch and commit IDs, and every report file written.
**Result:**

---

## NOT QUEUED — needs JC's decision first (planned order)
1. **Capacity safety** (steps 1–4 of `reports/capacity/05-proposal.md`). Needed before the atlas
   passes about 3,000 skills. It needs a decision on merging `capacity-stress-test` first.
2. **Move the repository out of OneDrive.** Best done before content grows.
3. **Wave 1 branch package:** robotics frames, transforms, configuration, basic kinematics.
4. **Merging Robotics V3 into the master atlas**, and the `m-logic` answer conflict.
5. **Cleaning up merged branches.**
6. The 8,000-skill re-architecture beyond capacity steps 1–4, if the wave plan needs it.
