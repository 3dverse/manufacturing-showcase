# Scope

`TimelineScope` is the node-scoped view derived from the span. It is the second
of three layers:

```
TimelineSpan   →  see Span.md
    ↓
TimelineScope  ←  this file
    ↓
AsOfSnapshot   →  see Snapshot.md
```

---

## Derivation

The scope is a pure function of `(node, span)` — no async, no side effects:

```ts
type TimelineScope = {
    level: "factory" | "area" | "line" | "cell" | "machine";
    salesOrders:      SalesOrderEntry[];
    productionOrders: ProductionOrderEntry[];
    operations:       OperationEntry[];
    downtimeEvents:   DowntimeEntry[];
    eamWorkOrders:    WorkOrderEntry[];
};
```

`scopeFromNode(node, span)` selects from the span's Maps and indexes according
to the node's level and hash. The component never touches the span directly.

### By level

| Level | `salesOrders` | `productionOrders` | `operations` | `downtimeEvents` | `eamWorkOrders` |
|---|---|---|---|---|---|
| Factory | all in span | — | — | — | — |
| Area | — | `productionOrdersByLocation[node.hash]` | — | — | — |
| Line | — | union of `productionOrdersByWorkCenter[wc]` for wcs in this line | union of `operationsByWorkCenter[wc]` for wcs in this line | union of `downtimeByWorkCenter[wc]` for wcs in this line | — |
| Cell | — | `productionOrdersByWorkCenter[node.hash]` | `operationsByWorkCenter[node.hash]` | `downtimeByWorkCenter[node.hash]` | — |
| Machine | — | `productionOrdersByWorkCenter[node.parent.hash]` | `operationsByWorkCenter[node.parent.hash]` | `downtimeByWorkCenter[node.parent.hash]` | `eamWorkOrdersByAsset[node.hash]` |

*Machine-level production orders and operations are scoped to the parent work
center, since operations are assigned at the work center level.*

---

## Data flow

```
Span.ts           TimelineSpan    (raw Maps + indexes, fetched from APIs)
                      ↓  scopeFromNode(node, span)
Scope.ts          TimelineScope   (node-filtered flat arrays)
                      ↓  filterToAsOf(scope, asOf)
Snapshot.md       AsOfSnapshot    (point-in-time filtered arrays, faithful)
                      ↓  projectSnapshot(snapshot, asOf)
Projection.md     AsOfProjection  (status reinterpreted, quantities interpolated)
                      ↓
                  <Timeline />    pure renderer
```

Scoping and snapshotting happen in the state layer, not in the component.
The renderer has no knowledge of the navigation graph, node hashes, or indexes.
