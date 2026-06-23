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

## Review dimensions

Beyond logic bugs, scan these — but they obey the same bar (Rules 1–2): surface one only when it **materially** hurts correctness, maintainability, or a contract that's expensive to change once consumed. Lint owns the trivial; don't repeat it here. **Over-engineering is as much a finding as under-engineering.**

- **Maintainability / readability** — mega-functions, deep nesting, control flow you can't follow in one pass, names that mislead. Flag the genuinely hard-to-follow, not style.
- **Separation of concerns (both directions)** — one unit doing several jobs (fetch + compute + render + persist), or pure logic fused with I/O (tell: params or seams that exist only to inject mocks in tests). *And the opposite* — over-abstraction: factory-of-factory, single-use one-line helpers, indirection you can't follow in one pass. Flag ravioli as readily as spaghetti; don't push extraction past the point it aids understanding.
- **Callback hell** — deeply nested or chained callbacks and closures, **sync or async** (nested `.map`/`.forEach`/`.reduce`, callbacks passed as config, functions that return functions, anonymous closures several levels deep), and closures that capture and mutate shared state. This is about nesting and indirection generally, not just async — prefer named top-level functions and straight control flow. (Fire-and-forget async — `setTimeout(async …)`, an `async` fn passed where `void` is expected — is the separate, lint-catchable cousin.)
- **Coding conventions** — `let` where `const` fits, deep method nesting, comments that narrate *what* instead of *why*. Mostly lint's job — raise here only when lint won't catch it or it's egregious.
- **File structure** — deviates from the repo's established layout enough to confuse (e.g. types in the new feature folder but the repo dumped in a legacy dir; a second stack stood up beside an existing one). Per Rule 6, `[high]` under Bugs and issues.
- **Database design** — single-table modelling: item collections vs one nested blob, the item-size limit, key / access-pattern grammar, access enforced inside the repo (not by a comment the caller must remember), migration + rollback. Data shape is expensive to change, so it's material almost by default.
- **REST endpoint structure** — collection (`/things`, plural) + item (`/things/{id}`) + actions as named sub-resources, not an overloaded collection `POST`; correct status codes; no accidental singular singletons. The URL is a contract — flag deviations before consumers bind to them.
- **YAGNI** — speculative generality: single-member "extensible" unions, abstractions or parameters built for a future that isn't here or only to satisfy a test. Debt, not a nit — flag it.

Conventions: if the repo has a `CONVENTIONS.md` / `CLAUDE.md`, check against it. If it doesn't, **discover the de-facto conventions first** — read the nearest one or two analogous files (a sibling endpoint, the existing repository, a neighbouring module) and infer the established patterns, then judge the PR against those. "There's no written rule" is not a pass; consistency with the surrounding code is the rule. Either way, surface only material deviations, not every divergence.

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
