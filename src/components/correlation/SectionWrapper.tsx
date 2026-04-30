import { useState } from "react";
import { cn } from "@/utils/cn";
import type { Phase } from "@/core/Projection";
import Button from "../common/Button";
import { Icon } from "../common/Icon";
import { faAngleDown, faAngleLeft, faAngleRight } from "@fortawesome/pro-light-svg-icons";

// ---------------------------------------------------------------------------
// Shared field-level primitives used by every sheet
// ---------------------------------------------------------------------------

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 min-h-[18px]">
            <span className="text-xs text-muted shrink-0">{label}</span>
            <span className="text-xs text-right">{value ?? <span className="text-muted/50">—</span>}</span>
        </div>
    );
}

export function PhaseBadge({ phase }: { phase: Phase }) {
    const cls: Record<Phase, string> = {
        active: "text-emerald-700 bg-emerald-50 border border-emerald-200",
        completed: "text-slate-500 bg-slate-100 border border-slate-200",
        future: "text-blue-600 bg-blue-50 border border-blue-200",
    };
    return (
        <span className={cn("inline-block text-[10px] px-1.5 py-px rounded-sm font-medium capitalize", cls[phase])}>
            {phase}
        </span>
    );
}

export function OverdueBadge() {
    return (
        <span className="inline-block text-[10px] px-1.5 py-px rounded-sm font-medium text-red-700 bg-red-50 border border-red-200">
            overdue
        </span>
    );
}

export function OngoingBadge() {
    return (
        <span className="inline-block text-[10px] px-1.5 py-px rounded-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 animate-pulse">
            ongoing
        </span>
    );
}

export function PartialBadge() {
    return (
        <span className="inline-block text-[10px] px-1.5 py-px rounded-sm font-medium text-amber-700 bg-amber-50 border border-amber-200">
            partial
        </span>
    );
}

export function Divider() {
    return <div className="h-px bg-slate-200/60 my-2" />;
}

// ---------------------------------------------------------------------------
// SectionWrapper
// ---------------------------------------------------------------------------

type SectionWrapperProps<T> = {
    label: string;
    items: T[];
    focusedId: string | null;
    getId: (item: T) => string;
    renderItem: (item: T, isFocused: boolean) => React.ReactNode;
};

export function SectionWrapper<T>({ label, items, focusedId, getId, renderItem }: SectionWrapperProps<T>) {
    const initialPage = Math.max(
        0,
        items.findIndex((i) => getId(i) === focusedId),
    );
    const [collapsed, setCollapsed] = useState(false);
    const [page, setPage] = useState(initialPage);

    const count = items.length;
    const current = items[Math.min(page, count - 1)];
    const isFocused = current ? getId(current) === focusedId : false;

    return (
        <div className="border border-slate-200/70 rounded-lg overflow-hidden">
            {/* Header */}
            <div
                className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
                onClick={() => setCollapsed((c) => !c)}
            >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-accent flex-1">
                    {label}
                </span>

                {/* Pagination controls (only when expanded and multiple items) */}
                {!collapsed && count > 1 && (
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            colorScheme="neutral"
                            size="xs"
                            className="px-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                            onClick={() => setPage((p) => (p - 1 + count) % count)}
                            aria-label="Previous"
                        >
                            <Icon icon={faAngleLeft} />
                        </Button>
                        <span className="text-[10px] text-slate-400 tabular-nums w-8 text-center">
                            {page + 1} / {count}
                        </span>
                        <Button
                            variant="ghost"
                            colorScheme="neutral"
                            size="xs"
                            className="px-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                            onClick={() => setPage((p) => (p + 1) % count)}
                            aria-label="Next"
                        >
                            <Icon icon={faAngleRight} />
                        </Button>
                    </div>
                )}

                {/* Count badge when collapsed */}
                {collapsed && count > 1 && (
                    <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-px rounded-full tabular-nums">
                        {count}
                    </span>
                )}

                {/* Chevron */}
                <span
                    className={cn(
                        "text-slate-400 text-sm leading-none transition-transform duration-200",
                        collapsed ? "-rotate-90" : "rotate-0",
                    )}
                    aria-hidden
                >
                    <Icon icon={faAngleDown} size="xs" />
                </span>
            </div>

            {/* Body */}
            {!collapsed && current && (
                <div className={cn("px-3 py-3", isFocused && "border-l-2 border-l-accent")}>
                    {renderItem(current, isFocused)}
                </div>
            )}
        </div>
    );
}
