---
name: annotations
description: Find and execute inline `@cc:` comment markers left in the code as instructions for Claude Code, then delete each marker once addressed. Use when the user says "/annotations", "process my annotations", "address my @cc comments", "do my inline notes", or points at code they've marked up. Do not auto-fire on every edit; run only when asked.
disable-model-invocation: true
---

# Annotations

`@cc:` markers are short instructions the user scatters in the code, in normal comments, next to the lines they apply to. This skill finds every marker in scope, executes each one in place, removes the marker, and reports what changed. The markers are transient instructions, not documentation.

## Marker convention

- Single line: `// @cc: extract this into a hook, memoize the filter`
- Block: `/* @cc: split this function, the second half is a separate concern */`
- The token is always `@cc:`. The comment syntax follows the file's language (`//`, `#`, `<!-- -->`).

## Steps

1. **Decide scope.** Default to tracked files in the repo. Narrow it when the user is specific: "this file" or an open selection means that file only, "my changes" means the git diff (`git diff` plus staged).
2. **Find markers:** `grep -rn '@cc:'` over the scope (tracked files only, respect `.gitignore`). If none, say so and stop. Do not invent work.
3. **Process each marker in file order:**
   - Read enough surrounding code to resolve what "this", "here", "above", "below" point to.
   - Treat the comment text as an instruction scoped to that location.
   - Make the edit.
   - Delete the marker comment. If it was the only thing on the line, remove the line.
4. **Report.** One line per marker: `path:line — <what it asked> → <what you did>`.

## Rules

- Never leave a stale `@cc:` behind. If you addressed it, the marker goes. If you could not, keep the marker and report it as blocked with the reason; do not silently skip it.
- Touch only what a marker asks for. Do not refactor unmarked code along the way.
- Ambiguous marker: make the smallest reasonable change and flag it in the report, or ask one focused question if the change is destructive or expensive to reverse.
- Honor the repo's CLAUDE.md and style when making edits.

## When NOT to use

- No `@cc:` markers exist and the user is just describing a task. Do the task directly.
- The marker is a real, permanent code comment (no `@cc:` token). Leave it alone.
