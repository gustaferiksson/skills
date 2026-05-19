---
name: refactor
description: Hierarchical catalog of code smells and Fowler-style refactoring techniques (source — refactoring.guru). Lets the agent diagnose a smell, jump to only the relevant category file, and propose the named refactoring that fixes it. Use explicitly when the user says "/refactor", "refactor this", "find a code smell", "name the smell here", "what refactoring fits", or asks for a named Fowler refactoring. For named design patterns (Strategy, Builder, Observer, etc.), use the `/design-patterns` skill instead. Do not auto-fire on every code change.
disable-model-invocation: true
---

# Refactor

Catalog of code smells and refactoring techniques, sourced from [refactoring.guru](https://refactoring.guru/refactoring/catalog). Organized hierarchically so you only load the category you need — don't read every leaf file.

## How to use

1. **Look at the code or the user's description. Pick a smell category.** Load only that one file.
2. **Identify the named smell.** Use the canonical name when reporting it.
3. **Pick the matching technique category.** Load only that one file.
4. **Propose the named refactoring** with a 1-sentence "why" and a 2–4-bullet "what changes."
5. **Borrow parts, not ceremony.** Use the piece that solves the immediate problem. Don't apply the full canonical technique if a fragment fixes the smell.
6. **Name before refactor.** State the smell or the chosen technique first, then propose the edit. No autopilot refactors.

## Smells (load one)

- **Bloaters** — code/methods/classes too big · [smells/bloaters.md](smells/bloaters.md)
- **Object-Orientation Abusers** — incomplete or wrong OO · [smells/oo-abusers.md](smells/oo-abusers.md)
- **Change Preventers** — one change cascades into many · [smells/change-preventers.md](smells/change-preventers.md)
- **Dispensables** — pointless code whose removal improves clarity · [smells/dispensables.md](smells/dispensables.md)
- **Couplers** — excessive coupling between classes · [smells/couplers.md](smells/couplers.md)

Full smells index: [refactoring.guru/refactoring/smells](https://refactoring.guru/refactoring/smells)

## Techniques (load one)

- **Composing Methods** — extract/inline, method shape · [techniques/composing-methods.md](techniques/composing-methods.md)
- **Moving Features Between Objects** — relocate methods/fields/classes · [techniques/moving-features.md](techniques/moving-features.md)
- **Organizing Data** — primitives→objects, encapsulation, type codes · [techniques/organizing-data.md](techniques/organizing-data.md)
- **Simplifying Conditional Expressions** — flatten and decompose · [techniques/simplifying-conditionals.md](techniques/simplifying-conditionals.md)
- **Simplifying Method Calls** — signatures, parameter objects · [techniques/simplifying-method-calls.md](techniques/simplifying-method-calls.md)
- **Dealing with Generalization** — inheritance shape, hierarchies · [techniques/dealing-with-generalization.md](techniques/dealing-with-generalization.md)

Full techniques index: [refactoring.guru/refactoring/techniques](https://refactoring.guru/refactoring/techniques)

## When NOT to use this skill

- Trivial cleanup (rename, retype, typo) — doesn't need a named refactoring.
- Code that's already clear. The catalog fixes friction, not vibes.
- Architectural-level moves (deep modules, seams) — use `/improve-codebase-architecture`.
- Feature work — use `/tdd`. Refactor lives at the green step.

## Output shape

```
Smell: <named smell, e.g. "Long Method">
Technique: <named refactoring, e.g. "Extract Function">
Why: <1 sentence — what gets better>
What changes:
- <bullet>
- <bullet>
Link: <refactoring.guru URL if the user wants the full technique>
```
