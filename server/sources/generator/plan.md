# Dataset Generator v2 — Generation Plan

## Core Philosophy

Generation happens in **three distinct passes**:

1. **Entity pass** — create all named entities (companies, items, machines, orders, etc.) without worrying about when things happen.
2. **Timeline pass** — place those entities on a timeline, resolving start/end times, sequencing, and overlaps.
3. **Fill pass** — once the timeline is fixed, back-fill plausible quantities, costs, statuses, and derived values.

This separation keeps each pass simple and testable. The entity pass produces a pure structural graph; the timeline pass is purely a scheduling problem; the fill pass is purely a statistics problem.

---

## Configuration

The generator accepts an optional config object. Every field has a default and can be omitted.

Two categories of parameters exist:

- **Derived** — computed from the factory scene graph; not configurable. Listed here for clarity.
- **Configurable** — not knowable from the graph; exposed as optional config with sensible defaults.

### Derived from the factory graph (read-only)

| Parameter | Source |
|---|---|
| Number of production locations | Locations whose name contains "production" |
| Number of work centers per location | Work centers nested under that location |
| Number of operations per PO | One per work center in the location (fixed by template) |
| Number of machines (assets) | Assets nested under work centers |
| Number of maintenance plans | One per machine |

### Configurable (all optional)

#### Time window

| Parameter | Default | Description |
|---|---|---|
| `now` | `new Date()` | Reference instant; past/future boundary |
| `monthsBack` | `3` | How far back the window extends |
| `monthsForward` | `1` | How far forward the window extends |

#### Shifts

| Parameter | Default | Description |
|---|---|---|
| `shifts` | `[{ name: "First", start: "06:00", end: "14:00" }, { name: "Second", start: "14:00", end: "22:00" }]` | Ordered list of shifts; each has a name, start time, and end time |
| `workDays` | `[1,2,3,4,5]` | Working days of the week (0=Sun … 6=Sat) |

#### MES

| Parameter | Default | Description |
|---|---|---|
| `productionOrderCount` | `40` | Total number of PO instances to place across all production locations |
| `downtimeEventCount` | `20` | Total number of downtime events to distribute across all operations |
| `unitsPerHour` | `30` | Throughput rate shared by all operations; used to compute stagger and back-calculate batch qty in fill pass |
| `operationDurationMinutes` | `240` | Wall-clock duration of each operation; primary PO sizing input |
| `yieldRate` | `0.95` | Median yield across all operations; per-operation effective yield = `yieldRate + U(-(1-yieldRate), +(1-yieldRate))` |

`productionOrderCount` is distributed across locations proportionally to the number of
work centers (more complex lines get more POs). `downtimeEventCount` is distributed
across operations using a 1-in-4 roll per operation, capped at the configured total;
if the roll-based count falls short it is padded, if it exceeds it the excess is dropped.

#### EAM

| Parameter | Default | Description |
|---|---|---|
| `pmFrequencyDays` | `14` | PM work order cadence (applied to all machines unless overridden) |
| `pmDurationHours` | `4` | Estimated duration of one PM work order |

#### ERP

| Parameter | Default | Description |
|---|---|---|
| `customerCount` | `6` | Number of customer master records to generate |
| `supplierCount` | `4` | Number of supplier master records to generate |

#### RNG

| Parameter | Default | Description |
|---|---|---|
| `seed` | `42` | Random seed for reproducible generation |

---

## Phase 1 — Entity Creation

> _Create all named things. No dates yet._
> _Templates are generation helpers — they do not appear in the final dataset._

### 1.1 Structural (from scene graph)

Derived from the 3D scene hierarchy. Nothing is invented here.

- **Sites** — top-level physical plant
- **Locations** — areas within the site (production cells, warehouses, etc.)
- **Work Centers** — machines/stations within a location, tagged with `operationType`
- **Assets** — individual machines registered against a work center

### 1.2 Production Order templates _(generation-only)_

Each production location gets one or more **Production Order templates**. A template is
a blueprint used to stamp out repeated PO instances on the timeline; it does not appear
in the final dataset.

A template contains:

| Field | Description |
|---|---|
| `name` | Human-readable label (e.g. "Batch A — Milling run") |
| `operations` | Ordered list of **Operation templates** (see below) |

Each **Operation template** within the PO template defines one operation step:

| Field | Description |
|---|---|
| `operationType` | Matches the `operationType` tag of a work center in the location |
| `setupMinutes` | Fixed setup time before processing begins |

Operations are always instantiated in the same fixed order defined by the template.
Every instance of a given PO template has the same set of operations — no steps are
skipped or added.

**Pipeline scheduling** — operations run concurrently in pipeline fashion. All operations
share the same `unitsPerHour` (global config) and therefore have identical wall-clock
duration. Each operation processes a different item in the batch at any given moment:
op[0] is on item N, op[1] is on item N−1, op[2] is on item N−2, etc.

Scheduling math:
```
cycleTime   = 60 / unitsPerHour              (minutes per item)
stagger     = setupMinutes + cycleTime       (time until first item flows to next op)
op[i].start = op[0].start + i × stagger
op[i].end   = op[i].start + operationDurationMinutes   (wall-clock)
po.start    = op[0].start
po.end      = op[last].end
```

`operationDurationMinutes` is wall-clock time. Operations may span multiple shifts or
overnight periods — this is expected and fine. Batch size is not set here; it is
back-calculated in the fill pass from net productive time (see §3.1).

### 1.3 Downtime event templates _(generation-only)_

A small pool of named downtime event templates is defined globally. Each template
represents a category of unplanned stoppage (e.g. "Tooling failure", "Material jam",
"Sensor fault").

| Field | Description |
|---|---|
| `code` | Short identifier |
| `description` | Human-readable cause |
| `minDurationMinutes` | Shortest realistic duration |
| `maxDurationMinutes` | Longest realistic duration |

**Placement rules (applied during the timeline pass):**

- Downtime events occur **inside operations**, not between POs.
- Each operation independently rolls a `1-in-4` chance of receiving a downtime event.
- If the roll succeeds, there is a further `1-in-4` chance of a **second** event on the
  same operation (two downtimes, non-overlapping, separated by a minimum gap).
- A downtime event is placed at a uniformly random offset within the operation's
  time span, respecting `minDurationMinutes` and the operation's end boundary.
- The specific template is chosen at random from the pool.

Downtime events do not pause or extend the operation's scheduled end — they are
recorded as losses that reduce Availability in the OEE fill pass.

### 1.4 Maintenance plan templates

One **Maintenance Plan** is created per asset. All plans share a single
**"Predictive Maintenance" Work Order template**:

| Field | Description |
|---|---|
| `title` | "Predictive Maintenance" |
| `type` | `predictive` |
| `estimatedDurationHours` | Nominal duration of one PM work order |

Each Maintenance Plan specifies:

| Field | Description |
|---|---|
| `assetId` | The machine this plan covers |
| `frequencyDays` | How often a PM work order is triggered (e.g. every 14 days) |
| `workOrderTemplate` | Always the shared predictive-maintenance template |

Work Order instances are placed on the timeline in Phase 2 using these plans.

### 1.5 ERP master data

Invented from scratch with realistic names/codes.

- **Company** — one legal entity per site
- **Currencies** — reporting currency + 1–2 transaction currencies
- **GL Accounts** — chart of accounts (revenue, COGS, inventory, AP, AR, …)
- **Cost Centers** — one per production location + one overhead
- **Customers** — pool of N customers (companies that buy finished goods)
- **Suppliers** — pool of M suppliers (companies that sell raw materials)
- **Items** — see §1.5a below

### 1.5a Item & material flow model

Three item types are tracked as inventory:

| Type | Code prefix | Origin |
|---|---|---|
| `finished_good` | `FG-` | One per PO template; name derived from the line's operation type combination |
| `raw_material` | `RM-` | Fixed pool of discrete components and processable bulk materials |
| `wip` | `WIP-` | Auto-generated by walking the routing sequence (see below) |

**Bulk consumables** (paint, primer, lubricant) are not inventory items — expensed directly.

#### Finished good naming

The FG item for a production line is looked up by the sorted set of operation types present on that line:

| Operation type combination | FG name |
|---|---|
| `ASSEMBLY, QUALITY_CONTROL` | Electronic Module |
| `MACHINING, ASSEMBLY, QUALITY_CONTROL` | Hydraulic Assembly |
| `MACHINING, PAINTING, ASSEMBLY, QUALITY_CONTROL` | Transmission Housing |
| `MACHINING, QUALITY_CONTROL` | Precision Component |
| `PAINTING, ASSEMBLY, QUALITY_CONTROL` | Coated Assembly |

#### Raw material assignment

Two heuristics determine which RM items are consumed by a given routing:

- **Processable bulk** (consumed at the first transformation step):
  - Line has PAINTING → `RM-ALU-BLOCK`
  - Otherwise → `RM-STEEL-BAR`

- **Discrete components** (consumed at the first ASSEMBLY step only):
  - Line has MACHINING → `RM-SEAL-KIT` + `RM-FASTENERS`
  - No MACHINING (electronics) → `RM-PCB-BLANK` + `RM-FASTENERS`

#### WIP derivation algorithm

For each FG, walk its routing steps in sequence to derive intermediate WIP items and assign operation inputs/outputs:

```
previousOutput = null

for each operation in routing (ordered by sequence):

  if TRANSFORMATION (MACHINING, PAINTING, …):
    input  = previousOutput ?? processable bulk RM   (first MACHINING uses RM; subsequent steps use prior WIP)
    output = new WIP-{FG_ID}-{sequence}

  if ASSEMBLY:
    inputs = [previousOutput] + discreteRMs   (discreteRMs added at first ASSEMBLY step only)
    output = new WIP-{FG_ID}-{sequence}        (or FG itself if this is the last non-QC step)

  if QUALITY_CONTROL:
    input  = previousOutput
    output = same item (passthrough — no new WIP, no inventory movement)

  previousOutput = output
```

The final non-QC operation's output is the finished good item.

#### Warehouses and movement types

Three warehouses hold inventory:

| Warehouse | Contents |
|---|---|
| `WH-RM` | Raw materials received from suppliers |
| `WH-WIP` | Intermediate WIP between operations |
| `WH-FG` | Finished goods awaiting shipment |

Every stock change is recorded as a timestamped `InventoryMovement`:

| Movement type | Triggered by | Effect |
|---|---|---|
| `receipt` | RM receipt completed | `+qty` at `WH-RM` |
| `issue` | Operation starts (RM/WIP inputs only; QC passthrough skipped) | `−qty` from source warehouse |
| `production` | WIP: operation completes; FG: production order completes | `+qty` at `WH-WIP` or `WH-FG` |
| `shipment` | Shipment dispatched | `−qty` from `WH-FG` |

Inventory positions at any point in time are derived by projecting movements up to that timestamp (`asOf` parameter on inventory endpoints).

### 1.6 WMS master data

- **Warehouses** — `WH-RM` (raw materials), `WH-WIP` (WIP staging), `WH-FG` (finished goods)
- **WMS Locations** — 4 bins per warehouse

### 1.7 APS master data

- **Plan** — one active plan per site
- **Scenario** — baseline scenario + optional what-if scenarios
- **Resources** — one APS resource per work center

---

## Phase 2 — Timeline Placement

> _Assign every event, order, and activity to a point or interval in time._
> _`windowStart = now − monthsBack`, `windowEnd = now + monthsForward`._

### 2.1 MES production backbone

This is the primary timeline. Everything else is anchored to it.

For each production location (locations whose name contains "production"):

1. Starting from `windowStart`, walk the timeline forward slot by slot.
2. Alternate between **maintenance gaps** and **Production Order slots**.
3. For each Production Order slot, schedule **Operations** pipeline-style across work centers.

The result is a dense, non-overlapping sequence of POs covering the full window.

### 2.2 ERP orders

Sales Orders and Purchase Orders are placed relative to the MES timeline:

- Each PO (production order) is linked to a Sales Order line.
- Sales Order dates are set so `requestedDelivery ≥ po.scheduledEnd`.
- Purchase Orders for raw materials are placed with a lead time before the PO start.

### 2.3 EAM activity

- **Predictive Maintenance Work Orders** — for each asset, walk `[windowStart, now]` stepping by `frequencyDays` from the plan. Each step instantiates one WO from the shared predictive-maintenance template, placed at that date with `estimatedDurationHours` duration. Past WOs are `completed`; the next upcoming one is `planned`.
- Downtime events (from §1.3 templates) are injected into operations during this same pass (see §2.1).

### 2.4 WMS movement events

- **Receipts** — one per RM item per PO, timed to arrive 0–2 days before PO start. All RM items in the routing are covered, not just the first step.
- **Putaway tasks** — one per completed receipt, moving RM from the receiving area to a storage bin.
- **Pick tasks** — created 1 day before `SO.requestedDeliveryDate`; picked on `SO.requestedDeliveryDate`. One per PO/SO pair.
- **Shipments** — linked to the pick task; shipped same day as pick completion (`SO.requestedDeliveryDate`).
- **Stock allocations** — generated after all movements are settled; see §3.5.

### 2.5 APS scheduled operations

Mirror the MES operations onto the APS plan with the same time slots. Add capacity buckets per shift.

### 2.6 ERP financial timeline

- **Fiscal periods** — monthly, covering `[windowStart − 1 month, windowEnd + 1 month]`.
- **Invoices** — AR invoices issued after shipment; AP invoices after receipts.
- **Payments** — placed net-30/60 after invoice date.
- **Journal entries** — one entry per invoice/payment.

### 2.7 QMS events

- **Nonconformances** — raised probabilistically from defective operations (low yield operations in the MES timeline).
- **CAPAs** — one CAPA per cluster of nonconformances on the same defect type.
- **Audits** — placed quarterly across the window.
- **Deviations** — occasional, linked to specific POs.
- **Complaints** — rare, linked to shipped Sales Orders.

---

## Phase 3 — Fill Pass

> _With the timeline fixed, compute plausible quantities, costs, and statuses._

### 3.1 MES quantities

Batch size is derived from how much productive time actually occurred within the
operation's wall-clock span.

For each operation:
```
effectiveUnitsPerHour = unitsPerHour × U(0.9, 1.1)   (sampled once per PO, shared by all ops)
shiftMinutes          = working minutes within [op.start, op.end]  (excl. nights/weekends)
downtimeMinutes       = sum of all downtime event durations on this operation
netMinutes            = shiftMinutes - downtimeMinutes
producedQty           = netMinutes × effectiveUnitsPerHour / 60
```

All operations in the same PO produce the same `producedQty` (same duration, same rate).

```
effectiveYield = yieldRate + U(-(1-yieldRate), +(1-yieldRate))   (sampled per operation)
goodQty        = floor(producedQty × effectiveYield)
scrapQty       = producedQty - goodQty
```

- **Past POs** (`po.end < now`): full calculation above.
- **In-progress POs** (`po.start < now < po.end`): same formula but using
  `[op.start, now]` as the window — partial quantity proportional to elapsed productive time.
- **Future POs** (`po.start > now`): no produced qty yet; `plannedQty` is computed
  the same way as a projection.

### 3.2 OEE computation

Derived directly from the same numbers used in §3.1 — not generated independently:

```
plannedMinutes    = shiftMinutes                          (working time in the window)
downtimeMinutes   = sum of downtime event durations
runtimeMinutes    = plannedMinutes - downtimeMinutes

Availability  = runtimeMinutes / plannedMinutes
Performance   = 1.0   (by construction — unitsPerHour is the ideal rate, net time gives ideal output)
Quality       = goodQty / producedQty                    (TBD — yield curve per op type)
OEE           = Availability × Performance × Quality
```

Performance is 1.0 because `producedQty` is already computed from net productive time
at the ideal rate — there is no separate "actual vs ideal speed" dimension. Only
availability losses (downtime + shift gaps) and quality losses (scrap) affect OEE.

### 3.3 EAM

**PM Work Orders**
- `status` — `completed` / `in_progress` / `planned` from position vs `now`
- `actualStart` / `actualEnd` — equal to scheduled for completed WOs; null for planned
- `completedByName` — randomly assigned from a small pool of technician names

### 3.4 ERP

**Sales Orders**

The model is **make-to-stock**: production is PO-driven and forecast-independent. A sales order is only placed once the finished good exists (or is projected to exist) in `WH-FG`. The PO timeline is fixed; SO dates are derived from it.

- `orderDate` — `PO.scheduledStart − U(3, 10) days` (SO placed before production begins, driving the production run)
- `requestedDeliveryDate` — `po.end + U(1, 5) days` (delivery expected shortly after production completes)
- `status`:
  - `shipped` — shipment has completed (`shippedDate ≤ now`)
  - `in_progress` — SO placed, pick task open or in progress (`orderDate ≤ now`, not yet shipped)
  - `open` — SO placed in the future (`orderDate > now`)
- Line items: `quantity` = PO `producedQuantity`, `unitPrice` from item master, `lineAmount` = qty × price

**Purchase Orders**
- `orderDate` — PO `po.start` minus supplier lead time
- `expectedDeliveryDate` — timed to arrive just before PO start
- `status` — `open / received` from delivery date vs `now`
- Line items: quantities symbolic (no BOM defined), unit cost from item master

**Fiscal periods**
- `status` — `closed` if `periodEnd < now`, `open` if straddling `now`, `planned` if future

**Invoices**
- AR: created after SO ships — `invoiceDate` = shipment date
- AP: created after PO received — `invoiceDate` = receipt date
- `dueDate` — `invoiceDate` + net-30 or net-60 (random per customer/supplier)
- `amount` — linked order line total
- `status` — `paid` if `dueDate < now`, `open` if past invoice date but unpaid, `draft` if future

**Payments**
- `paymentDate` — on or slightly before `dueDate` for paid invoices
- `amount` — full invoice amount
- `status` — `posted` if past, `pending` if future

**Journal entries**
- One per invoice (debit AR/AP, credit revenue/inventory) and one per payment (debit cash, credit AR/AP)
- `postingDate` = invoice or payment date; amounts from linked document

### 3.5 WMS

**Receipts**
- One receipt per RM item per PO (all RM items in the routing, not just the first step)
- `receivedDate` — just before PO start (0–2 days prior)
- `quantity` — `max(plannedQty, producedQty)` from the linked MES production order
- `status` — `completed` if past, `pending` if future

**Putaway tasks**
Generated from completed receipts. Each task represents the physical act of moving received RM from the receiving area to a storage bin.

- One task per completed receipt line
- `sourceLocationId` — `WH-RM-BIN-01` (receiving area; same as receipt drop location)
- `destinationLocationId` — cycled across `WH-RM-BIN-01` through `WH-RM-BIN-04` based on receipt number
- `assignedAt` — same as `receivedDate`
- `completedAt` — `receivedDate` + 1–4 hours (if completed)
- `status`:
  - `completed` — receipt was completed more than 4 hours before `now`
  - `open` — receipt completed within the last 4 hours (recently arrived, not yet put away)
  - `pending` — receipt not yet completed

**Pick tasks**
- Created once a SO exists for a completed or future PO
- `createdAt` — `SO.requestedDeliveryDate − 1 day` (pick instruction released to warehouse floor)
- `pickedDate` — `SO.requestedDeliveryDate` (pick completes on the promised delivery date)
- `quantity` — PO `producedQuantity`
- `status` — `completed` if `pickedDate ≤ now`, `open` otherwise

**Shipments**
- `shippedDate` — same as `pickedDate` (`SO.requestedDeliveryDate`)
- `status` — `shipped` if `shippedDate ≤ now`, `pending` otherwise

**Inventory movement log**
Every stock change emits a timestamped `InventoryMovement` record (see §1.5a). The full log enables point-in-time inventory projection via the `asOf` API parameter.

- `receipt` movements — emitted for each completed RM receipt
- `issue` movements — emitted per operation input at `op.actualStart`; RM and WIP only (QC passthrough inputs are skipped)
- `production` movements — WIP items emitted per operation output at `op.actualEnd`; FG items emitted once at `po.end` using `producedQuantity` (same value as the linked shipment, for balance consistency)
- `shipment` movements — emitted for each dispatched shipment

**Inventory positions** (snapshot at `now`)
- Derived by projecting the movement log up to `now` — not computed independently
- Positions with zero or negative balance are excluded from the snapshot

**Stock allocations**
Generated after inventory positions are settled. Represent committed (reserved) stock — on-hand inventory that is spoken for by a specific demand.

Two demand types:

_RM allocations → production orders_
- Purpose: answers "is there enough RM on hand to start this PO?" and provides a full history of how long RM sat on the shelf before being consumed.
- Scope: all POs in the window — active (planned/in_progress) and completed
- Warehouse: **Storage** — RM allocations are tied to the storage zone where RM physically sits
- Priority: chronological order — earliest PO start date gets first claim on available stock
- For each PO, for each RM item in its routing:
  - `requiredQty` — from the operation's `inputs[].requiredQuantity`
  - `allocatedQty` — `min(requiredQty, available[rmItem])`; decrement available
  - `status` — `allocated` if full, `partial` if `0 < allocatedQty < requiredQty`, omitted if zero
  - `allocatedAt` — `max(PO.scheduledStart, RM putaway date)` FIFO: the allocation is effective once both the demand exists (PO scheduled) and the stock has arrived (putaway completed)

_FG allocations → sales orders_
- Purpose: answers "is this sales order ready to ship?" and provides a full history of how long FG sat on the shelf before being picked.
- Scope: all SOs in the window — active (open/in_progress) and shipped
- Warehouse: **Delivery** — FG allocations are tied to the delivery zone, not storage
- Priority: chronological order by requested delivery date
- For each SO, for the linked FG item:
  - `requiredQty` — SO line quantity
  - `allocatedQty` — `min(requiredQty, available[fgItem])`; decrement available
  - `status` — `allocated` if full, `partial` if `0 < allocatedQty < requiredQty`, omitted if zero
  - `allocatedAt` — `linkedPO.timing.actualEnd ?? linkedPO.timing.scheduledEnd` (allocation begins when production completes and FG lands in stock)
  - `clearedAt` — `SO.requestedDeliveryDate` if shipped, `null` otherwise (allocation ends when goods are picked for delivery)

Free (unallocated) stock = on-hand − sum of all allocations for that item. This is the inventory available to absorb new demand.

### 3.6 APS

**Scheduled operations** — mirror MES operation start/end and status exactly

**Capacity buckets** (per resource per shift)
- `availableMinutes` — shift duration
- `loadedMinutes` — sum of operation durations falling in that shift
- `utilizationPercent` — `loadedMinutes / availableMinutes`

**Demands** — one per SO line; quantity and due date from SO
**Supplies** — one per production order; quantity and date from PO
**Pegging** — links each demand to the supply that fulfils it

### 3.7 QMS

**Nonconformances**
- Raised when `scrapQty > 0` on a past operation (or above a configurable threshold)
- `detectedDate` — operation `actualEnd`
- `quantity` — `scrapQty`
- `status` — `open` if within last 30 days, `closed` otherwise
- ⚠️ MES→QMS linkage (e.g. `operationId` / `productionOrderId` on the NC record) is
  **deferred** — needs QMS API schema review before committing to field names

**CAPAs**
- One per cluster of NCs sharing the same operation type
- `openedDate` — date of first NC in the cluster
- `status` — `open` if any linked NC is open, `closed` otherwise
- ⚠️ CAPA→NC linkage deferred for same reason

**Audits**
- Placed quarterly across the window
- `status` — `completed` if past, `scheduled` if future
- `findingsCount` — random 0–3

**Complaints**
- Low-probability roll per shipped SO (roughly 1 in 10)
- `receivedDate` — a few days after shipment date
- `status` — `open` if recent, `closed` otherwise

### 3.8 Statuses (summary)

Status is a deterministic function of position relative to `now`:

| Entity           | Past (`end < now`)   | In-progress (`start < now < end`) | Future (`start > now`) |
|------------------|----------------------|-----------------------------------|------------------------|
| Production Order | `completed`          | `in_progress`                     | `planned`              |
| Operation        | `completed`          | `in_progress`                     | `scheduled`            |
| EAM Work Order   | `completed`          | `in_progress`                     | `planned`              |
| Sales Order      | `shipped`            | `in_progress`                     | `open`                 |
| Purchase Order   | `received`           | `in_progress`                     | `open`                 |
| Invoice          | `paid` / `overdue`   | `open`                            | `draft`                |
| WMS Receipt      | `completed`          | —                                 | `pending`              |
| WMS Shipment     | `shipped`            | —                                 | `pending`              |
| NC / CAPA        | `closed` (if old)    | `open`                            | —                      |

---

## Open questions / TBD

- [x] One PO template per production location, named after the location.
- [x] `producedQty` variance: each PO instance draws an `effectiveUnitsPerHour` = `unitsPerHour × U(0.9, 1.1)` (uniform ±10%). Used in place of `unitsPerHour` for that PO's quantity calculation.
- [x] Shift configuration is configurable. Default: two shifts Mon–Fri, shift 1 06:00–14:00, shift 2 14:00–22:00.
- [x] Gap sizing: gaps only appear when a PM is due; duration = `pmDurationHours` from the maintenance plan config.
- [x] Yield: single configurable `yieldRate` (default 0.95). Per-operation effective yield = `yieldRate + U(-(1-yieldRate), +(1-yieldRate))`. The global rate is the median; variance scales with the defect rate.
- [x] Nonconformances are QMS-only entities, generated independently of MES scrap. Rate and MES linkage deferred pending QMS API schema review.
- [x] Item model: three types (FG, RM, WIP); WIP auto-derived from routing; operation inputs/outputs assigned per step; full inventory movement log with `asOf` projection. See §1.5a.
- [ ] Downtime template pool: specific categories to include — deferred
- [ ] Putaway tasks: generated from completed receipts; each receipt produces one putaway task moving RM from receiving dock to bin — strategy defined in §3.5, not yet implemented.
- [ ] Stock allocations: RM reserved for upcoming production orders; FG committed to sales orders — strategy defined in §3.5, not yet implemented.
- [x] Cross-system linking: APS scheduled operations reference their MES counterpart via `mesOperationId`. EAM work orders and production orders are independent in the final dataset — their only relationship is temporal competition (WOs occupy gaps that POs cannot). Internal generation references (e.g. which gap a WO occupies) may exist during the timeline phase for coherence but are not emitted to the final dataset.

