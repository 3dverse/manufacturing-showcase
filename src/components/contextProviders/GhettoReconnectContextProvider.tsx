//------------------------------------------------------------------------------
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
import type { Quat, Vec3 } from "@3dverse/livelink";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export function GhettoReconnectContextProvider({ children }: { children: ReactNode }) {
    //--------------------------------------------------------------------------
    // State
    const [reconnector, setReconnector] = useState<boolean>();
    const [reconnecting, setReconnecting] = useState<boolean>(false);
    const [backdropUrl, setBackdropUrl] = useState<string>();

    //--------------------------------------------------------------------------
    // Refs
    const connectionPOV = useRef<{ position: Vec3; orientation: Quat }>({
        position: [1000, 1000, -1000],
        orientation: [-0.70710678, 0, 0, 0.70710678],
    });

    //--------------------------------------------------------------------------
    // Handlers
    const reconnect = useCallback(() => {
        setReconnecting(true);
        setReconnector(reconnector === undefined ? false : undefined);
    }, [reconnector]);

    //--------------------------------------------------------------------------
    const value = useMemo(
        () => ({
            reconnect,
            reconnector,
            reconnecting,
            backdropUrl,
            setBackdropUrl,
            connectionPOV,
        }),
        [reconnect, reconnector, reconnecting, backdropUrl, setBackdropUrl, connectionPOV],
    );

    return <GhettoReconnectContext.Provider value={value}>{children}</GhettoReconnectContext.Provider>;
}
