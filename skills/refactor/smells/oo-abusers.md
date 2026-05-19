# Object-Orientation Abusers

Incomplete or wrong application of OO principles.

Full category page: [refactoring.guru/refactoring/smells](https://refactoring.guru/refactoring/smells)

## Smells

- **Alternative Classes with Different Interfaces** — two classes do similar things via different APIs. Fix with *Rename Method*, *Move Method*, *Extract Superclass*.
- **Refused Bequest** — subclass barely uses inherited members; inheritance is wrong here. Fix with *Push Down Field / Method*, or *Replace Inheritance with Delegation*.
- **Switch Statements** — switching on a type code, especially the same switch repeated. Often a missing polymorphism. Fix with *Replace Conditional with Polymorphism*, *Replace Type Code with Subclasses* / *with State/Strategy*, *Replace Parameter with Explicit Methods*, *Introduce Null Object*.
- **Temporary Field** — field used only in some scenarios, empty otherwise. Extract a class for the case where it's used.
