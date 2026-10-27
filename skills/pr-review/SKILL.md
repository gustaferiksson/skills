---
name: pr-review
description: Reviews a pull request, surfacing true bugs, code-quality failures, and design failure modes. Investigates code changes, permissions, infra, and naming/structure conventions, then outputs a slim, action-bucketed review (a zoom-out verdict on whether the change should land in this shape, then one-line findings on bugs and lazy-senior-dev code quality grouped by what to do about them, then premortem failure modes). Use when the user asks to review a PR, mentions a PR number or URL, or says "review this PR", "check this PR", or "pr-review".
---

# PR Review

Investigate the PR, the code around it, and any other repos referenced by or affected by the changes. Check permissions, infra, naming conventions, file structure, and how the changes sit in the surrounding code.

## Rules

These rules override the urge to fill every section.

1. **Investigate thoroughly, report slim.** The depth below governs the reading; the output stays short. No process narration, no verification log, no counts, no praise.
2. **One line per finding** where it fits, two at most: the file/symbol, the defect, the fix. No sub-bullets, no failure-scenario essays.
3. **Skip empty buckets entirely.** Never manufacture findings to fill one.
4. **The zoom-out verdict is never skipped.** It is the part that decides whether to do anything at all.
5. **File placement / naming counts only when it's actively wrong**: broken import resolution, or a deviation from the repo's established layout big enough to confuse maintainers (types in the feature folder while the repo dumps them in a legacy dir; a second stack stood up beside an existing one). It goes in `Fix before merge`.

## Code quality — review like a lazy senior dev

Agent-written code is routinely poor in structure, flow, and readability even when it's correct. Hold it to the bar in the user's global coding principles: **would a senior wave this through on first read?** If not, it's a finding — structure, flow, and readability are first-class here, not "just style".

*Lazy* senior means **lazy about the solution, never about the reading**: lazy recommendations (no gratuitous abstraction), relentless code-reading. **Give the heaviest-changed file(s) a structural read on their own terms** — not just whatever surfaces while hunting bugs. The pass isn't done until each has had that read; declaring code quality clean off a few incidental nits, with a whole file's structure unexamined, is the failure to avoid.

The bar cuts both ways on *what* to flag: real friction, not trivia — skip formatting, lint-autofixable nits, and taste calls the repo already made. But **trivia is per-instance, not per-pattern** — one `let` is a nit; a file that reassigns or rebuilds throughout is *one* `Fix before merge` structural finding, not a scatter of nits. And **over-engineering is as much a finding as under-engineering** — indirection the code doesn't yet need is debt, not quality.

Flag:

- **Reassignment / mutation** — `let` where `const` fits; a value set up across several statements instead of computed in one; closures that capture and mutate shared state; and an accumulator rebuilt or reassigned step-by-step where the API is meant to be *composed onto* — dataframes (build up expressions), query builders, fluent/pipeline chains.
- **Control flow you can't follow in one pass** — conditional pyramids, deep nesting, `switch` where an early-return chain reads straighter, callback chains and nested closures (sync or async). Prefer named top-level functions and straight flow. Two named tells, both common in agent code and each a `Fix before merge` on its own: a **function that mutates an accumulator passed in as an argument** instead of returning what it computed (`f(value, key, collected)` then inspecting `collected`) — worse when the function recurses; and a **`let changed = false` + inner `.map` + `changed ? {...x, y} : x`** identity-preserving dance. One of those is a smell, the same shape appearing two or three times in one diff is one structural finding, not a scatter of nits.
- **Duplication vs the right abstraction** — real logic copied a second time wants one small helper; but a sprawl of tiny single-use helpers and utils, a one-line wrapper, a factory-of-factory, or a seam that exists only to inject a test mock is over-abstraction — the single most common failing in agent code, so flag it hard. Flag ravioli as readily as spaghetti. Check every new helper for **caller count and body size**: one caller plus a body that is a single expression, template string, or ternary means inline it, and say so by name. A new file holding five or six functions to serve two or three real exports is the same finding at file scale.
- **Separation of concerns (both directions)** — one unit doing fetch + compute + render + persist, or pure logic fused with I/O; *and* the opposite, extraction pushed past the point it aids understanding.
- **Names that mislead** — a name that describes the wrong thing, or needs a comment to be understood.
- **Comments that narrate *what* instead of *why*.** Also flag: a comment restating a named constant in words; a doc block that is the PR description pasted onto a symbol; a block re-arguing why the whole file exists, sitting on one function inside it; and a comment asserting a methodology nobody can reproduce ("fitted against X over ~250 samples") when the diff ships no script to re-run it — either commit the derivation and point one line at it, or cut to the one line a reader can't derive. Name the comments that *earn* their place only to justify keeping them; don't list them as praise.
- **YAGNI** — speculative generality: single-member "extensible" unions, parameters built for a future that isn't here or only to satisfy a test.

**Three counts to run on the heaviest-changed file(s), every review.** They are cheap, they catch what a read glosses over, and skipping them is how a code-quality pass ends up clean on a file that isn't:

1. **Comments added in the diff.** Any added comment that doesn't meet the CLAUDE.md exception (a fact the code and its names can't carry) is a finding.
2. **Callers per new helper.** Single-caller one-liners get named and inlined.
3. **Repeats of each new closure/mutation shape.** Two or more copies is one structural finding.

Bucketing: quality issues that shelter a bug (a mega-function hiding one, mutation causing a race) or a structural finding a senior would bounce go in `Fix before merge`; the rest go in `Worth fixing` or `Nits` by impact. Quality findings share the buckets with bugs; there is no separate quality section.

**Seams with other skills.** This bar is the always-on baseline. When a finding needs a *named* fix, reach for `/refactor` (Fowler smell + technique catalog). Point at that catalog, don't restate it.

**Conventions.** If the repo has a `CONVENTIONS.md` / `CLAUDE.md`, check against it. Don't go spelunking through unrelated files to reverse-engineer an unwritten house standard — judge against what's written down and what's visible in the diff and its immediate surroundings. Surface only material deviations.

## Other review dimensions

- **Database design** — single-table modelling: item collections vs one nested blob, the item-size limit, key / access-pattern grammar, access enforced inside the repo (not by a comment the caller must remember), migration + rollback. Data shape is expensive to change, so it's material almost by default.
- **REST endpoint structure** — collection (`/things`, plural) + item (`/things/{id}`) + actions as named sub-resources, not an overloaded collection `POST`; correct status codes; no accidental singular singletons. The URL is a contract — flag deviations before consumers bind to them.
- **Framework & library idioms** — when the code uses a framework, SDK, or data library, check its docs for best practices and hold the PR to correct usage, not just to generic style. Judge from the diff and its immediate context; don't go hunting through the wider repo for an existing module to derive the house idiom from.

## Premortem framing

For "Watch out", assume this PR shipped six months ago and something tied to it broke. Work backward: what specific failure modes does THIS design invite? Be concrete: name the table, the field, the boundary, the assumption. Generic risk ("could be slow", "might not scale") doesn't qualify. 0 to 3 items.

## Zoom-out framing

Step out one layer and answer: given the larger system this PR sits in, should this change land, and in this shape? Pick one verdict:

- **Ship it**: the shape is right; the buckets below are the whole story.
- **Ship after fixes**: the shape is right but `Fix before merge` items block it.
- **Reshape**: a meaningfully different shape would avoid the bugs or premortem failures; name it in two or three sentences.
- **Don't do it**: the change isn't needed, duplicates something existing, or solves the wrong problem; say what to do instead.

Back the verdict with one or two sentences of reasoning from the bigger picture, not a recap of the findings.

## Output format

```
**PR #XXX:** <name>. <one sentence on what it does>

**Zoom-out:** <verdict>. <1–3 sentences of bigger-picture reasoning; for Reshape / Don't do it, the alternative>

**Fix before merge**
1. <file/symbol>: <defect>. <fix>.

**Worth fixing**
2. ...

**Nits**
- ...

**Watch out**
- <0–3 specific failure modes>
```

Number findings across `Fix before merge` and `Worth fixing` continuously so they can be referenced ("do 1 and 3").
