/**
 * Phase 3 — Fill pass.
 *
 * With the timeline fixed, compute every quantity, status, and derived value:
 *   - MES: producedQty, goodQty, scrapQty, statuses, OEE, production events, work-center timelines
 *   - EAM: work-order statuses, actual start/end, completedBy
 *   - ERP: sales orders, purchase orders, invoices, payments, journal entries, fiscal periods
 *   - WMS: receipts, pick tasks, shipments, inventory positions
 *   - APS: scheduled operations, capacity buckets, demands, supplies, pegging
 *   - QMS: nonconformances, CAPAs, audits, complaints (generated independently)
 */

import type { RNG } from "../rng";
import type { GeneratorConfig } from "../config";
import type { Dataset, OEEBucket, WorkCenterTimeline } from "../types";
import type { Phase1Result, FGRoutingTemplate } from "./phase1";
import type { Phase2Result, PlacedPO, PlacedOperation, PlacedMaintenanceWO } from "./phase2";
import { workingMinutes, shiftCoverage, addDays } from "../shifts";

const toUnix = (d: Date): number => Math.floor(d.getTime() / 1000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function poStatus(_po: PlacedPO): string {
    return "completed";
}
function opStatus(_op: PlacedOperation): string {
    return "completed";
}
function woStatus(_wo: PlacedMaintenanceWO): string {
    return "completed";
}

function addDaysToDate(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function addHoursToDate(d: Date, h: number): Date {
    return new Date(d.getTime() + h * 60 * 60 * 1000);
}

const TECHNICIANS = ["J. Smith", "M. Johnson", "P. Williams", "K. Brown", "C. Davis"];

// ---------------------------------------------------------------------------
// MES quantities for one operation
// ---------------------------------------------------------------------------

function computeOpQty(
    op: PlacedOperation,
    po: PlacedPO,
    config: GeneratorConfig,
    rng: RNG,
): { producedQty: number; goodQty: number; scrapQty: number; effectiveYield: number } {
    const plannedRunMinutes = config.operationDurationMinutes - op.setupMinutes;
    const plannedQty = Math.floor((plannedRunMinutes * po.effectiveUnitsPerHour) / 60);

    // Yield: global median ± defectRate (see plan §3.1)
    const defectRate = 1 - config.yieldRate;
    const effectiveYield = Math.min(1, Math.max(0, config.yieldRate + rng.nextFloat(-defectRate, defectRate)));
    const goodQty = plannedQty;
    const scrapQty = Math.floor(plannedQty * (1 - effectiveYield));
    const producedQty = goodQty + scrapQty;

    return { producedQty, goodQty, scrapQty, effectiveYield };
}

// ---------------------------------------------------------------------------
// fillDataset
// ---------------------------------------------------------------------------

function resolveItem(itemId: string, entities: Phase1Result): any {
    return entities.erpItems.get(itemId) ?? entities.wipItems.get(itemId);
}

function buildOpInputs(fgItemId: string, opIndex: number, producedQty: number, entities: Phase1Result): any[] {
    const step = entities.routingTemplates.get(fgItemId)?.steps[opIndex];
    if (!step) return [];

    return step.inputItemIds.map((itemId) => {
        const item = resolveItem(itemId, entities);
        const requiredQty = Math.max(1, producedQty);
        return {
            itemId,
            itemCode: item?.itemNumber ?? itemId,
            itemDescription: item?.name ?? itemId,
            requiredQuantity: requiredQty,
            issuedQuantity: requiredQty,
            uom: item?.uom ?? "pcs",
        };
    });
}

function buildOpOutputs(
    fgItemId: string,
    opIndex: number,
    producedQty: number,
    plannedQty: number,
    entities: Phase1Result,
): any[] {
    const step = entities.routingTemplates.get(fgItemId)?.steps[opIndex];
    if (!step) return [];

    const item = resolveItem(step.outputItemId, entities);
    return [
        {
            itemId: step.outputItemId,
            itemCode: item?.itemNumber ?? step.outputItemId,
            itemDescription: item?.name ?? step.outputItemId,
            expectedQuantity: plannedQty,
            reportedQuantity: producedQty,
            uom: item?.uom ?? "pcs",
        },
    ];
}

export function fillDataset(
    config: GeneratorConfig,
    entities: Phase1Result,
    timeline: Phase2Result,
    rng: RNG,
): Dataset {
    const { now, siteId } = config;
    const { placedPOs, allPlacedWOs } = timeline;

    const windowStart = new Date(now);
    windowStart.setMonth(windowStart.getMonth() - config.monthsBack);
    const windowEnd = new Date(now);
    windowEnd.setMonth(windowEnd.getMonth() + config.monthsForward);

    // ========================================================================
    // MES
    // ========================================================================

    const mesProductionOrders = new Map<string, any>();
    const mesProductionOrderList: string[] = [];
    const mesOperations = new Map<string, any>();
    const mesOperationList: string[] = [];
    const mesOperationsByPO = new Map<string, string[]>();
    const mesOperationsByWC = new Map<string, string[]>();
    const mesProductionOrdersByLoc = new Map<string, string[]>();
    const mesDowntimeEvents: any[] = [];
    const mesDowntimeByWC = new Map<string, any[]>();
    const mesProductionEvents: any[] = [];
    const mesProductionEventsByOp = new Map<string, any[]>();
    const mesProductionEventsByPO = new Map<string, any[]>();
    const mesProductionEventsByWC = new Map<string, any[]>();
    const mesWorkCenterTimelines = new Map<string, WorkCenterTimeline>();
    const mesDispatchItems: any[] = [];

    // Per-operation yield, stored for OEE computation
    const opYields = new Map<string, number>();

    // Build work-center timeline skeletons
    for (const wcId of entities.workCenterList) {
        mesWorkCenterTimelines.set(wcId, { workCenterId: wcId, entries: [] });
    }

    let evtNum = 1;

    for (const po of placedPOs) {
        const status = poStatus(po);
        const opIds: string[] = [];

        // All ops in same PO use the same effective UPH; take the first op's qty as the PO qty
        let poProducedQty = 0;
        let poGoodQty = 0;

        for (const op of po.operations) {
            const { producedQty, goodQty, scrapQty, effectiveYield } = computeOpQty(op, po, config, rng);
            opYields.set(op.id, effectiveYield);

            if (op === po.operations[0]) {
                poProducedQty = producedQty;
                poGoodQty = goodQty;
            }

            const opSt = opStatus(op);
            const opIndex = po.operations.indexOf(op);
            const plannedRunMinutes = config.operationDurationMinutes - op.setupMinutes;
            const actualRunMinutes = workingMinutes(op.start, op.end, config.shifts, config.workDays);
            mesOperations.set(op.id, {
                id: op.id,
                productionOrderId: po.id,
                operationCode: `${op.operationType}-${String(opIndex + 1).padStart(2, "0")}`,
                operationDescription: op.operationType,
                sequence: (opIndex + 1) * 10,
                workCenterId: op.workCenterId,
                workCenterName: op.workCenterName,
                locationId: op.locationId,
                siteId: siteId,
                status: opSt,
                scheduledStart: toUnix(op.start),
                scheduledEnd: toUnix(op.end),
                actualStart: toUnix(op.start),
                actualEnd: toUnix(op.end),
                progressPercent: 100,
                plannedSetupTimeMinutes: op.setupMinutes,
                plannedRunTimeMinutes: plannedRunMinutes,
                actualSetupTimeMinutes: op.setupMinutes,
                actualRunTimeMinutes: actualRunMinutes,
                quantities: {
                    plannedQuantity: Math.floor((plannedRunMinutes * po.effectiveUnitsPerHour) / 60),
                    producedQuantity: producedQty,
                    goodQuantity: goodQty,
                    scrapQuantity: scrapQty,
                    uom: "pcs",
                },
                inputs: buildOpInputs(po.itemId, opIndex, producedQty, entities),
                outputs: buildOpOutputs(
                    po.itemId,
                    opIndex,
                    producedQty,
                    Math.floor((plannedRunMinutes * po.effectiveUnitsPerHour) / 60),
                    entities,
                ),
            });
            mesOperationList.push(op.id);
            opIds.push(op.id);

            // Work-center timeline entry
            const wct = mesWorkCenterTimelines.get(op.workCenterId)!;
            wct.entries.push({ type: "operation", start: op.start, end: op.end, entityId: op.id });

            // Downtime entries
            for (const dt of op.downtimes) {
                wct.entries.push({ type: "downtime", start: dt.start, end: dt.end, entityId: dt.id });
                const dtRecord = {
                    id: dt.id,
                    siteId,
                    workCenterId: op.workCenterId,
                    operationId: op.id,
                    productionOrderId: po.id,
                    reasonCode: dt.templateCode,
                    reasonDescription: dt.description,
                    startedAt: toUnix(dt.start),
                    endedAt: toUnix(dt.end),
                    durationMinutes: dt.durationMinutes,
                };
                mesDowntimeEvents.push(dtRecord);
                const wcDt = mesDowntimeByWC.get(op.workCenterId) ?? [];
                wcDt.push(dtRecord);
                mesDowntimeByWC.set(op.workCenterId, wcDt);
            }

            // Production events (start / end)
            const addEvt = (type: string, ts: Date) => {
                const evt = {
                    id: `EVT-${String(evtNum++).padStart(5, "0")}`,
                    operationId: op.id,
                    productionOrderId: po.id,
                    workCenterId: op.workCenterId,
                    eventType: type,
                    timestamp: toUnix(ts),
                    quantity: type === "op_end" ? producedQty : null,
                };
                mesProductionEvents.push(evt);
                [
                    [mesProductionEventsByOp, op.id],
                    [mesProductionEventsByPO, po.id],
                    [mesProductionEventsByWC, op.workCenterId],
                ].forEach(([map, key]) => {
                    const arr = (map as Map<string, any[]>).get(key as string) ?? [];
                    arr.push(evt);
                    (map as Map<string, any[]>).set(key as string, arr);
                });
            };
            addEvt("op_start", op.start);
            addEvt("op_end", op.end);

            // Work-center op/WC cross-index
            const wcOps = mesOperationsByWC.get(op.workCenterId) ?? [];
            wcOps.push(op.id);
            mesOperationsByWC.set(op.workCenterId, wcOps);
        }

        mesOperationsByPO.set(po.id, opIds);

        const plannedQty = Math.floor(
            ((config.operationDurationMinutes - (po.operations[0]?.setupMinutes ?? 0)) * po.effectiveUnitsPerHour) / 60,
        );
        mesProductionOrders.set(po.id, {
            id: po.id,
            orderNumber: `MO-${po.id}`,
            siteId,
            locationId: po.locationId,
            locationName: po.locationName,
            itemCode: po.itemId,
            itemDescription: po.itemId,
            status,
            priority: 1,
            erpSalesOrderId: null,
            apsPlanId: null,
            timing: {
                scheduledStart: toUnix(po.start),
                scheduledEnd: toUnix(po.end),
                actualStart: toUnix(po.start),
                actualEnd: toUnix(po.end),
            },
            quantities: {
                plannedQuantity: plannedQty,
                producedQuantity: poProducedQty,
                goodQuantity: poGoodQty,
                scrapQuantity: poProducedQty - poGoodQty,
                uom: "pcs",
            },
        });
        mesProductionOrderList.push(po.id);

        const locPOs = mesProductionOrdersByLoc.get(po.locationId) ?? [];
        locPOs.push(po.id);
        mesProductionOrdersByLoc.set(po.locationId, locPOs);
    }

    // Sort work-center timeline entries by start
    for (const [, wct] of mesWorkCenterTimelines) {
        wct.entries.sort((a, b) => a.start.getTime() - b.start.getTime());
    }

    // ---- OEE timeseries (one bucket per shift × work center) ----
    const oeeTimeseries: OEEBucket[] = [];
    const oeeByWorkCenter = new Map<string, OEEBucket[]>();

    // Build a lookup: operationId → PlacedPO (for effectiveUnitsPerHour)
    const opToPO = new Map<string, PlacedPO>();
    for (const po of placedPOs) {
        for (const op of po.operations) opToPO.set(op.id, po);
    }

    for (const wcId of entities.workCenterList) {
        // All operations for this work center
        const wcOpIds = mesOperationsByWC.get(wcId) ?? [];
        const wcOps = wcOpIds
            .map((id) => {
                const op = mesOperations.get(id);
                return op;
            })
            .filter(Boolean);

        const wcBuckets: OEEBucket[] = [];

        // Enumerate every shift slot that overlaps [windowStart, now]
        const coverageSlots = shiftCoverage(windowStart, windowEnd, config.shifts, config.workDays);

        for (const slot of coverageSlots) {
            // Operations active during this shift slot
            const activeOps = wcOps.filter((op: any) => {
                const opStart = new Date(op.scheduledStart * 1000);
                const opEnd = new Date(op.scheduledEnd * 1000);
                return opStart < slot.overlapEnd && opEnd > slot.overlapStart;
            });
            if (activeOps.length === 0) continue;

            const plannedMins = (slot.overlapEnd.getTime() - slot.overlapStart.getTime()) / 60_000;
            let downtimeMins = 0;
            let producedQty = 0;
            let goodQty = 0;

            for (const op of activeOps) {
                const opStart = new Date(op.scheduledStart * 1000);
                const opEnd = new Date(op.scheduledEnd * 1000);
                const clampStart = new Date(Math.max(opStart.getTime(), slot.overlapStart.getTime()));
                const clampEnd = new Date(Math.min(opEnd.getTime(), slot.overlapEnd.getTime()));
                if (clampEnd <= clampStart) continue;

                // Downtime events within the clamped window
                const placed = placedPOs.flatMap((p) => p.operations).find((o) => o.id === op.id);
                if (placed) {
                    for (const dt of placed.downtimes) {
                        const dStart = new Date(Math.max(dt.start.getTime(), clampStart.getTime()));
                        const dEnd = new Date(Math.min(dt.end.getTime(), clampEnd.getTime()));
                        if (dEnd > dStart) downtimeMins += (dEnd.getTime() - dStart.getTime()) / 60_000;
                    }
                }

                const netMins = Math.max(0, (clampEnd.getTime() - clampStart.getTime()) / 60_000);
                const po = opToPO.get(op.id)!;
                const qty = Math.floor((netMins * po.effectiveUnitsPerHour) / 60);
                const yld = opYields.get(op.id) ?? config.yieldRate;
                producedQty += qty;
                goodQty += Math.floor(qty * yld);
            }

            const runtimeMins = plannedMins - downtimeMins;
            const availability = plannedMins > 0 ? runtimeMins / plannedMins : 0;
            const quality = producedQty > 0 ? goodQty / producedQty : 1;
            const scrapQty = producedQty - goodQty;

            const bucket: OEEBucket = {
                workCenterId: wcId,
                shiftStart: toUnix(slot.start),
                shiftEnd: toUnix(slot.end),
                shiftName: slot.name,
                plannedMinutes: plannedMins,
                runtimeMinutes: runtimeMins,
                downtimeMinutes: downtimeMins,
                producedQuantity: producedQty,
                goodQuantity: goodQty,
                scrapQuantity: scrapQty,
                uom: "pcs",
                availabilityPercent: availability * 100,
                performancePercent: 100,
                qualityPercent: quality * 100,
                oeePercent: availability * quality * 100,
            };
            wcBuckets.push(bucket);
            oeeTimeseries.push(bucket);
        }

        oeeByWorkCenter.set(wcId, wcBuckets);
    }

    // ---- MES Routings (structural material flow graph per finished good) ----
    const mesRoutings = new Map<string, any>();
    const mesRoutingList: string[] = [];

    for (const [fgItemId, tmpl] of entities.routingTemplates) {
        const fgItem = entities.erpItems.get(fgItemId);
        const steps = tmpl.steps.map((step) => {
            const inputs = step.inputItemIds.map((itemId) => {
                const item = resolveItem(itemId, entities);
                return {
                    itemId,
                    itemCode: item?.itemNumber ?? itemId,
                    itemDescription: item?.name ?? itemId,
                    itemType: item?.itemType ?? "raw_material",
                    uom: item?.uom ?? "pcs",
                };
            });
            const outItem = resolveItem(step.outputItemId, entities);
            return {
                sequence: step.sequence,
                operationCode: step.operationCode,
                operationType: step.operationType,
                workCenterOperationType: step.workCenterOperationType,
                workCenterId: step.workCenterId,
                workCenterName: step.workCenterName,
                inputs,
                output: {
                    itemId: step.outputItemId,
                    itemCode: outItem?.itemNumber ?? step.outputItemId,
                    itemDescription: outItem?.name ?? step.outputItemId,
                    itemType: outItem?.itemType ?? "wip",
                    uom: outItem?.uom ?? "pcs",
                },
            };
        });
        const routing = {
            itemId: fgItemId,
            itemCode: fgItem?.itemNumber ?? fgItemId,
            itemDescription: fgItem?.name ?? fgItemId,
            steps,
        };
        mesRoutings.set(fgItemId, routing);
        mesRoutingList.push(fgItemId);
    }

    // Update work-center summary stats
    for (const [wcId, wc] of entities.workCenters) {
        const buckets = oeeByWorkCenter.get(wcId) ?? [];
        wc.runtimeMinutes = buckets.reduce((s, b) => s + b.runtimeMinutes, 0);
        wc.downtimeMinutes = buckets.reduce((s, b) => s + b.downtimeMinutes, 0);
        wc.goodQuantity = buckets.reduce((s, b) => s + b.goodQuantity, 0);
        wc.scrapQuantity = buckets.reduce((s, b) => s + b.scrapQuantity, 0);
        if (wc.runtimeMinutes + wc.downtimeMinutes > 0) {
            wc.utilizationPercent = Math.round((100 * wc.runtimeMinutes) / (wc.runtimeMinutes + wc.downtimeMinutes));
        }
    }

    // ========================================================================
    // EAM — work orders (placed by Phase 2)
    // ========================================================================

    const eamWorkOrders = new Map<string, any>();
    const eamWorkOrderList: string[] = [];
    const eamWorkOrderOps = new Map<string, any[]>();
    const eamWorkOrdersByAsset = new Map<string, string[]>();
    const eamWorkOrdersByLoc = new Map<string, string[]>();
    const eamAssetsByLoc = new Map<string, string[]>();
    const eamAssetHistory = new Map<string, any[]>();
    const eamMaintenanceSchedules = new Map<string, any[]>();

    // assetsByLocation derived from assetsByWorkCenter + workCenter → location mapping
    for (const [wcId, assetIds] of entities.assetsByWorkCenter) {
        // Find location that contains this work center
        for (const loc of config.site.locations) {
            if (loc.workCenters.some((wc) => wc.hash === wcId)) {
                for (const assetId of assetIds) {
                    const arr = eamAssetsByLoc.get(loc.hash) ?? [];
                    arr.push(assetId);
                    eamAssetsByLoc.set(loc.hash, arr);
                }
            }
        }
    }

    for (const wo of allPlacedWOs) {
        const status = woStatus(wo);
        const record: any = {
            id: wo.id,
            workOrderNumber: wo.id,
            description: `Predictive Maintenance – ${wo.assetName}`,
            workType: "predictive",
            priority: "medium",
            assetId: wo.assetId,
            locationId: wo.locationId,
            maintenancePlanId: wo.planId,
            mesProductionOrderId: null,
            status,
            scheduledStart: toUnix(wo.start),
            scheduledEnd: toUnix(wo.end),
            actualStart: toUnix(wo.start),
            actualEnd: toUnix(wo.end),
            completedBy: rng.pick(TECHNICIANS),
            estimatedDurationHours: config.pmDurationHours,
        };
        eamWorkOrders.set(wo.id, record);
        eamWorkOrderList.push(wo.id);
        eamWorkOrderOps.set(wo.id, []); // no sub-operations in this model

        const byAsset = eamWorkOrdersByAsset.get(wo.assetId) ?? [];
        byAsset.push(wo.id);
        eamWorkOrdersByAsset.set(wo.assetId, byAsset);

        const byLoc = eamWorkOrdersByLoc.get(wo.locationId) ?? [];
        byLoc.push(wo.id);
        eamWorkOrdersByLoc.set(wo.locationId, byLoc);

        // Asset history entry
        const hist = eamAssetHistory.get(wo.assetId) ?? [];
        hist.push({ type: "work_order", workOrderId: wo.id, date: toUnix(wo.start), status });
        eamAssetHistory.set(wo.assetId, hist);
    }

    // Maintenance schedules (future PM occurrences)
    for (const [planId, plan] of entities.eamMaintenancePlans) {
        const schedules: any[] = [];
        let d = new Date(now);
        for (let i = 0; i < 3; i++) {
            d = addDays(d, (plan as any).frequencyDays);
            schedules.push({
                planId,
                scheduledDate: toUnix(d),
                status: "planned",
            });
        }
        eamMaintenanceSchedules.set(planId, schedules);
    }

    // ========================================================================
    // ERP — transactional data
    // ========================================================================

    const erpSalesOrders = new Map<string, any>();
    const erpSalesOrderList: any[] = [];
    const erpPurchaseOrders = new Map<string, any>();
    const erpPurchaseOrderList: any[] = [];
    const erpInvoices = new Map<string, any>();
    const erpInvoiceList: string[] = [];
    const erpPayments = new Map<string, any>();
    const erpPaymentList: string[] = [];
    const erpJournalEntries = new Map<string, any>();
    const erpJournalEntryList: string[] = [];

    const customerIds = entities.erpCustomerList;
    const supplierIds = entities.erpSupplierList;
    const companyId = "COMP-001";

    // WMS transactional arrays — declared here so the ERP loop can populate pick/shipment
    const wmsReceipts: any[] = [];
    const wmsPutawayTasks: any[] = [];
    const wmsPickTasks: any[] = [];
    const wmsShipments: any[] = [];
    const wmsMovements: any[] = [];
    const wmsInventoryByItem = new Map<string, any[]>();
    let receiptNum = 1;
    let putawayNum = 1;
    let pickNum = 1;
    let shipNum = 1;
    let movNum = 1;

    const mkMov = (fields: Record<string, any>) => {
        const mv = { id: `MOV-${String(movNum++).padStart(6, "0")}`, ...fields };
        wmsMovements.push(mv);
        return mv;
    };

    // Zone IDs derived from site graph (Reception, Storage, Supply, Delivery)
    const { reception, storage, delivery } = entities.wmsZoneIds;
    const receptionBin = `${reception}-BIN-01`;
    const storageBin = `${storage}-BIN-01`;
    const deliveryBin = `${delivery}-BIN-01`;

    let soNum = 1;
    let poNum = 1;
    let invNum = 1;
    let payNum = 1;
    let jeNum = 1;

    function newSoId() {
        return `SO-${String(soNum++).padStart(4, "0")}`;
    }
    function newPoId() {
        return `PO-ERP-${String(poNum++).padStart(4, "0")}`;
    }
    function newInvId() {
        return `INV-${String(invNum++).padStart(4, "0")}`;
    }
    function newPayId() {
        return `PAY-${String(payNum++).padStart(4, "0")}`;
    }
    function newJeId() {
        return `JE-${String(jeNum++).padStart(4, "0")}`;
    }

    for (const po of placedPOs) {
        const item = entities.erpItems.get(po.itemId);
        const unitPrice = item?.standardCost ?? 500;
        const qty = (mesProductionOrders.get(po.id) as any)?.quantities?.producedQuantity ?? 0;
        const lineAmount = qty * unitPrice;

        // ---- Sales Order (placed before production starts; delivery after production ends) ----
        const customer = rng.pick(customerIds);
        const custRec = entities.erpCustomers.get(customer)!;
        const mesPO = mesProductionOrders.get(po.id) as any;
        const earliestAllocation = new Date(((mesPO?.timing?.scheduledStart ?? toUnix(po.start)) - 86400) * 1000);
        const orderDate = addDaysToDate(earliestAllocation, -rng.nextInt(2, 3));
        const delivDate = addDaysToDate(po.end, rng.nextInt(1, 5));

        // Pick and ship happen on the delivery date
        const pickDate = delivDate;
        const shipDate = delivDate;
        const soStatus = "shipped";
        const soId = newSoId();

        if (mesPO) mesPO.erpSalesOrderId = soId;

        const soObj = {
            id: soId,
            companyId,
            siteId: config.siteId,
            orderNumber: soId,
            customerId: customer,
            orderDate: toUnix(orderDate),
            requestedDeliveryDate: toUnix(delivDate),
            status: soStatus,
            currency: "USD",
            lines: [{ lineNumber: 1, itemId: po.itemId, quantity: qty, unitPrice, lineAmount }],
            totalAmount: lineAmount,
        };
        erpSalesOrders.set(soId, soObj);
        erpSalesOrderList.push(soObj);

        // ---- Pick task + shipment (anchored to SO.orderDate) ----
        if (qty > 0) {
            const pickId = `PICK-${String(pickNum++).padStart(4, "0")}`;
            const shipId = `SHIP-${String(shipNum++).padStart(4, "0")}`;

            wmsPickTasks.push({
                id: pickId,
                warehouseId: storage,
                sourceLocationId: storageBin,
                itemId: po.itemId,
                quantity: qty,
                uom: "pcs",
                createdAt: toUnix(addDaysToDate(pickDate, -1)),
                pickedDate: toUnix(pickDate),
                status: "completed",
                salesOrderId: soId,
            });
            wmsShipments.push({
                id: shipId,
                warehouseId: delivery,
                itemId: po.itemId,
                quantity: qty,
                shippedDate: toUnix(shipDate),
                status: "shipped",
                salesOrderId: soId,
            });

            const pickFields = {
                occurredAt: toUnix(pickDate),
                movementType: "pick",
                itemId: po.itemId,
                uom: "pcs",
                fromLocationId: storageBin,
                toLocationId: deliveryBin,
                sourceDocumentType: "pick_task",
                sourceDocumentId: pickId,
                productionOrderId: po.id,
                operationId: null,
            };
            // Pick: debit Storage, credit Delivery
            mkMov({ warehouseId: storage, locationId: storageBin, quantity: -qty, ...pickFields });
            mkMov({ warehouseId: delivery, locationId: deliveryBin, quantity: +qty, ...pickFields });
            // Shipment: FG leaves Delivery zone
            mkMov({
                warehouseId: delivery,
                locationId: deliveryBin,
                occurredAt: toUnix(shipDate),
                movementType: "shipment",
                itemId: po.itemId,
                quantity: -qty,
                uom: "pcs",
                fromLocationId: deliveryBin,
                toLocationId: null,
                sourceDocumentType: "shipment",
                sourceDocumentId: shipId,
                productionOrderId: po.id,
                operationId: null,
            });
        }

        // ---- AR Invoice ----
        {
            const invDate = addDaysToDate(shipDate, rng.nextInt(0, 2));
            const terms = (custRec as any).paymentTermsDays ?? 30;
            const dueDate = addDaysToDate(invDate, terms);
            const invId = newInvId();

            erpInvoices.set(invId, {
                id: invId,
                companyId,
                invoiceNumber: invId,
                type: "ar",
                customerId: customer,
                salesOrderId: soId,
                invoiceDate: toUnix(invDate),
                dueDate: toUnix(dueDate),
                amount: lineAmount,
                currency: "USD",
                status: "paid",
            });
            erpInvoiceList.push(invId);

            const payDate = addDaysToDate(dueDate, -rng.nextInt(0, 5));
            const payId = newPayId();
            erpPayments.set(payId, {
                id: payId,
                companyId,
                paymentNumber: payId,
                type: "receipt",
                invoiceId: invId,
                customerId: customer,
                paymentDate: toUnix(payDate),
                amount: lineAmount,
                currency: "USD",
                status: "posted",
            });
            erpPaymentList.push(payId);

            const jeDebit = newJeId();
            const jeCredit = newJeId();
            erpJournalEntries.set(jeDebit, {
                id: jeDebit,
                companyId,
                postingDate: toUnix(payDate),
                accountId: "GL-1000",
                amount: lineAmount,
                type: "debit",
                reference: payId,
            });
            erpJournalEntries.set(jeCredit, {
                id: jeCredit,
                companyId,
                postingDate: toUnix(payDate),
                accountId: "GL-1100",
                amount: -lineAmount,
                type: "credit",
                reference: payId,
            });
            erpJournalEntryList.push(jeDebit, jeCredit);
        }
    }

    // ---- Fiscal periods ----
    const erpFiscalPeriods: any[] = [];
    {
        const start = new Date(windowStart);
        start.setDate(1);
        start.setMonth(start.getMonth() - 1);
        const end = new Date(now);
        end.setMonth(end.getMonth() + config.monthsForward + 1);

        let d = new Date(start);
        while (d < end) {
            const periodEnd = new Date(d);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            const status = periodEnd <= now ? "closed" : d <= now ? "open" : "planned";
            erpFiscalPeriods.push({
                id: `FP-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                companyId,
                year: d.getFullYear(),
                period: d.getMonth() + 1,
                startDate: toUnix(d),
                endDate: toUnix(periodEnd),
                status,
            });
            d = periodEnd;
        }
    }

    // ========================================================================
    // WMS — receipts, putaway tasks, and inventory movements
    // (pick tasks and shipments are generated in the ERP loop above, anchored to SO.orderDate)
    // ========================================================================

    // ---- RM stock simulation: reorder-point driven per material ----
    // Each RM starts at a random initial stock (5–10 days of production worth).
    // Whenever projected stock after a consumption event would fall below the 5-day minimum,
    // a purchase order + receipt arrives just before that event, restoring stock to 10 days.
    // This decouples shipment timing across materials, making the timeline organic.

    const RM_MIN_DAYS = 5;
    const RM_MAX_DAYS = 10;
    const windowDays = Math.max(1, (windowEnd.getTime() - windowStart.getTime()) / (24 * 60 * 60 * 1000));

    // Build per-RM consumption schedule sorted chronologically
    const sortedPOs = [...placedPOs].sort((a, b) => a.start.getTime() - b.start.getTime());

    const rmConsumptionSchedule = new Map<string, Array<{ date: Date; qty: number }>>();
    for (const po of sortedPOs) {
        const mePo = mesProductionOrders.get(po.id) as any;
        const poQty = Math.max(
            (mePo?.quantities?.producedQuantity ?? 0) as number,
            (mePo?.quantities?.plannedQuantity ?? 0) as number,
        );
        if (poQty === 0) continue;

        const routing = entities.routingTemplates.get(po.itemId);
        const rmIds: string[] = routing
            ? [
                  ...new Set(
                      routing.steps.flatMap((s: any) => s.inputItemIds.filter((id: string) => id.startsWith("RM-"))),
                  ),
              ]
            : ["RM-STEEL-BAR"];

        for (const rmId of rmIds) {
            const list = rmConsumptionSchedule.get(rmId) ?? [];
            list.push({ date: po.start, qty: poQty });
            rmConsumptionSchedule.set(rmId, list);
        }
    }

    for (const [rmId, consumptions] of rmConsumptionSchedule) {
        const totalConsumed = consumptions.reduce((s, e) => s + e.qty, 0);
        const dailyRate = totalConsumed / windowDays;

        // Each material starts at a different random stock level, spreading reorder events
        const initialStockDays = rng.nextFloat(RM_MIN_DAYS, RM_MAX_DAYS);
        let currentStock = initialStockDays * dailyRate;

        const rmItem = entities.erpItems.get(rmId);
        const rmUnitCost = (rmItem as any)?.standardCost ?? 50;

        for (const evt of consumptions) {
            // Reorder before this consumption if stock would drop below the minimum
            if (currentStock - evt.qty < RM_MIN_DAYS * dailyRate) {
                // Vary the restock target (8–12 days) so materials don't re-synchronize after each order
                const targetDays = rng.nextFloat(RM_MAX_DAYS - 2, RM_MAX_DAYS + 2);
                const reorderQty = Math.ceil(targetDays * dailyRate - currentStock + evt.qty);
                if (reorderQty > 0) {
                    const supplier = rng.pick(supplierIds);
                    const suppRec = entities.erpSuppliers.get(supplier)!;
                    const leadTime = (suppRec as any).leadTimeDays ?? 7;

                    const rcvDate = addDaysToDate(evt.date, -rng.nextInt(0, 2));
                    const poOrderDate = addDaysToDate(rcvDate, -Math.round((leadTime + rng.nextInt(1, 3)) / 2));
                    const erpPoId = newPoId();
                    const lineAmount = reorderQty * rmUnitCost;

                    const rmPoObj = {
                        id: erpPoId,
                        companyId,
                        orderNumber: erpPoId,
                        supplierId: supplier,
                        orderDate: toUnix(poOrderDate),
                        receivedAt: toUnix(rcvDate),
                        status: "received",
                        currency: "USD",
                        lines: [
                            {
                                lineNumber: 1,
                                itemId: rmId,
                                orderedQuantity: reorderQty,
                                expectedReceiptDate: toUnix(rcvDate),
                                unitPrice: rmUnitCost,
                                lineAmount,
                            },
                        ],
                        totalAmount: lineAmount,
                    };
                    erpPurchaseOrders.set(erpPoId, rmPoObj);
                    erpPurchaseOrderList.push(rmPoObj);

                    // AP Invoice
                    const apInvDate = addDaysToDate(rcvDate, rng.nextInt(1, 3));
                    const apTerms = (suppRec as any).paymentTermsDays ?? 30;
                    const apDue = addDaysToDate(apInvDate, apTerms);
                    const apInvId = newInvId();
                    erpInvoices.set(apInvId, {
                        id: apInvId,
                        companyId,
                        invoiceNumber: apInvId,
                        type: "ap",
                        supplierId: supplier,
                        purchaseOrderId: erpPoId,
                        invoiceDate: toUnix(apInvDate),
                        dueDate: toUnix(apDue),
                        amount: lineAmount,
                        currency: "USD",
                        status: "paid",
                    });
                    erpInvoiceList.push(apInvId);

                    // WMS receipt + putaway
                    const lineRcptId = `RCP-${String(receiptNum++).padStart(4, "0")}`;
                    const putawayId = `PUT-${String(putawayNum++).padStart(4, "0")}`;
                    const putawayDate = addHoursToDate(rcvDate, 4);

                    wmsReceipts.push({
                        id: lineRcptId,
                        warehouseId: reception,
                        receiptNumber: lineRcptId,
                        status: "completed",
                        receivedAt: toUnix(rcvDate),
                        dockLocationId: receptionBin,
                        erpPurchaseOrderId: erpPoId,
                        lineCount: 1,
                        lines: [{ lineNumber: 1, itemId: rmId, quantity: reorderQty, uom: "pcs" }],
                    });
                    wmsPutawayTasks.push({
                        id: putawayId,
                        warehouseId: storage,
                        receiptId: lineRcptId,
                        itemId: rmId,
                        quantity: reorderQty,
                        uom: "pcs",
                        sourceLocationId: receptionBin,
                        destinationLocationId: storageBin,
                        createdAt: toUnix(rcvDate),
                        putawayDate: toUnix(putawayDate),
                        status: "completed",
                    });

                    // Receipt: RM arrives at Reception
                    mkMov({
                        warehouseId: reception,
                        locationId: receptionBin,
                        occurredAt: toUnix(rcvDate),
                        movementType: "receipt",
                        itemId: rmId,
                        quantity: reorderQty,
                        uom: "pcs",
                        fromLocationId: null,
                        toLocationId: receptionBin,
                        sourceDocumentType: "receipt",
                        sourceDocumentId: lineRcptId,
                        productionOrderId: null,
                        operationId: null,
                    });
                    // Putaway: RM moves from Reception to Storage
                    mkMov({
                        warehouseId: storage,
                        locationId: storageBin,
                        occurredAt: toUnix(putawayDate),
                        movementType: "putaway",
                        itemId: rmId,
                        quantity: reorderQty,
                        uom: "pcs",
                        fromLocationId: receptionBin,
                        toLocationId: storageBin,
                        sourceDocumentType: "putaway_task",
                        sourceDocumentId: putawayId,
                        productionOrderId: null,
                        operationId: null,
                    });
                    // Debit Reception (stock leaves)
                    mkMov({
                        warehouseId: reception,
                        locationId: receptionBin,
                        occurredAt: toUnix(putawayDate),
                        movementType: "putaway",
                        itemId: rmId,
                        quantity: -reorderQty,
                        uom: "pcs",
                        fromLocationId: receptionBin,
                        toLocationId: storageBin,
                        sourceDocumentType: "putaway_task",
                        sourceDocumentId: putawayId,
                        productionOrderId: null,
                        operationId: null,
                    });

                    currentStock += reorderQty;
                }
            }
            currentStock -= evt.qty;
        }
    }

    for (const po of placedPOs) {
        const mePo = mesProductionOrders.get(po.id) as any;
        const qty = mePo?.quantities?.producedQuantity ?? 0;

        // FG production movement at PO end — FG lands in Storage
        if (qty > 0) {
            mkMov({
                warehouseId: storage,
                locationId: storageBin,
                occurredAt: toUnix(po.end),
                movementType: "production",
                itemId: po.itemId,
                quantity: qty,
                uom: "pcs",
                fromLocationId: null,
                toLocationId: storageBin,
                sourceDocumentType: null,
                sourceDocumentId: null,
                productionOrderId: po.id,
                operationId: null,
            });
        }
    }

    // ---- Issue + production movements from MES operations (WIP only) ----
    for (const op of mesOperations.values() as IterableIterator<any>) {
        // Issue movements: RM/WIP consumed at operation start (drawn from Storage).
        // Skip FG items — QC is a passthrough; the FG stays in Storage.
        for (const input of (op.inputs ?? []) as any[]) {
            if ((input.issuedQuantity ?? 0) === 0) continue;
            if (!input.itemId.startsWith("RM-") && !input.itemId.startsWith("WIP-")) continue;
            mkMov({
                warehouseId: storage,
                locationId: storageBin,
                occurredAt: op.actualStart,
                movementType: "issue",
                itemId: input.itemId,
                quantity: -input.issuedQuantity,
                uom: input.uom ?? "pcs",
                fromLocationId: storageBin,
                toLocationId: null,
                sourceDocumentType: null,
                sourceDocumentId: null,
                productionOrderId: op.productionOrderId,
                operationId: op.id,
            });
        }

        // Production movements: WIP produced at operation end — lands in Storage.
        // FG production movements are emitted in the PO loop above (consistent qty with shipment).
        for (const output of (op.outputs ?? []) as any[]) {
            if ((output.reportedQuantity ?? 0) === 0) continue;
            if (!output.itemId.startsWith("WIP-")) continue; // FG handled by PO loop
            mkMov({
                warehouseId: storage,
                locationId: storageBin,
                occurredAt: op.actualEnd,
                movementType: "production",
                itemId: output.itemId,
                quantity: output.reportedQuantity,
                uom: output.uom ?? "pcs",
                fromLocationId: null,
                toLocationId: storageBin,
                sourceDocumentType: null,
                sourceDocumentId: null,
                productionOrderId: op.productionOrderId,
                operationId: op.id,
            });
        }
    }

    // ---- Inventory positions derived by projecting all movements ----
    const nowTs = toUnix(now);
    const balances = new Map<
        string,
        { itemId: string; warehouseId: string; locationId: string; qty: number; uom: string }
    >();
    for (const mv of wmsMovements) {
        const key = `${mv.itemId}|${mv.locationId}`;
        if (!balances.has(key)) {
            balances.set(key, {
                itemId: mv.itemId,
                warehouseId: mv.warehouseId,
                locationId: mv.locationId,
                qty: 0,
                uom: mv.uom,
            });
        }
        balances.get(key)!.qty += mv.quantity;
    }

    const wmsInventoryPositions: any[] = [];
    const wmsInventorySummary: any[] = [];
    const summaryByItem = new Map<string, number>();

    for (const { itemId, warehouseId, locationId, qty, uom } of balances.values()) {
        if (qty <= 0) continue;
        const pos = { itemId, warehouseId, locationId, quantityOnHand: qty, uom };
        wmsInventoryPositions.push(pos);
        const list = wmsInventoryByItem.get(itemId) ?? [];
        list.push(pos);
        wmsInventoryByItem.set(itemId, list);
        summaryByItem.set(itemId, (summaryByItem.get(itemId) ?? 0) + qty);
    }
    for (const [itemId, totalQty] of summaryByItem) {
        wmsInventorySummary.push({ itemId, totalQuantityOnHand: totalQty, uom: "pcs" });
    }

    // ========================================================================
    // WMS — stock allocations
    // ========================================================================
    // Generated after inventory positions are settled.
    // RM → planned/in-progress POs (FIFO by PO start date)
    // FG → open/in-progress SOs  (FIFO by SO order date)

    const wmsStockAllocations: any[] = [];
    let allocNum = 1;

    // RM allocations — all POs across the window
    // allocatedAt ≈ day before PO start (when RM was putaway),
    // clearedAt = when production started (RM was issued)
    const allMesPOs = ([...mesProductionOrders.values()] as any[]).sort(
        (a, b) => (a.timing?.scheduledStart ?? 0) - (b.timing?.scheduledStart ?? 0),
    );

    for (const mePo of allMesPOs) {
        const routing = entities.routingTemplates.get(mePo.itemCode);
        const allRmIds = routing
            ? [
                  ...new Set(
                      routing.steps.flatMap((s: any) => s.inputItemIds.filter((id: string) => id.startsWith("RM-"))),
                  ),
              ]
            : [];
        const requiredQty = mePo.quantities?.plannedQuantity ?? 0;
        if (requiredQty === 0 || allRmIds.length === 0) continue;

        for (const rmItemId of allRmIds) {
            const allocQty = requiredQty;
            const allocatedAt = Number(mePo.timing?.scheduledStart ?? nowTs) - 86400;
            const clearedAt = Number(mePo.timing?.actualStart ?? mePo.timing?.scheduledStart ?? nowTs);

            wmsStockAllocations.push({
                id: `ALLOC-${String(allocNum++).padStart(5, "0")}`,
                warehouseId: storage,
                locationId: storageBin,
                itemId: rmItemId,
                quantityAllocated: allocQty,
                quantityRequired: requiredQty,
                uom: entities.erpItems.get(rmItemId)?.uom ?? "pcs",
                demandType: "production_order",
                productionOrderId: mePo.id,
                erpSalesOrderId: mePo.erpSalesOrderId ?? null,
                status: allocQty >= requiredQty ? "allocated" : "partial",
                allocatedAt,
                clearedAt,
            });
        }
    }

    // FG allocations — FIFO by SO requested delivery date
    // allocatedAt = when production completed (FG lands in stock)
    // clearedAt   = SO.requestedDeliveryDate (when goods are picked for delivery)
    const mesPOByEsoId = new Map<string, any>();
    for (const [, mpo] of mesProductionOrders) {
        if ((mpo as any).erpSalesOrderId) mesPOByEsoId.set((mpo as any).erpSalesOrderId, mpo);
    }

    // FG allocations — all SOs across the window
    // allocatedAt = production end (or scheduledEnd), clearedAt = requestedDeliveryDate
    const allSOs = ([...erpSalesOrders.values()] as any[]).sort(
        (a, b) => a.requestedDeliveryDate - b.requestedDeliveryDate,
    );

    for (const so of allSOs) {
        const fgItemId = so.lines[0]?.itemId;
        const requiredQty = so.lines[0]?.quantity ?? 0;
        if (!fgItemId || requiredQty === 0) continue;

        const linkedMesPo = mesPOByEsoId.get(so.id);
        const allocatedAt = linkedMesPo
            ? Number(linkedMesPo.timing?.actualEnd ?? linkedMesPo.timing?.scheduledEnd ?? so.orderDate)
            : so.orderDate;

        let allocQty: number;
        let clearedAt: number | null;

        allocQty = requiredQty;
        clearedAt = so.requestedDeliveryDate;

        wmsStockAllocations.push({
            id: `ALLOC-${String(allocNum++).padStart(5, "0")}`,
            warehouseId: delivery,
            locationId: deliveryBin,
            itemId: fgItemId,
            quantityAllocated: allocQty,
            quantityRequired: requiredQty,
            uom: entities.erpItems.get(fgItemId)?.uom ?? "pcs",
            demandType: "sales_order",
            productionOrderId: null,
            erpSalesOrderId: so.id,
            status: allocQty >= requiredQty ? "allocated" : "partial",
            allocatedAt,
            clearedAt,
        });
    }

    // ========================================================================
    // APS — mirror MES operations
    // ========================================================================

    const apsScheduledOps = new Map<string, any>();
    const apsSchedOpsByPlan = new Map<string, any[]>();
    const apsSchedOpsByResource = new Map<string, any[]>();
    const apsCapacityBuckets: any[] = [];
    const apsCapBucketsByPlan = new Map<string, any[]>();
    const apsDemands = new Map<string, any>();
    const apsDemandList: string[] = [];
    const apsSupplies = new Map<string, any>();
    const apsSupplyList: string[] = [];
    const apsPegging: any[] = [];

    const planId = entities.apsPlanList[0];
    let scOpNum = 1;
    let demNum = 1;
    let supNum = 1;

    for (const po of placedPOs) {
        // APS supply (mirrors MES production order)
        const supId = `SUP-${String(supNum++).padStart(4, "0")}`;
        const mePo = mesProductionOrders.get(po.id) as any;
        apsSupplies.set(supId, {
            id: supId,
            planId,
            type: "production",
            itemId: po.itemId,
            quantity: mePo?.quantities?.producedQuantity ?? 0,
            scheduledDate: toUnix(po.end),
            status: mePo?.status ?? "planned",
        });
        apsSupplyList.push(supId);

        // APS demand (mirrors linked sales order)
        const demId = `DEM-${String(demNum++).padStart(4, "0")}`;
        apsDemands.set(demId, {
            id: demId,
            planId,
            type: "customer_order",
            itemId: po.itemId,
            quantity: mePo?.quantities?.producedQuantity ?? 0,
            requiredDate: toUnix(addDaysToDate(po.end, 2)),
            status: "open",
        });
        apsDemandList.push(demId);
        apsPegging.push({ demandId: demId, supplyId: supId, quantity: mePo?.quantities?.producedQuantity ?? 0 });

        // Scheduled operations mirroring MES
        for (const op of po.operations) {
            const scId = `SCOP-${String(scOpNum++).padStart(4, "0")}`;
            const opRec = mesOperations.get(op.id) as any;
            const scOp = {
                id: scId,
                planId,
                mesOperationId: op.id,
                mesProductionOrderId: po.id,
                resourceId: op.workCenterId,
                itemId: po.itemId,
                scheduledStart: toUnix(op.start),
                scheduledEnd: toUnix(op.end),
                status: opRec?.status ?? "scheduled",
                utilizationPercent: opRec?.status === "completed" ? 100 : 0,
            };
            apsScheduledOps.set(scId, scOp);

            const byPlan = apsSchedOpsByPlan.get(planId) ?? [];
            byPlan.push(scOp);
            apsSchedOpsByPlan.set(planId, byPlan);

            const byRes = apsSchedOpsByResource.get(op.workCenterId) ?? [];
            byRes.push(scOp);
            apsSchedOpsByResource.set(op.workCenterId, byRes);
        }
    }

    // Capacity buckets from OEE data
    for (const bucket of oeeTimeseries) {
        const cb = {
            planId,
            resourceId: bucket.workCenterId,
            shiftStart: bucket.shiftStart,
            shiftEnd: bucket.shiftEnd,
            shiftName: bucket.shiftName,
            availableMinutes: bucket.plannedMinutes,
            loadedMinutes: bucket.runtimeMinutes,
            utilizationPercent: bucket.availabilityPercent,
        };
        apsCapacityBuckets.push(cb);
        const byPlan = apsCapBucketsByPlan.get(planId) ?? [];
        byPlan.push(cb);
        apsCapBucketsByPlan.set(planId, byPlan);
    }

    // ========================================================================
    // QMS — generated independently
    // ========================================================================

    const qmsNCs = new Map<string, any>();
    const qmsNCList: string[] = [];
    const qmsCAPAs = new Map<string, any>();
    const qmsCAPAList: string[] = [];
    const qmsAudits = new Map<string, any>();
    const qmsAuditList: string[] = [];
    const qmsComplaints = new Map<string, any>();
    const qmsComplaintList: string[] = [];
    const qmsDeviations = new Map<string, any>();
    const qmsDevList: string[] = [];
    const qmsDocs = new Map<string, any>();
    const qmsDocList: string[] = [];

    let ncNum = 1;
    let capaNum = 1;
    let auditNum = 1;
    let compNum = 1;

    // Nonconformances: one per operation with significant scrap (independent of MES linkage for now)
    for (const op of mesOperations.values() as IterableIterator<any>) {
        if (op.quantities.scrapQuantity > 0 && rng.bool(0.3)) {
            const ncId = `NC-${String(ncNum++).padStart(4, "0")}`;
            qmsNCs.set(ncId, {
                id: ncId,
                operationType: op.operationDescription,
                detectedDate: op.actualEnd,
                quantity: op.quantities.scrapQuantity,
                status: "closed",
            });
            qmsNCList.push(ncId);
        }
    }

    // CAPAs: one per operation-type cluster if there are multiple NCs
    const ncByOpType = new Map<string, string[]>();
    for (const [ncId, nc] of qmsNCs) {
        const list = ncByOpType.get(nc.operationType) ?? [];
        list.push(ncId);
        ncByOpType.set(nc.operationType, list);
    }
    for (const [opType, ncIds] of ncByOpType) {
        if (ncIds.length < 2) continue;
        const capaId = `CAPA-${String(capaNum++).padStart(4, "0")}`;
        const firstNc = qmsNCs.get(ncIds[0])!;
        const hasOpen = ncIds.some((id) => qmsNCs.get(id)?.status === "open");
        qmsCAPAs.set(capaId, {
            id: capaId,
            operationType: opType,
            openedDate: firstNc.detectedDate,
            linkedNCs: ncIds,
            status: hasOpen ? "open" : "closed",
        });
        qmsCAPAList.push(capaId);
    }

    // Audits: quarterly
    {
        let d = new Date(windowStart);
        d.setMonth(Math.ceil(d.getMonth() / 3) * 3, 1); // round up to next quarter start
        while (d < new Date(now.getTime() + config.monthsForward * 30 * 86400_000)) {
            const audId = `AUD-${String(auditNum++).padStart(4, "0")}`;
            qmsAudits.set(audId, {
                id: audId,
                scheduledDate: toUnix(d),
                status: "completed",
                findingsCount: rng.nextInt(0, 3),
            });
            qmsAuditList.push(audId);
            d = addDaysToDate(d, 91); // ~1 quarter
        }
    }

    // Complaints: ~1 in 10 shipped orders
    for (const so of erpSalesOrders.values()) {
        if (rng.bool(0.1)) {
            const cmpId = `CMP-${String(compNum++).padStart(4, "0")}`;
            const rcvDate = addDaysToDate(new Date(so.requestedDeliveryDate * 1000), rng.nextInt(2, 7));
            qmsComplaints.set(cmpId, {
                id: cmpId,
                salesOrderId: so.id,
                receivedDate: toUnix(rcvDate),
                status: "closed",
            });
            qmsComplaintList.push(cmpId);
        }
    }

    // ========================================================================
    // Assemble Dataset
    // ========================================================================

    return {
        siteId,
        now,
        routingTemplates: entities.routingTemplates,
        erp: {
            companies: entities.erpCompanies,
            currencies: entities.erpCurrencies,
            fiscalPeriods: erpFiscalPeriods,
            glAccounts: entities.erpGlAccounts,
            costCenters: entities.erpCostCenters,
            customers: entities.erpCustomers,
            suppliers: entities.erpSuppliers,
            items: entities.erpItems,
            salesOrders: erpSalesOrders,
            purchaseOrders: erpPurchaseOrders,
            invoices: erpInvoices,
            payments: erpPayments,
            journalEntries: erpJournalEntries,
            salesOrderList: erpSalesOrderList,
            purchaseOrderList: erpPurchaseOrderList,
            invoiceList: erpInvoiceList,
            paymentList: erpPaymentList,
            journalEntryList: erpJournalEntryList,
            glAccountList: entities.erpGlAccountList,
            costCenterList: entities.erpCostCenterList,
            customerList: entities.erpCustomerList,
            supplierList: entities.erpSupplierList,
            itemList: entities.erpItemList,
        },
        aps: {
            plans: entities.apsPlans,
            planList: entities.apsPlanList,
            scenarios: entities.apsScenarios,
            scenarioList: entities.apsScenarioList,
            resources: entities.apsResources,
            resourceList: entities.apsResourceList,
            scheduledOperations: apsScheduledOps,
            scheduledOperationsByPlan: apsSchedOpsByPlan,
            scheduledOperationsByResource: apsSchedOpsByResource,
            capacityBuckets: apsCapacityBuckets,
            capacityBucketsByPlan: apsCapBucketsByPlan,
            materialAvailability: [],
            materialAvailabilityByPlan: new Map(),
            exceptions: new Map(),
            kpis: new Map(),
            demands: apsDemands,
            demandList: apsDemandList,
            supplies: apsSupplies,
            supplyList: apsSupplyList,
            pegging: apsPegging,
            constraints: [],
            resourceLoad: new Map(),
        },
        mes: {
            workCenters: entities.workCenters,
            workCenterList: entities.workCenterList,
            productionOrders: mesProductionOrders,
            productionOrderList: mesProductionOrderList,
            operations: mesOperations,
            operationList: mesOperationList,
            dispatchItems: mesDispatchItems,
            productionEvents: mesProductionEvents,
            downtimeEvents: mesDowntimeEvents,
            oeeTimeseries,
            operationsByProductionOrder: mesOperationsByPO,
            operationsByWorkCenter: mesOperationsByWC,
            productionOrdersByLocation: mesProductionOrdersByLoc,
            productionEventsByOperation: mesProductionEventsByOp,
            productionEventsByProductionOrder: mesProductionEventsByPO,
            productionEventsByWorkCenter: mesProductionEventsByWC,
            downtimeByWorkCenter: mesDowntimeByWC,
            oeeByWorkCenter,
            workCenterTimelines: mesWorkCenterTimelines,
            routings: mesRoutings,
            routingList: mesRoutingList,
        },
        eam: {
            assets: entities.eamAssets,
            assetList: entities.eamAssetList,
            locations: entities.eamLocations,
            locationList: entities.eamLocationList,
            workOrders: eamWorkOrders,
            workOrderList: eamWorkOrderList,
            workOrderOperations: eamWorkOrderOps,
            maintenancePlans: entities.eamMaintenancePlans,
            maintenancePlanList: entities.eamMaintenancePlanList,
            maintenanceSchedules: eamMaintenanceSchedules,
            serviceRequests: new Map(),
            serviceRequestList: [],
            inspections: new Map(),
            inspectionList: [],
            assetHistory: eamAssetHistory,
            workOrdersByAsset: eamWorkOrdersByAsset,
            workOrdersByLocation: eamWorkOrdersByLoc,
            assetsByLocation: eamAssetsByLoc,
            maintenancePlansByAsset: new Map(
                entities.eamAssetList.map((id) => [
                    id,
                    entities.eamMaintenancePlanList.filter((pid) => pid.endsWith(id)),
                ]),
            ),
            inspectionsByAsset: new Map(),
            serviceRequestsByAsset: new Map(),
        },
        qms: {
            nonconformances: qmsNCs,
            nonconformanceList: qmsNCList,
            capas: qmsCAPAs,
            capaList: qmsCAPAList,
            deviations: qmsDeviations,
            deviationList: qmsDevList,
            audits: qmsAudits,
            auditList: qmsAuditList,
            complaints: qmsComplaints,
            complaintList: qmsComplaintList,
            documents: qmsDocs,
            documentList: qmsDocList,
        },
        wms: {
            warehouses: entities.wmsWarehouses,
            locations: entities.wmsLocations,
            locationList: entities.wmsLocationList,
            locationsByWarehouse: entities.wmsLocationsByWarehouse,
            inventoryPositions: wmsInventoryPositions,
            inventoryByItem: wmsInventoryByItem,
            inventorySummary: wmsInventorySummary,
            handlingUnits: [],
            lotStock: [],
            serialStock: [],
            receipts: wmsReceipts,
            putawayTasks: wmsPutawayTasks,
            pickTasks: wmsPickTasks,
            shipments: wmsShipments,
            cycleCounts: [],
            inventoryMovements: wmsMovements,
            stockAllocations: wmsStockAllocations,
        },
    };
}
