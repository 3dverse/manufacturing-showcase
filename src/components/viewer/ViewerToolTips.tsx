import { useCallback, useContext, useEffect, useMemo, useRef } from "react";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";

//------------------------------------------------------------------------------
import { isFactory, isArea, isLine } from "@/core/SceneGraph";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const ViewerToolTips = () => {
    //--------------------------------------------------------------------------
    // Context
    const { hoveredNode, hoverSource } = useContext(HoverContext);

    //--------------------------------------------------------------------------
    // Refs
    const tooltipRef = useRef<HTMLDivElement>(null);
    const frame = useRef<number | null>(null);

    //--------------------------------------------------------------------------
    // Memos
    const isTooltipVisible = useMemo(() => Boolean(hoverSource === "dom3d" && hoveredNode), [hoveredNode, hoverSource]);

    //--------------------------------------------------------------------------
    const hoveredArea = useMemo(() => {
        let candidateNode = hoveredNode;
        while (candidateNode && !isFactory(candidateNode)) {
            if (isArea(candidateNode)) return candidateNode;
            candidateNode = candidateNode.parent;
        }
    }, [hoveredNode]);

    //--------------------------------------------------------------------------
    const hoveredChildren = useMemo(() => {
        if (hoveredNode && hoveredNode !== hoveredArea) {
            return hoveredNode;
        }
    }, [hoveredArea, hoveredNode]);

    //--------------------------------------------------------------------------
    // Handlers
    const updatePosition = useCallback((e: MouseEvent) => {
        if (frame.current) return;

        if (e.clientX == 0 && e.clientY == 0) {
            return;
        }

        frame.current = requestAnimationFrame(() => {
            if (tooltipRef.current) {
                tooltipRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            }
            frame.current = null;
        });
    }, []);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        return () => cancelAnimationFrame(frame.current as number);
    }, []);

    //--------------------------------------------------------------------------
    useEffect(() => {
        window.addEventListener("mousemove", updatePosition);
        return () => {
            window.removeEventListener("mousemove", updatePosition);
        };
    }, [updatePosition]);

    //--------------------------------------------------------------------------
    // Render
    if (!isTooltipVisible) return null;
    return (
        <div
            ref={tooltipRef}
            className="fixed top-4 left-4 z-40 px-2 py-1 text-white bg-accent rounded-sm shadow-lg transition-opacity duration-150"
        >
            <p
                className="text-xs uppercase tracking-wide transition-all duration-200 origin-top-left"
                style={{
                    transform: hoveredChildren ? "scale(0.8)" : undefined,
                    opacity: hoveredChildren ? 0.8 : 1,
                }}
            >
                {hoveredArea?.name} AREA{" "}
            </p>
            {hoveredChildren && (
                <p className="text-sm leading-tight capitalize -translate-y-px opacity-100 scale-100 starting:opacity-0 starting:scale-70 transition-all origin-bottom-left duration-200">
                    {hoveredChildren.name} {isLine(hoveredChildren) && "Line"}
                </p>
            )}
        </div>
    );
};
