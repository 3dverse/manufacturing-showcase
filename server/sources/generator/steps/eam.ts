import type { GeneratorConfig } from "../types";
import type { RNG } from "../rng";
import { flattenMachines, getLocationForWorkCenter, flattenWorkCenters } from "../graph";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function addHours(d: Date, h: number): Date {
    return new Date(d.getTime() + h * 3600000);
}

const MANUFACTURERS = ["Mazak", "Fanuc", "ABB", "Siemens", "DMG Mori", "Mitsubishi", "Okuma", "Haas"];
const MACHINE_MODELS: Record<string, string[]> = {
    MACHINING:       ["VC-500", "VARIAXIS-500", "INTEGREX-200", "QTN-200"],
    ASSEMBLY:        ["AX-2000", "PowerFit-Pro", "SmartAssembly-300"],
    PAINTING:        ["SprayMax-400", "AutoCoat-200"],
    QUALITY_CONTROL: ["CMM-700", "ScanMaster-500", "VisionSystem-300"],
    DEFAULT:         ["Industrial-300", "AutoMatic-200"],
};
const INSPECTORS = ["J. Smith", "M. Johnson", "P. Williams", "K. Brown", "C. Davis"];

export function generateEAM(
    config: GeneratorConfig,
    structural: {
        eamLocations: Map<string, any>;
        eamLocationList: string[];
        assetsByWorkCenter: Map<string, string[]>;
    },
    rng: RNG,
): any {
    const { now, monthsBack, monthsForward, site } = config;
    const windowStart = addDays(now, -monthsBack * 30);
    const windowEnd   = addDays(now,  monthsForward * 30);
    const siteId = config.siteId!;

    const assets              = new Map<string, any>();
    const assetList: string[] = [];
    const maintenancePlans    = new Map<string, any>();
    const maintenancePlanList: string[] = [];
    const maintenanceSchedules = new Map<string, any[]>();
    const workOrders          = new Map<string, any>();
    const workOrderList: string[] = [];
    const workOrderOperations = new Map<string, any[]>();
    const serviceRequests     = new Map<string, any>();
    const serviceRequestList: string[] = [];
    const inspections         = new Map<string, any>();
    const inspectionList: string[] = [];
    const assetHistory        = new Map<string, any[]>();

    const workOrdersByAsset    = new Map<string, string[]>();
    const workOrdersByLocation = new Map<string, string[]>();
    const assetsByLocation     = new Map<string, string[]>();
    const maintenancePlansByAsset = new Map<string, string[]>();
    const inspectionsByAsset   = new Map<string, string[]>();
    const serviceRequestsByAsset = new Map<string, string[]>();

    let woNum    = 1;
    let srNum    = 1;
    let inspNum  = 1;
    let planNum  = 1;
    let schedNum = 1;

    const machines = flattenMachines(site);
    const nowTs    = toUnix(now);

    for (const machine of machines) {
        const workCenterName    = machine.lineage[machine.lineage.length - 1] ?? "";
        const parentWorkCenter  = flattenWorkCenters(site).find((c) => c.name === workCenterName);
        const workCenterId = parentWorkCenter?.hash ?? machine.hash;
        void getLocationForWorkCenter(site, workCenterName); // (location context unused; machine owns its own EAM location)
        const opType      = parentWorkCenter?.tags["operationType"] ?? "DEFAULT";
        const locationId  = machine.hash; // EAM physical location for the machine

        const criticality  = opType === "MACHINING" ? "high" : opType === "ASSEMBLY" ? "medium" : "low";
        const manufacturer = rng.pick(MANUFACTURERS);
        const models       = MACHINE_MODELS[opType] ?? MACHINE_MODELS["DEFAULT"];
        const model        = rng.pick(models);

        const yearsBack         = rng.nextFloat(2, 8);
        const commissioningDate = addDays(now, -Math.round(yearsBack * 365));
        const hoursOperated     = Math.round(yearsBack * 365 * 24 * 0.7);

        // -----------------------------------------------------------------------
        // Asset
        // -----------------------------------------------------------------------
        const asset: any = {
            id:                 machine.hash,
            assetCode:          machine.name,
            name:               `${manufacturer} ${model} (${machine.name})`,
            description:        `${opType} machine ${machine.name}`,
            assetType:          opType.toLowerCase(),
            classCode:          opType,
            status:             "active",
            criticality,
            serialNumber:       `SN-${rng.nextInt(100000, 999999)}`,
            manufacturer,
            model,
            commissioningDate:  toUnix(commissioningDate),
            parentAssetId:      null,
            locationId,
            siteCode:           siteId,
            maintenanceStrategy: "time_based",
            meterReading:       hoursOperated,
            meterUnit:          "hours",
            createdAt:          toUnix(commissioningDate),
            updatedAt:          nowTs,
        };
        assets.set(machine.hash, asset);
        assetList.push(machine.hash);

        if (!assetsByLocation.has(locationId)) assetsByLocation.set(locationId, []);
        assetsByLocation.get(locationId)!.push(machine.hash);

        workOrdersByAsset.set(machine.hash, []);
        maintenancePlansByAsset.set(machine.hash, []);
        inspectionsByAsset.set(machine.hash, []);
        serviceRequestsByAsset.set(machine.hash, []);
        assetHistory.set(machine.hash, []);

        // -----------------------------------------------------------------------
        // Step 1 — Inspections  (~1 per month across the window)
        // -----------------------------------------------------------------------
        let inspCursor = new Date(windowStart);
        while (inspCursor < now) {
            const inspId   = `INS-${String(inspNum++).padStart(6, "0")}`;
            const inspDate = new Date(inspCursor);
            const result   = rng.bool(0.8) ? "pass" : "fail";

            const insp: any = {
                id:               inspId,
                inspectionNumber: inspId,
                title:            `Monthly inspection of ${machine.name}`,
                assetId:          machine.hash,
                locationId,
                inspectionDate:   toUnix(inspDate),
                inspector:        rng.pick(INSPECTORS),
                result,
                findings:         result === "pass"
                    ? "No significant issues found. Equipment in good operational condition."
                    : rng.pick(["Minor wear on guide rails", "Coolant level low", "Vibration slightly elevated", "Belt tension requires adjustment"]),
                followUpRequired: result === "fail",
                linkedWorkOrderId: null,
                updatedAt:        toUnix(inspDate),
            };
            inspections.set(inspId, insp);
            inspectionList.push(inspId);
            inspectionsByAsset.get(machine.hash)!.push(inspId);

            assetHistory.get(machine.hash)!.push({
                eventId:     `AHE-${inspId}`,
                eventType:   "inspection",
                eventDate:   toUnix(inspDate),
                referenceId: inspId,
                summary:     `Inspection ${result}: ${insp.findings.substring(0, 50)}`,
                status:      result,
            });

            // -----------------------------------------------------------------------
            // Step 2 — Failed inspection → Service Request
            // Step 3 — Service Request → Corrective Work Order
            // -----------------------------------------------------------------------
            if (result === "fail") {
                const srId = `SR-${String(srNum++).padStart(6, "0")}`;
                // SR is raised on the same day as the inspection
                const srDate = new Date(inspDate);

                // Corrective WO is created 1-5 days after the SR (if far enough in the past)
                const daysUntilRepair = rng.nextInt(1, 5);
                const woDate = addDays(srDate, daysUntilRepair);
                const woCreatable = woDate < now;

                const srStatus = !woCreatable ? "open" : "closed";
                const sr: any = {
                    id:              srId,
                    requestNumber:   srId,
                    title:           `Equipment issue on ${machine.name}: ${insp.findings.substring(0, 40)}`,
                    description:     `Reported after inspection ${inspId}: ${insp.findings}`,
                    status:          srStatus,
                    priority:        "high",
                    assetId:         machine.hash,
                    locationId,
                    requestedBy:     rng.pick(["Operator-A", "Operator-B", "Shift-Supervisor"]),
                    requestedAt:     toUnix(srDate),
                    linkedWorkOrderId: null,
                    updatedAt:       nowTs,
                };
                serviceRequests.set(srId, sr);
                serviceRequestList.push(srId);
                serviceRequestsByAsset.get(machine.hash)!.push(srId);

                if (woCreatable) {
                    const woId         = `WO-${String(woNum++).padStart(6, "0")}`;
                    const repairHours  = rng.nextFloat(1, 4);
                    const woEnd        = addHours(woDate, repairHours);

                    const wo: any = {
                        id:              woId,
                        workOrderNumber: woId,
                        description:     `Corrective maintenance for ${machine.name}: ${insp.findings}`,
                        status:          "completed",
                        workType:        "corrective",
                        priority:        "high",
                        assetId:         machine.hash,
                        locationId,
                        maintenancePlanId:   null,
                        serviceRequestId:    srId,
                        mesProductionOrderId: null, // filled in post-processing
                        mesDowntimeEventId:  null,
                        requestedStart:  toUnix(woDate),
                        scheduledStart:  toUnix(woDate),
                        scheduledEnd:    toUnix(woEnd),
                        actualStart:     toUnix(woDate),
                        actualEnd:       toUnix(woEnd),
                        plannerGroup:    "MAINTENANCE",
                        assignedTeam:    "Maint-Team-B",
                        problemCode:     "INSPECTION_FINDING",
                        causeCode:       rng.pick(["WEAR", "FAILURE", "DAMAGE", "CONTAMINATION"]),
                        remedyCode:      rng.pick(["REPLACE", "REPAIR", "ADJUST"]),
                        summaryNotes:    "Corrective maintenance completed. Issue identified during inspection resolved.",
                        createdAt:       toUnix(srDate),
                        updatedAt:       toUnix(woEnd),
                    };
                    workOrders.set(woId, wo);
                    workOrderList.push(woId);
                    workOrdersByAsset.get(machine.hash)!.push(woId);
                    if (!workOrdersByLocation.has(locationId)) workOrdersByLocation.set(locationId, []);
                    workOrdersByLocation.get(locationId)!.push(woId);

                    // Link SR → WO
                    sr.linkedWorkOrderId = woId;
                    insp.linkedWorkOrderId = woId;

                    const woOps = [
                        { id: `${woId}-01`, sequence: 1, title: "Fault diagnosis", description: "Identify root cause from inspection findings", status: "completed", workCenterId, plannedDurationHours: 0.5, actualDurationHours: rng.nextFloat(0.3, 1.0) },
                        { id: `${woId}-02`, sequence: 2, title: "Repair/Replace", description: "Perform repair or component replacement", status: "completed", workCenterId, plannedDurationHours: 2.0, actualDurationHours: rng.nextFloat(1.0, 3.5) },
                        { id: `${woId}-03`, sequence: 3, title: "Verification", description: "Test and verify repair effectiveness", status: "completed", workCenterId, plannedDurationHours: 0.5, actualDurationHours: rng.nextFloat(0.25, 0.75) },
                    ];
                    workOrderOperations.set(woId, woOps);

                    assetHistory.get(machine.hash)!.push({
                        eventId:     `AHE-${woId}`,
                        eventType:   "workOrder",
                        eventDate:   toUnix(woDate),
                        referenceId: woId,
                        summary:     "Corrective maintenance completed after inspection finding",
                        status:      "completed",
                    });
                }
            }

            inspCursor = addDays(inspCursor, rng.nextInt(25, 35));
        }

        // -----------------------------------------------------------------------
        // Step 4 — Maintenance Plan
        // Step 5 — Preventive Work Orders for past due dates
        // -----------------------------------------------------------------------
        const planId          = `MP-${String(planNum++).padStart(5, "0")}`;
        const lastServiceDate = addDays(now, -rng.nextInt(0, 14));
        const nextDueDate     = addDays(lastServiceDate, 14);

        const plan: any = {
            id:               planId,
            planCode:         planId,
            name:             `${machine.name} 14-Day PM`,
            description:      `Preventive maintenance every 14 days for ${machine.name}`,
            status:           "active",
            planType:         "time_based",
            assetId:          machine.hash,
            frequencyValue:   14,
            frequencyUnit:    "days",
            nextDueDate:      toUnix(nextDueDate),
            nextDueMeter:     null,
            workTemplateCode: "PM-STANDARD",
            effectiveFrom:    toUnix(commissioningDate),
            effectiveTo:      null,
            createdAt:        toUnix(commissioningDate),
            updatedAt:        nowTs,
        };
        maintenancePlans.set(planId, plan);
        maintenancePlanList.push(planId);
        maintenancePlansByAsset.get(machine.hash)!.push(planId);

        // Walk schedule from commissioning to window end
        const planSchedules: any[] = [];
        let scheduleCursor = new Date(commissioningDate);

        while (scheduleCursor <= windowEnd) {
            const schedId  = `MS-${String(schedNum++).padStart(6, "0")}`;
            const dueDate  = new Date(scheduleCursor);
            const isPast   = dueDate < now;
            const isNear   = !isPast && dueDate < addDays(now, 21);

            let schedStatus: string;
            let genWoId: string | null = null;

            if (isPast) {
                schedStatus = "completed";
                const woId     = `WO-${String(woNum++).padStart(6, "0")}`;
                const woStart  = new Date(dueDate);
                const woEnd    = addHours(woStart, 2);

                const wo: any = {
                    id:              woId,
                    workOrderNumber: woId,
                    description:     `Preventive maintenance for ${machine.name}`,
                    status:          "completed",
                    workType:        "preventive",
                    priority:        "medium",
                    assetId:         machine.hash,
                    locationId,
                    maintenancePlanId:    planId,
                    serviceRequestId:     null,
                    mesProductionOrderId: null,
                    mesDowntimeEventId:   null,
                    requestedStart:  toUnix(woStart),
                    scheduledStart:  toUnix(woStart),
                    scheduledEnd:    toUnix(woEnd),
                    actualStart:     toUnix(woStart),
                    actualEnd:       toUnix(woEnd),
                    plannerGroup:    "MAINTENANCE",
                    assignedTeam:    "Maint-Team-A",
                    problemCode:     "PM",
                    causeCode:       "SCHEDULED",
                    remedyCode:      "SERVICE",
                    summaryNotes:    "Preventive maintenance completed per schedule",
                    createdAt:       toUnix(addDays(dueDate, -2)),
                    updatedAt:       toUnix(woEnd),
                };
                workOrders.set(woId, wo);
                workOrderList.push(woId);
                workOrdersByAsset.get(machine.hash)!.push(woId);
                if (!workOrdersByLocation.has(locationId)) workOrdersByLocation.set(locationId, []);
                workOrdersByLocation.get(locationId)!.push(woId);

                const woOps = [
                    { id: `${woId}-01`, sequence: 1, title: "Pre-inspection", description: "Initial condition assessment", status: "completed", workCenterId, plannedDurationHours: 0.25, actualDurationHours: 0.3 },
                    { id: `${woId}-02`, sequence: 2, title: "Lubrication & cleaning", description: "Oil change, filter replacement, cleaning", status: "completed", workCenterId, plannedDurationHours: 1.0, actualDurationHours: 0.9 },
                    { id: `${woId}-03`, sequence: 3, title: "Functional test", description: "Test operation and verify performance", status: "completed", workCenterId, plannedDurationHours: 0.5, actualDurationHours: 0.5 },
                ];
                workOrderOperations.set(woId, woOps);
                genWoId = woId;

                assetHistory.get(machine.hash)!.push({
                    eventId:     `AHE-${woId}`,
                    eventType:   "workOrder",
                    eventDate:   toUnix(woStart),
                    referenceId: woId,
                    summary:     "Preventive maintenance completed",
                    status:      "completed",
                });
            } else if (isNear) {
                schedStatus = "due";
            } else {
                schedStatus = "forecasted";
            }

            planSchedules.push({
                id:                   schedId,
                maintenancePlanId:    planId,
                dueDate:              toUnix(dueDate),
                dueMeter:             null,
                status:               schedStatus,
                generatedWorkOrderId: genWoId,
            });
            scheduleCursor = addDays(scheduleCursor, 14);
        }
        maintenanceSchedules.set(planId, planSchedules);

        // Sort asset history chronologically
        assetHistory.get(machine.hash)!.sort((a, b) => a.eventDate - b.eventDate);
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
