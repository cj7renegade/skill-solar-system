# Implement DC Circuits Batch 01

Read project instructions and inspect current code and local master before editing. Preserve ongoing work and the user-approved camera behavior. Use a feature branch such as `content/dc-circuits-batch-01`. This is a content integration task, not a viewer redesign.

## Inputs and boundary

Read `dc-circuits-batch-01.json`, `COVERAGE.md`, and `validation-report.json` in this package. The JSON is an AUTHORING BATCH, not a saved map: do not open it in the viewer or overwrite the master with it. It contains 26 proposed skill records and 84 connections, with 19 public source references. No personal map or proficiency record is included.

The inspected baseline had 1,686 nodes and 4,882 edges. Against that baseline a fully applied batch yields 1,712 nodes and 4,966 edges. The real current local master is authoritative; changed baseline counts alone are not an error. Locate the actual working master from project instructions/application workflow, not by guessing the newest filename.

## Integration procedure

1. Back up the current local master before changes. Record its hash and preserve IDs, answers, pins, coordinates, and shared-proficiency family identity. Never commit this backup or personal map.
2. Inspect each proposed ID and normalized name against the current master. If already present with equivalent scope, reuse it; if a name match has different scope, flag it instead of overwriting. Check descriptions for semantic duplicates even when names differ. Treat pre-existing batch IDs as a rerun requiring reconciliation. Make the actual integrator idempotent: applying twice must not duplicate nodes or edges or reset answers.
3. Resolve all external references from `validation-report.json` against current IDs and scope. If a referenced skill was renamed but kept its ID, retain it. If an ID was removed or split, report the mismatch and map to the correct scope explicitly; do not invent a missing placeholder just to pass validation.
4. Convert candidate records to the current node schema. Use `details` as the two-paragraph body, `description` as the summary, and `placementNote` as the concise relationship explanation. Retain `proficiencyReference` in supported metadata or the editor's existing comparable field; no mandatory quiz or evidence workflow. Do not copy the authoring-only `layoutRequest` object into runtime behavior. Keep source definitions under a versioned content-expansion metadata namespace so they resolve without replacing existing source registries.
5. Create new abilities unmarked. Honor any existing local shared answer for the exact stable skill identity on a rerun. Do not propagate answers from original overview nodes to narrower skills. Do not reset review sessions or alter registry family identity.
6. Preserve the original overview nodes unchanged. The `overviewMappings` list documents intentional transitional overlap; its related edges are real scope associations, not prerequisites. Do not convert parents into unsupported node types or delete their old links. Any later overview-versus-skill UI treatment is a separate task. Count the additions as nodes, not 26 guaranteed nonoverlapping additions to a mastery score.
7. Add edges with their stated types and rationales. Direction is prerequisite/support source → target; related is undirected for duplicate detection. Existing KCL/KVL nodes are reused as supporting checks; there are no duplicate new KCL/KVL nodes. Preserve all original edges. Do not automatically reroute old dependencies through new child nodes in this batch.
8. Assign provisional levels and deterministic new positions using the current layout conventions AFTER reconciliation. Preserve all existing positions, levels, and pins. Recorded prerequisite depth is a starting point, not verified difficulty. The baseline gives new depths 0–18 (levels 1–55 under the legacy 1+3×depth formula); these are diagnostics, not a mandatory range or final layout.
9. Choose new heights consistent with their reviewed prerequisites and existing saved layout, avoiding new overlapping centers. If a reused predecessor's manually assigned height conflicts with depth-derived height, resolve placement for NEW nodes and report the discrepancy; do not silently move the whole atlas or rescale it to 100. Keep the original view full precision. Proximity to an overview must not override prerequisite order. Report anything requiring broader layout revision.
10. Save the updated master through a validated atomic write to the intended local output, preserving its identity. Also generate `DC-Circuits-with-prerequisites.json` from that updated master: seed with the 26 abilities actually added/reused and include all recursively required prerequisite ancestors. Include the source definitions needed by that sub-map and preserve the same atlas-family identity. Copy only edges whose endpoints are included; never invent altered edges. Optional overview neighbors may be included if clearly reported and their own prerequisite closure is also retained.
11. With exactly the supplied seed set, the baseline prerequisite closure contains 60 nodes. This count may change legitimately with current local edits. Do not use the sub-map to replace the master.

## Verification

`python validate_batch.py "PATH/TO/CURRENT-MASTER.json"` performs read-only pre-integration checks using Python's standard library. It deliberately refuses an already-applied batch; it is not an importer or a post-import runtime test. The supplied report is from the inspected baseline, not the user's current installation.

Implement or use current project checks to verify:
- Actual map schema, valid IDs/endpoints, no duplicate/reverse-related edges, and no prerequisite cycles in the merged graph.
- All intended coverage entries are mapped to added or reused skills.
- Every original node and edge is semantically unchanged, including full-precision positions and proficiency; top-level metadata additions are limited to this expansion.
- Fresh new nodes are unmarked, reruns preserve existing answers, and repeated application produces no additional change.
- Generated sub-map is a consistent subset with complete prerequisite ancestry and shared proficiency identity.
- Math source imports and other existing proficiency remain unaffected.
- File size remains within the actual application's import/save limits.

Run existing unit tests and build. In Electron inspect the new DC branch, cards, placement, subject highlighting, search, and guided review on the full master. Mark a disposable test skill and verify sharing with the generated sub-map using an isolated test profile, not the user's real proficiency store. Verify import/export and restart behavior where relevant. Report anything you cannot run.

Sanity examples for reviewing the authored content:
- 1 kΩ and 2 kΩ in series across 9 V: 3 mA; drops 3 V and 6 V.
- Divider upper 2 kΩ, lower 1 kΩ, input 9 V: unloaded 3 V. Add 1 kΩ across the lower leg: effective lower 500 Ω, output 1.8 V.
- A 1 kΩ resistor with 5 V across it dissipates 0.025 W. Part suitability still depends on the stated derated limit and required margin.

## Delivery and repository hygiene

Commit only suitable nonpersonal authoring data, integration utilities, tests, and documentation. Exclude local master maps, sub-maps carrying user answers, shared proficiency records, backups, and review-session data. This package's publication does not settle the repository's overall license; preserve current project licensing and source attribution.

Open a pull request for the shareable changes after verification; do not merge it. Report branch/PR links, actual before/after counts, reuse/conflict decisions, tests, unverified behavior, and exact local master/sub-map output paths. State whether a rebuild is needed; a data-only change should not require one.
