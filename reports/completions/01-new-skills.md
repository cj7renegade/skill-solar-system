# Completions 01 — The two new skills and the open items (Task 2)

Drafted 2026-11-05. **Waiting for JC at Checkpoint A.** Nothing is built until JC answers C1–C5.
The machine-readable draft is `scope/completions/new-skills.json`. Read-only: no map or answer
record changed.

## C1 — How many lessons does step 5 write? (the STOP from Task 1)

29 skills in the I05 chain have no lesson (`00-starting-state.md`). The 23 master-only ones have no
planning id (the importer skips them) and no specification entry (a lesson has nothing to be checked
against). Covering them means writing a specification entry for each first, and teaching the importer
to find a skill by its master id.

| Option | Lessons | What else it needs | Size |
| --- | ---: | --- | --- |
| **(a) As queued** (recommended) | **8**: the 6 V3 skills + `P11` + `A12` | nothing new | small |
| (b) Add the 17 `sss-rob-*` frame and planar-arm steps | 25 | 17 specification entries; importer finds skills by master id | medium |
| (c) All 29 + the two new skills | 31 | 23 specification entries; the same importer change | medium |

**Recommendation: (a).** Step 5 stays small and closes every V3 gap. The 23 master skills become the
first batch of step 7 (lessons for every required skill), which already needs the specification entries
and the importer change for master skills, so the work is done once. Until then the I05 chain has
23 skills without a card, which is true today as well. Nothing gets worse.

## C2 — `P11` Detect an inconsistent measurement innovation (R6)

**What it is.** When a filter gets a new sensor reading, the *innovation* is how far the reading is
from what the filter expected. This skill is checking whether that gap is too big to be believable,
using a threshold fixed beforehand, and knowing what a rejection does and does not tell you.

| | |
| --- | --- |
| Prerequisites | `P08` Implement a state estimator |
| Leads to | `P09` Fuse nonlinear mobile-robot measurements (new prerequisite) |
| Supported by | `m-hypothesis` Hypothesis tests and error types (*supports*, not required) |
| Required? | **Yes** (through `P09` it is in I03, I04 and I05) |
| Assessment mode | written calculation |

**Demonstration.** For a stated linear Gaussian filter, compute each measurement's innovation and
innovation covariance, form the normalized innovation squared, and compare it with a chi-square gate
fixed in advance from the measurement dimension and a stated false-alarm rate. Classify a synthetic
sequence that includes injected outliers, and explain why a rejected measurement alone does not
distinguish a sensor fault from a wrong noise or motion model.

**Why it is a separate skill.** `P08` builds the filter, and `P09` tests inconsistent measurements
as one of several things on a nonlinear robot. A learner can do `P08` without ever gating a
measurement, and can gate measurements before handling Jacobians and angle wrapping. So it can be
marked on its own. It is the piece of `P09` split out, and so it sits between the two.

**Why `m-hypothesis` only supports it.** As a prerequisite it would pull `m-hypothesis` and two more
lessonless maths skills into the I05 chain. The gate uses one idea from it (a false-alarm rate),
which the lesson can state directly.

**Effect on `P09`'s lesson.** None. Its lesson is checked against V3's own specification, which
does not change. The map gains one prerequisite edge into `P09`, as `K08` did in the merge.

## C3 — `A12` Distinguish coupling misalignment from backlash (R12)

**What it is.** Two different faults can both make an output shaft lag its motor. *Backlash* is a
gap that shows up only when the direction reverses. *Misalignment* is the two shafts not lining up,
which makes an error that repeats every turn and pushes sideways on the bearings. This skill is
telling them apart from measurements.

| | |
| --- | --- |
| Prerequisites | `A09` Measure backlash and compliance; `D08` Select bearings and shaft supports |
| Leads to | `V05` Diagnose integrated failures (*supports*, not required) |
| Required? | **No, recommended optional** |
| Assessment mode | calculation and explanation |

**Demonstration.** Given a motor, coupling and output shaft with stated measurements of output angle
against input angle over full revolutions and at direction reversals, plus shaft-support load or
vibration readings, attribute the error to backlash (a dead band at reversal, independent of shaft
angle), misalignment (an error and radial load that repeat once or twice per revolution, with no dead
band) or both. Name the measurement that would separate them when the data cannot.

**Why it is a separate skill.** `A09` separates lost motion from springiness; it never looks at
errors that depend on shaft angle. `D08` chooses the supports; it does not diagnose them. Neither
covers this.

**Why optional.** Many robot joints have the motor and gearbox in one unit with no separate shaft
coupling, so a learner can complete I05 without meeting this fault. Making it required would mean a
prerequisite edge into `V05`. That is possible (no loop), but it says every learner needs it.
**If JC wants it required,** the only change is that edge's type, and it joins I05.

## C4 — Correct `feedsMilestones` on 9 skills

The list of milestones each skill leads to, which the app does not display. Recalculate it from the
edges for every V3 skill and the two new ones (9 corrections, listed in `00-starting-state.md`).
Master-only skills stay without the list, as now. **Recommended: yes.**

## C5 — Who writes the Edition 07 lessons?

| Option | |
| --- | --- |
| **Claude Code, in this repository** (recommended) | Same package format as Editions 01–06, checked by the package checker and a lab program that recomputes every worked example. JC reads all 8 lessons at Checkpoint B before anything is imported into the working map. |
| An outside author, as for Editions 01–06 | Claude Code hands over `Edition07-Targets.json` (Task 4) and waits for the package. |

## Not a decision, but needed before Task 3: a fresh backup

JC answered `rob3:B-C01` after the last backup. Close the app, then run `Backup-User-Data.cmd`.

## What JC says

For example: *"C1 (a), C2 yes, C3 optional, C4 yes, C5 Claude Code"*, or change any of them.
