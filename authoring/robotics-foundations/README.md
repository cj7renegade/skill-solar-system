# Robotics Foundations Batch 01

Start with CLAUDE-INSTRUCTIONS.md. This is a Claude-ready authoring package, not a map for Open map.

17 candidate Robotics skills and 47 relationships, each with two descriptive paragraphs, a self-reflection criterion, source reference, and concise placement note. Existing Robotics nodes would increase from 27 to 44 if integrated unchanged into the supplied baseline. This is one scoped expansion, not all robotics.

Validation passed against the uploaded master: prospective totals 1703 nodes and 4929 edges. A simulated merge with all four prior batches also passed: 1769 nodes and 5142 edges. These totals precede current-map reconciliation and do not assert which batches Claude has installed.

Run against a pre-integration master:

    python validate_batch.py PATH_TO_MASTER.json
    python check_examples.py

Validation covers references, IDs, duplicate new edges, prerequisite cycles, two-paragraph structure, source references, and unmarked initialization. Numerical checks verify selected kinematic equations. The legacy level formula in validation reports is diagnostic only; use current layout rules when assigning new positions.

No app build or Electron integration was performed here. Those remain Claude’s integration responsibilities. No personal map, proficiency state, or external source PDF is included. The scripts and authoring JSON reproduce the batch; COVERAGE.md records addressed scope and outstanding work.
