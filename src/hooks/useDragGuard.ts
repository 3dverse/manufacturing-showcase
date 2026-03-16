//------------------------------------------------------------------------------
import { useRef, useCallback, type PointerEvent, type MouseEvent } from "react";

//------------------------------------------------------------------------------
/**
 * Distinguishes a simple click from a camera drag.
 * Wire `pointerDownHandler` on `onPointerDown` and use `isDrag(e)` inside your click handler.
 *
 * @param thresholdDistanceInPx - Minimum distance in pixels the pointer must travel to be considered a drag.
 */
export const useDragGuard = (thresholdDistanceInPx = 5) => {
    const pointerStart = useRef<{ x: number; y: number } | null>(null);

    const pointerDownHandler = useCallback((e: PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
    }, []);

    const isDrag = useCallback(
        (e: MouseEvent) => {
            const start = pointerStart.current;
            if (!start) return false;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            return dx * dx + dy * dy > thresholdDistanceInPx * thresholdDistanceInPx;
        },
        [thresholdDistanceInPx],
    );

    return { pointerDownHandler, isDrag };
};
