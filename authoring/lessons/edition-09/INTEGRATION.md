# Edition 09 integration handoff

## Target

The working Robotics Atlas after Edition 08: `baseline/Confirmed-Working-Map.json`, 1,955 skills and
329 lessons.

## How

```sh
node authoring/robotics-v3/apply-lessons.mjs --target <copy of the working map>            # dry run
node authoring/robotics-v3/apply-lessons.mjs --target <copy of the working map> --write    # apply
```

The importer applies Edition 09 after Editions 01-08 when the package is present. Its lessons are V3
entries, found by planning id and checked against V3's reviewed specification.

## Expected result

- 21 gained, 329 existing lessons unchanged, 0 skipped, 0 conflicts.
- 327 V3 lessons and 23 master-skill lessons (350 in all), 55 V3 entries pending, 1 roadmap note.
- I05 chain: 328 skills, every one with a card.
- Every evidence statement comes from the lesson itself.

## Preservation gates

These must be identical before and after: node order, connections, layout and levels, every answer,
the answer family, `datasetKey`, review order and a review session in progress. A second application
must change nothing. No existing lesson payload or card summary may change.
