# Cyberpunk HUD: notes on the reference images

All 12 images in `Reference Design/` were viewed on 2026-11-06, before Phase 1. The `.avif` file
was decoded to a scratch PNG for viewing; the original was not touched.

They are **mood references only**. No artwork, logo, lettering, fictional alphabet or branding is
copied or traced. In particular, the "CYBERPUNK" wordmarks, the glitch alphabet, the car silhouette,
the weapon drawing and the game's brand marks are all left out. Every component in the app is drawn
from scratch with CSS and small inline SVGs.

The folder is excluded from the packaged build (`build.files` in `package.json`), and its files are
not moved, renamed or modified.

## What was taken from each image

| Image | Traits taken | Left out |
| --- | --- | --- |
| `19b8ff8f…png`: red game crafting screen | The layout grammar: a thin top rule with a tabbed header row, and small uppercase labels with a monospace value beside them (`LEVEL 10`). Selected list rows are a solid accent fill with dark text, others are dark with a hairline; we use this for the primary button and the active list row. The tooltip panel has a notched corner and an edge strip. Density is generous, with lots of near-black between groups. | The red as a general accent (red is our alert colour only), the weapon art, the brand mark and the barcode decoration. |
| `4d85d93a…png`: white HUD vector pack | Frame shapes with 45° chamfers on one or two corners, and short notches and tabs on the long edges. Diagonal hatch blocks sit on frame *edges* only. The "loading" bars are segmented, with a hatched indeterminate state. The line weight is uniformly thin with one heavier accent stroke. | The "-ERROR-SYSTEM-" filler text and fake hex codes, the barcodes and the vertical wordmark. |
| `6fdb1339…jpg`: cyan/orange console boards | The header-bar recipe: a title in a condensed face on a thin bar that closes with a 45° cut at its right end, with a small two-dot marker before the title. Panels have one filled corner triangle (the accent notch). There is one dominant accent (cyan) with a sparing second (orange, which becomes amber for us). The background is a faint grid. | The glitch alphabet and chromatic offset, the meaningless data dumps, and the huge "95%" type. |
| `845c37a6…jpg`: red component sheet | A complete button family: filled, outlined, ghost (bracket corners only) and disabled. Segmented and thin-line sliders and progress bars, and segmented ring gauges in steps of a quarter. Corner-bracket reticles ("Lock on") become the selected-node reticle in Phase 4. A "/// WARNING ///" plate with hatch inside the frame, not the text. | The red used everywhere, the icons (weapon, money), and the logotype. |
| `b339d89e…jpg`: "visey" sheet plus circles, rulers and letters | The ring library: circles broken into arcs with tick marks, used for the ProgressRing and for milestone rings. The ruler library: tick rows with long and short ticks and small dot rows, used for divider ornaments. | The display alphabet (a fictional typeface: not used) and the pink and red poster. |
| `cyberpunk-futuristic-hud…hologram-vector.jpg`: filled cyan cards | Card silhouettes: a chamfered body with a stepped tab at the top edge, hatch only at the tab, and a small "NO / QR" serial block in a corner, which becomes our serial readout (with true data only). Circular frames with a broken outer ring. | The barcodes, the lorem ipsum and the "CYBERPUNK" title. |
| `cyberpunk-futuristic-user-interface-mega-set…jpg`: grey and white flat set | A calm, low-contrast panel fill (grey-blue, not black) with white tabs on the edge, which shows decoration can stay on the frame while the body is plain. A dot-row progress meter. Crosshair and reticle variants. | The wireframe tunnels and globes, and the hexagon textures as backgrounds. |
| `cyberpunk-interface-elements…avif`: white headers and loaders | Header ornaments: long thin bars with a heavier stepped segment, used for 3–4 divider and header ornaments. Ring gauges paired with segmented bars, with the percentage inside the ring. | The watermark and the exact bar silhouettes (ours are redrawn). |
| `f5c42513…jpg`: yellow/cyan posters and teal kit | **Accent balance: yellow/amber frames with cyan data, or the reverse.** We use cyan for chrome and amber for the one thing that matters (primary action, active target). Red appears *only* in the WARNING/DANGER plates, which is our alert rule. There are bracketed button outlines in several frame styles. | The wireframe sculptures, fake code, the "GDRP" label, the wordmark and all lorem ipsum. |
| `futuristic-cyberpunk-interface-templates…vector.jpg`: cyan cards and loaders | The same card silhouettes as the hologram set; ring gauge plus bar pairs; segmented bars with an even gap. Confirms a 1 px outline with filled tabs at the corners. | The barcodes and the "CYBERPUNK" text. |
| `game-ui-and-hud-element-set…free-vector.jpg`: red car dashboard | Segmented level bars (5 blocks with numbers under them) and readouts in a big number plus a small unit. The ON/OFF toggle as a framed circle, and a row of command buttons under one long rule. | The car, the place names, the red palette and the gear icon. |
| `scifi-futuristic-control-panel…vector.jpg`: cyan control panel | A list of label rows inside slanted plates with a number at the right, used for the Next up and legend rows. Leader lines that end in a small ring. The frame has one heavy filled tab at a corner and a hatch strip at the bottom edge. A faint background grid. | The italic display lettering and the lorem ipsum. |

## The rules distilled for HelixSkill

- **Palette.**
  - The background is near-black.
  - Cyan is chrome: frames, focus and lines. Amber marks the one important thing: the primary
    action, the active target, highlights.
  - Red is alerts only. Gold means proficient. There is no green.
  - Data keeps the course colours.
- **Geometry.** 45° chamfers (8–14 px), corner brackets, edge notches and tabs. There are no rounded
  pills except tiny status dots.
- **Lines.** Hairlines are 1 px; focus and active lines are 2 px. Hatch blocks and tick rows appear
  only on frame edges, at most one per edge.
- **Type.**
  - A condensed technical face (Chakra Petch, OFL) for uppercase headers and labels, with
    letter-spacing 0.08–0.12em.
  - A monospace (JetBrains Mono, OFL) for readouts.
  - A highly readable sans (Inter, OFL) for all paragraphs.
- **Density.** Generous near-black space between groups, and small labels over larger values.
- **Readouts carry real data only:** skill codes, helix level, stage, counts and timestamps. There is
  no fake code, hex or lorem.
