import type { GeneratorConfig, ItemDefinition } from "../types";
import type { RNG } from "../rng";
import { getCellsByOperationType } from "../graph";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

export function generateAPS(
    config: GeneratorConfig,
    structural: { apsResources: Map<string, any>; apsResourceList: string[] },
    erp: any,
    rng: RNG,
): any {
    const { now, monthsBack, monthsForward, items, factory } = config;
    const windowStart = addDays(now, -monthsBack * 30);
    const windowEnd = addDays(now, monthsForward * 30);

    const itemMap = new Map<string, ItemDefinition>(items.map((i) => [i.id, i]));

    // --- Scenarios ---
    const scenarios = new Map<string, any>();
    const scenarioList: any[] = [];

    const baselineScenario = {
        id: "SCN-BASELINE",
        name: "Baseline Plan",
        type: "baseline",
        status: "active",
        description: "Standard production baseline scenario",
        assumptions: ["Finite capacity enforced", "3-shift schedule Mon-Fri", "Standard lead times"],
        objective: "minimize_lateness",
        createdAt: toUnix(addDays(now, -30)),
    };
    const whatIfScenario = {
        id: "SCN-WHATIF-01",
        name: "Overtime Scenario",
        type: "what_if",
        status: "active",
        description: "What-if scenario with Saturday overtime",
        assumptions: ["Finite capacity enforced", "Saturday half-day included", "10% capacity uplift"],
        objective: "maximize_throughput",
        createdAt: toUnix(addDays(now, -7)),
    };
    scenarios.set("SCN-BASELINE", baselineScenario);
    scenarios.set("SCN-WHATIF-01", whatIfScenario);
    scenarioList.push(baselineScenario, whatIfScenario);

    // --- Plans ---
    const plans = new Map<string, any>();
    const planList: any[] = [];

    const baselinePlan = {
        id: "PLN-BASELINE",
        name: "Baseline Production Plan",
        scenarioId: "SCN-BASELINE",
        status: "approved",
        planningStart: toUnix(windowStart),
        planningEnd: toUnix(windowEnd),
        generatedAt: toUnix(addDays(now, -1)),
        description: "Active production plan for current horizon",
        objective: "minimize_lateness",
        version: "v3.2",
        kpiSummary: { onTimeRate: 87.4, avgUtilization: 82.1, totalLateOrders: 3 },
    };
    const whatIfPlan = {
        id: "PLN-WHATIF-01",
        name: "Overtime What-If Plan",
        scenarioId: "SCN-WHATIF-01",
        status: "generated",
        planningStart: toUnix(windowStart),
        planningEnd: toUnix(windowEnd),
        generatedAt: toUnix(addDays(now, -1)),
        description: "What-if plan with Saturday overtime",
        objective: "maximize_throughput",
        version: "v1.0",
        kpiSummary: { onTimeRate: 93.2, avgUtilization: 88.5, totalLateOrders: 1 },
    };
    plans.set("PLN-BASELINE", baselinePlan);
    plans.set("PLN-WHATIF-01", whatIfPlan);
    planList.push(baselinePlan, whatIfPlan);

    // --- Resources (from structural) ---
    const resources = structural.apsResources;
    const resourceList = structural.apsResourceList.map((id) => resources.get(id)!);

    // --- Demands (from SO lines) ---
    const demands = new Map<string, any>();
    const demandList: any[] = [];
    let demNum = 1;

    for (const so of erp.salesOrderList) {
        for (const line of so.lines) {
            const demId = `DEM-${String(demNum).padStart(6, "0")}`;
            // requestedDate is now unix timestamp — convert back to Date then add 17h
            const requestedDate = new Date(so.requestedDeliveryDate * 1000);
            requestedDate.setUTCHours(17, 0, 0, 0);
            const dueDate = toUnix(requestedDate);
            const dem = {
                id: demId,
                itemId: line.itemId,
                siteId: config.factory.name,
                dueDate,
                quantity: line.orderedQuantity,
                priority: rng.nextInt(1, 5),
                demandType: "independent",
                fulfilledQuantity: so.status === "invoiced" || so.status === "fulfilled" ? line.orderedQuantity : so.status === "partially_fulfilled" ? Math.round(line.orderedQuantity * rng.nextFloat(0.3, 0.7)) : 0,
                unfulfilledQuantity: 0,
                fulfillmentStatus: "unfulfilled",
                planId: "PLN-BASELINE",
                _soId: so.id,
                _lineNum: line.lineNumber,
            };
            dem.unfulfilledQuantity = dem.quantity - dem.fulfilledQuantity;
            dem.fulfillmentStatus = dem.fulfilledQuantity >= dem.quantity ? "fulfilled" : dem.fulfilledQuantity > 0 ? "partially_fulfilled" : "unfulfilled";
            demands.set(demId, dem);
            demandList.push(dem);
            demNum++;
        }
    }

    // --- Supplies + Scheduled Operations ---
    const supplies = new Map<string, any>();
    const supplyList: any[] = [];
    const scheduledOperations = new Map<string, any>();
    const scheduledOperationsByPlan = new Map<string, any[]>([["PLN-BASELINE", []], ["PLN-WHATIF-01", []]]);
    const scheduledOperationsByResource = new Map<string, any[]>();
    const pegging: any[] = [];
    let supNum = 1;
    let scOpNum = 1;
    let pegNum = 1;

    // Track resource loading: resourceId -> sorted list of {start, end}
    const resourceSchedule = new Map<string, { start: Date; end: Date }[]>();
    for (const id of structural.apsResourceList) {
        resourceSchedule.set(id, []);
        scheduledOperationsByResource.set(id, []);
    }

    for (const dem of demandList) {
        const item = itemMap.get(dem.itemId);
        if (!item || item.routing.length === 0) continue;

        // backward schedule from dueDate (unix → Date)
        let endCursor = new Date(dem.dueDate * 1000);
        const routingOps = [...item.routing].reverse();

        const supplyId = `SUP-${String(supNum).padStart(6, "0")}`;
        supNum++;

        let supply: any = null;
        const opIds: string[] = [];

        for (let ri = 0; ri < routingOps.length; ri++) {
            const step = routingOps[ri];
            const cells = getCellsByOperationType(factory, step.cellOperationType);
            if (cells.length === 0) continue;

            const cell = rng.pick(cells);
            const resourceId = cell.name;

            const totalMins = step.setupTimeMinutes + step.runTimeMinutes;
            const plannedEnd = new Date(endCursor);
            const plannedStart = new Date(endCursor.getTime() - totalMins * 60 * 1000);

            const opId = `SCOP-${String(scOpNum).padStart(6, "0")}`;
            scOpNum++;

            const scOp = {
                id: opId,
                planId: "PLN-BASELINE",
                operationCode: step.operationCode,
                itemId: dem.itemId,
                resourceId,
                sequence: item.routing.length - ri,
                plannedStart: toUnix(plannedStart),
                plannedEnd: toUnix(plannedEnd),
                quantity: dem.quantity,
                status: "scheduled",
                demandId: dem.id,
                supplyId,
                mesProductionOrderId: null, // filled in by index.ts post-processing
            };

            scheduledOperations.set(opId, scOp);
            scheduledOperationsByPlan.get("PLN-BASELINE")!.push(scOp);
            if (!scheduledOperationsByResource.has(resourceId)) {
                scheduledOperationsByResource.set(resourceId, []);
            }
            scheduledOperationsByResource.get(resourceId)!.push(scOp);
            opIds.push(opId);

            endCursor = plannedStart;
        }

        // Supply (planned_order)
        supply = {
            id: supplyId,
            planId: "PLN-BASELINE",
            itemId: dem.itemId,
            siteId: config.factory.name,
            supplyType: "planned_order",
            quantity: dem.quantity,
            availableDate: dem.dueDate,
            status: endCursor < now ? "feasible" : "proposed",
            peggedQuantity: dem.quantity,
            remainingQuantity: 0,
            _opIds: opIds,
            _demandId: dem.id,
        };
        supplies.set(supplyId, supply);
        supplyList.push(supply);

        // Pegging
        const pegId = `PEG-${String(pegNum).padStart(6, "0")}`;
        pegNum++;
        pegging.push({
            id: pegId,
            demandId: dem.id,
            supplyId,
            peggedQuantity: dem.quantity,
            planId: "PLN-BASELINE",
        });
    }

    // --- Capacity Buckets ---
    const capacityBuckets: any[] = [];
    const capacityBucketsByPlan = new Map<string, any[]>([["PLN-BASELINE", []]]);

    let cursor = new Date(windowStart);
    while (cursor <= windowEnd) {
        for (const resourceId of structural.apsResourceList) {
            const dow = cursor.getDay();
            if (config.shifts.workDays.includes(dow)) {
                const bucketStart = new Date(cursor);
                bucketStart.setHours(6, 0, 0, 0);
                const bucketEnd = new Date(cursor);
                bucketEnd.setHours(22, 0, 0, 0);

                const availableCapacity = 8 * 3 * 60;

                const opsInBucket = (scheduledOperationsByResource.get(resourceId) ?? []).filter((op) => {
                    const start = new Date(op.plannedStart * 1000);
                    const end = new Date(op.plannedEnd * 1000);
                    return end > bucketStart && start < bucketEnd;
                });
                const plannedLoad = opsInBucket.reduce((sum, op) => {
                    const step = config.items.find((i) => i.id === op.itemId)?.routing.find((r) => r.operationCode === op.operationCode);
                    return sum + (step ? step.setupTimeMinutes + step.runTimeMinutes : 60);
                }, 0);

                const utilizationPercent = Math.min(100, Math.round((plannedLoad / availableCapacity) * 100 * 10) / 10);
                const overloaded = plannedLoad > availableCapacity;

                const bucket = {
                    planId: "PLN-BASELINE",
                    resourceId,
                    bucketStart: toUnix(bucketStart),
                    bucketEnd: toUnix(bucketEnd),
                    availableCapacity,
                    plannedLoad: Math.min(plannedLoad, availableCapacity * 1.2),
                    utilizationPercent,
                    overloaded,
                };
                capacityBuckets.push(bucket);
                capacityBucketsByPlan.get("PLN-BASELINE")!.push(bucket);
            }
        }
        cursor = addDays(cursor, 1);
    }

    // --- Material Availability ---
    const materialAvailability: any[] = [];
    const materialAvailabilityByPlan = new Map<string, any[]>([["PLN-BASELINE", []]]);

    for (const item of config.items.filter((i) => i.itemType === "raw_material")) {
        let maCursor = new Date(windowStart);
        let projected = rng.nextInt(500, 2000);
        while (maCursor <= windowEnd) {
            const bucketStart = new Date(maCursor);
            const bucketEnd = addDays(maCursor, 7);
            const required = rng.nextInt(100, 500);
            const receipt = maCursor < now && rng.bool(0.6) ? rng.nextInt(200, 800) : 0;
            projected = projected + receipt - required;
            const shortage = projected < 0 ? Math.abs(projected) : 0;
            if (shortage > 0) projected = 0;

            const ma = {
                planId: "PLN-BASELINE",
                itemId: item.id,
                siteId: config.factory.name,
                bucketStart: toUnix(bucketStart),
                bucketEnd: toUnix(bucketEnd),
                projectedAvailableQuantity: Math.max(0, projected),
                requiredQuantity: required,
                shortageQuantity: shortage,
            };
            materialAvailability.push(ma);
            materialAvailabilityByPlan.get("PLN-BASELINE")!.push(ma);
            maCursor = addDays(maCursor, 7);
        }
    }

    // --- Exceptions ---
    const exceptions = new Map<string, any[]>([["PLN-BASELINE", []]]);
    let excNum = 1;
    const overloadedBuckets = capacityBuckets.filter((b) => b.overloaded);
    for (const b of overloadedBuckets.slice(0, 5)) {
        const excId = `EXC-${String(excNum++).padStart(5, "0")}`;
        exceptions.get("PLN-BASELINE")!.push({
            id: excId,
            planId: "PLN-BASELINE",
            type: "overload",
            severity: "warning",
            message: `Resource ${b.resourceId} overloaded`,
            relatedEntityType: "resource",
            relatedEntityId: b.resourceId,
        });
    }

    const lateDemands = demandList.filter((d) => d.fulfillmentStatus !== "fulfilled" && new Date(d.dueDate * 1000) < now);
    for (const d of lateDemands.slice(0, 5)) {
        const excId = `EXC-${String(excNum++).padStart(5, "0")}`;
        exceptions.get("PLN-BASELINE")!.push({
            id: excId,
            planId: "PLN-BASELINE",
            type: "late_demand",
            severity: "warning",
            message: `Demand ${d.id} for item ${d.itemId} is past due`,
            relatedEntityType: "demand",
            relatedEntityId: d.id,
        });
    }

    // --- KPIs ---
    const kpis = new Map<string, any[]>([
        [
            "PLN-BASELINE",
            [
                { name: "on_time_rate", value: 87.4, unit: "%" },
                { name: "avg_utilization", value: 82.1, unit: "%" },
                { name: "total_demands", value: demandList.length, unit: "count" },
                { name: "total_late_orders", value: lateDemands.length, unit: "count" },
                { name: "total_supplies", value: supplyList.length, unit: "count" },
                { name: "planning_horizon_days", value: monthsBack * 30 + monthsForward * 30, unit: "days" },
            ],
        ],
        [
            "PLN-WHATIF-01",
            [
                { name: "on_time_rate", value: 93.2, unit: "%" },
                { name: "avg_utilization", value: 88.5, unit: "%" },
                { name: "total_demands", value: demandList.length, unit: "count" },
                { name: "total_late_orders", value: Math.max(0, lateDemands.length - 2), unit: "count" },
                { name: "capacity_increase", value: 10, unit: "%" },
            ],
        ],
    ]);

    // --- Constraints ---
    const constraints = [
        { id: "CON-001", name: "Finite Capacity", type: "capacity", scope: "global", active: true, description: "All work centers have finite capacity enforced" },
        { id: "CON-002", name: "Material Availability", type: "material", scope: "global", active: true, description: "Production cannot start without required raw materials" },
        { id: "CON-003", name: "Working Calendar", type: "calendar", scope: "global", active: true, description: "Production limited to Mon-Fri 3-shift schedule" },
        { id: "CON-004", name: "Routing Sequence", type: "sequencing", scope: "global", active: true, description: "Operations must follow defined routing sequence" },
    ];

    // --- Resource Load ---
    const resourceLoad = new Map<string, any[]>();
    for (const resourceId of structural.apsResourceList) {
        const buckets = (scheduledOperationsByResource.get(resourceId) ?? []).reduce((acc: Record<string, any>, op) => {
            const day = new Date(op.plannedStart * 1000).toISOString().split("T")[0];
            if (!acc[day]) {
                const bs = new Date(`${day}T06:00:00Z`);
                const be = new Date(`${day}T22:00:00Z`);
                acc[day] = { resourceId, bucketStart: toUnix(bs), bucketEnd: toUnix(be), plannedLoad: 0, availableCapacity: 960 };
            }
            const step = config.items.find((i) => i.id === op.itemId)?.routing.find((r) => r.operationCode === op.operationCode);
            acc[day].plannedLoad += step ? step.setupTimeMinutes + step.runTimeMinutes : 60;
            return acc;
        }, {});

        const bucketList = Object.values(buckets).map((b: any) => ({
            ...b,
            plannedLoad: Math.min(b.plannedLoad, b.availableCapacity * 1.2),
            utilizationPercent: Math.min(120, Math.round((b.plannedLoad / b.availableCapacity) * 100 * 10) / 10),
        }));
        resourceLoad.set(resourceId, bucketList.sort((a, b) => a.bucketStart - b.bucketStart));
    }

    return {
        plans,
        planList,
        scenarios,
        scenarioList,
        resources,
        resourceList,
        scheduledOperations,
        scheduledOperationsByPlan,
        scheduledOperationsByResource,
        capacityBuckets,
        capacityBucketsByPlan,
        materialAvailability,
        materialAvailabilityByPlan,
        exceptions,
        kpis,
        demands,
        demandList,
        supplies,
        supplyList,
        pegging,
        constraints,
        resourceLoad,
    };
}
