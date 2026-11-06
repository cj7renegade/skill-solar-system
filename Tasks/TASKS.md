# TASKS — HelixSkill — Campaign: subject build-out

Started 2026-11-05. JC: *"Let's scrap the last two steps from the list and start a new campaign for
the project … building out all the skills for the other subjects necessary for the specific robotics
goals … with Claude in the desktop app and bring back the hierarchies soon."*

**Waiting for the first batch.** The campaign folder is `campaigns/subject-buildout/`.

The previous queue (core lessons, step 7) is preserved in Git: merged in PRs #24 and #25, its final
queue file at `63426b9`.

## Decisions recorded

- **Steps 8 and 9 are dropped** from `reports/scope/07-checkpoint.md` §2: the mathematics audit (the
  two same-ability duplicates and the "decomposes" relationship) and the extension pathways X01–X09.
  Nothing from them was started. The roadmap and `docs/SCOPE.md` record the change.
- **The supporting subjects are authored outside this repository**, by JC with Claude in the desktop
  app, and integrated here batch by batch.

## What is ready

- `campaigns/subject-buildout/AUTHORING-BRIEF.md`, for Claude in the desktop app. It covers the
  goal, the scope, the atlas's rules (inclusion through dependencies, granularity, reuse before
  adding, never touch existing skills, no answers), the id policy, the exact batch JSON format, the
  checks to run before delivery, and what happens on import.
- `campaigns/subject-buildout/handoff/Atlas-Reference.json`: a read-only export of the working atlas
  (`1212ad46…`), with 1,955 skills, 46 branches and 5 milestones. It has ids, names, subjects,
  branches, descriptions, prerequisites and coverage flags, and no answers, positions or lesson text.
  Regenerate it with `node authoring/campaign/export-reference.mjs`.
- `campaigns/subject-buildout/intake/`, where returned batches go.

## Intake, per batch (to be queued when a batch arrives)

1. **Starting state:** fingerprints, a backup, and the batch read in full.
2. **Reconcile:** each new skill against the live atlas, by id and by meaning; every edge endpoint;
   loops; inclusion (does each skill lead to the core?); and every `intoExisting` link.
3. **Checkpoint A:** JC approves the skills, any duplicates found, and each `intoExisting` link.
4. **Gated build in scratch**, reusing the splits tool (`authoring/splits/`). No answer, existing
  skill, connection or lesson may change; only approved edges are added; levels are recalculated.
5. **Tests**, unit and end-to-end, plus a check that opens the map with the batch's skills.
6. **Checkpoint B:** JC opens the result and says go.
7. **Working map**, with a dated backup, then a pull request.
8. **Refresh `Atlas-Reference.json`**, so the next batch sees the new skills.

## Still open (unchanged)

- The 44 evidence cards in `evidence-overrides.json`, and the "Physical work" wording on cards in the
  *circuit analysis or supervised measurement* mode (`reports/lessons/03-edition09-results.md`).
- Moving the project out of OneDrive.
- Deleting about 27 merged branches.
