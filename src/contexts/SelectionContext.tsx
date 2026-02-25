//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type SelectionContextType = {
    selectedNode?: FactoryGraphNode;
    setSelectedNode: (node: FactoryGraphNode | null) => void;
    setSelectedNodeByEntity: (entity: Entity | null) => void;
};

//------------------------------------------------------------------------------
export const SelectionContext = createContext<SelectionContextType>(
    new Proxy({} as SelectionContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
