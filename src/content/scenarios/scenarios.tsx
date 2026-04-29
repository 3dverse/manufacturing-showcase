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
        description: "Simulate an urgent maintenance incident on Product A drilling operations.",
        image: "/scenarios/scenario_1.png",

        steps: [
            {
                id: "step_1",
                title: "Hypervison",
                circleSize: 500,
                offsetX: 50,
                offsetY: 100,
                description: <p>Follow in real time your order planning...</p>,
                route: "/",
                selector: "[data-scenario=incident-step-1]",
            },
            {
                id: "step_2",
                title: "Incident reported",
                circleSize: 340,
                offsetY: 50,
                incident: {
                    message: "The drilling machine is not working.",
                    title: "The drilling machine is not working.",
                    warningMessage: "Incident lorem ipsum dolor sit amet...",
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
                selector: "[data-scenario=incident-step-2]",
            },
            {
                id: "step_3",
                title: "Factory overview",
                circleSize: 400,
                description: <p>Factory overview details...</p>,
                route: "/phone-factory",
                selector: "[data-scenario=incident-step-3]",
            },
            {
                id: "step_4",
                title: "Incident machine",
                description: <p>Machine details...</p>,
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
