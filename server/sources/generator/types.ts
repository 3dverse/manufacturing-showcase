// All generator input and internal types
import type { FGRoutingTemplate } from "./steps/phase1";

export type ShiftDefinition = {
    name: string;
    startHour: number;
    durationHours: number;
};

export type ShiftConfig = {
    shifts: ShiftDefinition[];
    workDays: number[]; // 0=Sunday, 1=Monday … 6=Saturday
    timezone: string;
};

export type RoutingStep = {
    operationCode: string;
    operationDescription: string;
    workCenterOperationType: string; // matches workCenter tag: operationType
    setupTimeMinutes: number;
    runTimeMinutes: number; // per batch
    defects: string[]; // defect codes that can occur at this step
};

export type BOMComponent = {
    itemId: string;
    quantity: number;
    uom: string;
};

export type ItemDefinition = {
    id: string;
    itemNumber: string;
    name: string;
    description: string;
    itemType: "finished_good" | "raw_material" | "wip";
    uom: string;
    standardCost: number;
    currency: string;
    routing: RoutingStep[];
    components: BOMComponent[];
};

export type ScenarioOverlay = {
    type: "machine_breakdown" | "material_shortage" | "quality_spike";
    targetId: string;
    deltaMinutesFromNow: number;
    durationMinutes: number;
    params?: Record<string, unknown>;
};

export type GeneratorConfig = {
    seed: number;
    siteId?: string;
    now: Date;
    monthsBack: number;
    monthsForward: number;
    site: import("../operations/dataset/generateDataset").SiteNode;
    items: ItemDefinition[];
    shifts: ShiftConfig;
    scenarios: ScenarioOverlay[];
};

// Internal timeline types
export type ShiftSlot = {
    shiftStart: Date;
    shiftEnd: Date;
    shiftName: string;
    workCenterId: string;
};

export type WorkCenterTimelineEntry = {
    type: "operation" | "downtime" | "idle";
    start: Date;
    end: Date;
    entityId: string; // operationId or downtimeId
};

export type WorkCenterTimeline = {
    workCenterId: string;
    entries: WorkCenterTimelineEntry[]; // sorted by start
};

export type OEEBucket = {
    workCenterId: string;
    shiftStart: number;
    shiftEnd: number;
    shiftName: string;
    plannedMinutes: number;
    runtimeMinutes: number;
    downtimeMinutes: number;
    producedQuantity: number;
    goodQuantity: number;
    scrapQuantity: number;
    uom: string;
    availabilityPercent: number;
    performancePercent: number;
    qualityPercent: number;
    oeePercent: number;
};

export type Dataset = {
    siteId: string;
    now: Date;
    routingTemplates: Map<string, FGRoutingTemplate>;

    erp: {
        companies: Map<string, any>;
        currencies: any[];
        fiscalPeriods: any[];
        glAccounts: Map<string, any>;
        costCenters: Map<string, any>;
        customers: Map<string, any>;
        suppliers: Map<string, any>;
        items: Map<string, any>;
        salesOrders: Map<string, any>;
        purchaseOrders: Map<string, any>;
        invoices: Map<string, any>;
        payments: Map<string, any>;
        journalEntries: Map<string, any>;
        salesOrderList: any[];
        purchaseOrderList: any[];
        invoiceList: any[];
        paymentList: any[];
        journalEntryList: any[];
        glAccountList: any[];
        costCenterList: any[];
        customerList: any[];
        supplierList: any[];
        itemList: any[];
    };

    aps: {
        plans: Map<string, any>;
        planList: any[];
        scenarios: Map<string, any>;
        scenarioList: any[];
        resources: Map<string, any>;
        resourceList: any[];
        scheduledOperations: Map<string, any>;
        scheduledOperationsByPlan: Map<string, any[]>;
        scheduledOperationsByResource: Map<string, any[]>;
        capacityBuckets: any[];
        capacityBucketsByPlan: Map<string, any[]>;
        materialAvailability: any[];
        materialAvailabilityByPlan: Map<string, any[]>;
        exceptions: Map<string, any[]>;
        kpis: Map<string, any[]>;
        demands: Map<string, any>;
        demandList: any[];
        supplies: Map<string, any>;
        supplyList: any[];
        pegging: any[];
        constraints: any[];
        resourceLoad: Map<string, any[]>;
    };

    mes: {
        workCenters: Map<string, any>;
        workCenterList: string[];
        productionOrders: Map<string, any>;
        productionOrderList: string[];
        operations: Map<string, any>;
        operationList: string[];
        dispatchItems: any[];
        productionEvents: any[];
        downtimeEvents: any[];
        oeeTimeseries: OEEBucket[];
        operationsByProductionOrder: Map<string, string[]>;
        operationsByWorkCenter: Map<string, string[]>;
        productionOrdersByLocation: Map<string, string[]>;
        productionEventsByOperation: Map<string, any[]>;
        productionEventsByProductionOrder: Map<string, any[]>;
        productionEventsByWorkCenter: Map<string, any[]>;
        downtimeByWorkCenter: Map<string, any[]>;
        oeeByWorkCenter: Map<string, OEEBucket[]>;
        workCenterTimelines: Map<string, WorkCenterTimeline>;
        routings: Map<string, any>;
        routingList: string[];
    };

    eam: {
        assets: Map<string, any>;
        assetList: string[];
        locations: Map<string, any>;
        locationList: string[];
        workOrders: Map<string, any>;
        workOrderList: string[];
        workOrderOperations: Map<string, any[]>;
        maintenancePlans: Map<string, any>;
        maintenancePlanList: string[];
        maintenanceSchedules: Map<string, any[]>;
        serviceRequests: Map<string, any>;
        serviceRequestList: string[];
        inspections: Map<string, any>;
        inspectionList: string[];
        assetHistory: Map<string, any[]>;
        workOrdersByAsset: Map<string, string[]>;
        workOrdersByLocation: Map<string, string[]>;
        assetsByLocation: Map<string, string[]>;
        maintenancePlansByAsset: Map<string, string[]>;
        inspectionsByAsset: Map<string, string[]>;
        serviceRequestsByAsset: Map<string, string[]>;
    };

    qms: {
        nonconformances: Map<string, any>;
        nonconformanceList: string[];
        capas: Map<string, any>;
        capaList: string[];
        deviations: Map<string, any>;
        deviationList: string[];
        audits: Map<string, any>;
        auditList: string[];
        complaints: Map<string, any>;
        complaintList: string[];
        documents: Map<string, any>;
        documentList: string[];
    };

    wms: {
        warehouses: Map<string, any>;
        locations: Map<string, any>;
        locationList: string[];
        locationsByWarehouse: Map<string, string[]>;
        inventoryPositions: any[];
        inventoryByItem: Map<string, any[]>;
        inventorySummary: any[];
        handlingUnits: any[];
        lotStock: any[];
        serialStock: any[];
        receipts: any[];
        putawayTasks: any[];
        pickTasks: any[];
        shipments: any[];
        cycleCounts: any[];
        inventoryMovements: any[];
        stockAllocations: any[];
    };
};
