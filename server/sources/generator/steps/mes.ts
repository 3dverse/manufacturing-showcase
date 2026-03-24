import type { GeneratorConfig, WorkCenterTimeline, OEEBucket, ItemDefinition } from "../types";
import type { RNG } from "../rng";
import { getWorkCentersForLocation, getProductionLocations } from "../graph";
import { generateShiftRoster } from "../timeline";
import type { LocationNode, WorkCenterNode } from "../../operations/dataset/generateDataset";
import {
    type OperationTemplate,
    OPERATION_TEMPLATES,
    DEFAULT_OPERATION_TEMPLATE,
    ALL_OP_TYPES,
} from "../operationTemplates";

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

// Consume `minutes` of shift time from `from`, skipping gaps between shifts.
function advanceShiftMins(from: Date, minutes: number, shiftRoster: { shiftStart: Date; shiftEnd: Date }[]): Date {
    let remaining = minutes;
    let pos = new Date(from);
    for (const slot of shiftRoster) {
        if (remaining <= 0) break;
        if (pos >= slot.shiftEnd) continue;
        if (pos < slot.shiftStart) pos = new Date(slot.shiftStart);
        const avail = minutesBetween(pos, slot.shiftEnd);
        const consume = Math.min(remaining, avail);
        pos = addMinutes(pos, consume);
        remaining -= consume;
    }
    return pos;
}

// First shift start at or after `after`.
function nextShiftStart(after: Date, shiftRoster: { shiftStart: Date; shiftEnd: Date }[]): Date | null {
    for (const slot of shiftRoster) {
        if (slot.shiftEnd <= after) continue;
        return slot.shiftStart >= after ? slot.shiftStart : after;
    }
    return null;
}

// Items eligible for a production location: bidirectional match.
// - Every routing step must have a matching workCenter in the location (location can produce the item).
// - Every tagged workCenter's op type must be used by at least one routing step (no idle workCenters).
// WorkCenters without an operationType tag are treated as general-purpose (no routing restriction).
function eligibleItemsForLocation(location: LocationNode, items: ItemDefinition[]): ItemDefinition[] {
    const workCenters = getWorkCentersForLocation(location);
    const hasUntagged = workCenters.some((c) => !c.tags["operationType"]);
    if (hasUntagged) {
        return items.filter((i) => i.itemType === "finished_good" && i.routing.length > 0);
    }
    const opTypes = new Set(workCenters.map((c) => c.tags["operationType"] as string));
    const itemOpTypes = (i: ItemDefinition) => new Set(i.routing.map((s) => s.workCenterOperationType));
    return items.filter((i) => {
        if (i.itemType !== "finished_good" || i.routing.length === 0) return false;
        const used = itemOpTypes(i);
        if (!i.routing.every((step) => opTypes.has(step.workCenterOperationType))) return false;
        if (![...opTypes].every((t) => used.has(t))) return false;
        return true;
    });
}

// ---------------------------------------------------------------------------
export function generateMES(
    config: GeneratorConfig,
    structural: { workCenters: Map<string, any>; workCenterList: string[] },
    _aps: any,
    _eam: any,
    rng: RNG,
): any {
    const { now, monthsBack, monthsForward, items, site } = config;
    const windowStart = addDays(now, -monthsBack * 30);
    const windowEnd = addDays(now, monthsForward * 30);
    const siteId = config.siteId!;

    const productionOrders = new Map<string, any>();
    const productionOrderList: string[] = [];
    const operations = new Map<string, any>();
    const operationList: string[] = [];
    const dispatchItems: any[] = [];
    const productionEvents: any[] = [];
    const downtimeEvents: any[] = [];
    const oeeTimeseries: OEEBucket[] = [];
    const workCenterTimelines = new Map<string, WorkCenterTimeline>();

    const operationsByProductionOrder = new Map<string, string[]>();
    const operationsByWorkCenter = new Map<string, string[]>();
    const productionOrdersByLocation = new Map<string, string[]>();
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

    const shiftRoster = generateShiftRoster(config.shifts, windowStart, windowEnd);
    const firstShiftStart = shiftRoster[0]?.shiftStart ?? windowStart;

    // Initialise per-work-center index maps
    for (const location of site.locations) {
        productionOrdersByLocation.set(location.hash, []);
        for (const workCenter of getWorkCentersForLocation(location)) {
            operationsByWorkCenter.set(workCenter.hash, []);
            productionEventsByWorkCenter.set(workCenter.hash, []);
            downtimeByWorkCenter.set(workCenter.hash, []);
            oeeByWorkCenter.set(workCenter.hash, []);
        }
    }

    // =========================================================================
    // Pass 1 — Location-driven PO generation
    //
    // Each production location drives its own non-overlapping PO timeline:
    //
    //   [maintenance gap]  →  [production order]  →  [maintenance gap]  →  …
    //
    // Within each PO, operations are scheduled pipeline-style (see heuristics.md).
    // Planned maintenance windows emit a downtime event on every workCenter in the location.
    // Unplanned equipment failures (25% chance) emit a single-workCenter failure event.
    // =========================================================================

    const MAINT_MIN_MINS = 2 * 60;
    const MAINT_MAX_MINS = 8 * 60;

    const productionLocations = getProductionLocations(site);

    for (const location of productionLocations) {
        const locationWorkCenters = getWorkCentersForLocation(location).sort((a, b) => a.ordinal - b.ordinal);
        const locationId = location.hash;

        // Build the operation type sequence for this location:
        // unique op types in work-center ordinal order, each with its candidate workCenters.
        // Untagged workCenters are assigned a random op type from the hardcoded list.
        const opTypeSequence: Array<{ opType: string; template: OperationTemplate; workCenters: WorkCenterNode[] }> =
            [];
        const seenOpTypes = new Map<string, number>(); // opType → index in opTypeSequence
        for (const workCenter of locationWorkCenters) {
            const opType = (workCenter.tags["operationType"] as string | undefined) ?? rng.pick([...ALL_OP_TYPES]);
            if (!seenOpTypes.has(opType)) {
                seenOpTypes.set(opType, opTypeSequence.length);
                opTypeSequence.push({
                    opType,
                    template: OPERATION_TEMPLATES[opType] ?? DEFAULT_OPERATION_TEMPLATE,
                    workCenters: [],
                });
            }
            opTypeSequence[seenOpTypes.get(opType)!].workCenters.push(workCenter);
        }

        const eligible = eligibleItemsForLocation(location, items);
        if (eligible.length === 0) continue;

        // Per-workCenter availability cursors
        const workCenterCursors = new Map<string, Date>();
        for (const workCenter of locationWorkCenters) workCenterCursors.set(workCenter.hash, new Date(firstShiftStart));

        let cursor: Date = new Date(firstShiftStart);
        let isFirst = true;

        while (cursor < windowEnd) {
            // ------------------------------------------------------------------
            // Planned maintenance window (between every pair of POs)
            // ------------------------------------------------------------------
            if (!isFirst) {
                const maintMins = rng.nextFloat(MAINT_MIN_MINS, MAINT_MAX_MINS);
                const maintStart = new Date(cursor);
                const maintEnd = addMinutes(maintStart, maintMins);

                if (maintStart < now) {
                    for (const workCenter of locationWorkCenters) {
                        const dtId = `DT-${String(dtNum++).padStart(6, "0")}`;
                        const dtEvent = {
                            id: dtId,
                            siteId,
                            workCenterId: workCenter.hash,
                            startedAt: toUnix(maintStart),
                            endedAt: toUnix(maintEnd < now ? maintEnd : now),
                            durationMinutes: Math.round(maintMins),
                            reasonCode: "PLANNED_MAINTENANCE",
                            reasonDescription: "Scheduled preventive maintenance window",
                            productionOrderId: null,
                            operationId: null,
                        };
                        downtimeEvents.push(dtEvent);
                        downtimeByWorkCenter.get(workCenter.hash)!.push(dtEvent);
                    }
                }

                const next = nextShiftStart(maintEnd, shiftRoster);
                if (!next || next >= windowEnd) break;
                cursor = next;
                for (const workCenter of locationWorkCenters) workCenterCursors.set(workCenter.hash, new Date(cursor));
            }
            isFirst = false;

            // ------------------------------------------------------------------
            // Production Order: pipeline-schedule one operation per op type
            // ------------------------------------------------------------------
            const item = rng.pick(eligible);
            const qty = rng.nextInt(20, 120);

            const poId = `MO-${String(poNum++).padStart(6, "0")}`;
            operationsByProductionOrder.set(poId, []);
            productionEventsByProductionOrder.set(poId, []);

            const allOpIds: string[] = [];

            // Pipeline cursor: tracks when the next op can start
            // (advances by one stagger after each op is placed)
            let opStartCursor = new Date(cursor);
            // Tracks end of the previous op so faster downstream stations
            // wait for the bottleneck to deliver each item
            let prevOpEnd: Date | null = null;

            for (let i = 0; i < opTypeSequence.length; i++) {
                const { template, workCenters } = opTypeSequence[i];

                // Pick the least-loaded workCenter among those with this op type
                const workCenter = workCenters.reduce((best, c) =>
                    (workCenterCursors.get(c.hash)?.getTime() ?? 0) < (workCenterCursors.get(best.hash)?.getTime() ?? 0)
                        ? c
                        : best,
                );

                const earliest = new Date(
                    Math.max(
                        opStartCursor.getTime(),
                        (workCenterCursors.get(workCenter.hash) ?? opStartCursor).getTime(),
                    ),
                );
                const opStart = nextShiftStart(earliest, shiftRoster) ?? earliest;
                const opDurationMins = template.setupMinutes + qty * template.cycleMinutesPerItem;
                // Throughput end: how long this station takes at its own rate
                const throughputEnd = advanceShiftMins(opStart, opDurationMins, shiftRoster);
                // Pipeline constraint: this station can't finish before the previous one
                // has delivered all items (prevOpEnd + 1 cycle at this station's rate)
                const pipelineEnd: Date = prevOpEnd
                    ? advanceShiftMins(prevOpEnd, template.cycleMinutesPerItem, shiftRoster)
                    : throughputEnd;
                const opEnd: Date = pipelineEnd > throughputEnd ? pipelineEnd : throughputEnd;

                const opId = createOperation({
                    opNum: opNum++,
                    poId,
                    siteId,
                    template,
                    sequence: i + 1,
                    opStart,
                    opEnd,
                    qty,
                    workCenter,
                    lotNum: lotNum++,
                    now,
                    rng,
                    operations,
                    operationList,
                    operationsByProductionOrder,
                    operationsByWorkCenter,
                });
                allOpIds.push(opId);

                workCenterCursors.set(workCenter.hash, opEnd);
                prevOpEnd = opEnd;

                // Pipeline stagger: next op starts when the first item
                // flows out of this op = setup + 1 cycle
                if (i < opTypeSequence.length - 1) {
                    const staggerMins = template.setupMinutes + template.cycleMinutesPerItem;
                    opStartCursor = advanceShiftMins(opStart, staggerMins, shiftRoster);
                }
            }

            if (allOpIds.length === 0) {
                cursor = addMinutes(cursor, 60);
                continue;
            }

            // Assemble PO from its operations
            const allOps = allOpIds.map((id) => operations.get(id)!);
            const poStartTs = Math.min(...allOps.map((o) => o.scheduledStart));
            const poEndTs = Math.max(...allOps.map((o) => o.scheduledEnd));
            const poStartDate = new Date(poStartTs * 1000);
            const poEndDate = new Date(poEndTs * 1000);

            let poStatus: string;
            if (poEndDate < now) poStatus = "completed";
            else if (poStartDate > now) poStatus = "released";
            else poStatus = "in_progress";

            // Pipeline: each item flows through all ops sequentially.
            // The PO's final output = the last started op's output.
            // Scrap is cumulative across all ops (each step loses some items).
            const startedOps = allOps.filter((o) => o.status !== "ready");
            const lastStartedOp = startedOps[startedOps.length - 1];
            const totalGood    = lastStartedOp?.quantities.goodQuantity    ?? 0;
            const totalProduced = lastStartedOp?.quantities.producedQuantity ?? 0;
            const totalScrap   = allOps.reduce((s, o) => s + o.quantities.scrapQuantity, 0);
            const outputLots   = allOps.flatMap((o) => o.quantities.outputLotNumbers as string[]);

            const po: any = {
                id: poId,
                orderNumber: poId,
                siteId,
                locationId,
                itemCode: item.id,
                itemDescription: item.name,
                status: poStatus,
                priority: rng.nextInt(1, 5),
                quantities: {
                    plannedQuantity: qty,
                    producedQuantity: totalProduced,
                    goodQuantity: totalGood,
                    scrapQuantity: totalScrap,
                    uom: item.uom,
                    outputLotNumbers: outputLots,
                },
                timing: {
                    scheduledStart: poStartTs,
                    scheduledEnd: poEndTs,
                    actualStart: poStatus !== "released" ? poStartTs : null,
                    actualEnd: poStatus === "completed" ? poEndTs : null,
                },
                operationIds: allOpIds,
                currentOperationId: allOps.find((o) => o.status === "in_progress")?.id ?? null,
                progressPercent: (() => {
                    if (poStatus === "completed") return 100;
                    if (poStatus === "released")  return 0;
                    const completedCount  = allOps.filter((o) => o.status === "completed").length;
                    const inProgressOp    = allOps.find((o) => o.status === "in_progress");
                    const inProgressFrac  = inProgressOp ? inProgressOp.progressPercent / 100 : 0;
                    return Math.round(((completedCount + inProgressFrac) / allOps.length) * 100);
                })(),
                notes: "",
                erpSalesOrderId: null,
                apsPlanId: null,
            };

            productionOrders.set(poId, po);
            productionOrderList.push(poId);
            productionOrdersByLocation.get(locationId)!.push(poId);

            // ------------------------------------------------------------------
            // Unplanned downtime: 25% chance of equipment failure on one workCenter
            // ------------------------------------------------------------------
            if (poStartDate < now && rng.bool(0.25)) {
                const failWorkCenter = rng.pick(locationWorkCenters);
                const wallSpan = poEndDate.getTime() - poStartDate.getTime();
                const dtOffset = rng.nextFloat(0.15, 0.75);
                const dtStart = new Date(poStartDate.getTime() + wallSpan * dtOffset);
                if (dtStart < now) {
                    const dtDurMins = rng.nextFloat(30, 180);
                    const dtEnd = addMinutes(dtStart, dtDurMins);
                    const dtId = `DT-${String(dtNum++).padStart(6, "0")}`;
                    const opDuring = allOpIds
                        .map((id) => operations.get(id)!)
                        .find((o) => o.workCenterId === failWorkCenter.hash);
                    const dtEvent = {
                        id: dtId,
                        siteId,
                        workCenterId: failWorkCenter.hash,
                        startedAt: toUnix(dtStart),
                        endedAt: dtEnd < now ? toUnix(dtEnd) : null,
                        durationMinutes: Math.round(dtDurMins),
                        reasonCode: "EQUIPMENT_FAILURE",
                        reasonDescription: "Unplanned equipment breakdown",
                        productionOrderId: poId,
                        operationId: opDuring?.id ?? null,
                    };
                    downtimeEvents.push(dtEvent);
                    downtimeByWorkCenter.get(failWorkCenter.hash)?.push(dtEvent);
                }
            }

            // Advance location cursor to end of last op (last work center free)
            cursor = new Date(poEndTs * 1000);
            for (const workCenter of locationWorkCenters) {
                if ((workCenterCursors.get(workCenter.hash)?.getTime() ?? 0) < cursor.getTime()) {
                    workCenterCursors.set(workCenter.hash, new Date(cursor));
                }
            }
        }
    }

    // =========================================================================
    // Pass 2 — Production events, OEE, work center status
    // =========================================================================

    for (const location of site.locations) {
        for (const workCenter of getWorkCentersForLocation(location)) {
            const wcId = workCenter.hash;
            const workCenterOpIds = operationsByWorkCenter.get(wcId) ?? [];
            const timeline: WorkCenterTimeline = { workCenterId: wcId, entries: [] };

            for (const slot of shiftRoster) {
                const shiftDurationMins = minutesBetween(slot.shiftStart, slot.shiftEnd);
                let shiftRuntimeMins = 0;
                let shiftDowntimeMins = 0;
                let shiftProduced = 0;
                let shiftGood = 0;
                let shiftScrap = 0;
                let shiftUom = "pcs";

                const seenDt = new Set<string>();
                for (const dt of downtimeByWorkCenter.get(wcId) ?? []) {
                    if (seenDt.has(dt.id)) continue;
                    const dtStart = new Date(dt.startedAt * 1000);
                    const dtEnd = dt.endedAt ? new Date(dt.endedAt * 1000) : addMinutes(dtStart, dt.durationMinutes);
                    if (dtEnd <= slot.shiftStart || dtStart >= slot.shiftEnd) continue;
                    seenDt.add(dt.id);
                    const overlap = minutesBetween(
                        dtStart < slot.shiftStart ? slot.shiftStart : dtStart,
                        dtEnd > slot.shiftEnd ? slot.shiftEnd : dtEnd,
                    );
                    shiftDowntimeMins += overlap;
                    timeline.entries.push({ type: "downtime", start: dtStart, end: dtEnd, entityId: dt.id });
                }

                for (const opId of workCenterOpIds) {
                    const op = operations.get(opId);
                    if (!op) continue;
                    const opStart = new Date(op.scheduledStart * 1000);
                    const opEnd = new Date(op.scheduledEnd * 1000);
                    if (opEnd <= slot.shiftStart || opStart >= slot.shiftEnd) continue;

                    const clipStart = opStart < slot.shiftStart ? slot.shiftStart : opStart;
                    const clipEnd = opEnd > slot.shiftEnd ? slot.shiftEnd : opEnd;
                    const runMins = minutesBetween(clipStart, clipEnd);
                    if (runMins <= 0) continue;

                    timeline.entries.push({ type: "operation", start: clipStart, end: clipEnd, entityId: opId });
                    shiftRuntimeMins += runMins;
                    shiftProduced += op.quantities.producedQuantity;
                    shiftGood += op.quantities.goodQuantity;
                    shiftScrap += op.quantities.scrapQuantity;
                    shiftUom = op.quantities.uom;

                    if (clipStart >= now) continue;

                    if (!productionEventsByOperation.has(opId)) {
                        productionEventsByOperation.set(opId, []);
                    }
                    const evts = productionEventsByOperation.get(opId)!;

                    if (evts.length === 0) {
                        const e = mkEvt(
                            evtNum++,
                            siteId,
                            toUnix(clipStart),
                            "operation_started",
                            op.productionOrderId,
                            opId,
                            wcId,
                            null,
                            null,
                            null,
                            null,
                            `Operation ${op.operationCode} started`,
                        );
                        evts.push(e);
                        productionEvents.push(e);
                        productionEventsByWorkCenter.get(wcId)!.push(e);
                        productionEventsByProductionOrder.get(op.productionOrderId)?.push(e);
                    }

                    let qCursor = addMinutes(clipStart, 30);
                    const qEnd = clipEnd < now ? clipEnd : now;
                    while (qCursor < qEnd) {
                        const q = Math.round((op.quantities.goodQuantity / Math.max(1, runMins)) * 30);
                        const e = mkEvt(
                            evtNum++,
                            siteId,
                            toUnix(qCursor),
                            "quantity_reported",
                            op.productionOrderId,
                            opId,
                            wcId,
                            q,
                            shiftUom,
                            null,
                            op._lotNumber,
                            `${q} ${shiftUom} reported`,
                        );
                        evts.push(e);
                        productionEvents.push(e);
                        productionEventsByWorkCenter.get(wcId)!.push(e);
                        productionEventsByProductionOrder.get(op.productionOrderId)?.push(e);
                        qCursor = addMinutes(qCursor, 30);
                    }

                    if (op._defectBreakdown?.length > 0 && clipEnd < now) {
                        for (let di = 0; di < op._defectBreakdown.length; di++) {
                            const { defectCode, quantity } = op._defectBreakdown[di];
                            const e = mkEvt(
                                evtNum++,
                                siteId,
                                toUnix(addMinutes(clipEnd, -(5 + di))),
                                "scrap_reported",
                                op.productionOrderId,
                                opId,
                                wcId,
                                quantity,
                                shiftUom,
                                "DEFECT",
                                op._lotNumber,
                                `${quantity} ${shiftUom} scrapped (${defectCode})`,
                            );
                            evts.push(e);
                            productionEvents.push(e);
                            productionEventsByWorkCenter.get(wcId)!.push(e);
                            productionEventsByProductionOrder.get(op.productionOrderId)?.push(e);
                        }
                    }

                    if (op.status === "completed" && clipEnd < now) {
                        const e = mkEvt(
                            evtNum++,
                            siteId,
                            toUnix(clipEnd),
                            "operation_completed",
                            op.productionOrderId,
                            opId,
                            wcId,
                            op.quantities.goodQuantity,
                            shiftUom,
                            null,
                            op._lotNumber,
                            `Operation ${op.operationCode} completed`,
                        );
                        evts.push(e);
                        productionEvents.push(e);
                        productionEventsByWorkCenter.get(wcId)!.push(e);
                    }
                }

                if (slot.shiftEnd <= now) {
                    const availPct =
                        shiftDurationMins > 0
                            ? Math.min(
                                  100,
                                  (shiftRuntimeMins / Math.max(1, shiftDurationMins - shiftDowntimeMins)) * 100,
                              )
                            : 0;
                    const perfPct = shiftProduced > 0 ? Math.min(100, rng.nextFloat(80, 98)) : 0;
                    const qualPct =
                        shiftProduced > 0 ? Math.max(0, ((shiftProduced - shiftScrap) / shiftProduced) * 100) : 100;
                    const oeePct = (availPct / 100) * (perfPct / 100) * (qualPct / 100) * 100;

                    const bucket: OEEBucket = {
                        workCenterId: wcId,
                        shiftStart: toUnix(slot.shiftStart),
                        shiftEnd: toUnix(slot.shiftEnd),
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
                    oeeByWorkCenter.get(wcId)!.push(bucket);
                }
            }

            const seenEntities = new Set<string>();
            timeline.entries = timeline.entries.filter((e) => {
                if (e.type !== "downtime") return true;
                if (seenEntities.has(e.entityId)) return false;
                seenEntities.add(e.entityId);
                return true;
            });
            timeline.entries.sort((a, b) => a.start.getTime() - b.start.getTime());
            workCenterTimelines.set(wcId, timeline);

            const wc = structural.workCenters.get(wcId)!;
            if (!wc) continue;
            const nowT = now.getTime();
            const cur = timeline.entries.find((e) => e.start.getTime() <= nowT && e.end.getTime() > nowT);
            if (cur) {
                if (cur.type === "downtime") {
                    wc.status = "down";
                } else {
                    const op = operations.get(cur.entityId);
                    wc.status = "running";
                    wc.activeProductionOrderId = op?.productionOrderId ?? null;
                    wc.activeOperationId = op?.id ?? null;
                }
            } else {
                wc.status = timeline.entries.some((e) => e.start.getTime() > nowT) ? "idle" : "starved";
            }

            const wcOee = oeeByWorkCenter.get(wcId) ?? [];
            wc.runtimeMinutes = wcOee.reduce((s, b) => s + b.runtimeMinutes, 0);
            wc.downtimeMinutes = wcOee.reduce((s, b) => s + b.downtimeMinutes, 0);
            wc.goodQuantity = wcOee.reduce((s, b) => s + b.goodQuantity, 0);
            wc.scrapQuantity = wcOee.reduce((s, b) => s + b.scrapQuantity, 0);
            wc.queueLength = (operationsByWorkCenter.get(wcId) ?? []).filter((id: string) => {
                return operations.get(id)?.status === "ready";
            }).length;
            const totalPlanned = wcOee.reduce((s, b) => s + b.plannedMinutes, 0);
            wc.utilizationPercent =
                totalPlanned > 0 ? Math.round((wc.runtimeMinutes / totalPlanned) * 100 * 10) / 10 : 0;
        }
    }

    // =========================================================================
    // Dispatch list
    // =========================================================================
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
            dispatchItems.push({
                id: `DSP-${String(dspNum++).padStart(6, "0")}`,
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

    productionEvents.sort((a, b) => a.occurredAt - b.occurredAt);
    downtimeEvents.sort((a, b) => a.startedAt - b.startedAt);
    oeeTimeseries.sort((a, b) => a.shiftStart - b.shiftStart);

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
        productionOrdersByLocation,
        productionEventsByOperation,
        productionEventsByProductionOrder,
        productionEventsByWorkCenter,
        downtimeByWorkCenter,
        oeeByWorkCenter,
        workCenterTimelines,
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CreateOpParams {
    opNum: number;
    poId: string;
    siteId: string;
    template: OperationTemplate;
    sequence: number;
    opStart: Date;
    opEnd: Date;
    qty: number;
    workCenter: WorkCenterNode;
    lotNum: number;
    now: Date;
    rng: RNG;
    operations: Map<string, any>;
    operationList: string[];
    operationsByProductionOrder: Map<string, string[]>;
    operationsByWorkCenter: Map<string, string[]>;
}

function createOperation(p: CreateOpParams): string {
    const opId = `OPR-${String(p.opNum).padStart(6, "0")}`;
    const opStartTs = toUnix(p.opStart);
    const opEndTs = toUnix(p.opEnd);

    let opStatus: string;
    if (p.opEnd < p.now) opStatus = "completed";
    else if (p.opStart > p.now) opStatus = "ready";
    else opStatus = "in_progress";

    const scrapRate = Math.max(0, p.rng.gaussian(0.02, 0.01));
    const progressFraction =
        opStatus === "completed" ? 1
        : opStatus === "in_progress"
          ? Math.min(1, (p.now.getTime() - p.opStart.getTime()) / Math.max(1, p.opEnd.getTime() - p.opStart.getTime()))
          : 0;
    const producedQty = Math.round(p.qty * progressFraction);
    const scrapQty = Math.round(producedQty * scrapRate);
    const goodQty = producedQty - scrapQty;
    const lotNumber = `LOT-${String(p.lotNum).padStart(6, "0")}`;

    let defectBreakdown: { defectCode: string; quantity: number }[] = [];
    if (scrapQty > 0 && p.template.defects.length > 0) {
        const n = p.rng.nextInt(1, Math.min(3, p.template.defects.length));
        const defects = p.rng.shuffle([...p.template.defects]).slice(0, n);
        let rem = scrapQty;
        for (let di = 0; di < defects.length; di++) {
            const q = di === defects.length - 1 ? rem : Math.max(1, Math.round(rem * p.rng.nextFloat(0.2, 0.6)));
            rem -= q;
            if (q > 0) defectBreakdown.push({ defectCode: defects[di], quantity: q });
        }
    } else if (scrapQty > 0) {
        defectBreakdown = [{ defectCode: "DEFECT", quantity: scrapQty }];
    }

    const op: any = {
        id: opId,
        productionOrderId: p.poId,
        operationCode: p.template.operationCode,
        operationDescription: p.template.operationDescription,
        sequence: p.sequence,
        status: opStatus,
        workCenterId: p.workCenter.hash,
        eamAssetId: p.workCenter.machines.length > 0 ? p.rng.pick(p.workCenter.machines).hash : null,
        plannedSetupTimeMinutes: p.template.setupMinutes,
        plannedRunTimeMinutes: Math.round(p.qty * p.template.cycleMinutesPerItem),
        actualSetupTimeMinutes:
            opStatus !== "ready" ? Math.round(p.template.setupMinutes * p.rng.nextFloat(0.8, 1.3)) : null,
        actualRunTimeMinutes:
            opStatus === "completed"
                ? Math.round(p.qty * p.template.cycleMinutesPerItem * p.rng.nextFloat(0.9, 1.1))
                : null,
        quantities: {
            plannedQuantity: p.qty,
            producedQuantity: producedQty,
            goodQuantity: goodQty,
            scrapQuantity: scrapQty,
            uom: "pcs",
            outputLotNumbers: producedQty > 0 ? [lotNumber] : [],
        },
        scheduledStart: opStartTs,
        scheduledEnd: opEndTs,
        actualStart: opStatus !== "ready" ? opStartTs : null,
        actualEnd: opStatus === "completed" ? opEndTs : null,
        progressPercent: Math.round(progressFraction * 100),
        _scrapRate: scrapRate,
        _scrapQty: scrapQty,
        _lotNumber: lotNumber,
        _defectBreakdown: defectBreakdown,
    };

    p.operations.set(opId, op);
    p.operationList.push(opId);
    p.operationsByProductionOrder.get(p.poId)?.push(opId);
    p.operationsByWorkCenter.get(p.workCenter.hash)?.push(opId);

    return opId;
}

function mkEvt(
    num: number,
    siteId: string,
    occurredAt: number,
    eventType: string,
    productionOrderId: string | null,
    operationId: string | null,
    workCenterId: string,
    quantity: number | null,
    uom: string | null,
    reasonCode: string | null,
    lotNumber: string | null,
    message: string,
): any {
    return {
        id: `EVT-${String(num).padStart(8, "0")}`,
        siteId,
        occurredAt,
        eventType,
        productionOrderId,
        operationId,
        workCenterId,
        quantity,
        uom,
        reasonCode,
        defectCode: null,
        lotNumber,
        message,
    };
}
