# Integrate Material Behavior Batch 01

Inspect the current project instructions, content schema, map identity, and worktree first. Use a feature branch such as content/material-behavior-batch-01. The current local master is authoritative; the supplied validation reports describe an earlier uploaded master, not live app state.

1. Read material-behavior-batch-01.json and COVERAGE.md. This is an authoring batch, NOT a file for Open map. It contains 10 candidate skills and 32 relationships. Compare every candidate against the current local atlas by stable ID, name, and meaning. Reuse an equivalent existing skill rather than adding a duplicate; report every mapping or conflict. Do not force counts to match if the atlas has changed.
2. Preserve all existing node IDs, descriptions, connections, positions, pins, proficiency answers, and atlas-family identity. Preserve the approved camera/orbit behavior, highlighting, coordinate precision, and any previously integrated DC, Physics, and Mechanics Statics batches. Do not reapply any previous batch as part of this task. Keep personal maps and review data outside the public repository.
3. Integrate new content with the existing authoring/import mechanisms. Retain the original two-paragraph descriptions, self-reflection references, source references, and concise placement notes. Adapt field names to the actual schema; strip authoring-only layoutRequest fields from runtime exports. Use the existing supported layers icon or equivalent Mechanics icon. Keep source metadata in an authoring sidecar if runtime nodes do not support it.
4. Use the manifest relationships and rationales after reconciliation. Prerequisite direction is source to target. Supports and related links must not increase prerequisite depth. Existing broad overview nodes remain unchanged for this batch; their overlap with narrower skills is deliberate and does not justify copying proficiency. Do not infer Yes from parent, child, or neighboring skills.
5. New skills start proficiency80=null. Existing shared answers for genuinely matching stable IDs remain authoritative. Ensure Yes, No, and unmarked retain their meanings through master/sub-map loading, export, and reopen. Do not erase the user's mathematics markings.
6. Assign only new skills' coordinates and reference levels using the current layout convention and precision. Validate prerequisite ranks after merging, but do not reposition existing nodes or normalize all old levels. Report any ordering conflict with saved old heights rather than silently changing them. Height remains an editorial dependency reference, not measured difficulty. Make integration idempotent: a second run must add no duplicate nodes or edges.
7. Generate a separate Material-Behavior-Batch-01-with-prerequisites.json from the new skills plus their full transitive prerequisite closure, using identical node IDs and family identity. Do not replace a broader Mechanics map with this small batch map. Retain edges only when both endpoints exist in the sub-map. If additional supporting skills are included, include their prerequisite closure too and explain the scope.
8. Run validate_batch.py against a PRE-INTEGRATION copy of the current master. It is read-only and intentionally rejects already-integrated IDs. Add meaningful integration checks for duplicate prevention, unresolved references, prerequisite cycles, preservation of old fields, unmarked initialization, and master/sub-map identity. The validator's legacy level calculation is diagnostic only, not an instruction to change current layout code.
9. Run existing app tests and build. Inspect the master and batch sub-map in Electron: descriptions, positions, visible links, subject highlighting, guided review, Save/reopen, and shared proficiency. Report checks that cannot be performed. Do not claim the packaged authoring checks verify the live application.
10. Open a pull request for public-safe content/tooling changes after verification. Finish with actual counts, reuse/conflict decisions, test results, branch/PR links, and exact instructions for loading the generated personal map. Do not commit the user's personal atlas or proficiency data.

## Content boundaries

Keep the domain Mechanics and use the subdomain Material behavior and tensile testing. Do not introduce a seventh domain, recolor domains, or reclassify existing nodes. Preserve broad stress/strain/elasticity/plasticity/tensile-test overviews. Their overlap with new narrower skills is intentional during this additive migration; never transfer an overview Yes to the new skills.

The scope is interpreting supplied measurements and idealized uniaxial models. It is not operating a standards-compliant test machine or certifying material properties. Existing overview descriptions may contain approximations; do not silently edit them as part of this content addition. Record discovered issues separately.

Sources support concepts; the skill boundaries and links are editorial. The older MIT property table is used to illustrate distinct property columns, not to prescribe current design values or prices. No table values are imported into the map. The axial stiffness relation is an elementary consequence of the existing axial-bar model, not a general bending stiffness formula.

## Numerical spot checks

- A 12,000 N load and original area 60 mm² give 200 MPa engineering stress.
- A 0.10 mm extension over 50 mm gives 0.002 strain = 0.2 percent = 2,000 microstrain.
- A linear elastic stress increment of 100 MPa over a strain increment of 0.05 percent gives E=200,000 MPa=200 GPa. Convert percent before division.
- For total strain 0.010, stress 300 MPa, and E=200,000 MPa, the specified linear unloading model recovers 0.0015 strain and leaves 0.0085 residual strain.
- With 12,000 N, initial area 60 mm², and measured current area 40 mm², nominal stress is 200 MPa and current-area average is 300 MPa.
- Doubling area and length together leaves EA/L unchanged when E is unchanged. This says nothing by itself about bending stiffness.
- Proof stress is the intersection with sigma=E(epsilon-0.002), not the stress at epsilon=0.002.

Run these content examples as spot checks as well as the app integration checks above. Report anything not visually verified.
