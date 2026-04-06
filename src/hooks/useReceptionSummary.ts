import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";

export type ProcessingReceipt = {
    receiptId: string;
    itemId: string;
    quantity: number;
    supplierName: string | null;
    progress: number; // 0–1, interpolated from putaway task createdAt → putawayDate
};

export type ReceptionSummary = {
    isLoading: boolean;

    // In-transit purchase orders (ordered but not yet received at asOf)
    activePOCount: number;

    // Receipts currently being processed (received, putaway in progress)
    processingReceipts: ProcessingReceipt[];

    // Receipts in the 24h window ending at asOf
    recentReceiptCount: number;
    recentUnitCount: number;

    // Putaway tasks not yet completed at asOf
    pendingPutawayCount: number;
    pendingPutawayUnits: number;
};

const EMPTY: ReceptionSummary = {
    isLoading: true,
    activePOCount: 0,
    processingReceipts: [],
    recentReceiptCount: 0,
    recentUnitCount: 0,
    pendingPutawayCount: 0,
    pendingPutawayUnits: 0,
};

export function useReceptionSummary(): ReceptionSummary {
    const span = useTimelineStore((s) => s.span);
    const asOf = useTimelineStore((s) => s.asOf);
    const isLoading = useTimelineStore((s) => s.isLoading);

    return useMemo(() => {
        if (!span) return EMPTY;

        const pos = [...span.purchaseOrders.values()];
        const receipts = [...span.receipts.values()];
        const putawayTasks = [...span.putawayTasks.values()];

        // Active POs: already placed but not yet received
        const activePOs = pos.filter((po) => po.orderDate <= asOf && (po.receivedAt == null || po.receivedAt > asOf));

        // Build receipt → putaway task lookup for progress calculation
        const putawayByReceipt = new Map<string, (typeof putawayTasks)[number]>();
        for (const pt of putawayTasks) {
            if (pt.receiptId) putawayByReceipt.set(pt.receiptId, pt);
        }

        // Build receipt → PO lookup for supplier name
        const poByErpId = new Map(pos.map((po) => [po.id, po]));

        // Receipts currently being processed: arrived but putaway not complete
        const processingReceipts: ProcessingReceipt[] = receipts
            .filter((r) => {
                if (r.receivedDate > asOf) return false;
                const pt = putawayByReceipt.get(r.id);
                return pt != null && (pt.putawayDate == null || pt.putawayDate > asOf);
            })
            .map((r) => {
                const pt = putawayByReceipt.get(r.id)!;
                const po = r.erpPurchaseOrderId ? poByErpId.get(r.erpPurchaseOrderId) : undefined;
                let progress = 0;
                if (pt.putawayDate != null) {
                    const span = pt.putawayDate - pt.createdAt;
                    progress = span > 0 ? Math.min(1, Math.max(0, (asOf - pt.createdAt) / span)) : 0;
                }
                return {
                    receiptId: r.id,
                    itemId: r.itemId,
                    quantity: r.quantity,
                    supplierName: po?.supplierName ?? po?.supplierId ?? null,
                    progress,
                };
            });

        // Receipts in the 24h window ending at asOf
        const dayAgo = asOf - 86400;
        const recentReceipts = receipts.filter((r) => r.receivedDate > dayAgo && r.receivedDate <= asOf);
        const recentUnitCount = recentReceipts.reduce((s, r) => s + r.quantity, 0);

        // Putaway tasks not yet completed
        const pendingPutaways = putawayTasks.filter((pt) => pt.putawayDate == null || pt.putawayDate > asOf);
        const pendingPutawayUnits = pendingPutaways.reduce((s, pt) => s + pt.quantity, 0);

        return {
            isLoading,
            activePOCount: activePOs.length,
            processingReceipts,
            recentReceiptCount: recentReceipts.length,
            recentUnitCount,
            pendingPutawayCount: pendingPutaways.length,
            pendingPutawayUnits,
        };
    }, [span, asOf, isLoading]);
}
