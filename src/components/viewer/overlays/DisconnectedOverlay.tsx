import { useContext, useMemo } from "react";

//------------------------------------------------------------------------------
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";

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
    const { reconnect } = useContext(GhettoReconnectContext);

    //--------------------------------------------------------------------------
    // Memos
    const description = useMemo(() => {
        return getDescription(error);
    }, [error]);

    //--------------------------------------------------------------------------
    return (
        <div className="absolute z-100 inset-0 object-cover  backdrop-grayscale transition-[backdrop-filter] duration-500 flex items-center justify-center">
            <div className="p-12 bg-white border border-gray-400 rounded text-center">
                <p>{description}</p>
                <button
                    className="px-4 py-2 mt-6 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200"
                    onClick={reconnect}
                >
                    Reconnect
                </button>
            </div>
        </div>
    );
};
