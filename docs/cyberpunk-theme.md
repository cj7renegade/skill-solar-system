# Cyberpunk HUD theme

JC's brief of 2026-11-06. Reference notes: [cyberpunk-reference-notes.md](cyberpunk-reference-notes.md).
Branch `cyberpunk-theme`, from `main`, which has the UX upgrade and the Guide. The AI lessons branch
is not merged yet, so its components (lesson badge, lesson viewer, generating view) are styled in
Phase 3 once it is: the kit already has the badges, the Alert block for safety sections and the
scanning SegmentedProgress for "Generating…".

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

## Phase 2: component kit and style guide (done; awaiting review)

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
