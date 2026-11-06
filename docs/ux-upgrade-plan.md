# UX upgrade plan: from data viewer to learning tool

Branch `ux-hud-upgrade`, one commit per phase, not pushed or merged. Phases are tracked as checkboxes
in `Tasks/TASKS.md`.

## What the code does today (read before changing anything)

- **Renderer (`src/viewer.js`).** three.js, rendered on demand: a frame is drawn only when the camera
  or the state changes, so the measured orbit rate is capped by the display at about 60 fps. Every skill
  is its own `Mesh` with its own material, and `setGraph()` rebuilds every mesh, label and line on any
  change (selection, an answer, a filter). Nameplates are DOM elements, hidden when too small to read
  (`nameplates.js`). Subject highlights are instanced shells plus fixed-size rings.
- **Layout (`src/helix.js`, `src/vortex.js`).** Positions are saved in the map file. On the helix,
  height = (helix level − 1) × `layout.heightPerLevel`, and each course has an equal angular sector
  (`courseOrder`), using 80% of the sector. Re-arranging writes new positions into the map, so it
  counts as a data change and is not used here.
- **App (`src/app.js`).** One `render()` refreshes the counts, header, viewer, legend, list and
  inspector. Answers change only through `commit()`: history, local draft, shared record.
- **Proficiency.** `proficiency80`: `true` (Yes), `false` (No), `null` (not marked). There is no
  "learning" state. The shared record (`proficiency.js`) keeps an `updatedAt` per answer.
- **Review (`review.js`, `review-dialog.js`).** A guided pass that asks Yes/No for each skill, with
  saved, resumable sessions per map. **It has no due dates or spacing.**
- **Map fields.** Only helix maps have `course`/`courseCode`, `buildStage`, `onHumanoidPath`,
  `helixLevel` and a tier. The Robotics Atlas has domains, `skillLevel` 1–100, and 5 milestones. The
  starter map has none of these.
- **No graph-layout library** is installed: three.js is the only dependency.

## Shared definitions (`src/learner.js`, pure and unit-tested)

| Term | Implementation |
| --- | --- |
| Proficient | `proficiency80 === true`. Nothing in this work writes it except the reader's own Yes, No or Clear. |
| Frontier | not proficient, and every prerequisite (prerequisite edges only) is proficient. Entry skills, milestones and checkpoints count. |
| Milestone chain | nodes with `nodeKind: "milestone"`, ordered by helix level, then reference level, then height |
| Active target | the stored choice for this map, else the lowest milestone not complete. Stored per map (review map key) in `localStorage`. |
| Remaining path | non-proficient ancestors of the target, plus the target unless it is proficient |
| Effort | Core 2, Working 3, Specialist 5, Enrichment 1.5, Checkpoint 3, Milestone 40 h; hands-on practice ×2. A skill with no tier (Robotics Atlas) counts as Core. Always shown with "~". |
| Next up | frontier ∩ remaining path, lowest level first, then most remaining-path skills unlocked (descendants inside the path) |
| Study order | Kahn's topological sort inside the set, choosing the lowest level first when several are ready |

## Decisions taken (conservative; each is a question for JC in the final report)

- **"Due for review"**: the review system has no due dates. The HUD shows the saved, **unfinished
  review session** for this map ("Review in progress · N left") and resumes it on click. With no
  unfinished session, the row is hidden, as the brief says to do when there is no data.
- **"Learning" state**: there isn't one, so it is skipped. **No and Not marked** are both "not
  proficient". In the proficiency view they are two greys of different lightness, so the No answer stays
  visible without a red/green pair.
- **Band gaps without moving saved positions**: the gap between course sectors is widened at display
  time. Each skill's angle is pulled toward its sector's centre, exactly like the existing sphere
  spacing, and edit-mode dragging inverts it. The file's positions never change.
- **Stage rings** use the brief's rule (first appearance of stage N on the humanoid path). On this map
  that rule puts stages 1–2 at level 1, stage 3 at 10, stages 4–6 at 13 and stage 7 at 40, because
  stages overlap heavily in height. Rings closer than a few levels share one ring and label. See the
  final report.
- **Labels always on for frontier skills** are limited to those on the active target's remaining
  path (the Next up candidates), within the label budget. With nothing marked, the whole map has only
  5 frontier skills, but after some marking it can have hundreds.

## Phases

1. Learner HUD: compact card with the target selector, progress to target, overall progress, review,
   and Next up; frontier halo on the map.
2. Colour system: a palette module with 5 families, a proficiency view in grey, slate and gold, a
   colour-blind check script, and an interactive legend (isolate a course or family, counts and %).
3. Helix structure: a milestone spine with labels, stage rings, a height ruler, course band labels,
   and wider band gaps (display-only).
4. Level of detail: subject clusters when zoomed out, a label budget and overlap removal when zoomed
   in, and fades.
5. Path mode: a path card with a study order, batched path edges, Esc to exit, and a 2D plan view
   (layered layout with barycentre ordering, written here).
6. Right panel: a Today view, a skill list (frontier, recent, level; A–Z option), and a skill card with
   chips, a mini graph and actions.
7. Header, status and safety: map name, an autosave indicator, a File menu, risky actions only in Edit
   mode with confirmation, a View popover, "skills · links", and text ≥ 11 px.

Each phase keeps existing element ids where tests drive them, runs unit tests and the affected
end-to-end tests, re-measures fps, and takes screenshots (`tests/ux-screens.mjs`).

## Measurements

`authoring/stress/measure-app.mjs`, isolated profile, scratch copies, default settings. Orbit = 10 s
of continuous drag, median fps (worst 5%).

| Phase | Helix: open | Helix: orbit | Robotics Atlas: orbit |
| --- | --- | --- | --- |
| 0 baseline | 0.85–0.89 s | 59.9 (59.5) | 59.9 (59.5) |
| 1 HUD and frontier glow | 0.88–0.92 s | 59.9 (59.5) | not re-measured |

Map files before (SHA-256): `Humanoid-Helix-Atlas.json` `4cdfc20d…`, `Robotics-Atlas.json`
`1212ad46…`.
