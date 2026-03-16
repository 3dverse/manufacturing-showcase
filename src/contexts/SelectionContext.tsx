//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { NavGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type SelectionContextType = {
    selectedNode?: NavGraphNode;
    setSelectedNode: (node: NavGraphNode | undefined) => void;
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
