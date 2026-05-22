import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FaTimes } from "react-icons/fa";

//------------------------------------------------------------------------------
import { Icon } from "@/components/common/Icon";
import Button from "@/components/common/Button";
import { CorrelationTabContent } from "@/components/correlation/CorrelationModal";
import { ItemViewContent } from "@/components/itemView/ItemViewContent";
import { ConnectedSystemBadge } from "@/components/connectedSystems/ConnectedSystemBadge";

//------------------------------------------------------------------------------
import { useFocusStore } from "@/store/useFocusStore";

//------------------------------------------------------------------------------
import { useSpanSnapshot } from "@/hooks/useSpanSnapshot";
import { useCorrelation } from "@/hooks/useCorrelation";
import { useProjection } from "@/hooks/useProjection";

//------------------------------------------------------------------------------
import { buildCorrelatedSnapshot } from "@/core/Correlation";
import { entityTypeFromId } from "@/core/Correlation";
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
import { ENTITY_COLORS } from "@/content/entityColors";
import { cn } from "@/utils/cn";
import { Systems } from "../connectedSystems/content";

//------------------------------------------------------------------------------
import type { FocusedEntity } from "@/core/Correlation";
import type { AsOfProjection } from "@/core/Projection";

//------------------------------------------------------------------------------
type Tab = "itemView" | "correlation";

//------------------------------------------------------------------------------
const TABS: { id: Tab; label: string }[] = [
    { id: "itemView", label: "Item View" },
    { id: "correlation", label: "Correlation" },
];

//------------------------------------------------------------------------------
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
            return `Downtime event`;
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

//------------------------------------------------------------------------------
function GetFocusedSystem(focused: FocusedEntity): ReactNode {
    switch (focused.type) {
        case "salesOrder":
        case "purchaseOrder":
            return <ConnectedSystemBadge system={Systems.ERP} />;
        case "productionOrder":
        case "operation":
        case "downtime":
            return <ConnectedSystemBadge system={Systems.MES} />;
        case "workOrder":
            return <ConnectedSystemBadge system={Systems.EAM} />;
        case "receipt":
        case "putawayTask":
        case "pickTask":
        case "allocation":
            return <ConnectedSystemBadge system={Systems.WMS} />;
    }
}

//------------------------------------------------------------------------------
// Outer shell — always mounted, owns routing side-effects, unmounts inner tree
// when nothing is selected so useSpanSnapshot never runs unnecessarily.
//------------------------------------------------------------------------------
export function ItemViewPanel() {
    const { setSelected } = useFocusStore();
    const selected = useFocusStore((s) => s.selected);

    //--------------------------------------------------------------------------
    // State
    const [lastSelected, setLastSelected] = useState<FocusedEntity>();

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (selected) setLastSelected(selected);
    }, [selected]);

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

    //--------------------------------------------------------------------------
    // Render
    return (
        <aside className="h-full w-1/2 max-w-md z-100">
            <div
                className={cn(
                    "pointer-events-auto h-full transition-transform duration-200",
                    selected ? "translate-x-0" : "translate-x-full",
                )}
            >
                {lastSelected && <ItemViewPanelInner selected={lastSelected} />};
            </div>
        </aside>
    );
}

//------------------------------------------------------------------------------
// Inner panel — only mounted while an entity is selected.
//------------------------------------------------------------------------------
function ItemViewPanelInner({ selected }: { selected: FocusedEntity }) {
    //--------------------------------------------------------------------------
    // Store
    const { setSelected } = useFocusStore();

    //--------------------------------------------------------------------------
    // State
    const [activeTab, setActiveTab] = useState<Tab>("itemView");

    //--------------------------------------------------------------------------
    // Hooks
    const snapshot = useSpanSnapshot();
    const correlated = useCorrelation(snapshot, selected);

    //--------------------------------------------------------------------------
    // Memos
    const correlatedSnapshot = useMemo(
        () => (snapshot && correlated ? buildCorrelatedSnapshot(snapshot, selected, correlated) : null),
        [snapshot, selected, correlated],
    );

    //--------------------------------------------------------------------------
    const projection = useProjection(correlatedSnapshot);

    //--------------------------------------------------------------------------
    const title = useMemo(() => {
        if (!projection) return "";
        return getFocusedLabel(selected, projection);
    }, [selected, projection]);

    //--------------------------------------------------------------------------
    const badge = useMemo(() => {
        return GetFocusedSystem(selected);
    }, [selected]);

    //--------------------------------------------------------------------------
    const colors = useMemo(() => ENTITY_COLORS[selected.type], [selected.type]);

    //--------------------------------------------------------------------------
    // Handlers
    const handleClose = useCallback(() => {
        setSelected(null);
        const { factorySlug, nodeSlug } = Router.currentRoute();
        if (factorySlug) Router.replace({ factorySlug, nodeSlug });
    }, [setSelected]);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        setActiveTab("itemView");
    }, [selected.id]);

    //--------------------------------------------------------------------------
    // Render
    return (
        <div
            className={cn(
                "h-full w-full max-w-md flex flex-col bg-slate-0/95 backdrop-blur-sm border-l border-slate-200/70 shadow-2xl",
            )}
        >
            <header className={cn("shrink-0 py-4 px-2 pl-6 backdrop-blur-sm flex gap-2", colors.header)}>
                <div className="grow flex flex-col items-start">
                    {title && <h2 className="mb-2 text-base font-semibold leading-tight text-white">{title}</h2>}
                    {badge}
                </div>
                <Button
                    variant="ghost"
                    colorScheme="neutral"
                    size="lg"
                    className="px-2 shrink-0 text-white/80 hover:text-white hover:bg-white/15"
                    onClick={handleClose}
                >
                    <Icon icon={FaTimes} />
                </Button>
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
        </div>
    );
}
