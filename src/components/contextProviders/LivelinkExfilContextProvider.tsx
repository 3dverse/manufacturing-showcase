import { useMemo, useRef, useState } from "react";
import { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import type { Entity, Viewport } from "@3dverse/livelink";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const LivelinkExfilContextProvider = ({ children }: { children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // refs
    const cameraControllerRef = useRef<DefaultCameraController | null>(null);
    const viewportRef = useRef<Viewport | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    //--------------------------------------------------------------------------
    // State
    const [cameraEntity, setCameraEntity] = useState<Entity | null>(null);

    //--------------------------------------------------------------------------
    // Memos
    const value = useMemo(() => {
        return {
            cameraControllerRef,
            viewportRef,
            canvasRef,
            cameraEntity,
            setCameraEntity,
        };
    }, [cameraControllerRef, viewportRef, canvasRef, cameraEntity]);

    //--------------------------------------------------------------------------
    if (!value) return;
    return <LivelinkExfilContext.Provider value={value}>{children}</LivelinkExfilContext.Provider>;
};
