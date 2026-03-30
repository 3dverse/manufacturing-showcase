import { useMemo } from "react";

import { useTimelineStore } from "@/store/useTimelineStore";
import type { PurchaseOrderEntry } from "@/core/Scope";

export type ReceptionSummary = {
    isLoading: boolean;

    // In-transit purchase orders (ordered but not yet received at asOf)
    activePOCount: number;
    nextDelivery: PurchaseOrderEntry | null; // earliest expectedDeliveryDate among active POs

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
    nextDelivery: null,
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
        const nextDelivery =
            activePOs
                .filter((po) => po.expectedDeliveryDate != null)
                .sort((a, b) => a.expectedDeliveryDate! - b.expectedDeliveryDate!)[0] ?? null;

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
            nextDelivery,
            recentReceiptCount: recentReceipts.length,
            recentUnitCount,
            pendingPutawayCount: pendingPutaways.length,
            pendingPutawayUnits,
        };
    }, [span, asOf, isLoading]);
}
