# Scope 05 — Decision brief for JC (Task 5)

> **Decided 2026-10-05.** JC accepted the recommendation on all 14 decisions. The "Decision" column
> below records them; `docs/SCOPE.md` §5 and its change log are updated to match. Decisions that
> change a map are carried out by later queues (`reports/scope/07-checkpoint.md`), not here.

Every decision below belongs to JC. Each has the **measured evidence** (with its source), the
**options**, and a **recommendation**. Nothing has been changed in any map. Answer on a copy of this
file, or in chat. Each choice then becomes an entry in `docs/SCOPE.md` §6's change log, and, where it
changes a map, a later content or merge queue.

**The 14 decisions at a glance**

| # | Decision | Recommendation in one line | Decision (2026-10-05) |
| --- | --- | --- | --- |
| 1 | Q1: off-path general mathematics | Keep it as context; count overview breakdowns through a reviewed "decomposes" relationship | **Accepted** |
| 2 | Q2: mathematics depth | Only as deep as an in-scope outcome needs | **Accepted** |
| 3 | Q3: are the X pathways part of "done"? | No; they are labelled extensions | **Accepted** |
| 4 | Q4: safety | Inside branch R10 and the branches that need it | **Accepted** |
| 5 | Q5: tools | Inside lessons, not as skills | **Accepted** |
| 6 | Q6: the broad `r-*` overviews | Keep for now; retire or link at the merge | **Accepted** |
| 7 | `X06` | Reclassify as an extension outcome | **Accepted** |
| 8 | The derivational `s-*` track | Keep optional, joined by *supports* links | **Accepted** |
| 9 | Thermal | No new domain; make S7 the home and add the missing skills there | **Accepted** |
| 10 | `K05`–`K07` planar kinematics | Make them prerequisites (teach planar first) | **Accepted** |
| 11 | Stranded integral calculus | Convert only where an outcome truly integrates | **Accepted** |
| 12 | `B-D08` filing | Resolved by the branch map: S7, Mechanics domain | **Accepted** |
| 13 | Duplicates | Rule `m-ftc`/`m-substitution` same-ability; record the rest as decompositions | **Accepted** |
| 14 | `requires_physical_evidence` | Adopt the field for Edition 07 onward; backfill older editions outside the lesson records | **Accepted** |

Plus **§D: what the later V3 merge needs**, which is preparation only.

---

## A. Scope boundaries (open questions from `docs/SCOPE.md` §5)

### 1. Q1 — General mathematics that is not on any robotics path

**Evidence** (`reports/scope/03-master-vs-scope.md`):

- The master's **1,033-skill general-mathematics import (`mf-skill-*`, 58% of the atlas) sits on no
  robotics path**. Neither do the 66 skills of the four granular content batches.
- But **998 of the 1,033 are linked by a *related* link to an `m-*` overview skill**, often an
  in-scope one. For example, granular differentiation skills sit under `m-derivative`. So many of
  them teach in-scope topics in finer steps, and the *related* link simply does not carry the
  inclusion test.

**Options:**

- **(a)** Keep everything. Off-path skills are tier *context*, outside coverage counts.
- **(b)** Keep everything, and add a reviewed **"decomposes"** relationship: a granular skill that
  breaks down an in-scope overview counts as in scope. It would be a new link type, or a reviewed list
  kept in `scope/`, because a *related* link cannot tell decomposition from mere relevance.
- **(c)** Move the off-path import to its own atlas family ("general mathematics"), so it stays usable
  but out of the robotics atlas.
- **(d)** Delete off-path skills.

**Recommendation: (a) now, (b) as the next scope step; never (d).**

- (a) costs nothing and loses nothing; answers stay attached.
- (b) is what makes coverage honest. With it, the in-scope count could grow from about 540–615 to up
  to about 1,500 (`04-branch-map.md`).
- (c) is worth revisiting only if the atlas must shrink for capacity reasons.
- (d) would discard answers already recorded.

### 2. Q2 — How deep the mathematics goes

**Evidence:**

- Of 1,221 mathematics skills, 111 are in scope by links (Task 3).
- V3 needed 101 mathematics entries for all five milestones, 90 of them reused from the master
  (Task 1).
- Its entry assumption is *"no assumed college mathematics"*.

**Options:**

- **(a)** Only as deep as an in-scope outcome needs.
- **(b)** A complete undergraduate sequence.

**Recommendation: (a).** The X pathways (model-predictive control, coupled dynamics) pull in more
where they genuinely need it.

### 3. Q3 — Are the X pathways part of "done"?

**Evidence:**

- R14 holds 12 V3 entries.
- 11 of those 12 have no introductory lesson yet (all nine of X01–X09, plus R-X01 and R-X02).
- X10 is already a non-assessed roadmap note.

**Options:**

- **(a)** "Done" means the core milestones I01–I05.
- **(b)** Core plus every X pathway.

**Recommendation: (a)**, with the X pathways authored as labelled extensions after the core is solid.

### 4. Q4 — Safety

**Evidence:**

- The branch map's **R10 Robot fault handling and safety** already holds 5 V3 entries:
  - `Q03` Identify hazards and protective functions;
  - `B-S02` Recognize hazards and seek appropriate controls;
  - `V04` Demonstrate stop and restart behavior;
  - `S08` Implement bounded fault response;
  - `A10` Specify holding and power-loss behavior.
- The roadmap's two fault-handling candidates are both covered by them (Task 4).

**Options:**

- **(a)** Safety skills inside the branches that need them, with R10 as their home.
- **(b)** A separate safety domain.

**Recommendation: (a).** The six colour domains are fixed in code (PLATFORM.md §4.2), and R10
already exists.

### 5. Q5 — Tools (CAD programs, robot frameworks, microcontroller families)

**Evidence:**

- V3's CAD entries name abilities ("Make a constrained CAD part", "Create an assembly with defined
  motion"), not products.
- Its software entries do the same ("Create a reproducible software build").

**Options:**

- **(a)** Tools appear inside lessons only.
- **(b)** Tools appear as optional context skills.

**Recommendation: (a).** It matches how V3 is already written.

### 6. Q6 — The broad `r-*` overviews

**Evidence:**

- The master's Robotics domain is 27 broad `r-*` overviews plus 17 granular wave-1 skills.
- V3 adds 129 granular robotics outcomes, none sharing an id or name with the master (Task 1).
- The 44 master robotics skills map onto 10 V3 branches (Task 3, a judgement).

**Options:**

- **(a)** Keep the overviews as orientation, outside coverage counts.
- **(b)** Split each into granular skills.
- **(c)** Retire them at the V3 merge, replacing each with links to the V3 outcomes it summarizes.

**Recommendation: (a) now, (c) at the merge**, decided overview by overview during the crosswalk
(§D). Splitting them (b) would duplicate V3.

## B. The five structural questions (PLATFORM.md §10.3), restated as scope decisions

These concern Robotics V3. Evidence: `authoring/robotics-v3/I05-Audit.md` §3.

### 7. `X06` — a "milestone" that leads nowhere

**Evidence:**

- *Compare learned policies with nonlearned baselines* is marked `milestone`.
- Its `feedsMilestones` is empty, nothing depends on it, and it is in no chain.

**Options:**

- **(a)** It is an extension **outcome**: reclassify it (`nodeKind: outcome`) inside R14.
- **(b)** It is a sixth integration milestone: wire it into a chain and give it prerequisites.

**Recommendation: (a).** Under the scope it is an advanced pathway, not part of "done" (Q3). A
learned-policy milestone would need a whole learning chain the core does not have.

### 8. The derivational `s-*` mechanics track

**Evidence:**

- V3's applied track `B-D01`–`B-D08` is on the path. `B-D05` *applies a supplied* beam model.
- The derivational track (`s-load`, `s-stress`, `s-strain`, `s-elastic`, `s-section`,
  `s-beamforces`, `s-bending`, `s-deflection`) is pending in V3 and reachable from no milestone.
- In the master, these same ids are in scope (they are among the 204 that V3 reuses, so they are
  Measure B seeds).

**Options:**

- **(a)** Keep the derivational track optional, joined to the applied track by *supports* links so it
  is visible.
- **(b)** Make it a prerequisite of `B-D05`, so the core explains where the model comes from.

**Recommendation: (a)** for the build-and-verify goal. Applying a supplied model with stated limits
is the build skill. Revisit if someone wants derivations to be core.

### 9. Thermal — three entries wide

**Evidence:**

- V3's whole thermal thread is `p-temperature` → `B-D08` → `E11`.
- In the branch map, thermal now has a home: **S7 Thermal and environmental behavior**. It has 12
  master skills (7 in scope) plus `B-D08`. The master already has thermal resistance, conductivity
  and convection skills (`s-thermalresist`, `s-conductivity`, `s-convection`).

**Options:**

- **(a)** No new domain. S7 is the thermal home, and its partial status lists the skills to add.
- **(b)** A separate thermal area.

**Recommendation: (a).** The domains are fixed at six, and S7 already exists. The real gap is the
roadmap's *differential expansion* split (Task 4).

### 10. `K05`–`K07` planar kinematics — stranded beneath the spatial case

**Evidence:**

- V3's planar FK, IK and Jacobian are pending and unreachable, while `K08`, `K10` and `K11` (spatial
  and general) are on the path.
- The *supports* link `K07 → K10` calls the planar case "an instructive worked example".
- In the master, the 17 wave-1 `sss-rob-*` skills are exactly planar FK, IK, reach and Jacobian work,
  and all of them are in scope.

**Options:**

- **(a)** Make `K05`–`K07` prerequisites of `K08`, `K10` and `K11`: teach planar first.
- **(b)** Leave them optional.

**Recommendation: (a).** The master already teaches planar before spatial. The merge will line the
two up, and the master's planar skills give the V3 cards their foundations.

### 11. Five stranded integral-calculus entries

**Evidence:**

- `m-defintegral`, `m-antiderivative`, `m-ftc`, `m-improper` and `m-numericalint` are reachable from
  no V3 milestone.
- Three *supports* links point from them into on-path work (`C03` PID, `N10` traction).

**Options:**

- **(a)** Convert a supports link to a prerequisite only where an in-scope outcome genuinely needs
  integration (for example continuous-time PID interpretation).
- **(b)** Keep calculus optional; sampled reasoning suffices.

**Recommendation: (a), case by case.** Under Q2 (depth follows outcomes), each link earns its place
or stays a *support*.

### 12. `B-D08` filed under Mechanics although it is a thermal calculation

**Evidence:** in the branch map, `B-D08` belongs to **S7 Thermal and environmental behavior**, which
sits in the Mechanics domain alongside thermal expansion and thermal resistance.

**Recommendation: resolved by the branch map.** Keep the Mechanics colour domain and treat S7 as its
branch. No change to the map is needed now; the V3 `subdomain` value can be aligned at the merge.

## C. Duplicates, and a field for future editions

### 13. Duplicate candidates (Task 3)

| Pair | Evidence | Options | Recommendation |
| --- | --- | --- | --- |
| `m-ftc` / `mf-skill-82b750…` "The Fundamental Theorem of Calculus" | Identical names, two subdomains | (a) same ability: keep one, link the other; (b) overview vs granular: keep both | **Rule them the same ability.** Merge at a later content pass, never automatically, because answers may differ |
| `m-substitution` / `mf-skill-6ed4f3…` "Integration Using Substitution" | Identical names | same | **Same as above** |
| Five near-name pairs (nonlinear systems, transformed functions, reciprocal trig derivatives, polar circles, inverse-trig integration) | 80% shared words, different abilities | keep both | **Keep both.** They are distinct |
| The structural pattern: 998 import skills related-linked to `m-*` overviews | Task 3 | see Q1 | **Record them as decompositions (Q1 (b))** rather than duplicates |

### 14. `requires_physical_evidence` — a field for future edition packages (specification only)

**Why.** Today the card's hardware-evidence line ("The full demonstration also needs physical or
deployed-system evidence") is decided by matching words in `practice_mode`
(`NEEDS_REAL_EVIDENCE`, `src/lesson.js`). Edition 06 lost the line on two cards until "actual" was
added to the word list (PLATFORM.md §3.5). A field removes the guesswork.

**Specification.**

- **In each lesson record** of an edition package (Edition 07 onward), add:

  | Field | Type | Meaning |
  | --- | --- | --- |
  | `requires_physical_evidence` | `true` / `false` | Whether the full demonstration needs evidence from real hardware, a deployed system, or supervised physical work |
  | `evidence_kind` | `"physical"`, `"deployed-system"`, `"supervised-measurement"` or `"none"` | Which kind, for the card's wording |

- **Package checker** (`check_package.py`): fail if any lesson lacks the field. Also fail if
  `requires_physical_evidence` is `false` while `practice_mode` mentions physical, actual or
  hardware work, so the two must agree.
- **Importer** (`authoring/robotics-v3/lessons.mjs`): copy the field into the rendering summary
  (`lessonCard.requiresPhysicalEvidence`). The lesson record stays verbatim, as today.
- **Card** (`src/lesson.js`): show the hardware line exactly when the field is `true`. If it is
  absent, fall back to today's word pattern and record the fallback in the import summary.
- **Editions 01–06:** do **not** edit their lesson records. Changing a stored lesson changes the
  lesson-payload signature, and the importer's "existing payloads unchanged" gate would refuse it
  (PLATFORM.md §6.2). Instead, a reviewed table `authoring/robotics-v3/evidence-overrides.json`
  (planning id → field values) feeds `lessonCard` only. It starts from today's pattern result
  (124 of 298 cards show the line), reviewed card by card.
- **Tests:**
  - every V3 card shows the line if and only if its field (or its override) is `true`;
  - Q06 and V07 stay named, as today;
  - a package without the field fails its checker.

**Recommendation: adopt it for Edition 07 onward, and backfill editions 01–06 through the overrides
table.**

## D. What the later V3 merge will need (preparation only — no answer was read)

1. **A meaning-by-meaning crosswalk.** Cover V3's 177 entries that have no master id (129 robotics,
   48 foundation) against the master. Start from the 35 word-overlap suggestions (Task 1); about a
   third are coincidences. Then decide, overview by overview, what happens to the 27 broad `r-*`
   skills (Q6).
2. **An id policy.**
   - 204 V3 entries already reuse a master id under a `rob3:` prefix. The merge must decide whether
     merged skills keep the master id (simplest: answers and links follow) or the `rob3:` id.
   - **Recommended:** keep master ids for the 204; keep `rob3:` ids for the 177 new ones, or rename
     them once with a recorded mapping.
   - Note one name difference: `m-order` is "Order of operations" in the master but "…for basic
     arithmetic" in V3.
3. **Atlas families.**
   - The master's answers belong to family `sss-robotics-foundations-2026-09`; V3's to
     `robotics-foundations-integration-v3-review`. Answers never cross families (PLATFORM.md §5.1).
   - The merged map needs one family. Answers recorded in the other must be carried across
     deliberately, never inferred.
4. **The `m-logic` answer conflict.**
   - The NOT-QUEUED list names it. Nothing in the repository describes it, and this queue did not
     read answers to find out.
   - The merge must list every skill answered differently in the two families (`m-logic` first),
     with no automatic winner. JC decides each, as the shared-record rules already require for
     imports (PLATFORM.md §7.2).
5. **Review sessions.** A merged map has a new node set and so a new review key. Sessions saved
   for either old map will not resume. Say so to JC, or provide a one-time migration.
6. **Layout and levels.** Both maps use the vortex spiral with levels up to 70. Merged levels
   must be recalculated, which moves skills: a visible change JC should expect.
7. **The import pipeline.** `authoring/robotics-v3/apply-lessons.mjs` targets the V3 export. After
   the merge, editions must target the merged map, and its preservation gates must be re-based.
8. **Capacity.** The merged atlas is about 1,984–2,060 skills, within today's 5,000-skill cap. With
   lessons on every skill it would be about 16 MB, **over the 10 MB file cap**
   (`04-branch-map.md`). So capacity steps 1–4 (`reports/capacity/05-proposal.md`) should land
   before the merge, or the merge must keep lessons on V3 skills only. The Task 6 wave plan places
   this.
9. **Backups first.** Run `Backup-User-Data.cmd` before any merge step that touches a real map.
