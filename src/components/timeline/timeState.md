# Timeline State & Cache Strategy

## Principles

- **Cache at site scope, filter client-side.** Data that can be bulk-fetched once
  for the whole site and timespan is fetched once and stored. Navigation between
  nodes only triggers re-filtering, not re-fetching.
- **Fetch on demand for narrow scopes.** Data that is only needed at a specific
  leaf node (e.g. EAM work orders for one machine) is fetched when that node is
  first visited and stored keyed by node id.
- **Timespan changes invalidate the whole cache.** Changing the visible timespan
  triggers a full re-fetch of all bulk data.
- **`asOf` does not trigger re-fetching.** Moving the playhead is a pure UI
  operation; all data is already in the cache and filtered in memory.

---

## Timespan

The cache is parameterised by `{ from: number, to: number }` (unix seconds),
derived from the current zoom level centred on the system clock:

```
from = now - zoomHalfSpan
to   = now + zoomHalfSpan
```

When the user changes zoom level or the timespan shifts, all bulk cache entries
are cleared and re-fetched.

---

## Cache layers

### Layer 1 — Site-wide bulk data  *(fetched on load and on timespan change)*

| Key | Source endpoint | Filter params used |
|---|---|---|
| `productionOrders` | `GET /mes/production-orders` | `siteId`, `scheduledFrom`, `scheduledTo` |
| `operations` | `GET /mes/operations` | `siteId`, `scheduledFrom`, `scheduledTo` |
| `downtimeEvents` | `GET /mes/downtime-events` | `siteId`, `startedFrom`, `startedTo` |
| `salesOrders` | `GET /erp/sales-orders` | `siteId`, `orderDateFrom`, `orderDateTo` |
| `workCenters` | `GET /mes/work-centers` | `siteId` *(no timespan — static)* |

All are stored as `Map<id, T>` with secondary indexes built at fetch time:

```
productionOrdersByLocation : Map<locationId,  PO[]>
productionOrdersByWorkCenter: Map<workCenterId, PO[]>   // derived from operations
operationsByWorkCenter      : Map<workCenterId, Op[]>
operationsByProductionOrder : Map<poId,        Op[]>
downtimeByWorkCenter        : Map<workCenterId, DowntimeEvent[]>
```

### Layer 2 — Node-scoped on-demand data  *(fetched on first visit to a machine node)*

| Key | Source endpoint | Filter params used |
|---|---|---|
| `eamWorkOrders[assetId]` | `GET /eam/work-orders` | `siteId`, `assetId`, `scheduledFrom`, `scheduledTo` |

Stored as `Map<assetId, WorkOrder[]>`. Entries survive timespan changes only if
the timespan overlaps; otherwise cleared with the rest of the cache.

---

## Where scoping occurs

Scoping happens in the **state layer**, not in the component.

`<FactoryTimeline />` is a pure renderer — it receives already-filtered bars and
draws them. It has no knowledge of the navigation graph, node hashes, or which
cache indexes to consult. This keeps the component testable in isolation and makes
the scoped data reusable by other consumers (KPI panels, 3D highlights, etc.).

```
Cache (raw Maps + indexes)
    ↓
useTimelineStore selector  ←── selectedNode + timespan
    ↓  scoping happens here
timelineState.bars          already filtered
    ↓
<FactoryTimeline />         pure renderer
```

The component calls `useTimelineState()` and gets back
`{ level, salesOrders, productionOrders, operations, downtimeEvents, eamWorkOrders }`.
It never touches the cache directly.

---

## State (derived, no fetch)

`timelineState` is computed from cache + navigation selection. It updates
whenever `selectedNode` or `timespan` changes.

```ts
type TimelineState = {
    level: "factory" | "area" | "line" | "cell" | "machine";
    bars: {
        salesOrders:       SalesOrder[];
        productionOrders:  ProductionOrder[];
        operations:        Operation[];
        downtimeEvents:    DowntimeEvent[];
        eamWorkOrders:     WorkOrder[];
    };
};
```

### Derivation by level

| Level | `salesOrders` | `productionOrders` | `operations` | `downtimeEvents` | `eamWorkOrders` |
|---|---|---|---|---|---|
| Factory | all in cache | — | — | — | — |
| Area | — | `productionOrdersByLocation[node.hash]` | — | — | — |
| Line | — | union of `productionOrdersByWorkCenter[wc]` for wcs in this line | union of `operationsByWorkCenter[wc]` for wcs in this line | union of `downtimeByWorkCenter[wc]` for wcs in this line | — |
| Cell | — | `productionOrdersByWorkCenter[node.hash]` | `operationsByWorkCenter[node.hash]` | `downtimeByWorkCenter[node.hash]` | — |
| Machine | — | `productionOrdersByWorkCenter[node.parent.hash]` | `operationsByWorkCenter[node.parent.hash]` | `downtimeByWorkCenter[node.parent.hash]` | `eamWorkOrders[node.hash]` |

*Machine-level production orders and operations are scoped to the parent work
center, since operations are assigned at the work center level.*

---

## Fetch triggers

| Event | Action |
|---|---|
| App load | Fetch all Layer 1 data |
| Timespan change | Clear all cache, re-fetch all Layer 1 data |
| Navigate to machine node (first visit) | Fetch `eamWorkOrders[assetId]` if not cached |
| Navigate to any other node | Re-derive `timelineState` from existing cache only |
| `asOf` change (playhead scrub) | No fetch — pure UI update |

---

## Suggested backend improvements

### 1. Sales order timeline filter
`GET /erp/sales-orders` currently filters by `orderDateFrom/To` (the date the
order was placed). For the timeline we want to filter by `requestedDeliveryDate`
so we capture orders whose delivery window overlaps the visible timespan.
→ **Add `deliveryDateFrom` / `deliveryDateTo` query params.**

### 2. Paginated bulk fetches
`listProductionOrders` and `listOperations` are paginated. For the cache to be
complete, the client must page through all results. Either:
- Accept this and fetch all pages on load, or
- **Add a `limit` escape hatch** (e.g. `pageSize=1000`) for the dashboard use case.

### 3. EAM work order date filter
`GET /eam/work-orders` currently has no date range filter. To scope Layer 2 fetches
to the visible timespan it needs `scheduledFrom` / `scheduledTo`.
→ **Add these params to the EAM spec.**
