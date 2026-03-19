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
            <div className="relative flex flex-col items-center justify-center text-center max-w-md p-12">
                <span className="absolute bottom-0 left-0 scale-200 w-full h-full bg-white blur-3xl -z-10" />
                <p className="text-sm">{description}</p>
                <Button variant="primary" size="sm" className="mt-6" onClick={reconnect}>
                    Reconnect
                </Button>
            </div>
        </OverlayShroud>
    );
};
