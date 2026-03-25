import type { SiteNode } from "../operations/dataset/generateDataset";

export type ShiftDefinition = {
    name:  string;
    start: string; // "HH:MM" 24-hour
    end:   string; // "HH:MM" 24-hour
};

export type GeneratorConfig = {
    seed:                     number;
    siteId:                   string;
    now:                      Date;
    monthsBack:               number;
    monthsForward:            number;
    site:                     SiteNode;
    // Shifts
    shifts:                   ShiftDefinition[];
    workDays:                 number[];   // 0 = Sun … 6 = Sat
    // MES
    productionOrderCount:     number;
    unitsPerHour:             number;
    operationDurationMinutes: number;
    yieldRate:                number;    // 0–1, median yield across all operations
    // EAM
    pmFrequencyDays:          number;
    pmDurationHours:          number;
    // ERP
    customerCount:            number;
    supplierCount:            number;
};

export function buildConfig(
    partial: Partial<GeneratorConfig> & { site: SiteNode; siteId: string },
): GeneratorConfig {
    return {
        seed:                     42,
        now:                      new Date(),
        monthsBack:               3,
        monthsForward:            2,
        shifts: [
            { name: "First",  start: "06:00", end: "14:00" },
            { name: "Second", start: "14:00", end: "22:00" },
        ],
        workDays:                 [1, 2, 3, 4, 5],
        productionOrderCount:     2000,
        unitsPerHour:             30,
        operationDurationMinutes: 240,
        yieldRate:                0.95,
        pmFrequencyDays:          14,
        pmDurationHours:          4,
        customerCount:            6,
        supplierCount:            4,
        ...partial,
    };
}
