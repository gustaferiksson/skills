# Creational Patterns

Object-construction mechanisms that increase flexibility and reuse.

Full category page: [refactoring.guru/design-patterns/creational-patterns](https://refactoring.guru/design-patterns/creational-patterns)

Apply the SKILL-level criticism rules before proposing any of these.

## Patterns

- **Factory Method** — define an interface for creating an object, but let subclasses choose the concrete type. Use when a class can't know in advance which subtype it needs.
  *Modern note:* often replaced by a function that takes a "kind" parameter and returns the right concrete type — no class hierarchy needed.

- **Abstract Factory** — create families of related objects without specifying concrete classes (e.g. a `UIKit` whose `createButton()` + `createDialog()` always match the platform).
  *Modern note:* a config object holding factory functions does the job without a class hierarchy.

- **Builder** — construct a complex object step by step with a fluent chain. Useful when an object has many optional configuration steps and you want call-sites to read top-down.
  *Modern note:* in TS, an options object plus sensible defaults often beats a Builder. Reach for Builder only when (a) configuration is non-trivial AND order matters, or (b) you genuinely want a fluent API as part of the public surface.

- **Prototype** — copy an existing object as a starting point without depending on its concrete class. Useful when construction is expensive or you want to clone runtime configurations.
  *Modern note:* `structuredClone(obj)` or spreading covers most cases; a Prototype class is rarely needed.

- **Singleton** — exactly one instance, globally accessible. **Usually a smell.** Hidden global state breaks tests, defeats DI, and assumes single-tenancy. Use only when the resource is genuinely unique to the process (a hardware connection, a true app-wide config) AND swapping for tests is not required.
  *Modern note:* a module-level `const` in an ES module is already a Singleton without ceremony. If you can't justify Singleton over that, you don't need the pattern.
