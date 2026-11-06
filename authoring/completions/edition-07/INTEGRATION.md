# Edition 07 integration handoff

## Target

The merged Robotics Atlas **after** the completions structure step (Task 3):
`baseline/Confirmed-Structure-Map.json`, 1,920 skills, with `rob3:P11` and `rob3:A12` present and
pending. The edition is not applied to the old Robotics V3 export, which has neither new skill and
is no longer the working map.

## How

```sh
node authoring/robotics-v3/apply-lessons.mjs --target <structure map>            # dry run
node authoring/robotics-v3/apply-lessons.mjs --target <structure map> --write    # apply
```

The importer finds each lesson's skill by planning id and checks it against the reviewed
specification, or against the approved new-skill records (`scope/completions/new-skills.json`) for
P11 and A12.

## Expected result

- 8 imported, 298 existing lessons unchanged, 0 skipped, 0 conflicts.
- 306 authored, 76 pending, 1 roadmap, 383 planned entries, 1,920 skills.
- I05 chain over planned entries: 305 entries, every one with a card.
- Every lesson's evidence statement comes from the lesson itself (none from the overrides table).

## Preservation gates

These must be identical before and after: node order, connections, layout and levels, every answer,
the answer family, `datasetKey`, review order and a review session in progress. A second application
must change nothing. No existing lesson payload may change.

## Not covered

The lessons are introductory cards, not a course. They write no answer, demonstrate no physical robot
and do not cover the 23 master-only skills in the I05 chain (step 7).
