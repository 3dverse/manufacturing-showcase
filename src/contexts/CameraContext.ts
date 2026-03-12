import { createContext } from "react";
import { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { RefObject } from "react";
import type { Entity, Quat, Vec3, Viewport } from "@3dverse/livelink";

type POV = {
    position: Vec3;
    orientation: Quat;
};

//------------------------------------------------------------------------------
type CameraContextType = {
    cameraControllerRef: RefObject<DefaultCameraController | null>;
    viewportRef: RefObject<Viewport | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    cameraEntity: Entity | null;
    setCameraEntity: (entity: Entity | null) => void;
    connectionPOV: RefObject<POV>;
};

//------------------------------------------------------------------------------
export const CameraContext = createContext(
    new Proxy({} as CameraContextType, {
        get() {
            throw new Error("CameraContext must be used within a CameraContextProvider");
        },
    }),
);
