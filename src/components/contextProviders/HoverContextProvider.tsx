//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { HoverContext } from "@/contexts/HoverContext";
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";
import { SelectionContext } from "@/contexts/SelectionContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function HoverContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // Context
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // State
    const [hoveredNode, _setHoveredNode] = useState<SceneGraphNode>();
    const [hoverSource, setHoverSource] = useState<"nav" | "dom3d">();

    //--------------------------------------------------------------------------
    // Handlers
    const setHoveredNode = useCallback(
        (node: SceneGraphNode | undefined, source: "nav" | "dom3d") => {
            if (selectedNode !== node) {
                setHoverSource(source);
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
            setHoverSource(undefined);
            _setHoveredNode(undefined);
        }
    }, [selectedNode, hoveredNode]);

    //--------------------------------------------------------------------------
    const value = useMemo(
        () => ({
            hoveredNode,
            hoverSource,
            setHoveredNode,
            setHoveredNodeByEntity,
        }),
        [hoveredNode, hoverSource, setHoveredNode, setHoveredNodeByEntity],
    );

    return <HoverContext.Provider value={value}>{children}</HoverContext.Provider>;
}
