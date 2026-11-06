# HelixSkill subject build-out — authoring brief

**For Claude in the desktop app.** JC is building out skill hierarchies with you, and will bring each
finished hierarchy back to Claude Code, which integrates it into the **Humanoid Protocol Droid Helix
map**. This brief tells you what the map already contains, what to build, the rules the map
enforces, and the exact format to deliver in. Following it means a batch can be imported with few or
no changes.

Attach `handoff/Helix-Reference.json` to the conversation. It is a read-only export of the current
helix map, with every skill's id, name, course, subject, description, prerequisites, build stage,
helix level and tier. It contains no answers, positions or lesson text.

## 1. What HelixSkill is

An offline 3D map of skills. Each skill is a sphere that a learner marks Yes, No or unmarked, and
prerequisite links say what must be learned first. The helix map is aimed at one goal: **being able
to build and verify a humanoid protocol droid.** Height on the helix is the skill's helix level (1 + 3
× the longest prerequisite chain below it); around the axis, each of 16 courses winds upward as its
own band.

The goal is a chain of nine integration milestones, each building on the one before. **I06–I09 are
the target of this campaign.** I01–I05 are the robot-building milestones beneath them: they are
already well covered, and every humanoid milestone depends on them.

| Id | Stage | Milestone |
| --- | --- | --- |
| `rob3:I01` | 2 | Integrate and verify a controlled joint |
| `rob3:I02` | 3 | Integrate and verify a robot arm |
| `rob3:I03` | 4 | Integrate and verify an autonomous wheeled robot |
| `rob3:I04` | 5 | Integrate a perception-guided mobile manipulator |
| `rob3:I05` | 6 | Verify a repeatable robotic work system |
| **`hx-sys-ms-i06`** | 6 | **I06: integrate and verify a humanoid upper body**: torso, two arms with hands and an expressive head, with coordinated bimanual and head motion verified against requirements |
| **`hx-sys-ms-i07`** | 6 | **I07: integrate a wheeled humanoid that navigates and manipulates**: the upper body on a wheeled base, navigating among people and doing pick-and-place within power and stability limits |
| **`hx-sys-ms-i08`** | 6 | **I08: verify a conversational protocol droid that performs tasks safely**: spoken requests, guarded tool calls, risk assessment, safety validation, privacy review and user acceptance |
| **`hx-sys-ms-i09`** | 7 | **I09 (optional): integrate bipedal locomotion**: legs on the verified droid, with fall safety and repeat-run walking trials |

Build stages: 1 Foundations, 2 Controlled joint, 3 Robot arm, 4 Wheeled base, 5 Mobile manipulator,
6 Humanoid protocol droid, 7 Legs (optional).

Today the map has **3,696 skills** in 16 courses:

| Code | Course | Skills | | Code | Course | Skills |
| --- | --- | --- | --- | --- | --- | --- |
| MTH | Mathematics | 1,232 | | CST | Programming & Software Engineering | 215 |
| PHY | Physics | 490 | | KDC | Kinematics, Dynamics & Control | 175 |
| MAT | Materials Science | 94 | | LOC | Locomotion & Balance | 108 |
| MEC | Mechanical Design & Fabrication | 167 | | MAN | Manipulation & Hands | 106 |
| ACT | Actuation & Power Transmission | 128 | | PER | Sensing & Perception | 149 |
| ELX | Electrical & Electronics | 221 | | AIL | AI, Learning & Language | 144 |
| PWR | Power Systems & Batteries | 64 | | HRI | Human-Robot Interaction | 92 |
| EMB | Embedded Systems & Firmware | 150 | | SYS | Systems Engineering, Integration & Safety | 161 |

In the reference file, `onHelixGoalPath` marks the 2,859 skills that I08 or I09 depends on. The 67
checkpoints (`nodeKind: "checkpoint"`, ids such as `hx-act-checkpoint-s3`) gather each course's
end-of-branch skills for one stage and feed that stage's milestone. 350 Robotics Atlas skills have
lessons; no humanoid skill has one yet.

## 2. What to build

The skills that **I06–I09 need and the map does not yet have**, at the granularity a learner can
actually mark, with their prerequisite hierarchies. Build what is missing or too coarse; reuse what
exists. JC names the course or courses for each conversation. The supporting courses (MTH, PHY, MAT,
MEC, ELX, PWR, EMB, CST) are the usual targets, but any of the 16 can be.

**Scope:**
- **In:** everything the humanoid milestones I06, I07 and I08 depend on, down to its foundations.
  This includes foundations that I01–I05 also use, if the humanoid work needs them deeper or finer.
- **In, marked optional:** I09 (bipedal locomotion, stage 7). Skills needed only for I09 get stage 7.
- **Out:** the extension pathways X01–X09, except where a humanoid milestone already uses one (for
  example `rob3:X03`, coordinated base-and-arm motion, feeds I07). Aerial robots; production
  manufacturing; certification procedure; and tool or product training as standalone skills.

Work **course by course, subject by subject.** The reference's `subdomain` is the subject inside a
course (for example PHY · Electrostatics). The 46 `branches` in the reference describe only the
original Robotics Atlas skills; humanoid skills (`hx-*`) have `branch: null`.

## 3. The rules the map enforces

1. **A skill belongs only through a dependency.** A skill is in scope because a humanoid milestone
   needs it. Every new skill must lead, through prerequisite links, to I08 or I09: to an existing
   skill with `onHelixGoalPath: true`, or to another new skill that does. One that does not is
   *context*: deliver it only if JC wants it, marked as context.
2. **Close every branch.** A new skill nothing else depends on is a dead end. Link the end of each
   new branch into the existing skill that needs it, or into the course's checkpoint for that stage
   (`hx-<course>-checkpoint-s<N>`; check the exact id in the reference, since some prefixes differ from
   the course code: `hx-ctl-` for KDC, `hx-sw-` for CST, `hx-ai-` for AIL and `hx-pth-` for PHY. MTH and
   MAT have no checkpoints).
3. **Granularity: one skill is one markable ability.** It is a distinct, observable ability that a
   learner could reasonably mark differently from its neighbours. Two abilities a learner would
   always mark the same way are one skill. A "skill" hiding abilities they would mark differently
   should be split. Aim for one lesson plus practice per skill.
4. **Depth follows the milestones.** Go only as deep as a humanoid milestone needs, not a full
   university sequence.
5. **Abilities, not products.** "Use a CAD program" is not a skill; "Dimension a part from functional
   datums" is.
6. **Safety lives inside the courses** that need it, as skills (for example "Identify a stored-energy
   hazard before working on a drive").
7. **Reuse before adding.** Search the reference file by meaning, not only by name. If an existing
   skill is the same ability, use its id. If an existing skill is too broad, add the narrower skill
   *beside* it (never replace or rename it) and say which one it splits.
8. **Never touch existing skills.** Do not change an existing skill's id, name, description or links.
   If you think one is wrong, list it under `proposedChanges` instead.
9. **Prerequisites are immediate.** List the 1 to 4 skills needed right before this one, never their
   ancestors.
10. **No answers, positions or levels.** Every skill is delivered unmarked. Helix levels and placement
   are computed on import. You do give each skill its course, stage and tier (§5).

## 4. Ids

- **New skills:** `sss-<course>-<slug>`, with the course code in lower case: `mth`, `phy`, `mat`,
  `mec`, `act`, `elx`, `pwr`, `emb`, `cst`, `kdc`, `loc`, `man`, `per`, `ail`, `hri` or `sys`. For
  example `sss-phy-eddy-current-braking`. Lower case, hyphens, unique, and not already in the reference
  file. Never start a new id with `hx-` or `rob3:`; those belong to existing sources.
- **Existing skills:** use their id exactly as the reference file gives it (for example `m-vector`,
  `e-kvl`, `rob3:K05`, `hx-act-harmonic-drive`).

## 5. Delivery format

One file per batch, named `<course>-batch-NN.json`, for example `phy-batch-01.json`. Keep a batch to
about **100 new skills or fewer**, so JC can review it in one sitting. Deliver the batch together
with a readable `COVERAGE.md`. The JSON:

```json
{
  "format": "helixskill-skill-batch",
  "formatVersion": 2,
  "map": "humanoid-helix-v1",
  "batchId": "phy-batch-01",
  "date": "2026-11-20",
  "status": "draft",
  "course": "PHY",
  "subjects": ["Electromagnetic induction"],
  "milestones": ["hx-sys-ms-i07", "hx-sys-ms-i08"],
  "nodes": [
    {
      "id": "sss-phy-example-skill",
      "name": "A verb-first name of the ability",
      "course": "PHY",
      "subdomain": "The subject it belongs to",
      "stage": 2,
      "tier": "Core",
      "type": "QUANT",
      "practice": "written",
      "description": "One sentence, 15 to 35 words: what the learner can do.",
      "details": "Paragraph 1: the idea, its rule and its limits.\n\nParagraph 2: a worked example with numbers.",
      "proficiencyReference": "I can … (a statement the learner marks Yes or No against).",
      "scopeNote": "Conditions and limits of the skill.",
      "splits": "existing-id or null",
      "sourceRefs": ["S1"]
    }
  ],
  "edges": [
    { "source": "hx-em-faraday-quant", "target": "sss-phy-example-skill", "type": "prerequisite", "rationale": "Why the source must come first." }
  ],
  "intoExisting": [
    { "source": "sss-phy-example-skill", "target": "hx-act-back-emf-derive", "type": "prerequisite", "rationale": "Why the existing skill needs the new one." }
  ],
  "sources": [ { "id": "S1", "title": "A public reference", "url": "https://…" } ],
  "proposedChanges": [],
  "deferred": [ { "idea": "Something left out", "why": "Out of scope, or needs JC's decision" } ]
}
```

The ids in `edges` and `intoExisting` above are only illustrations: check every endpoint against the
reference.

- **`course`** is one of the 16 codes in §1. The map's six display domains are derived from it on
  import, so don't give a `domain`.
- **`stage`** is the first build stage (1–7) at which the skill is needed. It is never earlier than
  the stage of any of its prerequisites. Use 7 for skills only I09 needs.
- **`tier`** is `Core` (needed by most builders), `Working` (needed for a specific subsystem) or
  `Specialist` (deep or narrow).
- **`type`** is `QUANT` (calculation, derivation or code with a checkable answer) or `QUAL`
  (explanation, judgment or procedure).
- **`practice`** is how the skill is shown: `written`, `code`, `hands-on` or `design`.
- **`edges`** are links *into* new skills, from existing or other new skills. **`intoExisting`**
  holds links from a new skill *into an existing one*, including checkpoints. Keep them separate:
  they change existing paths, can make a skill required, and JC approves each one.
- **Edge types:**
  - `prerequisite`: the source is learned first;
  - `supports`: optional preparation;
  - `related`: context only.

  Only `prerequisite` affects levels and scope.
- **Leave out** `proficiency80`, `position`, `skillLevel`, `helixLevel`, `domain`, `planningId` and
  lesson fields.
- **`COVERAGE.md`** lists, by subject, each new skill, the milestone (I06–I09) it serves and the
  existing skill or checkpoint its branch closes into, and anything deferred.

## 6. Checks to run before delivering

- Every new id is unique, follows §4 and is absent from the reference file.
- Every edge endpoint is either in the batch or in the reference file.
- The prerequisite links, together with the reference file's, form no loop.
- Every new skill leads to I08 or I09 through prerequisites, or is marked context.
- No new skill has an earlier stage than any of its prerequisites.
- Every number in a worked example has been recomputed.
- No skill duplicates an existing skill's ability. Note each near match and why yours differs.

## 7. What happens on import (Claude Code)

Each batch goes through the steps used for every change so far:
1. **Reconcile** it against the live helix map: duplicates, ids, endpoints and the goal path.
2. **Checkpoint A:** JC approves the skills and every `intoExisting` link.
3. **Gated build in scratch:** no answer, existing skill, connection or lesson may change. Helix
   levels and the layout are recomputed.
4. **Tests** in the real app.
5. **Checkpoint B:** JC opens the result and says go.
6. **Working map, backup and pull request**, then a fresh `Helix-Reference.json` for the next batch.

Batches change only the helix map. The Robotics Atlas, `Maps/Robotics-Atlas.json`, stays as it is
unless JC asks otherwise; its own reference, `handoff/Atlas-Reference.json`, is kept for that case.

Lessons for the new skills are not part of these batches. They can follow later.
