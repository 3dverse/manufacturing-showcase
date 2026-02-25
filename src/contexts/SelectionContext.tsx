//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type SelectionContextType = {
    selectedNode?: FactoryGraphNode;
    setSelectedNode: (node: FactoryGraphNode | undefined) => void;
    setSelectedNodeByEntity: (entity: Entity | undefined) => void;
};

//------------------------------------------------------------------------------
export const SelectionContext = createContext<SelectionContextType>(
    new Proxy({} as SelectionContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
