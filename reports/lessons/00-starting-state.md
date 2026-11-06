# Lessons 00 — Starting state (Task 1)

Measured 2026-11-05 on branch `lessons-core`. Read-only: no map, answer record or app file was changed.

## Backup — not yet taken for this queue

The newest backup, `2026-11-05_195851`, was taken before the splits replaced the working map, so it
does not hold the current map. The app is closed. A fresh backup will be taken before Task 3, the
first task that builds anything. The current map's predecessor is also kept in
`Maps/Backups/2026-11-05-before-splits/`.

## The working map and the answer record

| | |
| --- | --- |
| `Maps/Robotics-Atlas.json` | SHA-256 `7c4186556c58fe6549aed80aac5caedb1630d5371118768f4b0800598375892a`, the splits map from step 6 (**confirmed**) |
| Skills / connections / lessons / answers in the file | 1,955 / 5,783 / 306 / 308 |
| Answer record | 311 entries, SHA-256 `23471d5c…edfee6d0`, unchanged |
| Old master / V3 export | `8e170740…` / `687f0916…`, unchanged |

## The three groups (re-measured, matching the queue)

The core is every robotics skill outside the extension pathways (Q3), plus everything they need
through prerequisites: **351 skills, 306 with a lesson, 45 without.**

| Group | Skills | Answers | Notes |
| --- | ---: | ---: | --- |
| **A. I05 path, master-only** | 23 | none | 17 `sss-rob-*` (levels 1–52), `p-charge`, `p-electricfield`, `p-potentialelectric`, `m-log`, `m-trigidentity`, `m-transdiff` |
| **B. Core, off the I05 path, V3** | 21 | none | levels 19–70; every one has a V3 specification entry |
| `r-singular` | 1 | none | the orientation overview (Q6) |

No STOP: the counts match the queue and none of the 45 has an answer, in the file or the record.

**Existing text of Group A:** the 17 `sss-rob-*` skills already carry an "I can…" statement
(`proficiencyReference`), a scope note and details with the rule and its limits. The six physics and
mathematics skills have details only. **Every prerequisite of a Group A skill outside the group
already has a lesson**, so Edition 08 can be read in order from what exists.

## Check

The working map, both old maps and the answer record are unchanged by this task.
