# Scenario 2 — Predictive Maintenance (`predicitve_maintenance`)

**Narrative:** The system has detected degrading performance on a welding robot before it fails. Maintenance can schedule a work order proactively, preserving production continuity.

**Theme:** Anticipation. Amber. Data-driven decision.

**`asOf` time:** current real time (or slightly ahead, showing the EAM work order in the future amber band)

---

## Steps

| # | Title | Route | Spotlight target | What the user sees |
|---|---|---|---|---|
| 1 | **Production health overview** | `/phone-factory` | `[data-scenario=predictive-maintenance-step-1]` — KeyStatusIndicators | The 4 KPI badges. Maintenance is in **warning** state — not failed, but flagged. This introduces the idea that something is being monitored. |
| 2 | **Navigate to the at-risk cell** | `/phone-factory/<cell-hash>` | `[data-scenario=predictive-maintenance-step-2]` — Navigation bar, cell pill with warning badge | The Navigation bar shows a red warning badge on a line or cell. Spotlight on the badge. User can see the hierarchy: Production Area → Line → Cell with the warning. |
| 3 | **OEE degradation trend** | `/phone-factory/<cell-hash>` | `[data-scenario=predictive-maintenance-step-3]` — CellSummary OEE gauge or CellPanel OEE sparkline | The OEE circular gauge and the sparkline history in the CellPanel. The trend is declining. The viewer understands there's a negative pattern even though no outright failure has occurred yet. Metrics panel shows MTBF and MTTR. |
| 4 | **Scheduled EAM work order** | `/phone-factory/<cell-hash>` | `[data-scenario=predictive-maintenance-step-4]` — Timeline amber band | The timeline shows an amber EAM Work Order band (type: `preventive`) scheduled in the near future for this cell. The maintenance intervention is already planned — triggered by the predictive signal. |
| 5 | **Production continuity** | `/phone-factory/<cell-hash>` | `[data-scenario=predictive-maintenance-step-5]` — Timeline MO bars around the amber band | The manufacturing orders on the timeline are arranged around the maintenance window — the last MO before maintenance completes on time, the next starts after. No customer delivery is impacted. |
| 6 | **BOM — affected component** | `/phone-factory/<cell-hash>` | `[data-scenario=predictive-maintenance-step-6]` — BOMPanel footer tab | Switch to BOM view. The at-risk cell is highlighted in the BOM diagram (clicking a BOM node selects the cell). The viewer sees where in the product hierarchy this machine sits: which WIP or finished good it produces. |

---

## Implementation Notes

**Step 2 `beforeStep`:** Navigate to the cell that has the welding/at-risk machine. Can use a known `CellNode.hash` similar to how scenario 1 step 4 uses `/phone-factory/ec07e887`.

**New UI tags needed:**
- `[data-scenario=predictive-maintenance-step-2]` — on the Navigation line/cell pill that has a warning badge
- `[data-scenario=predictive-maintenance-step-3]` — on the OEE gauge in CellPanel or CellSummary
- `[data-scenario=predictive-maintenance-step-4]` — on the Timeline component (amber band area)
- `[data-scenario=predictive-maintenance-step-5]` — on the Timeline footer or MO bar
- `[data-scenario=predictive-maintenance-step-6]` — on the BOM Panel tab button
