export type UseCaseCellMatcher = {
    lineNameIncludes?: string[];
    cellNameIncludes?: string[];
    machineNameIncludes?: string[];
};

export type UseCaseHomeStep = {
    title: string;
    description: string;
};

export type UseCaseIncidentAction = {
    label: string;
    disabled?: boolean;
    role: "stopMachine" | "goToIncident";
};

export type UseCaseSalesOrderIncident = {
    orderRef: string;
    startDateIso: string;
    title: string;
    warningMessage: string;
    actions: UseCaseIncidentAction[];
};

export type UseCaseDefinition = {
    id: string;
    label: string;
    description: string;
    image?: string;
    simulatedDowntimeCellMatchers?: UseCaseCellMatcher[];
    homeStep?: UseCaseHomeStep;
    salesOrderIncident?: UseCaseSalesOrderIncident;
};

// TODO: rename use cases to scenarios
export const USE_CASES: Record<string, UseCaseDefinition> = {
    maintenance_urgency: {
        id: "incidentScenario",
        label: "Incident",
        description: "Simulate an urgent maintenance incident on Product A drilling operations.",
        image: "/scenarios/scenario_1.png",
        homeStep: {
            title: "Maintenance incident",
            description: "Drill machine downtime detected on Product A. Open incident details to investigate.",
        },
        salesOrderIncident: {
            orderRef: "SO 000022",
            startDateIso: "2026-04-17T09:30:00",
            title: "Running maintenance incident",
            warningMessage: "Drill machine in Production Line: Drill bit becomes worn, causing imprecise holes.",
            actions: [
                { label: "Stop Drill Machine", role: "stopMachine", disabled: true },
                { label: "Go to the incident", role: "goToIncident" },
            ],
        },
        simulatedDowntimeCellMatchers: [
            {
                lineNameIncludes: ["product a", "product-a", "product_a", "producta"],
                cellNameIncludes: ["drilling"],
                machineNameIncludes: ["drilling"],
            },
        ],
    },
    predicitve_maintenance: {
        id: "predicitve_maintenance",
        label: "Predictive maintenance",
        description: "Simulate a predictive maintenance on Product A drilling operations.",
        image: "/scenarios/scenario_2.png",
        homeStep: {
            title: "Predictive maintenance",
            description: "Drill machine downtime detected on Product A. Open incident details to investigate.",
        },
    },
    planned_maintenance: {
        id: "planned_maintenance",
        label: "Planned maintenance",
        description: "Simulate a planned maintenance on Product A drilling operations.",
        image: "/scenarios/scenario_3.png",
        homeStep: {
            title: "Planned maintenance",
            description: "Drill machine downtime detected on Product A. Open incident details to investigate.",
        },
    },
};

export const FIRST_USE_CASE_ID = Object.keys(USE_CASES)[0];
