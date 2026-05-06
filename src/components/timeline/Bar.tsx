import { useMemo, useCallback, type MouseEvent as ReactMouseEvent, type CSSProperties } from "react";

//------------------------------------------------------------------------------
import { useFocusStore } from "@/store/useFocusStore";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";
import { cn } from "@/utils/cn";

//------------------------------------------------------------------------------
import type { EntityType, HighlightState } from "@/core/Correlation";

//------------------------------------------------------------------------------
import { toPct } from "./timeUtils";
import { BAR_H, LINE_H, ROW_H, ROW_H_LINE, type BarItem, type BarStyle } from "./constants";

//------------------------------------------------------------------------------
// Bar component
//------------------------------------------------------------------------------
export function Bar({
    bar,
    winStart,
    winEnd,
    laneIndex,
    barStyle,
    effectiveNow,
    highlightState,
    onEnter,
    onLeave,
}: {
    bar: BarItem;
    winStart: number;
    winEnd: number;
    laneIndex: number;
    barStyle: BarStyle;
    effectiveNow: number;
    highlightState: HighlightState;
    onEnter: (entityType: EntityType, id: string, e: ReactMouseEvent) => void;
    onLeave: () => void;
}) {
    //--------------------------------------------------------------------------
    // Store
    const { setHovered, setSelected } = useFocusStore();

    //--------------------------------------------------------------------------
    // Memos
    const style: CSSProperties | undefined = useMemo(() => {
        const left = toPct(bar.start, winStart, winEnd);
        const right = toPct(bar.end, winStart, winEnd);
        const clampedLeft = Math.max(0, left);
        const clampedRight = Math.min(100, right);
        const widthPct = Math.max(0.25, clampedRight - clampedLeft);
        const h = barStyle === "line" ? LINE_H : BAR_H;
        const rowHeight = barStyle === "bar" ? ROW_H : ROW_H_LINE;
        if (right < 0 || left > 100) {
            return;
        }

        return {
            left: `${clampedLeft}%`,
            width: `${widthPct}%`,
            top: laneIndex * rowHeight + (rowHeight - h) / 2,
            height: h,
        };
    }, [bar, barStyle, winStart, winEnd, laneIndex]);

    //--------------------------------------------------------------------------
    // Handlers
    const mouseEnterHandler = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            onEnter(bar.entityType, bar.id, e);
            setHovered({ type: bar.entityType, id: bar.id });
        },
        [onEnter, bar, setHovered],
    );

    //--------------------------------------------------------------------------
    const mouseLeaveHandler = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            onLeave();
            setHovered(null);
        },
        [onLeave, setHovered],
    );

    //--------------------------------------------------------------------------
    const mouseDownHandler = useCallback((e: ReactMouseEvent) => {
        e.stopPropagation();
    }, []);

    //--------------------------------------------------------------------------
    const mouseClickHandler = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            setSelected({ type: bar.entityType, id: bar.id });
            const { factorySlug, nodeSlug } = Router.currentRoute();
            if (factorySlug)
                Router.replace({
                    factorySlug,
                    nodeSlug: bar.targetNodeHash || nodeSlug,
                    itemSlug: bar.id,
                });
        },
        [bar, setSelected],
    );

    //--------------------------------------------------------------------------
    if (!style) return null;

    //--------------------------------------------------------------------------
    return (
        <div
            className={cn(
                "absolute cursor-pointer pointer-events-auto transition-[shadow,opacity]",
                barStyle === "line" ? "rounded-full" : "rounded-sm",
                barStyle === "bar" &&
                    bar.inlineLabel &&
                    "text-sm flex items-center justify-start overflow-hidden px-2 py-3",
                bar.colors.barHighlight,
                bar.start > effectiveNow
                    ? bar.colors.barFuture
                    : bar.end >= effectiveNow
                      ? bar.colors.barCurrent
                      : bar.colors.bar,
                bar.isPartial && "opacity-50",
                highlightState === "dimmed" && "opacity-20",
            )}
            style={style}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
            onMouseDown={mouseDownHandler}
            onClick={mouseClickHandler}
        >
            {barStyle === "bar" && bar.inlineLabel ? (
                <span className="truncate text-[9px] font-semibold leading-none text-white drop-shadow-sm pointer-events-none select-none">
                    {bar.inlineLabel}
                </span>
            ) : null}
        </div>
    );
}
