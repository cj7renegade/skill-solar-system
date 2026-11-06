# Completions 00 — Starting state (Task 1)

Measured 2026-11-05 on branch `robotics-completions`. Read-only: no map, answer record or app file
was changed.

## Backup — taken before the queue, but one answer is newer

The newest backup is `%OneDrive%\HelixSkill Backups\2026-11-05_190224`, taken for the merge's Task 7.
JC answered one skill after it (below), so **a fresh backup is needed before Task 3**. The app is
open on JC's real profile now (4 `electron.exe` processes), and the backup script refuses to run
while it is open. Claude Code did not close it. Tasks 1 and 2 only read files.

## The working map

| | `Maps/Robotics-Atlas.json` |
| --- | --- |
| SHA-256 | `f307121cfef98615c7588b88240364b3c293742d51a131c9519136bbb6db047c` |
| Matches the merge's Task 7 copy | **yes** |
| Skills / connections | 1,918 / 5,708 |
| Lessons | 298 |
| Answers in the file | 308 |
| `datasetKey` / family | `robotics-atlas-merged` / `sss-robotics-foundations-2026-09` |

The old master (`8e170740…2dba51`) and the V3 export (`687f0916…6cefc11`) are unchanged.

## The shared answer record

| Record | Entries | SHA-256 |
| --- | ---: | --- |
| `sss-robotics-foundations-2026-09-2eb611994d87.json` | **311** | `23471d5c7c4a992e3018343534637e66b2026b548cb9d171b63360285778182f` |

It had 310 entries (`4cda601b…`) when the merge checked it. The one new entry is JC's own:
**`rob3:B-C01` marked Yes on 2026-11-05 at 19:08**, on the merged map. That is normal use, not a
problem. From here on, this queue checks the record against `23471d5c…`. Every entry names a skill in
the working map.

None of the 8 lesson targets or their source skills (`P08`, `P09`, `A09`, `D08`) has an answer,
in the file or the record.

## STOP — 29 required skills have no lesson, not 6

The queue expected six skills in the I05 chain without a lesson. **There are 29.** The I05 chain
(every skill I05 depends on, through prerequisites) has 327 skills, and 298 have lessons.

**The six expected (V3 entries):** `rob3:K05`, `rob3:K06`, `rob3:K07`, `m-invtrig`, `m-inverse`,
`p-work`.

**23 more are master-only skills**, with no planning id and no lesson. The merge pulled them into
the chain. Its report counted the chain's growth (298 → 326), but its "every entry keeps its card"
check looked only at V3 entries, so this was not reported as a gap.

| Group | Skills | How they got into the chain |
| --- | --- | --- |
| Frames and transforms (8) | `sss-rob-frame-labels`, `-rotation-columns`, `-rotation-check`, `-point-direction`, `-compose`, `-inverse`, `-joint-conventions`, `-serial-dof` | decision 10 made the master's `sss-rob-*` steps prerequisites of `K01`–`K07` |
| Planar arm (9) | `sss-rob-task-coordinates`, `-planar-reach`, `-planar-ik`, `-ik-verification`, `-planar-fk`, `-tool-offset`, `-position-jacobian`, `-joint-to-tip-rate`, `-planar-singularity` | the same, under `K04`–`K07` |
| Physics (3) | `p-charge`, `p-electricfield`, `p-potentialelectric` | the master's prerequisites of `e-voltage`, which took `B-E03`'s place (same-ability merge) |
| Maths (3) | `m-log`, `m-trigidentity`, `m-transdiff` | under `sss-rob-position-jacobian` and `m-inverse` |

Two facts limit what can be done about them in this queue:
- The lesson importer attaches lessons by planning id, and skips every skill without one.
- A lesson is checked against a specification entry (demonstration and assessment contract). These
  23 skills have none.

So covering them is more than writing lessons. This STOP is carried to Checkpoint A as item **C1**,
because nothing before Task 3 depends on it.

## `feedsMilestones` disagrees with the edges on 9 skills

The list on each V3 skill naming the milestones it leads to. The app does not read it (PLATFORM.md
§4.4: descriptive only), so nothing on screen is wrong. A milestone lists itself, which is the
existing convention, not a disagreement.

| Skill | Now | From the edges |
| --- | --- | --- |
| `rob3:K05`, `rob3:K06`, `rob3:K07`, `m-inverse`, `m-invtrig` | none | I02 I04 I05 |
| `p-work` | none | I01 I02 I03 I04 I05 |
| `m-rational-power`, `m-expfunction` | I03 I04 I05 | I02 I03 I04 I05 |
| `m-dot` | I02 I03 I04 I05 | I01 I02 I03 I04 I05 |

The 1,537 master-only skills have no such list. 23 of them reach a milestone (the 23 above).

## Check

The working map, both old maps and the answer record (`23471d5c…`) are unchanged by this task.
