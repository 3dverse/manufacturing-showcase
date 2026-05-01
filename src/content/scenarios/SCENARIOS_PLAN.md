# Guided Scenario Plan

Three scenarios walk a viewer through three states of a maintenance operation — from reacting to a crisis, to acting on a prediction, to proving that a systematic plan works. Each scenario ends on a measurable, actionable payoff.

See individual scenario files for step-by-step details:
- [Corrective Maintenance](./corrective_maintenance.md)
- [Predictive Maintenance](./predictive_maintenance.md)
- [Planned Maintenance](./planned_maintenance.md)

---

## Narrative Arc

| | Corrective | Predictive | Planned |
|---|---|---|---|
| **Entry** | Machine just failed mid-shift | OEE trend quietly declining | Worst-performing machine, new plan in place |
| **Posture** | React | Anticipate | Prove |
| **KPI state** | Maintenance = red | Maintenance = amber | Maintenance = green |
| **Timeline focus** | Red downtime band (now) | Amber EAM band (near future) + declining OEE | Before: dense red bands / After: clean amber windows |
| **Actionable end** | Customer at risk identified + corrective work order created | Maintenance work order with technician guide | OEE/MTBF recovery + 0 unplanned stoppages this quarter |
| **Emotional arc** | Crisis → assess → act | Signal → predict → schedule | Problem → plan → proof |

---

## Shared DOM Elements

Some DOM elements are referenced by multiple scenarios. They carry space-separated `data-scenario` values and are queried with the `~=` CSS attribute selector.

| Element | File | DOM value |
|---|---|---|
| `KeyStatusIndicators` strip | `DesktopLayout.tsx` | `"corrective-maintenance-step-3 predictive-maintenance-step-1"` |
| `Timeline` `<aside>` | `Timeline.tsx` | `"corrective-maintenance-step-6 predictive-maintenance-step-6"` |

---

## Tag Naming Convention

All `data-scenario` attributes follow the pattern `{scenario-name}-step-{number}`:
- `corrective-maintenance-step-N`
- `predictive-maintenance-step-N`
- `planned-maintenance-step-N`

Selectors in `scenarios.tsx` use the `~=` word-match operator to support multi-value attributes:
```
selector: "[data-scenario=corrective-maintenance-step-3]"
```

---

## Time Control

| | Corrective | Predictive | Planned |
|---|---|---|---|
| **Window** | Custom 48h (± 24h around downtime) via `onFocusResolved` | Default zoom | Extended historical view |
| **`present` per step** | step 1: `downtimeStartedAt - 1` / step 2: `+duration/3` / step 10: `+duration*2/3` | — | — |
| **NOW cursor** | Visible (shows `present`) | Visible | Visible |
| **Playhead** | Hidden during scenario | Hidden | Hidden |

---

## Mock Data Requirements

**Corrective:** existing downtime event data is sufficient.

**Predictive:** needs a cell with a declining OEE sparkline and a future `preventive` EAM work order in the span.

**Planned:** needs a cell with dense historical downtime events and a `preventive` EAM work order. The cell with the most downtime events + a preventive WO is selected automatically by `resolve`.
