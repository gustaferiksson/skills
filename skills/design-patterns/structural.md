# Structural Patterns

How to assemble objects and classes into larger structures while keeping them flexible.

Full category page: [refactoring.guru/design-patterns/structural-patterns](https://refactoring.guru/design-patterns/structural-patterns)

Apply the SKILL-level criticism rules before proposing any of these.

## Patterns

- **Adapter** — wrap a class with an incompatible interface so it conforms to the one your callers expect. The default refactor when integrating a third-party SDK whose API doesn't match yours.
  *Minimum viable form:* a single function `adapt(external) => internalShape`. Often that's enough — no class needed.

- **Bridge** — split an abstraction and its implementation into separate hierarchies that evolve independently (e.g. `Shape` ↔ `Renderer`). Use when both axes vary.
  *When to skip:* if only one axis actually varies, you don't have a Bridge problem — you have a single-axis subclass / strategy problem.

- **Composite** — treat individual objects and trees of objects uniformly. Essential for tree-shaped domains (file systems, UI trees, ASTs, organization charts).
  *Test:* if you find yourself writing `if (isLeaf) ... else ...` everywhere, Composite is missing.

- **Decorator** — wrap an object to add behavior (logging, caching, retry, auth) without modifying it or subclassing.
  *Modern note:* higher-order functions decorate functions cleanly — `withRetry(fn)`, `withLogging(fn)`. Reach for the class-based Decorator only when the thing being decorated is genuinely a stateful object with multiple methods.

- **Facade** — a single simplified interface in front of a complex subsystem. The right tool when callers need only 10% of a library's surface and the rest is noise.
  *Test:* if your Facade just forwards every call 1:1, it's a *Middle Man*, not a Facade.

- **Flyweight** — share intrinsic state across many objects to save memory (classic example: text glyphs reusing font metadata). Almost never needed in app code; relevant when you have millions of small objects.

- **Proxy** — a stand-in for another object, controlling access (lazy loading, access control, remote, caching). Different from Decorator (Proxy controls access; Decorator adds behavior).
  *Modern note:* the JS `Proxy` built-in is the literal language feature. ORMs and reactive frameworks (Vue, MobX) use Proxies pervasively under the hood.
