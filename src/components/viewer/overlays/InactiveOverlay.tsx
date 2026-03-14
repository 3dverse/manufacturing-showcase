import { useContext, useEffect } from "react";

//------------------------------------------------------------------------------
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const InactiveOverlay = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { cameraEntity } = useContext(LivelinkExfilContext);
    const { connectionPOV } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        if (!cameraEntity) return;
        connectionPOV.current.position = cameraEntity.local_transform.position || connectionPOV.current.position;
        connectionPOV.current.orientation =
            cameraEntity.local_transform.orientation || connectionPOV.current.orientation;
    }, [connectionPOV, cameraEntity]);

    //--------------------------------------------------------------------------
    // Render ᕕ( ᐛ )ᕗ
    return <></>;
};
