import { useMemo, useRef, useState } from "react";
import { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { ReactNode } from "react";
import { CameraContext } from "@/contexts/CameraContext";
import type { Entity, Quat, Vec3, Viewport } from "@3dverse/livelink";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const CameraContextProvider = ({ children }: { children: ReactNode }) => {
    //--------------------------------------------------------------------------
    // refs
    const cameraControllerRef = useRef<DefaultCameraController | null>(null);
    const viewportRef = useRef<Viewport | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    //--------------------------------------------------------------------------
    // State
    const [cameraEntity, setCameraEntity] = useState<Entity | null>(null);
    const connectionPOV = useRef<{ position: Vec3; orientation: Quat }>({
        position: [1000, 1000, -1000],
        orientation: [-0.70710678, 0, 0, 0.70710678],
    });

    //--------------------------------------------------------------------------
    // Memos
    const value = useMemo(() => {
        return {
            cameraControllerRef,
            viewportRef,
            canvasRef,
            cameraEntity,
            setCameraEntity,
            connectionPOV,
        };
    }, [cameraControllerRef, viewportRef, canvasRef, cameraEntity, connectionPOV]);

    //--------------------------------------------------------------------------
    if (!value) return;
    return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>;
};
