# Span

`TimelineSpan` is the timespan-scoped cache. It is the first of three layers:

```
TimelineSpan   ←  this file
    ↓
TimelineScope  →  see Scope.md
    ↓
AsOfSnapshot   →  see Snapshot.md
```

---

## Principles

- **Fetch once per span, filter client-side.** Bulk data is fetched once for the
  whole timespan and stored. Navigation between nodes only triggers re-scoping,
  not re-fetching.
- **Fetch on demand for narrow scopes.** Data only needed at a specific leaf node
  (e.g. EAM work orders for one machine) is fetched on first visit and stored
  keyed by node id.
- **Span changes invalidate the whole cache.** Changing zoom level triggers a
  full re-fetch of all bulk data.
- **`asOf` does not trigger re-fetching.** Moving the playhead is a pure UI
  operation; all data is already in the span and filtered in memory.

---

## Time window

The span is parameterised by `{ from: number, to: number }` (unix seconds),
truncated to the nearest hour for cache key stability:

```
from = now - zoomHalfSpan
to   = now + zoomHalfSpan
```

Current default: 3 months back, 2 months forward. When zoom level changes,
the span is cleared and re-fetched.

---

## Layer 1 — Site-wide bulk data  *(fetched on load and on span change)*

| Key | Source endpoint | Filter params used |
|---|---|---|
| `productionOrders` | `GET /mes/production-orders` | `siteId`, `locationId`, `scheduledFrom`, `scheduledTo` |
| `operations` | `GET /mes/operations` | `siteId`, `workCenterId`, `scheduledFrom`, `scheduledTo` |
| `downtimeEvents` | `GET /mes/downtime-events` | `siteId`, `workCenterId`, `startedFrom`, `startedTo` |
| `salesOrders` | `GET /erp/sales-orders` | `siteId` |
| `eamWorkOrders` | `GET /eam/work-orders` | `siteId`, `locationId`, `scheduledFrom`, `scheduledTo` |

One request per location (for POs and EAM WOs) or per work center (for operations,
downtime). All stored as `Map<id, T>` with secondary indexes built at fetch time:

```
productionOrdersByLocation  : Map<locationId,  PO[]>
productionOrdersByWorkCenter: Map<workCenterId, PO[]>   // derived from operations
operationsByWorkCenter      : Map<workCenterId, Op[]>
downtimeByWorkCenter        : Map<workCenterId, DowntimeEvent[]>
workOrdersByLocation        : Map<locationId,  WorkOrder[]>
workOrdersByAsset           : Map<assetId,     WorkOrder[]>  // derived from WOs' assetId
```

## Layer 2 — On-demand data  *(removed — EAM work orders promoted to Layer 1)*

EAM work orders were previously fetched on first visit to a machine node. They are
now fetched in bulk by `locationId` so area-level scope can include them without a
separate per-machine request. The `workOrdersByAsset` index is derived at build time
from the same bulk data, so the machine-level scope remains unaffected.

---

## Fetch triggers

| Event | Action |
|---|---|
| App load | Fetch all Layer 1 data |
| Span change (zoom) | Clear span, re-fetch all Layer 1 data |
| Navigate to any node | Re-derive scope from existing span only |
| `asOf` change (playhead scrub) | No fetch — pure in-memory filter |

---

## Suggested backend improvements

### 1. Sales order timeline filter
`GET /erp/sales-orders` currently filters by `orderDateFrom/To` (the date the
order was placed). For the timeline we want to filter by `requestedDeliveryDate`
so we capture orders whose delivery window overlaps the visible span.
→ **Add `deliveryDateFrom` / `deliveryDateTo` query params.**

### 2. Paginated bulk fetches
`listProductionOrders` and `listOperations` are paginated. For the span to be
complete, the client must page through all results. Either:
- Accept this and fetch all pages on load, or
- **Add a `limit` escape hatch** (e.g. `pageSize=1000`) for the dashboard use case.

### 3. EAM work order date filter
`GET /eam/work-orders` currently has no date range filter. To scope Layer 2 fetches
to the visible span it needs `scheduledFrom` / `scheduledTo`.
→ **Add these params to the EAM spec.**
