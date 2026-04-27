# Dataset Generator v2 — Generation Plan

## Core Philosophy

Generation happens in **three distinct passes**:

1. **Entity pass** — create all named entities (companies, items, machines, orders, etc.) without worrying about when things happen.
2. **Timeline pass** — place those entities on a timeline, resolving start/end times, sequencing, and overlaps.
3. **Fill pass** — once the timeline is fixed, back-fill plausible quantities, costs, statuses, and derived values.

This separation keeps each pass simple and testable. The entity pass produces a pure structural graph; the timeline pass is purely a scheduling problem; the fill pass is purely a statistics problem.

### Timeless generation

All records are generated **as if already completed**. No record is gated on whether its date falls before or after `now`:

- Every production order, operation, and work order is `completed` with full `actualStart`/`actualEnd`.
- Every sales order is `shipped`; every purchase order is `received`; every invoice is `paid`.
- Every receipt and putaway task is `completed`; every inventory movement is emitted.
- All quantities (produced, issued, shipped) are fully filled in.
- OEE buckets are generated for the full window, not just the past.

The `now` reference point is still used for **timing** (it anchors the window centre and defines relative dates), but never as a gate that suppresses records or zeroes out fields.

The frontend simulation filter (`applySimulationFilter` in `src/core/Span.ts`, toggled by `FULL_TIMELINE` in `src/content/3dverse.ts`) is the single place responsible for presenting only the subset of data that would be visible at the client's current moment.

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
| `maxProductionOrderCount` | `40` | Total number of PO instances to place across all production locations |
| `unitsPerHour` | `30` | Throughput rate shared by all operations; used to compute stagger and back-calculate batch qty in fill pass |
| `minOperationWorkingMinutes` | `320` | Minimum working-time duration of a PO (~1/3 of a working day) |
| `maxOperationWorkingMinutes` | `3840` | Maximum working-time duration of a PO (~4 working days) |
| `yieldRate` | `0.95` | Median yield across all operations; per-operation effective yield = `yieldRate + U(-(1-yieldRate), +(1-yieldRate))` |

`productionOrderCount` is distributed across locations proportionally to the number of
work centers (more complex lines get more POs).

Each PO draws its `targetWorkingMinutes` independently from `U(minOperationWorkingMinutes, maxOperationWorkingMinutes)`. This produces natural variety: some POs finish within a single shift, others span a weekend or longer.

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
share the same `unitsPerHour` (global config) and therefore have identical working-time
duration. Each operation processes a different item in the batch at any given moment:
op[0] is on item N, op[1] is on item N−1, op[2] is on item N−2, etc.

Scheduling math:
```
cycleTime          = 60 / unitsPerHour                    (working minutes per item)
stagger            = setupMinutes + cycleTime             (working minutes until first item flows to next op)
targetWorkingMin   = U(minOperationWorkingMinutes, maxOperationWorkingMinutes)   (per PO)

op[i].start = addWorkingMinutes(op[0].start, i × stagger)
op[i].end   = addWorkingMinutes(op[i].start, targetWorkingMin)   (working-time duration)
po.start    = op[0].start
po.end      = op[last].end
```

`targetWorkingMin` is working time — nights, weekends, and any planned stoppages (work
orders, downtime events) are not counted. A PO with a long `targetWorkingMin` will
naturally span multiple calendar days or straddle a weekend. Batch size is
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

See `ITEMS.md` for the full item type definitions, BOM structure, operation types, and WIP derivation algorithm. Summary below.


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

See `inventory.md` for the authoritative model. Summary:

Four physical zones hold inventory:

| Zone | Contents |
|---|---|
| Reception | RM just arrived from suppliers, awaiting putaway |
| Storage | RM on shelves allocated to production; WIP between operations; FG post-production awaiting QC |
| Supply | RM staged near production lines, ready for consumption |
| Delivery | FG cleared by QC, awaiting shipment |

Every stock change is recorded as a timestamped `InventoryMovement`:

| Movement type | Triggered by | Effect |
|---|---|---|
| `receipt` | RM arrives at dock | `+qty` at reception |
| `putaway` | Putaway task executed | `−qty` reception, `+qty` storage |
| `replenishment` | RM moved to supply staging | `−qty` storage, `+qty` supply |
| `issue` | Operation starts (RM/WIP inputs; QC passthrough skipped) | `−qty` supply (RM) or storage (WIP) |
| `production` | WIP: operation ends; FG: production order ends | `+qty` storage |
| `quality_control` | FG passes QC | `−qty` storage, `+qty` delivery |
| `pick` / `shipment` | Pick task or shipment dispatched | `−qty` delivery |

Inventory positions at any point in time are derived by projecting movements up to that timestamp.

### 1.6 WMS master data

- **Warehouses** — four physical zones derived from the 3D scene: Reception, Storage, Supply, Delivery
- **WMS Locations** — Storage and Delivery use real bins from the 3D scene; Reception and Supply each use a single fallback bin (`{zoneId}-BIN-01`)

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

1. Starting from `windowStart` (snapped to the next shift start), place POs back-to-back.
2. For each PO slot, draw `targetWorkingMinutes` from the configured range and schedule
   **Operations** pipeline-style across work centers using working-time arithmetic.
3. After the operations are placed, scan the PO's wall-clock span for any PM work orders
   that have become due; inject them directly **inside** the PO (see §2.3).
4. Advance the cursor to `clampToShift(po.end)` and repeat.

The result is a dense, non-overlapping sequence of POs covering the full window. There
are no dedicated maintenance gaps between POs — work orders live inside production
order spans. A PO may start on any working day and end on a different calendar day,
crossing overnight gaps or weekends; only the accumulated working time determines when
the PO is done.

### 2.2 ERP orders

Sales Orders and Purchase Orders are placed relative to the MES timeline:

- Each PO (production order) is linked to a Sales Order line.
- Sales Order dates are set so `requestedDelivery ≥ po.scheduledEnd`.
- Purchase Orders for raw materials are placed with a lead time before the PO start.

### 2.3 EAM activity

- **Predictive Maintenance Work Orders** — for each asset, a PM is due every
  `frequencyDays` starting from a staggered offset within `windowStart`. When a PM
  comes due at a date that falls inside a PO's wall-clock span, the WO is placed at the
  next shift start at or after the due date (still within the PO span). The WO occupies
  `pmDurationHours` hours of working time, during which the production line is stopped.
  If the due date falls between two POs (e.g. over a weekend), the WO is placed at the
  next shift start regardless. In both cases, the WO's working time is deducted from the
  PO's net productive minutes when computing produced quantities (§3.1).
- Each asset's `nextDue` is advanced by `frequencyDays` after each placed WO.
- Downtime events (from §1.3 templates) are injected into operations during the same
  pass (see §2.1).

### 2.4 WMS movement events

- **Receipts** — RM arrives at the reception dock, chunked into batches of 10–20 operations per receipt. Timed to arrive 2 days before the first operation in each batch needs the material.
- **Putaway tasks** — one per operation (not per receipt), moving RM from reception to a storage bin. Bin assigned via greedy allocator; bin held from putaway date until consumption.
- **Replenishment** — RM moved from storage to the supply staging zone just before each operation starts.
- **Issue / consumption** — RM or WIP consumed at operation start, debited from supply (RM) or storage (WIP).
- **Production** — WIP or FG produced at operation/PO end, credited to storage.
- **Quality control transfer** — FG moves from storage to the delivery zone after the production order completes.
- **Pick tasks** — created 1 day before `SO.requestedDeliveryDate`. One per PO/SO pair.
- **Shipments** — FG leaves the delivery zone on `shipDate` (`pickDate + 6–12 h`). Shipment is the inventory-deleting event; pick task does not generate a separate movement.
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

Batch size is derived at the **PO level** from net productive time — the working time
remaining after all stoppages (nights/weekends, work orders, downtime events) are
removed.

```
effectiveUnitsPerHour = unitsPerHour × U(0.9, 1.1)      (sampled once per PO, shared by all ops)
shiftMinutes          = workingMinutes(po.start, po.end) (excl. nights/weekends)
woMinutes             = working minutes consumed by WOs whose span overlaps this PO
downtimeMinutes       = sum of all downtime event durations on all operations in this PO
netMinutes            = shiftMinutes - woMinutes - downtimeMinutes
producedQty           = floor(netMinutes × effectiveUnitsPerHour / 60)
```

All operations in the same PO share the same `producedQty` (identical effective duration
and rate).

```
effectiveYield = yieldRate + U(-(1-yieldRate), +(1-yieldRate))   (sampled per operation)
goodQty        = floor(producedQty × effectiveYield)
scrapQty       = producedQty - goodQty
```

- **Past POs** (`po.end < now`): full calculation above.
- **In-progress POs** (`po.start < now < po.end`): same formula but clamp the window to
  `[po.start, now]` — partial quantity proportional to elapsed productive time.
- **Future POs** (`po.start > now`): no produced qty yet; `plannedQty` is computed
  the same way as a projection.

### 3.2 OEE computation

Derived directly from the same numbers used in §3.1 — not generated independently:

```
plannedMinutes    = shiftMinutes                          (working time in [po.start, po.end])
stoppageMinutes   = woMinutes + downtimeMinutes           (WO time + unplanned downtime)
runtimeMinutes    = plannedMinutes - stoppageMinutes

Availability  = runtimeMinutes / plannedMinutes
Performance   = 1.0   (by construction — unitsPerHour is the ideal rate, net time gives ideal output)
Quality       = goodQty / producedQty
OEE           = Availability × Performance × Quality
```

Performance is 1.0 because `producedQty` is computed from net productive time at the
ideal rate. Availability losses come from **three sources**: off-shift gaps (nights/
weekends already excluded from `shiftMinutes`), planned stoppages (WOs), and unplanned
stoppages (downtime events). Quality losses come from scrap.

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

See `inventory.md` for the full movement and allocation model. Implementation notes below.

**Receipts**
- Consumptions are sorted by time and chunked into batches of 10–20 operations per receipt
- Receipt arrives 2 days before the first operation in the batch needs the material
- One ERP purchase order, AP invoice, and WMS receipt record per chunk
- `status` — `completed`

**Putaway tasks**
- One task per individual operation (consumption) within the receipt chunk, not per receipt
- `sourceLocationId` — reception fallback bin
- `destinationLocationId` — storage bin assigned by greedy allocator; bin held from `putawayDate` until `op.actualStart`
- `putawayDate` — `op.actualStart − 24h`
- `status` — `completed`

**Replenishment movements**
- No task record; movements only
- Emitted per RM input at operation start: `−qty` storage bin (from `opBinAssignment`), `+qty` supply fallback bin

**Issue / consumption movements**
- Emitted per operation input at `op.actualStart`
- RM: `−qty` from supply fallback bin
- WIP: `−qty` from storage fallback bin
- QC passthrough inputs are skipped

**Production movements**
- WIP: `+qty` storage fallback bin at `op.actualEnd`, per operation output
- FG: `+qty` storage fallback bin at `po.end`, using `producedQuantity`

**Quality control transfer movements**
- No task record; movements only
- Emitted once per PO after production: `−qty` storage fallback bin, `+qty` assigned delivery bin
- Timing: `po.end` (immediately after FG production movement)

**Pick tasks**
- One per PO/SO pair
- `sourceLocationId` — assigned delivery bin (greedy allocator; held from `pickDate` to `shipDate`)
- `createdAt` — `pickDate − 1 day`
- `pickedDate` — `delivDate` (`po.end + U(0.5, 2) days`)
- `status` — `completed`

**Shipments**
- `shippedDate` — `pickDate + U(6, 12) hours`
- Shipment is the sole inventory-deleting event: `−qty` delivery bin
- Pick task does not generate a separate inventory movement
- `status` — `shipped`

**Inventory positions**
- Derived by projecting all movements — not computed independently
- Positions with zero or negative balance are excluded

**Stock allocations**
Represent committed stock spoken for by a known demand. See `inventory.md` for allocation windows.

_RM allocations → production orders_ (storage zone)
- One allocation per RM item per PO
- `allocatedAt` — `max(PO.scheduledStart, putawayDate)` (effective once both demand and stock exist)
- `clearedAt` — `op.actualStart` (consumed)
- `allocatedQty` — `min(requiredQty, available)`; decrement available in PO date order

_FG allocations → sales orders_ (storage zone, then delivery zone)
- Storage allocation: from `po.end` (production) to `qcClearDate` (QC transfer)
- Delivery allocation: from `qcClearDate` to `shipDate`
- `allocatedQty` — `min(requiredQty, available)`; decrement available in SO delivery date order

Free (unallocated) stock = `quantityOnHand − quantityAllocated` per bin.

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

All statuses are fixed at their terminal (completed) value — see §Core Philosophy.

| Entity           | Generated status |
|------------------|-----------------|
| Production Order | `completed`     |
| Operation        | `completed`     |
| EAM Work Order   | `completed`     |
| Sales Order      | `shipped`       |
| Purchase Order   | `received`      |
| Invoice          | `paid`          |
| WMS Receipt      | `completed`     |
| WMS Shipment     | `shipped`       |
| Putaway Task     | `completed`     |
| Pick Task        | `completed`     |
| NC / CAPA        | `closed`        |
| Audit            | `completed`     |
| Complaint        | `closed`        |

---

## Open questions / TBD

- [x] One PO template per production location, named after the location.
- [x] `producedQty` variance: each PO instance draws an `effectiveUnitsPerHour` = `unitsPerHour × U(0.9, 1.1)` (uniform ±10%). Used in place of `unitsPerHour` for that PO's quantity calculation.
- [x] Shift configuration is configurable. Default: two shifts Mon–Fri, shift 1 06:00–14:00, shift 2 14:00–22:00.
- [x] PO duration is variable working time drawn from `U(minOperationWorkingMinutes, maxOperationWorkingMinutes)`, replacing the old fixed `operationDurationMinutes`. POs may span multiple days or straddle weekends.
- [x] Work orders occur inside PO spans, not between them. The PO's produced quantity accounts for WO time as stoppage. There are no dedicated maintenance gaps.
- [x] Yield: single configurable `yieldRate` (default 0.95). Per-operation effective yield = `yieldRate + U(-(1-yieldRate), +(1-yieldRate))`. The global rate is the median; variance scales with the defect rate.
- [x] Nonconformances are QMS-only entities, generated independently of MES scrap. Rate and MES linkage deferred pending QMS API schema review.
- [x] Item model: three types (FG, RM, WIP); WIP auto-derived from routing; operation inputs/outputs assigned per step; full inventory movement log with `asOf` projection. See §1.5a.
- [ ] Downtime template pool: specific categories to include — deferred
- [x] Putaway tasks: one task per operation consumption, receipt chunked into 10–20 ops, greedy bin allocator tracks storage bin per operation.
- [ ] Stock allocations: RM reserved for upcoming production orders; FG committed to sales orders — strategy defined in §3.5, not yet implemented.
- [ ] Replenishment movements (storage → supply) and quality control transfer movements (storage → delivery): defined in §3.5 and `inventory.md`, not yet implemented.
- [x] Cross-system linking: APS scheduled operations reference their MES counterpart via `mesOperationId`. EAM work orders and production orders are independent in the final dataset — their only relationship is temporal competition (WOs occupy gaps that POs cannot). Internal generation references (e.g. which gap a WO occupies) may exist during the timeline phase for coherence but are not emitted to the final dataset.

