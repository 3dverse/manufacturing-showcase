//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useMemo } from "react";
import {
    Canvas,
    Viewport,
    CameraController,
    type DefaultCameraController,
    useCameraEntity,
    LivelinkContext,
    DOM3DOverlay,
    CanvasContext,
} from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { ViewerToolTips } from "@/components/viewer/ViewerToolTips";
import FactoryBuilder from "@/components/viewer/FactoryBuilder";
import { AvatarOverlay } from "@/components/clients/AvatarOverlay";

//------------------------------------------------------------------------------
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";
import { ON_DRAG_THRESHOLD_DISTANCE_IN_PX } from "@/hooks/useDragGuard";

//------------------------------------------------------------------------------
import { useAvatarsStore } from "@/store/useAvatarsStore";
import { SelectionContext } from "@/contexts/SelectionContext";
import { NodeDetailsOverlay } from "./NodeDetailsOverlay";
import { NodeChildrensOverlay } from "./NodeChildrenOverlay";
import { DebugOverlay } from "./overlays/DebugOverlay";
import { UserMode } from "@/core/UserMode";
import { LOCAL_STORAGE_KEYS, useLocalStorage } from "@/hooks/useLocalStorage";

//------------------------------------------------------------------------------
// Camera constraints
const MIN_DOLLY_DISTANCE = 3;
const MAX_DOLLY_DISTANCE = 85;

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const Viewer = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { isConnecting } = useContext(LivelinkContext);
    const { connectionPOV } = useContext(GhettoReconnectContext);
    const { viewportRef, cameraControllerRef, setCameraEntity } = useContext(LivelinkExfilContext);
    const { selectedNode } = useContext(SelectionContext);

    //--------------------------------------------------------------------------
    // Hooks
    const { cameraEntity } = useCameraEntity(connectionPOV.current);

    //--------------------------------------------------------------------------
    // Store
    const { fullScreenWatchedAvatar, watchedAvatar } = useAvatarsStore();
    const [storedScale] = useLocalStorage<number | undefined>(LOCAL_STORAGE_KEYS.VIEWER_SCALE, undefined);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        setCameraEntity(cameraEntity);
        if (cameraEntity) {
            cameraEntity.local_transform.position = connectionPOV.current.position;
            cameraEntity.local_transform.orientation = connectionPOV.current.orientation;
        }
    }, [setCameraEntity, cameraEntity, connectionPOV]);

    //--------------------------------------------------------------------------
    // Hack zone
    const { instance } = useContext(LivelinkContext);
    useEffect(() => {
        if (instance) {
            instance.startSimulation();
            //instance.activity_watcher.setTimeouts({
            //    warn_after_seconds: 10,
            //    timeout_after_seconds: 15,
            //});
        }
    }, [instance]);

    //--------------------------------------------------------------------------
    const bindCameraController = useCallback(
        (controller: DefaultCameraController | undefined) => {
            cameraControllerRef.current = controller ?? null;
            if (!controller) return;

            // Keep orbital camera on the upper hemisphere (avoid going under floor).
            controller.minPolarAngle = -Math.PI / 2;
            controller.maxPolarAngle = Math.PI / 2 - 0.01;

            // Clamp dolly range.
            controller.minDistance = MIN_DOLLY_DISTANCE;
            controller.maxDistance = MAX_DOLLY_DISTANCE;
            controller.infinityDolly = false;

            controller.lock_pointer = {
                aim: "on-drag",
                on_drag_threshold_in_pixels: ON_DRAG_THRESHOLD_DISTANCE_IN_PX,
            };
        },
        [cameraControllerRef],
    );

    //--------------------------------------------------------------------------
    // Memos
    const isFullScreenClientWatched = useMemo(() => {
        return watchedAvatar?.client && fullScreenWatchedAvatar;
    }, [watchedAvatar?.client, fullScreenWatchedAvatar]);

    //--------------------------------------------------------------------------
    const viewportProps = useMemo(() => {
        return watchedAvatar?.client && fullScreenWatchedAvatar ? { client: watchedAvatar.client } : { cameraEntity };
    }, [watchedAvatar?.client, fullScreenWatchedAvatar, cameraEntity]);

    //--------------------------------------------------------------------------
    return (
        <Canvas className="w-full h-full" scale={storedScale}>
            <Viewport ref={viewportRef} className="w-full h-full" {...viewportProps}>
                {!isConnecting && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-green text-xs text-slate-0 rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]">
                        Connected
                    </div>
                )}
                <Exfil />
                <AvatarOverlay />
                {!isFullScreenClientWatched && <CameraController ref={bindCameraController} />}
                <ViewerToolTips />
                <DOM3DOverlay>
                    <FactoryBuilder />
                    {selectedNode && <NodeDetailsOverlay node={selectedNode} />}
                    {selectedNode && <NodeChildrensOverlay node={selectedNode} />}
                    {UserMode.dev && <DebugOverlay />}
                </DOM3DOverlay>
            </Viewport>
            {/* Light overlay */}
            {/* <span className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-accent to-transparent mix-blend-multiply pointer-events-none opacity-80" /> */}
        </Canvas>
    );
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
const Exfil = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { canvas } = useContext(CanvasContext);
    const { canvasRef } = useContext(LivelinkExfilContext);

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        canvasRef.current = canvas;
    }, [canvasRef, canvas]);

    //--------------------------------------------------------------------------
    // Render
    return <></>;
};
