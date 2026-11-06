# Core Lessons - Learning Edition 08

This package adds exactly 23 introductory lesson cards to the working Robotics Atlas: one for each
master-only skill on the I05 path that had none. That is 17 `sss-rob-*` frame and planar-arm steps,
`p-charge`, `p-electricfield`, `p-potentialelectric`, `m-log`, `m-trigidentity` and
`m-transdiff`. With them, **every skill the I05 milestone depends on has a card** (328 of 328).

It changes no skill, connection, position, answer or existing lesson. Each skill keeps its own text
under `atlasDetails` and `atlasPlacementNote` and gains no planning id. After integration the atlas
holds 329 introductory cards.

These are master skills, so their lessons are checked against specification entries JC approved at
step 7's Checkpoint A (`baseline/Master-Specifications.json`), matched by each skill's own id. Every
lesson states `requires_physical_evidence`; all 23 say no, because each demonstration works from
stated values. The eight planar-arm steps under Edition 07's `K05`-`K07` teach only their own step,
with a 0.5 m / 0.25 m arm rather than K05-K07's 0.4 m / 0.3 m (E5).

## Contents

- `Core-Lessons-08.json`: the authoritative 23-card content patch. Never use it as a replacement map.
- `Core-Learning-Edition-08.md`: the same lessons, readable.
- `Workbook.md`: the synthetic exercises.
- `Study-Sequence.csv`: the 23 targets in dependency order.
- `Content-Status-Ledger.csv`: the 23 targets and their status.
- `core_lab.py`, `check_package.py`, `requirements.txt`: the lab that recomputes every number, and
  the self-checks. Standard-library Python only.
- `lessons-source.json`: the authored text; `authoring/lessons/build-edition08.mjs` builds the lessons
  from it, the approved specifications and the map.
- `Validation-Results.json`, `lab-results/Lab-Results.json`: generated check evidence.
- `baseline/`: the working map the lessons were written against, V3's reviewed specification, the
  approved master-skill specifications and the targets. Comparison evidence only.
- `INTEGRATION.md`: the integration handoff and gates.

## Run

```sh
python check_package.py
```
