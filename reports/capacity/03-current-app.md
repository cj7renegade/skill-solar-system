# Capacity 03 — The app as it is today (Task 3)

Measured 2026-09-27 on branch `capacity-stress-test` (app built from `c5c5e4c` + this queue's
reports and tools; `src/` and `desktop/` unchanged). Hardware and the ~60 fps ceiling: see
`00-baseline.md`.

## Method

Tool: `authoring/stress/measure-app.mjs` (committed), summarised by
`authoring/stress/summarize-measurements.mjs`. Raw results: `C:\sss-scratch\stress\task3-results.jsonl`.

- **Isolation.** Every run starts a fresh Electron through `tests/electron-launcher.cjs` with a new
  temporary user-data folder under `%TEMP%` (`sss-capacity-…`), deleted after the run. The launcher
  replaces the save dialog with `<that folder>\saved.json`. The real `%APPDATA%\skill-solar-system\`
  was never read or written. The tool refuses map paths inside the repository, OneDrive or APPDATA.
  Each run reports that its own temporary profile received `Local Storage` — evidence the app wrote
  there. `Maps/Skill-Solar-System.json` was read once, only to make the reference copy, and its
  SHA-256 was checked unchanged afterwards (`04821f06…`); the Robotics V3 export was not opened
  (`687f0916…` unchanged).
- **Reference copy.** `C:\sss-scratch\stress\reference-master-1769.json`: the master copied to scratch,
  `metadata.atlasFamily` set to `stress-test-synthetic` (the app's `atlasFamily()` returns that, checked),
  and all 308 answers cleared to `null` **in the copy only** (0 answers remain).
- **Runs.** 3 runs per map, each in a new app; the tables show the **median** with all three runs in
  brackets. A map that is rejected is rejected identically every time, so rejected maps were run once.
- **Timings** are taken inside the page with `performance.now()`, from the triggering event (file
  `change`, `pointerup`, `input`, button click) to the result on screen, and "painted" waits two
  animation frames.
- **Frame rate.** For 10 s the tool drags with the left button in a loop over the 3D view (OrbitControls
  orbit), sending the next pointer move only after the previous one is handled, while the page records
  the interval between animation frames. Median and 95th-percentile interval are converted to fps.
  Done with nameplates on (the default) and again with them off. **The display runs at 59 Hz, so
  ~60 fps is the ceiling: a result of ~60 means "at least as fast as the screen", not a limit found.**
- **Click to card:** the tool clicks the centre of the nearest visible sphere (found from its nameplate)
  and times until the side-panel card shows that skill's name. After **Fit** at these sizes spheres
  are ~1 px in radius, and the click still hit every time.
- **Search:** the query `e` (matches most names) in the Find box and in the console list filter.
- **Arrange level spiral** needs edit mode; the tool turns edit mode on, clicks the button (the
  confirmation is auto-accepted), and turns edit mode off. Switching edit mode on is timed separately.
- **Memory:** renderer JavaScript heap (debug protocol `Runtime.getHeapUsage`) and the private memory
  of the app's main process plus every process it started (renderer, GPU, utility), 1.5 s after
  opening and again at the end of the run.
- **Draft:** whether browser storage key `skill-solar-system-v1` holds this map after opening
  (only its length and title were read).

## Summary

| Map | Skills | Connections | File | Opens today? | What rejects it |
| --- | ---: | ---: | ---: | --- | --- |
| Reference master (copy) | 1,769 | 5,142 | 5.4 MB | **yes** | — |
| stress-2000-skeleton | 2,000 | 5,862 | 6.1 MB | **yes** | — |
| stress-2000-full | 2,000 | 5,801 | 16.5 MB | no | 10 MB file cap |
| stress-5000-skeleton | 5,000 | 14,447 | 15.2 MB | no | 10 MB file cap |
| stress-5000-full | 5,000 | 14,436 | 41.2 MB | no | 10 MB file cap |
| stress-8000-skeleton | 8,000 | 23,091 | 24.4 MB | no | 10 MB file cap (and also 5,000 skills and 20,000 connections) |
| stress-8000-full | 8,000 | 23,190 | 65.9 MB | no | same three |
| stress-10000-skeleton | 10,000 | 29,044 | 30.5 MB | no | same three |
| stress-10000-full | 10,000 | 29,046 | 82.3 MB | no | same three |
| stress-12000-skeleton | 12,000 | 34,962 | 36.6 MB | no | same three |
| stress-12000-full | 12,000 | 34,819 | 98.8 MB | no | same three |

**Every rejection came from the same limit and the same message:** `Could not open map: Map files must
be smaller than 10 MB.` (`src/app.js:232`), within 1.4 ms, before the file is even read. The file-size
check runs first, so the 5,000-skill and 20,000-connection caps (`src/model.js:60`) are never reached
today; the "also" column is from counting each file, not from the app. **Even a 2,000-skill map with
lessons is refused.** Measured densities: 3,050 bytes per skill for skeleton maps
(30,495,130 bytes / 10,000), 8,230 bytes per skill with lessons (16,459,196 / 2,000). So a 10 MB
file holds about **3,300 skeleton skills** or about **1,200 skills with lessons**.

**What opens is healthy.** At 1,769 and 2,000 skills everything is fast on this machine: open ≈ 0.3–0.4 s,
orbit at the display's full 60 fps with nameplates on or off, click-to-card ≈ 150–170 ms,
arrange ≈ 0.26–0.31 s, save ≈ 0.15–0.16 s, review start ≈ 0.19–0.20 s, and the draft (≈ 5.5 million
characters) **did** save to browser storage. So today's limits are the caps, not performance; Task 4
removes the caps to find the performance limits.

**Two numbers worth noting already:**

- Private memory rises from ≈ 0.5 GB after opening to ≈ 0.9 GB by the end of a run, with only ~10
  actions — consistent with the whole-map copies kept for Undo (`01-limits-inventory.md` F1–F2).
- The console list filter costs ≈ 33 ms per keystroke at 2,000 skills against ≈ 5–17 ms for the Find box
  — the list rebuilds every button (E2/E3). Switching edit mode on costs ≈ 133 ms for the same reason.

## Results per map (medians of 3 runs)

### reference-master-1769

3 run(s); median shown, individual runs in brackets. 1769 subjects / 5142 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 348.4 ms (runs: 346 / 349.7 / 348.4) |
| Open → first painted frame | 364.5 ms (runs: 361.9 / 366.6 / 364.5) |
| Memory after open: JS heap used | 82 MB (runs: 75 / 82 / 82) |
| Memory after open: all app processes, private | 505 MB (runs: 513 / 503 / 505) |
| Memory at end of run: all app processes, private | 884 MB (runs: 893 / 858 / 884) |
| Orbit 10 s, labels on: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels on: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Orbit 10 s, labels on: worst 5% frame | 16.8 ms (runs: 16.8 / 16.8 / 16.8) |
| Orbit 10 s, labels off: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels off: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Click sphere → card painted | 147.9 ms (runs: 147.9 / 147.5 / 149.1) |
| Find box ("e") → painted | 5.5 ms (runs: 5.3 / 5.5 / 18.8) |
| Console list filter ("e") → painted | 32.5 ms (runs: 32.5 / 32.6 / 32.5) |
| Arrange level spiral → painted | 307.8 ms (runs: 307.8 / 301 / 318.4) |
| Switching edit mode on → painted | 132.2 ms (runs: 132.1 / 132.2 / 133.2) |
| Save → "Map saved" status | 161.4 ms (runs: 162.1 / 161.4 / 161.4) |
| Saved file size | 5,397,597 bytes (runs: 5,397,597 / 5,397,597 / 5,397,597) |
| Start review (open dialog + begin) → painted | 191.3 ms (runs: 187.1 / 191.3 / 191.6) |
| Review session stored | 40,648 characters (runs: 40,648 / 40,648 / 40,648) |
| Draft saved after open (per run) | yes, 4,659,156 chars / yes, 4,659,156 chars / yes, 4,659,156 chars |
| Draft after arranging (per run) | 4,659,149 chars / 4,659,149 chars / 4,659,149 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 1 px radius) / yes (sphere 1 px radius) / yes (sphere 1 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-2000-skeleton

3 run(s); median shown, individual runs in brackets. 2000 subjects / 5862 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 300.7 ms (runs: 301.4 / 300.3 / 300.7) |
| Open → first painted frame | 319.3 ms (runs: 319.3 / 319.9 / 318.7) |
| Memory after open: JS heap used | 94 MB (runs: 94 / 94 / 94) |
| Memory after open: all app processes, private | 536 MB (runs: 536 / 537 / 532) |
| Memory at end of run: all app processes, private | 921 MB (runs: 921 / 877 / 923) |
| Orbit 10 s, labels on: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels on: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Orbit 10 s, labels on: worst 5% frame | 16.8 ms (runs: 16.8 / 16.8 / 16.8) |
| Orbit 10 s, labels off: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels off: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Click sphere → card painted | 171.7 ms (runs: 171.7 / 175.2 / 171.7) |
| Find box ("e") → painted | 16.8 ms (runs: 16.8 / 18.5 / 4.9) |
| Console list filter ("e") → painted | 32.8 ms (runs: 32.8 / 32.6 / 32.8) |
| Arrange level spiral → painted | 258.4 ms (runs: 256.2 / 262.5 / 258.4) |
| Switching edit mode on → painted | 134 ms (runs: 132.9 / 135.9 / 134) |
| Save → "Map saved" status | 150 ms (runs: 148.1 / 155.3 / 150) |
| Saved file size | 6,108,300 bytes (runs: 6,108,300 / 6,108,300 / 6,108,300) |
| Start review (open dialog + begin) → painted | 201 ms (runs: 201.1 / 201 / 195.1) |
| Review session stored | 24,373 characters (runs: 24,373 / 24,373 / 24,373) |
| Draft saved after open (per run) | yes, 5,503,367 chars / yes, 5,503,367 chars / yes, 5,503,367 chars |
| Draft after arranging (per run) | 5,503,362 chars / 5,503,362 chars / 5,503,362 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 1 px radius) / yes (sphere 1 px radius) / yes (sphere 1 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-2000-full

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 1.4 ms).


### stress-5000-skeleton

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.5 ms).


### stress-5000-full

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.5 ms).


### stress-8000-skeleton

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.5 ms).


### stress-8000-full

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.4 ms).


### stress-10000-skeleton

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.4 ms).


### stress-10000-full

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.3 ms).


### stress-12000-skeleton

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.4 ms).


### stress-12000-full

**Rejected on open.** Message shown in the status bar: `Could not open map: Map files must be smaller than 10 MB.` (after 0.6 ms).


## Outcome

No run touched a real profile or a real map (see Method). Task 3 complete.
