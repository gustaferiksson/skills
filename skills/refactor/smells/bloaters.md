# Bloaters

Code, methods, and classes that have grown to unwieldy size. Usually accumulated over time.

Full category page: [refactoring.guru/smells](https://refactoring.guru/refactoring/smells) (see "Bloaters" section)

## Smells

- **Long Method** — function tries to do too much. Hard to read, hard to test. Fix with *Extract Function*; consider *Replace Temp with Query*, *Introduce Parameter Object*, *Preserve Whole Object*, *Replace Method with Method Object*, *Decompose Conditional*.
- **Large Class** — class accumulates too many fields and methods, often violating SRP. Fix with *Extract Class*, *Extract Subclass*, *Extract Interface*.
- **Primitive Obsession** — domain concepts (IDs, money, status) represented as raw primitives, so any two values of the same primitive type silently interchange. Fix with *Replace Data Value with Object*, *Replace Type Code with Subclasses* / *with State/Strategy*, *Introduce Parameter Object*. (TS: branded types are the lightweight version.)
- **Long Parameter List** — too many parameters; caller has to know too much to invoke. Fix with *Replace Parameter with Method Call*, *Preserve Whole Object*, *Introduce Parameter Object*.
- **Data Clumps** — the same group of fields/parameters appears together repeatedly. They want to be a class. Fix with *Extract Class*, *Introduce Parameter Object*, *Preserve Whole Object*.
