# Scenario 1 — Incident Response (`maintenance_urgency`)

**Narrative:** A drilling machine has just failed mid-production. Operations needs to assess impact, stop the machine safely, understand what order is at risk, and act fast.

**Theme:** Urgency. Red. Unplanned downtime.

**`asOf` time:** moment of the latest `DowntimeEntry.startedAt`

---

## Steps

| # | Title | Route | Spotlight target | What the user sees |
|---|---|---|---|---|
| 1 | **Hypervisor overview** | `/` (Home) | `[data-scenario=incident-step-1]` — factory tile | The manufacturing order planning panel on the home page. Viewer sees all planned MOs and can appreciate the breadth of the operation before diving in. |
| 2 | **Incident alert** | `/phone-factory` | `[data-scenario=incident-step-2]` — IncidentCallout | An orange callout appears with the drilling machine incident. Two actions are presented: **Stop machine** and **Go to incident**. This is where the `incident` payload is active. |
| 3 | **Factory health at a glance** | `/phone-factory` | `[data-scenario=incident-step-3]` — KeyStatusIndicators | Spotlight on the 4 KPI badges (Efficiency, Quality, Tracking, Maintenance). One of them should be in warning/negative state, reflecting the active incident. |
| 4 | **Locate the incident** | `/phone-factory/<cell-hash>/<downtime-id>` | `[data-scenario=incident-step-4]` — CellIncident panel or IncidentInfoPanel in 3D | `beforeStep` uses `useTimelineStore` to find the latest downtime event, sets `asOf` to that moment, navigates to the affected cell. The 3D IncidentInfoPanel is visible on the floor. The CellIncident component shows "Incident reported" with a "Read the report" button for the PDF download. |
| 5 | **Timeline: downtime band** | `/phone-factory/<cell-hash>` | `[data-scenario=incident-step-5]` — Timeline footer | The timeline is zoomed to 1D view. A bright red band marks the downtime period for the affected machine. Show how the downtime overlaps with the active manufacturing order bar. |
| 6 | **Trace the affected order** | `/phone-factory/<cell-hash>` | `[data-scenario=incident-step-6]` — CorrelationModal (opened programmatically) | Click on the MO bar in the timeline opens the CorrelationModal. The viewer sees the full chain: Downtime → Operation → Production Order → Sales Order → Customer. Shows which customer delivery is at risk. |

---

## Implementation Notes

**Step 4 `beforeStep`:** Already partially implemented — finds the latest `DowntimeEntry`, sets `asOf`, and returns the route including the downtime ID.

**New UI tags needed:**
- `[data-scenario=incident-step-5]` — on the Timeline footer tab button or the timeline container
- `[data-scenario=incident-step-6]` — on the CorrelationModal or the MO bar on the timeline
