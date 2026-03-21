import type { GeneratorConfig } from "../types";
import type { RNG } from "../rng";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

const AUDITORS = ["A. Thompson", "B. Richards", "C. Martinez", "D. Nguyen"];
const AREAS = ["MACHINING", "ASSEMBLY", "PAINTING", "QUALITY"];

const DOCUMENTS = [
    { code: "SOP-001", title: "Machining Setup and Operation", documentType: "sop", department: "MACHINING" },
    { code: "SOP-002", title: "Assembly Process Control", documentType: "sop", department: "ASSEMBLY" },
    { code: "SOP-003", title: "Painting and Coating Procedures", documentType: "sop", department: "PAINTING" },
    { code: "SOP-004", title: "Quality Inspection Methods", documentType: "sop", department: "QUALITY" },
    { code: "WI-001", title: "Hydraulic Pump Assembly Instructions", documentType: "work_instruction", department: "ASSEMBLY" },
    { code: "WI-002", title: "CNC Machine Setup Work Instructions", documentType: "work_instruction", department: "MACHINING" },
    { code: "WI-003", title: "CMM Measurement Procedure", documentType: "work_instruction", department: "QUALITY" },
    { code: "WI-004", title: "Surface Coating Work Instructions", documentType: "work_instruction", department: "PAINTING" },
    { code: "SPEC-001", title: "Dimensional Tolerance Specification", documentType: "specification", department: "QUALITY" },
    { code: "SPEC-002", title: "Surface Finish Requirements", documentType: "specification", department: "QUALITY" },
    { code: "POL-001", title: "Quality Management Policy", documentType: "policy", department: "QUALITY" },
    { code: "MAN-001", title: "Quality Manual", documentType: "manual", department: "QUALITY" },
    { code: "FORM-001", title: "Nonconformance Report Form", documentType: "form", department: "QUALITY" },
    { code: "FORM-002", title: "CAPA Request Form", documentType: "form", department: "QUALITY" },
    { code: "TMPL-001", title: "Inspection Checklist Template", documentType: "template", department: "QUALITY" },
];

export function generateQMS(
    config: GeneratorConfig,
    mes: any,
    erp: any,
    rng: RNG,
): any {
    const { now, monthsBack, monthsForward } = config;
    const windowStart = addDays(now, -monthsBack * 30);
    const windowEnd = addDays(now, monthsForward * 30);

    const nonconformances = new Map<string, any>();
    const nonconformanceList: string[] = [];
    const capas = new Map<string, any>();
    const capaList: string[] = [];
    const deviations = new Map<string, any>();
    const deviationList: string[] = [];
    const audits = new Map<string, any>();
    const auditList: string[] = [];
    const complaints = new Map<string, any>();
    const complaintList: string[] = [];
    const documents = new Map<string, any>();
    const documentList: string[] = [];

    let ncNum = 1;
    let capaNum = 1;
    let devNum = 1;
    let auditNum = 1;
    let compNum = 1;

    // --- Nonconformances from MES scrap: one NC per defect type per operation ---
    for (const opId of mes.operationList) {
        const op = mes.operations.get(opId);
        if (!op || op.quantities.scrapQuantity <= 0) continue;
        if (op.status === "ready") continue;

        const detectedAtUnix: number = op.actualEnd ?? op.scheduledEnd;
        const detectedAt = new Date(detectedAtUnix * 1000);
        const isOld = detectedAt < addDays(now, -30);
        const isRecent = detectedAt > addDays(now, -7);

        const po = mes.productionOrders.get(op.productionOrderId);
        const itemCode = po?.itemCode ?? null;
        const batchLot = op._lotNumber ?? op.productionOrderId;

        const defectBreakdown: { defectCode: string; quantity: number }[] = op._defectBreakdown ?? [{ defectCode: "DEFECT", quantity: op.quantities.scrapQuantity }];

        for (const { defectCode, quantity } of defectBreakdown) {
            const ncId = `NC-${String(ncNum).padStart(6, "0")}`;
            ncNum++;

            const defectScrapRate = quantity / Math.max(1, op.quantities.plannedQuantity);
            const severity = defectScrapRate < 0.02 ? "minor" : defectScrapRate < 0.05 ? "major" : "critical";
            const ncStatus = isOld ? "closed" : isRecent ? "under_review" : rng.bool(0.5) ? "dispositioned" : "closed";
            const disposition = rng.bool(0.7) ? "scrap" : "rework";

            const nc: any = {
                id: ncId,
                code: ncId,
                title: `${defectCode} — ${op.operationCode} on ${op.productionOrderId}`,
                description: `${quantity} ${op.quantities.uom} scrapped with defect "${defectCode}" during ${op.operationDescription}. Scrap rate: ${(defectScrapRate * 100).toFixed(1)}%`,
                status: ncStatus,
                severity,
                sourceType: "in_process",
                itemCode,
                batchLot,
                detectedAt: detectedAtUnix,
                detectedBy: rng.pick(["QC Inspector", "Operator", "Supervisor"]),
                disposition,
                mesProductionOrderId: op.productionOrderId,
                mesOperationId: op.id,
                eamAssetId: op.eamAssetId ?? null,
                defectCode,
                affectedQuantity: quantity,
                containmentActions: [
                    "Segregate non-conforming parts",
                    severity !== "minor" ? "Halt production pending review" : "Continue with enhanced inspection",
                ],
                linkedRecords: [],
            };
            nonconformances.set(ncId, nc);
            nonconformanceList.push(ncId);

            // Create CAPA for major/critical
            if (severity !== "minor" && rng.bool(0.8)) {
                const capaId = `CAPA-${String(capaNum).padStart(5, "0")}`;
                capaNum++;
                const openedAt = new Date(detectedAtUnix * 1000);
                const dueAt = addDays(openedAt, 30);
                const capaStatus = isOld ? "closed" : isRecent ? "open" : "in_progress";

                const capa: any = {
                    id: capaId,
                    code: capaId,
                    title: `CAPA for ${severity} NC: ${ncId} (${defectCode})`,
                    description: `Corrective action to address root cause of "${defectCode}" defects in ${op.operationDescription}`,
                    type: "corrective",
                    status: capaStatus,
                    priority: severity === "critical" ? "high" : "medium",
                    sourceRecord: { system: "qms", id: ncId, type: "nonconformance" },
                    rootCause: rng.pick([
                        "Tool wear exceeding replacement threshold",
                        "Process parameter drift outside control limits",
                        "Incoming material dimensional non-compliance",
                        "Fixture alignment deviation",
                        "Operator process deviation",
                    ]),
                    owner: rng.pick(["QA Manager", "Process Engineer", "Production Supervisor"]),
                    openedAt: toUnix(openedAt),
                    dueAt: toUnix(dueAt),
                    effectivenessCheckAt: toUnix(addDays(dueAt, 14)),
                    closedAt: capaStatus === "closed" ? toUnix(addDays(openedAt, rng.nextInt(20, 35))) : null,
                    actions: [
                        "Perform root cause analysis using 8D methodology",
                        "Update control plan with enhanced inspection frequency",
                        "Retrain operator on process requirements",
                    ],
                };
                capas.set(capaId, capa);
                capaList.push(capaId);
                nc.linkedRecords.push({ system: "qms", id: capaId, type: "capa" });
            }
        }
    }

    // --- Deviations: ~1 per month ---
    const DEVIATION_TITLES = [
        "Process temperature outside specification",
        "Coolant concentration deviation",
        "Feed rate adjustment during machining",
        "Assembly torque deviation",
        "Paint thickness below minimum specification",
        "Inspection frequency reduction during surge",
    ];
    let devCursor = new Date(windowStart);
    while (devCursor < windowEnd) {
        if (rng.bool(0.7)) {
            const devId = `DEV-${String(devNum).padStart(5, "0")}`;
            devNum++;
            const raisedAt = new Date(devCursor);
            const isPast = raisedAt < addDays(now, -14);
            const devStatus = isPast ? rng.pick(["approved", "closed"]) : rng.pick(["open", "under_review"]);

            const dev: any = {
                id: devId,
                code: devId,
                title: rng.pick(DEVIATION_TITLES),
                description: "Process deviation identified and documented for disposition review",
                status: devStatus,
                category: rng.pick(["process", "specification", "material"]),
                impactLevel: rng.pick(["low", "low", "medium", "medium", "high"]),
                raisedAt: toUnix(raisedAt),
                raisedBy: rng.pick(["Process Engineer", "Shift Supervisor", "QA Inspector"]),
                affectedArea: rng.pick(AREAS),
                temporaryControls: ["Enhanced monitoring", "100% inspection until disposition"],
                dispositionSummary: devStatus === "closed" || devStatus === "approved" ? "Deviation approved for limited duration. Process restored to nominal." : null,
                linkedRecords: [],
            };
            deviations.set(devId, dev);
            deviationList.push(devId);
        }
        devCursor = addDays(devCursor, rng.nextInt(25, 35));
    }

    // --- Audits ---
    const auditSchedule = [
        { type: "internal", monthOffsets: [-3, -6, 0, 3, 6] },
        { type: "supplier", monthOffsets: [-2, -5, 1, 4] },
    ];

    for (const sched of auditSchedule) {
        for (const mo of sched.monthOffsets) {
            const auditDate = addDays(now, mo * 30);
            if (auditDate < windowStart || auditDate > windowEnd) continue;

            const auditId = `AUD-${String(auditNum).padStart(5, "0")}`;
            auditNum++;
            const isCompleted = auditDate < addDays(now, -3);
            const isInProgress = !isCompleted && auditDate < addDays(now, 3);
            const auditStatus = isCompleted ? "completed" : isInProgress ? "in_progress" : "planned";

            const result = isCompleted ? rng.pick(["compliant", "compliant", "compliant", "minor_findings", "major_findings"]) : undefined;
            const completedDate = addDays(auditDate, 1);

            const audit: any = {
                id: auditId,
                code: auditId,
                title: `${sched.type === "internal" ? "Internal QMS Audit" : "Supplier Qualification Audit"} Q${Math.ceil((auditDate.getMonth() + 1) / 3)} ${auditDate.getFullYear()}`,
                auditType: sched.type,
                status: auditStatus,
                scope: sched.type === "internal" ? `Full QMS scope covering ${rng.pick(AREAS)} area` : "Supplier quality system and manufacturing capabilities",
                leadAuditor: rng.pick(AUDITORS),
                auditees: [rng.pick(AREAS), rng.pick(AREAS)].filter((v, i, a) => a.indexOf(v) === i),
                scheduledStart: toUnix(auditDate),
                scheduledEnd: toUnix(completedDate),
                completedAt: isCompleted ? toUnix(completedDate) : null,
                result: result ?? null,
                findingCount: result === "minor_findings" ? rng.nextInt(1, 4) : result === "major_findings" ? rng.nextInt(2, 6) : 0,
                linkedRecords: [],
            };
            audits.set(auditId, audit);
            auditList.push(auditId);
        }
    }

    // --- Complaints: ~1 per month ---
    const fulfilledSOs: any[] = erp.salesOrderList.filter((so: any) => so.status === "fulfilled" || so.status === "invoiced");
    let compCursor = new Date(windowStart);
    while (compCursor < now) {
        if (rng.bool(0.6) && fulfilledSOs.length > 0) {
            const compId = `CMP-${String(compNum).padStart(5, "0")}`;
            compNum++;
            const receivedAt = new Date(compCursor);
            const so: any = rng.pick(fulfilledSOs);
            const line = so.lines[0];
            const isOld = receivedAt < addDays(now, -14);
            const compStatus = isOld ? rng.pick(["closed", "resolved"]) : rng.pick(["open", "under_investigation"]);
            const severity = rng.pick(["minor", "minor", "minor", "major", "critical"]);

            const comp: any = {
                id: compId,
                code: compId,
                status: compStatus,
                severity,
                title: `Quality complaint for order ${so.orderNumber}`,
                description: rng.pick([
                    "Customer reported dimensional non-conformance on delivered parts",
                    "Surface finish below agreed specification",
                    "Functional test failure on delivered assembly",
                    "Missing documentation in delivery package",
                    "Packaging damage causing cosmetic defects",
                ]),
                customerReference: so.orderNumber,
                productCode: line.itemId,
                batchLot: so.orderNumber,
                receivedAt: toUnix(receivedAt),
                reportedBy: so.customerName,
                mesProductionOrderId: null,
                eamAssetId: null,
                investigationSummary: isOld ? "Investigation completed. Root cause identified as process control gap." : null,
                resolutionSummary: compStatus === "closed" || compStatus === "resolved" ? "Replacement parts shipped. Corrective action implemented." : null,
                linkedRecords: [],
            };
            complaints.set(compId, comp);
            complaintList.push(compId);
        }
        compCursor = addDays(compCursor, rng.nextInt(20, 45));
    }

    // --- Controlled Documents ---
    for (const docDef of DOCUMENTS) {
        const docId = `DOC-${docDef.code}`;
        const effectiveAt = toUnix(addDays(now, -rng.nextInt(90, 730)));
        const reviewDueAt = toUnix(addDays(new Date(effectiveAt * 1000), 365));
        const approvedAt = toUnix(addDays(new Date(effectiveAt * 1000), -90));

        const doc: any = {
            id: docId,
            code: docDef.code,
            title: docDef.title,
            documentType: docDef.documentType,
            status: "effective",
            department: docDef.department,
            owner: "Quality Manager",
            currentRevision: `Rev ${rng.pick(["A", "B", "C", "D"])}`,
            effectiveAt,
            reviewDueAt,
            revisions: [
                {
                    revision: "Rev A",
                    status: "obsolete",
                    approvedBy: "QA Director",
                    approvedAt,
                    effectiveAt: approvedAt,
                    changeSummary: "Initial release",
                },
                {
                    revision: `Rev ${rng.pick(["B", "C", "D"])}`,
                    status: "effective",
                    approvedBy: "QA Director",
                    approvedAt: effectiveAt,
                    effectiveAt,
                    changeSummary: "Updated per process improvement initiative",
                },
            ],
        };
        documents.set(docId, doc);
        documentList.push(docId);
    }

    return {
        nonconformances,
        nonconformanceList,
        capas,
        capaList,
        deviations,
        deviationList,
        audits,
        auditList,
        complaints,
        complaintList,
        documents,
        documentList,
    };
}
