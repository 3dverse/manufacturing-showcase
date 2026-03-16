import { createContext } from "react";

//------------------------------------------------------------------------------
import type { Factory } from "@/content/type";

//------------------------------------------------------------------------------
type FactoriesContextType = {
    factories: Factory[];
};

//------------------------------------------------------------------------------
export const FactoriesContext = createContext(
    new Proxy({} as FactoriesContextType, {
        get() {
            throw new Error("FactoriesContext must be used within a FactoriesContextProvider");
        },
    }),
);
