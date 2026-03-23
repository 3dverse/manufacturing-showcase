import type { Request } from "express";
import { getDataset } from "../generator/store";

export function getDatasetForRequest(req: Request) {
    return getDataset((req.query as any).siteId as string | undefined);
}

export function paginate<T>(items: T[], page = 1, pageSize = 50) {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const p = Math.max(1, page);
    return {
        data: items.slice((p - 1) * pageSize, p * pageSize),
        pagination: { page: p, pageSize, totalItems, totalPages },
    };
}

export function notFound(id: string, res: any) {
    return res.status(404).json({ status: 404, error: "not_found", message: `Not found: ${id}` });
}

export function filterByDate(
    items: any[],
    fromDate: string | undefined,
    toDate: string | undefined,
    dateField: string,
): any[] {
    let result = items;
    if (fromDate) result = result.filter((i) => (i[dateField] ?? "").slice(0, 10) >= fromDate);
    if (toDate) result = result.filter((i) => (i[dateField] ?? "").slice(0, 10) <= toDate);
    return result;
}
