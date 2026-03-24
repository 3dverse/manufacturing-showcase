# FactoryTimeline — Display Specification

## Purpose

The timeline is a scrubable, zoomable Gantt-style strip rendered at the bottom of
the factory view. It renders all events within the visible timespan as bars
(the **scope**) — past, present, and future simultaneously. The playhead (`asOf`)
marks a position on that view but does not filter what is rendered.

Filtering to only events active *at* `asOf` is the **snapshot** layer — consumed
by panel KPIs and 3D highlights, not by the timeline itself.

---

## asOf — the playhead

`asOf` is a unix timestamp (seconds) stored in `useTimelineStore`.

- On load it is initialised to `Date.now()` (the system clock).
- The user can drag the playhead or click anywhere on the track to scrub to any time.
- A **↺ now** reset button appears in the header whenever `asOf` differs from the
  current system clock.
- All derived state (snapshot, panel KPIs, 3D highlights) reacts to `asOf` changes.

---

## Zoom levels

| Key | Span    | Tick granularity   |
|-----|---------|--------------------|
| 1D  | ± 1 d   | Day                |
| 1W  | ± 3.5 d | Day                |
| 2W  | ± 7 d   | Day                |
| 1M  | ± 15 d  | Week (Mon-aligned) |
| 3M  | ± 45 d  | Week               |
| 6M  | ± 90 d  | Month              |

The window is always centred on the NOW marker, not on `asOf`.
This keeps the now-marker stable while the playhead moves.

---

## Visual landmarks

| Element          | Description                                              |
|------------------|----------------------------------------------------------|
| NOW marker       | Vertical accent line at system clock. Fixed position.    |
| Future zone tint | Subtle white overlay to the right of the NOW marker.     |
| Playhead         | Draggable accent dot + line at `asOf`.                   |
| Grid lines       | Minor (faint) and major (brighter) lines from tick set.  |

---

## Content by navigation level

The set of bars rendered on the timeline changes depending on which node is selected
in the navigation graph. Each level shows the entity type that is most meaningful at
that scope.

### 1. Factory

Bars: **Sales Orders** (ERP)

Each bar spans the sales order's requested delivery window. Color encodes status
(open, in progress, shipped, cancelled). This gives a demand-side view of the
factory's commitments — what has been sold and when it needs to ship.

Secondary: APS plan periods could be shown as a background band to indicate
when each planning horizon was active.

---

### 2. Area  *(production location)*

Bars: **Production Orders** (MES)

Each bar spans `scheduledStart → scheduledEnd` for a PO assigned to this area.
Color encodes status (released, in progress, completed). The area timeline gives a
throughput view: how densely the location is loaded and where gaps or delays fall.

---

### 3. Line

Bars across multiple tracks:

- **Production Orders** — POs whose operations run on any of this line's cells.
- **Operations** — all operations assigned to any work center (cell) in this line.
- **Downtime events** — stoppages on any work center in this line.

Each is rendered on its own track row. Useful when an area contains multiple
parallel lines running different product families.

---

### 4. Cell  *(work center)*

Bars across multiple tracks:

- **Production Orders** — POs that have at least one operation assigned to this
  work center.
- **Operations** — the specific operation assigned to this work center, one per PO.
- **Downtime events** — stoppages on this work center.

Each is rendered on its own track row.

---

### 5. Machine

Bars across multiple tracks:

- **Production Orders** — POs whose operations run on this machine's work center.
- **Operations** — the specific operation assigned to this machine's work center,
  one per PO. Scoped to this machine means scoped to its parent work center, since
  operations are assigned at the work center level.
- **EAM Work Orders** (corrective + preventive) — raised against this machine.
- **Downtime events** — MES-side stoppages linked to this machine's work center.

Each of the four is rendered as its own bar type on its own track row, so the user
can see production activity, maintenance activity, and stoppages in parallel without
overlap.
