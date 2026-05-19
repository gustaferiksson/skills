# Behavioral Patterns

Algorithms and the allocation of responsibility between objects.

Full category page: [refactoring.guru/design-patterns/behavioral-patterns](https://refactoring.guru/design-patterns/behavioral-patterns)

Apply the SKILL-level criticism rules before proposing any of these. Several behavioral patterns are obsoleted by first-class functions, generators, and event emitters in modern languages — flag this when proposing.

## Patterns

- **Chain of Responsibility** — pass a request along a chain of handlers; each decides to handle or forward. Useful for middleware (Express, Koa), validation pipelines, undo stacks of preconditions.
  *Modern note:* an array of handler functions iterated with `for ... of` or `reduce` is the lightweight form.

- **Command** — encapsulate a request as an object so it can be queued, logged, or undone. Useful for command buses, undo/redo, job queues.
  *Modern note:* a closure capturing the operation and its arguments does most of what Command does. Reach for the full pattern when the request must be serialized (queued across processes, persisted, transmitted).

- **Iterator** — traverse a collection without exposing its internal structure.
  *Modern note:* built into the language — implement `Symbol.iterator` or write a generator. There is essentially never a reason to hand-roll an Iterator class in TS/JS.

- **Mediator** — objects communicate through a mediator instead of directly. Reduces N-to-N coupling to N-to-1. Useful when many components need to coordinate (form fields whose validity affects each other, UI controls whose state interlocks).
  *Test:* if components only need one-way notification, you want *Observer*, not Mediator.

- **Memento** — capture an object's state so it can be restored later, without exposing its internals. Foundation for undo systems and snapshot-based time travel.

- **Observer** — define a subscription mechanism so multiple objects react to events on the observed object. The default pattern for decoupling event producers from consumers.
  *Modern note:* `EventEmitter`, the DOM event system, signals (Solid/Preact), and reactive primitives (RxJS, MobX) are all production-grade Observer implementations. Use the platform's version.

- **State** — an object changes behavior when its internal state changes, appearing to change class. Useful when you have a "type code + big switch" smell AND the type changes at runtime.
  *Modern note:* a discriminated union `type State = { kind: 'idle' } | { kind: 'loading', ... } | { kind: 'error', e }` plus a reducer covers most cases without a class hierarchy.

- **Strategy** — define a family of interchangeable algorithms behind a common interface; pick one at runtime.
  *Modern note:* **the canonical "lambda replaces a pattern" case.** A function passed as an argument is Strategy. Don't build a `Context` + `AbstractStrategy` + N concrete classes unless the strategy genuinely owns state.

- **Template Method** — define an algorithm's skeleton in a parent class; subclasses override specific steps without changing the structure. Foundation for many test fixtures (`setUp` / `runTest` / `tearDown`).
  *Modern note:* a function that takes step callbacks (`run({ setUp, body, tearDown })`) is the same idea without inheritance.

- **Visitor** — separate algorithms from the data structures they operate on; add new operations to a class hierarchy without modifying the classes. Useful for tree walkers (ASTs, compilers).
  *Modern note:* if your tree is a discriminated union, a function that pattern-matches on `kind` *is* a Visitor — no Acceptor/Visitor classes needed. Reach for the full pattern only when you can't modify the data types but need to add operations.
