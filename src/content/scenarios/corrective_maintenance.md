# Corrective Maintenance (`corrective_maintenance`)

**Entry point:** Production is running normally. An alert fires — a machine has just gone down mid-shift.

**End goal (both):**
1. **Visibility** — operator sees exactly which customer delivery is at risk and by how much.
2. **Action** — a corrective work order is created to resolve the failure.

**Theme:** Urgency. Red. Unplanned downtime.

---

## Focus (`CorrectiveFocus`)

Resolved from the latest `DowntimeEntry` in the span:

| Field | Source |
|---|---|
| `cellHash` / `cellName` | `CellNode` matching `downtime.workCenterId` |
| `downtimeId` | `DowntimeEntry.id` |
| `downtimeStartedAt` | `DowntimeEntry.startedAt` |
| `downtimeEndedAt` | `DowntimeEntry.endedAt` (null if ongoing) |
| `orderNumber` | `ProductionOrder` linked via `downtime.productionOrderId` |

`onFocusResolved` sets a custom 48h window: `[downtimeStartedAt - 24h, downtimeStartedAt + 24h]`.

---

## Time control

| Step | `present` | `asOf` |
|---|---|---|
| step_1 | `downtimeStartedAt - 1` | unchanged |
| step_2 | `downtimeStartedAt + duration/3` | `downtimeStartedAt + duration/3` |
| steps 3–9 | unchanged | unchanged |
| step_10 | `downtimeStartedAt + duration*2/3` | cleared (`undefined`) |

Duration fallback when `downtimeEndedAt` is null: 2 hours.

---

## Steps

| # | Title | Route | `beforeStep` side effects | DOM tag | File | Status |
|---|---|---|---|---|---|---|
| 1 | **Production at a glance** | `/` | `pause()`, `setPresent(startedAt - 1)` | `corrective-maintenance-step-1` | `HomePage.tsx` | ✅ |
| 2 | **Incident alert** | `/` | `setPresent(+1/3)`, `setAsOf(+1/3)` | `corrective-maintenance-step-2` | `ScadaEventsCallout.tsx` | ✅ |
| 3 | **Factory health** | `/phone-factory` | — | `corrective-maintenance-step-3` ¹ | `DesktopLayout.tsx` | ✅ |
| 4 | **Locate the incident** | `/phone-factory/<cell>` | — | `corrective-maintenance-step-4` | `InfoPanel.tsx` | ✅ |
| 5 | **Production interrupted** | `/phone-factory/<cell>/<downtime-id>` | returns `/phone-factory/<cell>/<downtimeId>` | `corrective-maintenance-step-5` | `CellSummary.tsx` | ✅ |
| 6 | **Downtime on the timeline** | `/phone-factory/<cell>` | — | `corrective-maintenance-step-6` ² | `Timeline.tsx` | ✅ |
| 7 | **Trace the order impact** | `/phone-factory/<cell>` | `setSelected({ type: "downtime", id })` — opens correlation panel | `corrective-maintenance-step-7` | — | ⏳ tag needed |
| 8 | **Affected order and customer** | `/phone-factory/<cell>` | — | `corrective-maintenance-step-8` | `CorrelationModal.tsx` | ✅ |
| 9 | **Create corrective work order** | `/phone-factory/<cell>` | — | `corrective-maintenance-step-9` | — | ⏳ tag + UI needed |
| 10 | **From alert to action** | `/phone-factory` | `setSelected(null)`, `setPresent(+2/3)`, `setAsOf(undefined)` | `corrective-maintenance-step-10` | — | ⏳ tag needed |

¹ Shared — DOM value: `"corrective-maintenance-step-3 predictive-maintenance-step-1"`
² Shared — DOM value: `"corrective-maintenance-step-6 predictive-maintenance-step-6"`

---

## Implementation Notes

**Step 7** opens the correlation panel programmatically. The spotlight tag `corrective-maintenance-step-7` does not yet exist in the DOM — the step renders but the spotlight won't find a target until the tag is added.

**Step 9** is currently visible (`skip: true` is commented out). The work order creation UI and the `corrective-maintenance-step-9` DOM tag still need to be built.

**Step 10** clears `asOf` (so the playhead disappears) rather than setting it, then moves `present` to the 2/3 point so the timeline window is centered on mid-downtime for the outro.
