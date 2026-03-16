//------------------------------------------------------------------------------
import { useRef, useCallback, type PointerEvent, type MouseEvent } from "react";

//------------------------------------------------------------------------------
export const ON_DRAG_THRESHOLD_DISTANCE_IN_PX = 5;

//------------------------------------------------------------------------------
/**
 * Distinguishes a simple click from a camera drag.
 * Wire `pointerDownHandler` on `onPointerDown` and use `isDrag(e)` inside your click handler.
 */
export const useDragGuard = () => {
    const pointerStart = useRef<{ x: number; y: number } | null>(null);

    const pointerDownHandler = useCallback((e: PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
    }, []);

    const isDrag = (e: MouseEvent) => {
        const start = pointerStart.current;
        if (!start) return false;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        return dx * dx + dy * dy > ON_DRAG_THRESHOLD_DISTANCE_IN_PX * ON_DRAG_THRESHOLD_DISTANCE_IN_PX;
    };

    return { pointerDownHandler, isDrag };
};
