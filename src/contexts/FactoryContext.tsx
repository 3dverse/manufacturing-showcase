import { createContext } from "react";

//------------------------------------------------------------------------------
import type { SceneGraphNode, FactoryNode } from "@/content/type";
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
type FactoryContextType = {
    factory: Factory;
    nodeGraph: FactoryNode;
    nodeList: SceneGraphNode[];
};

//------------------------------------------------------------------------------
export const FactoryContext = createContext(
    new Proxy({} as FactoryContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
