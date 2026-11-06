# TASKS — HelixSkill — Campaign: subject build-out

Started 2026-11-05. JC: *"Let's scrap the last two steps from the list and start a new campaign for
the project … building out all the skills for the other subjects necessary for the specific robotics
goals … with Claude in the desktop app and bring back the hierarchies soon."*

**Waiting for the first batch.** The campaign folder is `campaigns/subject-buildout/`.

The previous queue (core lessons, step 7) is preserved in Git: merged in PRs #24 and #25, its final
queue file at `63426b9`.

## In progress: UX upgrade (branch `ux-hud-upgrade`, not pushed)

JC's brief of 2026-11-06: make the app a learning tool (HUD, colours, helix structure, level of
detail, path mode, panel, header). Plan and measurements: `docs/ux-upgrade-plan.md`. No map data
changes; proficiency stays manual. Commit per phase.

- [x] Phase 0: read the code, plan, baseline fps (59.9) and before screenshots
- [x] Phase 1: learner HUD and frontier glow
- [x] Phase 2: colour system, palette check and interactive legend
- [ ] Phase 3: milestone spine, stage rings, height ruler and course band labels
- [ ] Phase 4: level of detail and label budget
- [ ] Phase 5: path mode and 2D plan view
- [ ] Phase 6: right panel (Today, skill list and skill card)
- [ ] Phase 7: header, status, View popover and risky actions
- [ ] Verification: tests, map SHA-256 unchanged, final screenshots and report

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
- **Re-scoped on 2026-11-06 to the humanoid milestones I06–I09** on the helix map. Batches change
  only `Maps/Humanoid-Helix-Atlas.json`, and the Robotics Atlas stays as it is unless JC asks.

## What is ready

- `campaigns/subject-buildout/AUTHORING-BRIEF.md`, for Claude in the desktop app. It covers the
  goal (I06–I09 on the helix map), the scope, the rules (inclusion: every skill leads to I08 or I09;
  close each branch; granularity; reuse before adding; never touch existing skills; no answers), the
  id policy (`sss-<course>-<slug>`), the batch JSON format (version 2, with course, stage, tier, type
  and practice), the checks to run before delivery, and what happens on import.
- `campaigns/subject-buildout/handoff/Helix-Reference.json`: the reference for batches, exported from
  the helix map (edition 2, 3,696 skills, 9 milestones) with
  `node authoring/campaign/export-reference.mjs --helix`.
- `campaigns/subject-buildout/handoff/Atlas-Reference.json`: a read-only export of the working atlas
  (`1212ad46…`), with 1,955 skills, 46 branches and 5 milestones. It has ids, names, subjects,
  branches, descriptions, prerequisites and coverage flags, and no answers, positions or lesson text.
  Regenerate it with `node authoring/campaign/export-reference.mjs`. It describes the Robotics Atlas
  and is kept only in case a batch targets that map.
- `campaigns/subject-buildout/intake/`, where returned batches go.

## Intake, per batch (to be queued when a batch arrives)

1. **Starting state:** fingerprints, a backup, and the batch read in full.
2. **Reconcile:** each new skill against the live helix map, by id and by meaning; every edge
   endpoint; loops; inclusion (does each skill lead to I08 or I09?); stage order; and every
   `intoExisting` link.
3. **Checkpoint A:** JC approves the skills, any duplicates found, and each `intoExisting` link.
4. **Gated build in scratch.** No answer, existing skill, connection or lesson may change; only
  approved edges are added; helix levels and the layout are recalculated. **To build before the first
  batch:** the splits tool (`authoring/splits/`) targets the Robotics Atlas, so a helix batch needs
  its own step. That could be an extra input to `authoring/humanoid-helix/build-helix-map.mjs`, so a
  rebuild from the extension keeps the batches, plus a validator check per batch.
5. **Tests**, unit and end-to-end, plus a check that opens the map with the batch's skills.
6. **Checkpoint B:** JC opens the result and says go.
7. **Working map**, with a dated backup, then a pull request.
8. **Refresh `Helix-Reference.json`** (`--helix`), so the next batch sees the new skills.

## Still open (unchanged)

- The 44 evidence cards in `evidence-overrides.json`, and the "Physical work" wording on cards in the
  *circuit analysis or supervised measurement* mode (`reports/lessons/03-edition09-results.md`).
- Moving the project out of OneDrive.
- Deleting about 27 merged branches.
