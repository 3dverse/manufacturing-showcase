import { useTimelineStore } from "@/store/useTimelineStore";
import { useFocusStore } from "@/store/useFocusStore";
import { timeAgo } from "@/utils/helpers-time";
import { allCells } from "../helpers";

//------------------------------------------------------------------------------
import type { CorrectiveSpanData, ScenarioDefinition, ScenarioGraphData } from "../types";

//------------------------------------------------------------------------------
const INCIDENT_CELL_HASH = "ec07e887";
const INCIDENT_REASON_CODE = "COOLANT_LEAK";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const correctiveMaintenance: ScenarioDefinition = {
    id: "corrective_maintenance",
    title: "Incident",
    description:
        "An unplanned machine stop has halted drilling operations mid-run. Identify the impact, trace it to the customer, and respond.",
    image: "/scenarios/scenario_1.png",

    //--------------------------------------------------------------------------
    resolveSpan(span) {
        const latest = [...span.downtimeEvents.values()]
            .filter((dt) => dt.reasonCode === INCIDENT_REASON_CODE && dt.workCenterId === INCIDENT_CELL_HASH)
            .sort((a, b) => b.startedAt - a.startedAt)[0];
        if (!latest) return null;
        const order = latest.productionOrderId ? span.productionOrders.get(latest.productionOrderId) : null;
        return { kind: "corrective", downtime: latest, orderNumber: order?.orderNumber ?? null };
    },

    //--------------------------------------------------------------------------
    resolveGraph(_spanData, nodeGraph) {
        const cell = allCells(nodeGraph).find((c) => c.hash === INCIDENT_CELL_HASH);
        if (!cell) return null;
        const machine = cell.machines[0];
        return { cellHash: cell.hash, cellName: cell.name, machineHash: machine?.hash, machineName: machine?.name };
    },

    //--------------------------------------------------------------------------
    onFocusResolved(spanData) {
        const f = spanData as CorrectiveSpanData;
        const tl = useTimelineStore.getState();
        tl.pause();
        tl.setCustomWindow(f.downtime.startedAt - 24 * 3600, f.downtime.startedAt + 24 * 3600);
    },

    //--------------------------------------------------------------------------
    steps(spanData, graphData) {
        const f = spanData?.kind === "corrective" ? spanData : null;

        const dashRoute = "/";
        const factoryRoute = "/tokyo-phone-factory";
        const cellRoute = `${factoryRoute}/${INCIDENT_CELL_HASH}`;
        const dtRoute = `${factoryRoute}/${(graphData as ScenarioGraphData | undefined)?.machineHash ?? INCIDENT_CELL_HASH}/${f?.downtime.id}`;

        const downtimeDuration = f ? (f.downtime.endedAt ?? f.downtime.startedAt + 2 * 3600) - f.downtime.startedAt : 0;
        const timeAtOneThird = f ? f.downtime.startedAt + Math.floor(downtimeDuration / 3) : 0;
        const timeAtTwoThirds = f ? f.downtime.startedAt + Math.floor((downtimeDuration * 2) / 3) : 0;

        return [
            {
                id: "step_1",
                route: dashRoute,
                afterRoute: () => {
                    if (!f) return;
                    const { pause, setPresent, setAsOf } = useTimelineStore.getState();
                    pause();
                    setPresent(f.downtime.startedAt - 1);
                    setAsOf(undefined);
                },
                shroud: {
                    selector: "[data-scenario~=corrective-maintenance-step-1]",
                    size: 300,
                },
                message: {
                    selector: "[data-scenario~=corrective-maintenance-step-1]",
                    title: "Production status",
                    description: (
                        <p>
                            Manufacturing orders are running as scheduled.
                            {f?.orderNumber && (
                                <>
                                    <br />
                                    <strong>{f.orderNumber}</strong> is in progress with no delays.
                                </>
                            )}
                        </p>
                    ),
                    offset: { x: 50, y: 100 },
                },
            },
            {
                id: "step_2",
                route: dashRoute,
                beforeRoute: f
                    ? () => {
                          const { setPresent, setAsOf } = useTimelineStore.getState();
                          setPresent(timeAtOneThird);
                          setAsOf(undefined);
                      }
                    : undefined,
                shroud: {
                    selector: "[data-scenario~=corrective-maintenance-step-2]",
                    size: 500,
                },
                message: {
                    selector: "[data-scenario~=corrective-maintenance-step-2]",
                    offset: { x: -100, y: 60 },
                    title: "Production Alert",
                    description: f?.orderNumber ? (
                        <p>
                            A coolant leak stopped the machine running during order <strong>{f.orderNumber}</strong>.
                            Production is interrupted and the order is at risk.
                        </p>
                    ) : (
                        <p>
                            An alert fired — the CNC drilling machine stopped unexpectedly. Navigate to the factory
                            floor to assess the impact.
                        </p>
                    ),
                    incident: {
                        message: "Downtime detected",
                        title: "Downtime detected",
                        warningMessage: f
                            ? `Machine XXXXX. ${f.downtime.reasonDescription} maintenance  ${timeAgo(new Date(f.downtime.startedAt * 1000))}.`
                            : undefined,
                        actions: [{ label: "Go to the incident", disabled: false, role: "goToIncident" }],
                    },
                },
            },
            {
                id: "step_3",
                route: cellRoute,
                afterRoute: () => {
                    const { setPresent } = useTimelineStore.getState();
                    setPresent(timeAtTwoThirds);
                },
                shroud: {
                    selector: "[data-scenario~=corrective-maintenance-step-5]",
                    waitForCamera: true,
                    size: 700,
                },
                message: {
                    selector: "[data-scenario~=corrective-maintenance-step-5]",
                    waitForCamera: true,
                    title: "Production interrupted",
                    description: (
                        <p>
                            {f?.orderNumber && (
                                <>
                                    <strong>{f.orderNumber}</strong> mid-operation
                                    <br />
                                </>
                            )}
                            The cell shows what was running at the moment of the stop with data pulled from SAP. Units
                            that were in-progress are now impacted.
                        </p>
                    ),
                },
            },
            {
                id: "step_4",
                route: dtRoute,
                beforeRoute: f
                    ? () => {
                          useFocusStore.getState().setSelected({ type: "downtime", id: f.downtime.id });
                          return `/tokyo-phone-factory/${(graphData as ScenarioGraphData | undefined)?.machineHash ?? INCIDENT_CELL_HASH}/${f.downtime.id}`;
                      }
                    : undefined,
                shroud: {
                    selector: "[data-scenario~=corrective-maintenance-step-4]",
                    waitForCamera: true,
                    size: 500,
                },
                message: {
                    selector: "[data-scenario~=corrective-maintenance-step-4]",
                    waitForCamera: true,
                    offset: { x: -350, y: 50 },
                    title: "Downtime Details",
                    description: (
                        <p>
                            The downtime record provides full context linked to
                            {/* {f?.downtime.reasonCode && (
                                <>
                                    {" — "}reason code <strong>{f.downtime.reasonCode}</strong>
                                </>
                            )} */}
                            {f?.orderNumber && <strong>{f.orderNumber}.</strong>}
                            Start time, duration, and work center are all captured.
                        </p>
                    ),
                },
            },
            {
                id: "step_5",
                route: factoryRoute,
                beforeRoute:
                    f && graphData
                        ? () => {
                              useFocusStore.getState().setSelected(null);
                              return undefined;
                          }
                        : undefined,
                message: {
                    offset: { x: -100, y: 50 },
                    title: "Assess impact and take action",
                    description: (
                        <p>
                            The twin connects the incident to the affected machine, order, and operations. This context
                            supports fast, informed decisions.
                        </p>
                    ),
                },
            },
        ];
    },
};
