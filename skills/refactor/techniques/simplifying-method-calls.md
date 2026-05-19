# Simplifying Method Calls

Make method signatures and call-sites cleaner.

Full category page: [refactoring.guru/refactoring/techniques/simplifying-method-calls](https://refactoring.guru/refactoring/techniques/simplifying-method-calls)

## Techniques

- **Add Parameter** — function needs additional data; add a parameter rather than reaching for a global or hidden state.
- **Remove Parameter** — parameter no longer used; remove it.
- **Rename Method** — current name misleads or doesn't say what the method does; rename. (Trivial-looking but underused.)
- **Separate Query from Modifier** — function both returns a value and mutates state; split into a getter (pure) and a setter (effect). Make queries safe to call without consequences.
- **Parameterize Method** — multiple methods differ only by a constant; merge them and pass the constant as a parameter.
- **Introduce Parameter Object** — a group of parameters always travels together; pack them into an object. The fix for *Data Clumps* in signatures.
- **Preserve Whole Object** — caller extracts several fields of an object to pass them in; pass the whole object instead.
- **Remove Setting Method** — field shouldn't change after construction; remove the setter so callers can't violate the invariant.
- **Replace Parameter with Explicit Methods** — boolean/enum parameter selects between fundamentally different behaviors; split into separate methods (`renderSync()` / `renderAsync()` not `render(async: boolean)`). Same as `ts-patterns` rule 4.
- **Replace Parameter with Method Call** — caller computes a value just to pass it in; let the callee compute it instead.
- **Hide Method** — method is only used internally; reduce its visibility.
- **Replace Constructor with Factory Method** — constructor does logic, or needs to return different subtypes; expose a static factory method.
- **Replace Error Code with Exception** — function returns numeric/sentinel error codes; throw instead so errors can't be silently ignored.
- **Replace Exception with Test** — exception is being used for a predictable, easily-checkable condition; replace with a precondition test (and reserve exceptions for genuinely exceptional cases).
