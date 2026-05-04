import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { faXmark } from "@fortawesome/pro-light-svg-icons";

import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { CorrelationTabContent } from "@/components/correlation/CorrelationModal";
import { ItemViewContent } from "./ItemViewContent";

import { useFocusStore } from "@/store/useFocusStore";
import { useSpanSnapshot } from "@/hooks/useSpanSnapshot";
import { useCorrelation } from "@/hooks/useCorrelation";
import { useProjection } from "@/hooks/useProjection";
import { buildCorrelatedSnapshot } from "@/core/Correlation";
import { entityTypeFromId } from "@/core/Correlation";
import { Router } from "@/core/Router";
import { ENTITY_COLORS } from "@/content/entityColors";
import { cn } from "@/utils/cn";
import type { FocusedEntity } from "@/core/Correlation";
import type { AsOfProjection } from "@/core/Projection";

// ---------------------------------------------------------------------------
type Tab = "itemView" | "correlation";

const TABS: { id: Tab; label: string }[] = [
    { id: "itemView", label: "Item View" },
    { id: "correlation", label: "Correlation" },
];

function getFocusedLabel(focused: FocusedEntity, projection: AsOfProjection): string {
    switch (focused.type) {
        case "salesOrder": {
            const e = projection.salesOrders.find((s) => s.id === focused.id);
            return `Sales Order${e ? ` — ${e.orderNumber}` : ""}`;
        }
        case "productionOrder": {
            const e = projection.productionOrders.find((p) => p.id === focused.id);
            return `Manufacturing Order${e ? ` — ${e.orderNumber}` : ""}`;
        }
        case "operation": {
            const e = projection.operations.find((o) => o.id === focused.id);
            return `Operation${e ? ` — ${e.operationCode}` : ""}`;
        }
        case "downtime": {
            const e = projection.downtimeEvents.find((d) => d.id === focused.id);
            return `Downtime${e ? ` — ${e.reasonCode}` : ""}`;
        }
        case "workOrder": {
            const e = projection.eamWorkOrders.find((w) => w.id === focused.id);
            return `Work Order${e ? ` — ${e.workOrderNumber}` : ""}`;
        }
        case "pickTask":
            return `Pick Task — ${focused.id}`;
        case "receipt":
            return `Receipt — ${focused.id}`;
        case "putawayTask":
            return `Putaway Task — ${focused.id}`;
        case "purchaseOrder": {
            const e = projection.purchaseOrders.find((p) => p.id === focused.id);
            return `Purchase Order${e ? ` — ${e.orderNumber}` : ""}`;
        }
        case "allocation":
            return `Allocation — ${focused.id}`;
    }
}

// ---------------------------------------------------------------------------
// Outer shell — always mounted, owns routing side-effects, unmounts inner tree
// when nothing is selected so useSpanSnapshot never runs unnecessarily.
// ---------------------------------------------------------------------------
export function ItemViewPanel() {
    const { setSelected } = useFocusStore();
    const selected = useFocusStore((s) => s.selected);

    // Sync panel open/close with every route change — clears the panel whenever
    // the URL no longer has an itemSlug, regardless of whether the navigation was
    // programmatic or a browser back/forward.
    useEffect(() => {
        return Router.onChange(({ route }) => {
            if (!route.itemSlug) {
                setSelected(null);
                return;
            }
            const type = entityTypeFromId(route.itemSlug);
            if (type) setSelected({ type, id: route.itemSlug });
            else setSelected(null);
        });
    }, [setSelected]);

    if (!selected) return null;
    return <ItemViewPanelInner selected={selected} />;
}

// ---------------------------------------------------------------------------
// Inner panel — only mounted while an entity is selected.
// ---------------------------------------------------------------------------
function ItemViewPanelInner({ selected }: { selected: FocusedEntity }) {
    const { setSelected } = useFocusStore();
    const snapshot = useSpanSnapshot();
    const correlated = useCorrelation(snapshot, selected);

    const correlatedSnapshot = useMemo(
        () => (snapshot && correlated ? buildCorrelatedSnapshot(snapshot, selected, correlated) : null),
        [snapshot, selected, correlated],
    );
    const projection = useProjection(correlatedSnapshot);
    const [activeTab, setActiveTab] = useState<Tab>("itemView");

    // Reset to Item View tab whenever the focused entity changes
    useEffect(() => {
        setActiveTab("itemView");
    }, [selected.id]);

    const handleClose = useCallback(() => {
        setSelected(null);
        const { factorySlug, nodeSlug } = Router.currentRoute();
        if (factorySlug) Router.replace({ factorySlug, nodeSlug });
    }, [setSelected]);

    const title = useMemo(() => {
        if (!projection) return "";
        return getFocusedLabel(selected, projection);
    }, [selected, projection]);

    const colors = ENTITY_COLORS[selected.type];

    return createPortal(
        <aside className="fixed top-0 right-0 bottom-0 w-1/2 max-w-md flex flex-col bg-slate-0/95 backdrop-blur-sm border-l border-slate-200/70 shadow-3xl z-100 starting:-translate-x-full translate-x-0 transition-all duration-200">
            <header className={cn("shrink-0 pl-6 pr-3 pt-3 pb-3 backdrop-blur-sm", colors.header)}>
                <div className="flex items-center justify-between">
                    {title && <h2 className="text-lg font-semibold leading-tight text-white">{title}</h2>}
                    <Button
                        variant="ghost"
                        colorScheme="neutral"
                        size="lg"
                        className="px-2 shrink-0 text-white/80 hover:text-white hover:bg-white/15"
                        onClick={handleClose}
                    >
                        <Icon icon={faXmark} />
                    </Button>
                </div>
            </header>

            {/* key resets all section states (page, collapsed) when focused entity changes */}
            <div
                key={`${selected.type}-${selected.id}`}
                className="flex-1 overflow-y-auto flex flex-col gap-2 p-5 pt-4"
            >
                {activeTab === "itemView" && (
                    <ItemViewContent selected={selected} projection={projection} correlated={correlated} />
                )}
                {activeTab === "correlation" && projection && (
                    <CorrelationTabContent selected={selected} projection={projection} correlated={correlated} />
                )}
                {activeTab === "correlation" && !projection && (
                    <p className="text-sm text-muted text-center py-6 animate-pulse">Loading…</p>
                )}
            </div>

            <footer className="shrink-0 flex border-t border-slate-200/70 bg-slate-0">
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                            "flex-1 py-3.5 text-sm font-medium transition-colors cursor-pointer",
                            activeTab === id
                                ? "text-slate-900 bg-slate-100"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
                        )}
                    >
                        {label}
                    </button>
                ))}
            </footer>
        </aside>,
        document.body,
    );
}
