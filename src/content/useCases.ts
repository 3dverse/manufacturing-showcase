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
    simulatedDowntimeCellMatchers: UseCaseCellMatcher[];
    homeStep?: UseCaseHomeStep;
    salesOrderIncident?: UseCaseSalesOrderIncident;
};

export const USE_CASES: Record<string, UseCaseDefinition> = {
    // TODO: rename to "incidentScenario",
    maintenanceUrgency: {
        id: "incidentScenario",
        label: "Incident",
        description: "Simulate an urgent maintenance incident on Product A drilling operations.",
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
};

export const FIRST_USE_CASE_ID = Object.keys(USE_CASES)[0];
