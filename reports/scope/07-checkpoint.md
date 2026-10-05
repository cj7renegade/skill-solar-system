# Scope 07 — Checkpoint: where we are, what is left, and how to build it

Written 2026-10-05, after JC accepted the recommendation on all 14 scope decisions. Numbers are
measured unless marked as estimates.

## 1. Where we are

| Area | State |
| --- | --- |
| **Robotics V3 curriculum** | Separate map: 381 entries, 298 introductory lessons, all five milestone chains I01–I05 closed. Merged into `main` (Edition 06) |
| **Master atlas** | 1,769 skills, 5,142 connections. 324 lie on a robotics path today (Measure B); the 1,033-skill maths import and the granular batches hang off overview skills by loose links |
| **Scope** | Adopted: robotics build-and-verify (`docs/SCOPE.md`). 46 branches, each with a boundary. All 14 boundary and structure decisions made |
| **Coverage** | 0 branches missing; 7 covered in the master today; 9 covered once V3 is merged; 3 covered only by V3; 24 partial; 3 maths branches to audit |
| **Size of the finished scope** (estimate) | ≈ 540–615 required skills; ≈ 2,000 in the whole atlas |
| **App** | Holds this size comfortably: 60 fps and ≈ 0.15 s per click at 2,000 skills. The **10 MB file cap** is the one limit in the way, once lessons are attached |
| **Convenience** | Desktop icon and shortcut, Your maps dropdown, guided tour, right-click deselect, one-click backup (all merged) |
| **Branches not yet merged** | `capacity-stress-test` (capacity reports and stress tools) and `scope-foundation` (this work) |

## 2. What is left to build a complete robotics map

In order. Sizes are **estimates** from the branch map and the capacity measurements.

| # | Work | Size | What it needs | Touches the real map? |
| ---: | --- | --- | --- | --- |
| 1 | **Merge the two reports branches** (`capacity-stress-test`, `scope-foundation`) | Small | Two pull requests; JC merges | no |
| 2 | **Capacity safety** (steps 1–4 of `reports/capacity/05-proposal.md`) | Small to medium | Undo memory budget; visible draft warning; readable-nameplates-only and no per-frame whole-map loops; a raised, tested file cap | no (app code) |
| 3 | **`requires_physical_evidence`** field: package checker, importer, card, overrides table for the 298 existing cards (decision 14) | Small to medium | App, importer and test changes | no |
| 4 | **The Robotics V3 merge** (decision brief §D) | **Large** | A crosswalk of V3's 177 non-shared entries and the master's 27 `r-*` overviews; an id policy; one atlas family; JC rules on every skill answered differently in the two maps (`m-logic` first); recalculated levels; the import pipeline re-based on the merged map. Applies decisions 6, 7, 10, 11 and 12 (r-* overviews, X06, K05–K07, calculus links, B-D08) | **yes: the first real change.** Backup first |
| 5 | **Robotics completions** (R6 innovation check, R12 coupling misalignment; lessons for K05–K07, now required) | Small | 2–6 skills, 3 lessons | yes |
| 6 | **Foundation splits** in electronics, mechanics, physics and computing | Medium | 36–108 new granular skills, each a distinct, separately markable ability | yes |
| 7 | **Introductory lessons for every required skill** | **Large** | ≈ 540–615 required, 298 exist: about **240–320 lessons to author**, plus one per new skill, by edition packages through the existing importer | yes |
| 8 | **Maths audit**: the two same-ability duplicates; the "decomposes" relationship (decision 1, (b) next) | Medium | Review of up to ≈ 894 loose links; no deletions | yes (links only) |
| 9 | **Extension pathways** X01–X09 (after the core) | Medium | 11 lessons | yes |
| — | Not-queued items still open: move the project out of OneDrive (best before step 4); clean up merged branches | Small each | | no |

**Rough total:** about 7–9 queues of the size run so far. Steps 4 and 7 are the big ones.

## 3. JC's idea: a "progressive depth" map

**The idea.** Start a new map from the bare-bones fundamentals, for example Mathematics as Algebra →
Geometry → Trigonometry → Calculus 1 → beyond. Then add depth over time, so scope and granularity
grow, with room to add new sections to each subject (such as Waves in Physics).

### What the measurements say

- **That coarse-to-fine structure already exists in the current atlas, just not explicitly.** Of
  the master's 1,215 granular skills, **1,211 are already linked to a broader overview skill**:
  - all 1,033 maths-import skills;
  - all 83 batch skills;
  - 95 of 99 physics extensions.
- There are 554 overview-style skills, and 99 subdomains that work like course sections
  ("Trigonometry", "Waves", "DC networks").
- **What is missing is a top layer and an explicit relationship.** There are no course-level nodes
  such as "Algebra" or "Calculus 1". The link from a fine skill to its overview is a loose *related*
  link that neither the inclusion test nor the app can tell apart from "merely relevant".
- **Rendering already wants this.** The capacity study found that showing every sphere and nameplate
  at once is what slows the app. Showing courses first and expanding on demand is exactly the
  "level of detail" idea in the capacity proposal (`reports/capacity/05-proposal.md`, R5).

### Two ways to get there

| | **A. Start a new map from scratch** | **B. Add progressive depth to the current atlas** |
| --- | --- | --- |
| What happens | Write course-level nodes, then re-create or re-map the existing 1,946 skills (master + V3) underneath them | Add a course/section layer (≈ 40–60 nodes, e.g. Algebra, Geometry, Trigonometry, Calculus 1, Waves) and an explicit **"part of"** relationship. Derive it from the 1,211 existing overview links, then review it |
| Answers | A new map means new ids or a new family; JC's 308 answers in the master would have to be carried across by mapping | **Untouched:** ids and family stay the same |
| Robotics V3 and its importer | Would have to be re-targeted to the new map | Unchanged; the merge (step 4) happens as planned |
| Work already done | Branch map, tiers and crosswalk would be redone | Reused: the 46 branches become the course layer's backbone |
| Size of work | **Very large**, and it delays everything in §2 | **Medium**: a data pass plus an app feature, and it slots into the plan |
| Result | A clean, uniform hierarchy | The same hierarchy, with the history and answers kept |

**Recommendation: B, progressive depth inside the current atlas.** It delivers what the idea is
after:

- start simple and add depth;
- a natural place to add new sections;
- a map that reads well from far away.

It does so without throwing away 1,946 skills, 308 answers, the V3 lessons or the import pipeline.
It also turns decision 1 (b), the "decomposes" relationship, into something JC can see in the app.

**One caution, either way.** Course-level order (Algebra → Geometry → Trigonometry → Calculus) is a
good *study order*, but it should not become strict *prerequisite* links between whole courses.
Parts of geometry come before parts of algebra, and the app refuses prerequisite loops. Keep strict
prerequisites at skill level, and show the course order as a suggested path.

### What B adds to the plan

- **Data:** a course/section layer (≈ 40–60 nodes, built from the 99 subdomains and 46 branches),
  and a "part of" link for every skill. Most of these can be derived and then reviewed, and they
  double as decision 1 (b).
- **App:** a depth control. Show subjects → courses → topics → skills, expanding as you zoom or
  click. This is the capacity proposal's level-of-detail option (R5), now with a clear purpose.
- **Order:** best after the V3 merge, so the course layer is built once over the merged atlas.
  It could replace step 8 (maths audit) and absorb part of the rendering work.

## 4. Decision needed from JC

Choose:

- **A:** a new map from scratch;
- **B:** progressive depth inside the current atlas (recommended);
- **neither:** keep the plan in §2 as it stands.

With B, the next queue would be steps 1–3 of §2 (merge the report branches, capacity safety, the
evidence field), followed by the V3 merge. Progressive depth comes right after.
