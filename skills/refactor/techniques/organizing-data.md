# Organizing Data

Replace raw primitives with richer types; tighten access; untangle associations.

Full category page: [refactoring.guru/refactoring/techniques/organizing-data](https://refactoring.guru/refactoring/techniques/organizing-data)

## Techniques

- **Change Value to Reference** — many equal instances should be the same instance (identity matters); introduce a registry/factory that returns the canonical one.
- **Change Reference to Value** — small immutable object treated by reference; treat as value (equality by content).
- **Duplicate Observed Data** — domain data lives in a UI/presentation class; duplicate into the domain layer and notify the UI via observer.
- **Self Encapsulate Field** — direct field access scattered around; route through getter/setter (groundwork for *Replace Type Code* / subclassing).
- **Replace Data Value with Object** — a primitive (string, number) carries domain meaning and behavior; wrap it in a class. The fix for *Primitive Obsession*.
- **Replace Array with Object** — array slots have different meanings (`arr[0]` is the name, `arr[1]` is the score); make an object/class.
- **Change Unidirectional Association to Bidirectional** — need to navigate the other way too; add the back-pointer.
- **Change Bidirectional Association to Unidirectional** — one direction is unused; drop it to reduce coupling. The fix for *Inappropriate Intimacy*.
- **Encapsulate Field** — public field; make it private and add accessors (or use getters/setters).
- **Encapsulate Collection** — exposing a mutable collection lets callers break invariants; return readonly + provide `add`/`remove` methods.
- **Replace Magic Number with Symbolic Constant** — name the literal.
- **Replace Type Code with Class** — int/string "kind" field with no behavior attached; turn into a type class to gain type-safety.
- **Replace Type Code with Subclasses** — type code drives conditional behavior; create a subclass per code. Often paired with *Replace Conditional with Polymorphism*.
- **Replace Type Code with State/Strategy** — type code drives behavior AND can change at runtime; use the State or Strategy pattern.
- **Replace Subclass with Fields** — subclasses differ only by constants returned from methods; collapse into one class with fields.
