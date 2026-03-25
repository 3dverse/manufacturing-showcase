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
- **Items** — finished goods + raw materials

### 1.6 WMS master data

- **Warehouses** — raw material store + finished goods store
- **WMS Locations** — racks/bins within each warehouse

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

- **Receipts** — raw material inbound, timed to arrive just before the PO that consumes them.
- **Pick tasks** — timed to ship finished goods shortly after the PO that produced them.
- **Shipments** — linked to Sales Order delivery dates.

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
- `orderDate` — PO `po.start` minus a random 3–10 day lead
- `requestedDeliveryDate` — PO `po.end` plus a 1–3 day buffer
- `status` — `open / in_progress / shipped` mirroring linked PO status
- Line items: `quantity` = PO `goodQty`, `unitPrice` from item master, `lineAmount` = qty × price

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
- `receivedDate` — matches PO expected delivery date
- `quantity` — matches PO line quantity
- `status` — `completed` if past, `pending` if future

**Pick tasks**
- `pickedDate` — PO `actualEnd` plus small buffer
- `quantity` — SO line quantity
- `status` — `completed` if past, `open` if future

**Shipments**
- `shippedDate` — same as or shortly after pick completion
- `status` — `shipped` if past, `pending` if future

**Inventory positions** (snapshot at `now`)
- Raw material on-hand = sum of received quantities − quantities consumed by past POs
- Finished goods on-hand = sum of `goodQty` from completed POs − sum of shipped quantities

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
- [ ] Downtime template pool: specific categories to include — deferred
- [x] Cross-system linking: APS scheduled operations reference their MES counterpart via `mesOperationId`. EAM work orders and production orders are independent in the final dataset — their only relationship is temporal competition (WOs occupy gaps that POs cannot). Internal generation references (e.g. which gap a WO occupies) may exist during the timeline phase for coherence but are not emitted to the final dataset.
