# Integrate Mechanics Statics Batch 01

Inspect the current project instructions, content schema, map identity, and worktree first. Use a feature branch such as content/mechanics-statics-batch-01. The current local master is authoritative; the supplied validation reports describe an earlier uploaded master, not live app state.

1. Read mechanics-statics-batch-01.json and COVERAGE.md. This is an authoring batch, NOT a file for Open map. It contains 11 candidate skills and 36 relationships. Compare every candidate against the current local atlas by stable ID, name, and meaning. Reuse an equivalent existing skill rather than adding a duplicate; report every mapping or conflict. Do not force counts to match if the atlas has changed.
2. Preserve all existing node IDs, descriptions, connections, positions, pins, proficiency answers, and atlas-family identity. Preserve the approved camera/orbit behavior, highlighting, coordinate precision, and any previously integrated DC and Physics batches. Do not reapply DC or Physics as part of this task. Keep personal maps and review data outside the public repository.
3. Integrate new content with the existing authoring/import mechanisms. Retain the original two-paragraph descriptions, self-reflection references, source references, and concise placement notes. Adapt field names to the actual schema; strip authoring-only layoutRequest fields from runtime exports. Use the existing supported gear icon or equivalent Mechanics icon. Keep source metadata in an authoring sidecar if runtime nodes do not support it.
4. Use the manifest relationships and rationales after reconciliation. Prerequisite direction is source to target. Supports and related links must not increase prerequisite depth. Existing broad overview nodes remain unchanged for this batch; their overlap with narrower skills is deliberate and does not justify copying proficiency. Do not infer Yes from parent, child, or neighboring skills.
5. New skills start proficiency80=null. Existing shared answers for genuinely matching stable IDs remain authoritative. Ensure Yes, No, and unmarked retain their meanings through master/sub-map loading, export, and reopen. Do not erase the user's mathematics markings.
6. Assign only new skills' coordinates and reference levels using the current layout convention and precision. Validate prerequisite ranks after merging, but do not reposition existing nodes or normalize all old levels. Report any ordering conflict with saved old heights rather than silently changing them. Height remains an editorial dependency reference, not measured difficulty. Make integration idempotent: a second run must add no duplicate nodes or edges.
7. Generate a separate Mechanics-Statics-Batch-01-with-prerequisites.json from the new skills plus their full transitive prerequisite closure, using identical node IDs and family identity. Do not replace a broader Mechanics map with this small batch map. Retain edges only when both endpoints exist in the sub-map. If additional supporting skills are included, include their prerequisite closure too and explain the scope.
8. Run validate_batch.py against a PRE-INTEGRATION copy of the current master. It is read-only and intentionally rejects already-integrated IDs. Add meaningful integration checks for duplicate prevention, unresolved references, prerequisite cycles, preservation of old fields, unmarked initialization, and master/sub-map identity. The validator's legacy level calculation is diagnostic only, not an instruction to change current layout code.
9. Run existing app tests and build. Inspect the master and batch sub-map in Electron: descriptions, positions, visible links, subject highlighting, guided review, Save/reopen, and shared proficiency. Report checks that cannot be performed. Do not claim the packaged authoring checks verify the live application.
10. Open a pull request for public-safe content/tooling changes after verification. Finish with actual counts, reuse/conflict decisions, test results, branch/PR links, and exact instructions for loading the generated personal map. Do not commit the user's personal atlas or proficiency data.

## Specific content boundaries

Mechanics remains the existing domain label. Do not introduce a seventh domain or reclassify material-science nodes in this batch. Signed torque, general equilibrium, system isolation, interaction pairs, and full beam diagrams are existing skills to reuse. New nodes make narrower abilities independently markable; broad overview overlap is deliberately retained during migration. Do not use parent proficiency to mark a narrower skill Yes.

The batch has no mandatory dependency on the previous two batches. If the latest local Physics batch offers an equivalent narrower prerequisite, review the meaning and document the mapping; do not add redundant prerequisites automatically. Related/support links do not set level. The current saved positions and app schema remain authoritative.

## Numerical and conceptual spot checks

- Pin at x=0 and vertical roller at x=4 m, downward 100 N at x=1 m: right reaction 25 N up, left reaction 75 N up, horizontal reaction zero.
- A cantilever extending 2 m right from its fixed end with a downward 100 N tip force needs 100 N upward support force and a +200 N·m counterclockwise support moment. Adding a clockwise 30 N·m applied couple changes the required support moment to +230 N·m.
- Relocate a downward 100 N force from (2,0) m to the origin: retain the downward force and add a -200 N·m clockwise couple.
- Two equal opposite 50 N forces separated by 0.2 m have a 10 N·m couple magnitude; sign depends on their arrangement.
- Three vertical roller reactions do not restrain horizontal translation. Three reaction unknowns are not by themselves proof of geometric stability.
- A pin-ended link carrying significant transverse weight is not a two-force member merely because its ends are pinned.
- Changing the side retained at a beam cut reverses the physical interaction vectors. Compare the defined section sign conventions before comparing reported scalar signs.

The sources support statics facts and coverage; the skill decomposition and graph links are editorial choices. This packet has not been independently reviewed as a complete curriculum.
