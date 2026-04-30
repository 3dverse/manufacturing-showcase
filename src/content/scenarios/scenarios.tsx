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
                        Follow all manufacturing orders across the site and check their status.
                        Connect to your own externals sytems and enrich the data.
                    </p>
                ),
                route: "/",
                selector: "[data-scenario=incident-step-1]",
            },
            {
                id: "step_2",
                title: "Incident reported",
                circleSize: 500,
                offsetY: 60,
                offsetX: -100,
                // TODO: replace incident by beforeStep: clearIncident() && createIncident({ message, title, warningMessage })
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
                        A critical alert has fired — the CNC drilling machine stopped unexpectedly.
                    </p>
                ),
                route: "/",
                selector: "[data-scenario=incident-step-2]",
            },
            {
                id: "step_3",
                title: "Locate the incident",
                description: (
                    <p>
                        Navigates to the affected cell. The incident panel confirms the downtime window and reason.
                    </p>
                ),
                route: "/phone-factory/4441414f",
                beforeStep: () => {
                    const { span, setAsOf } = useTimelineStore.getState();
                    const latest = span
                        ? [...span.downtimeEvents.values()].sort((a, b) => b.startedAt - a.startedAt)[0]
                        : undefined;
                    if (latest) {
                        setAsOf(latest.startedAt);
                        return `/phone-factory/4441414f/${latest.id}`;
                    }
                },
                circleSize: 700,
                top: "40%",
                left: "70%",
                selector: "[data-scenario=incident-step-3]",
            },
            {
                id: "step_4",
                title: "Fix the machine",
                description: (
                    <p>
                        Learn how to fix the machine and return it to production.
                    </p>
                ),
                route: "/phone-factory/4441414f",
                circleSize: 700,
                top: "40%",
                left: "90%",
                selector: "[data-scenario=incident-step-4]",
            },
            {
                id: "step_5",
                title: "Factory health",
                circleSize: 500,
                offsetX: -100,
                offsetY: 50,
                description: (
                    <p>
                        The machine is now fixed and returned to production!

                        Before continuing, check the KPI dashboard to see the impact in real time. Efficiency and quality hold steady.
                    </p>
                ),
                route: "/phone-factory",
                selector: "[data-scenario=incident-step-5]",
            },
            {
                id: "step_5",
                title: "Downtime on the timeline",
                circleSize: 250,
                offsetX: 50,
                offsetY: -300,
                description: (
                    <p>
                        The timeline reveals the full picture. The <strong>red band</strong> marks the exact window of
                        unplanned downtime. The manufacturing order bar running through it shows MO 000022 was
                        interrupted mid-run — planned units are now unaccounted for.
                    </p>
                ),
                route: "/phone-factory/4441414f",
                selector: "[data-scenario=incident-step-6]",
            },
            {
                id: "step_6",
                title: "Trace the order impact",
                circleSize: 200,
                offsetX: 30,
                offsetY: -250,
                description: (
                    <p>
                        Click any bar on the timeline to open the correlation view. From this downtime event, trace back
                        through the production order and interrupted operation all the way to the sales order — and see
                        exactly which customer delivery is now at risk.
                    </p>
                ),
                route: "/phone-factory/4441414f",
                selector: "[data-scenario=incident-step-7]",
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
                route: "/phone-factory",
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
                route: "/phone-factory",
                selector: "[data-scenario=planned-maintenance-step-1]",
            },
        ],
    },
};

export const FIRST_SCENARIO_ID = Object.keys(SCENARIOS)[0];
