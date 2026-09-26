# Physics Foundations Batch 01

Start with CLAUDE-INSTRUCTIONS.md. Supply this folder to Claude Code inside your project.

Includes 19 new candidate skills, 61 relationships, two paragraphs per skill, reflection criteria, concise placement reasons, source references, a coverage inventory, and a read-only validator. The authoring JSON is not directly loadable as an application map.

Validation passed against the uploaded 1,686-node / 4,882-edge master: prospective totals 1705 nodes and 4943 edges. Physics would increase from 181 to 200 nodes before any reconciliation. Validation also passed against a virtual master plus DC Batch 01: 1731 nodes and 5027 edges after both batches. These are conditional counts, not claims about your current desktop map.

Run before integration:

    python validate_batch.py PATH_TO_CURRENT_MASTER.json

Checks cover IDs, normalized names, references, new edge duplication, prerequisite cycles, two-paragraph descriptions, source IDs, unmarked initialization, and absence of fabricated coordinates. See the two validation reports for details. No app code was modified; Electron behavior, save/reopen, and the live proficiency store must be verified during integration. No personal map is included.

The author_batch.py script reproduces the authored JSON. Its layout requests require adaptation by the existing app's content tools.
