# Project: jonplummer-11ty

Personal blog built with Eleventy (11ty) and Nunjucks templates.

## Key principles

- Assume Eleventy works correctly — most issues are misunderstandings
- Testing is required for every change
- Ask before implementing custom JavaScript workarounds

## Design records

Write plans to `docs/designs/plans/YYYY-MM-DD-<feature>.md` and specs to `docs/designs/specs/YYYY-MM-DD-<topic>-design.md`. Ad-hoc reports and audits go in `docs/designs/scratch/`, which is gitignored.

The superpowers `writing-plans` and `brainstorming` skills name `docs/superpowers/` instead. This instruction overrides them — which is what superpowers' own precedence rule asks for, since user instructions take priority over skills. The skills can't be corrected at the source: their `SKILL.md` files ship from a plugin cache keyed by commit SHA and version, so edits there are discarded on the next update. `pnpm run test design-docs-location` fails if `docs/superpowers/` comes back.

## Efficiency

### Batch Similar Changes
When fixing multiple similar issues (like updating multiple test cases):
1. First, analyze ALL instances that need fixing
2. Consider the simplest possible change(s) that will accomplish the desired goal. Prefer making use of the native capabilities of included packages rather than re-implementing variations of the same functionality or bringing in additional libraries unless strictly necessary.
3. Make ALL changes in a single batch using parallel tool calls
4. Then verify the results (run tests, linters, etc.)

Do NOT fix issues one-at-a-time with verification steps in between unless:
- Later changes depend on the results of earlier changes
- You need to verify your understanding of the pattern before proceeding

### Minimize Verification Loops
- Read/analyze files in parallel when possible
- Make all independent edits in one batch
- Run expensive operations (tests, builds) only after all changes are complete

## Commands

Agent commands live in `.claude/commands/`. Claude Code can invoke them as slash commands.

## Rules

@.cursor/rules/eleventy.mdc
@.cursor/rules/eleventy-debugging.mdc
@.cursor/rules/testing.mdc
@.cursor/rules/web-frontend.mdc
@.cursor/rules/javascript.mdc
@.cursor/rules/markdown.mdc
@.cursor/rules/content.mdc
@.cursor/rules/memory.mdc

## Reference docs

@docs/commands.md
@docs/authoring.md
@docs/tests.md
@docs/designs/font-stack-exploration.md
