# Couplers

Excessive coupling between classes — or the symptoms of replacing coupling with too much delegation.

Full category page: [refactoring.guru/refactoring/smells](https://refactoring.guru/refactoring/smells)

## Smells

- **Feature Envy** — method uses another class's data more than its own. The method is in the wrong place. Fix with *Move Method*, *Extract Method* + *Move Method*.
- **Inappropriate Intimacy** — two classes know too much about each other's internals. Fix with *Move Method / Field*, *Change Bidirectional Association to Unidirectional*, *Replace Inheritance with Delegation*, *Hide Delegate*.
- **Incomplete Library Class** — a third-party class doesn't expose what you need and you can't modify it. Fix with *Introduce Foreign Method* (free function taking the library type), *Introduce Local Extension* (subclass or wrapper).
- **Message Chains** — `a.getB().getC().getD()`. Caller depends on the whole graph. Fix with *Hide Delegate*. (Sometimes the chain is fine; the smell is when the chain leaks intermediate types into many callers.)
- **Middle Man** — class only forwards calls to another. Fix with *Remove Middle Man*, *Inline Method*, *Replace Delegation with Inheritance*.
