import { getDatasetForRequest } from "../utils";
import { MESreplyJSON, type MESOperationHandler } from "../../utils/openAPI";

export const getPerformance: MESOperationHandler<"getPerformance"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { siteId: reqSiteId, workCenterId, productionOrderId, from: fromStr, to: toStr } = req.query as any;

    const nowTs = Math.floor(ds.now.getTime() / 1000);
    const from = fromStr ? Number(fromStr) : nowTs - 7 * 24 * 3600;
    const to = toStr ? Number(toStr) : nowTs;

    let buckets = ds.mes.oeeTimeseries.filter((b) => b.shiftStart >= from && b.shiftEnd <= to);

    if (workCenterId) {
        buckets =
            ds.mes.oeeByWorkCenter.get(workCenterId)?.filter((b) => b.shiftStart >= from && b.shiftEnd <= to) ?? [];
    }

    // Aggregate
    const producedQuantity = buckets.reduce((s, b) => s + b.producedQuantity, 0);
    const goodQuantity = buckets.reduce((s, b) => s + b.goodQuantity, 0);
    const scrapQuantity = buckets.reduce((s, b) => s + b.scrapQuantity, 0);
    const runtimeMinutes = buckets.reduce((s, b) => s + b.runtimeMinutes, 0);
    const downtimeMinutes = buckets.reduce((s, b) => s + b.downtimeMinutes, 0);
    const plannedMinutes = buckets.reduce((s, b) => s + b.plannedMinutes, 0);
    const throughputPerHour = runtimeMinutes > 0 ? Math.round((goodQuantity / (runtimeMinutes / 60)) * 10) / 10 : 0;
    const availabilityPercent = plannedMinutes > 0 ? Math.round((runtimeMinutes / plannedMinutes) * 100 * 10) / 10 : 0;
    const performancePercent =
        runtimeMinutes > 0
            ? Math.round(
                  (buckets.reduce((s, b) => s + b.performancePercent * b.runtimeMinutes, 0) / runtimeMinutes) * 10,
              ) / 10
            : 0;
    const qualityPercent = producedQuantity > 0 ? Math.round((goodQuantity / producedQuantity) * 100 * 10) / 10 : 100;
    const oeePercent =
        Math.round((availabilityPercent / 100) * (performancePercent / 100) * (qualityPercent / 100) * 100 * 10) / 10;

    const metrics = {
        siteId: reqSiteId ?? ds.siteId,
        workCenterId: workCenterId ?? null,
        productionOrderId: productionOrderId ?? null,
        from,
        to,
        producedQuantity,
        goodQuantity,
        scrapQuantity,
        runtimeMinutes,
        downtimeMinutes,
        throughputPerHour,
        availabilityPercent,
        performancePercent,
        qualityPercent,
        oeePercent,
    };

    return MESreplyJSON({ data: metrics }, res);
};
