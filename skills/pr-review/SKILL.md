---
name: pr-review
description: Reviews a pull request, surfacing true bugs and design failure modes rather than nits. Investigates code changes, permissions, infra, and naming/structure conventions, then outputs a tight review focused on (1) bugs and issues, (2) premortem-style failure modes the design invites, and (3) at most one zoom-out alternative. Use when the user asks to review a PR, mentions a PR number or URL, or says "review this PR", "check this PR", or "pr-review".
---

# PR Review

Investigate the PR, the code around it, and any other repos referenced by or affected by the changes. Check permissions, infra, naming conventions, file structure, and how the changes sit in the surrounding code.

## Rules

These rules override the urge to fill every section.

1. **No nits.** Only surface items that are actual defects: wrong logic, security holes, races, broken types, missed migrations, regressions, accessibility/perf issues with real impact. If the item would not change whether you'd approve the PR, leave it out.
2. **No `low` severity.** If it isn't at least `high`, it doesn't belong. Drop it.
3. **No `Good` section.** Praise pads tokens and doesn't change code.
4. **Skip empty sections entirely.** If "Bugs and issues" is empty, write `None spotted.` and end the review. If "What might bite you" is empty, omit the heading.
5. **"Better approach" is rare.** Use only when you see a meaningfully different shape given the bigger picture (think `/zoom-out`). Naming, file placement, or "consider X" are not a better approach.
6. **File placement / naming** is only a finding when it's actively wrong (broken import resolution, violates the repo's established convention enough to confuse maintainers). Surface it under `Bugs and issues` as `[high]`. Don't create a separate style-issues section.

## Premortem framing

For "What might bite you", assume this PR shipped six months ago and something tied to it broke. Work backward: what specific failure modes does THIS design invite? Be concrete — name the table, the field, the boundary, the assumption. Generic risk ("could be slow", "might not scale") doesn't qualify.

## Zoom-out framing

For "Better approach", step out one layer. Given the larger system this PR sits in, is there a meaningfully different shape that would have avoided the bugs above or the premortem failure modes? If the answer is "the current shape is fine, here's a smaller tweak" — skip the section.

## Output format

```
PR #XXX — <name of the PR>

What it does: <one sentence>

Bugs and issues
1. [critical/high] <issue, ordered most-important-first>
2. ...

What might bite you (premortem)
- <0–3 specific failure modes given this design>

Better approach (zoom-out)
<0–1 short paragraph if a meaningfully different shape exists; otherwise omit the entire section>
```
