# Simplifying Conditional Expressions

Flatten, decompose, and remove conditional bloat.

Full category page: [refactoring.guru/refactoring/techniques/simplifying-conditional-expressions](https://refactoring.guru/refactoring/techniques/simplifying-conditional-expressions)

## Techniques

- **Consolidate Conditional Expression** — multiple `if`s with the same body; combine with `||` / `&&`.
- **Consolidate Duplicate Conditional Fragments** — same code at the start (or end) of every branch; pull it out of the conditional.
- **Decompose Conditional** — long boolean test in an `if`; extract the condition and each branch into named functions. Improves readability when the test itself is the puzzle.
- **Replace Conditional with Polymorphism** — `if`/`switch` dispatches behavior by type; move each branch onto its own subclass or strategy. The fix for *Switch Statements* when the same switch appears in many places.
- **Remove Control Flag** — flag variable governs loop or branch progression; use `break`, `return`, or restructure.
- **Replace Nested Conditional with Guard Clauses** — pyramid of `if`s; early-return the unhappy paths so the happy path is flat. (See also `ts-patterns` rule 6.)
- **Introduce Null Object** — `if (x === null)` checks scattered across the code; replace `null` with a typed object whose methods are no-ops or sane defaults.
- **Introduce Assertion** — an implicit precondition (e.g. "this function assumes the user is logged in") becomes an explicit runtime check.
