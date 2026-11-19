# Change Preventers

Smells that make a single conceptual change require many edits.

Full category page: [refactoring.guru/refactoring/smells](https://refactoring.guru/refactoring/smells)

## Smells

- **Divergent Change** — one class changes for many unrelated reasons (e.g. both DB schema changes AND UI tweaks edit the same file). Fix with *Extract Class*.
- **Parallel Inheritance Hierarchies** — adding a subclass to one hierarchy forces adding a matching subclass to another. Fix by moving one hierarchy's members into the other and removing it (*Move Method / Move Field*).
- **Shotgun Surgery** — one change requires editing many classes. Opposite of Divergent Change. Fix with *Move Method / Move Field*, *Inline Class*.
