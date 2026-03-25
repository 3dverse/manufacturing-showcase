/**
 * Phase 2 — Timeline placement.
 *
 * Walks each production location's timeline from windowStart to windowEnd,
 * placing Production Orders (with pipeline-staggered operations and probabilistic
 * downtime events) and maintenance gaps (when a PM is due).
 *
 * Nothing in this phase computes quantities or statuses — those are fill-pass concerns.
 */

import type { RNG } from "../../generator/rng";
import type { GeneratorConfig } from "../config";
import { getProductionLocations } from "../../generator/graph";
import { nextShiftStart, clampToShift, addMinutes, addDays } from "../shifts";
import type {
    POTemplate,
    DowntimeTemplate,
    MaintenancePlanTemplate,
} from "./phase1";

// ---------------------------------------------------------------------------
// Placed entity types (internal to Phase 2 / 3)
// ---------------------------------------------------------------------------

export type PlacedDowntime = {
    id:              string;
    templateCode:    string;
    description:     string;
    operationId:     string;
    workCenterId:    string;
    start:           Date;
    end:             Date;
    durationMinutes: number;
};

export type PlacedOperation = {
    id:             string;
    operationType:  string;
    workCenterId:   string;
    workCenterName: string;
    locationId:     string;
    poId:           string;
    start:          Date;
    end:            Date;
    setupMinutes:   number;
    downtimes:      PlacedDowntime[];
};

export type PlacedPO = {
    id:                    string;
    locationId:            string;
    locationName:          string;
    itemId:                string;
    start:                 Date;  // = ops[0].start
    end:                   Date;  // = ops[last].end
    operations:            PlacedOperation[];
    effectiveUnitsPerHour: number; // sampled once per PO: unitsPerHour × U(0.9, 1.1)
};

export type PlacedMaintenanceWO = {
    id:         string;
    planId:     string;
    assetId:    string;
    assetName:  string;
    locationId: string;
    start:      Date;
    end:        Date;
};

export type PlacedGap = {
    locationId: string;
    start:      Date;
    end:        Date;
    workOrders: PlacedMaintenanceWO[];
};

export type Phase2Result = {
    placedPOs:      PlacedPO[];
    placedGaps:     PlacedGap[];
    posByLocation:  Map<string, PlacedPO[]>;
    wosByAsset:     Map<string, PlacedMaintenanceWO[]>;
    allPlacedWOs:   PlacedMaintenanceWO[];
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
): void {
    // 1-in-4 chance of at least one event
    if (!rng.bool(0.25)) return;

    const addEvent = () => {
        const tmpl     = rng.pick(templates);
        const duration = rng.nextInt(tmpl.minDurationMinutes, tmpl.maxDurationMinutes);
        const opSpan   = (op.end.getTime() - op.start.getTime()) / 60_000;
        if (duration >= opSpan) return;

        const maxOffset = opSpan - duration;
        const offset    = rng.nextFloat(0, maxOffset);
        const start     = addMinutes(op.start, offset);
        const end       = addMinutes(start, duration);

        // Skip if overlapping an existing event on this operation
        for (const existing of op.downtimes) {
            if (start < existing.end && end > existing.start) return;
        }

        op.downtimes.push({
            id:              nextId("DT"),
            templateCode:    tmpl.code,
            description:     tmpl.description,
            operationId:     op.id,
            workCenterId:    op.workCenterId,
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
    const poCountPerLoc = prodLocations.map(loc =>
        Math.max(1, Math.round(config.productionOrderCount * loc.workCenters.length / totalWCs)),
    );

    // Group maintenance plan templates by location
    const pmByLocation = new Map<string, MaintenancePlanTemplate[]>();
    for (const loc of prodLocations) {
        pmByLocation.set(
            loc.hash,
            maintenancePlanTemplates.filter(p => p.locationId === loc.hash),
        );
    }

    const allPOs:  PlacedPO[]            = [];
    const allGaps: PlacedGap[]           = [];
    const allWOs:  PlacedMaintenanceWO[] = [];
    const posByLocation = new Map<string, PlacedPO[]>();
    const wosByAsset    = new Map<string, PlacedMaintenanceWO[]>();

    for (let li = 0; li < prodLocations.length; li++) {
        const loc      = prodLocations[li];
        const template = poTemplates.get(loc.hash);
        if (!template || template.operations.length === 0) continue;

        const targetPOs = poCountPerLoc[li];
        const locPMs    = pmByLocation.get(loc.hash) ?? [];
        const hasPMs    = locPMs.length > 0;
        const locPOs:   PlacedPO[] = [];

        // Pipeline stagger: time until the first item flows out of op[i] into op[i+1]
        // = setupMinutes_of_op_i + one_cycle_time
        // Since all ops share unitsPerHour, cycle time is the same for all.
        const cycleTime = 60 / config.unitsPerHour; // minutes per item at nominal rate

        let cursor = nextShiftStart(windowStart, config.shifts, config.workDays);

        for (let i = 0; i < targetPOs && cursor < windowEnd; i++) {
            // Per-PO throughput variance: ±10 %
            const effectiveUPH = config.unitsPerHour * rng.nextFloat(0.9, 1.1);
            const poId = nextId("PO");

            // Place operations pipeline-style
            const ops: PlacedOperation[] = template.operations.map((opTmpl, j) => {
                const stagger   = opTmpl.setupMinutes + cycleTime; // time to deliver first item
                const opStart   = addMinutes(cursor, j * stagger);
                const opEnd     = addMinutes(opStart, config.operationDurationMinutes);
                return {
                    id:             nextId("OP"),
                    operationType:  opTmpl.operationType,
                    workCenterId:   opTmpl.workCenterId,
                    workCenterName: opTmpl.workCenterName,
                    locationId:     loc.hash,
                    poId,
                    start:          opStart,
                    end:            opEnd,
                    setupMinutes:   opTmpl.setupMinutes,
                    downtimes:      [],
                };
            });

            // Inject downtime events (probabilistic, inside operation spans)
            for (const op of ops) {
                injectDowntimes(op, downtimeTemplates, rng, nextId);
            }

            const po: PlacedPO = {
                id:                    poId,
                locationId:            loc.hash,
                locationName:          loc.name,
                itemId:                template.itemId,
                start:                 ops[0].start,
                end:                   ops[ops.length - 1].end,
                operations:            ops,
                effectiveUnitsPerHour: effectiveUPH,
            };

            locPOs.push(po);
            allPOs.push(po);
            cursor = po.end;

            // ---- Maintenance gap check ----
            // A gap opens after this PO if at least one machine in the location has a PM due.
            if (hasPMs) {
                const due = locPMs.filter(p => p.nextDue <= cursor);
                if (due.length > 0) {
                    const gapStart = clampToShift(cursor, config.shifts, config.workDays);
                    const gapEnd   = addMinutes(gapStart, config.pmDurationHours * 60);

                    const wos: PlacedMaintenanceWO[] = due.map(p => {
                        const wo: PlacedMaintenanceWO = {
                            id:         nextId("WO"),
                            planId:     p.planId,
                            assetId:    p.assetId,
                            assetName:  p.assetName,
                            locationId: loc.hash,
                            start:      gapStart,
                            end:        gapEnd,
                        };
                        const list = wosByAsset.get(p.assetId) ?? [];
                        list.push(wo);
                        wosByAsset.set(p.assetId, list);
                        allWOs.push(wo);
                        // Advance this machine's next-due date
                        p.nextDue = addDays(p.nextDue, p.frequencyDays);
                        return wo;
                    });

                    allGaps.push({ locationId: loc.hash, start: gapStart, end: gapEnd, workOrders: wos });
                    cursor = clampToShift(gapEnd, config.shifts, config.workDays);
                    continue;
                }
            }

            // No gap: stay within the shift if possible, otherwise jump to next shift start
            cursor = clampToShift(cursor, config.shifts, config.workDays);
        }

        posByLocation.set(loc.hash, locPOs);
    }

    // ---- Dedicated PM pass for locations skipped by the PO loop ----
    // Locations with no valid PO template (e.g. no operations) were skipped above
    // and never received work orders.  Walk those locations independently and place
    // WOs at regular PM-frequency intervals so every production area gets maintenance
    // activity regardless of whether it runs production orders.
    for (const loc of prodLocations) {
        if (posByLocation.has(loc.hash)) continue; // already handled above

        const locPMs = pmByLocation.get(loc.hash) ?? [];
        if (locPMs.length === 0) continue;

        for (const pm of locPMs) {
            let due = new Date(pm.nextDue);
            while (due < windowEnd) {
                const gapStart = nextShiftStart(due, config.shifts, config.workDays);
                if (gapStart >= windowEnd) break;
                const gapEnd = addMinutes(gapStart, pm.pmDurationHours * 60);

                const wo: PlacedMaintenanceWO = {
                    id:         nextId("WO"),
                    planId:     pm.planId,
                    assetId:    pm.assetId,
                    assetName:  pm.assetName,
                    locationId: loc.hash,
                    start:      gapStart,
                    end:        gapEnd,
                };

                const list = wosByAsset.get(pm.assetId) ?? [];
                list.push(wo);
                wosByAsset.set(pm.assetId, list);
                allWOs.push(wo);

                due = addDays(due, pm.frequencyDays);
            }
        }
    }

    return { placedPOs: allPOs, placedGaps: allGaps, posByLocation, wosByAsset, allPlacedWOs: allWOs };
}
