import { getDatasetForRequest } from "../utils";
import { QMSreplyJSON, type QMSOperationHandler } from "../../utils/openAPI";

export const getQualityMetrics: QMSOperationHandler<"getQualityMetrics"> = async (_c, req, res) => {
    const ds = getDatasetForRequest(req);
    const { periodStart, periodEnd, granularity = "month" } = req.query as any;

    const start = periodStart ? new Date(periodStart) : new Date(ds.now.getTime() - 90 * 24 * 3600000);
    const end = periodEnd ? new Date(periodEnd) : ds.now;

    const ncs = ds.qms.nonconformanceList.map((id) => ds.qms.nonconformances.get(id)!).filter((nc) => new Date(nc.detectedAt) >= start && new Date(nc.detectedAt) <= end);
    const capas = ds.qms.capaList.map((id) => ds.qms.capas.get(id)!).filter((c) => new Date(c.openedAt) >= start && new Date(c.openedAt) <= end);
    const devs = ds.qms.deviationList.map((id) => ds.qms.deviations.get(id)!).filter((d) => new Date(d.raisedAt) >= start && new Date(d.raisedAt) <= end);
    const comps = ds.qms.complaintList.map((id) => ds.qms.complaints.get(id)!).filter((c) => new Date(c.receivedAt) >= start && new Date(c.receivedAt) <= end);
    const audits = ds.qms.auditList.map((id) => ds.qms.audits.get(id)!).filter((a) => new Date(a.scheduledStart) >= start && new Date(a.scheduledStart) <= end);

    const openNCs = ncs.filter((nc) => nc.status === "open" || nc.status === "under_review").length;
    const openCapas = capas.filter((c) => c.status === "open" || c.status === "in_progress").length;
    const openDevs = devs.filter((d) => d.status === "open" || d.status === "under_review").length;
    const openComps = comps.filter((c) => c.status === "open" || c.status === "under_investigation").length;

    const completedAudits = audits.filter((a) => a.status === "completed").length;
    const auditCompletionRate = audits.length > 0 ? Math.round((completedAudits / audits.length) * 100) / 100 : 1.0;

    const closedCapas = capas.filter((c) => c.status === "closed");
    const onTimeCapas = closedCapas.filter((c) => !c.dueAt || c.closedAt <= c.dueAt).length;
    const capaOnTimeClosureRate = closedCapas.length > 0 ? Math.round((onTimeCapas / closedCapas.length) * 100) / 100 : 1.0;

    // Build trend series
    function buildTrend(items: any[], dateField: string): any[] {
        const granMs = granularity === "day" ? 86400000 : granularity === "week" ? 7 * 86400000 : 30 * 24 * 3600000;
        const buckets: Record<number, number> = {};
        for (const item of items) {
            const t = new Date(item[dateField]).getTime();
            const bucket = Math.floor(t / granMs) * granMs;
            buckets[bucket] = (buckets[bucket] ?? 0) + 1;
        }
        return Object.entries(buckets)
            .sort(([a], [b]) => +a - +b)
            .map(([ts, count]) => ({
                periodStart: new Date(+ts).toISOString(),
                periodEnd: new Date(+ts + granMs).toISOString(),
                value: count,
            }));
    }

    const metrics = {
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        openNonconformances: openNCs,
        openCapas,
        openDeviations: openDevs,
        openComplaints: openComps,
        auditCompletionRate,
        capaOnTimeClosureRate,
        complaintTrend: buildTrend(comps, "receivedAt"),
        nonconformanceTrend: buildTrend(ncs, "detectedAt"),
        capaClosureTrend: buildTrend(closedCapas, "closedAt"),
    };
    return QMSreplyJSON(metrics as any, res);
};
