---
name: pr-review
description: Reviews a pull request, surfacing true bugs, code-quality failures, and design failure modes. Fans the review out across sub-agents — one for bugs, one for code quality (Fowler smell catalog baked in), one for a premortem — then a zoom-out agent that reads their findings, and synthesizes a tight review — (1) bugs and issues, (2) code quality held to a lazy-senior-dev bar on structure, flow, and readability, (3) premortem-style failure modes the design invites, and (4) at most one zoom-out alternative. Use when the user asks to review a PR, mentions a PR number or URL, or says "review this PR", "check this PR", or "pr-review".
---

# PR Review

You are the orchestrator. You don't do the four reviews yourself — you establish a shared frame, fan them out to sub-agents, then synthesize their findings into one review. The point of the split is independence: bugs, code quality, and premortem each get an undistracted read, and the zoom-out gets to react to all three instead of running blind.

## Step 1: Establish shared context

Do this once, yourself, so every sub-agent starts from the same frame:

- Identify the PR (number / URL) and its base ref. Get the diff (`gh pr diff`, or the branch's merge-base diff).
- Note the repo's conventions source: a `CONVENTIONS.md` / `CLAUDE.md` if present; otherwise the one or two nearest analogous files (a sibling endpoint, the existing repository, a neighbouring module) that define the de-facto patterns.
- One sentence on what the PR does.

Hand this same context block to each sub-agent below so none of them re-derives it.

## Step 2: Spawn three review agents in parallel

Launch these **in parallel, in one message** — they are genuinely independent, and parallelism keeps one agent's read from contaminating the others'. Each gets the shared context, investigates the PR itself (read the changed code and its surroundings — permissions, infra, callers, analogous files), and returns findings in its lane.

### Agent A — Bugs and issues (the regular review)

Lens: correctness and contracts. Surface true bugs and concrete, expensive-to-change design faults, most-important-first, each tagged `[critical/high/medium]`.

- **Correctness** — logic errors, unhandled cases, race conditions, broken assumptions, security and permission gaps, data-loss paths.
- **Database design** — single-table modelling: item collections vs one nested blob, the item-size limit, key / access-pattern grammar, access enforced inside the repo (not by a comment the caller must remember), migration + rollback. Data shape is expensive to change, so it's material almost by default.
- **REST endpoint structure** — collection (`/things`, plural) + item (`/things/{id}`) + actions as named sub-resources, not an overloaded collection `POST`; correct status codes; no accidental singular singletons. The URL is a contract — flag deviations before consumers bind to them.
- **File placement / naming** — counts only when it's actively wrong: broken import resolution, or a deviation from the repo's established layout big enough to confuse maintainers (types in the feature folder while the repo dumps them in a legacy dir; a second stack stood up beside an existing one). Surface as `[high]`.

### Agent B — Code quality (see the detailed brief below)

Give this agent the full **Code quality** section as its brief.

### Agent C — Premortem

Lens: assume this PR shipped six months ago and something tied to it broke. Work backward — what specific failure modes does *this* design invite? Be concrete: name the table, the field, the boundary, the assumption. Generic risk ("could be slow", "might not scale") does not qualify. Return 0–3 failure modes.

## Step 3: Spawn the zoom-out agent

After A, B, and C return, spawn one more agent and **give it their three findings lists**. Its job is to step out one layer: given the larger system this PR sits in, is there a meaningfully different shape that would have avoided the bugs Agent A found or the failure modes Agent C found? It reasons *from* the concrete findings, not in the abstract. If the honest answer is "the current shape is fine, here's a smaller tweak" — it returns nothing. Zoom-out running blind, in parallel with the others, degrades to generic "you could restructure this"; that's why it's staged last.

## Step 4: Synthesize

Merge the four agents' outputs into the single review below. This is where the rules bite.

### Rules

These rules override the urge to fill every section.

1. **No `Good` section.** Praise pads tokens and doesn't change code.
2. **Skip empty sections entirely.** If a section has nothing, write `None spotted.` or omit the heading — never manufacture findings to fill it.
3. **De-dup across buckets.** A finding that straddles lanes lands in exactly one. The severity tiebreak decides which: a quality issue that shelters a bug (a mega-function hiding one, a mutation causing a race) goes under `Bugs and issues`; the rest of code quality stays in `Code quality`. Nothing double-lists; nothing drops.
4. **"Better approach" is rare.** Use only when the zoom-out agent returned a meaningfully different shape tied to specific findings.

## Code quality — brief for Agent B

Agent-written code is routinely poor in structure, flow, and readability even when it's correct. Hold it to the bar in the user's global coding principles: **would a senior wave this through on first read?** If not, it's a finding — structure, flow, and readability are first-class here, not "just style".

*Lazy* senior means **lazy about the solution, never about the reading**: lazy recommendations (no gratuitous abstraction), relentless code-reading. **Give the heaviest-changed file(s) a structural read on their own terms** — not just whatever surfaces while hunting bugs. The pass isn't done until each has had that read; declaring code quality clean off a few incidental nits, with a whole file's structure unexamined, is the failure to avoid.

The bar cuts both ways on *what* to flag: real friction, not trivia — skip formatting, lint-autofixable nits, and taste calls the repo already made. But **trivia is per-instance, not per-pattern** — one `let` is a `[low]`; a file that reassigns or rebuilds throughout is *one* `[high]` structural finding, not a scatter of lows. And **over-engineering is as much a finding as under-engineering** — indirection the code doesn't yet need is debt, not quality. Flag ravioli as readily as spaghetti.

### Name the smell

This bar is the always-on baseline; the named smells below are the vocabulary for *reporting* what you find, the way `/refactor` does — **name the smell, then say what changes**. They are a diagnosis aid, not a checklist to walk: judgment (per-instance vs per-pattern, over- vs under-engineering) leads, the name follows. Not every finding has a canonical name — an unnamed structural finding is still a finding.

- **Reassignment / mutation** — `let` where `const` fits; a value set up across several statements instead of computed in one; closures that capture and mutate shared state; an accumulator rebuilt or reassigned step-by-step where the API is meant to be *composed onto* (dataframes, query builders, fluent/pipeline chains).
- **Bloaters** — *Long Method* (a function doing too much); *Large Class* (too many fields/methods, SRP creep); *Long Parameter List* (caller must know too much to invoke); *Data Clumps* (the same group of fields/params travelling together — they want to be one object); *Primitive Obsession* (IDs, money, status as raw primitives that silently interchange — TS branded types are the lightweight fix).
- **Control flow you can't follow in one pass** — conditional pyramids, deep nesting, and *Switch Statements* / a type-code `switch` where an early-return chain or polymorphism reads straighter; callback chains and nested closures (sync or async). Prefer named top-level functions and straight flow.
- **Dispensables** — *Duplicate Code* (real logic copied a second time wants one small helper); *Dead Code* (delete it); *Speculative Generality* / **YAGNI** (single-member "extensible" unions, params built for a future that isn't here or only to satisfy a test — one adapter is a hypothetical seam, two is a real one); *Lazy Class* and *Middle Man* (a unit that only forwards calls earns no keep). The sprawl of tiny single-use helpers, one-line wrappers, factory-of-factory, or a seam existing only to inject a test mock is over-abstraction — the single most common failing in agent code, so flag it hard.
- **Separation of concerns (both directions)** — one unit doing fetch + compute + render + persist, or pure logic fused with I/O (*Divergent Change*: one file changing for many unrelated reasons; *Large Class*); *Feature Envy* (a unit leaning on another's data more than its own — it's in the wrong place); *Shotgun Surgery* (one conceptual change forcing edits across many units). And the opposite — extraction pushed past the point it aids understanding.
- **Couplers** — *Inappropriate Intimacy* (two units reaching into each other's internals); *Message Chains* (`a.getB().getC().getD()` leaking the whole graph into callers).
- **Names that mislead** — a name describing the wrong thing, or one that needs a comment to be understood.
- **Comments** — comments narrating *what* instead of *why*; a comment compensating for unclear code wants the code rewritten (often *Extract Function*, using the comment as the new name). Keep comments that explain *why*.

### Framework & library idioms

When the code uses a framework, SDK, or data library, check its docs for best practices *and* find an existing module in this repo that uses the same library; hold the PR to that established usage, not just to generic style. A house idiom the PR breaks is invisible from the changed file alone — e.g. the repo composes reusable expression-builders and applies them to a caller-owned dataframe in one pass, while the PR rebuilds the frame filter-by-filter inline. Flag the deviation.

### Conventions

If the repo has a `CONVENTIONS.md` / `CLAUDE.md`, check against it. If it doesn't, **judge against the de-facto conventions in the shared-context analogous files** — "there's no written rule" is not a pass; consistency with the surrounding code is the rule. Surface only material deviations.

Severity: quality issues that shelter a bug rank with bugs (the synthesizer moves them); the rest go in the `Code quality` section, most-impactful first, with the smell named where one fits.

## Output format

```
PR #XXX — <name of the PR>

What it does: <one sentence>

Bugs and issues
1. [critical/high] <correctness issue, most-important-first>
2. ...

Code quality
1. [high/medium/low] <smell name — structure / flow / readability finding, most-impactful-first>
2. ...

What might bite you (premortem)
- <0–3 specific failure modes given this design>

Better approach (zoom-out)
<0–1 short paragraph if a meaningfully different shape exists; otherwise omit the entire section>
```
