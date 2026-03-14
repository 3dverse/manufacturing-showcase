//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { FactoryGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type HoverContextType = {
    hoveredNode?: FactoryGraphNode;
    hoverSource?: "nav" | "dom3d";
    setHoveredNode: (node: FactoryGraphNode | undefined, source: "nav" | "dom3d") => void;
    setHoveredNodeByEntity: (entity: Entity | undefined, source: "nav" | "dom3d") => void;
};

//------------------------------------------------------------------------------
export const HoverContext = createContext<HoverContextType>(
    new Proxy({} as HoverContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
