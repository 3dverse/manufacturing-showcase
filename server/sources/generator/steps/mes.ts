import type { GeneratorConfig, CellTimeline, OEEBucket } from "../types";
import type { RNG } from "../rng";
import { flattenCells, getCellsByOperationType } from "../graph";
import { generateShiftRoster } from "../timeline";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

function addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function addMinutes(d: Date, m: number): Date {
    return new Date(d.getTime() + m * 60000);
}

function minutesBetween(a: Date, b: Date): number {
    return (b.getTime() - a.getTime()) / 60000;
}

export function generateMES(
    config: GeneratorConfig,
    structural: { workCenters: Map<string, any>; workCenterList: string[] },
    aps: any,
    _eam: any,
    rng: RNG,
): any {
    const { now, monthsBack, monthsForward, items, factory } = config;
    const windowStart = addDays(now, -monthsBack * 30);
    const windowEnd = addDays(now, monthsForward * 30);
    const siteId = factory.name;

    const itemMap = new Map(items.map((i) => [i.id, i]));

    const productionOrders = new Map<string, any>();
    const productionOrderList: string[] = [];
    const operations = new Map<string, any>();
    const operationList: string[] = [];
    const dispatchItems: any[] = [];
    const productionEvents: any[] = [];
    const downtimeEvents: any[] = [];
    const oeeTimeseries: OEEBucket[] = [];
    const cellTimelines = new Map<string, CellTimeline>();

    const operationsByProductionOrder = new Map<string, string[]>();
    const operationsByWorkCenter = new Map<string, string[]>();
    const productionOrdersByWorkCenter = new Map<string, string[]>();
    const productionEventsByOperation = new Map<string, any[]>();
    const productionEventsByProductionOrder = new Map<string, any[]>();
    const productionEventsByWorkCenter = new Map<string, any[]>();
    const downtimeByWorkCenter = new Map<string, any[]>();
    const oeeByWorkCenter = new Map<string, OEEBucket[]>();

    let evtNum = 1;
    let dtNum = 1;
    let poNum = 1;
    let opNum = 1;
    let dspNum = 1;
    let lotNum = 1;

    const cells = flattenCells(factory);

    // Initialize indexes
    for (const cell of cells) {
        operationsByWorkCenter.set(cell.name, []);
        productionOrdersByWorkCenter.set(cell.name, []);
        productionEventsByWorkCenter.set(cell.name, []);
        downtimeByWorkCenter.set(cell.name, []);
        oeeByWorkCenter.set(cell.name, []);
    }

    // --- Pass 1: Create Production Orders and Operations from APS ---
    for (const supply of aps.supplyList) {
        const item = itemMap.get(supply.itemId);
        if (!item) continue;
        if (item.routing.length === 0) continue;

        const supOps = (supply._opIds as string[])
            .map((id: string) => aps.scheduledOperations.get(id))
            .filter(Boolean);
        if (supOps.length === 0) continue;

        const poId = `MO-${String(poNum).padStart(6, "0")}`;
        poNum++;

        // plannedStart/plannedEnd are now unix timestamps
        const scheduledStartTs = supOps.reduce((min: number, op: any) => (op.plannedStart < min ? op.plannedStart : min), supOps[0].plannedStart as number);
        const scheduledEndTs = supOps.reduce((max: number, op: any) => (op.plannedEnd > max ? op.plannedEnd : max), supOps[0].plannedEnd as number);
        const scheduledStartDate = new Date(scheduledStartTs * 1000);
        const scheduledEndDate = new Date(scheduledEndTs * 1000);

        // Derive status
        let poStatus: string;
        if (scheduledEndDate < now) {
            poStatus = "completed";
        } else if (scheduledStartDate > now) {
            poStatus = "released";
        } else {
            poStatus = "in_progress";
        }

        // Resolve erpSalesOrderId via supply → demand → SO
        let erpSalesOrderId: string | null = null;
        const demandId = supply._demandId as string | undefined;
        if (demandId) {
            const dem = aps.demands.get(demandId);
            erpSalesOrderId = dem?._soId ?? null;
        }

        const primaryCells = getCellsByOperationType(factory, item.routing[0].cellOperationType);
        const primaryWc = primaryCells.length > 0 ? rng.pick(primaryCells).name : cells[0].name;

        const po: any = {
            id: poId,
            orderNumber: poId,
            siteId,
            itemCode: item.id,
            itemDescription: item.name,
            status: poStatus,
            priority: rng.nextInt(1, 5),
            workCenterId: primaryWc,
            quantities: {
                plannedQuantity: supply.quantity,
                producedQuantity: poStatus === "completed" ? supply.quantity : poStatus === "in_progress" ? Math.round(supply.quantity * rng.nextFloat(0.3, 0.7)) : 0,
                goodQuantity: 0,
                scrapQuantity: 0,
                uom: item.uom,
                outputLotNumbers: [],
            },
            timing: {
                scheduledStart: scheduledStartTs,
                scheduledEnd: scheduledEndTs,
                actualStart: poStatus !== "released" ? scheduledStartTs : null,
                actualEnd: poStatus === "completed" ? scheduledEndTs : null,
            },
            operationIds: [],
            currentOperationId: null,
            progressPercent: poStatus === "completed" ? 100 : poStatus === "in_progress" ? rng.nextFloat(20, 80) : 0,
            notes: "",
            erpSalesOrderId,
            apsPlanId: "PLN-BASELINE",
            _supplyId: supply.id,
        };

        // Create operations for each routing step
        for (let si = 0; si < item.routing.length; si++) {
            const step = item.routing[si];
            const scOp = supOps.find((o: any) => o.operationCode === step.operationCode);
            if (!scOp) continue;

            const cells2 = getCellsByOperationType(factory, step.cellOperationType);
            if (cells2.length === 0) continue;
            const cell = rng.pick(cells2);
            const wcId = cell.name;

            // Pick a machine from the cell for EAM asset link
            const eamAssetId = cell.machines.length > 0 ? rng.pick(cell.machines).name : null;

            const opId = `OPR-${String(opNum).padStart(6, "0")}`;
            opNum++;

            const opScheduledStart = new Date(scOp.plannedStart * 1000);
            const opScheduledEnd = new Date(scOp.plannedEnd * 1000);

            let opStatus: string;
            if (opScheduledEnd < now) {
                opStatus = "completed";
            } else if (opScheduledStart > now) {
                opStatus = "ready";
            } else {
                opStatus = "in_progress";
            }

            const varianceFactor = rng.gaussian(1.0, 0.08);
            const plannedRunMins = step.runTimeMinutes;
            const actualRunMins = Math.max(10, Math.round(plannedRunMins * varianceFactor));
            const scrapRate = Math.max(0, rng.gaussian(0.02, 0.01));
            const producedQty = poStatus === "completed" ? po.quantities.plannedQuantity : opStatus === "in_progress" ? Math.round(po.quantities.plannedQuantity * rng.nextFloat(0.2, 0.6)) : 0;
            const scrapQty = Math.round(producedQty * scrapRate);
            const goodQty = producedQty - scrapQty;

            // Generate lot number for this operation's output
            const lotNumber = `LOT-${String(lotNum).padStart(6, "0")}`;
            lotNum++;

            // Build defect breakdown for scrap quantity
            let defectBreakdown: { defectCode: string; quantity: number }[] = [];
            if (scrapQty > 0 && step.defects.length > 0) {
                const numDefects = rng.nextInt(1, Math.min(3, step.defects.length));
                const selectedDefects = rng.shuffle([...step.defects]).slice(0, numDefects);
                let remaining = scrapQty;
                for (let di = 0; di < selectedDefects.length; di++) {
                    const qty = di === selectedDefects.length - 1
                        ? remaining
                        : Math.max(1, Math.round(remaining * rng.nextFloat(0.2, 0.6)));
                    remaining -= qty;
                    if (qty > 0) defectBreakdown.push({ defectCode: selectedDefects[di], quantity: qty });
                }
            } else if (scrapQty > 0) {
                defectBreakdown = [{ defectCode: "DEFECT", quantity: scrapQty }];
            }

            const op: any = {
                id: opId,
                productionOrderId: poId,
                operationCode: step.operationCode,
                operationDescription: step.operationDescription,
                sequence: si + 1,
                status: opStatus,
                workCenterId: wcId,
                eamAssetId,
                plannedSetupTimeMinutes: step.setupTimeMinutes,
                plannedRunTimeMinutes: plannedRunMins,
                actualSetupTimeMinutes: opStatus !== "ready" ? Math.round(step.setupTimeMinutes * rng.nextFloat(0.8, 1.3)) : null,
                actualRunTimeMinutes: opStatus === "completed" ? actualRunMins : opStatus === "in_progress" ? Math.round(actualRunMins * rng.nextFloat(0.2, 0.7)) : null,
                quantities: {
                    plannedQuantity: po.quantities.plannedQuantity,
                    producedQuantity: producedQty,
                    goodQuantity: goodQty,
                    scrapQuantity: scrapQty,
                    uom: item.uom,
                    outputLotNumbers: producedQty > 0 ? [lotNumber] : [],
                },
                scheduledStart: toUnix(opScheduledStart),
                scheduledEnd: toUnix(opScheduledEnd),
                actualStart: opStatus !== "ready" ? toUnix(opScheduledStart) : null,
                actualEnd: opStatus === "completed" ? toUnix(opScheduledEnd) : null,
                progressPercent: opStatus === "completed" ? 100 : opStatus === "in_progress" ? rng.nextFloat(10, 90) : 0,
                _scrapRate: scrapRate,
                _scrapQty: scrapQty,
                _lotNumber: lotNumber,
                _defectBreakdown: defectBreakdown,
            };

            operations.set(opId, op);
            operationList.push(opId);
            po.operationIds.push(opId);

            if (producedQty > 0) po.quantities.outputLotNumbers.push(lotNumber);

            if (!operationsByProductionOrder.has(poId)) operationsByProductionOrder.set(poId, []);
            operationsByProductionOrder.get(poId)!.push(opId);

            operationsByWorkCenter.get(wcId)?.push(opId);
            if (!productionOrdersByWorkCenter.get(wcId)?.includes(poId)) {
                productionOrdersByWorkCenter.get(wcId)?.push(poId);
            }

            po.quantities.producedQuantity += producedQty;
            po.quantities.goodQuantity += goodQty;
            po.quantities.scrapQuantity += scrapQty;

            if (opStatus === "in_progress") {
                po.currentOperationId = opId;
            }
        }

        productionOrders.set(poId, po);
        productionOrderList.push(poId);
    }

    // --- Pass 2: Generate events, downtime, OEE for each cell ---
    for (const cell of cells) {
        const wcId = cell.name;
        const shiftRoster = generateShiftRoster(config.shifts, windowStart, windowEnd);
        const timeline: CellTimeline = { cellId: wcId, entries: [] };

        const mtbfHours = rng.nextFloat(400, 600);
        const mttrMinutes = rng.nextFloat(30, 180);
        const maintenanceIntervalDays = 14;
        let lastMaintenanceDate = addDays(now, -rng.nextInt(0, maintenanceIntervalDays));

        const cellOpIds = operationsByWorkCenter.get(wcId) ?? [];

        let dtSeq = 0;

        for (const slot of shiftRoster) {
            const shiftDurationMins = minutesBetween(slot.shiftStart, slot.shiftEnd);
            let shiftRuntimeMins = 0;
            let shiftDowntimeMins = 0;
            let shiftProduced = 0;
            let shiftGood = 0;
            let shiftScrap = 0;
            let shiftUom = "pcs";

            // Planned maintenance
            const daysSinceMaint = minutesBetween(lastMaintenanceDate, slot.shiftStart) / 60 / 24;
            if (daysSinceMaint >= maintenanceIntervalDays && slot.shiftStart < now) {
                const maintDuration = rng.nextFloat(120, 240);
                const maintStart = new Date(slot.shiftStart);
                const maintEnd = addMinutes(maintStart, maintDuration);

                const dtId = `DT-${String(dtNum).padStart(6, "0")}`;
                dtNum++;
                const dtEvent = {
                    id: dtId,
                    siteId,
                    workCenterId: wcId,
                    startedAt: toUnix(maintStart),
                    endedAt: toUnix(maintEnd),
                    durationMinutes: Math.round(maintDuration),
                    reasonCode: "PLANNED_MAINTENANCE",
                    reasonDescription: "Scheduled preventive maintenance",
                    productionOrderId: null,
                    operationId: null,
                };
                downtimeEvents.push(dtEvent);
                downtimeByWorkCenter.get(wcId)?.push(dtEvent);

                timeline.entries.push({ type: "downtime", start: maintStart, end: maintEnd, entityId: dtId });
                shiftDowntimeMins += maintDuration;
                lastMaintenanceDate = maintStart;

                if (maintStart < now) {
                    const evtStart = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(maintStart), eventType: "downtime_started", productionOrderId: null, operationId: null, workCenterId: wcId, quantity: null, uom: null, reasonCode: "PLANNED_MAINTENANCE", message: "Planned maintenance started" };
                    const evtEnd = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(maintEnd), eventType: "downtime_ended", productionOrderId: null, operationId: null, workCenterId: wcId, quantity: null, uom: null, reasonCode: "PLANNED_MAINTENANCE", message: "Planned maintenance completed" };
                    productionEvents.push(evtStart, evtEnd);
                    productionEventsByWorkCenter.get(wcId)?.push(evtStart, evtEnd);
                }
                dtSeq++;
            }

            // Random failure
            const shiftHours = shiftDurationMins / 60;
            const failProbability = shiftHours / mtbfHours;
            if (rng.bool(failProbability) && slot.shiftStart < now) {
                const failOffset = rng.nextFloat(0, shiftDurationMins * 0.7);
                const failStart = addMinutes(slot.shiftStart, failOffset);
                const failDuration = mttrMinutes * rng.nextFloat(0.5, 1.5);
                const failEnd = addMinutes(failStart, failDuration);

                const dtId = `DT-${String(dtNum).padStart(6, "0")}`;
                dtNum++;
                const dtEvent = {
                    id: dtId,
                    siteId,
                    workCenterId: wcId,
                    startedAt: toUnix(failStart),
                    endedAt: toUnix(failEnd),
                    durationMinutes: Math.round(failDuration),
                    reasonCode: "EQUIPMENT_FAILURE",
                    reasonDescription: "Unplanned equipment breakdown",
                    productionOrderId: null,
                    operationId: null,
                };
                downtimeEvents.push(dtEvent);
                downtimeByWorkCenter.get(wcId)?.push(dtEvent);

                timeline.entries.push({ type: "downtime", start: failStart, end: failEnd, entityId: dtId });
                shiftDowntimeMins += failDuration;

                if (failStart < now) {
                    const evtStart = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(failStart), eventType: "downtime_started", productionOrderId: null, operationId: null, workCenterId: wcId, quantity: null, uom: null, reasonCode: "EQUIPMENT_FAILURE", message: "Equipment failure detected" };
                    productionEvents.push(evtStart);
                    productionEventsByWorkCenter.get(wcId)?.push(evtStart);

                    if (failEnd < now) {
                        const evtEnd = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(failEnd), eventType: "downtime_ended", productionOrderId: null, operationId: null, workCenterId: wcId, quantity: null, uom: null, reasonCode: "EQUIPMENT_FAILURE", message: "Equipment failure resolved" };
                        productionEvents.push(evtEnd);
                        productionEventsByWorkCenter.get(wcId)?.push(evtEnd);
                    }
                }
            }

            // Operations scheduled in this shift window
            const slotOps = cellOpIds
                .map((id) => operations.get(id)!)
                .filter((op) => {
                    if (!op) return false;
                    const opStart = new Date(op.scheduledStart * 1000);
                    const opEnd = new Date(op.scheduledEnd * 1000);
                    return opEnd > slot.shiftStart && opStart < slot.shiftEnd;
                });

            for (const op of slotOps) {
                const opStart = new Date(op.scheduledStart * 1000);
                const opEnd = new Date(op.scheduledEnd * 1000);
                const actualStart = opStart < slot.shiftStart ? slot.shiftStart : opStart;
                const actualEnd = opEnd > slot.shiftEnd ? slot.shiftEnd : opEnd;
                const runMins = minutesBetween(actualStart, actualEnd);

                if (runMins > 0) {
                    timeline.entries.push({ type: "operation", start: actualStart, end: actualEnd, entityId: op.id });
                    shiftRuntimeMins += runMins;
                    shiftProduced += op.quantities.producedQuantity;
                    shiftGood += op.quantities.goodQuantity;
                    shiftScrap += op.quantities.scrapQuantity;
                    shiftUom = op.quantities.uom;

                    if (actualStart < now) {
                        if (!productionEventsByOperation.has(op.id)) {
                            productionEventsByOperation.set(op.id, []);
                        }
                        const evts = productionEventsByOperation.get(op.id)!;

                        if (evts.length === 0) {
                            if (!productionEventsByProductionOrder.has(op.productionOrderId)) {
                                productionEventsByProductionOrder.set(op.productionOrderId, []);
                            }

                            const startEvt = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(actualStart), eventType: "operation_started", productionOrderId: op.productionOrderId, operationId: op.id, workCenterId: wcId, quantity: null, uom: null, reasonCode: null, defectCode: null, lotNumber: null, message: `Operation ${op.operationCode} started` };
                            evts.push(startEvt);
                            productionEvents.push(startEvt);
                            productionEventsByWorkCenter.get(wcId)?.push(startEvt);
                            productionEventsByProductionOrder.get(op.productionOrderId)!.push(startEvt);
                        }

                        // Quantity reports every 30 minutes
                        let qCursor = addMinutes(actualStart, 30);
                        const qEnd = actualEnd < now ? actualEnd : now;
                        while (qCursor < qEnd) {
                            const qty = Math.round((op.quantities.goodQuantity / Math.max(1, runMins)) * 30);
                            const qEvt = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(qCursor), eventType: "quantity_reported", productionOrderId: op.productionOrderId, operationId: op.id, workCenterId: wcId, quantity: qty, uom: shiftUom, reasonCode: null, defectCode: null, lotNumber: op._lotNumber, message: `${qty} ${shiftUom} reported` };
                            evts.push(qEvt);
                            productionEvents.push(qEvt);
                            productionEventsByWorkCenter.get(wcId)?.push(qEvt);
                            productionEventsByProductionOrder.get(op.productionOrderId)?.push(qEvt);
                            qCursor = addMinutes(qCursor, 30);
                        }

                        // One scrap event per defect type
                        if (op._defectBreakdown?.length > 0 && actualEnd < now) {
                            for (let di = 0; di < op._defectBreakdown.length; di++) {
                                const { defectCode, quantity } = op._defectBreakdown[di];
                                const scrapTime = addMinutes(actualEnd, -(5 + di));
                                const scrapEvt = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(scrapTime), eventType: "scrap_reported", productionOrderId: op.productionOrderId, operationId: op.id, workCenterId: wcId, quantity, uom: shiftUom, reasonCode: "DEFECT", defectCode, lotNumber: op._lotNumber, message: `${quantity} ${shiftUom} scrapped (${defectCode})` };
                                evts.push(scrapEvt);
                                productionEvents.push(scrapEvt);
                                productionEventsByWorkCenter.get(wcId)?.push(scrapEvt);
                                productionEventsByProductionOrder.get(op.productionOrderId)?.push(scrapEvt);
                            }
                        }

                        // operation_completed for past ops
                        if (op.status === "completed" && actualEnd < now) {
                            const compEvt = { id: `EVT-${String(evtNum++).padStart(8, "0")}`, siteId, occurredAt: toUnix(actualEnd), eventType: "operation_completed", productionOrderId: op.productionOrderId, operationId: op.id, workCenterId: wcId, quantity: op.quantities.goodQuantity, uom: shiftUom, reasonCode: null, defectCode: null, lotNumber: op._lotNumber, message: `Operation ${op.operationCode} completed` };
                            evts.push(compEvt);
                            productionEvents.push(compEvt);
                            productionEventsByWorkCenter.get(wcId)?.push(compEvt);
                        }
                    }
                }
            }

            // OEE bucket for this shift (past shifts only)
            if (slot.shiftEnd <= now) {
                const availPct = shiftDurationMins > 0 ? Math.min(100, (shiftRuntimeMins / (shiftDurationMins - shiftDowntimeMins || 1)) * 100) : 0;
                const perfPct = shiftProduced > 0 ? Math.min(100, rng.nextFloat(80, 98)) : 0;
                const qualPct = shiftProduced > 0 ? Math.max(0, ((shiftProduced - shiftScrap) / shiftProduced) * 100) : 100;
                const oeePct = (availPct / 100) * (perfPct / 100) * (qualPct / 100) * 100;

                const bucket: OEEBucket = {
                    workCenterId: wcId,
                    shiftStart: slot.shiftStart,
                    shiftEnd: slot.shiftEnd,
                    shiftName: slot.shiftName,
                    plannedMinutes: shiftDurationMins,
                    runtimeMinutes: shiftRuntimeMins,
                    downtimeMinutes: shiftDowntimeMins,
                    producedQuantity: shiftProduced,
                    goodQuantity: shiftGood,
                    scrapQuantity: shiftScrap,
                    uom: shiftUom,
                    availabilityPercent: Math.round(availPct * 10) / 10,
                    performancePercent: Math.round(perfPct * 10) / 10,
                    qualityPercent: Math.round(qualPct * 10) / 10,
                    oeePercent: Math.round(oeePct * 10) / 10,
                };
                oeeTimeseries.push(bucket);
                oeeByWorkCenter.get(wcId)?.push(bucket);
            }
        }

        // Sort timeline
        timeline.entries.sort((a, b) => a.start.getTime() - b.start.getTime());
        cellTimelines.set(wcId, timeline);

        // Compute current WC status from timeline
        const wc = structural.workCenters.get(wcId)!;
        const nowT = now.getTime();
        const currentEntry = timeline.entries.find((e) => e.start.getTime() <= nowT && e.end.getTime() > nowT);

        if (currentEntry) {
            if (currentEntry.type === "downtime") {
                wc.status = "down";
            } else if (currentEntry.type === "operation") {
                const op = operations.get(currentEntry.entityId);
                wc.status = "running";
                wc.activeProductionOrderId = op?.productionOrderId ?? null;
                wc.activeOperationId = op?.id ?? null;
            }
        } else {
            const nextEntry = timeline.entries.find((e) => e.start.getTime() > nowT);
            wc.status = nextEntry ? "idle" : "starved";
        }

        const wcOee = oeeByWorkCenter.get(wcId) ?? [];
        wc.runtimeMinutes = wcOee.reduce((s, b) => s + b.runtimeMinutes, 0);
        wc.downtimeMinutes = wcOee.reduce((s, b) => s + b.downtimeMinutes, 0);
        wc.goodQuantity = wcOee.reduce((s, b) => s + b.goodQuantity, 0);
        wc.scrapQuantity = wcOee.reduce((s, b) => s + b.scrapQuantity, 0);
        wc.queueLength = (productionOrdersByWorkCenter.get(wcId) ?? []).filter((id) => {
            const po = productionOrders.get(id);
            return po?.status === "released" || po?.status === "in_progress";
        }).length;
        const totalPlanned = wcOee.reduce((s, b) => s + b.plannedMinutes, 0);
        wc.utilizationPercent = totalPlanned > 0 ? Math.round((wc.runtimeMinutes / totalPlanned) * 100 * 10) / 10 : 0;
    }

    // --- Dispatch List ---
    for (const wcId of structural.workCenterList) {
        const wcOpIds = operationsByWorkCenter.get(wcId) ?? [];

        const runningOps = wcOpIds
            .map((id) => operations.get(id)!)
            .filter((op) => op?.status === "in_progress")
            .slice(0, 1);

        const queuedOps = wcOpIds
            .map((id) => operations.get(id)!)
            .filter((op) => op?.status === "ready")
            .sort((a, b) => a.scheduledStart - b.scheduledStart)
            .slice(0, 2);

        let dspSeq = 1;
        for (const op of [...runningOps, ...queuedOps]) {
            if (!op) continue;
            const po = productionOrders.get(op.productionOrderId);
            const dspId = `DSP-${String(dspNum).padStart(6, "0")}`;
            dspNum++;
            dispatchItems.push({
                id: dspId,
                siteId,
                workCenterId: wcId,
                productionOrderId: op.productionOrderId,
                operationId: op.id,
                sequence: dspSeq++,
                status: op.status === "in_progress" ? "running" : "ready",
                dispatchPriority: po?.priority ?? 3,
                recommendedStart: op.scheduledStart,
                itemCode: po?.itemCode,
                remainingQuantity: op.quantities.plannedQuantity - op.quantities.producedQuantity,
                uom: op.quantities.uom,
            });
        }
    }

    // Sort events by unix timestamp (numeric)
    productionEvents.sort((a, b) => a.occurredAt - b.occurredAt);
    downtimeEvents.sort((a, b) => a.startedAt - b.startedAt);
    oeeTimeseries.sort((a, b) => a.shiftStart.getTime() - b.shiftStart.getTime());

    return {
        workCenters: structural.workCenters,
        workCenterList: structural.workCenterList,
        productionOrders,
        productionOrderList,
        operations,
        operationList,
        dispatchItems,
        productionEvents,
        downtimeEvents,
        oeeTimeseries,
        operationsByProductionOrder,
        operationsByWorkCenter,
        productionOrdersByWorkCenter,
        productionEventsByOperation,
        productionEventsByProductionOrder,
        productionEventsByWorkCenter,
        downtimeByWorkCenter,
        oeeByWorkCenter,
        cellTimelines,
    };
}
