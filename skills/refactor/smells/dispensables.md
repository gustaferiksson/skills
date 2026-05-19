# Dispensables

Code whose absence makes the codebase cleaner.

Full category page: [refactoring.guru/refactoring/smells](https://refactoring.guru/refactoring/smells)

## Smells

- **Comments** — comments compensating for unclear code; rewrite the code instead. Fix with *Extract Function* (use the comment as the new function's name), *Rename Method / Variable*, *Introduce Assertion*. (Keep comments that explain *why*, never *what*.)
- **Duplicate Code** — same code appearing in two or more places. Fix with *Extract Function*, *Extract Class*, *Pull Up Method*, *Form Template Method*, *Substitute Algorithm*.
- **Data Class** — class with only fields, getters, and setters; behavior lives elsewhere. Move the behavior to it (*Move Method*); restrict access with *Encapsulate Field*, *Encapsulate Collection*, *Remove Setting Method*.
- **Dead Code** — unused code. Delete it.
- **Lazy Class** — class earns no keep. Fix with *Inline Class*, *Collapse Hierarchy*.
- **Speculative Generality** — abstractions / extension points with no current users. Fix with *Collapse Hierarchy*, *Inline Class*, *Remove Parameter*, *Rename Method*. (One adapter = hypothetical seam; two adapters = real seam.)
