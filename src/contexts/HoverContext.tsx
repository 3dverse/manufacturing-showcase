//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type HoverContextType = {
    hoveredNode?: FactoryGraphNode;
    setHoveredNode: (node: FactoryGraphNode | undefined) => void;
    setHoveredNodeByEntity: (entity: Entity | undefined) => void;
};

//------------------------------------------------------------------------------
export const HoverContext = createContext<HoverContextType>(
    new Proxy({} as HoverContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
