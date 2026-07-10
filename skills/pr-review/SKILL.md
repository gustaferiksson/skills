---
name: pr-review
description: Reviews a pull request, surfacing true bugs, code-quality failures, and design failure modes. Investigates code changes, permissions, infra, and naming/structure conventions, then outputs a tight review — (1) bugs and issues, (2) code quality held to a lazy-senior-dev bar on structure, flow, and readability, (3) premortem-style failure modes the design invites, and (4) at most one zoom-out alternative. Use when the user asks to review a PR, mentions a PR number or URL, or says "review this PR", "check this PR", or "pr-review".
---

# PR Review

Investigate the PR, the code around it, and any other repos referenced by or affected by the changes. Check permissions, infra, naming conventions, file structure, and how the changes sit in the surrounding code.

## Rules

These rules override the urge to fill every section.

1. **No `Good` section.** Praise pads tokens and doesn't change code.
2. **Skip empty sections entirely.** If a section has nothing, write `None spotted.` and move on, or omit the heading — never manufacture findings to fill it.
3. **"Better approach" is rare.** Use only when you see a meaningfully different shape given the bigger picture (think `/zoom-out`).
4. **File placement / naming counts only when it's actively wrong** — broken import resolution, or a deviation from the repo's established layout big enough to confuse maintainers (types in the feature folder while the repo dumps them in a legacy dir; a second stack stood up beside an existing one). Surface it under `Bugs and issues` as `[high]`.

## Code quality — review like a lazy senior dev

Agent-written code is routinely poor in structure, flow, and readability even when it's correct. Hold it to the bar in the user's global coding principles: **would a senior wave this through on first read?** If not, it's a finding — structure, flow, and readability are first-class here, not "just style".

*Lazy* senior means **lazy about the solution, never about the reading**: lazy recommendations (no gratuitous abstraction), relentless code-reading. **Give the heaviest-changed file(s) a structural read on their own terms** — not just whatever surfaces while hunting bugs. The pass isn't done until each has had that read; declaring code quality clean off a few incidental nits, with a whole file's structure unexamined, is the failure to avoid.

The bar cuts both ways on *what* to flag: real friction, not trivia — skip formatting, lint-autofixable nits, and taste calls the repo already made. But **trivia is per-instance, not per-pattern** — one `let` is a `[low]`; a file that reassigns or rebuilds throughout is *one* `[high]` structural finding, not a scatter of lows. And **over-engineering is as much a finding as under-engineering** — indirection the code doesn't yet need is debt, not quality.

Flag:

- **Reassignment / mutation** — `let` where `const` fits; a value set up across several statements instead of computed in one; closures that capture and mutate shared state; and an accumulator rebuilt or reassigned step-by-step where the API is meant to be *composed onto* — dataframes (build up expressions), query builders, fluent/pipeline chains.
- **Control flow you can't follow in one pass** — conditional pyramids, deep nesting, `switch` where an early-return chain reads straighter, callback chains and nested closures (sync or async). Prefer named top-level functions and straight flow.
- **Duplication vs the right abstraction** — real logic copied a second time wants one small helper; but a sprawl of tiny single-use helpers and utils, a one-line wrapper, a factory-of-factory, or a seam that exists only to inject a test mock is over-abstraction — the single most common failing in agent code, so flag it hard. Flag ravioli as readily as spaghetti.
- **Separation of concerns (both directions)** — one unit doing fetch + compute + render + persist, or pure logic fused with I/O; *and* the opposite, extraction pushed past the point it aids understanding.
- **Names that mislead** — a name that describes the wrong thing, or needs a comment to be understood.
- **Comments that narrate *what* instead of *why*.**
- **YAGNI** — speculative generality: single-member "extensible" unions, parameters built for a future that isn't here or only to satisfy a test.

Severity: quality issues that shelter a bug (a mega-function hiding one, mutation causing a race) rank with bugs; the rest go in the `Code quality` output section, most-impactful first.

**Seams with other skills.** This bar is the always-on baseline. When a finding needs a *named* fix, reach for `/refactor` (Fowler smell + technique catalog); when the friction is module depth / testability at the architecture level, that's `/improve-codebase-architecture`. Point at those catalogs — don't restate them.

**Conventions.** If the repo has a `CONVENTIONS.md` / `CLAUDE.md`, check against it. Don't go spelunking through unrelated files to reverse-engineer an unwritten house standard — judge against what's written down and what's visible in the diff and its immediate surroundings. Surface only material deviations.

## Other review dimensions

- **Database design** — single-table modelling: item collections vs one nested blob, the item-size limit, key / access-pattern grammar, access enforced inside the repo (not by a comment the caller must remember), migration + rollback. Data shape is expensive to change, so it's material almost by default.
- **REST endpoint structure** — collection (`/things`, plural) + item (`/things/{id}`) + actions as named sub-resources, not an overloaded collection `POST`; correct status codes; no accidental singular singletons. The URL is a contract — flag deviations before consumers bind to them.
- **Framework & library idioms** — when the code uses a framework, SDK, or data library, check its docs for best practices and hold the PR to correct usage, not just to generic style. Judge from the diff and its immediate context; don't go hunting through the wider repo for an existing module to derive the house idiom from.

## Premortem framing

For "What might bite you", assume this PR shipped six months ago and something tied to it broke. Work backward: what specific failure modes does THIS design invite? Be concrete — name the table, the field, the boundary, the assumption. Generic risk ("could be slow", "might not scale") doesn't qualify.

## Zoom-out framing

For "Better approach", step out one layer. Given the larger system this PR sits in, is there a meaningfully different shape that would have avoided the bugs above or the premortem failure modes? If the answer is "the current shape is fine, here's a smaller tweak" — skip the section.

## Output format

```
PR #XXX — <name of the PR>

What it does: <one sentence>

Bugs and issues
1. [critical/high] <correctness issue, most-important-first>
2. ...

Code quality
1. [high/medium/low] <structure / flow / readability finding, most-impactful-first>
2. ...

What might bite you (premortem)
- <0–3 specific failure modes given this design>

Better approach (zoom-out)
<0–1 short paragraph if a meaningfully different shape exists; otherwise omit the entire section>
```
