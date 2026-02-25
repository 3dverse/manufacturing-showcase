//------------------------------------------------------------------------------
import { useCallback, useMemo, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { SelectionContext } from "@/contexts/SelectionContext";
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
import type { Entity } from "@3dverse/livelink";
export type ElementType = "factory" | "area" | "line" | "cell" | "machine";
export type AreaCategory = "Reception" | "Production" | "Storage" | "Control";
export type Element = { type: ElementType; id: string; count: string; entity: Entity; category?: AreaCategory };

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function SelectionContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // State
    const [selectedNode, _setSelectedNode] = useState<FactoryGraphNode>();

    //--------------------------------------------------------------------------
    // Handlers
    const setSelectedNode = useCallback((node: FactoryGraphNode | undefined) => {
        _setSelectedNode(node);
    }, []);

    //--------------------------------------------------------------------------
    const setSelectedNodeByEntity = useCallback((entity: Entity | undefined) => {
        console.warn("//TODO: implement! selected entity", entity);
    }, []);

    //--------------------------------------------------------------------------
    const value = useMemo(
        () => ({
            selectedNode,
            setSelectedNode,
            setSelectedNodeByEntity,
        }),
        [selectedNode, setSelectedNode, setSelectedNodeByEntity],
    );

    return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}
