# Capacity 04 — Past today's limits (Task 4) — **EXPERIMENT**

> **This report describes a throwaway experiment.** The measurements ran on branch
> **`experiment/raised-limits`** (commit `e331f78`, pushed so they can be reproduced). That branch
> exists only for this measurement, raises limits without fixing anything behind them, and is
> **never to be merged**. `capacity-stress-test` and `main` keep today's limits. After the
> experiment the working copy was switched back to `capacity-stress-test` and rebuilt, and the build
> contains the original caps again (checked in `dist/app.js`).

Hardware context: `00-baseline.md` (Ryzen 7 9800X3D, RTX 3090, 31 GB, 59 Hz display, so **about 60 fps
is the ceiling**). Method as in `03-current-app.md`: `authoring/stress/measure-app.mjs`, a fresh
isolated profile per run, and medians of 3 runs. Raw results: `C:\sss-scratch\stress\task4-results.jsonl`
and `task4-followup.jsonl`; crash log: `task4-freeze.log`. No run touched a real profile or a real map.

## The exact change

Only the numeric caps that rejected maps in Task 3, plus the same numbers where the messages quote
them. Nothing else changed.

```diff
--- a/src/model.js
-  if (graph.nodes.length > 5000 || graph.edges.length > 20000) throw Error('This version supports at most 5,000 nodes and 20,000 connections.');
+  if (graph.nodes.length > 50000 || graph.edges.length > 150000) throw Error('This version supports at most 50,000 nodes and 150,000 connections.');
--- a/src/app.js   (line 232, the Open map handler; only this fragment changed)
-  if(file.size>10_000_000)throw Error('Map files must be smaller than 10 MB.');
+  if(file.size>150_000_000)throw Error('Map files must be smaller than 150 MB.');
--- a/desktop/main.cjs   (line 26, the save handler)
-    if (!fromWindow(event) || typeof content !== 'string' || Buffer.byteLength(content) > 10_000_000) throw Error('Invalid save request.');
+    if (!fromWindow(event) || typeof content !== 'string' || Buffer.byteLength(content) > 150_000_000) throw Error('Invalid save request.');
```

Not changed, because nothing reached them: the 5 MB answer-record caps (a 10,000-answer record is
1.8 MB, `01-limits-inventory.md` A5) and the 1–100 level range (the generated maps top out at level 70).

## What happened

**All nine maps that Task 3 rejected now open, in every run (27 of 27).** Every save, arrange,
click, search and review start completed, with **no page errors**. So once the caps are gone, the
app does not break at the door. It **slows down gradually**, and one thing **crashes**: repeated
changes on a large map with lessons.

### Overview (medians of 3 runs)

| Map | Open → frame | Orbit fps, labels on (median / worst 5%) | Orbit fps, labels off | Click → card | Arrange spiral | Save | Start review | List filter per keystroke | Edit mode on | Memory, all processes (after open → end of run) | Draft cached? |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| *master 1,769 (Task 3)* | *0.36 s* | *60 / 60* | *60 / 60* | *0.15 s* | *0.31 s* | *0.16 s* | *0.19 s* | *33 ms* | *0.13 s* | *0.5 → 0.9 GB* | *yes* |
| 2,000 full | 0.47 s | 60 / 60 | 60 / 60 | 0.17 s | 0.43 s | 0.27 s | 0.22 s | 33 ms | 0.15 s | 0.6 → 1.1 GB | yes |
| 5,000 skeleton | 0.80 s | **30 / 15** | 60 / 60 | 0.38 s | 0.67 s | 0.37 s | 0.43 s | 70 ms | 0.31 s | 0.8 → 1.6 GB | yes |
| 5,000 full | 1.18 s | **30 / 15** | 60 / 60 | 0.42 s | 1.11 s | 0.63 s | 0.46 s | 67 ms | 0.37 s | 1.0 → 2.5 GB | yes |
| 8,000 skeleton | 1.24 s | **15 / 8.6** | 30 / 30 | 0.56 s | 0.99 s | 0.57 s | 0.68 s | 113 ms | 0.49 s | 1.0 → 2.1 GB | yes |
| 8,000 full | 1.69 s | **15 / 8.6** | 30 / 30 | 0.65 s | 1.38 s | 0.98 s | 0.82 s | 120 ms | 0.57 s | 1.1 → 3.1 GB | **no** |
| 10,000 skeleton | 1.58 s | **10 / 7.5** | 30 / 20 | 0.70 s | 1.23 s | 0.74 s | 0.85 s | 146 ms | 0.61 s | 1.2 → 2.4 GB | yes |
| 10,000 full | 2.12 s | **10 / 7.5** | 30 / 20 | 0.84 s | 1.83 s | 1.19 s | 1.06 s | 155 ms | 0.72 s | 1.4 → 3.8 GB | **no** |
| 12,000 skeleton | 1.90 s | **8.6 / 5.4** | 20 / 20 | 0.87 s | 1.47 s | 0.87 s | 0.97 s | 183 ms | 0.80 s | 1.5 → 3.2 GB | yes |
| 12,000 full | 2.55 s | **8.6 / 6.0** | 20 / 20 | 1.04 s | 2.23 s | 1.47 s | 1.26 s | 183 ms | 0.89 s | 1.6 → 4.2 GB | **no** |

The fps values fall on 60, 30, 20, 15, 12, 10, 8.6 … (60 ÷ 1, 2, 3, 4, 5, 6, 7). Chromium shows a
frame only on a screen refresh, so a frame that misses one refresh waits for the next. The true
work per frame lies between those steps.

## What breaks next, in the order it is hit

### 1. Frame rate while moving the camera

This is the **first thing to degrade**, already at 5,000 skills.

- **With nameplates on (the default):** 60 fps at 2,000, **30 at 5,000, 15 at 8,000, 10 at 10,000, and
  8.6 at 12,000**. The worst 5% of frames are 15 / 8.6 / 7.5 / 5.4 fps. Anything under about 20 fps
  feels like a slideshow when orbiting.
- **With nameplates off:** 60 at 5,000, 30 at 8,000–10,000, 20 at 12,000.
- **Turning nameplates off roughly doubles the frame rate at every size ≥ 5,000.** So about half of each
  frame's cost is the per-frame repositioning of one HTML nameplate per skill
  (`01-limits-inventory.md` C2). The other half is one draw call per sphere plus the per-frame
  whole-map loops (B1, B6, B7).
- The same frame rate is seen for skeleton and full maps of the same size. **Frame cost depends on
  the number of skills, not on how much text they carry.**

### 2. Memory, and a crash, from the Undo history

**The first thing that fails outright.**

A follow-up test opened a map, started a review, and answered 60 skills in a row, timing each answer
to the painted frame and sampling memory. Every answer is a whole-map commit
(`01-limits-inventory.md` F1–F2).

| Map | Time per review answer | Page memory growth per answer | What happened |
| --- | --- | --- | --- |
| 2,000 skeleton | median 33 ms (first 210 ms) | about 0.8 MB after clean-up | fine |
| 10,000 skeleton | **median 1.05 s** (1.01–1.28 s) | **+27.6 MB per answer**, levelling off at **1,546 MB after exactly 50 answers**, where the Undo history stops growing | slow but survived; all processes 2.5 GB |
| 10,000 full | **1.5 s, rising to 2.8 s** | **about +72 MB per answer** ((3,943 − 626) MB ÷ 46): 0.63 GB after answer 1, 1.29 GB at 10, 2.15 GB at 20, 2.90 GB at 30, 3.61 GB at 40, **3.94 GB at 47** | **The page crashed on answer 48.** No reply for 300 s, then the app's process count fell from 4 to 3 and its memory from 5.0 GB to 0.29 GB: the page's own process died. The same map froze the same way in the first follow-up attempt (no reply within 600 s) |

- **The mechanism is visible in the numbers.** Memory climbs by one map-copy per answer and stops
  climbing after 50 answers, the history length (`app.js:86`).
- **At 10,000 skills with lessons, 50 copies do not fit in the page's memory:** the page's memory
  limit is 3,586 MB (`00-baseline.md`).
- **A person answering a review on such a map would lose the page after about 47 answers.** Because
  the draft cannot be cached at that size (item 3), everything since the last **Save map** would be
  lost.

### 3. The draft cache (browser storage)

Stops working for large maps, **silently at first**.

- **Measured ceiling:** in the isolated profile, the largest single browser-storage value that could
  be written was **52,343,750 characters** (found by bisection, to within 0.25 million).
- The draft is the map as compact JSON. It **was cached** at up to 36.9 million characters (5,000
  full) and 33.0 million (12,000 skeleton). It **was not cached** for 8,000 / 10,000 / 12,000 full,
  which need 59.0 / 73.7 / 88.5 million characters.
- **On opening, the failure is invisible.** `replace()` shows "Draft cache unavailable" and then
  immediately overwrites it with "Opened …" (`app.js:91` calls `cache()` before `message(status)`).
  The warning only appears on the **next** change: after arranging, the status read "… Draft cache
  unavailable: save the map to a JSON file now."
- Review sessions are small: about 12 characters per skill, 120,379 characters at 10,000 skills. Up to
  8 are kept (`review.js`).

### 4. Response times

Slower, but nothing failed.

- **Click a sphere → card:** 0.38 s at 5,000, **0.70–0.84 s at 10,000**, 0.87–1.04 s at 12,000. That is a full
  scene and list rebuild per click (`01-limits-inventory.md` B3, E2).
- **Console list filter:** 70 ms per keystroke at 5,000, **146–155 ms at 10,000**, 183 ms at 12,000. The
  **Find box stays at about 17–23 ms at every size**, because it shows only 8 results instead of rebuilding
  a full list.
- **Switching edit mode on:** 0.6–0.9 s at 10,000–12,000.
- **Arrange spiral** 1.2–2.2 s, **save** 0.7–1.5 s, **start review** 0.85–1.26 s at 10,000–12,000. These are
  slow but are one-off actions.
- **Opening:** 1.6–2.6 s at 10,000–12,000. Acceptable.

### 5. What did not break

- **Opening and saving large files:** every save completed, up to 98.8 MB, with the saved file
  within bytes of the source.
- **Picking:** every click hit its sphere, even at about 1 px radius.
- **Levels:** stayed at 70, because the generated maps copy the master's depth of 23.
- **Errors:** no page errors in any of the 27 runs.

## Detailed results per map (medians of 3 runs)

### stress-2000-full

3 run(s); median shown, individual runs in brackets. 2000 subjects / 5801 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 443.4 ms (runs: 471.4 / 435.9 / 443.4) |
| Open → first painted frame | 471.4 ms (runs: 501.8 / 464 / 471.4) |
| Memory after open: JS heap used | 54 MB (runs: 54 / 54 / 56) |
| Memory after open: all app processes, private | 596 MB (runs: 601 / 596 / 585) |
| Memory at end of run: all app processes, private | 1,145 MB (runs: 1,145 / 1,125 / 1,151) |
| Orbit 10 s, labels on: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels on: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Orbit 10 s, labels on: worst 5% frame | 16.8 ms (runs: 16.8 / 16.8 / 16.8) |
| Orbit 10 s, labels off: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels off: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Click sphere → card painted | 170.4 ms (runs: 170.4 / 166.9 / 175.1) |
| Find box ("e") → painted | 16.6 ms (runs: 16.6 / 5.5 / 18.5) |
| Console list filter ("e") → painted | 32.7 ms (runs: 32.5 / 32.7 / 32.7) |
| Arrange level spiral → painted | 429.8 ms (runs: 468.1 / 429.8 / 429.6) |
| Switching edit mode on → painted | 146.4 ms (runs: 148.9 / 145.8 / 146.4) |
| Save → "Map saved" status | 268.6 ms (runs: 262.7 / 268.6 / 268.8) |
| Saved file size | 16,459,178 bytes (runs: 16,459,178 / 16,459,178 / 16,459,178) |
| Start review (open dialog + begin) → painted | 217.8 ms (runs: 237.7 / 217.8 / 213.4) |
| Review session stored | 24,357 characters (runs: 24,357 / 24,357 / 24,357) |
| Draft saved after open (per run) | yes, 14,745,217 chars / yes, 14,745,217 chars / yes, 14,745,217 chars |
| Draft after arranging (per run) | 14,745,200 chars / 14,745,200 chars / 14,745,200 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 1 px radius) / yes (sphere 1 px radius) / yes (sphere 1 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-5000-skeleton

3 run(s); median shown, individual runs in brackets. 5000 subjects / 14447 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 749.7 ms (runs: 749.7 / 730 / 761) |
| Open → first painted frame | 804.7 ms (runs: 804.7 / 780.1 / 813.5) |
| Memory after open: JS heap used | 152 MB (runs: 152 / 89 / 152) |
| Memory after open: all app processes, private | 776 MB (runs: 776 / 791 / 776) |
| Memory at end of run: all app processes, private | 1,585 MB (runs: 1,565 / 1,585 / 1,612) |
| Orbit 10 s, labels on: median fps | 29.9 (runs: 29.9 / 29.9 / 29.9) |
| Orbit 10 s, labels on: worst 5% fps | 15 (runs: 15 / 15 / 15) |
| Orbit 10 s, labels on: worst 5% frame | 66.8 ms (runs: 66.7 / 66.8 / 66.8) |
| Orbit 10 s, labels off: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels off: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Click sphere → card painted | 378.1 ms (runs: 348.3 / 378.1 / 380.4) |
| Find box ("e") → painted | 16.7 ms (runs: 16 / 19 / 16.7) |
| Console list filter ("e") → painted | 69.7 ms (runs: 69.7 / 64.9 / 72.7) |
| Arrange level spiral → painted | 674.4 ms (runs: 684.8 / 674.4 / 654.7) |
| Switching edit mode on → painted | 305.2 ms (runs: 301.1 / 305.2 / 309) |
| Save → "Map saved" status | 369.6 ms (runs: 359.5 / 369.6 / 396.2) |
| Saved file size | 15,228,550 bytes (runs: 15,228,550 / 15,228,550 / 15,228,550) |
| Start review (open dialog + begin) → painted | 432.2 ms (runs: 432.2 / 430.4 / 450.4) |
| Review session stored | 60,373 characters (runs: 60,373 / 60,373 / 60,373) |
| Draft saved after open (per run) | yes, 13,726,478 chars / yes, 13,726,478 chars / yes, 13,726,478 chars |
| Draft after arranging (per run) | 13,726,458 chars / 13,726,458 chars / 13,726,458 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.6 px radius) / yes (sphere 0.6 px radius) / yes (sphere 0.6 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-5000-full

3 run(s); median shown, individual runs in brackets. 5000 subjects / 14436 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 1,112.7 ms (runs: 1,143.7 / 1,100.9 / 1,112.7) |
| Open → first painted frame | 1,182.9 ms (runs: 1,217.9 / 1,174.2 / 1,182.9) |
| Memory after open: JS heap used | 274 MB (runs: 273 / 274 / 277) |
| Memory after open: all app processes, private | 1,023 MB (runs: 1,023 / 1,024 / 1,015) |
| Memory at end of run: all app processes, private | 2,462 MB (runs: 2,462 / 2,473 / 2,451) |
| Orbit 10 s, labels on: median fps | 29.9 (runs: 29.9 / 20 / 29.9) |
| Orbit 10 s, labels on: worst 5% fps | 15 (runs: 15 / 14.9 / 15) |
| Orbit 10 s, labels on: worst 5% frame | 66.8 ms (runs: 66.8 / 66.9 / 66.7) |
| Orbit 10 s, labels off: median fps | 59.9 (runs: 59.9 / 59.9 / 59.9) |
| Orbit 10 s, labels off: worst 5% fps | 59.5 (runs: 59.5 / 59.5 / 59.5) |
| Click sphere → card painted | 417.8 ms (runs: 429.3 / 417.8 / 397.8) |
| Find box ("e") → painted | 18.5 ms (runs: 18.3 / 18.5 / 19) |
| Console list filter ("e") → painted | 66.9 ms (runs: 66.7 / 68.5 / 66.9) |
| Arrange level spiral → painted | 1,105.2 ms (runs: 1,216.3 / 1,105.2 / 1,066.4) |
| Switching edit mode on → painted | 367.4 ms (runs: 367.4 / 357.4 / 398.5) |
| Save → "Map saved" status | 628.8 ms (runs: 665.2 / 628.8 / 625.8) |
| Saved file size | 41,165,288 bytes (runs: 41,165,288 / 41,165,288 / 41,165,288) |
| Start review (open dialog + begin) → painted | 455.7 ms (runs: 461.6 / 455.7 / 444.3) |
| Review session stored | 60,357 characters (runs: 60,357 / 60,357 / 60,357) |
| Draft saved after open (per run) | yes, 36,878,898 chars / yes, 36,878,898 chars / yes, 36,878,898 chars |
| Draft after arranging (per run) | 36,878,943 chars / 36,878,943 chars / 36,878,943 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.6 px radius) / yes (sphere 0.6 px radius) / yes (sphere 0.6 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-8000-skeleton

3 run(s); median shown, individual runs in brackets. 8000 subjects / 23091 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 1,164 ms (runs: 1,164 / 1,156.6 / 1,168.6) |
| Open → first painted frame | 1,241.3 ms (runs: 1,241.3 / 1,237.9 / 1,248.5) |
| Memory after open: JS heap used | 133 MB (runs: 133 / 133 / 134) |
| Memory after open: all app processes, private | 1,046 MB (runs: 1,050 / 1,046 / 1,040) |
| Memory at end of run: all app processes, private | 2,112 MB (runs: 2,112 / 2,106 / 2,221) |
| Orbit 10 s, labels on: median fps | 15 (runs: 15 / 15 / 15) |
| Orbit 10 s, labels on: worst 5% fps | 8.6 (runs: 8.6 / 8.6 / 7.5) |
| Orbit 10 s, labels on: worst 5% frame | 116.9 ms (runs: 116.9 / 116.8 / 133.4) |
| Orbit 10 s, labels off: median fps | 30 (runs: 30 / 30 / 30) |
| Orbit 10 s, labels off: worst 5% fps | 29.9 (runs: 29.9 / 29.9 / 29.9) |
| Click sphere → card painted | 563.6 ms (runs: 554.8 / 581 / 563.6) |
| Find box ("e") → painted | 18 ms (runs: 33.7 / 17.9 / 18) |
| Console list filter ("e") → painted | 113 ms (runs: 113 / 119.7 / 110.6) |
| Arrange level spiral → painted | 991.8 ms (runs: 993.1 / 987.5 / 991.8) |
| Switching edit mode on → painted | 486.9 ms (runs: 485.4 / 486.9 / 491) |
| Save → "Map saved" status | 574.8 ms (runs: 559.4 / 574.8 / 627.6) |
| Saved file size | 24,363,267 bytes (runs: 24,363,267 / 24,363,267 / 24,363,267) |
| Start review (open dialog + begin) → painted | 676.4 ms (runs: 689.8 / 676.4 / 666.1) |
| Review session stored | 96,373 characters (runs: 96,373 / 96,373 / 96,373) |
| Draft saved after open (per run) | yes, 21,962,073 chars / yes, 21,962,073 chars / yes, 21,962,073 chars |
| Draft after arranging (per run) | 21,962,007 chars / 21,962,007 chars / 21,962,007 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.4 px radius) / yes (sphere 0.4 px radius) / yes (sphere 0.4 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-8000-full

3 run(s); median shown, individual runs in brackets. 8000 subjects / 23190 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 1,630.8 ms (runs: 1,626.1 / 1,642.3 / 1,630.8) |
| Open → first painted frame | 1,685.7 ms (runs: 1,681.1 / 1,698.5 / 1,685.7) |
| Memory after open: JS heap used | 456 MB (runs: 457 / 456 / 456) |
| Memory after open: all app processes, private | 1,142 MB (runs: 1,142 / 1,144 / 1,142) |
| Memory at end of run: all app processes, private | 3,091 MB (runs: 3,070 / 3,092 / 3,091) |
| Orbit 10 s, labels on: median fps | 15 (runs: 15 / 15 / 15) |
| Orbit 10 s, labels on: worst 5% fps | 8.6 (runs: 7.5 / 8.6 / 8.6) |
| Orbit 10 s, labels on: worst 5% frame | 116.9 ms (runs: 133.4 / 116.9 / 116.8) |
| Orbit 10 s, labels off: median fps | 30 (runs: 30 / 30 / 30) |
| Orbit 10 s, labels off: worst 5% fps | 29.9 (runs: 29.9 / 29.9 / 29.9) |
| Click sphere → card painted | 653.7 ms (runs: 648 / 653.7 / 661.9) |
| Find box ("e") → painted | 18.4 ms (runs: 18.4 / 16.7 / 18.4) |
| Console list filter ("e") → painted | 119.5 ms (runs: 119.5 / 125.1 / 110.8) |
| Arrange level spiral → painted | 1,382.7 ms (runs: 1,471 / 1,373.1 / 1,382.7) |
| Switching edit mode on → painted | 567.4 ms (runs: 566.2 / 567.4 / 573.6) |
| Save → "Map saved" status | 976.5 ms (runs: 962.4 / 976.5 / 998.9) |
| Saved file size | 65,911,310 bytes (runs: 65,911,310 / 65,911,310 / 65,911,310) |
| Start review (open dialog + begin) → painted | 824 ms (runs: 809.3 / 824 / 838) |
| Review session stored | 96,357 characters (runs: 96,357 / 96,357 / 96,357) |
| Draft saved after open (per run) | no — nothing stored / no — nothing stored / no — nothing stored |
| Draft after arranging (per run) | none / none / none |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.4 px radius) / yes (sphere 0.4 px radius) / yes (sphere 0.4 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-10000-skeleton

3 run(s); median shown, individual runs in brackets. 10000 subjects / 29044 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 1,481.3 ms (runs: 1,481.3 / 1,472.8 / 1,492.3) |
| Open → first painted frame | 1,584 ms (runs: 1,584 / 1,570.6 / 1,592.2) |
| Memory after open: JS heap used | 415 MB (runs: 416 / 415 / 414) |
| Memory after open: all app processes, private | 1,240 MB (runs: 1,240 / 1,242 / 1,240) |
| Memory at end of run: all app processes, private | 2,420 MB (runs: 2,431 / 2,420 / 2,367) |
| Orbit 10 s, labels on: median fps | 10 (runs: 10 / 10 / 10) |
| Orbit 10 s, labels on: worst 5% fps | 7.5 (runs: 7.5 / 7.5 / 7.5) |
| Orbit 10 s, labels on: worst 5% frame | 133.5 ms (runs: 133.5 / 133.5 / 133.5) |
| Orbit 10 s, labels off: median fps | 29.9 (runs: 29.9 / 29.9 / 29.9) |
| Orbit 10 s, labels off: worst 5% fps | 20 (runs: 20 / 20 / 20) |
| Click sphere → card painted | 704.8 ms (runs: 708.8 / 704.8 / 701.8) |
| Find box ("e") → painted | 21.3 ms (runs: 21.3 / 22.2 / 18.3) |
| Console list filter ("e") → painted | 146.2 ms (runs: 177 / 146.2 / 141.4) |
| Arrange level spiral → painted | 1,234.1 ms (runs: 1,296.4 / 1,227.8 / 1,234.1) |
| Switching edit mode on → painted | 612.1 ms (runs: 607.7 / 612.1 / 673.8) |
| Save → "Map saved" status | 744.1 ms (runs: 744.1 / 709.9 / 759) |
| Saved file size | 30,495,072 bytes (runs: 30,495,072 / 30,495,072 / 30,495,072) |
| Start review (open dialog + begin) → painted | 850.9 ms (runs: 908.4 / 850.9 / 828.5) |
| Review session stored | 120,379 characters (runs: 120,379 / 120,379 / 120,379) |
| Draft saved after open (per run) | yes, 27,482,915 chars / yes, 27,482,915 chars / yes, 27,482,915 chars |
| Draft after arranging (per run) | 27,482,858 chars / 27,482,858 chars / 27,482,858 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.3 px radius) / yes (sphere 0.4 px radius) / yes (sphere 0.3 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-10000-full

3 run(s); median shown, individual runs in brackets. 10000 subjects / 29046 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 2,051.7 ms (runs: 2,051.7 / 2,052 / 2,040.8) |
| Open → first painted frame | 2,123.9 ms (runs: 2,123.9 / 2,125.8 / 2,115) |
| Memory after open: JS heap used | 572 MB (runs: 562 / 572 / 573) |
| Memory after open: all app processes, private | 1,418 MB (runs: 1,418 / 1,417 / 1,421) |
| Memory at end of run: all app processes, private | 3,776 MB (runs: 3,776 / 3,769 / 3,797) |
| Orbit 10 s, labels on: median fps | 10 (runs: 10 / 10 / 10) |
| Orbit 10 s, labels on: worst 5% fps | 7.5 (runs: 7.5 / 7.5 / 7.5) |
| Orbit 10 s, labels on: worst 5% frame | 133.4 ms (runs: 133.5 / 133.4 / 133.4) |
| Orbit 10 s, labels off: median fps | 29.9 (runs: 29.9 / 29.9 / 29.9) |
| Orbit 10 s, labels off: worst 5% fps | 20 (runs: 20 / 20 / 20) |
| Click sphere → card painted | 837.7 ms (runs: 844.4 / 832.1 / 837.7) |
| Find box ("e") → painted | 18.6 ms (runs: 18.3 / 19 / 18.6) |
| Console list filter ("e") → painted | 154.8 ms (runs: 155.3 / 148.2 / 154.8) |
| Arrange level spiral → painted | 1,825.7 ms (runs: 1,864.1 / 1,825.7 / 1,755) |
| Switching edit mode on → painted | 718.3 ms (runs: 716 / 719.8 / 718.3) |
| Save → "Map saved" status | 1,189.7 ms (runs: 1,260.6 / 1,189.7 / 1,179.6) |
| Saved file size | 82,317,188 bytes (runs: 82,317,188 / 82,317,188 / 82,317,188) |
| Start review (open dialog + begin) → painted | 1,061.2 ms (runs: 1,061.2 / 994.8 / 1,065.8) |
| Review session stored | 120,363 characters (runs: 120,363 / 120,363 / 120,363) |
| Draft saved after open (per run) | no — nothing stored / no — nothing stored / no — nothing stored |
| Draft after arranging (per run) | none / none / none |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.4 px radius) / yes (sphere 0.4 px radius) / yes (sphere 0.4 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-12000-skeleton

3 run(s); median shown, individual runs in brackets. 12000 subjects / 34962 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 1,779.3 ms (runs: 1,779 / 1,779.3 / 1,812.2) |
| Open → first painted frame | 1,904.7 ms (runs: 1,903.2 / 1,904.7 / 1,934.9) |
| Memory after open: JS heap used | 498 MB (runs: 498 / 498 / 498) |
| Memory after open: all app processes, private | 1,514 MB (runs: 1,514 / 1,514 / 1,515) |
| Memory at end of run: all app processes, private | 3,159 MB (runs: 3,107 / 3,237 / 3,159) |
| Orbit 10 s, labels on: median fps | 8.6 (runs: 8.6 / 8.6 / 8.6) |
| Orbit 10 s, labels on: worst 5% fps | 5.4 (runs: 5.4 / 6 / 5.4) |
| Orbit 10 s, labels on: worst 5% frame | 183.5 ms (runs: 183.5 / 166.9 / 183.5) |
| Orbit 10 s, labels off: median fps | 20 (runs: 20 / 20 / 20) |
| Orbit 10 s, labels off: worst 5% fps | 19.9 (runs: 19.9 / 19.9 / 19.9) |
| Click sphere → card painted | 873.2 ms (runs: 946.4 / 862.1 / 873.2) |
| Find box ("e") → painted | 21.9 ms (runs: 25.1 / 21.9 / 21.8) |
| Console list filter ("e") → painted | 182.7 ms (runs: 181 / 182.7 / 188.6) |
| Arrange level spiral → painted | 1,471.5 ms (runs: 1,546 / 1,457.2 / 1,471.5) |
| Switching edit mode on → painted | 803.5 ms (runs: 738.1 / 803.5 / 811.5) |
| Save → "Map saved" status | 867 ms (runs: 910.9 / 867 / 866.7) |
| Saved file size | 36,622,158 bytes (runs: 36,622,158 / 36,622,158 / 36,622,158) |
| Start review (open dialog + begin) → painted | 973.7 ms (runs: 968.5 / 973.7 / 974) |
| Review session stored | 144,379 characters (runs: 144,379 / 144,379 / 144,379) |
| Draft saved after open (per run) | yes, 33,001,520 chars / yes, 33,001,520 chars / yes, 33,001,520 chars |
| Draft after arranging (per run) | 33,001,436 chars / 33,001,436 chars / 33,001,436 chars |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.3 px radius) / yes (sphere 0.3 px radius) / yes (sphere 0.3 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

### stress-12000-full

3 run(s); median shown, individual runs in brackets. 12000 subjects / 34819 connections.

| Measure | Result |
| --- | --- |
| Open → status "Opened" | 2,464.3 ms (runs: 2,467.5 / 2,464.3 / 2,452.4) |
| Open → first painted frame | 2,554.8 ms (runs: 2,558 / 2,554.8 / 2,541.3) |
| Memory after open: JS heap used | 686 MB (runs: 686 / 686 / 675) |
| Memory after open: all app processes, private | 1,617 MB (runs: 1,616 / 1,617 / 1,617) |
| Memory at end of run: all app processes, private | 4,236 MB (runs: 4,237 / 4,236 / 4,215) |
| Orbit 10 s, labels on: median fps | 8.6 (runs: 8.6 / 8.6 / 8.6) |
| Orbit 10 s, labels on: worst 5% fps | 6 (runs: 6 / 6 / 6) |
| Orbit 10 s, labels on: worst 5% frame | 166.9 ms (runs: 166.9 / 166.9 / 166.9) |
| Orbit 10 s, labels off: median fps | 20 (runs: 20 / 20 / 20) |
| Orbit 10 s, labels off: worst 5% fps | 19.9 (runs: 19.9 / 19.9 / 20) |
| Click sphere → card painted | 1,043.4 ms (runs: 1,043.4 / 1,047.9 / 1,033.5) |
| Find box ("e") → painted | 22.7 ms (runs: 23.4 / 22.7 / 21.8) |
| Console list filter ("e") → painted | 183 ms (runs: 181.1 / 183 / 184.7) |
| Arrange level spiral → painted | 2,228.1 ms (runs: 2,228.1 / 2,268.3 / 2,135.6) |
| Switching edit mode on → painted | 885.9 ms (runs: 888.1 / 885.9 / 883.3) |
| Save → "Map saved" status | 1,470.8 ms (runs: 1,484.1 / 1,470.8 / 1,436.1) |
| Saved file size | 98,795,318 bytes (runs: 98,795,318 / 98,795,318 / 98,795,318) |
| Start review (open dialog + begin) → painted | 1,258 ms (runs: 1,284.6 / 1,249.8 / 1,258) |
| Review session stored | 144,363 characters (runs: 144,363 / 144,363 / 144,363) |
| Draft saved after open (per run) | no — nothing stored / no — nothing stored / no — nothing stored |
| Draft after arranging (per run) | none / none / none |
| Save result (per run) | saved / saved / saved |
| Arrange result (per run) | arranged / arranged / arranged |
| Click hit a sphere (per run) | yes (sphere 0.3 px radius) / yes (sphere 0.3 px radius) / yes (sphere 0.3 px radius) |
| Page errors (per run) | none / none / none |
| Errors from the run (per run) | none / none / none |
| Isolated profile written (per run) | Local Storage / Local Storage / Local Storage |

## Outcome

Experiment complete; branch `experiment/raised-limits` pushed and **not to be merged**. The working copy is back on `capacity-stress-test`, rebuilt with the original caps. Task 4 complete.
