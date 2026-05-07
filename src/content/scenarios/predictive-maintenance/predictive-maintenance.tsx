import { cellByMachineHash } from "../helpers";
import type { ScenarioDefinition } from "../types";

export const predictiveMaintenance: ScenarioDefinition = {
    disabled: true,
    id: "predictive_maintenance",
    title: "Predictive maintenance",
    description:
        "A degrading OEE trend has been detected before any failure occurs. Act on the signal, schedule a work order, and confirm production continuity.",
    image: "/scenarios/scenario_2.png",

    resolveSpan(span) {
        const now = Date.now() / 1000;
        const futurePreventive = [...span.eamWorkOrders.values()]
            .filter((wo) => wo.workType === "predictive" && wo.scheduledStart > now)
            .sort((a, b) => a.scheduledStart - b.scheduledStart)[0];
        if (!futurePreventive) return null;
        return {
            kind: "predictive",
            workOrderId: futurePreventive.id,
            workOrderNumber: futurePreventive.workOrderNumber,
            scheduledStart: futurePreventive.scheduledStart,
            scheduledEnd: futurePreventive.scheduledEnd,
            assetId: futurePreventive.assetId,
        };
    },

    resolveGraph(spanData, nodeGraph) {
        if (spanData.kind !== "predictive") return null;
        const cell = cellByMachineHash(nodeGraph, spanData.assetId);
        if (!cell) return null;
        return { cellHash: cell.hash, cellName: cell.name };
    },

    steps(_spanData, graphData) {
        const cellRoute = graphData ? `/tokyo-phone-factory/${graphData.cellHash}` : "/tokyo-phone-factory";

        return [
            {
                id: "step_1",
                route: "/tokyo-phone-factory",
                shroud: { selector: "[data-scenario~=predictive-maintenance-step-1]" },
                message: {
                    title: "Factory health — amber signal",
                    description: (
                        <p>
                            Most KPI badges look healthy — but <strong>Efficiency</strong> is showing a warning. OEE has
                            been quietly declining. Something needs attention before it becomes a failure.
                        </p>
                    ),
                },
            },
            {
                id: "step_2",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=predictive-maintenance-step-2]" },
                message: {
                    title: "Navigate to the at-risk cell",
                    description: (
                        <p>
                            A warning badge on the <strong>{graphData?.cellName ?? "affected"} cell</strong> in the
                            navigation bar flags the degrading machine before any failure occurs.
                        </p>
                    ),
                },
            },
            {
                id: "step_3",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=predictive-maintenance-step-3]" },
                message: {
                    title: "OEE degradation trend",
                    description: (
                        <p>
                            The OEE gauge and sparkline show a declining trend over the past week. MTBF is shrinking.
                            The pattern is clear even though no outright failure has occurred yet.
                        </p>
                    ),
                },
            },
            {
                id: "step_5",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=predictive-maintenance-step-5]" },
                message: {
                    title: "Scheduled on the timeline",
                    description: (
                        <p>
                            The timeline shows the <strong>amber band</strong> for the scheduled maintenance window. The
                            intervention is planned and visible.
                        </p>
                    ),
                },
            },
            {
                id: "step_6",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=predictive-maintenance-step-6]" },
                message: {
                    title: "Production continuity confirmed",
                    description: (
                        <p>
                            Manufacturing orders are arranged cleanly around the maintenance window — the last order
                            completes before, the next starts after. No customer delivery is affected. Failure
                            prevented.
                        </p>
                    ),
                },
            },
        ];
    },
};
