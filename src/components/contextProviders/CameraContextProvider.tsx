import { useMemo, useRef, useState } from "react";
import { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import { CameraContext } from "@/contexts/CameraContext";
import type { Entity, Viewport } from "@3dverse/livelink";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const CameraContextProvider = ({ children }: { children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // refs
    const cameraControllerRef = useRef<DefaultCameraController | null>(null);
    const viewportRef = useRef<Viewport | null>(null);

    //--------------------------------------------------------------------------
    // State
    const [cameraEntity, setCameraEntity] = useState<Entity | null>(null);

    //--------------------------------------------------------------------------
    // Memos
    const value = useMemo(() => {
        return {
            cameraControllerRef,
            viewportRef,
            cameraEntity,
            setCameraEntity,
        };
    }, [cameraControllerRef, viewportRef, cameraEntity]);

    //--------------------------------------------------------------------------
    if (!value) return;
    return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
};
