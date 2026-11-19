# Moving Features Between Objects

Move functionality safely between classes; hide internals; create new classes when responsibilities cluster.

Full category page: [refactoring.guru/refactoring/techniques/moving-features-between-objects](https://refactoring.guru/refactoring/techniques/moving-features-between-objects)

## Techniques

- **Move Method** — method uses another class's data more than its own; move it where the data lives. The fix for *Feature Envy*.
- **Move Field** — field is used more by another class than its owner; move it.
- **Extract Class** — class has multiple responsibilities; split into two collaborating classes. The fix for *Large Class* and *Divergent Change*.
- **Inline Class** — class doesn't carry its weight; fold its fields/methods into a collaborator. The fix for *Lazy Class*.
- **Hide Delegate** — caller chains `a.getB().do()`; expose `a.do()` on the front and hide the chain. The fix for *Message Chains*.
- **Remove Middle Man** — class only forwards to another; let callers go direct. The fix for *Middle Man*. (Inverse of *Hide Delegate*.)
- **Introduce Foreign Method** — you need a method on a class you can't modify; write a free function that takes the class as a parameter.
- **Introduce Local Extension** — you need many additions to a class you can't modify; create a subclass or wrapper that adds them.
