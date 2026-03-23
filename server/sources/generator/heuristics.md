# Dataset Generator Heuristics

## Goal

Produce a synthetic but credible manufacturing dataset where every production
location has a dense, non-overlapping timeline that can be rendered as a Gantt.

---

## Conceptual entity map

```
ERP  Sales Order      → site
MES  Production Order → location  (location named "production")
MES  Operation        → work center  (workCenter inside that location)
EAM  Work Order       → asset  (machine inside that workCenter)
```

---

## Data model

```
Location  (location named "production")
  └─ non-overlapping time slots covering the whole window
       ├─ Downtime slot    (machine downtime, between or during POs)
       └─ Production Order slot
            └─ Operations  [one per unique op type in the location, pipeline-scheduled]
                 └─ each machine in that workCenter may have EAM work orders

Sales Order (ERP)
  └─ line items  →  Production Orders that fulfil them
```

Key structural rules:
- A **location** is any location whose name contains "production" (case-insensitive).
- Only production locations drive PO and operation generation.
- A **Production Order** belongs to exactly one location (`locationId = location.hash`).
- An **Operation** belongs to exactly one work center (`workCenterId = workCenter.hash`);
  one operation is generated per unique operation type in the location, per PO.
- A **Work Order** is raised against a single asset (`assetId = machine.hash`).

---

## Operation templates

Each unique `operationType` tag across a production location's work centers defines
one **operation template**. The template specifies:

- Operation code and description
- Setup time (once per batch, minutes)
- Cycle time per item (minutes)
- Defect type list

Work centers that share the same `operationType` tag share one template; they
are alternative capacity for the same operation step. Work centers without a tag
are randomly assigned one from the hardcoded list (MACHINING, ASSEMBLY, PAINTING,
QUALITY_CONTROL) and treated accordingly.

The operation type sequence for a location is determined by **work center ordinal**
(the position in which work centers appear in the location). This defines the flow
direction of the pipeline.

---

## Location eligibility

An item is eligible for a production location if the set of operation types required
by the item's routing **exactly matches** the set of tagged operation types in the
location (bidirectional check):

- Every item routing step has a matching work center in the location.
- Every tagged work center op type appears in the item's routing.

This ensures every work center is active on every production order — no workCenter is
ever idle because an item skips a step it doesn't need.

Items are only used to determine **what product is being manufactured** and to
gate eligibility. The actual operations are driven by the work centers, not by
the item routing.

---

## Time window

`now` is the system clock at generation time (`new Date()`).

```
windowStart = now - monthsBack  months
windowEnd   = now + monthsForward months
```

Past data (before `now`) has completed status. Future data (after `now`) has
planned or scheduled status. `now` itself sits inside the active production window.

---

## Generation order  ← critical

The order below ensures every higher-level entity is grounded in lower-level reality.

### Step 1 — Structural

EAM locations and machine assets are registered, deriving from the scene graph.

### Step 2 — ERP

Companies, customers, suppliers, items, sales orders, purchase orders, invoices,
payments, journal entries, and fiscal periods.

### Step 3 — APS

Plans, scenarios, resources, scheduled operations, capacity buckets, demands,
supplies, pegging, and constraints.

### Step 4 — EAM

For each machine:
- Periodic inspections across `[windowStart, now]` (~1/month).
- Failed inspections probabilistically raise a Service Request.
- Each Service Request generates a corrective Work Order on the same machine.
- One Maintenance Plan (14-day PM cycle) per machine; past due dates generate
  completed preventive Work Orders linked to the plan.

### Step 5 — MES

Fill each production location's timeline from `windowStart` to `windowEnd`,
alternating between maintenance gaps (2–8 h) and Production Orders.

For each Production Order, one operation instance is created per unique operation
type in the location, in work-center ordinal order — pipeline-scheduled (see below).

### Step 6 — QMS

Nonconformances, CAPAs, deviations, audits, complaints, and documents derived
from MES and ERP data.

### Step 7 — WMS

Warehouses, locations, inventory, handling units, lots, serials, receipts,
putaway, pick tasks, shipments, and cycle counts derived from ERP items and
MES production orders.

### Post-processing

- **APS ↔ MES**: Scheduled operations are linked to the MES production orders
  they correspond to via `mesProductionOrderId`.
- **EAM ↔ MES**: Corrective work orders are linked to the production order active
  at the time of the work order via `mesProductionOrderId`.
- **Scenario overlays**: Applied last so they override generated state.

---

## Pipeline operation scheduling

Operations are scheduled **pipeline-style** — modelling a continuous-flow line
where work centers process the batch concurrently rather than sequentially:

```
Op[0]  |============================|
Op[1]      |============================|
Op[2]          |============================|
```

Scheduling math for op[i]:

```
stagger[i]    = setup[i-1] + 1 × cycle[i-1]       // time until first item flows out of prev op
opStart[i]    = opStart[i-1] + stagger[i-1]        // snapped to next shift boundary
throughputEnd = advanceShiftMins(opStart[i], setup[i] + qty × cycle[i])
pipelineEnd   = advanceShiftMins(opEnd[i-1], cycle[i])  // must wait for bottleneck delivery
opEnd[i]      = max(throughputEnd, pipelineEnd)
```

- Op[0] starts at the PO cursor (next shift boundary after the maintenance gap).
- Each subsequent op starts one stagger after the previous op's actual start.
- `pipelineEnd` prevents a fast downstream station from finishing before the
  upstream bottleneck has delivered all items.
- All operations cover most of the same wall-clock window — they start and end
  slightly staggered but are all active simultaneously.
- The PO starts at `min(all op starts)` and ends at `max(all op ends)`.
- All work center cursors are advanced to the PO end before the next PO begins.

---

## Timeline slot semantics

| Slot type          | MES entity        | EAM entity     | Visual position         |
|--------------------|-------------------|----------------|-------------------------|
| Between POs        | —                 | Preventive WO  | Gap bar between PO bars |
| During PO          | Operation running | Corrective WO  | Overlay within PO bar   |

---

## Key constants

| Constant                | Value  | Effect                                          |
|-------------------------|--------|-------------------------------------------------|
| `MAINT_MIN_MINS`        | 120    | Shortest maintenance gap (2 h)                  |
| `MAINT_MAX_MINS`        | 480    | Longest maintenance gap (8 h)                   |
| `INSP_INTERVAL_DAYS`    | 25–35  | Inspection cadence per machine                  |
| `PM_INTERVAL_DAYS`      | 14     | Preventive maintenance plan cadence             |

Operation template cycle times (minutes per item):

| Op type         | Setup | Cycle/item | Stagger to next |
|-----------------|-------|------------|-----------------|
| MACHINING       | 30    | 3.5        | 33.5 min        |
| ASSEMBLY        | 15    | 2.5        | 17.5 min        |
| PAINTING        | 20    | 1.0        | 21.0 min        |
| QUALITY_CONTROL | 10    | 0.75       | 10.75 min       |

For a typical batch of 60 items, MACHINING dominates at 240 min (4 h).

---

## Invariants that must hold

1. For any location, no two **Production Orders** overlap in time.
2. For any work center, no two **Operations** overlap in time.
3. `po.timing.scheduledStart` ≤ all `op.scheduledStart` for ops of that PO.
4. `po.timing.scheduledEnd`   ≥ all `op.scheduledEnd`   for ops of that PO.
5. Each operation's `workCenterId` matches the workCenter it was scheduled on.
6. Every corrective Work Order has a `serviceRequestId`; every preventive WO
   has a `maintenancePlanId`.
7. Every Service Request that generated a WO has `linkedWorkOrderId` set.
