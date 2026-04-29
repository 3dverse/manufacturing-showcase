# Guided Scenario Plan

Three scenarios walk a viewer through increasingly different maintenance situations — from a crisis to a prediction to a scheduled event. Each scenario navigates the app's real features in sequence, spotlighting a different part of the digital twin.

See individual scenario files for step-by-step details:
- [Scenario 1 — Incident Response](./scenario_1_incident_response.md)
- [Scenario 2 — Predictive Maintenance](./scenario_2_predictive_maintenance.md)
- [Scenario 3 — Planned Maintenance](./scenario_3_planned_maintenance.md)

---

## Narrative Contrast

| | Incident | Predictive | Planned |
|---|---|---|---|
| **KPI state** | Maintenance = red | Maintenance = amber/warning | Maintenance = green |
| **Timeline focus** | Red downtime band (now) | Amber EAM band (future) + declining OEE | Amber EAM band (future) + healthy MOs |
| **Correlation** | Downtime → MO → SO at risk | EAM WO → MO → SO safe | EAM WO → MO → SO safe |
| **Storage** | Not shown | Not shown | Pre-positioned materials |
| **BOM** | Not shown | At-risk component | Full routing post-maintenance |
| **Emotional arc** | Crisis → assess → act | Signal → predict → schedule | Plan → confirm → relax |

---

## Cross-scenario Notes

### Shared UI elements that need `data-scenario` attributes
The following elements are referenced by multiple scenarios and may need dynamic or multi-valued attributes:
- **KeyStatusIndicators** — used in incident (step 3), predictive (step 1), planned (step 2). Currently tagged as `incident-step-3` only.
- **Timeline** — used in incident (step 5), predictive (steps 4–5), planned (step 4).
- **BOMPanel** — used in predictive (step 6), planned (step 7).
- **Navigation line/cell pills** — used in predictive (step 2), planned (step 3).

### `asOf` time control
The timeline `asOf` state is the key to showing the right moment in each scenario:
- **Incident:** `asOf` = moment of the latest `DowntimeEntry.startedAt`
- **Predictive:** `asOf` = current real time (or slightly ahead, showing the EAM work order in the future amber band)
- **Planned:** `asOf` = a few days before the upcoming EAM work order
