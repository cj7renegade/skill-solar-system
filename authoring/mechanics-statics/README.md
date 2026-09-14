# Mechanics Statics Batch 01

Give Claude Code this folder and ask it to follow CLAUDE-INSTRUCTIONS.md inside the current project. The JSON is an authoring batch, not an Open map file.

Contents: 11 candidate Mechanics skills, 36 relationships, two paragraphs per skill, self-reflection criteria, concise placement notes, source references, and validation tools/reports. New proficiency values are null; no personal map is included.

The uploaded master contains 1,686 nodes and 4,882 edges. This batch alone would yield 1697 nodes and 4918 edges, increasing the Mechanics domain from 74 to 85 nodes. A virtual combination with both prior batches also passed: 1742 nodes and 5063 edges. These conditional counts precede reconciliation with the current local atlas.

Run the read-only validator against a pre-integration map:

    python validate_batch.py PATH_TO_MASTER.json

The script checks IDs, normalized names, endpoints, duplicate new edges, prerequisite cycles, paragraph structure, source references, and unmarked initialization. It deliberately rejects already-integrated IDs. The legacy level calculation in its report is diagnostic, not a layout instruction.

No Electron build, live map import/export, or shared proficiency behavior was tested here. Those checks belong to integration. Existing positions, camera behavior, personal marks, and earlier content must be preserved. Broad overview overlap remains intentionally present; node totals do not equal independent competency totals.
