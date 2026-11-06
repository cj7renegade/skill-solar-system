# Edition 08 integration handoff

## Target

The working Robotics Atlas: `baseline/Confirmed-Working-Map.json`, 1,955 skills and 306 lessons. The
edition is not applied to the old V3 export, which does not hold the master skills.

## How

```sh
node authoring/robotics-v3/apply-lessons.mjs --target <copy of the working map>            # dry run
node authoring/robotics-v3/apply-lessons.mjs --target <copy of the working map> --write    # apply
```

The importer applies Edition 08 when the package and the approved
`scope/lessons/master-specifications.json` are both present. It finds each lesson's skill by the
skill's own id, through the entry's `runtime_identity.master_skill`, and checks the name,
`requires`, contract fingerprint and `proficiency_write` as for any lesson.

## Expected result

- 23 gained, 306 existing lessons unchanged, 0 skipped, 0 conflicts.
- 306 V3 lessons, 23 master-skill lessons (329 in all), 76 V3 entries pending, 1 roadmap note.
- I05 chain: 328 skills, every one with a card.
- Every evidence statement comes from the lesson itself.

## Preservation gates

These must be identical before and after: node order, connections, layout and levels, every answer,
the answer family, `datasetKey`, review order and a review session in progress. A second application
must change nothing. No existing lesson payload or card summary may change. The 23 skills gain lesson
fields and a content status, keep their own text in `atlasDetails` and `atlasPlacementNote`, and gain
no planning id.
