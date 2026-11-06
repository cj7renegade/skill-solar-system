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
- [x] Record every mapping decision in `docs/humanoid-helix-import.md`.
- [x] Unit tests for the helix module and the level range (`tests/helix.test.mjs`, 9 tests). All unit tests: 269 pass, 0 fail, 6 skipped.
- [x] End-to-end check (`tests/humanoid-helix-e2e.mjs`, 18 checks): the map opens and renders; filters work; the`
  `rob3:K05` and `hx-act-harmonic-drive` cards open; the Robotics Atlas still opens. Six screenshots are in`
  `docs/screenshots/humanoid-helix/`.
- [x] Profile the map in the app: the same 56.8 fps as the Robotics Atlas; it opens in 0.8 s. Drawing all 11,281`
  connections at once stutters. See the notes.
- [x] Full test suite: unit 269 pass; end-to-end 807 pass, 0 fail, the same as before. No linter is configured`
  (no lint script in `package.json`).
- [x] Final report.
