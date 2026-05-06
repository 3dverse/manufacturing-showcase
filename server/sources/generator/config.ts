import type { SiteNode } from "./site";

export type ShiftDefinition = {
    name: string;
    start: string; // "HH:MM" 24-hour
    end: string; // "HH:MM" 24-hour
};

export type GeneratorConfig = {
    seed: number;
    siteId: string;
    now: Date;
    monthsBack: number;
    monthsForward: number;
    site: SiteNode;
    // Shifts
    shifts: ShiftDefinition[];
    workDays: number[]; // 0 = Sun … 6 = Sat
    // MES
    maxProductionOrderCount: number;
    unitsPerHour: number;
    minOperationWorkingMinutes: number; // lower bound of per-PO working-time range
    maxOperationWorkingMinutes: number; // upper bound of per-PO working-time range
    yieldRate: number; // 0–1, median yield across all operations
    // EAM
    pmFrequencyDays: number;
    pmDurationHours: number;
    // ERP
    customerCount: number;
    supplierCount: number;
    minPurchaseOrderGroupSize: number; // min operations grouped into one purchase order
    maxPurchaseOrderGroupSize: number; // max operations grouped into one purchase order
    putawayTaskDurationMinutes: number; // fixed duration of each putaway task; receipt duration = nTasks × this
    putawayItemsPerTask: number; // max items per putaway task (bin capacity)
    pickTaskDurationMinutes: number; // fixed duration of each pick task; startedAt = pickedDate − this
    pickItemsPerTask: number; // max items per pick task (delivery bin capacity)
};

export function buildConfig(partial: Partial<GeneratorConfig> & { site: SiteNode; siteId: string }): GeneratorConfig {
    return {
        seed: 42,
        now: new Date(),
        monthsBack: 3,
        monthsForward: 2,
        shifts: [
            { name: "First", start: "06:00", end: "14:00" },
            { name: "Second", start: "14:00", end: "22:00" },
        ],
        workDays: [1, 2, 3, 4, 5],
        maxProductionOrderCount: 2000,
        unitsPerHour: 120,
        // One site working day = two 8h shifts → 960 min; keep POs slightly beyond that.
        minOperationWorkingMinutes: 280,
        maxOperationWorkingMinutes: 3200,
        yieldRate: 0.95,
        pmFrequencyDays: 14,
        pmDurationHours: 4,
        customerCount: 3,
        supplierCount: 4,
        minPurchaseOrderGroupSize: 3,
        maxPurchaseOrderGroupSize: 6,
        putawayTaskDurationMinutes: 80,
        putawayItemsPerTask: 500,
        pickTaskDurationMinutes: 15,
        pickItemsPerTask: 200,
        ...partial,
    };
}
