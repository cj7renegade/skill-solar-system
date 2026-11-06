# Robotics Completions - Learning Edition 07

This package adds exactly eight introductory lesson cards to the merged Robotics Atlas:

- the six V3 entries the merge left in the I05 chain without a lesson: `m-inverse`, `m-invtrig`,
  `p-work`, `K05`, `K06` and `K07`;
- the two skills JC approved at Checkpoint A: `P11` *Detect an inconsistent measurement innovation*
  (required) and `A12` *Distinguish coupling misalignment from backlash* (optional).

It changes no skill, connection, position, answer or existing lesson. After integration the atlas
holds 306 introductory cards; 76 assessable V3 entries are still pending, and one roadmap note is
not assessed. Every V3 entry in the I05 chain then has a card. The 23 master-only skills in the
chain have none yet. JC left them for step 7 (Checkpoint A, C1).

It is the first edition written in this repository rather than supplied (Checkpoint A, C5), and
the first whose lessons state `requires_physical_evidence` and `evidence_kind` (decision 14). All
eight say no real-hardware evidence is needed, because each full demonstration works from stated
values or generated data.

## Contents

- `Robotics-Completions-Lessons-07.json`: the authoritative eight-card content patch. Never use it as
  a replacement map.
- `Robotics-Completions-Learning-Edition-07.md`: the same lessons, readable.
- `Workbook.md`: the synthetic exercises, and what a real-world demonstration would add.
- `Study-Sequence.csv`: the eight targets in dependency order.
- `Content-Status-Ledger.csv`: all 383 planned entries after the patch.
- `completions_lab.py`, `check_package.py`, `requirements.txt`: the lab that recomputes every worked
  example and answer, and the package's self-checks. Standard-library Python only.
- `lessons-source.json`: the authored text; `authoring/completions/build-edition07.mjs` builds the
  lessons from it and the targets.
- `Validation-Results.json`, `lab-results/Lab-Results.json`: generated check evidence.
- `baseline/`: the structure map the lessons were written against, the reviewed specification, the
  approved new skills and the target extract. Comparison evidence, not replacement data.
- `INTEGRATION.md`: the integration handoff and preservation gates.

## Run

From this package directory:

```sh
python check_package.py
```

It also writes `lab-results/Lab-Results.json`. The lab can be run on its own with
`python completions_lab.py --output lab-results`.
