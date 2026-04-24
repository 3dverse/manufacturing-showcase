//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type SelectionContextType = {
    selectedNode?: SceneGraphNode;
    setSelectedNode: (node: SceneGraphNode | undefined) => void;
    setSelectedNodeByEntity: (entity: Entity | undefined) => void;
};

//------------------------------------------------------------------------------
export const SelectionContext = createContext<SelectionContextType>(
    new Proxy({} as SelectionContextType, {
        get() {
            throw new Error("SelectionContext must be used within a SelectionContextProvider");
        },
    }),
);
