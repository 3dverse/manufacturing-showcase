/**
 * Phase 2 — Timeline placement.
 *
 * Walks each production location's timeline from windowStart to windowEnd,
 * placing Production Orders (with pipeline-staggered operations and probabilistic
 * downtime events) and maintenance gaps (when a PM is due).
 *
 * Nothing in this phase computes quantities or statuses — those are fill-pass concerns.
 */

import type { RNG } from "../rng";
import type { GeneratorConfig } from "../config";
import { getProductionLocations } from "../graph";
import { nextShiftStart, clampToShift, addDays, addWorkingMinutes, workingMinutes } from "../shifts";
import type { POTemplate, DowntimeTemplate, MaintenancePlanTemplate } from "./phase1";

// ---------------------------------------------------------------------------
// Placed entity types (internal to Phase 2 / 3)
// ---------------------------------------------------------------------------

export type PlacedDowntime = {
    id: string;
    templateCode: string;
    description: string;
    operationId: string;
    workCenterId: string;
    start: Date;
    end: Date;
    durationMinutes: number;
};

export type PlacedOperation = {
    id: string;
    operationType: string;
    workCenterId: string;
    workCenterName: string;
    locationId: string;
    poId: string;
    start: Date;
    end: Date;
    setupMinutes: number;
    downtimes: PlacedDowntime[];
};

export type PlacedPO = {
    id: string;
    locationId: string;
    locationName: string;
    itemId: string;
    start: Date; // = ops[0].start
    end: Date; // = ops[last].end
    operations: PlacedOperation[];
    effectiveUnitsPerHour: number; // sampled once per PO: unitsPerHour × U(0.9, 1.1)
    targetWorkingMinutes: number; // working-time duration drawn from config range
};

export type PlacedMaintenanceWO = {
    id: string;
    planId: string;
    assetId: string;
    assetName: string;
    locationId: string;
    start: Date;
    end: Date;
    poId?: string; // set when the WO falls inside a PO's span
};

export type Phase2Result = {
    placedPOs: PlacedPO[];
    posByLocation: Map<string, PlacedPO[]>;
    wosByAsset: Map<string, PlacedMaintenanceWO[]>;
    wosByPO: Map<string, PlacedMaintenanceWO[]>;
    allPlacedWOs: PlacedMaintenanceWO[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCounter() {
    let n = 0;
    return (prefix: string) => `${prefix}-${String(++n).padStart(4, "0")}`;
}

function injectDowntimes(
    op: PlacedOperation,
    templates: DowntimeTemplate[],
    rng: RNG,
    nextId: (prefix: string) => string,
    shifts: GeneratorConfig["shifts"],
    workDays: GeneratorConfig["workDays"],
    exclusionIntervals: Array<{ start: Date; end: Date }>,
): void {
    // 1-in-4 chance of at least one event
    if (!rng.bool(0.25)) return;

    const addEvent = () => {
        const tmpl = rng.pick(templates);
        const duration = rng.nextInt(tmpl.minDurationMinutes, tmpl.maxDurationMinutes);
        // Use working-time span so the offset never lands in nights or weekends
        const opSpan = workingMinutes(op.start, op.end, shifts, workDays);
        if (duration >= opSpan) return;

        const maxOffset = opSpan - duration;
        const offset = rng.nextFloat(0, maxOffset);
        const start = addWorkingMinutes(op.start, offset, shifts, workDays);
        const end = addWorkingMinutes(start, duration, shifts, workDays);

        // Skip if overlapping an existing downtime on this operation
        for (const existing of op.downtimes) {
            if (start < existing.end && end > existing.start) return;
        }

        // Skip if overlapping a maintenance work order
        for (const wo of exclusionIntervals) {
            if (start < wo.end && end > wo.start) return;
        }

        op.downtimes.push({
            id: nextId("DT"),
            templateCode: tmpl.code,
            description: tmpl.description,
            operationId: op.id,
            workCenterId: op.workCenterId,
            start,
            end,
            durationMinutes: duration,
        });
    };

    addEvent();
    if (rng.bool(0.25)) addEvent(); // 1-in-4 chance of a second event
}

// ---------------------------------------------------------------------------
// placeTimeline
// ---------------------------------------------------------------------------

export function placeTimeline(
    config: GeneratorConfig,
    poTemplates: Map<string, POTemplate>,
    downtimeTemplates: DowntimeTemplate[],
    maintenancePlanTemplates: MaintenancePlanTemplate[],
    rng: RNG,
): Phase2Result {
    const nextId = makeCounter();

    const windowStart = new Date(config.now);
    windowStart.setMonth(windowStart.getMonth() - config.monthsBack);
    const windowEnd = new Date(config.now);
    windowEnd.setMonth(windowEnd.getMonth() + config.monthsForward);

    const prodLocations = getProductionLocations(config.site);

    // Distribute productionOrderCount across locations proportional to work-center count
    const totalWCs = prodLocations.reduce((s, l) => s + l.workCenters.length, 0);
    const poCountPerLoc = prodLocations.map((loc) =>
        Math.max(1, Math.round((config.maxProductionOrderCount * loc.workCenters.length) / totalWCs)),
    );

    // Group maintenance plan templates by location
    const pmByLocation = new Map<string, MaintenancePlanTemplate[]>();
    for (const loc of prodLocations) {
        pmByLocation.set(
            loc.hash,
            maintenancePlanTemplates.filter((p) => p.locationId === loc.hash),
        );
    }

    const allPOs: PlacedPO[] = [];
    const allWOs: PlacedMaintenanceWO[] = [];
    const posByLocation = new Map<string, PlacedPO[]>();
    const wosByAsset = new Map<string, PlacedMaintenanceWO[]>();
    const wosByPO = new Map<string, PlacedMaintenanceWO[]>();

    for (let li = 0; li < prodLocations.length; li++) {
        const loc = prodLocations[li];
        const template = poTemplates.get(loc.hash);
        if (!template || template.operations.length === 0) continue;

        const targetPOs = poCountPerLoc[li];
        const locPMs = pmByLocation.get(loc.hash) ?? [];
        const hasPMs = locPMs.length > 0;
        const locPOs: PlacedPO[] = [];

        // Pipeline stagger (in working minutes): time until first item flows to next op
        const cycleTime = 60 / config.unitsPerHour;

        let cursor = nextShiftStart(windowStart, config.shifts, config.workDays);

        for (let i = 0; i < targetPOs && cursor < windowEnd; i++) {
            const effectiveUPH = config.unitsPerHour * rng.nextFloat(0.9, 1.1);
            // Log-uniform: equal probability per order of magnitude → many short POs, few long ones
            const targetWorkingMinutes = Math.round(
                Math.exp(
                    rng.nextFloat(
                        Math.log(config.minOperationWorkingMinutes),
                        Math.log(config.maxOperationWorkingMinutes),
                    ),
                ),
            );
            const poId = nextId("MO");

            // Place operations pipeline-style using working-time arithmetic
            const ops: PlacedOperation[] = template.operations.map((opTmpl, j) => {
                const stagger = opTmpl.setupMinutes + cycleTime;
                const opStart = addWorkingMinutes(cursor, j * stagger, config.shifts, config.workDays);
                const opEnd = addWorkingMinutes(opStart, targetWorkingMinutes, config.shifts, config.workDays);
                return {
                    id: nextId("OP"),
                    operationType: opTmpl.operationType,
                    workCenterId: opTmpl.workCenterId,
                    workCenterName: opTmpl.workCenterName,
                    locationId: loc.hash,
                    poId,
                    start: opStart,
                    end: opEnd,
                    setupMinutes: opTmpl.setupMinutes,
                    downtimes: [],
                };
            });

            const po: PlacedPO = {
                id: poId,
                locationId: loc.hash,
                locationName: loc.name,
                itemId: template.itemId,
                start: ops[0].start,
                end: ops[ops.length - 1].end,
                operations: ops,
                effectiveUnitsPerHour: effectiveUPH,
                targetWorkingMinutes,
            };

            // ---- Inject maintenance WOs first so downtime placement can avoid them ----
            // Any PM that becomes due before po.end is placed at the next shift
            // start at or after its due date (clamped to within the PO span).
            if (hasPMs) {
                for (const pm of locPMs) {
                    while (pm.nextDue <= po.end) {
                        // If due date falls before the PO started (e.g. over a weekend
                        // between two POs), clamp to the PO's start.
                        const effectiveDue = pm.nextDue < po.start ? po.start : pm.nextDue;
                        const woStart = clampToShift(effectiveDue, config.shifts, config.workDays);
                        if (woStart >= po.end) break; // doesn't fit — leave for next PO

                        // WO must start and end within a single operation
                        const containingOp = ops.find((op) => woStart >= op.start && woStart < op.end);
                        if (!containingOp) {
                            pm.nextDue = addDays(pm.nextDue, pm.frequencyDays);
                            continue;
                        }

                        const woEndUnclamped = addWorkingMinutes(
                            woStart,
                            pm.pmDurationHours * 60,
                            config.shifts,
                            config.workDays,
                        );
                        const woEnd = woEndUnclamped < containingOp.end ? woEndUnclamped : containingOp.end;

                        const wo: PlacedMaintenanceWO = {
                            id: nextId("WO"),
                            planId: pm.planId,
                            assetId: pm.assetId,
                            assetName: pm.assetName,
                            locationId: loc.hash,
                            start: woStart,
                            end: woEnd,
                            poId: po.id,
                        };

                        const byAsset = wosByAsset.get(pm.assetId) ?? [];
                        byAsset.push(wo);
                        wosByAsset.set(pm.assetId, byAsset);

                        const byPO = wosByPO.get(po.id) ?? [];
                        byPO.push(wo);
                        wosByPO.set(po.id, byPO);

                        allWOs.push(wo);
                        pm.nextDue = addDays(pm.nextDue, pm.frequencyDays);
                    }
                }
            }

            // Inject downtimes after WOs so they can be excluded from WO intervals
            const posWOs = wosByPO.get(po.id) ?? [];
            for (const op of ops) {
                injectDowntimes(op, downtimeTemplates, rng, nextId, config.shifts, config.workDays, posWOs);
            }

            // Extend op and PO ends to account for WO time: WOs pause the entire
            // production line, so the PO needs extra wall-clock time to complete
            // its targetWorkingMinutes of net productive work.
            if (posWOs.length > 0) {
                const totalWoWorkingMins = posWOs.reduce(
                    (s, wo) => s + workingMinutes(wo.start, wo.end, config.shifts, config.workDays),
                    0,
                );
                for (const op of ops) {
                    op.end = addWorkingMinutes(op.end, totalWoWorkingMins, config.shifts, config.workDays);
                }
                po.end = ops[ops.length - 1].end;
            }

            locPOs.push(po);
            allPOs.push(po);
            cursor = clampToShift(po.end, config.shifts, config.workDays);
        }

        posByLocation.set(loc.hash, locPOs);
    }

    // ---- Dedicated PM pass for locations with no valid PO template ----
    for (const loc of prodLocations) {
        if (posByLocation.has(loc.hash)) continue;

        const locPMs = pmByLocation.get(loc.hash) ?? [];
        if (locPMs.length === 0) continue;

        for (const pm of locPMs) {
            let due = new Date(pm.nextDue);
            while (due < windowEnd) {
                const woStart = nextShiftStart(due, config.shifts, config.workDays);
                if (woStart >= windowEnd) break;
                const woEnd = addWorkingMinutes(woStart, pm.pmDurationHours * 60, config.shifts, config.workDays);

                const wo: PlacedMaintenanceWO = {
                    id: nextId("WO"),
                    planId: pm.planId,
                    assetId: pm.assetId,
                    assetName: pm.assetName,
                    locationId: loc.hash,
                    start: woStart,
                    end: woEnd,
                };

                const list = wosByAsset.get(pm.assetId) ?? [];
                list.push(wo);
                wosByAsset.set(pm.assetId, list);
                allWOs.push(wo);

                due = addDays(due, pm.frequencyDays);
            }
        }
    }

    return { placedPOs: allPOs, posByLocation, wosByAsset, wosByPO, allPlacedWOs: allWOs };
}
