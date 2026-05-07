# Predictive Maintenance (`predictive_maintenance`)

**Entry point:** Everything looks green — but a welding robot's OEE has been quietly declining for days.

**End goal (actionable):** The system has detected the signal and a new maintenance work order has been created, complete with the steps and guide the technician will follow. Failure never happens. Production continuity is confirmed.

**Theme:** Anticipation. Amber. Data-driven decision.

**Time control:** `asOf` = current real time (EAM work order visible as a future amber band)

---

## Narrative arc

> A degrading OEE trend triggers a predictive alert before any failure occurs. The maintenance team acts on the signal: a work order is created with a concrete maintenance guide. The timeline confirms the intervention is scheduled without impacting any active production orders.

---

## Steps

| # | Title | Route | DOM tag | File | Status |
|---|---|---|---|---|---|
| 1 | **Factory health — amber signal** | `/tokyo-phone-factory` | `predictive-maintenance-step-1` ¹ | `DesktopLayout.tsx` | ✅ — `Efficiency` = warning, `Maintenance` = ok |
| 2 | **Navigate to the at-risk cell** | `/tokyo-phone-factory/<cell>` | `predictive-maintenance-step-2` | `Navigation.tsx` (dynamic) | ✅ |
| 3 | **OEE degradation trend** | `/tokyo-phone-factory/<cell>` | `predictive-maintenance-step-3` | `CellPanel.tsx` | ✅ |
| 4 | **Maintenance work order** | `/tokyo-phone-factory/<cell>` | `predictive-maintenance-step-4` | — | ⏭ skip |
| 5 | **Scheduled on the timeline** | `/tokyo-phone-factory/<cell>` | `predictive-maintenance-step-5` | `Timeline.tsx` (workOrderBands wrapper) | ✅ |
| 6 | **Production continuity confirmed** | `/tokyo-phone-factory/<cell>` | `predictive-maintenance-step-6` ² | `Timeline.tsx` | ✅ |

¹ Shared element — DOM value: `"corrective-maintenance-step-3 predictive-maintenance-step-1"`
² Shared element — DOM value: `"corrective-maintenance-step-6 predictive-maintenance-step-6"`

---

## Implementation Notes

**Step 2 (Navigation badge):** The cell pill in `Navigation.tsx` gets `data-scenario~="predictive-maintenance-step-2"` dynamically when `focus.kind === "predictive"` and `node.hash === focus.cellHash`. An amber wrench badge is also rendered.

**Step 4 (`skip: true`):** The EAM work order detail panel with maintenance guide/steps does not exist yet. Remove `skip: true` and add `predictive-maintenance-step-4` to the panel when built.

**`resolve` logic:** Finds the nearest future `preventive` EAM work order in the span, resolves the matching cell node.
