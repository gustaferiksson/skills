---
name: design-patterns
description: Hierarchical catalog of the 23 GoF design patterns (creational, structural, behavioral) — source refactoring.guru. Lets the agent recognize a problem shape, jump to only the relevant category file, and propose the named pattern that fits. Bakes in explicit criticism so patterns aren't applied dogmatically. Use explicitly when the user says "/design-patterns", "/pattern", "what pattern fits here", "name this pattern", "is there a pattern for this", or asks for a named GoF/design pattern. For code smells and Fowler refactorings, use the `/refactor` skill instead.
disable-model-invocation: true
---

# Design Patterns

Catalog of the 23 GoF patterns, organized hierarchically so you load only the category you need. Source: [refactoring.guru/design-patterns/catalog](https://refactoring.guru/design-patterns/catalog).

## Read this BEFORE proposing a pattern

Patterns are descriptions of recurring solutions, not goals. Three failure modes to refuse:

1. **Kludge for a weak language.** Many patterns exist to give underpowered languages first-class concepts they lack. In TypeScript / modern JS, a Strategy is usually a function passed as an argument; a Command is a closure; an Iterator is a generator. **Before proposing a pattern, check whether the language gives you the abstraction for free.** If it does, use the language feature and name it after the pattern only as a comment / mental model.
2. **Dogmatic / "to the letter" application.** Implementing the full canonical UML — `Context`, `AbstractStrategy`, `ConcreteStrategyA/B`, `Director` — when one function and a callback would do is worse than no pattern. Borrow only the part that solves the immediate problem.
3. **Everything looks like a nail.** If the current code is clear and simple, it does not need a pattern. Patterns earn their keep when there is friction (rigidity, duplication, scattered conditionals, expanding feature surface). Without friction, the pattern is overhead.

**The test before you propose a pattern:** can you name a *specific* current pain or a *specific* upcoming change that the pattern relieves? If not, don't propose it.

## How to use

1. **Identify the problem shape** from the user's code or description.
2. **Pick the category file** and load only that one:
   - Creational — object construction problems · [creational.md](creational.md)
   - Structural — composition / wrapping / hierarchies · [structural.md](structural.md)
   - Behavioral — algorithms, responsibility allocation, communication · [behavioral.md](behavioral.md)
3. **Propose by name, with the criticism rules applied.** Output shape below.
4. **Borrow parts, not ceremony.** Default to the minimum that solves the problem.

## Output shape

```
Problem shape: <1 sentence — the actual pain, not "it could use a pattern">
Proposed pattern: <named pattern, e.g. "Strategy">
Modern-language note: <if the language gives this for free, say so>
Minimum viable form: <2–4 bullets — the smallest implementation that solves it>
Skip if: <when the pattern would be overkill for this specific case>
Link: <refactoring.guru URL>
```

## When NOT to use this skill

- The user is choosing a library / framework — that's not a pattern question.
- The code is fine. Refactoring for the sake of patterns is anti-value.
- Small-scale code cleanup — use `/refactor`.
- Architectural module shape — use `/improve-codebase-architecture`.
