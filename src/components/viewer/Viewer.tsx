//------------------------------------------------------------------------------
import { useCallback, useContext, useEffect, useState } from "react";
import type { Entity } from "@3dverse/livelink";
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
import { ViewerController } from "@/components/viewer/ViewerController";
import { ViewerToolTips } from "@/components/viewer/ViewerToolTips";
import FactoryBuilder from "@/components/viewer/FactoryBuilder";
import { AvatarOverlay } from "@/components/clients/AvatarOverlay";

//------------------------------------------------------------------------------
import { LivelinkExfilContext } from "@/contexts/LivelinkExfilContext";
import { GhettoReconnectContext } from "@/contexts/GhettoReconnectContext";
import { ON_DRAG_THRESHOLD_DISTANCE_IN_PX } from "@/hooks/useDragGuard";

//------------------------------------------------------------------------------
import { useAvatarsStore } from "@/store/useAvatarsStore";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const Viewer = ({ thumbnailMode }: { thumbnailMode?: boolean }) => {
    //--------------------------------------------------------------------------
    // Camera constraints
    const MIN_DOLLY_DISTANCE = 3;
    const MAX_DOLLY_DISTANCE = 50;

    //--------------------------------------------------------------------------
    // Contexts
    const { isConnecting } = useContext(LivelinkContext);
    const { connectionPOV } = useContext(GhettoReconnectContext);
    const { viewportRef, cameraControllerRef, setCameraEntity } = useContext(LivelinkExfilContext);

    //--------------------------------------------------------------------------
    // State
    const [hoveredEntity, setHoveredEntity] = useState<{ entity: Entity } | null>(null);
    const [pickedEntity, setPickedEntity] = useState<{ entity: Entity } | null>(null);

    //--------------------------------------------------------------------------
    // Hooks
    const { cameraEntity } = useCameraEntity(connectionPOV.current);

    //--------------------------------------------------------------------------
    // Store
    const { fullScreenWatchedAvatar, watchedAvatar } = useAvatarsStore();
    const isFullScreenClientWatched = watchedAvatar?.client && fullScreenWatchedAvatar;

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
    const viewportProps = isFullScreenClientWatched ? { client: watchedAvatar.client } : { cameraEntity };

    //--------------------------------------------------------------------------
    return (
        <Canvas className="w-full h-full">
            <Viewport
                ref={viewportRef}
                className="w-full h-full"
                setHoveredEntity={setHoveredEntity}
                setPickedEntity={setPickedEntity}
                {...viewportProps}
            >
                {!isConnecting && (
                    <div className="absolute top-3 right-1/2 -translate-x-1/2 bg-green-500 text-xs text-white rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]">
                        Connected
                    </div>
                )}
                <Exfil />
                <AvatarOverlay />
                {!isFullScreenClientWatched && <CameraController ref={bindCameraController} />}
                {!thumbnailMode && (
                    <>
                        {/* eslint-disable-next-line no-constant-binary-expression */}
                        {false && <ViewerController hoveredEntity={hoveredEntity} pickedEntity={pickedEntity} />}
                        <ViewerToolTips />
                        <DOM3DOverlay>
                            <FactoryBuilder />
                        </DOM3DOverlay>
                    </>
                )}
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
