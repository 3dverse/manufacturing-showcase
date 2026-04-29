import type { ScenarioStep } from "../../content/type";
import { useTimelineStore } from "@/store/useTimelineStore";

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

export type ScenarioDefinition = {
    id: string;
    title: string;
    description: string;
    image?: string;
    steps: ScenarioStep[];
};

export const SCENARIOS: Record<string, ScenarioDefinition> = {
    maintenance_urgency: {
        id: "incidentScenario",
        title: "Incident",
        description:
            "An unplanned machine stop has halted drilling operations mid-run. Trace the impact from the factory floor to the customer delivery.",
        image: "/scenarios/scenario_1.png",

        steps: [
            {
                id: "step_1",
                title: "Production at a glance",
                circleSize: 500,
                offsetX: 50,
                offsetY: 100,
                description: (
                    <p>
                        The hypervisor shows all active manufacturing orders across the site. MO 000022 is currently
                        running on the Y Factory — on schedule and producing units. Everything looks nominal.
                    </p>
                ),
                route: "/",
                selector: "[data-scenario=incident-step-1]",
            },
            {
                id: "step_2",
                title: "Incident reported",
                circleSize: 340,
                offsetY: 50,
                incident: {
                    message: "Unplanned stop on CNC drilling machine.",
                    title: "CNC Drilling — Unplanned Stop",
                    warningMessage:
                        "Spindle overload detected on Yantra Design CNC Drilling. Machine halted at 09:14. Production order MO 000022 is now at risk.",
                    actions: [
                        {
                            label: "Stop machine",
                            disabled: false,
                            role: "stopMachine",
                        },
                        {
                            label: "Go to incident",
                            disabled: false,
                            role: "goToIncident",
                        },
                    ],
                },
                description: (
                    <p>
                        A critical alert has fired — the CNC drilling machine stopped unexpectedly. You can halt the
                        machine safely from here, or navigate directly to the incident location on the factory floor.
                    </p>
                ),
                route: "/",
                selector: "[data-scenario=incident-step-2]",
            },
            {
                id: "step_3",
                title: "Factory health",
                circleSize: 400,
                description: (
                    <p>
                        The KPI dashboard reflects the impact in real time. Efficiency and quality hold steady, but the{" "}
                        <strong>Maintenance</strong> indicator has turned red — the unplanned stop is now visible at
                        factory level.
                    </p>
                ),
                route: "/phone-factory",
                selector: "[data-scenario=incident-step-3]",
            },
            {
                id: "step_4",
                title: "Locate the incident",
                description: (
                    <p>
                        The digital twin navigates to the affected cell. The red marker on the floor pinpoints the exact
                        machine that stopped. The incident panel confirms the downtime window and reason:{" "}
                        <strong>spindle overload</strong>. Download the full incident report as a PDF.
                    </p>
                ),
                route: "/phone-factory/ec07e887",
                beforeStep: () => {
                    const { span, setAsOf } = useTimelineStore.getState();
                    const latest = span
                        ? [...span.downtimeEvents.values()].sort((a, b) => b.startedAt - a.startedAt)[0]
                        : undefined;
                    if (latest) {
                        setAsOf(latest.startedAt);
                        return `/phone-factory/ec07e887/${latest.id}`;
                    }
                },
                selector: "[data-scenario=incident-step-4]",
            },
            {
                id: "step_5",
                title: "Downtime on the timeline",
                description: (
                    <p>
                        The timeline reveals the full picture. The <strong>red band</strong> marks the exact window of
                        unplanned downtime. The manufacturing order bar running through it shows MO 000022 was
                        interrupted mid-run — planned units are now unaccounted for.
                    </p>
                ),
                route: "/phone-factory/ec07e887",
                selector: "[data-scenario=incident-step-5]",
            },
            {
                id: "step_6",
                title: "Trace the order impact",
                description: (
                    <p>
                        Click any bar on the timeline to open the correlation view. From this downtime event, trace back
                        through the production order and interrupted operation all the way to the sales order — and see
                        exactly which customer delivery is now at risk.
                    </p>
                ),
                route: "/phone-factory/ec07e887",
                selector: "[data-scenario=incident-step-5]",
            },
        ],
    },
    predicitve_maintenance: {
        id: "predicitve_maintenance",
        title: "Predictive maintenance",
        description: "Simulate a predictive maintenance on Product A drilling operations.",
        image: "/scenarios/scenario_2.png",
        steps: [
            {
                id: "step_1",
                title: "Predictive maintenance",
                description: <p>Predictive maintenance details...</p>,
                route: "/",
                selector: "[data-scenario=predictive-maintenance-step-1]",
            },
        ],
    },
    planned_maintenance: {
        id: "planned_maintenance",
        title: "Planned maintenance",
        description: "Simulate a planned maintenance on Product A drilling operations.",
        image: "/scenarios/scenario_3.png",
        steps: [
            {
                id: "step_1",
                title: "Planned maintenance",
                description: <p>Planned maintenance details...</p>,
                route: "/",
                selector: "[data-scenario=planned-maintenance-step-1]",
            },
        ],
    },
};

export const FIRST_SCENARIO_ID = Object.keys(SCENARIOS)[0];
