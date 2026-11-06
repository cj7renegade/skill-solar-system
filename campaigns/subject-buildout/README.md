# Campaign: subject build-out

Started 2026-11-05 at JC's request. The robotics core is finished: every core skill has a lesson
(steps 1–7 of `reports/scope/07-checkpoint.md`). Steps 8 (the mathematics audit) and 9 (the extension
pathways) are **dropped from the plan**.

The new campaign builds out the skills that the humanoid milestones I06–I09 need, on the Humanoid
Protocol Droid Helix map (`Maps/Humanoid-Helix-Atlas.json`), course by course. It was re-scoped
from the Robotics Atlas's I01–I05 on 2026-11-06. **JC authors the hierarchies with Claude in the
desktop app** and brings each one back here as a batch for integration.

## In this folder

| File | For | What it is |
| --- | --- | --- |
| `AUTHORING-BRIEF.md` | Claude in the desktop app | What to build, the atlas's rules, and the exact batch format |
| `handoff/Atlas-Reference.json` | Claude in the desktop app | Read-only export of the working atlas: ids, names, subjects, branches, prerequisites and coverage flags. No answers, positions or lesson text |
| `handoff/Helix-Reference.json` | Claude in the desktop app | The same export of the Humanoid Protocol Droid Helix map (edition 2: 3,696 skills, including the 274 new physics skills), with each skill's course, build stage, humanoid-path flag, helix level and tier, and an `onHelixGoalPath` flag (I08 or I09 needs it) |
| `intake/` | Claude Code | Where returned batches go: one folder per batch |

Regenerate a reference after its map changes: `node authoring/campaign/export-reference.mjs` (Robotics
Atlas) or `node authoring/campaign/export-reference.mjs --helix` (helix map). Attach the one for the
map the batch will be built on.

## How JC uses it

1. In the desktop app, start a conversation per subject. Attach `AUTHORING-BRIEF.md` and
   `handoff/Atlas-Reference.json` (or `handoff/Helix-Reference.json` for a batch on the helix map),
   and ask for a batch for one or two branches.
2. Save what comes back, the batch JSON and its `COVERAGE.md`, into `intake/<batch-id>/`.
3. Tell Claude Code the batch is there. It runs the intake (`AUTHORING-BRIEF.md` §7), with Checkpoint A
   before anything is built and Checkpoint B before the working map changes.

## Status

| Batch | Subject | Received | Integrated |
| --- | --- | --- | --- |
| — | — | — | — |
