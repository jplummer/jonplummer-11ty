# /COMMIT v1.0.0

Structured commit workflow. Review changes, draft message, get confirmation.

## Steps

1. Run `git status` and `git diff --staged` (or `git diff` if nothing staged)
2. Summarize what changed and why (not just what files — what the *intent* is)
3. Draft a commit message:
   - First line: imperative mood, ≤72 chars (e.g. "Add checkout flow", "Fix date parsing in reports")
   - If needed, blank line + body with context on *why*
   - Do not use backticks or markdown formatting in commit messages
4. Present the message and wait for confirmation before committing
5. Do not push unless explicitly asked
