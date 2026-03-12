import { CameraContext } from "@/contexts/CameraContext";
import { useContext, useEffect } from "react";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const InactiveOverlay = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { connectionPOV, cameraEntity } = useContext(CameraContext);

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
