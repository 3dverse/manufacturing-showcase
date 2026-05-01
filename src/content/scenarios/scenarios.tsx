import type { ScenarioStep } from "../../content/type";
import type { FactoryNode, CellNode } from "@/content/type";
import type { DowntimeEntry, TimelineSpan } from "@/core/Scope";
import { useTimelineStore } from "@/store/useTimelineStore";
import { useFocusStore } from "@/store/useFocusStore";
import { timeAgo } from "@/utils/helpers-time";

//------------------------------------------------------------------------------
// Existing action/incident types

export type ScenarioCellMatcher = {
    lineNameIncludes?: string[];
    cellNameIncludes?: string[];
    machineNameIncludes?: string[];
};

export type ScenarioIncidentAction = {
    label: string;
    disabled?: boolean;
    role: "stopMachine" | "goToIncident";
};

export type ScenarioSalesOrderIncident = {
    orderRef: string;
    startDateIso: string;
    title: string;
    warningMessage: string;
    actions: ScenarioIncidentAction[];
};

//------------------------------------------------------------------------------
// Per-scenario focus types — resolved from live span data

export type CorrectiveFocus = {
    kind: "corrective";
    cellHash: string;
    cellName: string;
    downtime: DowntimeEntry;
    orderNumber: string | null;
};

export type PredictiveFocus = {
    kind: "predictive";
    cellHash: string;
    cellName: string;
    workOrderId: string;
    workOrderNumber: string;
    scheduledStart: number;
    scheduledEnd: number;
};

export type PlannedFocus = {
    kind: "planned";
    cellHash: string;
    cellName: string;
    workOrderId: string;
    workOrderNumber: string;
    historicalDowntimeCount: number;
};

export type ScenarioFocus = CorrectiveFocus | PredictiveFocus | PlannedFocus;

//------------------------------------------------------------------------------
// ScenarioDefinition

export type ScenarioDefinition = {
    disabled?: boolean;
    id: string;
    title: string;
    description: string;
    image?: string;
    /** Inspect span + nodeGraph and return the entities this scenario will spotlight. */
    resolve?: (span: TimelineSpan, nodeGraph: FactoryNode) => ScenarioFocus | null;
    /** Called once when focus is first resolved — set window/time overrides here so they apply regardless of which step the user is on. */
    onFocusResolved?: (focus: ScenarioFocus) => void;
    /** Either a static array or a factory that receives the resolved focus. */
    steps: ScenarioStep[] | ((focus: ScenarioFocus | null) => ScenarioStep[]);
};

//------------------------------------------------------------------------------
// Helpers

function allCells(nodeGraph: FactoryNode): CellNode[] {
    const cells: CellNode[] = [];
    for (const area of nodeGraph.areas) {
        cells.push(...area.cells);
        for (const line of area.lines) cells.push(...line.cells);
    }
    return cells;
}

function cellByMachineHash(nodeGraph: FactoryNode, machineHash: string): CellNode | null {
    return allCells(nodeGraph).find((c) => c.machines.some((m) => m.hash === machineHash)) ?? null;
}

//------------------------------------------------------------------------------
// Scenarios

const INCIDENT_CELL_HASH = "ec07e887";
const INCIDENT_REASON_CODE = "COOLANT_LEAK";

//------------------------------------------------------------------------------
export const SCENARIOS: Record<string, ScenarioDefinition> = {
    corrective_maintenance: {
        id: "corrective_maintenance",
        title: "Incident",
        description:
            "An unplanned machine stop has halted drilling operations mid-run. Identify the impact, trace it to the customer, and respond.",
        image: "/scenarios/scenario_1.png",

        resolve(span, nodeGraph) {
            const latest = [...span.downtimeEvents.values()]
                .filter((dt) => dt.reasonCode === INCIDENT_REASON_CODE)
                .sort((a, b) => b.startedAt - a.startedAt)[0];
            if (!latest) return null;

            const cell = allCells(nodeGraph).find((c) => c.hash === INCIDENT_CELL_HASH);
            if (!cell) return null;

            const order = latest.productionOrderId ? span.productionOrders.get(latest.productionOrderId) : null;

            return {
                kind: "corrective",
                cellHash: cell.hash,
                cellName: cell.name,
                downtime: latest,
                orderNumber: order?.orderNumber ?? null,
            };
        },

        onFocusResolved(focus) {
            const f = focus as CorrectiveFocus;
            useTimelineStore
                .getState()
                .setCustomWindow(f.downtime.startedAt - 24 * 3600, f.downtime.startedAt + 24 * 3600);
        },

        steps(focus): ScenarioStep[] {
            const f = focus?.kind === "corrective" ? focus : null;
            const cellRoute = f ? `/phone-factory/${f.cellHash}` : "/phone-factory";

            const downtimeDuration = f
                ? (f.downtime.endedAt ?? f.downtime.startedAt + 2 * 3600) - f.downtime.startedAt
                : 0;
            const timeAtOneThird = f ? f.downtime.startedAt + Math.floor(downtimeDuration / 3) : 0;
            const timeAtTwoThirds = f ? f.downtime.startedAt + Math.floor((downtimeDuration * 2) / 3) : 0;

            return [
                {
                    id: "step_1",
                    title: "Production at a glance",
                    circleSize: 500,
                    offsetX: 50,
                    offsetY: 100,
                    description: (
                        <p>
                            All manufacturing orders are running across the site
                            {f?.orderNumber ? (
                                <>
                                    {" — "}
                                    <strong>{f.orderNumber}</strong> is on schedule on the factory floor
                                </>
                            ) : (
                                " on the factory floor"
                            )}
                            . Everything looks nominal.
                        </p>
                    ),
                    route: "/",
                    beforeStep: f
                        ? () => {
                              const { pause, setPresent } = useTimelineStore.getState();
                              pause();
                              setPresent(f.downtime.startedAt - 1);
                          }
                        : undefined,
                    selector: "[data-scenario=corrective-maintenance-step-1]",
                },
                {
                    id: "step_2",
                    title: "Incident alert",
                    circleSize: 500,
                    offsetY: 60,
                    offsetX: -100,
                    incident: {
                        message: "Downtime detected",
                        title: "Downtime detected",
                        warningMessage:
                            focus?.kind === "corrective" &&
                            `${focus.downtime.reasonDescription} maintenance  ${timeAgo(new Date(focus.downtime.startedAt * 1000))}.`,
                        actions: [{ label: "Go to the incident", disabled: false, role: "goToIncident" }],
                    },
                    description: f?.orderNumber ? (
                        <p>
                            Production order <strong>{f.orderNumber}</strong> was running on this machine when it
                            stopped. This order is now at risk — navigate to the factory floor to assess the impact.
                        </p>
                    ) : (
                        <p>
                            An alert fired — the CNC drilling machine stopped unexpectedly. Navigate to the factory
                            floor to assess the impact.
                        </p>
                    ),
                    route: "/",
                    beforeStep: f
                        ? () => {
                              const { setPresent, setAsOf } = useTimelineStore.getState();
                              setPresent(timeAtOneThird);
                              setAsOf(timeAtOneThird);
                          }
                        : undefined,
                    selector: "[data-scenario=corrective-maintenance-step-2]",
                },
                {
                    skip: true,
                    id: "step_3",
                    title: "Factory health",
                    circleSize: 500,
                    offsetX: -100,
                    offsetY: 50,
                    description: (
                        <p>
                            The KPI dashboard reflects the impact in real time. The <strong>Maintenance</strong>{" "}
                            indicator has turned red — the unplanned stop is now visible at factory level.
                        </p>
                    ),
                    route: "/phone-factory",
                    selector: "[data-scenario=corrective-maintenance-step-3]",
                },
                {
                    skip: true,
                    id: "step_4",
                    title: "Locate the incident",
                    circleSize: 700,
                    top: "40%",
                    left: "70%",
                    description: (
                        <p>
                            The digital twin navigates to the <strong>{f?.cellName ?? "affected"} cell</strong>. The 3D
                            marker pinpoints the exact machine.
                        </p>
                    ),
                    route: "/phone-factory",
                    selector: "[data-scenario=corrective-maintenance-step-4]",
                },
                {
                    id: "step_5",
                    title: "Production interrupted",
                    circleSize: 700,
                    top: "40%",
                    left: "90%",
                    route: cellRoute,
                    description: (
                        <p>
                            The cell summary shows what was running at the moment of the stop
                            {f?.orderNumber ? (
                                <>
                                    {" — "}
                                    <strong>{f.orderNumber}</strong> mid-operation
                                </>
                            ) : null}
                            . Units that were in progress are now unaccounted for.
                        </p>
                    ),
                    selector: "[data-scenario=corrective-maintenance-step-5]",
                    beforeStep: f
                        ? () => {
                              return `/phone-factory/${f.cellHash}`;
                          }
                        : undefined,
                },
                {
                    skip: true,
                    id: "step_6",
                    title: "Downtime on the timeline",
                    circleSize: 250,
                    offsetX: 50,
                    offsetY: -300,
                    description: (
                        <p>
                            The timeline shows the <strong>red band</strong> marking the exact downtime window. The
                            {f?.orderNumber ? (
                                <>
                                    {" "}
                                    <strong>{f.orderNumber}</strong> bar
                                </>
                            ) : (
                                " MO bar"
                            )}{" "}
                            runs through it — the interruption mid-run is visible and the production gap is clear.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=corrective-maintenance-step-6]",
                },
                {
                    skip: true,
                    id: "step_7",
                    title: "Trace the order impact",
                    circleSize: 200,
                    offsetX: 30,
                    offsetY: -250,
                    description: <p>Downtime events can be inspected to reveal key details.</p>,
                    route: cellRoute,
                    beforeStep: f
                        ? () => {
                              useFocusStore.getState().setSelected({ type: "downtime", id: f.downtime.id });
                          }
                        : undefined,
                    selector: "[data-scenario=corrective-maintenance-step-6]",
                },
                {
                    skip: true,
                    id: "step_8",
                    title: "Affected order and customer",
                    circleSize: 400,
                    offsetX: -250,
                    offsetY: 50,
                    description: (
                        <p>
                            The correlation panel traces the full chain from the downtime event through the
                            {f?.orderNumber ? (
                                <>
                                    {" "}
                                    production order <strong>{f.orderNumber}</strong>
                                </>
                            ) : (
                                " production order"
                            )}{" "}
                            all the way to the sales order and customer. The at-risk delivery is identified by name.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=corrective-maintenance-step-8]",
                },
                {
                    skip: true,
                    id: "step_9",
                    title: "Create corrective work order",
                    //skip: true,
                    description: (
                        <p>
                            From the incident panel, raise a corrective work order: assign a technician, log the failure
                            reason, and set an estimated resolution time. The crisis is acknowledged and a response is
                            in motion.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=corrective-maintenance-step-9]",
                },
                {
                    id: "step_10",
                    title: "From alert to action",
                    circleSize: 600,
                    offsetX: -100,
                    offsetY: 50,
                    description: (
                        <p>
                            From the moment the alert fired, the digital twin surfaced everything that mattered — the
                            machine, the order, the customer — without a single phone call or spreadsheet. That is the
                            difference a connected factory floor makes.
                        </p>
                    ),
                    route: "/phone-factory",
                    beforeStep: f
                        ? () => {
                              useFocusStore.getState().setSelected(null);
                              const { setPresent, setAsOf } = useTimelineStore.getState();
                              setPresent(timeAtTwoThirds);
                              setAsOf(undefined);
                              return `/phone-factory/${f.cellHash}/${f.downtime.id}`;
                          }
                        : undefined,
                    selector: "[data-scenario=corrective-maintenance-step-10]",
                },
            ];
        },
    },

    predictive_maintenance: {
        disabled: true,
        id: "predictive_maintenance",
        title: "Predictive maintenance",
        description:
            "A degrading OEE trend has been detected before any failure occurs. Act on the signal, schedule a work order, and confirm production continuity.",
        image: "/scenarios/scenario_2.png",

        resolve(span, nodeGraph) {
            const now = Date.now() / 1000;
            const futurePreventive = [...span.eamWorkOrders.values()]
                .filter((wo) => wo.workType === "predictive" && wo.scheduledStart > now)
                .sort((a, b) => a.scheduledStart - b.scheduledStart)[0];
            console.log({ futurePreventive });
            if (!futurePreventive) return null;

            const cell = cellByMachineHash(nodeGraph, futurePreventive.assetId);
            console.log({ cell, futurePreventive });
            if (!cell) return null;

            return {
                kind: "predictive",
                cellHash: cell.hash,
                cellName: cell.name,
                workOrderId: futurePreventive.id,
                workOrderNumber: futurePreventive.workOrderNumber,
                scheduledStart: futurePreventive.scheduledStart,
                scheduledEnd: futurePreventive.scheduledEnd,
            };
        },

        steps(focus) {
            const f = focus?.kind === "predictive" ? focus : null;
            const cellRoute = f ? `/phone-factory/${f.cellHash}` : "/phone-factory";

            return [
                {
                    id: "step_1",
                    title: "Factory health — amber signal",
                    description: (
                        <p>
                            Most KPI badges look healthy — but <strong>Efficiency</strong> is showing a warning. OEE has
                            been quietly declining. Something needs attention before it becomes a failure.
                        </p>
                    ),
                    route: "/phone-factory",
                    selector: "[data-scenario=predictive-maintenance-step-1]",
                },
                {
                    id: "step_2",
                    title: "Navigate to the at-risk cell",
                    description: (
                        <p>
                            A warning badge on the <strong>{f?.cellName ?? "affected"} cell</strong> in the navigation
                            bar flags the degrading machine before any failure occurs.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=predictive-maintenance-step-2]",
                },
                {
                    id: "step_3",
                    title: "OEE degradation trend",
                    description: (
                        <p>
                            The OEE gauge and sparkline show a declining trend over the past week. MTBF is shrinking.
                            The pattern is clear even though no outright failure has occurred yet.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=predictive-maintenance-step-3]",
                },
                {
                    id: "step_4",
                    title: "Maintenance work order",
                    skip: true,
                    description: (
                        <p>
                            The predictive alert has generated a new work order{" "}
                            {f?.workOrderNumber ? (
                                <>
                                    (<strong>{f.workOrderNumber}</strong>)
                                </>
                            ) : null}
                            . The panel shows the assigned technician and the step-by-step maintenance guide to follow.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=predictive-maintenance-step-4]",
                },
                {
                    id: "step_5",
                    title: "Scheduled on the timeline",
                    description: (
                        <p>
                            The timeline shows the <strong>amber band</strong> for the scheduled maintenance window. The
                            intervention is planned and visible.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=predictive-maintenance-step-5]",
                },
                {
                    id: "step_6",
                    title: "Production continuity confirmed",
                    description: (
                        <p>
                            Manufacturing orders are arranged cleanly around the maintenance window — the last order
                            completes before, the next starts after. No customer delivery is affected. Failure
                            prevented.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=predictive-maintenance-step-6]",
                },
            ];
        },
    },

    planned_maintenance: {
        disabled: true,
        id: "planned_maintenance",
        title: "Planned maintenance",
        description:
            "This was the floor's worst-performing machine. A structured maintenance plan changed that — here's the before/after proof.",
        image: "/scenarios/scenario_3.png",

        resolve(span, nodeGraph) {
            const now = Date.now() / 1000;

            const downtimeCountByCell = new Map<string, number>();
            for (const dt of span.downtimeEvents.values()) {
                if (dt.startedAt <= now) {
                    downtimeCountByCell.set(dt.workCenterId, (downtimeCountByCell.get(dt.workCenterId) ?? 0) + 1);
                }
            }

            const preventiveWos = [...span.eamWorkOrders.values()].filter((wo) => wo.workType === "predictive");

            let bestCell: CellNode | null = null;
            let bestWo = null;
            let bestCount = -1;

            for (const wo of preventiveWos) {
                const cell = cellByMachineHash(nodeGraph, wo.assetId);
                if (!cell) continue;
                const count = downtimeCountByCell.get(cell.hash) ?? 0;
                if (count > bestCount) {
                    bestCell = cell;
                    bestWo = wo;
                    bestCount = count;
                }
            }

            if (!bestCell || !bestWo) return null;

            return {
                kind: "planned",
                cellHash: bestCell.hash,
                cellName: bestCell.name,
                workOrderId: bestWo.id,
                workOrderNumber: bestWo.workOrderNumber,
                historicalDowntimeCount: bestCount,
            };
        },

        steps(focus) {
            const f = focus?.kind === "planned" ? focus : null;
            const cellRoute = f ? `/phone-factory/${f.cellHash}` : "/phone-factory";

            return [
                {
                    id: "step_1",
                    title: "The problem machine",
                    description: (
                        <p>
                            Meet the <strong>{f?.cellName ?? "target"} cell</strong> — the floor's highest-downtime
                            machine before a structured maintenance plan was put in place.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=planned-maintenance-step-1]",
                },
                {
                    id: "step_2",
                    title: "The before — downtime history",
                    description: (
                        <p>
                            The timeline zoomed out reveals the pattern:{" "}
                            {f ? (
                                <>
                                    <strong>{f.historicalDowntimeCount} unplanned stoppages</strong> recorded
                                </>
                            ) : (
                                "a dense cluster of unplanned stoppages"
                            )}{" "}
                            before the plan was implemented.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=planned-maintenance-step-2]",
                },
                {
                    id: "step_3",
                    title: "The inflection point",
                    description: (
                        <p>
                            A marker on the timeline shows when the maintenance plan was implemented. Everything left of
                            it: chaos. Everything right: stability.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=planned-maintenance-step-3]",
                },
                {
                    id: "step_4",
                    title: "OEE and MTBF recovery",
                    description: (
                        <p>
                            OEE gauge at a healthy level. The sparkline shows the recovery trend after the plan was
                            implemented. MTBF has significantly improved.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=planned-maintenance-step-4]",
                },
                {
                    id: "step_5",
                    title: "The maintenance plan",
                    skip: true,
                    description: (
                        <p>
                            Work order{" "}
                            {f?.workOrderNumber ? (
                                <>
                                    <strong>{f.workOrderNumber}</strong>{" "}
                                </>
                            ) : null}
                            is the recurring preventive plan that formalized the fix — recurrence schedule, assigned
                            technician, and step-by-step checklist.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=planned-maintenance-step-5]",
                },
                {
                    id: "step_6",
                    title: "Current timeline: clean",
                    description: (
                        <p>
                            Timeline at the present. No red bands. Only evenly-spaced amber preventive windows. The plan
                            is running.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=planned-maintenance-step-6]",
                },
                {
                    id: "step_7",
                    title: "Business impact",
                    description: (
                        <p>
                            {f ? (
                                <>
                                    <strong>{f.historicalDowntimeCount} unplanned stoppages</strong> in the historical
                                    window →{" "}
                                </>
                            ) : null}
                            <strong>0 this quarter</strong>. OEE recovered. All orders on time.
                        </p>
                    ),
                    route: cellRoute,
                    selector: "[data-scenario=planned-maintenance-step-7]",
                },
            ];
        },
    },
};

export const FIRST_SCENARIO_ID = Object.keys(SCENARIOS)[0];
