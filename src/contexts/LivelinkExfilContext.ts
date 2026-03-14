import { createContext } from "react";
import { DefaultCameraController } from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import type { RefObject } from "react";
import type { Entity, Viewport } from "@3dverse/livelink";

//------------------------------------------------------------------------------
type LivelinkExfilContextType = {
    cameraControllerRef: RefObject<DefaultCameraController | null>;
    viewportRef: RefObject<Viewport | null>;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    cameraEntity: Entity | null;
    setCameraEntity: (entity: Entity | null) => void;
};

//------------------------------------------------------------------------------
export const LivelinkExfilContext = createContext(
    new Proxy({} as LivelinkExfilContextType, {
        get() {
            throw new Error("LivelinkExfilContext must be used within a LivelinkExfilContextProvider");
        },
    }),
);
