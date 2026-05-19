---
name: ts-patterns
description: Personal TypeScript defaults applied to any TS Claude writes for the user. Forbids `any`, unsafe `as` casts, `enum`, and boolean-flag parameters. Prefers `type` over `interface` (except React function component props), functions over classes, early exits over nested conditionals, `if` over `switch`, and named design patterns where they fit. Stays library-agnostic. Use when writing or editing TypeScript (`.ts`/`.tsx` files) or producing TS code, including React components. Defer to per-repo CLAUDE.md or established conventions when they conflict.
---

# TypeScript Patterns

Personal defaults for any TS code written for the user.

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

### 6. Early exits. Guard clauses. No conditional pyramids.

```ts
// No
function process(user: User | null) {
  if (user) {
    if (user.isActive) {
      if (user.balance > 0) {
        // ...
      }
    }
  }
}

// Yes
function process(user: User | null) {
  if (!user) return;
  if (!user.isActive) return;
  if (user.balance <= 0) return;
  // ...
}
```

### 7. `if` over `switch`.

Default to `if` / early-return chains. `switch` earns its place rarely — only for a long flat enumeration where reading top-to-bottom genuinely helps. If you're reaching for `switch` to get exhaustiveness checking, an `if`/`else if` chain ending in `: never` does the same job.

### 8. Reach for named design patterns when they fit.

When the shape of a problem matches a known pattern (Builder, Strategy, Adapter, Factory, Observer, etc.), name it and use the part that helps. Don't ceremony the whole pattern when only one piece is needed — borrow the Builder's fluent chain without inventing a `Director` class.

### 9. `const` everywhere. `let` only when something genuinely mutates.

Default to `const`. Reach for `let` only when the binding actually changes after declaration (accumulator in a loop, swap, lazy assignment after a branch). If you find yourself reaching for `let` to "set it up first", that's usually a sign the value should be computed in one expression — extract a helper or use a ternary.

## Library agnostic

Do not introduce libraries (Zod, ts-pattern, neverthrow, Effect, ts-reset, etc.) unless they are already in this project. Use what's there. If validation is needed at a boundary and no library is in use, write a hand-rolled type guard and flag it for the user to swap in a library later.

## Defaults I picked — flip any you disagree with

These weren't asked but had to be decided:

- **Named exports** over default exports
- **`const` arrow functions** for module-level definitions; `function` declarations only when hoisting matters
- **`async`/`await`** over `.then()` chains
- **No comments** unless the WHY is non-obvious (the *why*, not the *what*)
- **Strict tsconfig assumed** (`strict: true`, `noUncheckedIndexedAccess: true`)
