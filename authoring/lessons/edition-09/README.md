# Core Lessons - Learning Edition 09

This package adds exactly 21 introductory lesson cards to the working Robotics Atlas: one for each V3
entry on the core robotics paths, outside the I05 path, that had none. They are `C06`-`C09`, `N09`,
`P07`, `A11`, `e-imu`, `e-adc`, `e-calibration`, `e-sampling`, `p-wave`, `m-laplace`, the
integral-calculus thread (`m-defintegral`, `m-antiderivative`, `m-ftc`, `m-improper`),
`m-complex`, `m-random`, `m-sampling` and `m-regression`. With them and Edition 08, **every core skill
has a card** except the orientation overview `r-singular` (Q6).

It changes no skill, connection, position, answer or existing lesson. After integration the atlas
holds 350 introductory cards. The lessons are checked against V3's reviewed specification, like
Editions 01-07. Every lesson states `requires_physical_evidence`; all 21 say no, because each
demonstration works from stated values, data or a model. The five runnable-code entries (`C06`-`C09`,
`N09`) are taught through small simulations, which the lab runs.

## Contents

- `Core-Lessons-09.json`: the authoritative 21-card content patch. Never use it as a replacement map.
- `Core-Learning-Edition-09.md`: the same lessons, readable.
- `Workbook.md`: the synthetic exercises and simulations.
- `Study-Sequence.csv`, `Content-Status-Ledger.csv`: the 21 targets in dependency order, and their status.
- `core2_lab.py`, `check_package.py`, `requirements.txt`: the lab and the self-checks. Standard-library
  Python only.
- `lessons-source.json`: the authored text; `authoring/lessons/build-edition09.mjs` builds the lessons.
- `Validation-Results.json`, `lab-results/Lab-Results.json`: generated check evidence.
- `baseline/`: the working map, V3's reviewed specification and the targets. Comparison evidence only.
- `INTEGRATION.md`: the integration handoff and gates.

## Run

```sh
python check_package.py
```
