import { useContext, useEffect, useState } from "react";
import type { Entity } from "@3dverse/livelink";
import {
    Canvas,
    Viewport,
    CameraController,
    useCameraEntity,
    LivelinkContext,
    DOM3DOverlay,
} from "@3dverse/livelink-react";

//------------------------------------------------------------------------------
import { ViewerController } from "@/components/viewer/ViewerController";
import { ViewerToolTips } from "@/components/viewer/ViewerToolTips";
import FactoryBuilder from "@/components/viewer/FactoryBuilder";

//------------------------------------------------------------------------------
import { CameraContext } from "@/contexts/CameraContext";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const Viewer = ({ thumbnailMode }: { thumbnailMode?: boolean }) => {
    //--------------------------------------------------------------------------
    // Contexts
    const { isConnecting } = useContext(LivelinkContext);
    const { connectionPOV, viewportRef, cameraControllerRef, setCameraEntity } = useContext(CameraContext);

    //--------------------------------------------------------------------------
    // State
    const [hoveredEntity, setHoveredEntity] = useState<{ entity: Entity } | null>(null);
    const [pickedEntity, setPickedEntity] = useState<{ entity: Entity } | null>(null);

    //--------------------------------------------------------------------------
    // Hooks
    const { cameraEntity } = useCameraEntity(connectionPOV.current);

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
            //instance.activity_watcher.setTimeouts({
            //     warn_after_seconds: 10,
            //     timeout_after_seconds: 15,
            // });
        }
    }, [instance]);

    //--------------------------------------------------------------------------
    return (
        <Canvas className="w-full h-full filter-[ brightness(1.2)]">
            <Viewport
                ref={viewportRef}
                cameraEntity={cameraEntity}
                className="w-full h-full"
                setHoveredEntity={setHoveredEntity}
                setPickedEntity={setPickedEntity}
            >
                {!isConnecting && (
                    <div className="absolute top-3 right-3 bg-green-500 text-xs text-white rounded-full py-1 px-3 pointer-events-none animate-[fade-out_.5s_2s_forwards]">
                        Connected
                    </div>
                )}
                <CameraController ref={cameraControllerRef} />
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
