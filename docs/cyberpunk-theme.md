# Cyberpunk HUD theme

JC's brief of 2026-11-06. Reference notes: [cyberpunk-reference-notes.md](cyberpunk-reference-notes.md).
Branch `cyberpunk-theme`. JC approved the style guide on 2026-11-06, and the branch was then rebased
onto `main` after the AI lessons merge (PR #33), so the lesson components are styled too.

## Phase 1: tokens and theme switch (done)

- **Tokens** are in `src/theme/tokens.js`: colours, chamfers of 8, 11 and 14 px, 1 and 2 px lines,
  glow levels, a 4/8 px spacing scale, font stacks, type sizes and motion of 120–220 ms.
  `scripts/build.mjs` writes them to `dist/theme-tokens.css`, scoped to
  `:root[data-theme="cyberpunk"]` and `.cp-scope`. Classic reads none of it.
- **Fonts:** Chakra Petch (display), Inter (body) and JetBrains Mono (readouts). They are bundled in
  `assets/fonts/` with their SIL OFL 1.1 licences, from @fontsource 5.3.0, Latin subset only. They
  work offline.
- **File ▸ Settings… ▸ Appearance** has:
  - Theme: Classic or Cyberpunk HUD. **Classic stays the default** until the style guide is approved.
  - Atmosphere effects: off by default; scanlines at 3 % opacity.
  - Reduce motion: also follows the system setting.
  - Glow: off, low (the default) or normal.
- `Reference Design/` is excluded from the packaged build (`build.files`).

## Phase 2: component kit and style guide (done; approved by JC)

The builders are in `src/theme/components.js` and the styles in `src/theme/components.css`. The style
guide is `src/theme/styleguide.js`, opened from **File ▸ Settings… ▸ Developer ▸ Open style guide**.

| Component | Variants and states shown |
| --- | --- |
| HudPanel | default, active (cyan glow), alert (red), boot reveal; brackets, header serial, one hatch strip |
| HudButton | primary (amber), secondary (cyan outline, with icon), ghost (brackets), danger (outline and fill) × default, hover, pressed, focus, disabled |
| SegmentedProgress | target (amber), overall (cyan), per course (gold, with counts), indeterminate scan (a still hatch with reduced motion) |
| ProgressRing | active milestone (amber, slow rotation), completed (gold, or a note when none is complete), course rings in course colours |
| StatReadout | skill code, helix level, stage, skills, links, opened time |
| Chips and badges | selectable course chips (dot + code); Reviewed, AI-generated · unreviewed, Flagged, No lesson yet, Frontier, Proficient, each with its own icon and words |
| Alert blocks | WARNING, SAFETY, ERROR: red frame, hazard stripe on one edge |
| Line ornaments | 4 original inline SVGs |
| Tooltip and modal | static tooltip, tooltip on hover or focus, modal preview, and a real modal |
| Inputs | text field (empty, filled, disabled), dropdown, toggle (ON/OFF in text), slider |
| Reading content | body face at 16 px / 1.55, no decoration |

- **Readouts are real.** Each comes from the open map: its name, counts, a real skill (the first
  Next up skill), progress and the local time.
  - Skill codes such as `MTH-QNT-022` are the course, the type (QNT, QL or NA) and the skill's place
    in its course, lowest level first.
  - Where data is missing, the guide says so: no target, no completed milestone, no courses.
- **Independent of Classic.** Classic's global button and input rules (opacity on disabled, amber
  focus, borders) are reset inside the kit, so components look the same in either theme.
- **Screenshots:** `docs/screenshots/cyberpunk/styleguide-01…08.png`, taken with the Humanoid helix
  map open.

## Contrast (WCAG 2.2), from `node scripts/check-contrast.mjs`

| | Ratio | Minimum | Pair | Colours |
| --- | --- | --- | --- | --- |
| PASS | 16.86:1 | 4.5 | body text on background | #E6EDF3 on #07090D |
| PASS | 15.80:1 | 4.5 | body text on panel | #E6EDF3 on #0D131A |
| PASS | 14.69:1 | 4.5 | body text on raised | #E6EDF3 on #131B24 |
| PASS | 9.04:1 | 4.5 | secondary text on panel | #A9B6C3 on #0D131A |
| PASS | 8.40:1 | 4.5 | secondary text on raised | #A9B6C3 on #131B24 |
| PASS | 6.00:1 | 4.5 | muted label on panel | #8494A3 on #0D131A |
| PASS | 6.40:1 | 4.5 | muted label on background | #8494A3 on #07090D |
| PASS | 12.17:1 | 4.5 | cyan label on panel | #2EE6F0 on #0D131A |
| PASS | 10.02:1 | 4.5 | cyan label on cyan-soft | #2EE6F0 on #10282F |
| PASS | 11.45:1 | 4.5 | amber text on panel | #F5C518 on #0D131A |
| PASS | 9.12:1 | 4.5 | amber text on amber-soft | #F5C518 on #29281A |
| PASS | 11.79:1 | 4.5 | dark text on amber (primary button | #0B0F14 on #F5C518 |
| PASS | 5.31:1 | 4.5 | red text on panel (alert | #FF3B4A on #0D131A |
| PASS | 4.89:1 | 4.5 | red text on red-soft (alert block | #FF3B4A on #25171F |
| PASS | 14.56:1 | 4.5 | body text on red-soft | #E6EDF3 on #25171F |
| PASS | 5.47:1 | 4.5 | dark text on red (danger fill | #0B0F14 on #FF3B4A |
| PASS | 9.90:1 | 4.5 | gold on panel (proficient | #E8B54A on #0D131A |
| PASS | 12.53:1 | 4.5 | dark text on cyan (selected chip | #0B0F14 on #2EE6F0 |
| PASS | 9.04:1 | 3 | display header, secondary on panel | #A9B6C3 on #0D131A |
| PASS | 12.17:1 | 3 | cyan outline on panel | #2EE6F0 on #0D131A |
| PASS | 12.99:1 | 3 | cyan outline on background | #2EE6F0 on #07090D |
| PASS | 3.32:1 | 3 | cyan 45 % outline on panel (secondary frames | #1C727A on #0D131A |
| PASS | 11.45:1 | 3 | amber outline on panel | #F5C518 on #0D131A |
| PASS | 5.31:1 | 3 | red outline on panel | #FF3B4A on #0D131A |
| PASS | 3.32:1 | 3 | input border (cyan 45 %) on panel | #1C727A on #0D131A |
| PASS | 12.17:1 | 3 | focus ring (cyan) on panel | #2EE6F0 on #0D131A |
| PASS | 12.99:1 | 3 | focus ring (cyan) on background | #2EE6F0 on #07090D |
| PASS | 5.51:1 | 3 | dim cyan chrome on panel | #1D9AA3 on #0D131A |

- **Hairlines** (`#1E2A36`) are decoration only. No control relies on them as its only boundary:
  inputs and secondary frames use cyan at 45 % (3.32:1).
- **The focus ring** is drawn 2 px outside the control, so it sits on the panel or background, not on
  the button's own fill.

## Tests

- **Unit tests** (`tests/theme.test.mjs`): the token CSS and its scoping, no green, appearance
  defaults and validation, every contrast pair, true readouts, the style guide's data, and the local
  time.
- **End-to-end** (`tests/styleguide-e2e.mjs`): Classic as the default; switching theme; fonts
  loading offline; atmosphere, reduced motion and glow; the style guide with every component; true
  readouts; a visible keyboard focus; text sizes; no decoration in reading content; the modal.

## Phase 3: the app shell (done)

`src/theme/app.css`, scoped to the Cyberpunk theme. Parts that exist in only one theme carry
`.cp-only` or `.classic-only`.

- **How frames are drawn.** App frames are layered backgrounds: four edge lines, two 45° cut lines
  and a fill with the cut corners left open. Nothing is clipped, so focus rings, glow and dropdowns
  stay visible.
- **Header:**
  - the map name in the display face, in amber (the active thing);
  - monospace readouts: skill and link counts, and the Guide's online or offline state;
  - the save state in the footer, gold when saved and red when it fails.
- **Learner HUD:**
  - a ProgressRing for the active milestone, amber and turning slowly, or gold when complete;
  - a SegmentedProgress for overall progress, and the remaining prerequisites and hours in
    monospace;
  - Next up as compact rows with course chips and ~h readouts;
  - the unfinished-review counter as an amber button.
- **Skill card:**
  - readouts for code, level, stage and effort (`MEC-NA-002 · LVL --- · STG --`; nothing is
    invented when a map has no level or stage);
  - chips with a course-colour dot;
  - the description in the body face;
  - prerequisites and unlocks as chip rows;
  - the lesson badge with an icon (✓, ◇, ⚑, ○), Generate or Open lesson in amber, and Regenerate as
    a link.
- **Legend:** course and family rows as selectable chips; the isolated row is cyan, with its
  `aria-pressed` state.
- **Toolbar and View popover:** compact chamfered buttons.
- **Lesson viewer:**
  - section titles in the display face, in cyan;
  - reading content in Inter at 16 px / 1.55 on a calm panel, with no decoration;
  - the **safety section as the red Alert block**, with a hazard stripe;
  - "Generating…" shows the scanning SegmentedProgress.
- **Confirmations for risky actions** (`src/theme/confirm.js`):
  - In Cyberpunk they are a HUD modal: red for destructive actions (delete skill, new empty map,
    restore starter, replace shared answers, clear the Guide's history or notes, regenerate a
    lesson), cyan for the others.
  - Cancel has focus first and Escape cancels.
  - Classic still uses the system dialog, unchanged.
  - **File ▸ Open map** keeps the system dialog in both themes, because the file chooser must open
    in the same click.
- **Text size:** no visible UI text is below 12 px in Cyberpunk (checked end to end). Classic keeps
  its own sizes.

## Phase 4: the 3D map (done)

- **Background:**
  - The floor shader takes theme colours (`ENVIRONMENT_THEMES` in `src/environment.js`): a
    near-black base with a subtle radial vignette.
  - The floor grid is thin and cyan at low opacity, and thins out with distance.
  - Classic's values are the originals, so its floor is identical.
- **Milestones** keep their octahedra:
  - each gets a thin tick ring that turns once every 24 s;
  - the active milestone is amber with a strong emissive glow;
  - completed milestones are gold.
- **Stage rings, spine and ruler:** thin cyan; the rings carry 60 tick marks (a long one every 30°).
  Their label plates are monospace on a dark plate with a cyan edge.
- **Selected skill:** a bracket reticle (four corner brackets) drawn in screen space around the
  sphere, scaled to its size on screen.
- **Frontier skills:** the existing glow pulses softly.
- **Labels:**
  - skill nameplates on dark backing plates with a cyan edge;
  - milestone codes, stages and the ruler in monospace;
  - course bands and subject clusters in the display face.
  - The label-overlap check measures widths in the theme's own font.
- **Bloom** (Settings ▸ Appearance, **default off**): UnrealBloomPass with a high threshold, so only
  bright emissive things bloom (the selection, the active milestone, frontier glow).
- **Motion and atmosphere:**
  - Ring turning and the frontier pulse run on a light 20 fps idle tick, only in Cyberpunk and only
    when motion is allowed.
  - Reduced motion stops them, and the system setting is followed.
  - Atmosphere effects (scanlines) are off by default.

### Frame rate (Humanoid map, 3,696 skills, `tests/theme-fps.mjs`)

| Appearance | Orbit: median | Orbit: worst 5 % | Idle: median |
| --- | --- | --- | --- |
| Classic | 59.9 fps | 59.5 fps | 59.9 fps |
| Cyberpunk HUD (default, bloom off) | 59.9 fps | 59.5 fps | 59.9 fps |
| Cyberpunk HUD with bloom | 59.9 fps | 59.5 fps | 59.9 fps |

- These were measured on this PC, with an 8-second pointer orbit.
- **The display caps every row at 60 Hz,** so the theme causes no measurable drop at the 45 fps bar.
  The extra GPU cost of bloom does not show at that cap, so bloom stays off by default as a quality
  option.

## Screenshots (`docs/screenshots/cyberpunk/`)

- **Style guide:** `styleguide-01…08`.
- **Both themes:** `app-classic-01…04` and `app-cyberpunk-01…04`: map overview, HUD and skill
  card, lesson viewer, and lesson safety.
- **Cyberpunk only:**
  - `app-cyberpunk-05-warning-dialog` (the HUD danger modal; Classic uses the system dialog, which
    cannot be captured);
  - `-06-settings`;
  - `-07-selected-reticle-bloom`;
  - `-08-milestones-front`;
  - `-09-active-milestone-ring`.

## Deferred

- **Boot reveal:** only on kit panels (style guide, modals). The app's own panels don't wipe in
  when opened.
- **Tooltips:** app controls keep the system's own tooltips (`title`). The HUD Tooltip is in the
  kit, ready to use.
- **Close-up labels:** when the camera flies very close, nameplates grow large. That is the
  existing behaviour in both themes, and was not changed here.
- **Skill codes** (`MTH-QNT-022`) are derived from the map (course, type, place in the course). They
  are not stored in it, so they can shift if skills are added.
