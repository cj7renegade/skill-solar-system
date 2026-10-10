# Merge 00 — Starting state and answer check (Task 1)

Measured 2026-10-10 on branch `v3-merge`. Read-only: no map, answer record or app file was changed.

## Backup — not yet taken

The queue asks JC to run `Backup-User-Data.cmd` before Task 1. When this task ran, the app was open
on JC's real profile (`electron.exe`, PID 37340), and the backup script refuses to run while the app
is open, because a copy taken then could be half-written. Claude Code did not close the app, since
it might hold unsaved work. **Tasks 1 and 2 only read files**, so nothing is at risk yet. The
backup must be taken before Task 3, which is the first task that builds anything. The newest backup
on disk is `2026-09-27_142456`.

## The two maps

| | Master atlas | Robotics V3 export |
| --- | --- | --- |
| File | `Maps/Skill-Solar-System.json` | `Maps/Robotics-v3/Robotics-v3-Lessons.json` |
| SHA-256 | `8e170740169f857458109f50a46b1d7feabb98e4add850350261fce8c22dba51` | `687f0916ad0ba8b6332cdc5d1084960b134818d448eae97bdd212fe8d6cefc11` |
| Size | 5,397,564 bytes | 2,762,626 bytes |
| Last changed | 2026-09-14 | 2026-09-26 |
| Skills / connections | 1,769 / 5,142 | 381 / 894 |
| Family | none declared; `datasetId` `sss-robotics-foundations-2026-09` | `robotics-foundations-integration-v3-review` |
| Answers in the file | 309 (305 Yes, 4 No) | 0 |

**The master is the current one.** It is byte-identical to
`Maps/Checkpoint-2026-09-13/Skill-Solar-System-Current-Master.json` (same SHA-256), and every skill in
the shared answer record is in it.

## Shared answer records

| Record | Family | Entries | SHA-256 |
| --- | --- | --- | --- |
| `sss-robotics-foundations-2026-09-2eb611994d87.json` (saved 2026-09-20) | `sss-robotics-foundations-2026-09` | 310 | `4cda601bdc0373fca2de5d257651cd17acea84ad956bdc9496079198edfee6d0` |

No record exists for the V3 family.

## Answer check — one difference (STOP item for JC)

| Skill | Master file | Shared record | V3 file |
| --- | --- | --- | --- |
| `c-variables` (Variables and assignment) | **Yes** | **Clear** (a deliberate "not marked") | not answered |

- The record was saved on 2026-09-20, after the map file was last changed (2026-09-14). When the
  app opens the map, the record wins, so **JC sees this skill as Not marked today**.
- The queue never picks an answer automatically. JC decides which one the merged map carries:
  - **Keep the record (Not marked).** Recommended: it is the newer choice and it is what the app shows now.
  - **Restore Yes.**
- `m-logic` is No in both the file and the record, so the old conflict is resolved, as expected.
- Every other answer matches: the 309 answers in the file and the 310 record entries agree apart from
  `c-variables`. The record's extra entry is that Clear.

## The 204 shared skills

- **Names:** one difference. `m-order` is "Order of operations" in the master and "Order of
  operations for basic arithmetic" in V3.
- **Descriptions:** all 204 differ, but only because every V3 description is a copy of the skill's
  name. The master descriptions are full sentences, and V3's teaching text is in its lesson fields.
- **Prerequisites:** 13 skills differ. 4 of the differences disappear once the crosswalk rules
  `B-E02` = `e-current` and `B-E03` = `e-voltage` (see `01-crosswalk.md`). The other 9 are listed there.
- 21 of the 204 have an answer in the master. These answers carry over unchanged, because the ids
  don't change.

## Other facts for later tasks

- V3's 177 new entries: 95 Robotics, 26 Electronics, 20 Mechanics, 17 Computing, 11 Mathematics, 8 Physics.
- 298 V3 entries have an authored lesson. 150 of these are shared-id skills, so their lessons will
  land on the existing master skill.
- The master has 27 broad `r-*` overviews, and none of them holds an answer.

**Check:** both maps' SHA-256 were the same at the start and end of this task.
