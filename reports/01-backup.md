# 01 — Backup before verifying (Task 1)

Taken 2026-09-26 16:35:29, with no Electron or app process running (checked first).

**Backup folder:** `backups/pre-edition06-commit-20260926-163529/`. Git ignores it through the
`/backups/` rule added to `.gitignore` in commit `e3fbffb`, confirmed with `git check-ignore`.

Method: a Node script copied each source folder recursively, refusing to overwrite anything. It
then computed the SHA-256 of **every** source file and its copy, and compared the file counts.
Result: **0 mismatches, 0 missing files.**

## What was copied

| Source | Files | Copied | Bytes |
| --- | ---: | ---: | ---: |
| `Maps/` (repo; live export and personal maps) | 158 | 158 | 80,368,391 |
| `%APPDATA%\skill-solar-system\proficiency\` | 1 | 1 | 64,942 |
| `%APPDATA%\skill-solar-system\Local Storage\` | 10 | 10 | 10,448,356 |
| **Total** | **169** | **169** | **90,881,689** |

## Checksums of the files that matter

| File | Bytes | SHA-256 (original = copy) |
| --- | ---: | --- |
| `Maps/Robotics-v3/Robotics-v3-Lessons.json` (live export) | 2,762,626 | `687f0916ad0ba8b6332cdc5d1084960b134818d448eae97bdd212fe8d6cefc11` |
| `proficiency/sss-robotics-foundations-2026-09-2eb611994d87.json` | 64,942 | `4cda601bdc0373fca2de5d257651cd17acea84ad956bdc9496079198edfee6d0` |

The export's hash matches Task 0. There is only one proficiency file, for the original atlas's
family. As PLATFORM.md §5.3 says, there is no record for the robotics-v3 family. No answer
contents were read or copied into this report.

## Outcome

Every copy succeeded and every checksum matches. Task 1 complete.
