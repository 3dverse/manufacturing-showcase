//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";
import { SelectionContext } from "@/contexts/SelectionContext";
export type ElementType = "factory" | "area" | "line" | "cell" | "machine";
export type AreaCategory = "Reception" | "Production" | "Storage" | "Control";
export type Element = { type: ElementType; id: string; count: string; entity: Entity; category?: AreaCategory };

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function HoverContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // State
    const [hoveredNode, _setHoveredNode] = useState<FactoryGraphNode>();

    //--------------------------------------------------------------------------
    // Handlers
    const setHoveredNode = useCallback(
        (node: FactoryGraphNode | undefined) => {
            if (selectedNode === node) {
                _setHoveredNode(undefined);
            } else {
                _setHoveredNode(node);
            }
        },
        [selectedNode],
    );

    //--------------------------------------------------------------------------
    const setHoveredNodeByEntity = useCallback((entity: Entity | undefined) => {
        console.warn("//TODO: implement! hovered entity", entity);
    }, []);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (selectedNode === hoveredNode) {
            _setHoveredNode(undefined);
        }
    }, [selectedNode, hoveredNode]);

    //--------------------------------------------------------------------------
    const value = useMemo(
        () => ({
            hoveredNode,
            setHoveredNode,
            setHoveredNodeByEntity,
        }),
        [hoveredNode, setHoveredNode, setHoveredNodeByEntity],
    );

    return <HoverContext.Provider value={value}>{children}</HoverContext.Provider>;
}
