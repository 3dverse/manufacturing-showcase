import { createContext } from "react";

//------------------------------------------------------------------------------
import type { FactoryGraphNode, FactoryNode } from "@/content/type";
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
type FactoryContextType = {
    factory: Factory;
    nodeGraph: FactoryNode;
    nodeList: FactoryGraphNode[];
};

//------------------------------------------------------------------------------
export const FactoryContext = createContext(
    new Proxy({} as FactoryContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
