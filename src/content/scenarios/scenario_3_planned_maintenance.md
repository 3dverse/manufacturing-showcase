# Scenario 3 — Planned Maintenance (`planned_maintenance`)

**Narrative:** A routine scheduled inspection on a CNC drilling machine is coming up. The operations team can see exactly how production has been organized around it — orders shifted, materials pre-positioned, nothing is at risk.

**Theme:** Control. Green. Process excellence.

**`asOf` time:** a few days before the upcoming EAM work order

---

## Steps

| # | Title | Route | Spotlight target | What the user sees |
|---|---|---|---|---|
| 1 | **Order planning calendar** | `/` (Home) | `[data-scenario=planned-maintenance-step-1]` — ManufacturingOrderPlanning panel | The home page planning panel. All MOs are healthy/green. One has been split or shifted — a gap visible in the schedule — corresponding to the upcoming maintenance window. |
| 2 | **Factory KPIs in green** | `/phone-factory` | `[data-scenario=planned-maintenance-step-2]` — KeyStatusIndicators | All 4 KPI badges are positive. Maintenance is scheduled, known, and accounted for. This contrasts with scenario 1 where Maintenance was red. |
| 3 | **Navigate to the maintenance cell** | `/phone-factory/<cell-hash>` | `[data-scenario=planned-maintenance-step-3]` — Navigation bar, targeted cell pill | The cell being maintained is navigated to. No downtime warning badge — the cell is currently healthy. Cell is in production. |
| 4 | **EAM Work Order on timeline** | `/phone-factory/<cell-hash>` | `[data-scenario=planned-maintenance-step-4]` — Timeline amber band (EAM Work Order) | An amber band marks the planned maintenance window in the future (type: `preventive`). MO bars stop just before and resume just after. The plan is visible and clean. |
| 5 | **Trace to sales order — on-time delivery** | `/phone-factory/<cell-hash>` | `[data-scenario=planned-maintenance-step-5]` — CorrelationModal WorkOrderSheet or SalesOrderSheet | Open the CorrelationModal on the EAM work order. Trace: Work Order → Production Order → Sales Order. The sales order `requestedDeliveryDate` is safely after the maintenance window ends. Customer delivery is unaffected. |
| 6 | **Storage: materials pre-positioned** | `/phone-factory/<storage-area-hash>` | `[data-scenario=planned-maintenance-step-6]` — StorageAreaSummary panel | Navigate to the Storage Area. The StorageAreaSummary shows raw material allocations ready for the post-maintenance production run. Inbound POs (reception) have been timed to arrive before the window. Bin occupancy is healthy. |
| 7 | **BOM — product routing** | `/phone-factory/<storage-area-hash>` | `[data-scenario=planned-maintenance-step-7]` — BOMPanel, routing tab | Switch to BOM view. Show the routing for the product that will be produced after maintenance. The BOM node for the maintained cell is visible. Everything downstream of the cell has materials allocated. |

---

## Implementation Notes

**Step 6 `beforeStep`:** Navigate to the storage area hash to show its 3D overlay panels.

**New UI tags needed:**
- `[data-scenario=planned-maintenance-step-2]` — on the KeyStatusIndicators block (currently only tagged as `incident-step-3`, consider dual-tagging or using a shared attribute)
- `[data-scenario=planned-maintenance-step-3]` — on the Navigation cell pill for the target cell
- `[data-scenario=planned-maintenance-step-4]` — on the Timeline
- `[data-scenario=planned-maintenance-step-5]` — on the CorrelationModal
- `[data-scenario=planned-maintenance-step-6]` — on the StorageAreaSummary overlay panel
- `[data-scenario=planned-maintenance-step-7]` — on the BOM Panel
