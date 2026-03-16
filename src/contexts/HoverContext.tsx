//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { NavGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type HoverContextType = {
    hoveredNode?: NavGraphNode;
    hoverSource?: "nav" | "dom3d";
    setHoveredNode: (node: NavGraphNode | undefined, source: "nav" | "dom3d") => void;
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
