//------------------------------------------------------------------------------
import { createContext, type RefObject } from "react";

//------------------------------------------------------------------------------
import type { Quat, Vec3 } from "@3dverse/livelink";

//------------------------------------------------------------------------------
type POV = {
    position: Vec3;
    orientation: Quat;
};

//------------------------------------------------------------------------------
type GhettoReconnectContextType = {
    reconnect: () => void;
    reconnector?: boolean;
    reconnecting?: boolean;
    backdropUrl?: string;
    setBackdropUrl: (backdropUrl: string | undefined) => void;
    connectionPOV: RefObject<POV>;
};

//------------------------------------------------------------------------------
export const GhettoReconnectContext = createContext<GhettoReconnectContextType>(
    new Proxy({} as GhettoReconnectContextType, {
        get() {
            throw new Error("FactoryContext must be used within a FactoryContextProvider");
        },
    }),
);
