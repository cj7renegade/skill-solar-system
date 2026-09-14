# Coverage inventory handoff — after the current task finishes

This packet is planning data, not an importable map and not authorization to generate all branches at once.

1. Finish and preserve the currently active content integration. Then inspect current project instructions and the latest local master.
2. Reconcile coverage-inventory.json with that master: check anchor IDs, renamed or merged nodes, and which delivered batch IDs actually exist. Do not overwrite local changes with the historical baseline. Record actual node/edge counts and integration status.
3. Use baseline-node-index.json only as an ID/name reference. It contains no positions, proficiency answers, or complete node records and cannot replace a map.
4. Prepare a branch review for Robotics frames, transforms, configuration, and basic kinematics. For every proposed outcome, read existing descriptions and record reuse, split candidate, genuinely missing candidate, or deferred. Preserve stable IDs. Do not invent a second copy of an existing mathematical operation.
5. Return the reconciliation and proposed skill boundaries for the next content-authoring package. Do not modify proficiency, positions, approved camera behavior, or existing node descriptions as part of this planning pass.
6. Keep personal maps and answer/session stores out of the public repository. Public-safe roadmap changes can be placed on a documentation branch if needed; no application code change is required for this inventory.

For later content batches, require an explicit coverage report: addressed outcomes, reused skills, new skills, outstanding gaps, source evidence, and verification results. Never treat a ten-skill packet as a completed subject merely because the packet is finished.
