import { cellByMachineHash } from "../helpers";
import type { CellNode } from "@/content/type";
import type { ScenarioDefinition } from "../types";

export const plannedMaintenance: ScenarioDefinition = {
    disabled: true,
    id: "planned_maintenance",
    title: "Planned maintenance",
    description:
        "This was the floor's worst-performing machine. A structured maintenance plan changed that — here's the before/after proof.",
    image: "/scenarios/scenario_3.png",

    resolveSpan(span) {
        const now = Date.now() / 1000;
        const downtimeCountByWorkCenter = new Map<string, number>();
        for (const dt of span.downtimeEvents.values()) {
            if (dt.startedAt <= now) {
                downtimeCountByWorkCenter.set(
                    dt.workCenterId,
                    (downtimeCountByWorkCenter.get(dt.workCenterId) ?? 0) + 1,
                );
            }
        }
        const preventiveWorkOrders = [...span.eamWorkOrders.values()]
            .filter((wo) => wo.workType === "predictive")
            .map((wo) => ({ id: wo.id, workOrderNumber: wo.workOrderNumber, assetId: wo.assetId }));
        if (preventiveWorkOrders.length === 0) return null;
        return { kind: "planned", downtimeCountByWorkCenter, preventiveWorkOrders };
    },

    resolveGraph(spanData, nodeGraph) {
        if (spanData.kind !== "planned") return null;
        let bestCell: CellNode | null = null;
        let bestWo: { id: string; workOrderNumber: string; assetId: string } | null = null;
        let bestCount = -1;
        for (const wo of spanData.preventiveWorkOrders) {
            const cell = cellByMachineHash(nodeGraph, wo.assetId);
            if (!cell) continue;
            const count = spanData.downtimeCountByWorkCenter.get(cell.hash) ?? 0;
            if (count > bestCount) {
                bestCell = cell;
                bestWo = wo;
                bestCount = count;
            }
        }
        if (!bestCell || !bestWo) return null;
        return {
            cellHash: bestCell.hash,
            cellName: bestCell.name,
            workOrderId: bestWo.id,
            workOrderNumber: bestWo.workOrderNumber,
            historicalDowntimeCount: bestCount,
        };
    },

    steps(_spanData, graphData) {
        const cellRoute = graphData ? `/phone-factory/${graphData.cellHash}` : "/phone-factory";

        return [
            {
                id: "step_1",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=planned-maintenance-step-1]" },
                message: {
                    title: "The problem machine",
                    description: (
                        <p>
                            Meet the <strong>{graphData?.cellName ?? "target"} cell</strong> — the floor's
                            highest-downtime machine before a structured maintenance plan was put in place.
                        </p>
                    ),
                },
            },
            {
                id: "step_2",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=planned-maintenance-step-2]" },
                message: {
                    title: "The before — downtime history",
                    description: (
                        <p>
                            The timeline zoomed out reveals the pattern:{" "}
                            {graphData ? (
                                <>
                                    <strong>{graphData.historicalDowntimeCount} unplanned stoppages</strong> recorded
                                </>
                            ) : (
                                "a dense cluster of unplanned stoppages"
                            )}{" "}
                            before the plan was implemented.
                        </p>
                    ),
                },
            },
            {
                id: "step_3",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=planned-maintenance-step-3]" },
                message: {
                    title: "The inflection point",
                    description: (
                        <p>
                            A marker on the timeline shows when the maintenance plan was implemented. Everything left of
                            it: chaos. Everything right: stability.
                        </p>
                    ),
                },
            },
            {
                id: "step_4",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=planned-maintenance-step-4]" },
                message: {
                    title: "OEE and MTBF recovery",
                    description: (
                        <p>
                            OEE gauge at a healthy level. The sparkline shows the recovery trend after the plan was
                            implemented. MTBF has significantly improved.
                        </p>
                    ),
                },
            },
            {
                id: "step_5",
                skip: true,
                route: cellRoute,
                shroud: { selector: "[data-scenario~=planned-maintenance-step-5]" },
                message: {
                    title: "The maintenance plan",
                    description: (
                        <p>
                            Work order{" "}
                            {graphData?.workOrderNumber ? (
                                <>
                                    <strong>{graphData.workOrderNumber}</strong>{" "}
                                </>
                            ) : null}
                            is the recurring preventive plan that formalized the fix — recurrence schedule, assigned
                            technician, and step-by-step checklist.
                        </p>
                    ),
                },
            },
            {
                id: "step_6",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=planned-maintenance-step-6]" },
                message: {
                    title: "Current timeline: clean",
                    description: (
                        <p>
                            Timeline at the present. No red bands. Only evenly-spaced amber preventive windows. The plan
                            is running.
                        </p>
                    ),
                },
            },
            {
                id: "step_7",
                route: cellRoute,
                shroud: { selector: "[data-scenario~=planned-maintenance-step-7]" },
                message: {
                    title: "Business impact",
                    description: (
                        <p>
                            {graphData ? (
                                <>
                                    <strong>{graphData.historicalDowntimeCount} unplanned stoppages</strong> in the
                                    historical window →{" "}
                                </>
                            ) : null}
                            <strong>0 this quarter</strong>. OEE recovered. All orders on time.
                        </p>
                    ),
                },
            },
        ];
    },
};
