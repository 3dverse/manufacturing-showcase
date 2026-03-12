//------------------------------------------------------------------------------
import { createContext } from "react";

//------------------------------------------------------------------------------
type GhettoReconnectContextType = {
    reconnect: () => void;
    reconnector?: boolean;
};

//------------------------------------------------------------------------------
export const GhettoReconnectContext = createContext<GhettoReconnectContextType>(
    new Proxy({} as GhettoReconnectContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
