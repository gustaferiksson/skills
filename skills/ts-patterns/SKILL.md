---
name: ts-patterns
description: "Personal TypeScript architectural defaults applied to any TS Claude writes for the user. Forbids `any`, unsafe `as` casts, `enum`, and boolean-flag parameters. Prefers `type` over `interface` (except React function component props), functions over classes, discriminated unions with a `: never` exhaustiveness guard, and named design patterns where they fit. Stays library-agnostic. Use when writing or editing TypeScript (`.ts`/`.tsx` files) or producing TS code, including React components. General structure/flow/readability rules (const, early exits, no duplication) live in the global coding principles, not here. Defer to per-repo CLAUDE.md or established conventions when they conflict."
---

# TypeScript Patterns

Personal *TS-architectural* defaults — type safety, type modelling, and interface shape. The general structure/flow/readability bar (`const` over `let`, early exits, straight control flow, small-abstraction-over-duplication) lives in the global coding principles and applies to all code; this skill covers only what is TypeScript-specific.

**Defer to the repo first.** If this repo has a CLAUDE.md, a style guide, lint rules, or visibly established conventions that conflict with these rules, follow the repo. These are personal defaults, not overrides.

## Rules

### 1. No `any`. No unsafe `as` casts.

`any` is forbidden. `as` is only acceptable when narrowing a type the compiler can't infer (e.g. `const el = ref.current as HTMLInputElement` after a runtime check). Reach for `unknown` + a type guard before reaching for `as`.

### 2. No `enum`. Use `as const` objects or string literal unions.

```ts
// No
enum Status { Active, Inactive }

// Yes — when you need both the type and the values
const Status = { active: 'active', inactive: 'inactive' } as const;
type Status = typeof Status[keyof typeof Status];

// Yes — when you just need the type
type Status = 'active' | 'inactive';
```

### 3. `type` over `interface` — except React function component props.

```ts
// Yes — React props
interface ButtonProps { label: string; onClick: () => void }

// Yes — everywhere else
type User = { id: string; name: string };
type Handler = (e: Event) => void;
```

Reason for the exception: hover/error messages render props more cleanly as `interface` in IDEs.

### 4. No boolean-flag-soup parameters.

```ts
// No
function send(msg: string, isPublic: boolean, skipCache: boolean, retry: boolean) {}

// Yes — options object
function send(msg: string, opts: { isPublic?: boolean; skipCache?: boolean; retry?: boolean }) {}

// Better — discriminated union when flags are mutually exclusive
type SendMode = { kind: 'public' } | { kind: 'private'; encryptionKey: string };
```

Rule of thumb: two booleans in a signature is a warning; three is a refactor.

### 5. Functions and closures first. Classes when state or identity earns it.

Default to functions and closures. Reach for a class when:
- The thing has identity (`instanceof` matters)
- It owns mutable state across method calls
- A consumer expects an OO shape (extending a framework base class, registering an event handler with a stable `this`)

Don't write "service" classes that hold no state — that's a namespace, write functions instead.

### 6. Model unions exhaustively with a `: never` guard.

When branching over every member of a discriminated or string-literal union, end the `if`/`else if` chain by assigning the unhandled value to a `: never` binding, so adding a variant later is a compile error:

```ts
function area(shape: Shape): number {
  if (shape.kind === 'circle') return Math.PI * shape.r ** 2;
  if (shape.kind === 'square') return shape.side ** 2;
  const _exhaustive: never = shape;
  throw new Error(`unhandled: ${JSON.stringify(_exhaustive)}`);
}
```

This gets exhaustiveness without a `switch`. (General preference for `if` over `switch` is in the global coding principles.)

### 7. Reach for named design patterns when they fit.

When the shape of a problem matches a known pattern (Builder, Strategy, Adapter, Factory, Observer, etc.), name it and use the part that helps. Don't ceremony the whole pattern when only one piece is needed — borrow the Builder's fluent chain without inventing a `Director` class.

## Library agnostic

Do not introduce libraries (Zod, ts-pattern, neverthrow, Effect, ts-reset, etc.) unless they are already in this project. Use what's there. If validation is needed at a boundary and no library is in use, write a hand-rolled type guard and flag it for the user to swap in a library later.

## Defaults I picked — flip any you disagree with

These weren't asked but had to be decided:

- **Named exports** over default exports
- **`const` arrow functions** for module-level definitions; `function` declarations only when hoisting matters
- **`async`/`await`** over `.then()` chains
- **Strict tsconfig assumed** (`strict: true`, `noUncheckedIndexedAccess: true`)
