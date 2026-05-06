# Planned Maintenance (`planned_maintenance`)

**Entry point:** "This was our worst-performing machine." A machine had chronic unplanned downtime. A new maintenance plan was put in place. Here's what changed.

**End goal (measurable impact):** OEE and MTBF have recovered. Unplanned stoppages this quarter: 0. The maintenance plan itself is visible as the artifact that made it possible — and the next window is already scheduled.

**Theme:** Control. Green. Before/after proof of operational excellence.

**Time control:** `asOf` = current time; timeline extended to show historical downtime density

---

## Narrative arc

> The machine was the floor's biggest headache — chronic breakdowns, missed orders, frustrated teams. A structured maintenance plan was implemented. The timeline tells the before/after story visually: dense red bands on the left, clean amber preventive windows on the right. OEE and MTBF confirm the improvement in numbers.

---

## Steps

| # | Title | Route | DOM tag | File | Status |
|---|---|---|---|---|---|
| 1 | **The problem machine** | `/phone-factory/<cell>` | `planned-maintenance-step-1` | — | ⏳ tag needed |
| 2 | **The before — downtime history** | `/phone-factory/<cell>` | `planned-maintenance-step-2` | — | ⏳ tag needed |
| 3 | **The inflection point** | `/phone-factory/<cell>` | `planned-maintenance-step-3` | — | ⏳ tag needed |
| 4 | **OEE and MTBF recovery** | `/phone-factory/<cell>` | `planned-maintenance-step-4` | — | ⏳ tag needed |
| 5 | **The maintenance plan** | `/phone-factory/<cell>` | `planned-maintenance-step-5` | — | ⏭ skip |
| 6 | **Current timeline: clean** | `/phone-factory/<cell>` | `planned-maintenance-step-6` | — | ⏳ tag needed |
| 7 | **Business impact** | `/phone-factory/<cell>` | `planned-maintenance-step-7` | — | ⏳ tag needed |

---

## Implementation Notes

**`resolve` logic:** Finds the cell with the most historical downtime events that also has a `preventive` EAM work order. This gives the "worst performer that now has a plan" story.

**Steps 1–4, 6–7:** All tags need to be added to existing DOM elements once the planned maintenance UI pass is done. Step 4 shares the OEE section already tagged for predictive (`predictive-maintenance-step-3` in `CellPanel.tsx`) — may need a second value added.

**Step 5 (`skip: true`):** Same EAM work order detail panel needed as predictive step 4. Unblocked when that surface is built.
