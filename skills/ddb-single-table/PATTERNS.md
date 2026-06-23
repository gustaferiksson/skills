# Modeling & Access-Pattern Recipes

Concrete recipes for the access patterns that recur in our data models. Each pairs a key layout with the query that reads it. All keys are built through the repository's static `KEYS` / `RELATION_KEYS` objects (see [SKILL.md](SKILL.md)).

## One-to-many: item collections

A "many" collection shares a PK; you list it with one `Query`. There are two common shapes:

**All entities of a type in one partition** — list them together:

```ts
// pricelist: PK ["PRICELIST","BASE"]  SK [pricelistId]
PK: KEYS.pricelist.PK(["PRICELIST", "BASE"])   // every pricelist shares this PK
SK: KEYS.pricelist.SK([pricelistId])           // one per id
```

**Children keyed by the parent id** — the parent id is embedded in the children's PK, so each parent owns its own partition:

```ts
// pricelistVersion: PK ["PRICELIST","BASE",pricelistId]  SK ["VERSION",versionId]
PK: KEYS.pricelistVersion.PK(["PRICELIST", "BASE", pricelistId])
SK: KEYS.pricelistVersion.SK(["VERSION", pricelistVersionId])
```

List one pricelist's versions, newest-first, paginated:

```ts
const res = await this.queryPagination<PricelistVersion>({
  PK: KEYS.pricelistVersion.PK(["PRICELIST", "BASE", pricelistId]),
  SK: { operator: "BEGINS_WITH" as const, value: KEYS.pricelistVersion.SK(["VERSION", ""]) },
  options: { cursor, limit, order: "desc", strictLimit: true },
})
const pricelistVersions = this.cleanItems(res.Items) ?? []
```

Note the `BEGINS_WITH` value is itself built through `KEYS` (`VERSION#`), not a hand-typed string.

## Sortable sort keys: time-ordered and zero-padded

The SK is the only thing you can range-query, so encode *what you sort by* into it, leftmost-significant.

- **Time-ordered:** put an ISO-8601 timestamp as the first variable SK segment. A descending query (`order: "desc"`, `limit: 1`) then returns the most recent with no separate "latest pointer".
- **Zero-padded sequence:** numbers sort lexically, so pad them — `String(n).padStart(6, "0")`. `…#000007` sorts before `…#000012`; unpadded `7`/`12` would not. Use this for any monotonic counter you sort on (a line number, a revision index).

## GSI overloading & sparse indexes

A GSI is a *second access pattern over the same items*, not a second table. Two rules:

- **Overload it.** Reuse `GSI2PK`/`GSI2SK` for unrelated entities, each with its own prefix vocabulary, exactly like the main table. E.g. `product` puts group membership on GSI2 so "list products in a group" is one query:

```ts
// product: GSI2PK ["PRODUCT_GROUP",productGroupId,"PRODUCT"]  GSI2SK [productId]
PK: KEYS.product.GSI2PK(["PRODUCT_GROUP", productGroupId, "PRODUCT"])
SK: { operator: "BEGINS_WITH" as const, value: KEYS.product.GSI2SK([""]) }
options: { index: this.GSI2 }
```

- **Keep it sparse.** Only write the GSI attributes on items you want indexed; items lacking them never appear in the GSI — that *is* the filter. The classic use is an "error" index: write `GSI3PK`/`GSI3SK` **only when the item is in an error state**, so a single query over the GSI returns exactly the failed items.

```ts
// costItem: GSI3PK ["COST_ITEM"]  GSI3SK ["ERROR", costItemId] — written only on error
const isError = item.latestCalculatedCostError != null
const errorKeys = isError && {
  GSI3PK: KEYS.costItem.GSI3PK(["COST_ITEM"]),
  GSI3SK: KEYS.costItem.GSI3SK(["ERROR", item.costItemId]),
}
await this.insert<CostItem & Partial<GSI3Keys>>({
  PK: KEYS.costItem.PK(["COST_ITEM"]),
  SK: KEYS.costItem.SK([item.costItemId]),
  item: { ...item, ...errorKeys },   // GSI3 keys present ⇒ row shows up in the error index
})
```

When an indexed value changes, recompute and write the new GSI key in the same `update` (or drop it when the condition no longer holds) so the index stays consistent. Always strip GSI keys on read with the overridden `cleanItem`.

## Many-to-many: one junction item, inverted GSI

Model the relation as its own item in `RELATION_KEYS`: PK is one side, SK the other, and `GSI1` carries the **inverse** (GSI1PK/GSI1SK with the sides swapped). One item, queryable both directions — no duplicate write.

```ts
// RELATION_KEYS.bomItemCostItem
PK:     (["BOM_ITEM", bomItemId])              SK:     (["COST_ITEM", costItemId])
GSI1PK: (["COST_ITEM", costItemId])            GSI1SK: (["BOM_ITEM", bomItemId])

// Write the junction once, with both forward and inverse keys:
await this.insert<BomItemCostItemRelation & GSI1Keys>({
  PK: RELATION_KEYS.bomItemCostItem.PK(["BOM_ITEM", item.bomItemId]),
  SK: RELATION_KEYS.bomItemCostItem.SK(["COST_ITEM", item.costItemId]),
  item: {
    ...item,
    GSI1PK: RELATION_KEYS.bomItemCostItem.GSI1PK(["COST_ITEM", item.costItemId]),
    GSI1SK: RELATION_KEYS.bomItemCostItem.GSI1SK(["BOM_ITEM", item.bomItemId]),
  },
})
```

- "Cost items for a BOM item" → `Query` PK on the main table.
- "BOM items using a cost item" → `Query` GSI1PK with `options.index: this.GSI1`.

## Windowed counter items

For per-period aggregates (a monthly or daily rollup), put the **window start in the SK** so each period is its own preserved item — a new period is just a new key, no rollover logic.

```ts
function monthStart(now: Date): string {  // UTC calendar-month start
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`
}
PK: KEYS.usage.PK(["USAGE", subjectId])
SK: KEYS.usage.SK(["USAGE", monthStart(now)])
```

## Atomic counters

Concurrent writers must not lose updates. Use DynamoDB's `ADD` (read-modify-write in one atomic op), which also creates the item on first use — don't read-then-put.

```ts
new UpdateCommand({
  TableName: this.tableName,
  Key: { PK, SK },
  UpdateExpression: "ADD #n :n SET #ua = :ua",
  ExpressionAttributeNames: { "#n": "count", "#ua": "updatedAt" },
  ExpressionAttributeValues: { ":n": delta, ":ua": now.toISOString() },
})
```

## Optimistic locking

Guard against lost updates on read-modify-write by versioning. Store a `Version`, write a fresh one each `put`, and condition on the value you read:

```ts
const previous = entity.Version ?? "n/a"
entity.Version = randomUUID()
new PutCommand({
  TableName, Item: entity,
  ConditionExpression: "Version = :v OR attribute_not_exists(Version)",
  ExpressionAttributeValues: { ":v": previous },
})  // ConditionalCheckFailed → someone else wrote first
```

## One-shot claim / idempotency guard

To ensure exactly-one execution (a job lease, an idempotent trigger), `insert` a claim item — `insert` is conditional on the key not existing, so the first writer wins and the rest get `CoreConflictError`. Add a TTL and a staleness check so a dead holder's claim can be taken over via a conditional `update` on the value you observed.

## Pagination cursors

Use `queryPagination` and pass `nextCursor` back as `options.cursor`. Cursors are opaque base64-encoded `LastEvaluatedKey`s — return them to clients as strings, never expose raw keys. `strictLimit: true` keeps fetching across pages until `limit` items are collected (default 100); `false` does a single query.

## What not to do

- **No `Scan` for application reads.** A scan in a read path means the key design missed an access pattern — add a GSI instead. (Rare admin/migration scans with a `ProjectionExpression` are the only exception.)
- **No client-side joins.** Co-locate related items in one collection or denormalize; that is the point of single-table.
- **No raw key strings.** Always go through `KEYS` / `RELATION_KEYS`, so the labelled tuples catch malformed keys at compile time.
- **Never parse a key.** No `split("#")`, no substring of a `PK`/`SK`/`GSI*` to recover a value — every key segment is also a plain attribute on the item, so read the attribute. Keys are write-once for access; attributes are the data. When building an item, set the attributes *and* the keys from the same source values (e.g. write `productId` as a field even though it is also in the SK), so the two can never disagree.
- **No new access pattern without checking backfill.** Changing a key layout strands existing items; plan the migration before shipping the schema change.
