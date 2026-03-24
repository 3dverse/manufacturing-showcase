# Projection

A `Projection` is an interpreted view of a `Snapshot` at `asOf`. It is the
fourth and final layer:

```
TimelineSpan    →  see Span.md
    ↓
TimelineScope   →  see Scope.md
    ↓
AsOfSnapshot    →  see Snapshot.md
    ↓
AsOfProjection  ←  this file
    ↓
<Timeline />       pure renderer
```

---

## Motivation

The snapshot is faithful — it contains unmodified API data filtered to events
overlapping `asOf`. But API data reflects the *recorded* state, not the
*inferred* state at an arbitrary point in time:

- A production order may have `status: "in_progress"` in the API, but if `asOf`
  is before its scheduled start, it should appear as not yet started.
- A production order has a target quantity; midway through its scheduled window,
  we can estimate how many units are likely completed.
- A downtime event with no `endedAt` is ongoing — its duration at `asOf` can
  be computed.

The projection layer applies these transformations so that the renderer receives
data it can display directly without any business logic of its own.

**The snapshot stays faithful. The projection is opinionated.**

---

## Projected types

Each projected type extends its source entry with computed fields. The original
fields are preserved — the projection adds, it does not replace.

```ts
type ProjectedProductionOrder = ProductionOrderEntry & {
    phase:               "completed" | "active" | "future";
    estimatedProgress:   number;         // 0–1, interpolated at asOf
    estimatedCompleted:  number;         // interpolated unit count (if targetQty known)
};

type ProjectedOperation = OperationEntry & {
    phase:             "completed" | "active" | "future";
    estimatedProgress: number;           // 0–1, interpolated at asOf
};

type ProjectedDowntime = DowntimeEntry & {
    durationAtAsOf: number;              // seconds elapsed as of asOf
    isOngoing:      boolean;             // endedAt is undefined or endedAt > asOf
};

type ProjectedWorkOrder = WorkOrderEntry & {
    phase:      "completed" | "active" | "future";
    isOverdue:  boolean;                 // asOf > scheduledEnd and not completed
};

type ProjectedSalesOrder = SalesOrderEntry & {
    isOverdue:  boolean;                 // asOf > requestedDeliveryDate and not shipped
};
```

```ts
type AsOfProjection = {
    level:            TimelineLevel;
    salesOrders:      ProjectedSalesOrder[];
    productionOrders: ProjectedProductionOrder[];
    operations:       ProjectedOperation[];
    downtimeEvents:   ProjectedDowntime[];
    eamWorkOrders:    ProjectedWorkOrder[];
};
```

---

## Transformation rules

### Phase (ProductionOrder, Operation, WorkOrder)

Prefer actual times over scheduled when available.

| Condition | Phase |
|---|---|
| `actualEnd` exists and `actualEnd <= asOf` | `completed` |
| `actualStart` exists and `actualStart <= asOf` | `active` |
| `scheduledStart <= asOf` | `active` |
| `scheduledStart > asOf` | `future` |

### Progress interpolation (ProductionOrder, Operation)

Only meaningful when `phase === "active"`.

```
effectiveStart = actualStart ?? scheduledStart
effectiveEnd   = actualEnd   ?? scheduledEnd
progress       = clamp((asOf - effectiveStart) / (effectiveEnd - effectiveStart), 0, 1)
```

For `ProductionOrder`, if `targetQty` is available:
```
estimatedCompleted = round(targetQty * progress)
```

Progress interpolation is a linear estimate. It does not account for variable
production rates, breaks, or shifts. It is useful as a soft signal, not a
precise count.

### Downtime duration

```
durationAtAsOf = (endedAt ?? asOf) - startedAt
isOngoing      = endedAt === undefined || endedAt > asOf
```

### Overdue (SalesOrder, WorkOrder)

```ts
// SalesOrder
isOverdue = asOf > requestedDeliveryDate && status !== "shipped"

// WorkOrder
isOverdue = asOf > scheduledEnd && !actualEnd
```

---

## Implementation

```
src/core/Projection.ts      — projected types + pure projectSnapshot(snapshot, asOf) function
src/hooks/useProjection.ts  — useMemo wrapper: useProjection(snapshot) → AsOfProjection | null
```

`projectSnapshot` is a pure function of `(snapshot, asOf)` — no async, no
side effects, no React. It maps each array through its respective projection
function.

`useProjection` reads `asOf` from `useTimelineStore` and memoises on
`[snapshot, asOf]`. Since `snapshot` is already stable between scrubs (it
only changes when the scope changes), the projection re-runs only when the
playhead moves — which is cheap given the arrays are already small.

---

## What moves out of the renderer

With this layer in place, `Timeline.tsx` no longer needs to:

- Import `classifyPhase` from `@/core/Scope` — phase is on the entry
- Import NavGraph helpers (`isFactory`, etc.) for `levelFromNode` — level
  comes from the projection
- Compute `actualStart ?? scheduledStart` inline in story builders — effective
  start/end are pre-computed in the projection

Story builders become field reads, not transformations.
