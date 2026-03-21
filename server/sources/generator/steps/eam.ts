import type { GeneratorConfig } from "../types";
import type { RNG } from "../rng";
import { flattenCells, flattenMachines, getAreaForCell } from "../graph";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

const MANUFACTURERS = ["Mazak", "Fanuc", "ABB", "Siemens", "DMG Mori", "Mitsubishi", "Okuma", "Haas"];
const MACHINE_MODELS: Record<string, string[]> = {
    MACHINING: ["VC-500", "VARIAXIS-500", "INTEGREX-200", "QTN-200"],
    ASSEMBLY: ["AX-2000", "PowerFit-Pro", "SmartAssembly-300"],
    PAINTING: ["SprayMax-400", "AutoCoat-200"],
    QUALITY_CONTROL: ["CMM-700", "ScanMaster-500", "VisionSystem-300"],
    DEFAULT: ["Industrial-300", "AutoMatic-200"],
};
const INSPECTORS = ["J. Smith", "M. Johnson", "P. Williams", "K. Brown", "C. Davis"];

export function generateEAM(
    config: GeneratorConfig,
    structural: {
        eamLocations: Map<string, any>;
        eamLocationList: string[];
        assetsByCell: Map<string, string[]>;
    },
    rng: RNG,
): any {
    const { now, monthsBack, monthsForward, factory } = config;
    const windowStart = addDays(now, -monthsBack * 30);
    const windowEnd = addDays(now, monthsForward * 30);
    const siteId = factory.name;

    const assets = new Map<string, any>();
    const assetList: string[] = [];
    const maintenancePlans = new Map<string, any>();
    const maintenancePlanList: string[] = [];
    const maintenanceSchedules = new Map<string, any[]>();
    const workOrders = new Map<string, any>();
    const workOrderList: string[] = [];
    const workOrderOperations = new Map<string, any[]>();
    const serviceRequests = new Map<string, any>();
    const serviceRequestList: string[] = [];
    const inspections = new Map<string, any>();
    const inspectionList: string[] = [];
    const assetHistory = new Map<string, any[]>();

    const workOrdersByAsset = new Map<string, string[]>();
    const workOrdersByLocation = new Map<string, string[]>();
    const assetsByLocation = new Map<string, string[]>();
    const maintenancePlansByAsset = new Map<string, string[]>();
    const inspectionsByAsset = new Map<string, string[]>();
    const serviceRequestsByAsset = new Map<string, string[]>();

    let woNum = 1;
    let srNum = 1;
    let inspNum = 1;
    let planNum = 1;
    let schedNum = 1;

    const machines = flattenMachines(factory);
    const nowTs = toUnix(now);

    for (const machine of machines) {
        const area = getAreaForCell(factory, machine.lineage[machine.lineage.length - 1] ?? "");
        const opType = area ? (flattenCells(factory).find((c) => c.name === machine.lineage[machine.lineage.length - 1])?.tags["operationType"] ?? "DEFAULT") : "DEFAULT";

        const criticality = opType === "MACHINING" ? "high" : opType === "ASSEMBLY" ? "medium" : "low";
        const manufacturer = rng.pick(MANUFACTURERS);
        const models = MACHINE_MODELS[opType] ?? MACHINE_MODELS["DEFAULT"];
        const model = rng.pick(models);

        const yearsBack = rng.nextFloat(2, 8);
        const commissioningDate = addDays(now, -Math.round(yearsBack * 365));
        const hoursOperated = Math.round(yearsBack * 365 * 24 * 0.7);
        const locationId = machine.name;

        const asset: any = {
            id: machine.name,
            assetCode: machine.name,
            name: `${manufacturer} ${model} (${machine.name})`,
            description: `${opType} machine ${machine.name}`,
            assetType: opType.toLowerCase(),
            classCode: opType,
            status: "active",
            criticality,
            serialNumber: `SN-${rng.nextInt(100000, 999999)}`,
            manufacturer,
            model,
            commissioningDate: toUnix(commissioningDate),
            parentAssetId: null,
            locationId,
            siteCode: siteId,
            maintenanceStrategy: "time_based",
            meterReading: hoursOperated,
            meterUnit: "hours",
            createdAt: toUnix(commissioningDate),
            updatedAt: nowTs,
        };
        assets.set(machine.name, asset);
        assetList.push(machine.name);

        if (!assetsByLocation.has(locationId)) assetsByLocation.set(locationId, []);
        assetsByLocation.get(locationId)!.push(machine.name);

        workOrdersByAsset.set(machine.name, []);
        maintenancePlansByAsset.set(machine.name, []);
        inspectionsByAsset.set(machine.name, []);
        serviceRequestsByAsset.set(machine.name, []);
        assetHistory.set(machine.name, []);

        // --- Maintenance Plan ---
        const planId = `MP-${String(planNum).padStart(5, "0")}`;
        planNum++;
        const lastServiceDate = addDays(now, -rng.nextInt(0, 14));
        const nextDueDate = addDays(lastServiceDate, 14);

        const plan: any = {
            id: planId,
            planCode: planId,
            name: `${machine.name} 14-Day PM`,
            description: `Preventive maintenance every 14 days for ${machine.name}`,
            status: "active",
            planType: "time_based",
            assetId: machine.name,
            frequencyValue: 14,
            frequencyUnit: "days",
            nextDueDate: toUnix(nextDueDate),
            nextDueMeter: null,
            workTemplateCode: "PM-STANDARD",
            effectiveFrom: toUnix(commissioningDate),
            effectiveTo: null,
            createdAt: toUnix(commissioningDate),
            updatedAt: nowTs,
        };
        maintenancePlans.set(planId, plan);
        maintenancePlanList.push(planId);
        maintenancePlansByAsset.get(machine.name)!.push(planId);

        // --- Maintenance Schedules + Preventive WOs ---
        const planSchedules: any[] = [];
        let scheduleCursor = new Date(commissioningDate);
        while (scheduleCursor <= windowEnd) {
            const schedId = `MS-${String(schedNum).padStart(6, "0")}`;
            schedNum++;
            const dueDate = new Date(scheduleCursor);
            const isPast = dueDate < now;
            const isNear = !isPast && dueDate < addDays(now, 21);

            let schedStatus: string;
            let genWoId: string | null = null;

            if (isPast) {
                schedStatus = "completed";
                const woId = `WO-${String(woNum).padStart(6, "0")}`;
                woNum++;
                const woStart = new Date(dueDate);
                const woEnd = new Date(woStart.getTime() + 2 * 3600000);

                const wo: any = {
                    id: woId,
                    workOrderNumber: woId,
                    description: `Preventive maintenance for ${machine.name}`,
                    status: "completed",
                    workType: "preventive",
                    priority: "medium",
                    assetId: machine.name,
                    locationId,
                    maintenancePlanId: planId,
                    serviceRequestId: null,
                    mesProductionOrderId: null,
                    mesDowntimeEventId: null,
                    requestedStart: toUnix(woStart),
                    scheduledStart: toUnix(woStart),
                    scheduledEnd: toUnix(woEnd),
                    actualStart: toUnix(woStart),
                    actualEnd: toUnix(woEnd),
                    plannerGroup: "MAINTENANCE",
                    assignedTeam: "Maint-Team-A",
                    problemCode: "PM",
                    causeCode: "SCHEDULED",
                    remedyCode: "SERVICE",
                    summaryNotes: "Preventive maintenance completed per schedule",
                    createdAt: toUnix(addDays(dueDate, -2)),
                    updatedAt: toUnix(woEnd),
                };
                workOrders.set(woId, wo);
                workOrderList.push(woId);
                workOrdersByAsset.get(machine.name)!.push(woId);
                if (!workOrdersByLocation.has(locationId)) workOrdersByLocation.set(locationId, []);
                workOrdersByLocation.get(locationId)!.push(woId);

                const woOps = [
                    { id: `${woId}-01`, sequence: 1, title: "Pre-inspection", description: "Initial condition assessment", status: "completed", workCenter: locationId, plannedDurationHours: 0.25, actualDurationHours: 0.3 },
                    { id: `${woId}-02`, sequence: 2, title: "Lubrication & cleaning", description: "Oil change, filter replacement, cleaning", status: "completed", workCenter: locationId, plannedDurationHours: 1.0, actualDurationHours: 0.9 },
                    { id: `${woId}-03`, sequence: 3, title: "Functional test", description: "Test operation and verify performance", status: "completed", workCenter: locationId, plannedDurationHours: 0.5, actualDurationHours: 0.5 },
                ];
                workOrderOperations.set(woId, woOps);
                genWoId = woId;

                assetHistory.get(machine.name)!.push({
                    eventId: `AHE-${woId}`,
                    eventType: "workOrder",
                    eventDate: toUnix(woStart),
                    referenceId: woId,
                    summary: "Preventive maintenance completed",
                    status: "completed",
                });
            } else if (isNear) {
                schedStatus = "due";
            } else {
                schedStatus = "forecasted";
            }

            planSchedules.push({
                id: schedId,
                maintenancePlanId: planId,
                dueDate: toUnix(dueDate),
                dueMeter: null,
                status: schedStatus,
                generatedWorkOrderId: genWoId,
            });
            scheduleCursor = addDays(scheduleCursor, 14);
        }
        maintenanceSchedules.set(planId, planSchedules);

        // --- Corrective WOs from breakdowns ---
        const numCorrectiveWOs = rng.nextInt(1, 3);
        for (let c = 0; c < numCorrectiveWOs; c++) {
            const breakdownDate = addDays(windowStart, rng.nextInt(0, monthsBack * 30));
            if (breakdownDate >= now) continue;

            const srId = `SR-${String(srNum).padStart(6, "0")}`;
            srNum++;

            const srStatus = breakdownDate < addDays(now, -7) ? "closed" : "open";
            const sr: any = {
                id: srId,
                requestNumber: srId,
                title: `Equipment failure on ${machine.name}`,
                description: `Reported breakdown: unusual noise and vibration detected on ${machine.name}`,
                status: srStatus,
                priority: "high",
                assetId: machine.name,
                locationId,
                requestedBy: rng.pick(["Operator-A", "Operator-B", "Shift-Supervisor"]),
                requestedAt: toUnix(breakdownDate),
                linkedWorkOrderId: null,
                updatedAt: nowTs,
            };
            serviceRequests.set(srId, sr);
            serviceRequestList.push(srId);
            serviceRequestsByAsset.get(machine.name)!.push(srId);

            const woId = `WO-${String(woNum).padStart(6, "0")}`;
            woNum++;
            const repairDurationMs = rng.nextFloat(1, 4) * 3600000;
            const woEnd = new Date(breakdownDate.getTime() + repairDurationMs);

            const wo: any = {
                id: woId,
                workOrderNumber: woId,
                description: `Corrective maintenance for breakdown on ${machine.name}`,
                status: "completed",
                workType: "corrective",
                priority: "high",
                assetId: machine.name,
                locationId,
                maintenancePlanId: null,
                serviceRequestId: srId,
                mesProductionOrderId: null,
                mesDowntimeEventId: null,
                requestedStart: toUnix(breakdownDate),
                scheduledStart: toUnix(breakdownDate),
                scheduledEnd: toUnix(woEnd),
                actualStart: toUnix(breakdownDate),
                actualEnd: toUnix(woEnd),
                plannerGroup: "MAINTENANCE",
                assignedTeam: "Maint-Team-B",
                problemCode: "BREAKDOWN",
                causeCode: rng.pick(["WEAR", "FAILURE", "DAMAGE", "CONTAMINATION"]),
                remedyCode: rng.pick(["REPLACE", "REPAIR", "ADJUST"]),
                summaryNotes: "Corrective maintenance completed. Root cause identified and resolved.",
                createdAt: toUnix(breakdownDate),
                updatedAt: toUnix(woEnd),
            };
            workOrders.set(woId, wo);
            workOrderList.push(woId);
            workOrdersByAsset.get(machine.name)!.push(woId);
            if (!workOrdersByLocation.has(locationId)) workOrdersByLocation.set(locationId, []);
            workOrdersByLocation.get(locationId)!.push(woId);
            sr.linkedWorkOrderId = woId;

            const woOps = [
                { id: `${woId}-01`, sequence: 1, title: "Fault diagnosis", description: "Identify root cause of failure", status: "completed", workCenter: locationId, plannedDurationHours: 0.5, actualDurationHours: rng.nextFloat(0.3, 1.0) },
                { id: `${woId}-02`, sequence: 2, title: "Repair/Replace", description: "Perform repair or component replacement", status: "completed", workCenter: locationId, plannedDurationHours: 2.0, actualDurationHours: rng.nextFloat(1.0, 3.5) },
                { id: `${woId}-03`, sequence: 3, title: "Verification", description: "Test and verify repair effectiveness", status: "completed", workCenter: locationId, plannedDurationHours: 0.5, actualDurationHours: rng.nextFloat(0.25, 0.75) },
            ];
            workOrderOperations.set(woId, woOps);

            assetHistory.get(machine.name)!.push({
                eventId: `AHE-${woId}`,
                eventType: "workOrder",
                eventDate: toUnix(breakdownDate),
                referenceId: woId,
                summary: "Corrective maintenance completed after breakdown",
                status: "completed",
            });
        }

        // --- Inspections: ~1 per month ---
        let inspCursor = new Date(windowStart);
        while (inspCursor < now) {
            const inspId = `INS-${String(inspNum).padStart(6, "0")}`;
            inspNum++;
            const inspDate = new Date(inspCursor);
            const result = rng.bool(0.8) ? "pass" : "fail";
            const followUp = result === "fail";

            const insp: any = {
                id: inspId,
                inspectionNumber: inspId,
                title: `Monthly inspection of ${machine.name}`,
                assetId: machine.name,
                locationId,
                inspectionDate: toUnix(inspDate),
                inspector: rng.pick(INSPECTORS),
                result,
                findings: result === "pass" ? "No significant issues found. Equipment in good operational condition." : rng.pick(["Minor wear on guide rails", "Coolant level low", "Vibration slightly elevated", "Belt tension requires adjustment"]),
                followUpRequired: followUp,
                linkedWorkOrderId: null,
                updatedAt: toUnix(inspDate),
            };
            inspections.set(inspId, insp);
            inspectionList.push(inspId);
            inspectionsByAsset.get(machine.name)!.push(inspId);

            assetHistory.get(machine.name)!.push({
                eventId: `AHE-${inspId}`,
                eventType: "inspection",
                eventDate: toUnix(inspDate),
                referenceId: inspId,
                summary: `Inspection ${result}: ${insp.findings.substring(0, 50)}`,
                status: result,
            });

            inspCursor = addDays(inspCursor, rng.nextInt(25, 35));
        }

        // Sort asset history
        assetHistory.get(machine.name)!.sort((a, b) => a.eventDate - b.eventDate);
    }

    return {
        assets,
        assetList,
        locations: structural.eamLocations,
        locationList: structural.eamLocationList,
        workOrders,
        workOrderList,
        workOrderOperations,
        maintenancePlans,
        maintenancePlanList,
        maintenanceSchedules,
        serviceRequests,
        serviceRequestList,
        inspections,
        inspectionList,
        assetHistory,
        workOrdersByAsset,
        workOrdersByLocation,
        assetsByLocation,
        maintenancePlansByAsset,
        inspectionsByAsset,
        serviceRequestsByAsset,
    };
}
