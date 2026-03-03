import { useContext, useEffect, useState, useRef } from "react";
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
import FactoryBuilder from "@/components/viewer/FactoryBuilder";
import Labels from "@/components/viewer/overlays/Labels";
import { DebugOverlay } from "@/components/viewer/overlays/DebugOverlay";

//------------------------------------------------------------------------------
import { CameraContext } from "@/contexts/CameraContext";
import { SelectionContext } from "@/contexts/SelectionContext";
import { FactoryContext } from "@/contexts/FactoryContext";

//------------------------------------------------------------------------------
import { getDefaultOrientationForNodeType, moveCamera } from "@/utils/camera-v2";

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
export const Viewer = () => {
    //--------------------------------------------------------------------------
    // Contexts
    const { isConnecting } = useContext(LivelinkContext);
    const { setSelectedNode } = useContext(SelectionContext);
    const { nodeGraph } = useContext(FactoryContext);
    const { viewportRef, setCameraEntity, cameraControllerRef } = useContext(CameraContext);

    //--------------------------------------------------------------------------
    // State
    const [hoveredEntity, setHoveredEntity] = useState<{ entity: Entity } | null>(null);
    const [pickedEntity, setPickedEntity] = useState<{ entity: Entity } | null>(null);

    //--------------------------------------------------------------------------
    // Refs
    const viewerInitialized = useRef<boolean>(false);

    //--------------------------------------------------------------------------
    // Hooks
    const { cameraEntity } = useCameraEntity({
        position: [1000, 1000, -1000],
        orientation: [-0.70710678, 0, 0, 0.70710678],
    });

    //--------------------------------------------------------------------------
    // Effects
    useEffect(() => {
        setCameraEntity(cameraEntity);
    }, [setCameraEntity, cameraEntity]);

    //--------------------------------------------------------------------------
    useEffect(() => {
        // Initialize the view
        function check() {
            if (
                !viewerInitialized.current &&
                nodeGraph &&
                cameraControllerRef.current &&
                viewportRef.current &&
                cameraEntity
            ) {
                viewerInitialized.current = true;
                setSelectedNode(nodeGraph);
                moveCamera(
                    nodeGraph.entity,
                    cameraControllerRef.current,
                    viewportRef.current,
                    cameraEntity,
                    getDefaultOrientationForNodeType(nodeGraph.type),
                );
            } else {
                setTimeout(check, 200);
            }
        }
        check();
    }, [setSelectedNode, viewerInitialized, nodeGraph, cameraControllerRef, viewportRef, cameraEntity]);

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
                {/* eslint-disable-next-line no-constant-binary-expression */}
                {false && <ViewerController hoveredEntity={hoveredEntity} pickedEntity={pickedEntity} />}
                <CameraController ref={cameraControllerRef} />
                <Labels cameraController={cameraControllerRef.current} />
                <DOM3DOverlay>
                    <FactoryBuilder />
                </DOM3DOverlay>

                {/* eslint-disable-next-line no-constant-binary-expression */}
                {false && <DebugOverlay />}
            </Viewport>
            {/* Light overlay */}
            {/* <span className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-accent to-transparent mix-blend-multiply pointer-events-none opacity-80" /> */}
        </Canvas>
    );
};
