# Skill Solar System — skill scope

**Status: draft for JC's review** (scope queue, branch `scope-foundation`, 2026-10-05). Sections
marked **open** are decisions for JC. Nothing in this document changes a map. It says what the
atlas must eventually contain, so content packages and the app can be built toward it.

## 1. The goal

> **Someone who works through the atlas can design, build, program, integrate and verify working
> robots**: robot arms, wheeled robots and mobile manipulators, from first numeracy up to a
> verified, repeatable robotic work system, with advanced pathways labelled separately.

This is the scope JC chose on 2026-10-04 ("robotics build-and-verify"). It matches the reviewed
Robotics V3 specification's own scope: *"Arms, wheeled robots, stationary-base mobile manipulation;
advanced extensions separately labeled."*

**Where it starts.** It assumes a person can read the instructional language and use a computer.
Basic numeracy, units and computer use are **skills inside** the atlas. No college mathematics or
physics is assumed: the atlas teaches it where a robot needs it. This is the V3 specification's
entry assumption.

**What "done" means for the atlas.** Every milestone in §3 has a complete prerequisite chain. Every
skill in those chains passes the inclusion test (§2) and the granularity rule (§2.3), and has at
least an introductory card. "Done" describes content, never what a person knows: answers stay the
reader's own.

## 2. The inclusion test

### 2.1 When a skill belongs

A skill is **in scope** if any one of these holds:

| Tier | Rule | Example |
| --- | --- | --- |
| **Core outcome** | An observable robotics ability on the path to a core milestone (I01–I05, §3) | "Solve planar two-link forward kinematics" |
| **Extension outcome** | An observable robotics ability on an advanced pathway (X01–X09, §3) | "Implement force or impedance control" |
| **Foundation** | A **prerequisite**, directly or through a chain of prerequisite links, of any core or extension outcome. This is how mathematics, physics, electronics, mechanics and computing qualify | "Multiply matrices", "Apply Kirchhoff's current law" |
| **Context** (**open**, see §5 Q1) | Linked to in-scope skills only by *supports* or *related* links, or not linked at all | Many general-mathematics topics imported from a course catalogue |

A skill **qualifies through the map's own links**. A mathematics skill is in scope because a robotics
outcome needs it, not because it is mathematics. The test is mechanical once the links exist, so it
can be measured (Task 3 does this for today's master).

### 2.2 What does not qualify by itself

- **A subject being "useful"** without a stated dependency. If it is really needed, the dependency is
  recorded as a prerequisite link with a rationale; otherwise it is context.
- **Tool and product skills** (a particular CAD program, robot framework or microcontroller brand)
  as separate skills. The underlying ability is the skill; tools appear in its lesson and
  demonstration. (**Open**, see Q5.)
- **Overview skills that only group others.** They may stay as orientation, but do not count toward
  coverage (Q6).

### 2.3 Granularity rule

From the coverage roadmap's definition of a completed branch review: **a skill is a distinct
observable ability that can reasonably receive a different self-mark from its neighbours.** Two
abilities that a learner would always answer the same way are one skill. One "skill" that hides
abilities a learner would answer differently should be split.

## 3. The backbone: milestones that define "done"

### 3.1 Core milestones (from Robotics V3)

| Id | Milestone | Prerequisite chain today (V3) |
| --- | --- | ---: |
| I01 | Integrate and verify a controlled joint | 185 entries |
| I02 | Integrate and verify a robot arm | 249 |
| I03 | Integrate and verify an autonomous wheeled robot | 241 |
| I04 | Integrate a perception-guided mobile manipulator | 291 |
| I05 | Verify a repeatable robotic work system | 298 |

Each is a physical integration and verification task. V3 already closes all five chains with
introductory cards (PLATFORM.md §9). The master atlas does not yet carry these milestones; they arrive
with the later V3 merge.

### 3.2 Extension pathways (from Robotics V3, labelled separately)

| Id | Pathway | Note |
| --- | --- | --- |
| X01 | Model coupled multi-joint dynamics | |
| X02 | Implement force or impedance control | |
| X03 | Coordinate base and arm motion simultaneously | |
| X04 | Apply model-predictive control | |
| X05 | Evaluate learned robot perception | |
| X06 | Compare learned policies with nonlearned baselines | Marked as a *milestone* but leads nowhere: an open structural question (PLATFORM.md §10.3) |
| X07 | Coordinate multiple mobile robots | |
| X08 | Design a human-facing robot interaction | |
| X09 | Develop compliant or dexterous manipulation | |
| X10 | *Roadmap note:* legged, humanoid or aerial systems | Not assessed; outside the current scope (§4) |

### 3.3 Candidate capabilities the roadmap names that V3 may not cover

The coverage roadmap lists three Robotics branches with *"no dedicated branch record identified"*.
Task 4 checks each against V3's branches before anyone proposes a new milestone:

- **Robot fault handling:** detection and recovery for a lost sensor; a controlled stop versus loss
  of power.
- **Calibration and identification:** separating sensor calibration from robot parameter
  identification; designing an experiment to estimate an uncertain parameter.
- **Mechanical machine elements:** bearing load directions; coupling misalignment versus backlash.

## 4. Exclusions

**Proposed; JC to confirm.**

| Out of scope | Why |
| --- | --- |
| Legged, humanoid and aerial robots (V3's X10) | A separate specialization with its own dynamics and safety case; can be added as a future pathway |
| Production-scale manufacturing, supply chains and business | The atlas stops at building and verifying a working system, not mass-producing it |
| Formal regulatory certification (for example CE or UL marking) | Safe practice and hazard awareness are in scope as skills; certification procedure is not |
| Research frontiers beyond the X pathways | Added only when a pathway is defined and reviewed |
| Tool and product training as standalone skills | See §2.2 and Q5 |

## 5. Open boundary questions for JC

Each has options and a recommendation; the decision brief (`reports/scope/05-decisions.md`) adds the
measured evidence from Tasks 3 and 4.

| # | Question | Options | Recommendation |
| --- | --- | --- | --- |
| Q1 | **General mathematics not on any robotics path.** The master holds 1,221 mathematics skills, many imported from a general course catalogue. How many sit on a robotics path is measured in Task 3 | (a) keep everything, marking off-path skills as *context*; (b) move off-path skills to a separate "general mathematics" atlas family; (c) delete them | **(a)**: nothing is lost, answers stay attached, and the context tier keeps them out of coverage counts. Revisit when capacity work lands |
| Q2 | **How deep the mathematics goes** (for example calculus and linear algebra beyond what an outcome uses) | (a) only as deep as an in-scope outcome needs; (b) a full undergraduate sequence | **(a)**. Depth follows the outcomes; the X pathways pull in more where they need it |
| Q3 | **Whether the X pathways are part of "done"** | (a) core milestones only; (b) core plus every X pathway | **(a) for "done"**, with X pathways as labelled extensions authored after the core |
| Q4 | **Safety and ethics** | (a) as skills inside the branches that need them (stop categories, guarding, risk assessment); (b) a separate branch | **(a)**, plus a short cross-cutting list so nothing is missed |
| Q5 | **Tools** (a CAD program, a robot software framework, a microcontroller family) | (a) inside lessons only; (b) as optional context skills | **(a)**. Abilities, not products, are skills |
| Q6 | **Two layers in today's Robotics domain**: 27 broad `r-*` overviews above 17 granular `sss-rob-*` skills | (a) keep overviews as orientation, outside coverage counts; (b) split them into granular skills; (c) retire them at the V3 merge | **(a) now, (c) at the merge.** Decide per skill when the crosswalk is done |

## 6. How the scope is kept

- **This file is the source of truth** for what the atlas covers. `scope/branches.json` is the same
  branch list as data (filled in by Task 4).
- **Only JC changes the scope.** A change is made by a pull request that edits this file and adds a
  line to the change log below. Claude Code may propose changes but never merges them.
- **Every content package names the scope branch it fills**, and reports the roadmap's coverage
  items: outcomes addressed, skills reused, new skills, remaining gaps, sources and verification.
- **Coverage is measured, not declared.** The tier of every skill (§2.1) is computed from the map's
  links, as in `reports/scope/03-master-vs-scope.md`.

### Change log

| Date | Change | By |
| --- | --- | --- |
| 2026-10-04 | Scope set to robotics build-and-verify; V3 merges later; scope work first | JC |
| 2026-10-05 | First draft of this document | Claude Code (scope queue Task 2) |

## 7. Branch map

*Filled in by Task 4: every branch, its boundary, coverage and status.*
