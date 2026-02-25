import { createContext } from "react";

//------------------------------------------------------------------------------
import type { FactoryGraph } from "@/content/type";

//------------------------------------------------------------------------------
export const FactoryContext = createContext(
    new Proxy({} as FactoryGraph, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
