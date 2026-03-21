// All generator input and internal types

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
    cellOperationType: string; // matches cell tag: operationType
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
    itemType: "finished_good" | "raw_material";
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
    now: Date;
    monthsBack: number;
    monthsForward: number;
    factory: import("../operations/dataset/generateDataset").FactoryNode;
    items: ItemDefinition[];
    shifts: ShiftConfig;
    scenarios: ScenarioOverlay[];
};

// Internal timeline types
export type ShiftSlot = {
    shiftStart: Date;
    shiftEnd: Date;
    shiftName: string;
    cellId: string;
};

export type CellTimelineEntry = {
    type: "operation" | "downtime" | "idle";
    start: Date;
    end: Date;
    entityId: string; // operationId or downtimeId
};

export type CellTimeline = {
    cellId: string;
    entries: CellTimelineEntry[]; // sorted by start
};

export type OEEBucket = {
    workCenterId: string;
    shiftStart: Date;
    shiftEnd: Date;
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
        productionOrdersByWorkCenter: Map<string, string[]>;
        productionEventsByOperation: Map<string, any[]>;
        productionEventsByProductionOrder: Map<string, any[]>;
        productionEventsByWorkCenter: Map<string, any[]>;
        downtimeByWorkCenter: Map<string, any[]>;
        oeeByWorkCenter: Map<string, OEEBucket[]>;
        cellTimelines: Map<string, CellTimeline>;
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
    };
};
