import { useContext, useEffect, useMemo } from "react";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

//------------------------------------------------------------------------------
import { OverlayShroud } from "./_fragments/OverlayShroud";
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";

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
    const { canvasRef } = useContext(LivelinkExfilContext);
    const { reconnect, backdropUrl, setBackdropUrl } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    // Memos
    const description = useMemo(() => {
        return getDescription(error);
    }, [error]);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        setBackdropUrl(canvasRef.current?.toDataURL());
    }, [setBackdropUrl, canvasRef]);

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
