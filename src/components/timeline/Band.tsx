import { useCallback } from "react";

//------------------------------------------------------------------------------
import { useFocusStore } from "@/store/useFocusStore";

//------------------------------------------------------------------------------
import { Router } from "@/core/Router";

//------------------------------------------------------------------------------
import type { MouseEvent as ReactMouseEvent } from "react";
import type { EntityType, HighlightState } from "@/core/Correlation";

//------------------------------------------------------------------------------
import { cn } from "@/utils/cn";
import { toPct } from "./timeUtils";

//------------------------------------------------------------------------------
import type { BarItem } from "./constants";

//------------------------------------------------------------------------------
// Band component — full-height background overlay for bands (downtime, work orders)
//------------------------------------------------------------------------------
export function Band({
    bar,
    isInScope,
    winStart,
    winEnd,
    onEnter,
    onLeave,
    highlightState,
    effectiveNow,
}: {
    bar: BarItem;
    isInScope: boolean;
    winStart: number;
    winEnd: number;
    onEnter: (entityType: EntityType, id: string, e: ReactMouseEvent) => void;
    onLeave: () => void;
    highlightState: HighlightState;
    effectiveNow: number;
}) {
    //--------------------------------------------------------------------------
    const { setHovered, setSelected } = useFocusStore();
    const left = toPct(bar.start, winStart, winEnd);
    const width = toPct(bar.end, winStart, winEnd) - left;

    //--------------------------------------------------------------------------
    // Handlers
    const mouseDownHandler = useCallback((e: ReactMouseEvent) => {
        e.stopPropagation();
    }, []);

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
    const mouseEnterHandler = useCallback(
        (e: ReactMouseEvent) => {
            e.stopPropagation();
            onEnter(bar.entityType, bar.id, e);
            setHovered({ type: bar.entityType, id: bar.id });
        },
        [onEnter, bar, setHovered],
    );

    //--------------------------------------------------------------------------
    const clickHandler = useCallback(
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
    // Render
    return (
        <div
            className={cn(
                "absolute top-0 bottom-0 cursor-pointer transition-opacity",
                isInScope ? bar.colors.band : bar.colors.bandDimmed,
                bar.start <= effectiveNow && effectiveNow <= bar.end && bar.colors.bandCurrent,
                highlightState === "dimmed" && "opacity-20",
            )}
            style={{ left: `${left}%`, width: `${width}%`, minWidth: "2px" }}
            onMouseDown={mouseDownHandler}
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
            onClick={clickHandler}
        />
    );
}
