import { createContext } from "react";
import { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { RefObject } from "react";
import type { Entity, Viewport } from "@3dverse/livelink";

//------------------------------------------------------------------------------
type CameraContextType = {
    cameraControllerRef: RefObject<DefaultCameraController | null>;
    viewportRef: RefObject<Viewport | null>;
    cameraEntity: Entity | null;
    setCameraEntity: (entity: Entity | null) => void;
};

//------------------------------------------------------------------------------
export const CameraContext = createContext(
    new Proxy({} as CameraContextType, {
        get() {
            throw new Error("CameraContext must be used within a CameraContextProvider");
        },
    }),
);
