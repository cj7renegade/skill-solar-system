# 08 — Archive the superseded maps (Task 3)

Run 2026-09-26/27 on branch `housekeeping-2026-09`. No map was opened in the app at any point:
every file was handled as a plain file (moved, hashed or read as text).

Reference backup for "before": `backups/pre-edition06-commit-20260926-163529/` (taken
2026-09-26 16:35). A fresh backup, `backups/pre-housekeeping-20260926-174130/`, was also taken in
Task 1.

## Items JC had already handled by hand

Per JC's instruction, each item's current state was checked before acting. Nothing already handled
was redone.

| Item | State found | Evidence |
| --- | --- | --- |
| `.e2e-baseline/`, `.e2e-c1/` | **deleted** (no copy anywhere in the project) | Task 2 |
| `tests/console-smoke.mjs` | **deleted** on disk; the deletion was committed with `git rm` in `a447cc0` | Task 2 |
| The 13 `Maps/*-with-prerequisites.json` extracts | **moved to `Maps/Archived maps/`** | table below, all hashes match the backup |
| `Maps/Skill-Solar-System-Math-Academy-Marked.json` | **moved to `Maps/Archived maps/`** | table below, hash matches the backup |
| `Maps/Robotics-v3/Preview-Notes.md`, `Content-Completion-Ledger.csv` | not yet handled | moved in this task |

### Conflict and JC's decision

JC's instruction was to gather old map copies into `Archive/2026-09-26-superseded-maps/`. TASKS.md
says not to touch the `Maps/` subfolders, including `Archived maps`, which is where the 14 files
now are. Asked directly, JC decided:

1. **Leave the 14 files in `Maps/Archived maps/`.**
2. The two duplicates go "with the originals". Since the originals stay, **they stay too**.

So nothing inside `Maps/Archived maps/` was moved or changed. The README in the new archive folder
records where they are and warns against opening them.

### `Maps/Archived maps/` as found (verified, untouched)

Each hash was compared with the file's copy in the pre-edition06 backup.

| File | Bytes | SHA-256 | vs backup |
| --- | ---: | --- | --- |
| `02-Physics-with-prerequisites.json` | 859,152 | `7a4f9930d38f7b0b8414971d065b4a1387610a94206aaa852de75e3f9979f5e7` | identical (moved by JC) |
| `03-Computing-with-prerequisites.json` | 654,309 | `a32fbe2b6d70b7df139d8a67b94f2c14c17fda9cc3ee25fa54a3d96d6699bbf2` | identical (moved by JC) |
| `04-Electronics-with-prerequisites.json` | 444,640 | `a8ddc02565178b044e65da257bbb72d2673c824d3751fce4af94ead7a55c2761` | identical (moved by JC) |
| `05-Materials-with-prerequisites.json` | 456,771 | `7b0f69fb2696b5e7711ffbd9e2406d5239b46fdb89572451ee0e1c1eeecc2924` | identical (moved by JC) |
| `06-Robotics-with-prerequisites.json` | 615,864 | `4fd5afb5747ab6bc54c21d8617496f119962d2d494c051604d7e033336e931fa` | identical (moved by JC) |
| `DC-Circuits-with-prerequisites.json` | 244,085 | `36b88088cdabe29257ea9376b9fc0b69830cb6bbd8244beff2c50eba2189182a` | identical (moved by JC) |
| `Material-Behavior-Batch-01-with-prerequisites.json` | 208,034 | `e0b5e9878c44ec70c14654c1de6d0cd018f189cc0523b8b4e2e8bd21fd7f7595` | identical (moved by JC) |
| `Mechanics-Statics-Batch-01-with-prerequisites.json` | 227,700 | `16a1454c06a74994c1af98c7362cc920222e881c9e295c4c905d0aebcadb0664` | identical (moved by JC) |
| `MF1-with-prerequisites.json` | 969,978 | `15def529b3d5866177bdd5fb290614504407395825b94d008ee884d3a285f4df` | identical (moved by JC) |
| `MF2-with-prerequisites.json` | 1,038,457 | `88cc6c94c8aa1c7ee9193b76f95797568cb6d2b880ba8b8038653deac2f5e571` | identical (moved by JC) |
| `MF3-with-prerequisites.json` | 1,012,149 | `c2691620e53fed321137d890eced0ab51d6d94a02c3f74a0213afc2b85135d6b` | identical (moved by JC) |
| `Physics-Foundations-Batch-01-with-prerequisites.json` | 229,636 | `736fb2eab709a8e44efaf4a5efff9a7c7cbb44eb4cd697d3735dc14114c8fb20` | identical (moved by JC) |
| `Robotics-Foundations-Batch-01-with-prerequisites.json` | 269,793 | `c0fee1cc3862e70225e6aa14a5f70f91e7757d32237d2c8bbf515335043a2dd9` | identical (moved by JC) |
| `Skill-Solar-System-Math-Academy-Marked.json` | 5,125,381 | `8397d3f950c661778116a10c396a0ecd41acbced6af15364969c9c0e6e5ac2a4` | identical (moved by JC) |
| `Robotics-Foundations-Batch-01-with-prerequisites - Copy.json` | 269,793 | `c0fee1cc…2dd9` | **new duplicate**, byte-identical to its original |
| `Skill-Solar-System-Math-Academy-Marked - Copy.json` | 5,125,381 | `8397d3f9…a2c4` | **new duplicate**, byte-identical to its original |
| `01-Complete-Atlas.json` | 881,399 | `caa85106…88d0` | already in this folder before; unchanged |
| `02-Mathematics-with-prerequisites.json` | 351,675 | `9f802fbb…962e` | already in this folder before; unchanged |
| `My_Current_Skill_Atlas.json` | 879,598 | `14949a0e…d498` | already in this folder before; unchanged |

## Other changes since the backup that the queue did not ask for (report only)

- **`Maps/`**: apart from the moves above, the only changed file is
  `Maps/Robotics-v3/Integration-Summary.json`. The previous queue's Task 2 rewrote it with
  `apply-lessons.mjs --write`; only its date and source revision changed (`reports/02-edition06-verification.md` §3).
- **The two `- Copy` duplicates** in `Maps/Archived maps/` (above). They are extra copies of files
  that are already stale.
- **`Archive/`**: **no file** was created or modified after the backup time (16:35), apart from what
  this task added. Several older, **different** versions of the extracts already existed there,
  and they are not the files JC moved. Examples: `Archive/Maps/Archived maps/`,
  `Archive/Robotics-Foundations-Atlas/Focused-maps/`, `Archive/Skill-Atlas-MF-Expansion/Focused-maps/`
  and `Archive/Skill-Solar-System-v0.4.0-Spiral-and-Physics/Maps/`. They were left alone.
- **`.git/info/exclude`** (local-only, not in the repository) still lists `/.e2e-baseline/` and
  `/.e2e-c1/`. It is harmless and was left alone.

## What this task moved

`Archive/2026-09-26-superseded-maps/` was created. Git ignores it through `/Archive/`.

| File | From | Bytes | SHA-256 before = after |
| --- | --- | ---: | --- |
| `Preview-Notes.md` | `Maps/Robotics-v3/` | 11,706 | `d5067f0cf5c36f57c4e45716afa9e50020cd6a0b962ca4d92e57b1731be1209a` |
| `Content-Completion-Ledger.csv` | `Maps/Robotics-v3/` | 104,980 | `f317e86160503d667c6839933e845d1e007a154508e3f92b86208653a44c9a39` |

Both hashes also equal the copies in the pre-edition06 backup.

`README.md` was added to the folder in plain language. It warns in bold that opening any of the
old map copies in the app can copy stale answers into the shared record. It also says where the 14
copies and 2 duplicates are, and that 12 of the 14 hold stale answers.

## Nothing else changed

All 160 files in `Maps/` were hashed before the move and again after. The **158 that stayed are
byte-identical**, including:

- `Maps/Skill-Solar-System.json` (`04821f06c33a…`);
- the Robotics-v3 set: `Robotics-v3-Lessons.json` (`687f0916…`), `Robotics-v3-Preview.json`,
  `Content-Import-Ledger.csv` and `Integration-Summary.json`;
- every file in `Archived maps`, `Backups`, `Checkpoint-2026-09-13`, `description-rewrite`, `Notes`
  and `Old-root-copies`.

## Tests

| Run | Tests | Pass | Skip | Fail |
| --- | ---: | ---: | ---: | ---: |
| `npm test` | 207 | 201 | 6 | 0 |
| `SSS_ATLAS=Maps/Skill-Solar-System.json npm test` | 207 | **207** | 0 | 0 |

With `SSS_ATLAS` set, the six "real atlas" tests ran and passed without the batch sub-maps at their
old top-level `Maps/` location, so no test needs a moved file.

## Outcome

Task 3 complete, with JC's decision to leave the hand-moved copies in `Maps/Archived maps/`.
