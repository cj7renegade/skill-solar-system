# Skill Solar System v0.4.0

Adds editable reference levels from 1–100, a deterministic rising spiral layout, prerequisite-level reconciliation, and an explicit full recalculation command. These levels remain separate from the manual Yes/No proficiency field. Existing maps, camera navigation, nameplates, spacing, and selected-only connections remain supported.

Copy this folder's contents directly into your existing program folder, replace matching files, run Rebuild-Windows.cmd, and launch. Confirm 0.4.0 in the banner. Dependencies are unchanged from v0.3.3.

Open the accompanying Maps/01-Level-Spiral-Atlas.json only after updating. It contains 1,582 nodes and 4,614 connections, including 99 new physics skills. The separate package START-HERE.md explains installation, the score convention, editorial scope, backups, and first-launch checks.

Edit mode → select a subject → Reference level → Apply changes saves a number without moving the sphere. Arrange level spiral applies saved levels, estimates unassigned values, and raises levels when needed to remain above prerequisites. Recalculate levels + spiral replaces all level numbers with dependency-derived ranks. Undo restores both numbers and positions. Pinned positions are preserved.

37 automated code tests and full-map structural/migration checks passed. Electron graphics, production bundling, and Windows launch were not executed in the authoring environment because the browser executable and build/render dependencies were unavailable.
