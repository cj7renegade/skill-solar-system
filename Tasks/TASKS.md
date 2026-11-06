# TASKS — HelixSkill — Humanoid Protocol Droid Helix map

Requested 2026-11-05: build a NEW map, `Maps/Humanoid-Helix-Atlas.json`, merging the Robotics Atlas with
the humanoid helix extension. Import, schema mapping, layout, validation and display only: no skill or
link is authored, renamed or deleted. Branch `humanoid-helix-map`; commit in logical steps; **do not
push or merge.** Mapping decisions: `docs/humanoid-helix-import.md`.

The previous queue (core lessons, step 7) is preserved in Git at `63426b9`. The subject build-out
campaign set-up is on the unmerged branch `subject-buildout` (`741a317`).

## Steps
- [x] Locate and read the inputs. They were at the repository root; they are copied into
  `imports/humanoid-helix/`, with the originals left in place.
- [x] Extract the workbook's Full Taxonomy sheet (`authoring/humanoid-helix/extract_taxonomy.py`).
- [x] App support for helix maps, active only when `layout.type` is `helix`:
  - `src/helix.js`: layout, course colours, filters and tiers;
  - level range from `levelModel`;
  - course colours, milestone and checkpoint markers;
  - legend filters;
  - helix-aware arrange buttons;
  - helix wording on the card.
- [x] Build the map (`authoring/humanoid-helix/build-helix-map.mjs`).
- [x] Validate (`scripts/validate-humanoid-helix.mjs`): 17 checks pass.
- [ ] Record every mapping decision in `docs/humanoid-helix-import.md`.
- [ ] Unit tests for the helix module and the level range; the existing tests still pass.
- [ ] End-to-end check: the map opens and renders; filters work; one Atlas card and `hx-act-harmonic-drive`
  open; the Robotics Atlas still opens. Screenshots in `docs/screenshots/humanoid-helix/`.
- [ ] Profile the map in the app (`authoring/stress/measure-app.mjs`).
- [ ] Full test suite (unit and end-to-end); lint (none configured; record that).
- [ ] Final report.
