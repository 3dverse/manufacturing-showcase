import type { ScenarioStep } from "../../content/type";

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
        description: "Simulate an urgent maintenance incident on Product A drilling operations.",
        image: "/scenarios/scenario_1.png",

        steps: [
            {
                id: "step_1",
                title: "Hypervison",
                circleSize: 500,
                description: <p>Follow in real time your order planning...</p>,
                route: "/",
                selector: "[data-scenario=maintenance-step-1]",
            },
            {
                id: "step_2",
                title: "Incident reported",
                circleSize: 300,
                incident: {
                    message: "Incident lorem ipsum dolor sit amet...",
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
                description: <p>Incident details...</p>,
                route: "/",
                // beforeStep: showIncident({ id: "incident_1", orderRef: "SO 000022", startDateIso: "2026-04-17T09:30:00" }),
                selector: "[data-scenario=maintenance-step-2]",
            },
            {
                id: "step_3",
                title: "Incident machine",
                description: <p>Machine details...</p>,
                route: "/phone-factory/ec07e887",
                selector: "[data-scenario=maintenance-step-3]",
            },
        ],
    },
    predicitve_maintenance: {
        id: "predicitve_maintenance",
        title: "Predictive maintenance",
        description: "Simulate a predictive maintenance on Product A drilling operations.",
        image: "/scenarios/scenario_2.png",
        steps: [],
    },
    planned_maintenance: {
        id: "planned_maintenance",
        title: "Planned maintenance",
        description: "Simulate a planned maintenance on Product A drilling operations.",
        image: "/scenarios/scenario_3.png",
        steps: [],
    },
};

export const FIRST_SCENARIO_ID = Object.keys(SCENARIOS)[0];
