# Composing Methods

Streamline methods, remove duplication, prepare for further refactoring.

Full category page: [refactoring.guru/refactoring/techniques/composing-methods](https://refactoring.guru/refactoring/techniques/composing-methods)

## Techniques

- **Extract Method** — pull a code fragment into a new function with an intention-revealing name. The default refactor for *Long Method* and *Duplicate Code*.
- **Inline Method** — body is as obvious as the name; replace calls with the body.
- **Extract Variable** — name a complex sub-expression with a `const`.
- **Inline Temp** — temporary variable adds nothing the expression doesn't already say; drop it.
- **Replace Temp with Query** — temp holds the result of an expression; turn the expression into a method/function callers invoke directly.
- **Split Temporary Variable** — one variable assigned twice for two purposes; split into two.
- **Remove Assignments to Parameters** — function reassigns its parameter; introduce a local instead. Parameters should be immutable inside the function.
- **Replace Method with Method Object** — long method with many locals that resist *Extract Method* (because each fragment needs many of those locals); promote the method into a class whose fields hold the locals.
- **Substitute Algorithm** — a clearer algorithm exists with the same observable behavior; swap.
