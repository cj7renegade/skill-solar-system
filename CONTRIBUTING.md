# Contributing

## Workflow

1. Start from an up-to-date `main`:
   ```sh
   git switch main
   git pull
   ```
2. Create a feature branch with a descriptive name, such as `feature/level-editor`, `fix/coordinate-precision`, or `docs/readme`:
   ```sh
   git switch -c feature/short-description
   ```
3. Make focused commits. Each commit should contain one logical change with a message that says what changed and why. Keep unrelated refactors, formatting, and map-content edits in separate commits.
4. Run the checks before pushing:
   ```sh
   npm test
   npm run build
   ```
   For changes to the renderer or desktop shell, also launch the app with `npm start` and check the affected behavior by hand.
5. Push the branch and open a pull request against `main`:
   ```sh
   git push -u origin feature/short-description
   ```
   In the PR description, cover what changed, how you tested it, and anything you could not verify.
6. After review, merge the pull request into `main` and delete the feature branch. Do not force-push to `main`.

## Guidelines

- Keep the app offline. Do not add runtime network access, remote assets, or telemetry.
- Add or update tests in `tests/` when changing map validation, layouts, or interaction logic.
- Personal saved maps and archived datasets stay out of the repository. Do not commit them; `.gitignore` excludes the usual locations.
- Skill levels and prerequisite links are authored reference information. Label them as editorial judgments, not measured difficulty or proficiency.
- Line endings are managed by `.gitattributes`: LF for source files and CRLF for Windows `.cmd` scripts.
