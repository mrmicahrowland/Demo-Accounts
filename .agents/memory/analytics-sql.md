---
name: Analytics SQL in Drizzle
description: Using raw sql<> in analytics routes — column naming pitfall with Drizzle ORM.
---

When using Drizzle's `sql<number>` helper in raw aggregate queries (e.g. analytics), use the **actual PostgreSQL column name** (snake_case), not the Drizzle JavaScript property name (camelCase).

**Wrong:** `sql<number>\`coalesce(sum(${invoicesTable.amountPaid}), 0)\``
**Right:** `sql<number>\`coalesce(sum(amount_paid), 0)::float\``

**Why:** `invoicesTable.amountPaid` inside a template literal inserts a Drizzle column reference object, which may not resolve correctly in aggregates. Using the raw SQL column name with PostgreSQL type casts (`::int`, `::float`) is more reliable and avoids ambiguity.

**How to apply:** In any analytics or aggregate route, write raw SQL column names directly and cast the result type explicitly.
