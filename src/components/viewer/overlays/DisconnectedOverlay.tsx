import { useContext, useEffect, useMemo } from "react";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
import { OverlayShroud } from "./_fragments/OverlayShroud";
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import type { Quat, Vec3 } from "@3dverse/livelink";

//------------------------------------------------------------------------------
const INACTIVITY = "inactivity";
const FORCIBLY_CLOSED = "forcibly_closed";
const CLOSED = "closed";

const defaultDescription = "Something went wrong. You have been disconnected from the 3D session.";

//------------------------------------------------------------------------------
const getDescription = (error: string) => {
    if (error === CLOSED) {
        return defaultDescription;
    }
    if (error === FORCIBLY_CLOSED) {
        return defaultDescription;
    }
    if (error === INACTIVITY) {
        return "You have been inactive for too long.";
    }
    return defaultDescription;
};

//------------------------------------------------------------------------------
export const DisconnectedOverlay = ({ error }: { error: string }) => {
    //--------------------------------------------------------------------------
    const { canvasRef, cameraControllerRef } = useContext(LivelinkExfilContext);
    const { reconnect, backdropUrl, setBackdropUrl, connectionPOV } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    // Memos
    const description = useMemo(() => {
        return getDescription(error);
    }, [error]);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        connectionPOV.current = {
            position: cameraControllerRef.current
                ? ([
                      cameraControllerRef.current.position.x,
                      cameraControllerRef.current.position.y,
                      cameraControllerRef.current?.position.z,
                  ] as Vec3)
                : connectionPOV.current.position,
            orientation: cameraControllerRef.current
                ? ([
                      cameraControllerRef.current.orientation._w,
                      cameraControllerRef.current.orientation._x,
                      cameraControllerRef.current.orientation._y,
                      cameraControllerRef.current.orientation._z,
                  ] as Quat)
                : connectionPOV.current.orientation,
        };
        setBackdropUrl(canvasRef.current?.toDataURL());
    }, [setBackdropUrl, canvasRef, cameraControllerRef, connectionPOV]);

    //--------------------------------------------------------------------------
    return (
        <OverlayShroud backdropUrl={backdropUrl} transition={true}>
            <div className="p-12 bg-white border border-gray-400 rounded text-center">
                <p>{description}</p>
                <button
                    className="px-4 py-2 mt-6 bg-accent-600 text-white rounded-md hover:bg-accent-700 active:bg-accent-800 transition-colors duration-200"
                    onClick={reconnect}
                >
                    Reconnect
                </button>
            </div>
        </OverlayShroud>
    );
};
