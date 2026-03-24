# asOfSnapshot — Implementation Plan

## Terminology

```
TimelineSpan    →  see Span.md
    ↓
TimelineScope   →  see Scope.md
    ↓
AsOfSnapshot    ←  this file
    ↓
AsOfProjection  →  see Projection.md
    ↓
<Timeline />       pure renderer
```

Four layers of state, each narrowing or transforming the previous:

| Layer | Name | Filtered by | Updates when |
|---|---|---|---|
| 1 | **span** | timespan (`from`/`to`) | zoom changes, app load |
| 2 | **scope** | + navigation node | node selection changes |
| 3 | **snapshot** (`AsOfSnapshot`) | + playhead (`asOf`) | user scrubs timeline |
| 4 | **projection** (`AsOfProjection`) | interpreted at `asOf` | user scrubs timeline |

---

## Goal

When `asOf` changes, derive a **snapshot** — a subset of the scope where each
array is filtered to only events that overlap with the playhead position.

An event overlaps `asOf` if: `event.start <= asOf <= event.end` (unix seconds).

Open/ongoing events (`endedAt` is `undefined`) are always included if they started
before `asOf`.

---

## Step 1 — `AsOfSnapshot` type alias (`src/core/Scope.ts`)

The snapshot has the same shape as `TimelineScope` — it is just filtered.
Add a type alias to communicate semantic role without duplicating the interface:

```ts
export type AsOfSnapshot = TimelineScope;
```

---

## Step 2 — Overlap predicates (`src/components/timeline/timeUtils.ts`)

One generic helper + five typed predicates (one per entity type). These are the
only places that need to know each type's time-range field names.

```ts
function overlapsAsOf(start: number, end: number | undefined, asOf: number): boolean {
    if (start > asOf) return false;
    if (end === undefined) return true;  // open/ongoing event
    return end >= asOf;
}

export const salesOrderAtAsOf      = (e: SalesOrderEntry,      asOf: number) =>
    overlapsAsOf(e.orderDate, e.requestedDeliveryDate, asOf);

export const productionOrderAtAsOf = (e: ProductionOrderEntry, asOf: number) =>
    overlapsAsOf(e.timing.scheduledStart, e.timing.scheduledEnd, asOf);

export const operationAtAsOf       = (e: OperationEntry,       asOf: number) =>
    overlapsAsOf(e.scheduledStart, e.scheduledEnd, asOf);

export const downtimeAtAsOf        = (e: DowntimeEntry,        asOf: number) =>
    overlapsAsOf(e.startedAt, e.endedAt, asOf);

export const workOrderAtAsOf       = (e: WorkOrderEntry,       asOf: number) =>
    overlapsAsOf(e.scheduledStart, e.scheduledEnd, asOf);
```

> **Note:** field names must be verified against the actual types in
> `Scope.ts`, not the API query param names used in the docs.

---

## Step 3 — `useAsOfSnapshot` hook (`src/hooks/useAsOfSnapshot.ts`)

Pure `useMemo` between the scope and the renderer. No store changes — `asOf` is
already in `useTimelineStore`.

```ts
export function useAsOfSnapshot(scope: TimelineScope | null): AsOfSnapshot | null {
    const asOf = useTimelineStore((s) => s.asOf);

    return useMemo(() => {
        if (!scope) return null;
        return {
            level:            scope.level,
            salesOrders:      scope.salesOrders.filter((e) => salesOrderAtAsOf(e, asOf)),
            productionOrders: scope.productionOrders.filter((e) => productionOrderAtAsOf(e, asOf)),
            operations:       scope.operations.filter((e) => operationAtAsOf(e, asOf)),
            downtimeEvents:   scope.downtimeEvents.filter((e) => downtimeAtAsOf(e, asOf)),
            eamWorkOrders:    scope.eamWorkOrders.filter((e) => workOrderAtAsOf(e, asOf)),
        };
    }, [scope, asOf]);
}
```

When the playhead scrubs, only `asOf` changes — the memo re-filters cheaply on
already-scoped flat arrays. The `state` reference is stable between scrubs because
`useScope` only produces a new object when the cache or node changes.

---

## Step 4 — Consumers

The snapshot is **not** consumed by the `<Timeline />` component. The timeline is
a Gantt-style renderer — it shows all events in the timespan as bars and lets the
user see the full picture. The playhead marks `asOf` visually but does not filter
what is rendered. See `timeline.md`.

The snapshot is for consumers that need a point-in-time view:

| Consumer | What it uses |
|---|---|
| Panel KPIs | Counts / statuses of events active at `asOf` |
| 3D highlights | Which machines/cells are running, stopped, or in maintenance at `asOf` |
| Status indicators | Order and operation states as of the playhead |

Call site pattern:

```ts
const { scope } = useScope(node);
const snapshot  = useSnapshot(scope);
```

---

## Out of scope

- `useTimelineStore` — untouched (`asOf` + `setAsOf` already exist)
- No new Zustand slices — snapshot stays a React `useMemo`, not a store selector,
  because `scope` from `useScope` is not in the store
