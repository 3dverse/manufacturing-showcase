# Inventory Movement Model

## Raw Materials

```
(purchase order / receipt)
        ↓
  +reception          [receipt]
        ↓
  -reception          [putaway]
  +storage
        ↓
  -storage            [replenishment]
  +supply
        ↓
  -supply             [issue / consumption]
```

## Finished Goods

```
  +storage            [production]
        ↓
  -storage            [quality control]
  +delivery
        ↓
  -delivery           [pick task  OR  shipment]
```

## WIP (inter-operation)

```
  +storage            [production]  — at operation end
        ↓
  -storage            [issue]       — at next operation start
```

## Allocations

Allocations represent stock that is physically present but already reserved for a known future demand.

### Storage — Raw Materials

| Event | Effect |
|---|---|
| Putaway completed | `+quantityAllocated` on the storage bin |
| Issue / consumption | `-quantityAllocated` (stock leaves) |

A storage bin's `quantityAvailable = quantityOnHand - quantityAllocated`.  
The allocation window is `[putawayDate, op.actualStart]`.

### Storage — Finished Goods (post-production, pre-QC)

| Event | Effect |
|---|---|
| FG production movement (`+storage`) | `+quantityAllocated` on the storage bin |
| Quality control transfer (`-storage`) | `-quantityAllocated` (stock moves to delivery) |

A storage bin's `quantityAvailable = quantityOnHand - quantityAllocated`.  
The allocation window is `[po.end, qcClearDate]`.

### Delivery — Finished Goods (post-QC, pre-shipment)

| Event | Effect |
|---|---|
| Quality control transfer (`+delivery`) | `+quantityAllocated` on the delivery bin |
| Shipment / pick task (`-delivery`) | `-quantityAllocated` (stock leaves) |

A delivery bin's `quantityAvailable = quantityOnHand - quantityAllocated`.  
The allocation window is `[qcClearDate, shipDate]`.

## Notes

- Receipt creates inventory; pick task / shipment deletes it.
- Consumption deletes RM inventory; production creates FG inventory.
- Pick task and shipment are both valid outbound events; only one should generate the `-delivery` movement per order (shipment is preferred as the physical departure event).
- Supply and Reception zones each have a single fallback bin (`{zoneId}-BIN-01`).
- Storage and Delivery zones use real bins from the 3D scene, with a fallback to the first bin.
- RM storage bins are tracked per-operation via `opBinAssignment`; supply/reception/delivery use their single/fallback bin.
