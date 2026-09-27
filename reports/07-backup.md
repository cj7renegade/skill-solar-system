# 07 — Fresh backup before housekeeping (Task 1)

Taken 2026-09-26 17:41:30 on branch `housekeeping-2026-09`, with no Electron or Skill Solar System
process running (checked first: 0 found).

**Backup folder:** `backups/pre-housekeeping-20260926-174130/`, ignored by Git through `/backups/`.

**Method:** the same as the previous queue's Task 1 (`reports/01-backup.md`). Each source folder was
copied recursively, refusing to overwrite anything. Then the SHA-256 of **every** source file was
compared with its copy, and the file counts compared. Result: **0 mismatches, 0 missing files.**

## What was copied

| Source | Files | Copied | Bytes |
| --- | ---: | ---: | ---: |
| `Maps/` | 160 | 160 | 85,763,565 |
| `%APPDATA%\skill-solar-system\proficiency\` | 1 | 1 | 64,942 |
| `%APPDATA%\skill-solar-system\Local Storage\` | 10 | 10 | 10,448,356 |
| **Total** | **171** | **171** | **96,276,863** (96.3 MB) |

## The two key checksums (original = copy)

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `Maps/Robotics-v3/Robotics-v3-Lessons.json` | 2,762,626 | `687f0916ad0ba8b6332cdc5d1084960b134818d448eae97bdd212fe8d6cefc11` |
| `proficiency/sss-robotics-foundations-2026-09-2eb611994d87.json` | 64,942 | `4cda601bdc0373fca2de5d257651cd17acea84ad956bdc9496079198edfee6d0` |

Both are unchanged from the previous backup (`backups/pre-edition06-commit-20260926-163529/`). No
answer contents were read.

## Noted for Tasks 2–3

`Maps/` has changed since the previous backup: **158 → 160 files, 80,368,391 → 85,763,565 bytes**.
This fits JC's statement that some housekeeping was done by hand. The exact differences are
identified in `reports/08-archive.md`.

## Outcome

Every copy succeeded and every checksum matches. Task 1 complete.
