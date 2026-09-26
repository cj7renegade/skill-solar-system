# Material Behavior Batch 01

Supply this folder to Claude Code and follow CLAUDE-INSTRUCTIONS.md. The JSON is an authoring batch, not a directly loadable map.

10 candidate skills, 32 relationships, two paragraphs per skill, individual reflection criteria, concise placement notes, and source references. New answers are null. No personal map is included.

Validation passed against the uploaded 1,686-node / 4,882-edge master: 1696 nodes and 4914 edges if only this batch is added. It also passed against a virtual combination with the previous DC, Physics, and Mechanics Statics batches: 1752 nodes and 5095 edges after all four. These are conditional totals before semantic reconciliation with the live local atlas.

Run against a PRE-INTEGRATION master:

    python validate_batch.py PATH_TO_MASTER.json

The validator checks IDs, normalized names, endpoint resolution, new edge duplication, prerequisite cycles, description paragraph structure, source references, and unmarked initialization. Already-integrated IDs deliberately fail so they are reconciled rather than duplicated. Legacy level calculations in reports are diagnostics only.

Application build, Electron rendering, import/export, and live proficiency synchronization remain unverified here. Claude must verify them during integration. Existing positions, camera behavior, personal answers, and previous content remain unchanged. Skill boundaries and graph links are editorial and have not received independent expert curriculum review.
