# TASKS — HelixSkill — Campaign: subject build-out

Started 2026-11-05. JC: *"Let's scrap the last two steps from the list and start a new campaign for
the project … building out all the skills for the other subjects necessary for the specific robotics
goals … with Claude in the desktop app and bring back the hierarchies soon."*

**Waiting for the first batch.** The campaign folder is `campaigns/subject-buildout/`.

The previous queue (core lessons, step 7) is preserved in Git: merged in PRs #24 and #25, its final
queue file at `63426b9`.

## Done since the campaign started: the Humanoid Protocol Droid Helix map

A new map, `Maps/Humanoid-Helix-Atlas.json`, was built on 2026-11-05 from a hierarchy JC authored in
the desktop app. It merges the Robotics Atlas with the humanoid helix taxonomy. Edition 1 (3,422
skills, 11,281 connections) was merged in PR #26; its queue file is at `f272516`.

**Edition 2** was built on 2026-11-06 on branch `humanoid-helix-map`, not pushed or merged. It has
3,696 skills and 12,138 connections (10,741 prerequisites), the longest chain is 81, and the top
level is 244. It adds 274 physics skills and 857 links and removes nothing. It keeps the
`humanoid-helix-v1` key, so answers already given on the helix map stay. All 18 validation checks pass.

- [x] Rebuild from `Humanoid-Helix-Extension 2.json`, then validate.
- [x] Unit tests (269 pass) and the helix end-to-end test (19 checks), with screenshots retaken.
- [x] Performance measured; import notes updated.
- [x] Rebuilt with JC's re-exported workbook (3,696 rows): 63 Atlas skills move onto the path, 410 stages change, and 9 tiers go from Enrichment to Core. The sheet now matches the graph exactly.
- [ ] JC: review the branch, then decide whether to push and merge it.

- Mapping decisions, validation, performance and the open decisions: `docs/humanoid-helix-import.md`.
- Rebuild: `node authoring/humanoid-helix/build-helix-map.mjs`. Validate:
  `node scripts/validate-humanoid-helix.mjs`.
- `Maps/Robotics-Atlas.json` is still the working Robotics Atlas, unchanged (`1212ad46…`). The helix map
  is a separate map, with its own answer family (`humanoid-helix-v1`).
- **Open decisions for JC:**
  - six domains with course fields, or 16 domains;
  - whether the Atlas tier becomes a node field;
  - whether to speed up drawing all connections at once;
  - the treatment of `rob3:X10`.

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
  Regenerate it with `node authoring/campaign/export-reference.mjs`. It describes the Robotics Atlas,
  not the helix map.
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
