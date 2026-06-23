---
name: ddb-single-table
description: Our house conventions for DynamoDB single-table design — PK/SK key construction, the per-repository KEYS/ACCESS objects, the CoreRepository/CorePartitionRepository pattern, GSI overloading, and entity modeling. Use when designing or editing a DynamoDB data model, adding a new entity or access pattern, writing a repository/data-access class, constructing PK/SK values, or reviewing single-table layout. Builds on Alex DeBrie's single-table design; defer to per-repo CLAUDE.md when it conflicts.
---

# DynamoDB Single-Table Design

How we model data on one DynamoDB table. The reference theory is Alex DeBrie's [single-table design post](https://www.alexdebrie.com/posts/dynamodb-single-table/); this skill is the concrete house style layered on top.

**Defer to the repo first.** If lint rules, CLAUDE.md, or existing repositories show a different convention, follow them. These are defaults.

## The one rule that drives everything: access patterns first

You cannot design keys before you know the queries. Before writing any `KEYS` object:

1. List every read and write the feature needs ("list a pricelist's versions newest-first", "fetch one product by id", "list the products in a group").
2. For each, decide which is the **partition** (the thing you always know) and which is the **sort/filter** (range, prefix, or exact).
3. Only then design PK/SK so each pattern is a single `GetItem` or `Query` — never a `Scan`, never a client-side join.

Adding a *new* access pattern later often means a backfill/ETL over existing items. That cost is the whole reason to do this work up front.

## Table & key conventions

- One table per concern, named `Prefix_{tenantId}` (e.g. `Core_{tenantId}`). The repository owns the name; callers pass `tenantId`.
- Key attributes are **`PK`** and **`SK`**, uppercase. Always both — never PK-only items.
- Secondary indexes are **`GSI1`, `GSI2`, …** with attributes **`GSI1PK` / `GSI1SK`**. We use **GSIs only, no LSIs**.
- Delimiter is **`#`**, applied through `joinKeys`. Never hand-concatenate.
- Segments are `SCREAMING_CASE` literals interleaved with values: `PRICELIST#BASE#{pricelistId}#VERSION#{versionId}`.
- **No discriminator attribute.** The entity type lives *in the PK prefix* — `PRODUCT`, `PRICELIST#BASE#{id}`, `COST_ITEM`. The prefix both identifies the type and scopes IAM access.
- **Leading segment = scope.** Tenant-scoped repos start the PK with the entity-type literal (`PRODUCT`, `PRICELIST#BASE`). Repos scoped to a sub-partition start it with the `partitionId` (`{partitionId}#CAT`, `{partitionId}#DM#FINDING`).
- **Keys are derived, never the source of truth.** Every value embedded in a `PK`/`SK`/`GSI*` key must also be stored as a plain attribute on the item. You should *never* `split("#")` a key to recover a value — read the attribute. Keys exist for access; attributes hold the data.

## The KEYS / ACCESS pattern

Every repository declares a static `KEYS` object: one entry per entity, each with `PK`/`SK` (and any `GSI*`) builder functions. The argument is a **labelled tuple** — literal segments are baked in as string-literal types, variable segments are typed positions. This makes a malformed key a compile error.

```ts
export class PricelistRepository extends CoreRepository {
  readonly GSI2: GSI = { indexName: "GSI2", partitionKey: "GSI2PK", sortKey: "GSI2SK" }

  static readonly KEYS = {
    // All pricelists share one PK so they list together; the id is the SK.
    pricelist: {
      PK: (arr: ["PRICELIST", "BASE"]) => this.joinKeys(arr),
      SK: (arr: [pricelistId: string]) => this.joinKeys(arr),
    },
    // A pricelist's versions live in their own collection, keyed by the parent id.
    pricelistVersion: {
      PK: (arr: ["PRICELIST", "BASE", pricelistId: string]) => this.joinKeys(arr),
      SK: (arr: ["VERSION", pricelistVersionId: string]) => this.joinKeys(arr),
    },
    // A product, plus an overloaded GSI2 that lists the products in a group.
    product: {
      PK: (arr: ["PRODUCT"]) => this.joinKeys(arr),
      SK: (arr: [productId: string]) => this.joinKeys(arr),
      GSI2PK: (arr: ["PRODUCT_GROUP", productGroupId: string, "PRODUCT"]) => this.joinKeys(arr),
      GSI2SK: (arr: [productId: string]) => this.joinKeys(arr),
    },
  }
}
```

Build every key through `KEYS.<entity>.PK([...])` — at the call site, everywhere. There is no other source of key strings.

**Two companion objects:**
- **`RELATION_KEYS`** — junction items for many-to-many relations live in a parallel static object of the same shape, each with an inverted `GSI1` so the relation reads from both sides. See [PATTERNS.md](PATTERNS.md).
- **`ACCESS`** — partition-scoped repos also expose a static `ACCESS` map: the same `PK` builders with `*` in the variable slots, used to mint IAM leading-key / ABAC conditions.
  ```ts
  static readonly ACCESS = { finding: this.KEYS.finding.PK(["*", "DM", "FINDING"]) }  // → "*#DM#FINDING"
  ```

## The repository pattern

- Tenant-scoped repos extend **`CoreRepository`** (gives `client`, `tableName`, and all CRUD primitives).
- Repos scoped to a sub-partition extend **`CorePartitionRepository`**, which adds a `partitionId` field used as the first PK segment.
- Domain types **never carry `PK`/`SK`**. The stored shape is `DDB<T> = PKSK & T`. Keys are added on write and stripped on read with `cleanItem` / `cleanItems`, so callers only ever see the domain entity.
- Per-method scope params (e.g. `userName`) are **method arguments**, not constructor fields, when one repo instance serves many of them.

```ts
async getPricelistVersion(pricelistId: string, pricelistVersionId: string): Promise<PricelistVersion | undefined> {
  const res = await this.get<PricelistVersion>({
    PK: PricelistRepository.KEYS.pricelistVersion.PK(["PRICELIST", "BASE", pricelistId]),
    SK: PricelistRepository.KEYS.pricelistVersion.SK(["VERSION", pricelistVersionId]),
  })
  return this.cleanItem(res.Item)  // strips PK/SK (and GSI keys) → caller sees PricelistVersion
}
```

## Base method vocabulary

Use these primitives instead of constructing AWS commands by hand. They centralise marshalling, conditions, and error mapping.

| Method | Use for |
| --- | --- |
| `get` / `parallelGet` | one item by full key / many by key (coalesces into batch when batching is on) |
| `query` / `queryAll` / `queryPagination` | one page / all pages / cursor-paginated `Query` on PK (+ optional SK condition, optional GSI) |
| `put` | unconditional write (overwrites) |
| `insert` | **create-only** — conditional on key not existing; throws `CoreConflictError` if it does |
| `upsert` / `update` | set fields, creating / requiring-existence respectively; `update` supports `conditions` and `unset` |
| `replace` | full-item overwrite that must already exist |
| `remove` / `delete` | drop named attributes / delete the whole item |
| `listAppend` / `listRemove` | mutate list attributes in place |

Conditions are a typed `Condition[]` (`=`, `<`, `<=`, `>`, `>=`, `<>`, `BEGINS_WITH`, `ATTRIBUTE_NOT_EXISTS`), AND-ed together. SK query conditions use the same shape, commonly `{ operator: "BEGINS_WITH", value: "VERSION#" }`. Conditional-write failures surface as `CoreNotFoundError` / `CoreConflictError`.

## Recipes

For relationship modeling (1:many, many:many), GSI overloading, time-ordered and zero-padded sort keys, windowed counter items, optimistic locking, atomic counters, one-shot claims, and pagination cursors, see [PATTERNS.md](PATTERNS.md).
