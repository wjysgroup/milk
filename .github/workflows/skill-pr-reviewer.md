---
name: skill-pr-reviewer
description: Review pull requests with installed expert skills
intent: Give every ready pull request line-level review comments on its changed code, grounded in the installed expert skill that matches the change type.
on:
  pull_request:
    types: [ready_for_review]
permissions:
  contents: read
  issues: read
  pull-requests: read
engine:
  id: cursor
model: cursor/auto
imports:
  - github/gh-aw/.github/workflows/shared/cursor.md@v0.92.0
inlined-imports: true
network:
  allowed:
    - defaults
    - github
    - downloads.cursor.com
    - api2.cursor.sh
    - agentn.global.api5.cursor.sh
    - host.docker.internal
safe-outputs:
  create-pull-request-review-comment:
    max: 8
timeout-minutes: 15
evals:
  - id: operational_value
    question: Does the agent output demonstrate that this pull request received line-level review comments on changed diff lines, with every actionable comment naming the installed expert skill selected for that change type?
  - id: skill_matches_change_type
    question: Does the agent output show that each applied skill was selected because it matches the pull request change type?
  - id: skill_named_on_finding
    question: Does the agent output name the installed expert skill that informed each actionable finding?
  - id: changed_lines_only
    question: Does the agent output show that every review comment targets a changed line in the pull request diff?
  - id: no_duplicate_feedback
    question: Does the agent output avoid posting a review comment that repeats feedback already present on the same changed line?
---

# Skill PR Reviewer

Code-review every pull request in this project. A successful run delivers line-level review comments on the changed diff, and every actionable comment names the installed expert skill selected for that change type.

This run starts because pull request #${{ github.event.pull_request.number }} in ${{ github.repository }} was marked ready for review. Review that pull request only.

## Repository

This is `shopping-demo`, a small browser shopping UI (product list, cart count, DOM updates). Judge changes against the code that is actually here:

- Languages are vanilla JavaScript ES modules, HTML, and CSS in `src/`. There is no TypeScript, Vue, Nuxt, or Tailwind.
- npm is the package manager. The scripts that exist are `npm start` (`live-server`) and `npm run lint` (`eslint src/**/*.js`). Do not invent `dev`, `build`, `typecheck`, or `lint:fix`.
- `.eslintrc.json` enforces 2-space indent, single quotes, no semicolons, `eslint:recommended`, `sourceType: module`, and browser plus ES2021.
- Pull requests to `master` already run ESLint (SARIF upload) and SonarQube. Do not restate those automated style findings unless a selected skill shows a correctness or security consequence on a changed line.
- There is no test runner, issue template, pull request template, or required label. UI copy is Chinese.
- Dependabot updates npm, Docker, and GitHub Actions. Treat lockfiles and generated workflow output as out of scope unless the diff changes runtime behavior.

## Steps

1. Read the pull request title, body, diff, and existing review comments with `gh`. Do not approve the pull request. The default token cannot approve, and approval is not an allowed output.
2. Discover installed skills with `find` at max depth 6 under `skills/` and `.github/skills/` for `SKILL.md`. Read only the skills relevant to this diff. Do not install, download, or fetch any skill.
3. Classify the change type from the diff (for example cart behavior, product rendering, upload handling, styles, dependencies, or workflow config). Select the installed skills that match that change type, and name those skills before applying them.
4. Review changed lines only. Use unchanged code only as evidence for a finding on a changed line. Skip lockfiles, generated files, and files the diff does not touch.
5. Compare each candidate finding with existing review comments on the same line. Drop duplicates.
6. For each actionable finding, emit one `create-pull-request-review-comment` on the changed line. The comment must name the skill that informed it, state the concrete problem, and give a specific fix that fits this repository. Cap the review at the eight highest-impact findings. Prefer correctness and security (cart totals, price handling, unsanitized `innerHTML`, upload validation) over style.
7. End the response with a short summary that states the change type, the selected skill names, that comments are limited to changed diff lines, and that duplicate feedback was not posted. If you call `noop`, put that same summary in the reason.

## No-op

Call `noop` with a short reason, and do not post comments, when any of these is true:

- No `SKILL.md` is installed under `skills/` or `.github/skills/`.
- No installed skill matches the change type.
- The diff has no actionable finding that a selected skill supports.
- The only possible comments would repeat existing feedback or would target unchanged lines.

## Safe outputs

- Use `create-pull-request-review-comment` for each finding on a changed diff line.
- Use `noop` when no skill-backed finding should be posted.
