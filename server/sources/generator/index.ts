/**
 * Generator v2 — three-pass dataset generator.
 *
 * Pass 1 (entities): create all named things — templates, master data.
 * Pass 2 (timeline): place POs, operations, downtime events, and PM work orders in time.
 * Pass 3 (fill):     compute quantities, statuses, OEE, and all transactional records.
 */

import { createRng } from "./rng";
import type { Dataset } from "./types";
import { buildConfig } from "./config";
import type { GeneratorConfig } from "./config";
import type { SiteNode } from "../operations/dataset/generateDataset";
import { generateEntities } from "./steps/phase1";
import { placeTimeline }    from "./steps/phase2";
import { fillDataset }      from "./steps/phase3";

export type { GeneratorConfig } from "./config";
export { buildConfig }          from "./config";

export function generate(
    partial: Partial<GeneratorConfig> & { site: SiteNode; siteId: string },
): Dataset {
    const config = buildConfig(partial);

    console.log(
        `[Generator2] seed=${config.seed}  now=${config.now.toISOString()}  ` +
        `window=${config.monthsBack}m back / ${config.monthsForward}m forward  ` +
        `POs=${config.productionOrderCount}  UPH=${config.unitsPerHour}  ` +
        `opDuration=${config.operationDurationMinutes}min`,
    );

    const t0  = Date.now();
    const rng = createRng(config.seed);

    // ---- Phase 1: entity creation ----
    const entities = generateEntities(config, rng);
    console.log(
        `[Generator2] Phase 1 done: ` +
        `${entities.workCenterList.length} work centers, ` +
        `${entities.eamAssetList.length} assets, ` +
        `${entities.maintenancePlanTemplates.length} PM plans`,
    );

    // ---- Phase 2: timeline placement ----
    const timeline = placeTimeline(
        config,
        entities.poTemplates,
        entities.downtimeTemplates,
        entities.maintenancePlanTemplates,
        rng,
    );
    const totalDowntimes = timeline.placedPOs
        .flatMap(po => po.operations)
        .reduce((s, op) => s + op.downtimes.length, 0);
    console.log(
        `[Generator2] Phase 2 done: ` +
        `${timeline.placedPOs.length} POs, ` +
        `${timeline.allPlacedWOs.length} PM work orders, ` +
        `${totalDowntimes} downtime events`,
    );

    // ---- Phase 3: fill pass ----
    const dataset = fillDataset(config, entities, timeline, rng);
    console.log(
        `[Generator2] Phase 3 done in ${Date.now() - t0}ms: ` +
        `${dataset.mes.productionOrderList.length} MES POs, ` +
        `${dataset.mes.operationList.length} operations, ` +
        `${dataset.mes.oeeTimeseries.length} OEE buckets, ` +
        `${dataset.eam.workOrderList.length} EAM WOs`,
    );

    return dataset;
}
