//------------------------------------------------------------------------------
import { createContext } from "react";
import type { Entity } from "@3dverse/livelink";

//------------------------------------------------------------------------------
import type { SceneGraphNode } from "@/content/type";

//------------------------------------------------------------------------------
type HoverContextType = {
    hoveredNode?: SceneGraphNode;
    hoverSource?: "nav" | "dom3d";
    setHoveredNode: (node: SceneGraphNode | undefined, source: "nav" | "dom3d") => void;
    setHoveredNodeByEntity: (entity: Entity | undefined, source: "nav" | "dom3d") => void;
};

//------------------------------------------------------------------------------
export const HoverContext = createContext<HoverContextType>(
    new Proxy({} as HoverContextType, {
        get() {
            throw new Error("HoverContext must be used within a HoverContextProvider");
        },
    }),
);
