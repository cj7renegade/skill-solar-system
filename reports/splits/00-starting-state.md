# Splits 00 — Starting state (Task 1)

Measured 2026-11-05 on branch `foundation-splits`. Read-only, apart from the backup.

## Backup

`%OneDrive%\HelixSkill Backups\2026-11-05_195851` (214 files, 107.0 MB, every file verified). The app
was closed, so Claude Code ran the backup script. This is the first backup that holds the
completions map as the working map.

## The working map and the answer record

| | |
| --- | --- |
| `Maps/Robotics-Atlas.json` | SHA-256 `ba823b0db109eedb3e0620d6d68587b9dbc9e7cebe76b997a8e532afa4719f8c`, the completions map from step 5 (**confirmed**) |
| Skills / connections / lessons / answers in the file | 1,920 / 5,714 / 306 / 308 |
| `datasetKey` / family | `robotics-atlas-merged` / `sss-robotics-foundations-2026-09` |
| Answer record | `sss-robotics-foundations-2026-09-2eb611994d87.json`, 311 entries, SHA-256 `23471d5c…edfee6d0`, unchanged since 19:08 |
| Old master / V3 export | `8e170740…` / `687f0916…`, unchanged |

## The 36 candidates

Every source skill exists. **None has an answer**, in the file or in the record, so the STOP does
not trigger.

| | Source skills | With a V3 lesson | In the I05 chain |
| --- | ---: | ---: | ---: |
| Physics (8 candidates) | 11 | 0 | 0 |
| Electronics (12) | 15 | 3 (`e-decoupling`, `rob3:B-E08`, `rob3:E10`) | 3 |
| Mechanics (10) | 18 | 2 (`rob3:D10`, `rob3:D03`) | 2 |
| Computing (6) | 7 | 3 (`c-functions`, `c-testing`, `c-floats`) | 3 |

Shared sources (`e-mosfet` twice, `c-evaluation` twice) are counted once per candidate. The skills
with lessons are exactly the skills in the I05 chain. Levels range from 16 (`c-functions`) to 61
(`rob3:E10`).

## Check

The working map, both old maps and the answer record are unchanged by this task.
