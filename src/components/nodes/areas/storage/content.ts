//------------------------------------------------------------------------------
import type { AreaStorageKpiData } from "@/components/nodes/areas/storage/AreaStorageKpiCharts";

//------------------------------------------------------------------------------
const daysAgo = (offset: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    return d;
};

//------------------------------------------------------------------------------
export const MOCK_STORAGE_DATA = [
    {
        name: "Screen",
        id: "screen",
        quantity: 84,
        maxQuantity: 300,
    },
    {
        name: "Case",
        id: "case",
        quantity: 256,
        maxQuantity: 350,
    },
    {
        name: "Electronics",
        id: "electronics",
        quantity: 278,
        maxQuantity: 320,
    },
];

//------------------------------------------------------------------------------
export const MOCK_KPI_DATA: AreaStorageKpiData = {
    occupancyRateByTime: [
        { date: daysAgo(5), value: 62 },
        { date: daysAgo(4), value: 68 },
        { date: daysAgo(3), value: 71 },
        { date: daysAgo(2), value: 76 },
        { date: daysAgo(1), value: 80 },
        { date: daysAgo(0), value: 78 }, // today
    ],
    storageDensityByTime: [
        { date: daysAgo(5), value: 54 },
        { date: daysAgo(4), value: 57 },
        { date: daysAgo(3), value: 60 },
        { date: daysAgo(2), value: 63 },
        { date: daysAgo(1), value: 67 },
        { date: daysAgo(0), value: 70 }, // today
    ],
    inventoryTurnoverByTime: [
        { date: daysAgo(5), value: 1.1 },
        { date: daysAgo(4), value: 1.3 },
        { date: daysAgo(3), value: 1.4 },
        { date: daysAgo(2), value: 1.6 },
        { date: daysAgo(1), value: 1.7 },
        { date: daysAgo(0), value: 1.8 }, // today
    ],
};
