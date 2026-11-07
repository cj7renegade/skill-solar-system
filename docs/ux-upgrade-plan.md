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

## Notes from the build

- **Phases 3–6 share one commit.** Their viewer and app changes are interleaved (the draw loop, the
  label pass and the inspector), so they could not be split into separate working states honestly.
- **Level of detail only where it means something:** maps with at least 400 skills and at least 8
  subjects, averaging 3 or more skills each. A map without subjects, such as the 625-sphere grid in
  `tests/pan-e2e.mjs`, keeps every sphere.
- **Off-screen nameplates** are positioned as before but are outside the label budget and the
  overlap test, which govern only what is on screen. The pan test reads them.
- **Esc** steps back one level at a time: from the 2D plan to path mode, then out of path mode, then
  it clears the selection.

## What was built, phase by phase

1. **Learner HUD** (`src/hud.js`, `src/learner.js`). The title block is replaced by a compact card:
   - the map name and the active target, with a selector and a **Path** button;
   - progress to the target: a bar, "N / M prerequisites proficient" and "~h left";
   - overall progress toward I08 (or the map's top milestone);
   - the unfinished review (when there is one);
   - **Next up**: frontier skills on the remaining path, with a course chip and ~hours. Click to select
     and fly there.

   Frontier skills glow on the map: one point sprite each, in a single draw call.
2. **Colour system** (`src/palette.js`, `scripts/check-palette.mjs`).
   - Five course families: Foundations in blues, Body in oranges, Nervous system in greens and teals,
     Mind & behaviour in purples and magentas, Systems in near-white.
   - The proficiency view is gold for Yes, a lighter grey for Not marked and a darker slate for No, with
     the glow marking ready skills. The pulse is now gold to cream.
   - The legend isolates a course or a whole family (others fade to 15%; click again to clear) and shows
     each course's skill count and % proficient. The filters and the six-domain highlights sit in a
     folded Filters section.
3. **Helix structure** (`src/structure.js`, `bandView` in `src/helix.js`).
   - The milestone spine: a line through I01–I09 on the axis, with labels on alternating sides and the
     target marked. Completed milestones are filled (gold label ✓), and incomplete ones are drawn as
     wireframes.
   - Stage rings with labels.
   - A height ruler with a tick every 20 levels and its meaning; the same explanation is in the HUD line
     and its tooltip.
   - A label for each course band, placed on the stretch of the band that faces the camera.
   - Band gaps widened to 44% of each sector at display time.
4. **Level of detail** (`src/lod.js`).
   - Zoomed out, 353 subject clusters (two instanced meshes) replace the dot cloud. Each is sized by skill
     count, with a gold core whose volume is the proficient share. Subject names are placed largest
     first, without overlaps.
   - Clicking a cluster flies in. Zoomed in, skill nameplates are placed nearest first, at most 60, with no
     overlaps, keeping last frame's choices within a depth band.
   - The selection, milestones and Next up skills always show.
   - A 0.28 s cross-fade, no layout recomputation, and a View setting to turn grouping off.
5. **Path mode and 2D plan** (`src/plan.js`).
   - "Path to this" on any skill, **Path** on the HUD target, and **Path mode** in the toolbar.
   - The path stays lit and everything else dims. Only links inside the path are drawn, as one batched
     line set, and the camera frames the path.
   - The path card reads "To reach X: N skills left · ~h · K courses" and lists the study order.
   - The 2D plan lays out the path (or an isolated course or family) in prerequisite-depth columns and
     course lanes. Clicking a skill selects it in both views.
   - Esc closes the plan, then path mode.
6. **Right panel** (`src/panel.js`).
   - With nothing selected, **Today** lists Next up (20), the unfinished review and recently studied
     skills (from the shared record's timestamps). The empty placeholder is gone.
   - The list reads "Find a skill…" and orders ready skills first, then recent, then level, with an A–Z
     option.
   - A selected skill shows chips (course, helix level, stage, tier, ~hours, ready or proficient), Open
     lesson or Read skill details, Path to this, Fly to, and a mini graph: two steps of prerequisites and
     what it unlocks.
7. **Header, status and safety.**
   - The header shows the open map's name; the version moved into the tour.
   - **One save indicator**: Saved ✓, Saving… or Unsaved changes. Its tooltip says whether the latest
     change has been exported.
   - Open and Save map live in a **File** menu.
   - The layout tools appear only in Edit mode, each behind a confirmation that says what changes and
     that Undo reverses it.
   - The toolbar has Find, Fit, Front, Path mode, Mark proficiency and a **View** popover (labels, links,
     proficiency view, grouping, spacing).
   - The hints line is 11 px, the status bar reads "N skills · N links", and "skill" and "link" are
     used throughout. No visible text is under 11 px (checked by the end-to-end test).

## Phases (as planned)

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
| 2 colour system and course key | 0.92 s | 59.9 (59.5) | not re-measured |
| 3 spine, rings, ruler, band labels | 1.04–1.12 s | 59.9 (59.5) | 59.9 (59.5) |
| 4–5 level of detail, labels, path mode | 1.18–1.19 s | 59.9 (59.5) | 59.9 (59.5), opens in 0.62 s (0.49 s before) |
| 6 right panel | 1.19–1.23 s | 59.9 (59.5) | not re-measured |
| 7 header, status, menus (final) | 1.20–1.21 s | 59.9 (59.5) | 59.9 (59.5), opens in 0.64 s |

Orbiting stays at the display's 60 Hz limit throughout, well above the 45 fps floor. Opening the helix
map takes about 0.35 s longer than at baseline, because the HUD, clusters, structure and Today view are
built when the map opens.

## Colour-blind check (phase 2)

`node scripts/check-palette.mjs` simulates deuteranopia and protanopia (Machado 2009, severity 1.0)
and measures CIEDE2000 (ΔE00) for:
- every pair of courses next to each other around the helix, with a floor of 10;
- every pair inside a legend family, with a floor of 6;
- the three proficiency states, with a floor of 10.

Every pair meets its floor under all three kinds of vision. Lowest values:
- around the helix: ACT–ELX at 12.1, protanopia;
- inside a family: LOC–AIL at 8.2;
- proficiency states: No against Not marked at 23.1.

Four first-draft shades failed: MEC–ACT at 8.1, LOC–MAN at 6.9, MAN–PER at 5.8 and MAN–AIL at 3.6.
They were re-chosen, the Mind & behaviour family by a constrained search over purple and magenta
shades. The full table is printed by the script.

## Tests on the final build

- **Unit tests:** 287 pass, 0 fail, 6 skipped (`npm test`). New suites cover the shared
  definitions (`learner`: frontier, remaining path, effort, study order and targets, on small
  fixtures with entry skills and milestones), plus `structure`, `lod`, `plan` and `panel`.
- **End-to-end, ordinary files:** 307 checks pass across the 14 files that need no special map,
  including the new `tests/learner-e2e.mjs` (51 checks, one or more per phase) and the existing
  `humanoid-helix-e2e.mjs` (19).
- **End-to-end, stage maps:** 560 checks pass with their scratch maps, without `SSS_RECORD`:
  robotics-v3 (494), merged-atlas, completions, splits, core-lessons and core-lessons-09.
- **Skipped:** the six atlas sub-map files (atlas, dc, physics, material, statics, robotics). They
  need `SSS_ATLAS` plus a sub-map, and were skipped in the earlier full runs too.
- **Tests changed** because the UI they drove changed on purpose:
  - the counts now read "skills · links";
  - Save map is under File, and the proficiency view is under View;
  - "Local draft" became the export flag on the save indicator;
  - the details button is found by its id, `open-details`;
  - Today replaced the empty-panel placeholder;
  - proficiency colours are gold, slate and grey instead of green and red.

## Map files: unchanged

SHA-256 of every file in `Maps/` before the work and after the final build, identical:
`Humanoid-Helix-Atlas.json` `4cdfc20d…`, `Robotics-Atlas.json` `1212ad46…`,
`Humanoid Protocol Droid Helix.json` `6d8f73a2…` and `Skill-Solar-System.json` `8e170740…`. The
app reads the maps; every new view is computed from them on screen.

## Screenshots (`docs/screenshots/ux-upgrade/`)

`tests/ux-screens.mjs` takes the same set for each phase, prefixed `before-`, `phase1-` to
`phase7-`, and `after-` (the final build):

| File | Shows |
| --- | --- |
| `…-01-helix-course-view.png` | the full helix zoomed out, in course colours |
| `…-02-hud-with-progress.png` | the HUD after 10 skills are marked Yes |
| `…-03-helix-proficiency-view.png` | the same in the proficiency view |
| `…-04-selected-skill-panel.png` | the selected-skill panel (`hx-act-harmonic-drive`) |
| `…-05-path-mode.png` | path mode to that skill (from phase 5) |
| `…-06-plan-view.png` | its 2D plan (from phase 5) |
| `…-07-robotics-atlas.png` | the Robotics Atlas with the same UI |

## Still for JC to decide

- **Stage rings:** keep the brief's rule (first appearance, which bunches the rings low on this map),
  or place each ring where its stage's milestone sits (levels 187–244)?
- **Level-of-detail threshold:** detail appears within 0.45 × the map's size of its bounding box
  (`LOD_NEAR` in `src/lod.js`). From Fit map, individual skills appear after zooming part of the way
  in, or at once when you click a cluster, Next up item or search result.
- **Palette:** the five families pass the colour-blind check, but the shades are a first choice.
  Any change is one line in `src/palette.js`, then run `node scripts/check-palette.mjs`.
- **Due for review:** there are no due dates. Should the app gain spaced review, or is showing the
  unfinished review session enough?
- **No vs Not marked:** both count as not proficient, drawn as two greys. Should a No be treated
  differently, for example kept out of Next up?
- **Autosave:** the local draft is still saved on every change, not debounced. That is the safer
  choice, and it was already the app's behaviour; the indicator reports it. Debouncing would save work
  on rapid changes but could lose the last one if the app closed.
