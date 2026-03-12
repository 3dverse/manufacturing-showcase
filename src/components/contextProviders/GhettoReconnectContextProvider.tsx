//------------------------------------------------------------------------------
import { useCallback, useMemo, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function GhettoReconnectContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // State
    const [reconnector, setReconnector] = useState<boolean>();

    //--------------------------------------------------------------------------
    // Handlers
    const reconnect = useCallback(() => {
        setReconnector(reconnector === undefined ? false : undefined);
    }, [reconnector]);

    //--------------------------------------------------------------------------
    const value = useMemo(
        () => ({
            reconnect,
            reconnector,
        }),
        [reconnect, reconnector],
    );

    return <GhettoReconnectContext.Provider value={value}>{children}</GhettoReconnectContext.Provider>;
}
