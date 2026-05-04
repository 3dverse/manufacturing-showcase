import type { ScenarioStep } from "@/content/type";
import type { FactoryNode } from "@/content/type";
import type { DowntimeEntry, TimelineSpan } from "@/core/Scope";

//------------------------------------------------------------------------------
// Existing action/incident types

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

//------------------------------------------------------------------------------
// Per-scenario span data — resolved from TimelineSpan alone

export type CorrectiveSpanData = {
    kind: "corrective";
    downtime: DowntimeEntry;
    orderNumber: string | null;
};

export type PredictiveSpanData = {
    kind: "predictive";
    workOrderId: string;
    workOrderNumber: string;
    scheduledStart: number;
    scheduledEnd: number;
    assetId: string;
};

export type PlannedSpanData = {
    kind: "planned";
    downtimeCountByWorkCenter: Map<string, number>;
    preventiveWorkOrders: Array<{ id: string; workOrderNumber: string; assetId: string }>;
};

export type ScenarioSpanData = CorrectiveSpanData | PredictiveSpanData | PlannedSpanData;

//------------------------------------------------------------------------------
// Graph data — resolved from FactoryNode, shared shape across all scenarios

export type ScenarioGraphData = {
    cellHash: string;
    cellName: string;
    machineHash?: string;
    machineName?: string;
    workOrderId?: string;
    workOrderNumber?: string;
    historicalDowntimeCount?: number;
};

//------------------------------------------------------------------------------
// ScenarioDefinition

export type ScenarioDefinition = {
    disabled?: boolean;
    id: string;
    title: string;
    description: string;
    image?: string;
    resolveSpan?: (span: TimelineSpan) => ScenarioSpanData | null;
    resolveGraph?: (spanData: ScenarioSpanData, nodeGraph: FactoryNode) => ScenarioGraphData | null;
    /** Called once when span data is first resolved; graphData is passed if already available. */
    onFocusResolved?: (spanData: ScenarioSpanData, graphData?: ScenarioGraphData) => void;
    steps: ScenarioStep[] | ((spanData: ScenarioSpanData | null, graphData?: ScenarioGraphData) => ScenarioStep[]);
};
