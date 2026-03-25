# CorrelatedSet

A `CorrelatedSet` is a relational view over a `Projection`. It is the fifth
and final layer:

```
TimelineSpan    →  see Span.md
    ↓
TimelineScope   →  see Scope.md
    ↓
AsOfSnapshot    →  see Snapshot.md
    ↓
AsOfProjection  →  see Projection.md
    ↓
CorrelatedSet  ←  this file
    ↓
<Timeline />       highlight state per bar
```

---

## Motivation

The projection gives us a flat list of sales orders, production orders,
operations, downtime events, and work orders. When the user hovers any one of
them, we want to highlight everything that is relationally linked to it, and
dim everything that is not.

The correlation layer builds reverse-lookup indexes from the projection and
answers the question: *given this focused entity, which other entities are
related?*

---

## Data model

```
SalesOrder ──erpSalesOrderId──▶ ProductionOrder
                                    │
                          ┌─────────┼─────────────┐
                          ▼         ▼              ▼
                      Operation  Downtime    WorkOrder
                                (productionOrderId) (mesProductionOrderId)
```

All links are one-to-many from the PO side:

| Link | Field |
|---|---|
| PO → SO | `ProductionOrderEntry.erpSalesOrderId` |
| Operation → PO | `OperationEntry.productionOrderId` |
| Downtime → PO | `DowntimeEntry.productionOrderId` |
| WorkOrder → PO | `WorkOrderEntry.mesProductionOrderId` |

The `ProductionOrder` is the central hub. Focusing any entity walks to its
linked PO(s) first, then fans out to all other entities attached to those POs.

---

## Types

```ts
type EntityType = "salesOrder" | "productionOrder" | "operation" | "downtime" | "workOrder";

type FocusedEntity = { type: EntityType; id: string };

type HighlightState = "focused" | "correlated" | "dimmed" | "idle";

type CorrelatedSet = {
    salesOrders:      Set<string>;
    productionOrders: Set<string>;
    operations:       Set<string>;
    downtimeEvents:   Set<string>;
    eamWorkOrders:    Set<string>;
};
```

### HighlightState semantics

| State | Meaning |
|---|---|
| `"idle"` | No entity is focused — all bars render at full opacity |
| `"focused"` | This bar is the one the user is hovering |
| `"correlated"` | This bar is relationally linked to the focused one |
| `"dimmed"` | This bar has no relation to the focused one |

---

## Correlation rules by entity type

When an entity is focused, the set is built by:

1. Resolving the entity's linked PO(s) — the *pivot*
2. Expanding the pivot PO(s) to all linked entities

| Focused type | Pivot PO source | Also adds to correlated |
|---|---|---|
| `salesOrder` | `soToPos[id]` | all ops, downtimes, WOs of pivot POs |
| `productionOrder` | itself | linked SO; all ops, downtimes, WOs |
| `operation` | `opToPo[id]` | linked SO, linked PO, sibling ops, downtimes, WOs |
| `downtime` | `downtimeToPo[id]` | linked SO, linked PO, ops, sibling downtimes, WOs |
| `workOrder` | `workOrderToPo[id]` | linked SO, linked PO, ops, downtimes, sibling WOs |

---

## Implementation

```
src/core/Correlation.ts      — types + pure buildCorrelationIndex + correlate + highlightStateForBar
src/store/useFocusStore.ts   — hovered / selected FocusedEntity slots
src/hooks/useCorrelation.ts  — useMemo wrapper: useCorrelation(projection, focus) → CorrelatedSet | null
```

The index is built from the full `AsOfProjection` (which is itself built from
the full `TimelineScope`, not a time-filtered snapshot). This ensures that
entities outside the current view window can still be correlated.

`useCorrelation` returns `null` when there is no focused entity — this is the
signal to render all bars in `"idle"` state (no dimming).

---

## What changes in the renderer

With this layer in place, `Timeline.tsx`:

- Adds `entityType: EntityType` to `BarItem`
- Reads `hovered` from `useFocusStore` and `correlated` from `useCorrelation`
- Passes `highlightState` to each `Bar`
- `Bar` applies `opacity-30` when `highlightState === "dimmed"`
- Bar `onMouseEnter` calls `setHovered({ type, id })`; `onMouseLeave` clears it
