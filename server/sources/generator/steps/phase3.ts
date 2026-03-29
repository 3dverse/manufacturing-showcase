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

function poStatus(po: PlacedPO, now: Date): string {
    if (po.end <= now) return "completed";
    if (po.start < now) return "in_progress";
    return "planned";
}

function opStatus(op: PlacedOperation, now: Date): string {
    if (op.end <= now) return "completed";
    if (op.start < now) return "in_progress";
    return "scheduled";
}

function woStatus(wo: PlacedMaintenanceWO, now: Date): string {
    if (wo.end <= now) return "completed";
    if (wo.start < now) return "in_progress";
    return "planned";
}

function addDaysToDate(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

const TECHNICIANS = ["J. Smith", "M. Johnson", "P. Williams", "K. Brown", "C. Davis"];

// ---------------------------------------------------------------------------
// MES quantities for one operation
// ---------------------------------------------------------------------------

function computeOpQty(
    op: PlacedOperation,
    po: PlacedPO,
    config: GeneratorConfig,
    now: Date,
    rng: RNG,
): { producedQty: number; goodQty: number; scrapQty: number; effectiveYield: number } {
    const effectiveEnd = op.end < now ? op.end : now;
    if (op.start >= now) {
        return { producedQty: 0, goodQty: 0, scrapQty: 0, effectiveYield: config.yieldRate };
    }

    const shiftMins   = workingMinutes(op.start, effectiveEnd, config.shifts, config.workDays);
    const downtimeMins = op.downtimes
        .filter(dt => dt.start < effectiveEnd)
        .reduce((sum, dt) => {
            const dEnd = dt.end < effectiveEnd ? dt.end : effectiveEnd;
            return sum + (dEnd.getTime() - dt.start.getTime()) / 60_000;
        }, 0);

    const netMins     = Math.max(0, shiftMins - downtimeMins);
    const producedQty = Math.floor(netMins * po.effectiveUnitsPerHour / 60);

    // Yield: global median ± defectRate (see plan §3.1)
    const defectRate   = 1 - config.yieldRate;
    const effectiveYield = Math.min(1, Math.max(0,
        config.yieldRate + rng.nextFloat(-defectRate, defectRate),
    ));
    const goodQty  = Math.floor(producedQty * effectiveYield);
    const scrapQty = producedQty - goodQty;

    return { producedQty, goodQty, scrapQty, effectiveYield };
}

// ---------------------------------------------------------------------------
// fillDataset
// ---------------------------------------------------------------------------

function resolveItem(itemId: string, entities: Phase1Result): any {
    return entities.erpItems.get(itemId) ?? entities.wipItems.get(itemId);
}

function buildOpInputs(
    fgItemId:  string,
    opIndex:   number,
    producedQty: number,
    opSt:      string,
    opStart:   Date,
    opEnd:     Date,
    now:       Date,
    entities:  Phase1Result,
): any[] {
    const step = entities.routingTemplates.get(fgItemId)?.steps[opIndex];
    if (!step) return [];

    const progressFraction = opSt === "in_progress"
        ? Math.min(1, (now.getTime() - opStart.getTime()) / (opEnd.getTime() - opStart.getTime()))
        : 0;

    return step.inputItemIds.map(itemId => {
        const item         = resolveItem(itemId, entities);
        const requiredQty  = Math.max(1, producedQty);
        const issuedQty    = opSt === "completed"   ? requiredQty
                           : opSt === "in_progress" ? Math.floor(requiredQty * progressFraction)
                           : 0;
        return {
            itemId,
            itemCode:        item?.itemNumber ?? itemId,
            itemDescription: item?.name ?? itemId,
            requiredQuantity: requiredQty,
            issuedQuantity:   issuedQty,
            uom:              item?.uom ?? "pcs",
        };
    });
}

function buildOpOutputs(
    fgItemId:    string,
    opIndex:     number,
    producedQty: number,
    plannedQty:  number,
    entities:    Phase1Result,
): any[] {
    const step = entities.routingTemplates.get(fgItemId)?.steps[opIndex];
    if (!step) return [];

    const item = resolveItem(step.outputItemId, entities);
    return [{
        itemId:           step.outputItemId,
        itemCode:         item?.itemNumber ?? step.outputItemId,
        itemDescription:  item?.name ?? step.outputItemId,
        expectedQuantity: plannedQty,
        reportedQuantity: producedQty,
        uom:              item?.uom ?? "pcs",
    }];
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

    // ========================================================================
    // MES
    // ========================================================================

    const mesProductionOrders         = new Map<string, any>();
    const mesProductionOrderList:       string[] = [];
    const mesOperations               = new Map<string, any>();
    const mesOperationList:            string[] = [];
    const mesOperationsByPO           = new Map<string, string[]>();
    const mesOperationsByWC           = new Map<string, string[]>();
    const mesProductionOrdersByLoc    = new Map<string, string[]>();
    const mesDowntimeEvents:           any[] = [];
    const mesDowntimeByWC             = new Map<string, any[]>();
    const mesProductionEvents:         any[] = [];
    const mesProductionEventsByOp     = new Map<string, any[]>();
    const mesProductionEventsByPO     = new Map<string, any[]>();
    const mesProductionEventsByWC     = new Map<string, any[]>();
    const mesWorkCenterTimelines      = new Map<string, WorkCenterTimeline>();
    const mesDispatchItems:            any[] = [];

    // Per-operation yield, stored for OEE computation
    const opYields = new Map<string, number>();

    // Build work-center timeline skeletons
    for (const wcId of entities.workCenterList) {
        mesWorkCenterTimelines.set(wcId, { workCenterId: wcId, entries: [] });
    }

    let evtNum = 1;

    for (const po of placedPOs) {
        const status   = poStatus(po, now);
        const opIds:   string[] = [];

        // All ops in same PO use the same effective UPH; take the first op's qty as the PO qty
        let poProducedQty = 0;
        let poGoodQty     = 0;

        for (const op of po.operations) {
            const { producedQty, goodQty, scrapQty, effectiveYield } =
                computeOpQty(op, po, config, now, rng);
            opYields.set(op.id, effectiveYield);

            if (op === po.operations[0]) {
                poProducedQty = producedQty;
                poGoodQty     = goodQty;
            }

            const opSt    = opStatus(op, now);
            const opIndex = po.operations.indexOf(op);
            const plannedRunMinutes = config.operationDurationMinutes - op.setupMinutes;
            const actualRunMinutes  = opSt !== "scheduled"
                ? workingMinutes(op.start, opSt === "completed" ? op.end : now, config.shifts, config.workDays)
                : null;
            mesOperations.set(op.id, {
                id:                       op.id,
                productionOrderId:        po.id,
                operationCode:            `${op.operationType}-${String(opIndex + 1).padStart(2, "0")}`,
                operationDescription:     op.operationType,
                sequence:                 (opIndex + 1) * 10,
                workCenterId:             op.workCenterId,
                workCenterName:           op.workCenterName,
                locationId:               op.locationId,
                siteId:                   siteId,
                status:                   opSt,
                scheduledStart:           toUnix(op.start),
                scheduledEnd:             toUnix(op.end),
                actualStart:              opSt !== "scheduled" ? toUnix(op.start) : null,
                actualEnd:                opSt === "completed" ? toUnix(op.end)   : null,
                progressPercent:          opSt === "completed" ? 100
                                        : opSt === "in_progress" ? Math.min(99, Math.round(
                                            (Date.now() - op.start.getTime()) /
                                            (op.end.getTime() - op.start.getTime()) * 100
                                          ))
                                        : 0,
                plannedSetupTimeMinutes:  op.setupMinutes,
                plannedRunTimeMinutes:    plannedRunMinutes,
                actualSetupTimeMinutes:   opSt !== "scheduled" ? op.setupMinutes : null,
                actualRunTimeMinutes:     actualRunMinutes,
                quantities: {
                    plannedQuantity:  Math.floor(plannedRunMinutes * po.effectiveUnitsPerHour / 60),
                    producedQuantity: producedQty,
                    goodQuantity:     goodQty,
                    scrapQuantity:    scrapQty,
                    uom:              "pcs",
                },
                inputs:  buildOpInputs(po.itemId, opIndex, producedQty, opSt, op.start, op.end, now, entities),
                outputs: buildOpOutputs(po.itemId, opIndex, producedQty, Math.floor(plannedRunMinutes * po.effectiveUnitsPerHour / 60), entities),
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
                    id:                dt.id,
                    siteId,
                    workCenterId:      op.workCenterId,
                    operationId:       op.id,
                    productionOrderId: po.id,
                    reasonCode:        dt.templateCode,
                    reasonDescription: dt.description,
                    startedAt:         toUnix(dt.start),
                    endedAt:           toUnix(dt.end),
                    durationMinutes:   dt.durationMinutes,
                };
                mesDowntimeEvents.push(dtRecord);
                const wcDt = mesDowntimeByWC.get(op.workCenterId) ?? [];
                wcDt.push(dtRecord);
                mesDowntimeByWC.set(op.workCenterId, wcDt);
            }

            // Production events (start / end)
            const addEvt = (type: string, ts: Date) => {
                const evt = {
                    id:                `EVT-${String(evtNum++).padStart(5, "0")}`,
                    operationId:       op.id,
                    productionOrderId: po.id,
                    workCenterId:      op.workCenterId,
                    eventType:         type,
                    timestamp:         toUnix(ts),
                    quantity:          type === "op_end" ? producedQty : null,
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
            if (opSt !== "scheduled") addEvt("op_start", op.start);
            if (opSt === "completed") addEvt("op_end",   op.end);

            // Work-center op/WC cross-index
            const wcOps = mesOperationsByWC.get(op.workCenterId) ?? [];
            wcOps.push(op.id);
            mesOperationsByWC.set(op.workCenterId, wcOps);

            // Dispatch item for in-progress / planned ops
            if (opSt !== "completed") {
                mesDispatchItems.push({
                    workCenterId:      op.workCenterId,
                    operationId:       op.id,
                    productionOrderId: po.id,
                    scheduledStart:    toUnix(op.start),
                    scheduledEnd:      toUnix(op.end),
                    status:            opSt,
                    priority:          1,
                });
            }
        }

        mesOperationsByPO.set(po.id, opIds);

        const plannedQty = Math.floor(
            (config.operationDurationMinutes - (po.operations[0]?.setupMinutes ?? 0))
            * po.effectiveUnitsPerHour / 60,
        );
        mesProductionOrders.set(po.id, {
            id:               po.id,
            orderNumber:      `MO-${po.id}`,
            siteId,
            locationId:       po.locationId,
            locationName:     po.locationName,
            itemCode:         po.itemId,
            itemDescription:  po.itemId,
            status,
            priority:         1,
            erpSalesOrderId:  null,
            apsPlanId:        null,
            timing: {
                scheduledStart: toUnix(po.start),
                scheduledEnd:   toUnix(po.end),
                actualStart:    status !== "planned"   ? toUnix(po.start) : null,
                actualEnd:      status === "completed" ? toUnix(po.end)   : null,
            },
            quantities: {
                plannedQuantity:  plannedQty,
                producedQuantity: poProducedQty,
                goodQuantity:     poGoodQty,
                scrapQuantity:    poProducedQty - poGoodQty,
                uom:              "pcs",
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
    const oeeTimeseries:        OEEBucket[] = [];
    const oeeByWorkCenter       = new Map<string, OEEBucket[]>();

    // Build a lookup: operationId → PlacedPO (for effectiveUnitsPerHour)
    const opToPO = new Map<string, PlacedPO>();
    for (const po of placedPOs) {
        for (const op of po.operations) opToPO.set(op.id, po);
    }

    for (const wcId of entities.workCenterList) {
        // All operations for this work center
        const wcOpIds  = mesOperationsByWC.get(wcId) ?? [];
        const wcOps    = wcOpIds.map(id => {
            const op = mesOperations.get(id);
            return op;
        }).filter(Boolean);

        const wcBuckets: OEEBucket[] = [];

        // Enumerate every shift slot that overlaps [windowStart, now]
        const coverageSlots = shiftCoverage(windowStart, now, config.shifts, config.workDays);

        for (const slot of coverageSlots) {
            // Operations active during this shift slot
            const activeOps = wcOps.filter((op: any) => {
                const opStart = new Date(op.scheduledStart * 1000);
                const opEnd   = new Date(op.scheduledEnd   * 1000);
                return opStart < slot.overlapEnd && opEnd > slot.overlapStart;
            });
            if (activeOps.length === 0) continue;

            const plannedMins = (slot.overlapEnd.getTime() - slot.overlapStart.getTime()) / 60_000;
            let downtimeMins = 0;
            let producedQty  = 0;
            let goodQty      = 0;

            for (const op of activeOps) {
                const opStart   = new Date(op.scheduledStart * 1000);
                const opEnd     = new Date(op.scheduledEnd   * 1000);
                const clampStart = new Date(Math.max(opStart.getTime(), slot.overlapStart.getTime()));
                const clampEnd   = new Date(Math.min(opEnd.getTime(),   slot.overlapEnd.getTime()));
                if (clampEnd <= clampStart) continue;

                // Downtime events within the clamped window
                const placed = placedPOs
                    .flatMap(p => p.operations)
                    .find(o => o.id === op.id);
                if (placed) {
                    for (const dt of placed.downtimes) {
                        const dStart = new Date(Math.max(dt.start.getTime(), clampStart.getTime()));
                        const dEnd   = new Date(Math.min(dt.end.getTime(),   clampEnd.getTime()));
                        if (dEnd > dStart) downtimeMins += (dEnd.getTime() - dStart.getTime()) / 60_000;
                    }
                }

                const netMins = Math.max(0, (clampEnd.getTime() - clampStart.getTime()) / 60_000);
                const po      = opToPO.get(op.id)!;
                const qty     = Math.floor(netMins * po.effectiveUnitsPerHour / 60);
                const yld     = opYields.get(op.id) ?? config.yieldRate;
                producedQty  += qty;
                goodQty      += Math.floor(qty * yld);
            }

            const runtimeMins  = plannedMins - downtimeMins;
            const availability = plannedMins > 0 ? runtimeMins / plannedMins : 0;
            const quality      = producedQty > 0 ? goodQty / producedQty : 1;
            const scrapQty     = producedQty - goodQty;

            const bucket: OEEBucket = {
                workCenterId:        wcId,
                shiftStart:          toUnix(slot.start),
                shiftEnd:            toUnix(slot.end),
                shiftName:           slot.name,
                plannedMinutes:      plannedMins,
                runtimeMinutes:      runtimeMins,
                downtimeMinutes:     downtimeMins,
                producedQuantity:    producedQty,
                goodQuantity:        goodQty,
                scrapQuantity:       scrapQty,
                uom:                 "pcs",
                availabilityPercent: availability * 100,
                performancePercent:  100,
                qualityPercent:      quality * 100,
                oeePercent:          availability * quality * 100,
            };
            wcBuckets.push(bucket);
            oeeTimeseries.push(bucket);
        }

        oeeByWorkCenter.set(wcId, wcBuckets);
    }

    // ---- MES Routings (structural material flow graph per finished good) ----
    const mesRoutings    = new Map<string, any>();
    const mesRoutingList: string[] = [];

    for (const [fgItemId, tmpl] of entities.routingTemplates) {
        const fgItem = entities.erpItems.get(fgItemId);
        const steps  = tmpl.steps.map(step => {
            const inputs = step.inputItemIds.map(itemId => {
                const item = resolveItem(itemId, entities);
                return {
                    itemId,
                    itemCode:        item?.itemNumber ?? itemId,
                    itemDescription: item?.name ?? itemId,
                    itemType:        item?.itemType   ?? "raw_material",
                    uom:             item?.uom        ?? "pcs",
                };
            });
            const outItem = resolveItem(step.outputItemId, entities);
            return {
                sequence:                step.sequence,
                operationCode:           step.operationCode,
                operationType:           step.operationType,
                workCenterOperationType: step.workCenterOperationType,
                workCenterId:            step.workCenterId,
                workCenterName:          step.workCenterName,
                inputs,
                output: {
                    itemId:          step.outputItemId,
                    itemCode:        outItem?.itemNumber ?? step.outputItemId,
                    itemDescription: outItem?.name      ?? step.outputItemId,
                    itemType:        outItem?.itemType  ?? "wip",
                    uom:             outItem?.uom       ?? "pcs",
                },
            };
        });
        const routing = {
            itemId:          fgItemId,
            itemCode:        fgItem?.itemNumber  ?? fgItemId,
            itemDescription: fgItem?.name        ?? fgItemId,
            steps,
        };
        mesRoutings.set(fgItemId, routing);
        mesRoutingList.push(fgItemId);
    }

    // Update work-center summary stats
    for (const [wcId, wc] of entities.workCenters) {
        const buckets = oeeByWorkCenter.get(wcId) ?? [];
        wc.runtimeMinutes  = buckets.reduce((s, b) => s + b.runtimeMinutes,  0);
        wc.downtimeMinutes = buckets.reduce((s, b) => s + b.downtimeMinutes, 0);
        wc.goodQuantity    = buckets.reduce((s, b) => s + b.goodQuantity,    0);
        wc.scrapQuantity   = buckets.reduce((s, b) => s + b.scrapQuantity,   0);
        if (wc.runtimeMinutes + wc.downtimeMinutes > 0) {
            wc.utilizationPercent = Math.round(
                100 * wc.runtimeMinutes / (wc.runtimeMinutes + wc.downtimeMinutes),
            );
        }
        // Set status based on current moment
        const currentOp = Array.from(mesOperations.values()).find(
            (op: any) => op.workCenterId === wcId && op.status === "in_progress",
        );
        if (currentOp) {
            wc.status                  = "running";
            wc.activeProductionOrderId = currentOp.productionOrderId;
            wc.activeOperationId       = currentOp.id;
        }
    }

    // ========================================================================
    // EAM — work orders (placed by Phase 2)
    // ========================================================================

    const eamWorkOrders         = new Map<string, any>();
    const eamWorkOrderList:      string[] = [];
    const eamWorkOrderOps       = new Map<string, any[]>();
    const eamWorkOrdersByAsset  = new Map<string, string[]>();
    const eamWorkOrdersByLoc    = new Map<string, string[]>();
    const eamAssetsByLoc        = new Map<string, string[]>();
    const eamAssetHistory       = new Map<string, any[]>();
    const eamMaintenanceSchedules = new Map<string, any[]>();

    // assetsByLocation derived from assetsByWorkCenter + workCenter → location mapping
    for (const [wcId, assetIds] of entities.assetsByWorkCenter) {
        // Find location that contains this work center
        for (const loc of config.site.locations) {
            if (loc.workCenters.some(wc => wc.hash === wcId)) {
                for (const assetId of assetIds) {
                    const arr = eamAssetsByLoc.get(loc.hash) ?? [];
                    arr.push(assetId);
                    eamAssetsByLoc.set(loc.hash, arr);
                }
            }
        }
    }

    for (const wo of allPlacedWOs) {
        const status = woStatus(wo, now);
        const record: any = {
            id:                   wo.id,
            workOrderNumber:      wo.id,
            description:          `Predictive Maintenance – ${wo.assetName}`,
            workType:             "predictive",
            priority:             "medium",
            assetId:              wo.assetId,
            locationId:           wo.locationId,
            maintenancePlanId:    wo.planId,
            mesProductionOrderId: null,
            status,
            scheduledStart:       toUnix(wo.start),
            scheduledEnd:         toUnix(wo.end),
            actualStart:          status !== "planned"   ? toUnix(wo.start) : null,
            actualEnd:            status === "completed" ? toUnix(wo.end)   : null,
            completedBy:          status === "completed" ? rng.pick(TECHNICIANS) : null,
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

    const erpSalesOrders    = new Map<string, any>();
    const erpSalesOrderList: any[] = [];
    const erpPurchaseOrders = new Map<string, any>();
    const erpPurchaseOrderList: any[] = [];
    const erpInvoices       = new Map<string, any>();
    const erpInvoiceList:    string[] = [];
    const erpPayments       = new Map<string, any>();
    const erpPaymentList:    string[] = [];
    const erpJournalEntries = new Map<string, any>();
    const erpJournalEntryList: string[] = [];

    const customerIds  = entities.erpCustomerList;
    const supplierIds  = entities.erpSupplierList;
    const companyId    = "COMP-001";

    // WMS transactional arrays — declared here so the ERP loop can populate pick/shipment
    const wmsReceipts:       any[] = [];
    const wmsPutawayTasks:   any[] = [];
    const wmsPickTasks:      any[] = [];
    const wmsShipments:      any[] = [];
    const wmsMovements:      any[] = [];
    const wmsInventoryByItem = new Map<string, any[]>();
    let   receiptNum  = 1;
    let   putawayNum  = 1;
    let   pickNum     = 1;
    let   shipNum     = 1;
    let   movNum      = 1;

    const mkMov = (fields: Record<string, any>) => {
        const mv = { id: `MOV-${String(movNum++).padStart(6, "0")}`, ...fields };
        wmsMovements.push(mv);
        return mv;
    };

    // Zone IDs derived from site graph (Reception, Storage, Supply, Delivery)
    const { reception, storage, delivery } = entities.wmsZoneIds;
    const receptionBin = `${reception}-BIN-01`;
    const storageBin   = `${storage}-BIN-01`;
    const deliveryBin  = `${delivery}-BIN-01`;

    let soNum  = 1;
    let poNum  = 1;
    let invNum = 1;
    let payNum = 1;
    let jeNum  = 1;

    function newSoId()  { return `SO-${String(soNum++).padStart(4,  "0")}`; }
    function newPoId()  { return `PO-ERP-${String(poNum++).padStart(4, "0")}`; }
    function newInvId() { return `INV-${String(invNum++).padStart(4, "0")}`; }
    function newPayId() { return `PAY-${String(payNum++).padStart(4, "0")}`; }
    function newJeId()  { return `JE-${String(jeNum++).padStart(4,  "0")}`; }

    for (const po of placedPOs) {
        const item       = entities.erpItems.get(po.itemId);
        const unitPrice  = item?.standardCost ?? 500;
        const qty        = (mesProductionOrders.get(po.id) as any)?.quantities?.producedQuantity ?? 0;
        const lineAmount = qty * unitPrice;

        // ---- Sales Order (placed before production starts; delivery after production ends) ----
        const customer   = rng.pick(customerIds);
        const custRec    = entities.erpCustomers.get(customer)!;
        const orderDate  = addDaysToDate(po.start, -rng.nextInt(3, 10));
        const delivDate  = addDaysToDate(po.end,    rng.nextInt(1, 5));

        // Pick and ship happen on the delivery date
        const pickDate   = delivDate;
        const shipDate   = delivDate;
        const shipped    = shipDate <= now;
        const soStatus   = shipped ? "shipped" : orderDate <= now ? "in_progress" : "open";
        const soId       = newSoId();

        const mesPO = mesProductionOrders.get(po.id) as any;
        if (mesPO) mesPO.erpSalesOrderId = soId;

        const soObj = {
            id: soId, companyId,
            siteId: config.siteId,
            orderNumber: soId,
            customerId:  customer,
            orderDate:   toUnix(orderDate),
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
                id: pickId, warehouseId: storage, locationId: storageBin,
                itemId: po.itemId, quantity: qty,
                createdAt:  toUnix(addDaysToDate(pickDate, -1)),
                pickedDate: shipped ? toUnix(pickDate) : null,
                status: shipped ? "completed" : "open",
                salesOrderId: soId,
            });
            wmsShipments.push({
                id: shipId, warehouseId: delivery,
                itemId: po.itemId, quantity: qty,
                shippedDate: toUnix(shipDate),
                status: shipped ? "shipped" : "pending",
                salesOrderId: soId,
            });

            if (shipped) {
                const pickFields = {
                    occurredAt: toUnix(pickDate), movementType: "pick",
                    itemId: po.itemId, uom: "pcs",
                    fromLocationId: storageBin, toLocationId: deliveryBin,
                    sourceDocumentType: "pick_task", sourceDocumentId: pickId,
                    productionOrderId: po.id, operationId: null,
                };
                // Pick: debit Storage, credit Delivery
                mkMov({ warehouseId: storage,   locationId: storageBin,  quantity: -qty, ...pickFields });
                mkMov({ warehouseId: delivery,  locationId: deliveryBin, quantity: +qty, ...pickFields });
                // Shipment: FG leaves Delivery zone
                mkMov({
                    warehouseId: delivery, locationId: deliveryBin,
                    occurredAt: toUnix(shipDate), movementType: "shipment",
                    itemId: po.itemId, quantity: -qty, uom: "pcs",
                    fromLocationId: deliveryBin, toLocationId: null,
                    sourceDocumentType: "shipment", sourceDocumentId: shipId,
                    productionOrderId: po.id, operationId: null,
                });
            }
        }

        // ---- Purchase Order (raw materials) ----
        const supplier     = rng.pick(supplierIds);
        const suppRec      = entities.erpSuppliers.get(supplier)!;
        const leadTime     = (suppRec as any).leadTimeDays ?? 7;
        const poOrderDate  = addDaysToDate(po.start, -(leadTime + rng.nextInt(1, 3)));
        const poDelivDate  = addDaysToDate(po.start, -rng.nextInt(0, 2));
        const poErpStatus  = poDelivDate <= now ? "received" : "open";
        const erpPoId      = newPoId();
        const rmCost       = unitPrice * 0.4; // raw materials ~40 % of unit cost

        const poObj = {
            id: erpPoId, companyId,
            orderNumber: erpPoId,
            supplierId: supplier,
            orderDate:   toUnix(poOrderDate),
            expectedDeliveryDate: toUnix(poDelivDate),
            status: poErpStatus,
            currency: "USD",
            lines: [{ lineNumber: 1, itemId: "RM-STEEL-BAR", quantity: qty, unitPrice: rmCost, lineAmount: qty * rmCost }],
            totalAmount: qty * rmCost,
        };
        erpPurchaseOrders.set(erpPoId, poObj);
        erpPurchaseOrderList.push(poObj);

        // ---- AR Invoice (after shipment) ----
        if (soStatus === "shipped") {
            const invDate  = addDaysToDate(shipDate, rng.nextInt(0, 2));
            const terms    = (custRec as any).paymentTermsDays ?? 30;
            const dueDate  = addDaysToDate(invDate, terms);
            const invStatus = dueDate <= now ? "paid" : invDate <= now ? "open" : "draft";
            const invId    = newInvId();

            erpInvoices.set(invId, {
                id: invId, companyId,
                invoiceNumber: invId, type: "ar",
                customerId: customer, salesOrderId: soId,
                invoiceDate: toUnix(invDate),
                dueDate:     toUnix(dueDate),
                amount:      lineAmount,
                currency:    "USD",
                status:      invStatus,
            });
            erpInvoiceList.push(invId);

            if (invStatus === "paid") {
                const payDate = addDaysToDate(dueDate, -rng.nextInt(0, 5));
                const payId   = newPayId();
                erpPayments.set(payId, {
                    id: payId, companyId,
                    paymentNumber: payId, type: "receipt",
                    invoiceId: invId, customerId: customer,
                    paymentDate: toUnix(payDate),
                    amount: lineAmount, currency: "USD", status: "posted",
                });
                erpPaymentList.push(payId);

                // Journal entries
                const jeDebit  = newJeId();
                const jeCredit = newJeId();
                erpJournalEntries.set(jeDebit,  { id: jeDebit,  companyId, postingDate: toUnix(payDate), accountId: "GL-1000", amount:  lineAmount, type: "debit",  reference: payId });
                erpJournalEntries.set(jeCredit, { id: jeCredit, companyId, postingDate: toUnix(payDate), accountId: "GL-1100", amount: -lineAmount, type: "credit", reference: payId });
                erpJournalEntryList.push(jeDebit, jeCredit);
            }
        }

        // ---- AP Invoice (after receipt) ----
        if (poErpStatus === "received") {
            const apInvDate = addDaysToDate(poDelivDate, rng.nextInt(1, 3));
            const apTerms   = (suppRec as any).paymentTermsDays ?? 30;
            const apDue     = addDaysToDate(apInvDate, apTerms);
            const apStatus  = apDue <= now ? "paid" : apInvDate <= now ? "open" : "draft";
            const apInvId   = newInvId();
            const apAmount  = qty * rmCost;

            erpInvoices.set(apInvId, {
                id: apInvId, companyId,
                invoiceNumber: apInvId, type: "ap",
                supplierId: supplier, purchaseOrderId: erpPoId,
                invoiceDate: toUnix(apInvDate),
                dueDate:     toUnix(apDue),
                amount:      apAmount,
                currency:    "USD",
                status:      apStatus,
            });
            erpInvoiceList.push(apInvId);
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
                id:          `FP-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                companyId,
                year:        d.getFullYear(),
                period:      d.getMonth() + 1,
                startDate:   toUnix(d),
                endDate:     toUnix(periodEnd),
                status,
            });
            d = periodEnd;
        }
    }

    // ========================================================================
    // WMS — receipts, putaway tasks, and inventory movements
    // (pick tasks and shipments are generated in the ERP loop above, anchored to SO.orderDate)
    // ========================================================================

    for (const po of placedPOs) {
        const mePo       = mesProductionOrders.get(po.id) as any;
        const qty        = mePo?.quantities?.producedQuantity ?? 0;
        const plannedQty = (mePo?.quantities?.plannedQuantity ?? 0) as number;

        // ---- RM receipt (timed just before PO start) ----
        const rcvDate   = addDaysToDate(po.start, -rng.nextInt(0, 2));
        const rcvStatus = rcvDate <= now ? "completed" : "pending";

        // Collect all distinct RM items across all routing steps
        const routing   = entities.routingTemplates.get(po.itemId);
        const allRmIds  = routing
            ? [...new Set(routing.steps.flatMap((s: any) => s.inputItemIds.filter((id: string) => id.startsWith("RM-"))))]
            : ["RM-STEEL-BAR"];

        const rcvQty = Math.max(plannedQty, qty);

        // One receipt + putaway task per RM item (same received date, same PO linkage)
        const putawayDate = addDaysToDate(rcvDate, 1); // putaway happens next day
        const putawayDone = putawayDate <= now;

        for (const rmItemId of allRmIds) {
            const lineRcptId  = `RCP-${String(receiptNum++).padStart(4, "0")}`;
            const putawayId   = `PUT-${String(putawayNum++).padStart(4, "0")}`;
            const putawayStatus = putawayDone ? "completed" : rcvStatus === "completed" ? "open" : "pending";

            wmsReceipts.push({
                id: lineRcptId, warehouseId: reception, locationId: receptionBin,
                itemId: rmItemId, quantity: rcvQty,
                receivedDate: toUnix(rcvDate), status: rcvStatus,
            });

            wmsPutawayTasks.push({
                id: putawayId, warehouseId: storage,
                receiptId: lineRcptId,
                itemId: rmItemId, quantity: rcvQty,
                fromLocationId: receptionBin, toLocationId: storageBin,
                putawayDate: toUnix(putawayDate), status: putawayStatus,
            });

            if (rcvStatus === "completed" && rcvQty > 0) {
                // Receipt: RM arrives at Reception
                mkMov({
                    warehouseId: reception, locationId: receptionBin,
                    occurredAt: toUnix(rcvDate), movementType: "receipt",
                    itemId: rmItemId, quantity: rcvQty, uom: "pcs",
                    fromLocationId: null, toLocationId: receptionBin,
                    sourceDocumentType: "receipt", sourceDocumentId: lineRcptId,
                    productionOrderId: po.id, operationId: null,
                });

                if (putawayDone) {
                    // Putaway: RM moves from Reception to Storage
                    mkMov({
                        warehouseId: storage, locationId: storageBin,
                        occurredAt: toUnix(putawayDate), movementType: "putaway",
                        itemId: rmItemId, quantity: rcvQty, uom: "pcs",
                        fromLocationId: receptionBin, toLocationId: storageBin,
                        sourceDocumentType: "putaway_task", sourceDocumentId: putawayId,
                        productionOrderId: po.id, operationId: null,
                    });
                    // Debit Reception (stock leaves)
                    mkMov({
                        warehouseId: reception, locationId: receptionBin,
                        occurredAt: toUnix(putawayDate), movementType: "putaway",
                        itemId: rmItemId, quantity: -rcvQty, uom: "pcs",
                        fromLocationId: receptionBin, toLocationId: storageBin,
                        sourceDocumentType: "putaway_task", sourceDocumentId: putawayId,
                        productionOrderId: po.id, operationId: null,
                    });
                }
            }
        }

        // FG production movement at PO end — FG lands in Storage
        if (qty > 0 && po.end <= now) {
            mkMov({
                warehouseId: storage, locationId: storageBin,
                occurredAt: toUnix(po.end), movementType: "production",
                itemId: po.itemId, quantity: qty, uom: "pcs",
                fromLocationId: null, toLocationId: storageBin,
                sourceDocumentType: null, sourceDocumentId: null,
                productionOrderId: po.id, operationId: null,
            });
        }
    }

    // ---- Issue + production movements from MES operations (WIP only) ----
    for (const op of mesOperations.values() as IterableIterator<any>) {
        if (op.status === "scheduled") continue;

        // Issue movements: RM/WIP consumed at operation start (drawn from Storage).
        // Skip FG items — QC is a passthrough; the FG stays in Storage.
        for (const input of (op.inputs ?? []) as any[]) {
            if ((input.issuedQuantity ?? 0) === 0) continue;
            if (!input.itemId.startsWith("RM-") && !input.itemId.startsWith("WIP-")) continue;
            mkMov({
                warehouseId: storage, locationId: storageBin,
                occurredAt: op.actualStart, movementType: "issue",
                itemId: input.itemId, quantity: -input.issuedQuantity, uom: input.uom ?? "pcs",
                fromLocationId: storageBin, toLocationId: null,
                sourceDocumentType: null, sourceDocumentId: null,
                productionOrderId: op.productionOrderId, operationId: op.id,
            });
        }

        // Production movements: WIP produced at operation end — lands in Storage.
        // FG production movements are emitted in the PO loop above (consistent qty with shipment).
        if (op.status === "completed") {
            for (const output of (op.outputs ?? []) as any[]) {
                if ((output.reportedQuantity ?? 0) === 0) continue;
                if (!output.itemId.startsWith("WIP-")) continue; // FG handled by PO loop
                mkMov({
                    warehouseId: storage, locationId: storageBin,
                    occurredAt: op.actualEnd, movementType: "production",
                    itemId: output.itemId, quantity: output.reportedQuantity, uom: output.uom ?? "pcs",
                    fromLocationId: null, toLocationId: storageBin,
                    sourceDocumentType: null, sourceDocumentId: null,
                    productionOrderId: op.productionOrderId, operationId: op.id,
                });
            }
        }
    }

    // ---- Inventory positions derived by projecting movements at now ----
    const nowTs = toUnix(now);
    const balances = new Map<string, { itemId: string; warehouseId: string; locationId: string; qty: number; uom: string }>();
    for (const mv of wmsMovements) {
        if (mv.occurredAt > nowTs) continue;
        const key = `${mv.itemId}|${mv.locationId}`;
        if (!balances.has(key)) {
            balances.set(key, { itemId: mv.itemId, warehouseId: mv.warehouseId, locationId: mv.locationId, qty: 0, uom: mv.uom });
        }
        balances.get(key)!.qty += mv.quantity;
    }

    const wmsInventoryPositions: any[] = [];
    const wmsInventorySummary:   any[] = [];
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

    // Available stock in Storage zone, split by item type
    const rmAvailable = new Map<string, number>(); // RM items
    const fgAvailable = new Map<string, number>(); // FG items

    for (const { itemId, warehouseId, qty } of balances.values()) {
        if (qty <= 0 || warehouseId !== storage) continue;
        if (itemId.startsWith("RM-")) {
            rmAvailable.set(itemId, (rmAvailable.get(itemId) ?? 0) + qty);
        } else if (!itemId.startsWith("WIP-")) {
            fgAvailable.set(itemId, (fgAvailable.get(itemId) ?? 0) + qty);
        }
    }

    // FIFO putaway queue — for deriving allocatedAt as max(demand_date, stock_available_at).
    // Only completed putaways contribute to available balances, so filter accordingly.
    type PutawayBatch = { putawayDate: number; remaining: number };
    const putawayFifo = new Map<string, PutawayBatch[]>();
    for (const pt of wmsPutawayTasks) {
        if (pt.warehouseId !== storage || !pt.putawayDate || pt.putawayDate > nowTs) continue;
        const q = putawayFifo.get(pt.itemId) ?? [];
        q.push({ putawayDate: pt.putawayDate, remaining: pt.quantity });
        putawayFifo.set(pt.itemId, q);
    }
    for (const q of putawayFifo.values()) q.sort((a, b) => a.putawayDate - b.putawayDate);

    // Consume `qty` units FIFO; return the putaway date of the last consumed batch.
    function consumeFifo(itemId: string, qty: number): number {
        const q = putawayFifo.get(itemId) ?? [];
        let left = qty;
        let date = 0;
        for (const batch of q) {
            if (batch.remaining <= 0 || left <= 0) continue;
            const take = Math.min(batch.remaining, left);
            batch.remaining -= take;
            left -= take;
            date = batch.putawayDate;
        }
        return date;
    }

    // RM allocations — all POs across the window
    // Active (planned/in_progress): consume from FIFO, clearedAt = null
    // Completed: historical record only — allocatedAt ≈ day before PO start (when RM was putaway),
    //            clearedAt = when production started (RM was issued)
    const allMesPOs = ([...mesProductionOrders.values()] as any[])
        .sort((a, b) => (a.timing?.scheduledStart ?? 0) - (b.timing?.scheduledStart ?? 0));

    for (const mePo of allMesPOs) {
        const routing    = entities.routingTemplates.get(mePo.itemCode);
        const allRmIds   = routing
            ? [...new Set(routing.steps.flatMap((s: any) =>
                s.inputItemIds.filter((id: string) => id.startsWith("RM-"))))]
            : [];
        const requiredQty = mePo.quantities?.plannedQuantity ?? 0;
        if (requiredQty === 0 || allRmIds.length === 0) continue;

        const isCompleted = mePo.status === "completed";

        for (const rmItemId of allRmIds) {
            let allocQty: number;
            let allocatedAt: number;
            let clearedAt: number | null;

            if (isCompleted) {
                // Historical record: stock already consumed, don't touch availability
                allocQty    = requiredQty;
                allocatedAt = Number(mePo.timing?.scheduledStart ?? nowTs) - 86400;
                clearedAt   = Number(mePo.timing?.actualStart ?? mePo.timing?.scheduledStart ?? nowTs);
            } else {
                const available = rmAvailable.get(rmItemId) ?? 0;
                if (available <= 0) continue;
                allocQty = Math.min(available, requiredQty);
                rmAvailable.set(rmItemId, available - allocQty);

                const stockAvailableAt = consumeFifo(rmItemId, allocQty);
                const demandDate       = mePo.timing?.scheduledStart ?? nowTs;
                allocatedAt = stockAvailableAt ? Math.max(demandDate, stockAvailableAt) : demandDate;
                clearedAt   = null;
            }

            wmsStockAllocations.push({
                id:                `ALLOC-${String(allocNum++).padStart(5, "0")}`,
                warehouseId:       storage,
                locationId:        storageBin,
                itemId:            rmItemId,
                quantityAllocated: allocQty,
                quantityRequired:  requiredQty,
                uom:               entities.erpItems.get(rmItemId)?.uom ?? "pcs",
                demandType:        "production_order",
                productionOrderId: mePo.id,
                erpSalesOrderId:   null,
                status:            allocQty >= requiredQty ? "allocated" : "partial",
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
    // Active (open/in_progress): consume from fgAvailable, clearedAt = null
    // Shipped: historical record only — allocatedAt = production end, clearedAt = delivery date
    const allSOs = ([...erpSalesOrders.values()] as any[])
        .sort((a, b) => a.requestedDeliveryDate - b.requestedDeliveryDate);

    for (const so of allSOs) {
        const fgItemId   = so.lines[0]?.itemId;
        const requiredQty = so.lines[0]?.quantity ?? 0;
        if (!fgItemId || requiredQty === 0) continue;

        const isShipped = so.status === "shipped";
        const linkedMesPo = mesPOByEsoId.get(so.id);
        const allocatedAt = linkedMesPo
            ? Number(linkedMesPo.timing?.actualEnd ?? linkedMesPo.timing?.scheduledEnd ?? so.orderDate)
            : so.orderDate;

        let allocQty: number;
        let clearedAt: number | null;

        if (isShipped) {
            // Historical record: FG already picked and shipped, don't touch availability
            allocQty  = requiredQty;
            clearedAt = so.requestedDeliveryDate;
        } else {
            const available = fgAvailable.get(fgItemId) ?? 0;
            if (available <= 0) continue;
            allocQty = Math.min(available, requiredQty);
            fgAvailable.set(fgItemId, available - allocQty);
            clearedAt = null;
        }

        wmsStockAllocations.push({
            id:                `ALLOC-${String(allocNum++).padStart(5, "0")}`,
            warehouseId:       delivery,
            locationId:        deliveryBin,
            itemId:            fgItemId,
            quantityAllocated: allocQty,
            quantityRequired:  requiredQty,
            uom:               entities.erpItems.get(fgItemId)?.uom ?? "pcs",
            demandType:        "sales_order",
            productionOrderId: null,
            erpSalesOrderId:   so.id,
            status:            allocQty >= requiredQty ? "allocated" : "partial",
            allocatedAt,
            clearedAt,
        });
    }

    // ========================================================================
    // APS — mirror MES operations
    // ========================================================================

    const apsScheduledOps         = new Map<string, any>();
    const apsSchedOpsByPlan        = new Map<string, any[]>();
    const apsSchedOpsByResource    = new Map<string, any[]>();
    const apsCapacityBuckets:       any[] = [];
    const apsCapBucketsByPlan       = new Map<string, any[]>();
    const apsDemands               = new Map<string, any>();
    const apsDemandList:            string[] = [];
    const apsSupplies              = new Map<string, any>();
    const apsSupplyList:            string[] = [];
    const apsPegging:               any[] = [];

    const planId = entities.apsPlanList[0];
    let scOpNum  = 1;
    let demNum   = 1;
    let supNum   = 1;

    for (const po of placedPOs) {
        // APS supply (mirrors MES production order)
        const supId = `SUP-${String(supNum++).padStart(4, "0")}`;
        const mePo  = mesProductionOrders.get(po.id) as any;
        apsSupplies.set(supId, {
            id: supId, planId, type: "production",
            itemId: po.itemId, quantity: mePo?.quantities?.producedQuantity ?? 0,
            scheduledDate: toUnix(po.end), status: mePo?.status ?? "planned",
        });
        apsSupplyList.push(supId);

        // APS demand (mirrors linked sales order)
        const demId = `DEM-${String(demNum++).padStart(4, "0")}`;
        apsDemands.set(demId, {
            id: demId, planId, type: "customer_order",
            itemId: po.itemId, quantity: mePo?.quantities?.producedQuantity ?? 0,
            requiredDate: toUnix(addDaysToDate(po.end, 2)), status: "open",
        });
        apsDemandList.push(demId);
        apsPegging.push({ demandId: demId, supplyId: supId, quantity: mePo?.quantities?.producedQuantity ?? 0 });

        // Scheduled operations mirroring MES
        for (const op of po.operations) {
            const scId = `SCOP-${String(scOpNum++).padStart(4, "0")}`;
            const opRec = mesOperations.get(op.id) as any;
            const scOp  = {
                id: scId, planId,
                mesOperationId:      op.id,
                mesProductionOrderId: po.id,
                resourceId:          op.workCenterId,
                itemId:              po.itemId,
                scheduledStart:      toUnix(op.start),
                scheduledEnd:        toUnix(op.end),
                status:              opRec?.status ?? "scheduled",
                utilizationPercent:  opRec?.status === "completed" ? 100 : 0,
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
            resourceId:        bucket.workCenterId,
            shiftStart:        bucket.shiftStart,
            shiftEnd:          bucket.shiftEnd,
            shiftName:         bucket.shiftName,
            availableMinutes:  bucket.plannedMinutes,
            loadedMinutes:     bucket.runtimeMinutes,
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

    const qmsNCs        = new Map<string, any>();
    const qmsNCList:     string[] = [];
    const qmsCAPAs      = new Map<string, any>();
    const qmsCAPAList:   string[] = [];
    const qmsAudits     = new Map<string, any>();
    const qmsAuditList:  string[] = [];
    const qmsComplaints = new Map<string, any>();
    const qmsComplaintList: string[] = [];
    const qmsDeviations = new Map<string, any>();
    const qmsDevList:    string[] = [];
    const qmsDocs       = new Map<string, any>();
    const qmsDocList:    string[] = [];

    let ncNum    = 1;
    let capaNum  = 1;
    let auditNum = 1;
    let compNum  = 1;

    // Nonconformances: one per operation with significant scrap (independent of MES linkage for now)
    for (const op of mesOperations.values() as IterableIterator<any>) {
        if (op.scrapQuantity > 0 && op.status === "completed" && rng.bool(0.3)) {
            const ncId   = `NC-${String(ncNum++).padStart(4, "0")}`;
            const detDate = new Date(op.actualEnd * 1000);
            const isRecent = (now.getTime() - detDate.getTime()) < 30 * 86400_000;
            qmsNCs.set(ncId, {
                id: ncId, operationType: op.operationType,
                detectedDate: op.actualEnd, quantity: op.scrapQuantity,
                status: isRecent ? "open" : "closed",
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
        const capaId  = `CAPA-${String(capaNum++).padStart(4, "0")}`;
        const firstNc = qmsNCs.get(ncIds[0])!;
        const hasOpen = ncIds.some(id => qmsNCs.get(id)?.status === "open");
        qmsCAPAs.set(capaId, {
            id: capaId, operationType: opType,
            openedDate: firstNc.detectedDate, linkedNCs: ncIds,
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
                id: audId, scheduledDate: toUnix(d),
                status:        d <= now ? "completed" : "scheduled",
                findingsCount: d <= now ? rng.nextInt(0, 3) : null,
            });
            qmsAuditList.push(audId);
            d = addDaysToDate(d, 91); // ~1 quarter
        }
    }

    // Complaints: ~1 in 10 shipped orders
    for (const so of erpSalesOrders.values()) {
        if (so?.status === "shipped" && rng.bool(0.1)) {
            const cmpId   = `CMP-${String(compNum++).padStart(4, "0")}`;
            const rcvDate = addDaysToDate(new Date(so.requestedDeliveryDate * 1000), rng.nextInt(2, 7));
            const isRecent = (now.getTime() - rcvDate.getTime()) < 30 * 86400_000;
            qmsComplaints.set(cmpId, {
                id: cmpId, salesOrderId: so.id,
                receivedDate: toUnix(rcvDate),
                status: isRecent ? "open" : "closed",
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
            companies:          entities.erpCompanies,
            currencies:         entities.erpCurrencies,
            fiscalPeriods:      erpFiscalPeriods,
            glAccounts:         entities.erpGlAccounts,
            costCenters:        entities.erpCostCenters,
            customers:          entities.erpCustomers,
            suppliers:          entities.erpSuppliers,
            items:              entities.erpItems,
            salesOrders:        erpSalesOrders,
            purchaseOrders:     erpPurchaseOrders,
            invoices:           erpInvoices,
            payments:           erpPayments,
            journalEntries:     erpJournalEntries,
            salesOrderList:     erpSalesOrderList,
            purchaseOrderList:  erpPurchaseOrderList,
            invoiceList:        erpInvoiceList,
            paymentList:        erpPaymentList,
            journalEntryList:   erpJournalEntryList,
            glAccountList:      entities.erpGlAccountList,
            costCenterList:     entities.erpCostCenterList,
            customerList:       entities.erpCustomerList,
            supplierList:       entities.erpSupplierList,
            itemList:           entities.erpItemList,
        },
        aps: {
            plans:                     entities.apsPlans,
            planList:                  entities.apsPlanList,
            scenarios:                 entities.apsScenarios,
            scenarioList:              entities.apsScenarioList,
            resources:                 entities.apsResources,
            resourceList:              entities.apsResourceList,
            scheduledOperations:       apsScheduledOps,
            scheduledOperationsByPlan: apsSchedOpsByPlan,
            scheduledOperationsByResource: apsSchedOpsByResource,
            capacityBuckets:           apsCapacityBuckets,
            capacityBucketsByPlan:     apsCapBucketsByPlan,
            materialAvailability:      [],
            materialAvailabilityByPlan: new Map(),
            exceptions:                new Map(),
            kpis:                      new Map(),
            demands:                   apsDemands,
            demandList:                apsDemandList,
            supplies:                  apsSupplies,
            supplyList:                apsSupplyList,
            pegging:                   apsPegging,
            constraints:               [],
            resourceLoad:              new Map(),
        },
        mes: {
            workCenters:                    entities.workCenters,
            workCenterList:                 entities.workCenterList,
            productionOrders:               mesProductionOrders,
            productionOrderList:            mesProductionOrderList,
            operations:                     mesOperations,
            operationList:                  mesOperationList,
            dispatchItems:                  mesDispatchItems,
            productionEvents:               mesProductionEvents,
            downtimeEvents:                 mesDowntimeEvents,
            oeeTimeseries,
            operationsByProductionOrder:    mesOperationsByPO,
            operationsByWorkCenter:         mesOperationsByWC,
            productionOrdersByLocation:     mesProductionOrdersByLoc,
            productionEventsByOperation:    mesProductionEventsByOp,
            productionEventsByProductionOrder: mesProductionEventsByPO,
            productionEventsByWorkCenter:   mesProductionEventsByWC,
            downtimeByWorkCenter:           mesDowntimeByWC,
            oeeByWorkCenter,
            workCenterTimelines:            mesWorkCenterTimelines,
            routings:                       mesRoutings,
            routingList:                    mesRoutingList,
        },
        eam: {
            assets:                entities.eamAssets,
            assetList:             entities.eamAssetList,
            locations:             entities.eamLocations,
            locationList:          entities.eamLocationList,
            workOrders:            eamWorkOrders,
            workOrderList:         eamWorkOrderList,
            workOrderOperations:   eamWorkOrderOps,
            maintenancePlans:      entities.eamMaintenancePlans,
            maintenancePlanList:   entities.eamMaintenancePlanList,
            maintenanceSchedules:  eamMaintenanceSchedules,
            serviceRequests:       new Map(),
            serviceRequestList:    [],
            inspections:           new Map(),
            inspectionList:        [],
            assetHistory:          eamAssetHistory,
            workOrdersByAsset:     eamWorkOrdersByAsset,
            workOrdersByLocation:  eamWorkOrdersByLoc,
            assetsByLocation:      eamAssetsByLoc,
            maintenancePlansByAsset: new Map(
                entities.eamAssetList.map(id => [
                    id,
                    entities.eamMaintenancePlanList.filter(pid => pid.endsWith(id)),
                ]),
            ),
            inspectionsByAsset:    new Map(),
            serviceRequestsByAsset: new Map(),
        },
        qms: {
            nonconformances:    qmsNCs,
            nonconformanceList: qmsNCList,
            capas:              qmsCAPAs,
            capaList:           qmsCAPAList,
            deviations:         qmsDeviations,
            deviationList:      qmsDevList,
            audits:             qmsAudits,
            auditList:          qmsAuditList,
            complaints:         qmsComplaints,
            complaintList:      qmsComplaintList,
            documents:          qmsDocs,
            documentList:       qmsDocList,
        },
        wms: {
            warehouses:          entities.wmsWarehouses,
            locations:           entities.wmsLocations,
            locationList:        entities.wmsLocationList,
            locationsByWarehouse: entities.wmsLocationsByWarehouse,
            inventoryPositions:  wmsInventoryPositions,
            inventoryByItem:     wmsInventoryByItem,
            inventorySummary:    wmsInventorySummary,
            handlingUnits:       [],
            lotStock:            [],
            serialStock:         [],
            receipts:            wmsReceipts,
            putawayTasks:        wmsPutawayTasks,
            pickTasks:           wmsPickTasks,
            shipments:           wmsShipments,
            cycleCounts:         [],
            inventoryMovements:  wmsMovements,
            stockAllocations:    wmsStockAllocations,
        },
    };
}
