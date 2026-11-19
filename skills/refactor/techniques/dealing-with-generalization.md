# Dealing with Generalization

Move members up/down inheritance trees; convert between inheritance and delegation.

Full category page: [refactoring.guru/refactoring/techniques/dealing-with-generalization](https://refactoring.guru/refactoring/techniques/dealing-with-generalization)

## Techniques

- **Pull Up Field** — same field on sibling subclasses; move to the parent.
- **Pull Up Method** — same method on sibling subclasses; move to the parent. The fix for *Duplicate Code* across subclasses.
- **Pull Up Constructor Body** — subclass constructors share initialization code; move the shared part into the parent constructor.
- **Push Down Field** — field used by only one subclass; move down to that subclass.
- **Push Down Method** — method used by only one subclass; move down. The fix for *Refused Bequest*.
- **Extract Subclass** — class has behavior that only applies to some instances; introduce a subclass for those.
- **Extract Superclass** — two classes share members; pull commonality into a parent class.
- **Extract Interface** — multiple classes share a slice of API used by some callers; extract an interface so callers depend on the slice, not the classes.
- **Collapse Hierarchy** — superclass and subclass are nearly identical; merge them. The fix for *Lazy Class* in an inheritance tree.
- **Form Template Method** — sibling subclasses run the same algorithm shape with different steps; lift the skeleton into the parent and override the steps. Implements the Template Method pattern.
- **Replace Inheritance with Delegation** — subclass uses little of its parent (or worse, inherits things it doesn't want). Hold the parent as a field; delegate where appropriate. The fix for *Refused Bequest*.
- **Replace Delegation with Inheritance** — class delegates to another and re-exposes nearly all its methods; inherit instead. (Rare — only when the relationship is genuinely is-a.)
