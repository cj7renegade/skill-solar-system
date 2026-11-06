# HelixSkill subject build-out — authoring brief

**For Claude in the desktop app.** JC is building out the skill hierarchies of the supporting
subjects with you, and will bring each finished hierarchy back to Claude Code, which integrates it
into the atlas. This brief tells you what the atlas already contains, what to build, the rules the
atlas enforces, and the exact format to deliver in. Following it means a batch can be imported with
few or no changes.

Attach `handoff/Atlas-Reference.json` to the conversation. It is a read-only export of the current
atlas, with every skill's id, name, subject, branch, description and prerequisites. It contains no
answers, positions or lesson text.

## 1. What HelixSkill is

An offline 3D map of skills. Each skill is a sphere that a learner marks Yes, No or unmarked, and
prerequisite links say what must be learned first. The atlas is aimed at one goal: **being able to
build and verify working robots.** That goal is defined by five integration milestones:

| Id | Milestone |
| --- | --- |
| `rob3:I01` | Integrate and verify a controlled joint |
| `rob3:I02` | Integrate and verify a robot arm |
| `rob3:I03` | Integrate and verify an autonomous wheeled robot |
| `rob3:I04` | Integrate a perception-guided mobile manipulator |
| `rob3:I05` | Verify a repeatable robotic work system |

Today the atlas has 1,955 skills: Mathematics 1,232 (1,033 of them a general-course import),
Physics 216, Electronics 141, Mechanics 125, Computing 126 and Robotics 115. The **core**, meaning
every robotics skill plus everything those skills need, is 351 skills, and each has a lesson. In the
reference file, the `inCore` and `onI05Path` flags show where each skill stands.

## 2. What to build

The skills in **Mathematics, Physics, Electronics, Mechanics (including materials) and Computing**
that the robotics milestones need, at the granularity a learner can actually mark, with their
prerequisite hierarchies. Build what is missing or too coarse; reuse what exists.

**Scope:**
- **In:** the core milestones I01–I05.
- **Out:** the extension pathways X01–X09, dropped from the plan on 2026-11-05. Include their
  foundations only if JC asks.
- **Also out:** legged, humanoid and aerial robots; production manufacturing; certification
  procedure; and tool or product training as standalone skills.

The 46 scope branches in the reference file (`branches`, with each one's `boundary` and `excludes`)
are the agreed map of each subject. Work branch by branch.

## 3. The rules the atlas enforces

1. **A skill belongs only through a dependency.** A foundation skill is in scope because something on
   the robotics path needs it. Every new skill must lead, through prerequisite links, to an existing
   core skill or to another new skill that does. One that does not is *context*: deliver it only if JC
   wants it, marked as context.
2. **Granularity: one skill is one markable ability.** It is a distinct, observable ability that a
   learner could reasonably mark differently from its neighbours. Two abilities a learner would
   always mark the same way are one skill. A "skill" hiding abilities they would mark differently
   should be split.
3. **Depth follows the outcomes.** Go only as deep as a robotics outcome needs; not a full university
   sequence.
4. **Abilities, not products.** "Use a CAD program" is not a skill; "Dimension a part from functional
   datums" is.
5. **Safety lives inside the branches** that need it, as skills (for example "Identify a stored-energy
   hazard before working on a drive").
6. **Reuse before adding.** Search the reference file by meaning, not only by name. If an existing
   skill is the same ability, use its id. If an existing skill is too broad, add the narrower skill
   *beside* it (never replace or rename it) and say which one it splits.
7. **Never touch existing skills.** Do not change an existing skill's id, name, description or links.
   If you think one is wrong, list it under `proposedChanges` instead.
8. **No answers, positions or levels.** Every skill is delivered unmarked. Placement and levels are
   computed on import.

## 4. Ids

- **New skills:** `sss-<area>-<slug>`, with areas `math`, `phys`, `elec`, `mech`, `mat` (materials)
  and `comp`. For example `sss-elec-dependent-source-thevenin`. Lower case, hyphens, unique, and not
  already in the reference file.
- **Existing skills:** use their id exactly as the reference file gives it (for example `m-vector`,
  `e-kvl`, `rob3:K05`).

## 5. Delivery format

One file per batch, named `<subject>-batch-NN.json`, for example `electronics-batch-01.json`. Keep a
batch to about **100 new skills or fewer**, so JC can review it in one sitting. Deliver the batch
together with a readable `COVERAGE.md`. The JSON:

```json
{
  "format": "helixskill-skill-batch",
  "formatVersion": 1,
  "batchId": "electronics-batch-01",
  "date": "2026-11-20",
  "status": "draft",
  "subject": "Electronics",
  "branches": ["E1", "E2"],
  "nodes": [
    {
      "id": "sss-elec-example-skill",
      "name": "A verb-first name of the ability",
      "domain": "Electronics",
      "subdomain": "The branch or topic it belongs to",
      "description": "One sentence: what the learner can do.",
      "details": "Paragraph 1: the idea, its rule and its limits.\n\nParagraph 2: a worked example with numbers.",
      "proficiencyReference": "I can … (a statement the learner marks Yes or No against).",
      "scopeNote": "Conditions and limits of the skill.",
      "splits": "existing-id or null",
      "sourceRefs": ["S1"]
    }
  ],
  "edges": [
    { "source": "e-kvl", "target": "sss-elec-example-skill", "type": "prerequisite", "rationale": "Why the source must come first." }
  ],
  "intoExisting": [
    { "source": "sss-elec-example-skill", "target": "e-rc", "type": "prerequisite", "rationale": "Why the existing skill needs the new one." }
  ],
  "sources": [ { "id": "S1", "title": "A public reference", "url": "https://…" } ],
  "proposedChanges": [],
  "deferred": [ { "idea": "Something left out", "why": "Out of scope, or needs JC's decision" } ]
}
```

- **`domain`** is one of the six domains in §1.
- **`edges`** are links *into* new skills, from existing or other new skills. **`intoExisting`**
  holds links from a new skill *into an existing one*. Keep them separate: they change existing
  paths, can make a skill required, and JC approves each one.
- **Edge types:**
  - `prerequisite`: the source is learned first;
  - `supports`: optional preparation;
  - `related`: context only.

  Only `prerequisite` affects levels and scope.
- **Leave out** `proficiency80`, `position`, `skillLevel`, `planningId` and lesson fields.
- **`COVERAGE.md`** lists, by branch, each new skill, the robotics skill it serves through its links,
  and anything deferred.

## 6. Checks to run before delivering

- Every new id is unique and absent from the reference file.
- Every edge endpoint is either in the batch or in the reference file.
- The prerequisite links, together with the reference file's, form no loop.
- Every new skill leads to the core through prerequisites, or is marked context.
- Every number in a worked example has been recomputed.
- No skill duplicates an existing skill's ability. Note each near match and why yours differs.

## 7. What happens on import (Claude Code)

Each batch goes through the steps used for every change so far:
1. **Reconcile** it against the live atlas: duplicates, ids and endpoints.
2. **Checkpoint A:** JC approves the skills and every `intoExisting` link.
3. **Gated build in scratch:** no answer, existing skill, connection or lesson may change.
4. **Tests** in the real app.
5. **Checkpoint B:** JC opens the result and says go.
6. **Working map, backup and pull request.**

Lessons for the new skills are not part of these batches. They can follow later.
