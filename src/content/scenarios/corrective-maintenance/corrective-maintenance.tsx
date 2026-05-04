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
        const factoryRoute = "/phone-factory";
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
                    title: "Production at a glance",
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
                    title: "Incident alert",
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
                    incident: {
                        message: "Downtime detected",
                        title: "Downtime detected",
                        warningMessage: f
                            ? `${f.downtime.reasonDescription} maintenance  ${timeAgo(new Date(f.downtime.startedAt * 1000))}.`
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
                },
            },
            {
                id: "step_4",
                route: dtRoute,
                beforeRoute: f
                    ? () => {
                          useFocusStore.getState().setSelected({ type: "downtime", id: f.downtime.id });
                          return `/phone-factory/${(graphData as ScenarioGraphData | undefined)?.machineHash ?? INCIDENT_CELL_HASH}/${f.downtime.id}`;
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
                    title: "Inspect the downtime",
                    description: (
                        <p>
                            The downtime record shows the full picture
                            {f?.downtime.reasonCode ? (
                                <>
                                    {" — "}reason code <strong>{f.downtime.reasonCode}</strong>
                                </>
                            ) : null}
                            {f?.orderNumber ? (
                                <>
                                    {", tied to production order "}
                                    <strong>{f.orderNumber}</strong>
                                </>
                            ) : null}
                            . Start time, duration, and work center are all here. This is your evidence trail. Find
                            important documentation about the issue at hand.
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
                    title: "From alert to action",
                    description: (
                        <p>
                            From the moment the alert fired, the digital twin surfaced everything that mattered — the
                            machine, the order, the customer — without a single phone call or spreadsheet. That is the
                            difference a connected factory floor makes.
                        </p>
                    ),
                },
            },
        ];
    },
};
